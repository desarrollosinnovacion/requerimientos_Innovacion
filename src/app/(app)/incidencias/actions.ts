"use server";

import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { ES_UUID } from "@/lib/asignaciones";
import { PRIORIDADES } from "@/lib/formulario";
import { esEstadoIncidencia } from "@/lib/incidencias";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };
export type EstadoFormIncidencia = { ok?: true; folio?: string; error?: string; errores?: Record<string, string> };

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();
const esPrioridad = (v: string) => (PRIORIDADES as readonly string[]).includes(v);

/** Registra una incidencia nueva. Cualquier usuario puede; solo Innovación puede fijar el responsable. */
export async function crearIncidencia(_prev: EstadoFormIncidencia, fd: FormData): Promise<EstadoFormIncidencia> {
  const { supabase, user, perfil } = await requerirUsuario();
  const esInnovacion = perfil.rol === "innovacion";

  const titulo = texto(fd, "titulo");
  const descripcion = texto(fd, "descripcion");
  const empresaId = texto(fd, "empresa_id");
  const reportadoPor = texto(fd, "reportado_por");
  const prioridad = texto(fd, "prioridad");
  const asignadoId = texto(fd, "asignado_id");

  const errores: Record<string, string> = {};
  if (!titulo) errores.titulo = "Escribe un título breve.";
  if (titulo.length > 200) errores.titulo = "Máximo 200 caracteres.";
  if (empresaId && !ES_UUID.test(empresaId)) errores.empresa_id = "Unidad de negocio no válida.";
  if (prioridad && !esPrioridad(prioridad)) errores.prioridad = "Prioridad no válida.";
  if (asignadoId && (!esInnovacion || !ES_UUID.test(asignadoId))) errores.asignado_id = "Responsable no válido.";
  if (Object.keys(errores).length > 0) return { errores, error: "Revisa los campos marcados." };

  const { data, error } = await supabase
    .from("incidencias")
    .insert({
      titulo,
      descripcion: descripcion || null,
      empresa_id: empresaId || null,
      reportado_por: reportadoPor || null,
      prioridad: prioridad || null,
      asignado_id: esInnovacion && asignadoId ? asignadoId : null,
      creado_por: user.id,
    })
    .select("folio")
    .single<{ folio: string }>();

  if (error || !data) {
    console.error("Error al crear incidencia", error);
    return { error: "No fue posible registrar la incidencia. Intenta de nuevo." };
  }

  revalidatePath("/incidencias");
  return { ok: true, folio: data.folio };
}

async function actualizar(id: string, cambios: Record<string, string | null>, mensaje: string): Promise<ResultadoAccion> {
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") return { ok: false, error: "Solo el equipo de Innovación puede hacer este cambio." };
  if (!ES_UUID.test(id)) return { ok: false, error: "Incidencia no válida." };

  const { error } = await supabase.from("incidencias").update(cambios).eq("id", id);
  if (error) {
    console.error(mensaje, error);
    return { ok: false, error: `${mensaje}.` };
  }
  revalidatePath("/incidencias");
  revalidatePath(`/incidencias/${id}`);
  return { ok: true };
}

export async function cambiarEstadoIncidencia(id: string, estado: string): Promise<ResultadoAccion> {
  if (!esEstadoIncidencia(estado)) return { ok: false, error: "Estado no válido." };
  return actualizar(id, { estado }, "No fue posible cambiar el estado");
}

/** Cadena vacía deja la prioridad sin definir. */
export async function cambiarPrioridadIncidencia(id: string, prioridad: string): Promise<ResultadoAccion> {
  if (prioridad && !esPrioridad(prioridad)) return { ok: false, error: "Prioridad no válida." };
  return actualizar(id, { prioridad: prioridad || null }, "No fue posible cambiar la prioridad");
}

/** Cadena vacía deja la incidencia sin responsable. */
export async function asignarIncidencia(id: string, asignadoId: string): Promise<ResultadoAccion> {
  if (asignadoId && !ES_UUID.test(asignadoId)) return { ok: false, error: "Responsable no válido." };
  return actualizar(id, { asignado_id: asignadoId || null }, "No fue posible cambiar el responsable");
}
