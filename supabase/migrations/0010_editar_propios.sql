-- =============================================================================
-- Editar requerimientos
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- Innovación ya puede actualizar cualquier requerimiento ("req: actualizar innovacion").
-- El solicitante puede corregir los suyos solo mientras el proyecto no ha iniciado;
-- el `with check` impide que cambie el estado o el dueño al hacerlo.

create policy "req: actualizar propio no iniciado"
  on public.requerimientos for update
  using (solicitante_id = auth.uid() and estado = 'no_iniciado')
  with check (solicitante_id = auth.uid() and estado = 'no_iniciado');
