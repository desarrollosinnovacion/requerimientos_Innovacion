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
