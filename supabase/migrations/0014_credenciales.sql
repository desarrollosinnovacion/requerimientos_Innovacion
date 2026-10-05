-- =============================================================================
-- Credenciales: usuarios y contraseñas de las aplicaciones que desarrolla Innovación
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- El secreto se guarda cifrado por la aplicación (AES-256-GCM con la clave
-- CREDENCIALES_CLAVE, que vive solo en el servidor). La base de datos nunca ve
-- el texto plano. Solo el equipo de Innovación lee o escribe; cada revelación
-- queda en una bitácora que no se puede modificar ni borrar desde la app.

create type public.ambiente_credencial as enum ('produccion', 'pruebas', 'desarrollo');
create type public.accion_credencial   as enum ('crear', 'editar', 'eliminar', 'revelar');

-- ---------- Aplicaciones -----------------------------------------------------
create table public.aplicaciones (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  url               text,
  descripcion       text,
  empresa_id        uuid references public.empresas (id) on delete set null,
  requerimiento_id  uuid references public.requerimientos (id) on delete set null,
  creado_por        uuid references public.perfiles (id) on delete set null,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create unique index aplicaciones_nombre_idx        on public.aplicaciones (lower(nombre));
create index        aplicaciones_empresa_idx       on public.aplicaciones (empresa_id);
create index        aplicaciones_requerimiento_idx on public.aplicaciones (requerimiento_id);

-- ---------- Credenciales -----------------------------------------------------
create table public.credenciales (
  id               uuid primary key default gen_random_uuid(), -- lo genera la app: es el AAD del cifrado
  aplicacion_id    uuid not null references public.aplicaciones (id) on delete cascade,
  etiqueta         text not null,                 -- "Panel admin", "BD Postgres", "API key"…
  usuario          text,                          -- login; puede no aplicar (p. ej. un API key)
  secreto_cifrado  text not null,                 -- "v1:iv:tag:ct" en base64; NUNCA texto plano
  ambiente         public.ambiente_credencial not null default 'produccion',
  notas            text,
  creado_por       uuid references public.perfiles (id) on delete set null,
  actualizado_por  uuid references public.perfiles (id) on delete set null,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

create index credenciales_aplicacion_idx on public.credenciales (aplicacion_id);

-- ---------- Bitácora (solo inserción) ----------------------------------------
create table public.credenciales_bitacora (
  id             bigint generated always as identity primary key,
  -- set null (no cascade): el registro de "eliminar" debe sobrevivir a la credencial.
  credencial_id  uuid references public.credenciales (id) on delete set null,
  aplicacion_id  uuid references public.aplicaciones (id) on delete set null,
  etiqueta       text not null,                   -- copia para que la bitácora siga legible
  usuario_id     uuid references public.perfiles (id) on delete set null,
  accion         public.accion_credencial not null,
  creado_en      timestamptz not null default now()
);

create index credenciales_bitacora_aplicacion_idx on public.credenciales_bitacora (aplicacion_id, creado_en desc);
create index credenciales_bitacora_credencial_idx on public.credenciales_bitacora (credencial_id, creado_en desc);

-- ---------- actualizado_en ---------------------------------------------------
create or replace function public.touch_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger aplicaciones_touch
  before update on public.aplicaciones
  for each row execute function public.touch_actualizado_en();

create trigger credenciales_touch
  before update on public.credenciales
  for each row execute function public.touch_actualizado_en();

-- ---------- RLS: solo Innovación ---------------------------------------------
alter table public.aplicaciones          enable row level security;
alter table public.credenciales          enable row level security;
alter table public.credenciales_bitacora enable row level security;

create policy "apps: leer innovacion"
  on public.aplicaciones for select to authenticated
  using (public.es_innovacion());
create policy "apps: crear innovacion"
  on public.aplicaciones for insert to authenticated
  with check (public.es_innovacion());
create policy "apps: actualizar innovacion"
  on public.aplicaciones for update to authenticated
  using (public.es_innovacion()) with check (public.es_innovacion());
create policy "apps: eliminar innovacion"
  on public.aplicaciones for delete to authenticated
  using (public.es_innovacion());

create policy "cred: leer innovacion"
  on public.credenciales for select to authenticated
  using (public.es_innovacion());
create policy "cred: crear innovacion"
  on public.credenciales for insert to authenticated
  with check (public.es_innovacion());
create policy "cred: actualizar innovacion"
  on public.credenciales for update to authenticated
  using (public.es_innovacion()) with check (public.es_innovacion());
create policy "cred: eliminar innovacion"
  on public.credenciales for delete to authenticated
  using (public.es_innovacion());

-- La bitácora solo se lee y se agrega; nadie la modifica ni la borra desde la app.
-- Cada fila lleva como autor al usuario de la sesión: la app no puede falsearlo.
create policy "bit: leer innovacion"
  on public.credenciales_bitacora for select to authenticated
  using (public.es_innovacion());
create policy "bit: agregar propia"
  on public.credenciales_bitacora for insert to authenticated
  with check (public.es_innovacion() and usuario_id = auth.uid());
-- Sin policies de update/delete = denegado por RLS. El revoke lo hace explícito.
revoke update, delete on public.credenciales_bitacora from authenticated, anon;
