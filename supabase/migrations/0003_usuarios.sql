-- =============================================================================
-- Gestión de usuarios: cambio obligatorio de contraseña y desactivación
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================

alter table public.perfiles
  add column debe_cambiar_password boolean not null default false,
  add column activo boolean not null default true;

-- Nota: la desactivación también bloquea el acceso en Supabase Auth (ban) desde la app;
-- `activo` sirve para mostrar el estado y cerrar sesiones abiertas.
