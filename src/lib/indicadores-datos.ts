import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Columna, Hoja, Item, Periodo, Seccion, Valor } from "@/lib/indicadores";

type SeccionCruda = Omit<Seccion, "columnas" | "items"> & { columnas: Columna[] | null; items: Item[] | null };

const ordenar = <T extends { orden: number }>(xs: T[]) => [...xs].sort((a, b) => a.orden - b.orden);

/** Hoja completa de un período (secciones con columnas e items, más todos los valores). */
export async function cargarHoja(supabase: SupabaseClient, periodoId: string): Promise<Hoja | null> {
  const [{ data: periodo }, { data: secciones }] = await Promise.all([
    supabase.from("fdc_periodos").select("*").eq("id", periodoId).maybeSingle<Periodo>(),
    supabase
      .from("fdc_secciones")
      .select("*, columnas:fdc_columnas(*), items:fdc_items(*)")
      .eq("periodo_id", periodoId)
      .returns<SeccionCruda[]>(),
  ]);
  if (!periodo) return null;

  const itemIds = (secciones ?? []).flatMap((s) => (s.items ?? []).map((i) => i.id));
  const { data: valores } = itemIds.length
    ? await supabase.from("fdc_valores").select("*").in("item_id", itemIds).returns<Valor[]>()
    : { data: [] as Valor[] };

  return {
    ...periodo,
    secciones: ordenar(secciones ?? []).map((s) => ({
      ...s,
      columnas: ordenar(s.columnas ?? []),
      items: ordenar(s.items ?? []),
    })),
    valores: valores ?? [],
  };
}

/** Todos los períodos con su hoja, del más reciente al más antiguo (la lista muestra el avance de cada uno). */
export async function cargarHojas(supabase: SupabaseClient): Promise<Hoja[]> {
  const { data: periodos } = await supabase.from("fdc_periodos").select("*").order("orden", { ascending: false }).returns<Periodo[]>();
  if (!periodos?.length) return [];
  const hojas = await Promise.all(periodos.map((p) => cargarHoja(supabase, p.id)));
  return hojas.filter((h): h is Hoja => h !== null);
}
