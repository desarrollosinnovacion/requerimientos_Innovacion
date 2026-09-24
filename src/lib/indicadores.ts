/**
 * Indicadores FDC: tipos y cálculos compartidos entre la lista de períodos, la
 * hoja de captura y las acciones. Réplica del Excel "Indicadores FDC": un período
 * por hoja, secciones con columnas propias, y por fila meta / progreso / % alcance.
 */

export type TipoSeccion = "conteo" | "check";

export const TIPOS_SECCION: Record<TipoSeccion, string> = {
  conteo: "Cantidades (el progreso suma la fila)",
  check: "Marcas (el progreso cuenta las casillas marcadas)",
};

export type Periodo = {
  id: string;
  nombre: string;
  titulo: string;
  orden: number;
  creado_en: string;
  actualizado_en: string;
};

export type Columna = { id: string; seccion_id: string; nombre: string; orden: number };
export type Item = { id: string; seccion_id: string; nombre: string; meta: number | null; notas: string | null; orden: number };
export type Valor = { item_id: string; columna_id: string; valor: number };

export type Seccion = {
  id: string;
  periodo_id: string;
  nombre: string;
  tipo: TipoSeccion;
  orden: number;
  columnas: Columna[];
  items: Item[];
};

/** Hoja completa de un período, lista para pintar. */
export type Hoja = Periodo & { secciones: Seccion[]; valores: Valor[] };

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

/** Orden AAAAMM de un período que empieza en `mes` (1-12) de `anio`. */
export function ordenPeriodo(anio: number, mes: number) {
  return anio * 100 + mes;
}

/** Nombre al estilo del Excel: "Octubre-Noviembre 2026" (el año es el del mes final). */
export function nombrePeriodo(anio: number, mes: number) {
  const siguiente = mes === 12 ? 1 : mes + 1;
  const anioFinal = mes === 12 ? anio + 1 : anio;
  return `${MESES[mes - 1]}-${MESES[siguiente - 1]} ${anioFinal}`;
}

/** Mes siguiente a un orden AAAAMM. */
export function siguienteMes(orden: number): { anio: number; mes: number } {
  const anio = Math.floor(orden / 100);
  const mes = orden % 100;
  return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
}

/** Progreso de una fila: suma (conteo) o casillas marcadas (check). */
export function progresoItem(item: Item, seccion: Seccion, valores: Valor[]) {
  const ids = new Set(seccion.columnas.map((c) => c.id));
  const propios = valores.filter((v) => v.item_id === item.id && ids.has(v.columna_id));
  return seccion.tipo === "conteo"
    ? propios.reduce((s, v) => s + v.valor, 0)
    : propios.filter((v) => v.valor !== 0).length;
}

/** % de alcance como en el Excel: progreso/meta, topado en 1; null sin meta. */
export function alcance(progreso: number, meta: number | null): number | null {
  if (meta === null || meta <= 0) return null;
  return Math.min(1, progreso / meta);
}

/** Alcance promedio de una hoja (solo filas con meta), para la lista de períodos. */
export function alcanceHoja(hoja: Hoja): { promedio: number | null; filas: number; conMeta: number } {
  const alcances: number[] = [];
  let filas = 0;
  for (const s of hoja.secciones) {
    for (const it of s.items) {
      filas += 1;
      const a = alcance(progresoItem(it, s, hoja.valores), it.meta);
      if (a !== null) alcances.push(a);
    }
  }
  return {
    promedio: alcances.length === 0 ? null : alcances.reduce((x, y) => x + y, 0) / alcances.length,
    filas,
    conMeta: alcances.length,
  };
}

export function formatearPorcentaje(v: number | null) {
  return v === null ? "—" : `${Math.round(v * 100)} %`;
}

/** Clases de color del % de alcance: verde al cumplir, beige a medio camino, cobre si va bajo. */
export function claseAlcance(a: number | null) {
  if (a === null) return "bg-slate-100 text-slate-500";
  if (a >= 1) return "bg-brand-600 text-slate-100";
  if (a >= 0.5) return "bg-beige-100 text-slate-900";
  return "bg-cobre-100 text-cobre-800";
}
