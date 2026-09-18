-- =============================================================================
-- Ningún campo del formulario es obligatorio
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- El formulario deja de exigir campos; las columnas de texto que eran not null
-- pasan a aceptar null. Se conservan obligatorios folio, estado y las fechas de
-- auditoría. La app muestra "—" o un texto de relleno cuando falta un valor.

alter table public.requerimientos
  alter column nombre_solicitante drop not null,
  alter column empresa_area drop not null,
  alter column correo drop not null,
  alter column product_owner drop not null,
  alter column tipo_requerimiento drop not null,
  alter column problema drop not null,
  alter column proceso_actual_tipo drop not null,
  alter column proceso_actual_desc drop not null,
  alter column resultado_esperado drop not null,
  alter column criterio_exito drop not null,
  alter column flujo_esperado drop not null,
  alter column funcionalidades_indispensables drop not null,
  alter column requiere_integracion drop not null,
  alter column info_sensible drop not null,
  alter column prioridad_sugerida drop not null,
  alter column justificacion_prioridad drop not null,
  alter column tiene_fecha_limite drop not null;
