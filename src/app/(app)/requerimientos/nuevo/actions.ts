"use server";

import { requerirUsuario } from "@/lib/auth";
import { guardarRequerimiento } from "@/lib/requerimientos";
import type { ResultadoEnvio } from "@/lib/formulario";

export async function crearRequerimiento(fd: FormData): Promise<ResultadoEnvio> {
  const { supabase, user } = await requerirUsuario();
  const res = await guardarRequerimiento(supabase, fd, user.id);
  if (!res.ok) return res;
  return { ok: true, destino: `/requerimientos/${res.id}?creado=1` };
}
