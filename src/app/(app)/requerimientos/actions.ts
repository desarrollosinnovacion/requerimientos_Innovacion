"use server";

import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { ES_UUID, reemplazarAsignados } from "@/lib/asignaciones";
import { PRIORIDADES } from "@/lib/formulario";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

/** Cambia el equipo asignado de un requerimiento desde la lista. Solo Innovación (la RLS también lo exige). */
export async function asignarEquipo(id: string, asignados: string[]): Promise<ResultadoAccion> {
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") return { ok: false, error: "Solo el equipo de Innovación puede asignar." };
  if (!ES_UUID.test(id)) return { ok: false, error: "Requerimiento no válido." };

  const error = await reemplazarAsignados(supabase, id, asignados);
  if (error) return { ok: false, error };

  revalidatePath("/requerimientos");
  revalidatePath(`/requerimientos/${id}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
  return { ok: true };
}

/** Cambia la prioridad final desde la lista; cadena vacía la deja sin definir. Solo Innovación. */
export async function cambiarPrioridad(id: string, prioridad: string): Promise<ResultadoAccion> {
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") return { ok: false, error: "Solo el equipo de Innovación puede cambiar la prioridad." };
  if (!ES_UUID.test(id)) return { ok: false, error: "Requerimiento no válido." };
  if (prioridad && !(PRIORIDADES as readonly string[]).includes(prioridad)) return { ok: false, error: "Prioridad no válida." };

  const { error } = await supabase.from("requerimientos").update({ prioridad_final: prioridad || null }).eq("id", id);
  if (error) {
    console.error("Error al cambiar prioridad", error);
    return { ok: false, error: "No fue posible cambiar la prioridad." };
  }

  revalidatePath("/requerimientos");
  revalidatePath(`/requerimientos/${id}`);
  revalidatePath("/proyectos");
  revalidatePath("/");
  return { ok: true };
}
