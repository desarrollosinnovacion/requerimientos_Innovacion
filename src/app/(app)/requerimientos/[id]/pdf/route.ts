import { requerirUsuario } from "@/lib/auth";
import { generarPdfRequerimiento } from "@/lib/pdf-requerimiento";
import type { MiembroEquipo, Requerimiento } from "@/lib/tipos";

/**
 * Descarga el requerimiento completo como PDF. La RLS decide qué puede ver
 * cada usuario: si la consulta no devuelve fila, se responde 404.
 */
export async function GET(_req: Request, ctx: RouteContext<"/requerimientos/[id]/pdf">) {
  const { id } = await ctx.params;
  const { supabase } = await requerirUsuario();

  const [{ data: req }, { data: asignadosData }] = await Promise.all([
    supabase.from("requerimientos").select("*").eq("id", id).maybeSingle<Requerimiento>(),
    supabase.from("requerimiento_asignados").select("perfil:perfiles(id, nombre)").eq("requerimiento_id", id),
  ]);
  if (!req) return new Response("Requerimiento no encontrado", { status: 404 });

  const asignados = (asignadosData ?? [])
    .map((a) => a.perfil as unknown as MiembroEquipo | null)
    .filter((p): p is MiembroEquipo => p !== null);

  const pdf = await generarPdfRequerimiento(req, asignados);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${req.folio}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
