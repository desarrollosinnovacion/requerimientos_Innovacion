-- =============================================================================
-- Credenciales: ¿tiene MFA? y quiénes del equipo tienen el segundo factor
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- Cuando una credencial exige un segundo factor (app autenticadora, SMS, llave),
-- conviene saber quiénes del equipo lo tienen configurado en su dispositivo.

alter table public.credenciales
  add column tiene_mfa boolean not null default false;

create table public.credencial_mfa_titulares (
  credencial_id uuid not null references public.credenciales (id) on delete cascade,
  perfil_id     uuid not null references public.perfiles (id) on delete cascade,
  creado_en     timestamptz not null default now(),
  primary key (credencial_id, perfil_id)
);

create index credencial_mfa_titulares_perfil_idx on public.credencial_mfa_titulares (perfil_id);

alter table public.credencial_mfa_titulares enable row level security;

-- Solo Innovación lee y administra, y solo puede señalar a miembros activos de Innovación.
create policy "mfa: leer innovacion"
  on public.credencial_mfa_titulares for select to authenticated
  using (public.es_innovacion());

create policy "mfa: administrar innovacion"
  on public.credencial_mfa_titulares for all to authenticated
  using (public.es_innovacion())
  with check (
    public.es_innovacion()
    and exists (
      select 1 from public.perfiles p
      where p.id = perfil_id and p.rol = 'innovacion' and p.activo
    )
  );
