-- =============================================================================
-- Equipo asignado: miembros de Innovación responsables de cada requerimiento
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================

create table public.requerimiento_asignados (
  requerimiento_id uuid not null references public.requerimientos (id) on delete cascade,
  perfil_id        uuid not null references public.perfiles (id) on delete cascade,
  creado_en        timestamptz not null default now(),
  primary key (requerimiento_id, perfil_id)
);

create index requerimiento_asignados_perfil_idx on public.requerimiento_asignados (perfil_id);

alter table public.requerimiento_asignados enable row level security;

-- Quien puede leer el requerimiento puede ver a quién está asignado.
create policy "asignados: leer si puedo leer el requerimiento"
  on public.requerimiento_asignados for select to authenticated
  using (exists (
    select 1 from public.requerimientos r
    where r.id = requerimiento_id
      and (r.solicitante_id = auth.uid() or public.es_innovacion())
  ));

-- Solo Innovación asigna, y solo a miembros activos de Innovación.
create policy "asignados: administrar innovacion"
  on public.requerimiento_asignados for all to authenticated
  using (public.es_innovacion())
  with check (
    public.es_innovacion()
    and exists (
      select 1 from public.perfiles p
      where p.id = perfil_id and p.rol = 'innovacion' and p.activo
    )
  );

-- Los solicitantes necesitan ver el nombre de los miembros de Innovación asignados.
create policy "perfiles: leer equipo innovacion"
  on public.perfiles for select to authenticated
  using (rol = 'innovacion');
