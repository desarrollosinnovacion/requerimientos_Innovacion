import type { Perfil } from "@/lib/tipos";

/**
 * Quién puede editar un requerimiento: Innovación siempre; el solicitante,
 * solo los suyos y mientras el proyecto no haya iniciado (misma regla que la RLS).
 */
export function puedeEditarRequerimiento(
  perfil: Pick<Perfil, "id" | "rol">,
  req: { solicitante_id: string | null; estado: string },
) {
  if (perfil.rol === "innovacion") return true;
  return req.solicitante_id === perfil.id && req.estado === "no_iniciado";
}
