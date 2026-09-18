-- =============================================================================
-- INN Requerimientos - esquema inicial
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================

-- ---------- Perfiles ---------------------------------------------------------
create type public.rol_usuario as enum ('solicitante', 'innovacion');

create table public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  correo      text not null,
  rol         public.rol_usuario not null default 'solicitante',
  creado_en   timestamptz not null default now()
);

alter table public.perfiles enable row level security;

-- Crea el perfil automaticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, correo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: ¿el usuario actual es del equipo de Innovacion?
create or replace function public.es_innovacion()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'innovacion'
  );
$$;

create policy "perfiles: leer propio o innovacion"
  on public.perfiles for select
  using (id = auth.uid() or public.es_innovacion());

-- ---------- Requerimientos ---------------------------------------------------
create type public.estado_requerimiento as enum (
  'nuevo', 'en_evaluacion', 'aprobado', 'en_desarrollo', 'completado', 'rechazado', 'en_espera'
);

create sequence public.requerimientos_folio_seq;

create table public.requerimientos (
  id                        uuid primary key default gen_random_uuid(),
  folio                     text not null unique,
  solicitante_id            uuid not null references public.perfiles (id) on delete restrict,
  estado                    public.estado_requerimiento not null default 'nuevo',
  prioridad_final           text,
  fecha_estimada_entrega    date,
  notas_innovacion          text,
  creado_en                 timestamptz not null default now(),
  actualizado_en            timestamptz not null default now(),

  -- 1. Informacion general
  nombre_solicitante        text not null,
  empresa_area              text not null,
  correo                    text not null,
  product_owner             text not null,
  tipo_requerimiento        text not null,
  tipo_requerimiento_otro   text,

  -- 2. Necesidad o problema
  problema                  text not null,
  proceso_actual_tipo       text not null,
  proceso_actual_tipo_otro  text,
  proceso_actual_desc       text not null,

  -- 3. Resultado esperado
  resultado_esperado        text not null,
  criterio_exito            text not null,
  usuarios_beneficiados     text[] not null default '{}',
  usuarios_beneficiados_otro text,
  numero_usuarios           text,

  -- 4. Alcance funcional
  flujo_esperado            text not null,
  funcionalidades_indispensables text not null,
  funcionalidades_deseables text,

  -- 5. Sistemas e integraciones
  sistemas_involucrados     text[] not null default '{}',
  sistemas_involucrados_otro text,
  requiere_integracion      text not null,
  integracion_sistemas      text,
  requiere_migracion        text,
  fuente_datos              text,
  volumen_datos             text,

  -- 6. Informacion y archivos de apoyo
  documentacion_disponible  text[] not null default '{}',
  documentacion_disponible_otro text,
  info_sensible             text not null,
  info_sensible_desc        text,

  -- 7. Impacto y prioridad
  impacto_no_desarrollar    text[] not null default '{}',
  impacto_no_desarrollar_otro text,
  impacto_esperado          text[] not null default '{}',
  impacto_esperado_otro     text,
  ahorro_estimado           text,
  prioridad_sugerida        text not null,
  justificacion_prioridad   text not null,

  -- 8. Fecha requerida
  tiene_fecha_limite        text not null,
  fecha_limite              date,
  motivo_fecha              text,
  motivo_fecha_otro         text,
  contexto_fecha            text,

  -- 9. Confirmacion
  comentarios_adicionales   text
);

create index requerimientos_solicitante_idx on public.requerimientos (solicitante_id);
create index requerimientos_estado_idx on public.requerimientos (estado);

-- Folio automatico: REQ-2026-0001
create or replace function public.asignar_folio()
returns trigger
language plpgsql
as $$
begin
  if new.folio is null or new.folio = '' then
    new.folio := 'REQ-' || to_char(now(), 'YYYY') || '-' ||
                 lpad(nextval('public.requerimientos_folio_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger requerimientos_folio
  before insert on public.requerimientos
  for each row execute function public.asignar_folio();

create or replace function public.touch_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger requerimientos_touch
  before update on public.requerimientos
  for each row execute function public.touch_actualizado_en();

alter table public.requerimientos enable row level security;

create policy "req: leer propios o innovacion"
  on public.requerimientos for select
  using (solicitante_id = auth.uid() or public.es_innovacion());

create policy "req: crear propios"
  on public.requerimientos for insert
  with check (solicitante_id = auth.uid());

create policy "req: actualizar innovacion"
  on public.requerimientos for update
  using (public.es_innovacion())
  with check (public.es_innovacion());

-- ---------- Adjuntos ---------------------------------------------------------
create table public.adjuntos (
  id                uuid primary key default gen_random_uuid(),
  requerimiento_id  uuid not null references public.requerimientos (id) on delete cascade,
  nombre            text not null,
  ruta              text not null,
  tamano            bigint,
  tipo_mime         text,
  creado_en         timestamptz not null default now()
);

create index adjuntos_requerimiento_idx on public.adjuntos (requerimiento_id);

alter table public.adjuntos enable row level security;

create policy "adjuntos: leer si puedo leer el requerimiento"
  on public.adjuntos for select
  using (exists (
    select 1 from public.requerimientos r
    where r.id = requerimiento_id
      and (r.solicitante_id = auth.uid() or public.es_innovacion())
  ));

create policy "adjuntos: crear en requerimientos propios"
  on public.adjuntos for insert
  with check (exists (
    select 1 from public.requerimientos r
    where r.id = requerimiento_id and r.solicitante_id = auth.uid()
  ));

-- Bucket privado. Ruta de cada archivo: <uid>/<requerimiento_id>/<archivo>
insert into storage.buckets (id, name, public, file_size_limit)
values ('adjuntos', 'adjuntos', false, 26214400)  -- 25 MB
on conflict (id) do nothing;

create policy "storage adjuntos: subir a carpeta propia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'adjuntos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage adjuntos: leer propios o innovacion"
  on storage.objects for select to authenticated
  using (bucket_id = 'adjuntos' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_innovacion()));

-- =============================================================================
-- Para dar rol de Innovacion a un usuario (despues de que se registre):
--   update public.perfiles set rol = 'innovacion' where correo = 'persona@empresa.com';
-- =============================================================================
