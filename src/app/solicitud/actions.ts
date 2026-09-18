"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { guardarRequerimiento } from "@/lib/requerimientos";
import type { ResultadoEnvio } from "@/lib/formulario";

/**
 * Envío desde el enlace público (sin sesión). Usa el cliente admin porque las
 * políticas RLS exigen un usuario autenticado; el requerimiento queda sin
 * solicitante_id y el contacto es el nombre/correo que escribió la persona.
 */
export async function crearRequerimientoPublico(fd: FormData): Promise<ResultadoEnvio> {
  // Campo trampa para bots: los humanos no lo ven ni lo llenan.
  if (typeof fd.get("sitio_web") === "string" && (fd.get("sitio_web") as string).trim() !== "") {
    return { ok: true, destino: "/solicitud/enviado" };
  }

  const res = await guardarRequerimiento(createAdminClient(), fd, null);
  if (!res.ok) return res;
  return { ok: true, destino: `/solicitud/enviado?folio=${encodeURIComponent(res.folio)}` };
}
