"use server";

import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";

export type Nivel = "empresas" | "departamentos" | "areas";
export type EstadoCatalogo = { error?: string; ok?: boolean };

const PADRE: Record<Nivel, string | null> = {
  empresas: null,
  departamentos: "empresa_id",
  areas: "departamento_id",
};

const ETIQUETA: Record<Nivel, string> = {
  empresas: "empresa",
  departamentos: "departamento",
  areas: "área",
};

async function supabaseInnovacion() {
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") throw new Error("Sin permisos");
  return supabase;
}

function esNivel(v: unknown): v is Nivel {
  return v === "empresas" || v === "departamentos" || v === "areas";
}

function mensajeError(nivel: Nivel, code: string | undefined): string {
  if (code === "23505") return `Ya existe un(a) ${ETIQUETA[nivel]} con ese nombre.`;
  if (code === "23503") return `No se puede eliminar: hay requerimientos que usan este(a) ${ETIQUETA[nivel]}. Desactívalo en su lugar.`;
  return "No fue posible guardar el cambio.";
}

export async function crearElemento(_prev: EstadoCatalogo, fd: FormData): Promise<EstadoCatalogo> {
  const nivel = fd.get("nivel");
  const nombre = String(fd.get("nombre") ?? "").trim();
  const padreId = String(fd.get("padre_id") ?? "").trim();
  if (!esNivel(nivel)) return { error: "Nivel no válido." };
  if (!nombre) return { error: "Escribe un nombre." };
  if (PADRE[nivel] && !padreId) return { error: "Falta el elemento padre." };

  const supabase = await supabaseInnovacion();
  const fila: Record<string, string> = { nombre };
  if (PADRE[nivel]) fila[PADRE[nivel]!] = padreId;

  const { error } = await supabase.from(nivel).insert(fila);
  if (error) return { error: mensajeError(nivel, error.code) };
  revalidatePath("/configuracion", "layout");
  return { ok: true };
}

export async function renombrarElemento(_prev: EstadoCatalogo, fd: FormData): Promise<EstadoCatalogo> {
  const nivel = fd.get("nivel");
  const id = String(fd.get("id") ?? "");
  const nombre = String(fd.get("nombre") ?? "").trim();
  if (!esNivel(nivel) || !id) return { error: "Elemento no válido." };
  if (!nombre) return { error: "Escribe un nombre." };

  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from(nivel).update({ nombre }).eq("id", id);
  if (error) return { error: mensajeError(nivel, error.code) };
  revalidatePath("/configuracion", "layout");
  return { ok: true };
}

export async function alternarActivo(fd: FormData): Promise<void> {
  const nivel = fd.get("nivel");
  const id = String(fd.get("id") ?? "");
  const activo = fd.get("activo") === "true";
  if (!esNivel(nivel) || !id) return;

  const supabase = await supabaseInnovacion();
  await supabase.from(nivel).update({ activo }).eq("id", id);
  revalidatePath("/configuracion", "layout");
}

export async function eliminarElemento(_prev: EstadoCatalogo, fd: FormData): Promise<EstadoCatalogo> {
  const nivel = fd.get("nivel");
  const id = String(fd.get("id") ?? "");
  if (!esNivel(nivel) || !id) return { error: "Elemento no válido." };

  const supabase = await supabaseInnovacion();
  const { error } = await supabase.from(nivel).delete().eq("id", id);
  if (error) return { error: mensajeError(nivel, error.code) };
  revalidatePath("/configuracion", "layout");
  return { ok: true };
}
