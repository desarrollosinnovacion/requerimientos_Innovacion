"use server";

import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { actualizarRequerimiento } from "@/lib/requerimientos";
import { puedeEditarRequerimiento } from "@/lib/permisos";
import type { ResultadoEnvio } from "@/lib/formulario";

/** Guarda los cambios del formulario de edición. El `id` viene ligado desde la página. */
export async function editarRequerimiento(id: string, fd: FormData): Promise<ResultadoEnvio> {
  const { supabase, perfil } = await requerirUsuario();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, errores: {}, mensaje: "Requerimiento no válido." };

  const { data: actual } = await supabase
    .from("requerimientos")
    .select("solicitante_id, estado")
    .eq("id", id)
    .maybeSingle<{ solicitante_id: string | null; estado: string }>();
  if (!actual || !puedeEditarRequerimiento(perfil, actual)) {
    return { ok: false, errores: {}, mensaje: "No tienes permiso para editar este requerimiento." };
  }

  const res = await actualizarRequerimiento(supabase, id, fd);
  if (!res.ok) return res;

  revalidatePath(`/requerimientos/${id}`);
  revalidatePath("/requerimientos");
  revalidatePath("/proyectos");
  revalidatePath("/");
  return { ok: true, destino: `/requerimientos/${id}?editado=1` };
}
