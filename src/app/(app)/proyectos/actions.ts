"use server";

import { revalidatePath } from "next/cache";
import { ESTADOS, type Estado } from "@/lib/formulario";
import { requerirUsuario } from "@/lib/auth";

export type ResultadoEstado = { ok: true } | { ok: false; error: string };

/** Mueve un requerimiento a otra fase del tablero. Solo Innovación (la RLS también lo exige). */
export async function cambiarEstado(id: string, estado: Estado): Promise<ResultadoEstado> {
  const { supabase, perfil } = await requerirUsuario();
  if (perfil.rol !== "innovacion") return { ok: false, error: "Solo el equipo de Innovación puede mover proyectos." };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Requerimiento no válido." };
  if (!(estado in ESTADOS)) return { ok: false, error: "Estado no válido." };

  const { error } = await supabase.from("requerimientos").update({ estado }).eq("id", id);
  if (error) {
    console.error("Error al cambiar estado", error);
    return { ok: false, error: "No fue posible mover el proyecto. Intenta de nuevo." };
  }

  revalidatePath("/proyectos");
  revalidatePath("/");
  revalidatePath("/requerimientos");
  revalidatePath(`/requerimientos/${id}`);
  return { ok: true };
}
