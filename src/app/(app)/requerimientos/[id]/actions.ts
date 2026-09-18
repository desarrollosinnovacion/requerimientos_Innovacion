"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ESTADOS, PRIORIDADES } from "@/lib/formulario";
import { requerirUsuario } from "@/lib/auth";

export type EstadoPanel = { error?: string; ok?: boolean };

export async function actualizarGestion(_prev: EstadoPanel, fd: FormData): Promise<EstadoPanel> {
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") return { error: "No tienes permisos para esta acción." };

  const id = String(fd.get("id") ?? "");
  const estado = String(fd.get("estado") ?? "");
  const prioridad = String(fd.get("prioridad_final") ?? "");
  const fecha = String(fd.get("fecha_estimada_entrega") ?? "");
  const notas = String(fd.get("notas_innovacion") ?? "").trim();
  const asignados = [...new Set(fd.getAll("asignados").map(String).filter(Boolean))];

  if (!id) return { error: "Requerimiento no válido." };
  if (!(estado in ESTADOS)) return { error: "Estado no válido." };
  if (prioridad && !(PRIORIDADES as readonly string[]).includes(prioridad)) return { error: "Prioridad no válida." };
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Fecha no válida." };
  if (asignados.some((a) => !/^[0-9a-f-]{36}$/i.test(a))) return { error: "Equipo asignado no válido." };

  const { error } = await supabase
    .from("requerimientos")
    .update({
      estado,
      prioridad_final: prioridad || null,
      fecha_estimada_entrega: fecha || null,
      notas_innovacion: notas || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar requerimiento", error);
    return { error: "No fue posible guardar los cambios." };
  }

  // Equipo asignado: se reemplaza el conjunto completo.
  const { error: errBorrar } = await supabase.from("requerimiento_asignados").delete().eq("requerimiento_id", id);
  if (errBorrar) {
    console.error("Error al limpiar equipo asignado", errBorrar);
    return { error: "Se guardaron los datos, pero no fue posible actualizar el equipo asignado." };
  }
  if (asignados.length > 0) {
    const { error: errInsertar } = await supabase
      .from("requerimiento_asignados")
      .insert(asignados.map((perfil_id) => ({ requerimiento_id: id, perfil_id })));
    if (errInsertar) {
      console.error("Error al asignar equipo", errInsertar);
      return { error: "Se guardaron los datos, pero no fue posible actualizar el equipo asignado." };
    }
  }

  revalidatePath(`/requerimientos/${id}`);
  revalidatePath("/requerimientos");
  return { ok: true };
}

export type ResultadoEliminar = { error: string };

/**
 * Elimina un requerimiento de forma definitiva (solo Innovación; la RLS lo exige también).
 * Si tiene éxito redirige a la lista con el folio eliminado.
 */
export async function eliminarRequerimiento(id: string): Promise<ResultadoEliminar | undefined> {
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") return { error: "Solo el equipo de Innovación puede eliminar requerimientos." };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Requerimiento no válido." };

  const { data, error } = await supabase.from("requerimientos").delete().eq("id", id).select("folio").maybeSingle<{ folio: string }>();
  if (error) {
    console.error("Error al eliminar requerimiento", error);
    return { error: "No fue posible eliminar el requerimiento." };
  }
  if (!data) {
    // RLS sin política de borrado o registro inexistente: no se borró nada.
    return { error: "No se eliminó nada. Verifica que la migración 0007 esté aplicada." };
  }

  revalidatePath("/requerimientos");
  revalidatePath("/proyectos");
  revalidatePath("/");
  redirect(`/requerimientos?eliminado=${encodeURIComponent(data.folio)}`);
}
