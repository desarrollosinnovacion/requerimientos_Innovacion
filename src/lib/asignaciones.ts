import type { createClient } from "@/lib/supabase/server";

type Cliente = Awaited<ReturnType<typeof createClient>>;

export const ES_UUID = /^[0-9a-f-]{36}$/i;

/**
 * Reemplaza el conjunto completo de miembros de Innovación asignados a un requerimiento.
 * La RLS exige rol innovacion y que cada perfil sea miembro activo del equipo.
 * Devuelve un mensaje de error para el usuario, o null si todo salió bien.
 */
export async function reemplazarAsignados(supabase: Cliente, requerimientoId: string, asignados: string[]): Promise<string | null> {
  const unicos = [...new Set(asignados)];
  if (unicos.some((a) => !ES_UUID.test(a))) return "Equipo asignado no válido.";

  const { error: errBorrar } = await supabase.from("requerimiento_asignados").delete().eq("requerimiento_id", requerimientoId);
  if (errBorrar) {
    console.error("Error al limpiar equipo asignado", errBorrar);
    return "No fue posible actualizar el equipo asignado.";
  }
  if (unicos.length > 0) {
    const { error: errInsertar } = await supabase
      .from("requerimiento_asignados")
      .insert(unicos.map((perfil_id) => ({ requerimiento_id: requerimientoId, perfil_id })));
    if (errInsertar) {
      console.error("Error al asignar equipo", errInsertar);
      return "No fue posible actualizar el equipo asignado.";
    }
  }
  return null;
}
