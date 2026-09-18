-- =============================================================================
-- Enlace público para nuevos requerimientos
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- =============================================================================
-- Los requerimientos enviados desde /solicitud (sin iniciar sesión) no tienen
-- perfil asociado: solicitante_id queda en null y el contacto vive en
-- nombre_solicitante / correo. El insert lo hace el servidor con service_role,
-- así que las políticas RLS no cambian: un requerimiento sin solicitante solo
-- lo ve el equipo de Innovación (policy "req: leer propios o innovacion").

alter table public.requerimientos
  alter column solicitante_id drop not null;
