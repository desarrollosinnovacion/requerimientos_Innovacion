-- =============================================================================
-- Nombre del proyecto
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- Título corto que identifica el requerimiento en listas, tablero y panel.
-- Opcional, como el resto de los campos; cuando falta, la app muestra el tipo.

alter table public.requerimientos
  add column nombre_proyecto text;
