import type { SupabaseClient } from "@supabase/supabase-js";

export type Area = { id: string; departamento_id: string; nombre: string; activo: boolean; orden: number };
export type Departamento = { id: string; empresa_id: string; nombre: string; activo: boolean; orden: number; areas: Area[] };
export type Empresa = { id: string; nombre: string; activo: boolean; orden: number; departamentos: Departamento[] };

/**
 * Carga los catálogos como árbol empresa -> departamentos -> áreas.
 * Con `soloActivos` (formulario) se omiten los elementos desactivados.
 */
export async function cargarCatalogos(supabase: SupabaseClient, soloActivos: boolean): Promise<Empresa[]> {
  const [e, d, a] = await Promise.all([
    supabase.from("empresas").select("id, nombre, activo, orden").order("orden").order("nombre"),
    supabase.from("departamentos").select("id, empresa_id, nombre, activo, orden").order("orden").order("nombre"),
    supabase.from("areas").select("id, departamento_id, nombre, activo, orden").order("orden").order("nombre"),
  ]);

  const filtrar = <T extends { activo: boolean }>(xs: T[] | null) =>
    (xs ?? []).filter((x) => !soloActivos || x.activo);

  const areas = filtrar(a.data as Area[] | null);
  const departamentos = filtrar(d.data as Omit<Departamento, "areas">[] | null).map((dep) => ({
    ...dep,
    areas: areas.filter((ar) => ar.departamento_id === dep.id),
  }));
  return filtrar(e.data as Omit<Empresa, "departamentos">[] | null).map((emp) => ({
    ...emp,
    departamentos: departamentos.filter((dep) => dep.empresa_id === emp.id),
  }));
}
