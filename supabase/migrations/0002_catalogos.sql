-- =============================================================================
-- Catálogos: empresas -> departamentos -> áreas
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================

create table public.empresas (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  activo    boolean not null default true,
  orden     int not null default 0,
  creado_en timestamptz not null default now(),
  constraint empresas_nombre_unico unique (nombre)
);

create table public.departamentos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nombre     text not null,
  activo     boolean not null default true,
  orden      int not null default 0,
  creado_en  timestamptz not null default now(),
  constraint departamentos_nombre_unico unique (empresa_id, nombre)
);

create table public.areas (
  id              uuid primary key default gen_random_uuid(),
  departamento_id uuid not null references public.departamentos (id) on delete cascade,
  nombre          text not null,
  activo          boolean not null default true,
  orden           int not null default 0,
  creado_en       timestamptz not null default now(),
  constraint areas_nombre_unico unique (departamento_id, nombre)
);

create index departamentos_empresa_idx on public.departamentos (empresa_id);
create index areas_departamento_idx on public.areas (departamento_id);

alter table public.empresas      enable row level security;
alter table public.departamentos enable row level security;
alter table public.areas         enable row level security;

-- Todos los usuarios autenticados pueden leer; solo Innovación administra.
create policy "empresas: leer" on public.empresas for select to authenticated using (true);
create policy "empresas: administrar" on public.empresas for all to authenticated
  using (public.es_innovacion()) with check (public.es_innovacion());

create policy "departamentos: leer" on public.departamentos for select to authenticated using (true);
create policy "departamentos: administrar" on public.departamentos for all to authenticated
  using (public.es_innovacion()) with check (public.es_innovacion());

create policy "areas: leer" on public.areas for select to authenticated using (true);
create policy "areas: administrar" on public.areas for all to authenticated
  using (public.es_innovacion()) with check (public.es_innovacion());

-- El requerimiento guarda las referencias. `empresa_area` se conserva como texto
-- combinado ("Empresa / Departamento / Área") para listados y búsqueda.
-- Los catálogos no se pueden borrar si algún requerimiento los usa (restrict);
-- en ese caso hay que desactivarlos.
alter table public.requerimientos
  add column empresa_id      uuid references public.empresas (id) on delete restrict,
  add column departamento_id uuid references public.departamentos (id) on delete restrict,
  add column area_id         uuid references public.areas (id) on delete restrict;

create index requerimientos_empresa_idx on public.requerimientos (empresa_id);
