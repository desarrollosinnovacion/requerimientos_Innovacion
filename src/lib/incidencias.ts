import type { MiembroEquipo } from "@/lib/tipos";

/** Estados de una incidencia, en el orden en que se muestran. */
export const ESTADOS_INCIDENCIA = {
  abierta: "Abierta",
  en_proceso: "En proceso",
  resuelta: "Resuelta",
} as const;

export type EstadoIncidencia = keyof typeof ESTADOS_INCIDENCIA;

export function esEstadoIncidencia(v: unknown): v is EstadoIncidencia {
  return typeof v === "string" && v in ESTADOS_INCIDENCIA;
}

// Misma lógica de color que los requerimientos: Cobre para lo que pide atención,
// rampa de Verde para lo que avanza y Verde sólido para lo cerrado.
export const CLASES_ESTADO_INCIDENCIA: Record<EstadoIncidencia, string> = {
  abierta: "bg-cobre-100 text-cobre-800",
  en_proceso: "bg-brand-100 text-brand-800",
  resuelta: "bg-brand-600 text-slate-100",
};

/** Colores para gráficas, en paralelo a CLASES_ESTADO_INCIDENCIA. */
export const COLOR_ESTADO_INCIDENCIA: Record<EstadoIncidencia, string> = {
  abierta: "#A7663A",
  en_proceso: "#86b09d",
  resuelta: "#175641",
};

export type Incidencia = {
  id: string;
  folio: string;
  titulo: string;
  descripcion: string | null;
  empresa_id: string | null;
  reportado_por: string | null;
  creado_por: string | null;
  asignado_id: string | null;
  prioridad: string | null;
  estado: EstadoIncidencia;
  resuelta_en: string | null;
  creado_en: string;
  actualizado_en: string;
};

/** Fila de la lista y del detalle: incidencia con unidad, responsable y quien la registró ya resueltos. */
export type IncidenciaFila = Incidencia & {
  empresa: { nombre: string } | null;
  asignado: MiembroEquipo | null;
  creador: { nombre: string } | null;
};

/** Selección con los embeds que necesitan lista y detalle (los hints distinguen las dos FKs a perfiles). */
export const SELECT_INCIDENCIA =
  "*, empresa:empresas(nombre), asignado:perfiles!incidencias_asignado_id_fkey(id, nombre), creador:perfiles!incidencias_creado_por_fkey(nombre)";
