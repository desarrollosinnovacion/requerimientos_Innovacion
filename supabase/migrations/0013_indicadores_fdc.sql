-- =============================================================================
-- Indicadores FDC: reporte mensual de avance (réplica del Excel "Indicadores FDC")
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- Un período (hoja del Excel) tiene secciones (bloques); cada sección tiene sus
-- propias columnas (unidades de negocio) y filas (items) con meta y notas. El
-- valor de cada celda vive en fdc_valores. Progreso y % de alcance se calculan
-- en la aplicación: conteo = suma de la fila; check = cuántas celdas marcadas.
-- Solo el equipo de Innovación ve y edita esta sección.

create type public.fdc_tipo_seccion as enum ('conteo', 'check');

create table public.fdc_periodos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null unique,
  titulo         text not null default 'Reporte de Avance - Alineación Semanal de FDC',
  -- Año y mes de inicio (AAAAMM) para ordenar la lista.
  orden          integer not null,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.fdc_secciones (
  id          uuid primary key default gen_random_uuid(),
  periodo_id  uuid not null references public.fdc_periodos (id) on delete cascade,
  nombre      text not null,
  tipo        public.fdc_tipo_seccion not null default 'check',
  orden       integer not null default 0
);
create index fdc_secciones_periodo_idx on public.fdc_secciones (periodo_id);

create table public.fdc_columnas (
  id          uuid primary key default gen_random_uuid(),
  seccion_id  uuid not null references public.fdc_secciones (id) on delete cascade,
  nombre      text not null,
  orden       integer not null default 0
);
create index fdc_columnas_seccion_idx on public.fdc_columnas (seccion_id);

create table public.fdc_items (
  id          uuid primary key default gen_random_uuid(),
  seccion_id  uuid not null references public.fdc_secciones (id) on delete cascade,
  nombre      text not null default '',
  meta        numeric,
  notas       text,
  orden       integer not null default 0
);
create index fdc_items_seccion_idx on public.fdc_items (seccion_id);

create table public.fdc_valores (
  item_id     uuid not null references public.fdc_items (id) on delete cascade,
  columna_id  uuid not null references public.fdc_columnas (id) on delete cascade,
  valor       numeric not null,
  primary key (item_id, columna_id)
);

-- Cualquier cambio en el contenido marca el período como actualizado.
create or replace function public.fdc_touch_periodo()
returns trigger
language plpgsql
as $$
declare
  pid uuid;
begin
  if tg_table_name = 'fdc_secciones' then
    pid := coalesce(new.periodo_id, old.periodo_id);
  elsif tg_table_name in ('fdc_columnas', 'fdc_items') then
    select periodo_id into pid from public.fdc_secciones where id = coalesce(new.seccion_id, old.seccion_id);
  else
    select s.periodo_id into pid
      from public.fdc_items i join public.fdc_secciones s on s.id = i.seccion_id
     where i.id = coalesce(new.item_id, old.item_id);
  end if;
  if pid is not null then
    update public.fdc_periodos set actualizado_en = now() where id = pid;
  end if;
  return null;
end;
$$;

create trigger fdc_secciones_touch after insert or update or delete on public.fdc_secciones
  for each row execute function public.fdc_touch_periodo();
create trigger fdc_columnas_touch after insert or update or delete on public.fdc_columnas
  for each row execute function public.fdc_touch_periodo();
create trigger fdc_items_touch after insert or update or delete on public.fdc_items
  for each row execute function public.fdc_touch_periodo();
create trigger fdc_valores_touch after insert or update or delete on public.fdc_valores
  for each row execute function public.fdc_touch_periodo();

alter table public.fdc_periodos  enable row level security;
alter table public.fdc_secciones enable row level security;
alter table public.fdc_columnas  enable row level security;
alter table public.fdc_items     enable row level security;
alter table public.fdc_valores   enable row level security;

create policy "fdc periodos: innovacion"  on public.fdc_periodos  for all to authenticated using (public.es_innovacion()) with check (public.es_innovacion());
create policy "fdc secciones: innovacion" on public.fdc_secciones for all to authenticated using (public.es_innovacion()) with check (public.es_innovacion());
create policy "fdc columnas: innovacion"  on public.fdc_columnas  for all to authenticated using (public.es_innovacion()) with check (public.es_innovacion());
create policy "fdc items: innovacion"     on public.fdc_items     for all to authenticated using (public.es_innovacion()) with check (public.es_innovacion());
create policy "fdc valores: innovacion"   on public.fdc_valores   for all to authenticated using (public.es_innovacion()) with check (public.es_innovacion());
