import type { Estado } from "@/lib/formulario";

/**
 * Colores de estado dentro de la paleta SICSA, validados para daltonismo en este orden
 * (scripts/validate_palette.js de la guía dataviz): neutro -> Verde SICSA -> Cobre -> Verde Profundo.
 * Los usan el panel de inicio (donas e indicadores) y el tablero de proyectos.
 */
export const COLOR_ESTADO: Record<Estado, string> = {
  no_iniciado: "#9c9891",
  iniciado: "#175641",
  en_pruebas: "#A7663A",
  finalizado: "#0B2B21",
};

export const ORDEN_ESTADOS: Estado[] = ["no_iniciado", "iniciado", "en_pruebas", "finalizado"];
