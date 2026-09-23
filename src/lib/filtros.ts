/**
 * Valores especiales de los filtros de la lista de requerimientos. Viven aquí y
 * no en el componente de filtros porque ese archivo es "use client": lo que se
 * exporta desde ahí llega al servidor como referencia de cliente, no como texto.
 */

/** Requerimientos sin empresa del catálogo. También es la etiqueta visible. */
export const SIN_UNIDAD = "Sin unidad";
/** Requerimientos sin equipo asignado. */
export const SIN_ASIGNAR = "sin_asignar";
/** Requerimientos sin prioridad final ni sugerida. */
export const SIN_PRIORIDAD = "sin_definir";
