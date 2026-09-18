-- =============================================================================
-- Eliminar requerimientos (solo equipo de Innovación)
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- El botón "Eliminar" del detalle borra con el cliente del usuario, así que la
-- RLS es la que decide. Los asignados y adjuntos se borran en cascada por FK.

create policy "req: eliminar innovacion"
  on public.requerimientos for delete
  using (public.es_innovacion());
