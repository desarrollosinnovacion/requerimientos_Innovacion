export function formatearFecha(iso: string | null | undefined, conHora = false) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function formatearTamano(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Título de un requerimiento: el nombre del proyecto o, si no lo tiene, el tipo. */
export function tituloProyecto(r: { nombre_proyecto: string | null; tipo_requerimiento: string | null }) {
  return r.nombre_proyecto?.trim() || r.tipo_requerimiento || "Sin nombre de proyecto";
}
