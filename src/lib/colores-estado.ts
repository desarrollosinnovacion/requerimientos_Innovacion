import { ESTADOS, type Estado } from "@/lib/formulario";

/**
 * Colores de estado dentro de la paleta SICSA. Los estados "fuera de flujo"
 * (Pausado, Recurrente, No iniciado) van en neutros y beige; el avance del
 * desarrollo sube por la rampa de verde, En pruebas se señala en Cobre y
 * Entregado cierra en Verde Profundo. Los usan el panel de inicio (donas e
 * indicadores) y el tablero de proyectos.
 */
export const COLOR_ESTADO: Record<Estado, string> = {
  pausado: "#C2B59B",
  recurrente: "#3f3d39",
  no_iniciado: "#9c9891",
  en_desarrollo: "#86b09d",
  casi_terminado: "#175641",
  en_pruebas: "#A7663A",
  entregado: "#0B2B21",
};

/** Mismo orden que las columnas del tablero (el de `ESTADOS`). */
export const ORDEN_ESTADOS = Object.keys(ESTADOS) as Estado[];

/** Orden fijo de colores categóricos (equipo y unidades de negocio): verde, piedra, verde profundo, verde claro, tinta. */
export const COLOR_CATEGORIA = ["#175641", "#c4c0b7", "#0B2B21", "#86b09d", "#3f3d39"];
/** "Sin asignar" siempre en Cobre, para que se note. */
export const COLOR_SIN_ASIGNAR = "#A7663A";
/** Agrupaciones residuales ("Otros", "Sin definir"). */
export const COLOR_OTROS = "#9c9891";
/** Máximo de categorías con segmento propio en una dona; el resto se agrupa. */
export const MAX_SEGMENTOS_DONA = 5;

/** Prioridad es ordinal: rampa secuencial de Cobre (más urgente, más oscuro) y Baja en neutro. Validada para daltonismo. */
export const COLOR_PRIORIDAD: Record<string, string> = {
  Crítica: "#744526",
  Alta: "#c0835a",
  Media: "#e6c8b0",
  Baja: "#9c9891",
};
