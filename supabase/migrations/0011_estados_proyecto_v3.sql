-- =============================================================================
-- Estados del proyecto (v3): Pausado, Recurrente, No iniciado, En desarrollo,
-- Casi terminado, En pruebas, Entregado
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- Postgres no permite quitar valores de un enum, así que se crea uno nuevo y se
-- migra la columna. Equivalencias con los 4 estados anteriores:
--   no_iniciado -> no_iniciado   iniciado -> en_desarrollo
--   en_pruebas  -> en_pruebas    finalizado -> entregado
-- Las policies que comparan `estado` dependen del tipo viejo: se sueltan antes
-- del cambio y se recrean idénticas al final.

drop policy if exists "req: crear propios" on public.requerimientos;
drop policy if exists "req: actualizar propio no iniciado" on public.requerimientos;

alter type public.estado_proyecto rename to estado_proyecto_v2;

create type public.estado_proyecto as enum (
  'pausado',
  'recurrente',
  'no_iniciado',
  'en_desarrollo',
  'casi_terminado',
  'en_pruebas',
  'entregado'
);

alter table public.requerimientos
  alter column estado drop default,
  alter column estado type public.estado_proyecto
    using (
      case estado::text
        when 'iniciado'   then 'en_desarrollo'
        when 'finalizado' then 'entregado'
        else estado::text
      end
    )::public.estado_proyecto,
  alter column estado set default 'no_iniciado';

drop type public.estado_proyecto_v2;

-- El solicitante no puede elegir el estado al crear: siempre entra como 'no_iniciado'.
create policy "req: crear propios"
  on public.requerimientos for insert
  with check (solicitante_id = auth.uid() and estado = 'no_iniciado');

-- El solicitante puede corregir los suyos solo mientras el proyecto no ha iniciado.
create policy "req: actualizar propio no iniciado"
  on public.requerimientos for update
  using (solicitante_id = auth.uid() and estado = 'no_iniciado')
  with check (solicitante_id = auth.uid() and estado = 'no_iniciado');
