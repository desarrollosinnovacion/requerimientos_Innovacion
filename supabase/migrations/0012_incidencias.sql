-- =============================================================================
-- Incidencias: tickets menores que llegan al equipo de Innovación
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- Registro ligero, separado de los requerimientos: un título, una descripción
-- corta, de dónde viene, quién la reporta y un responsable único de Innovación.

create type public.estado_incidencia as enum ('abierta', 'en_proceso', 'resuelta');

create sequence public.incidencias_folio_seq;

create table public.incidencias (
  id              uuid primary key default gen_random_uuid(),
  folio           text not null unique,
  titulo          text not null,
  descripcion     text,
  empresa_id      uuid references public.empresas (id) on delete set null,
  -- Quién la pidió (texto libre: puede no ser usuario del portal).
  reportado_por   text,
  -- Quién la registró en el portal.
  creado_por      uuid references public.perfiles (id) on delete set null,
  -- Responsable de Innovación (uno solo; las incidencias son pequeñas).
  asignado_id     uuid references public.perfiles (id) on delete set null,
  prioridad       text check (prioridad in ('Crítica', 'Alta', 'Media', 'Baja')),
  estado          public.estado_incidencia not null default 'abierta',
  resuelta_en     timestamptz,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create index incidencias_estado_idx on public.incidencias (estado);
create index incidencias_creado_por_idx on public.incidencias (creado_por);
create index incidencias_asignado_idx on public.incidencias (asignado_id);

-- Folio automático: INC-2026-0001
create or replace function public.asignar_folio_incidencia()
returns trigger
language plpgsql
as $$
begin
  if new.folio is null or new.folio = '' then
    new.folio := 'INC-' || to_char(now(), 'YYYY') || '-' ||
                 lpad(nextval('public.incidencias_folio_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger incidencias_folio
  before insert on public.incidencias
  for each row execute function public.asignar_folio_incidencia();

-- Marca la fecha de resolución al pasar a 'resuelta' y la limpia si se reabre.
create or replace function public.touch_incidencia()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  if new.estado = 'resuelta' and old.estado <> 'resuelta' then
    new.resuelta_en := now();
  elsif new.estado <> 'resuelta' then
    new.resuelta_en := null;
  end if;
  return new;
end;
$$;

create trigger incidencias_touch
  before update on public.incidencias
  for each row execute function public.touch_incidencia();

alter table public.incidencias enable row level security;

create policy "inc: leer propias o innovacion"
  on public.incidencias for select to authenticated
  using (creado_por = auth.uid() or public.es_innovacion());

-- Cualquier usuario registra incidencias a su nombre; entran como 'abierta'.
-- Solo Innovación puede fijar responsable al crear.
create policy "inc: crear propias"
  on public.incidencias for insert to authenticated
  with check (
    creado_por = auth.uid()
    and estado = 'abierta'
    and (asignado_id is null or public.es_innovacion())
  );

create policy "inc: actualizar innovacion"
  on public.incidencias for update to authenticated
  using (public.es_innovacion())
  with check (
    public.es_innovacion()
    and (asignado_id is null or exists (
      select 1 from public.perfiles p
      where p.id = asignado_id and p.rol = 'innovacion' and p.activo
    ))
  );

create policy "inc: eliminar innovacion"
  on public.incidencias for delete to authenticated
  using (public.es_innovacion());
