-- =============================================================================
-- Estado del proyecto: No iniciado -> Iniciado -> En pruebas -> Finalizado
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- Reemplaza los 7 estados anteriores por 4. Todo requerimiento nace en
-- 'no_iniciado' y solo el equipo de Innovación puede cambiarlo (RLS de update).

create type public.estado_proyecto as enum ('no_iniciado', 'iniciado', 'en_pruebas', 'finalizado');

alter table public.requerimientos
  alter column estado drop default,
  alter column estado type public.estado_proyecto
    using (
      case estado::text
        when 'en_desarrollo' then 'iniciado'
        when 'completado'    then 'finalizado'
        else 'no_iniciado'
      end
    )::public.estado_proyecto,
  alter column estado set default 'no_iniciado';

drop type public.estado_requerimiento;

-- El solicitante no puede elegir el estado al crear: siempre entra como 'no_iniciado'.
drop policy "req: crear propios" on public.requerimientos;
create policy "req: crear propios"
  on public.requerimientos for insert
  with check (solicitante_id = auth.uid() and estado = 'no_iniciado');
