-- Invitoo · ajustes de seguridad que pide el linter de Supabase. Idempotente.
-- 1. search_path fijo en las funciones de disparador que no lo tenían.
-- 2. Las funciones de disparador «security definer» no se pueden llamar por
--    /rest/v1/rpc: solo las usan los disparadores.
--    (es_mia, es_miembro y puede_administrar SE QUEDAN ejecutables: las
--    usan las políticas RLS, que se evalúan con el rol de quien consulta.)
alter function public.miembros_normalizar() set search_path = public;
alter function public.tocar_actualizado()   set search_path = public;
revoke execute on function public.crear_panel()               from public, anon, authenticated;
revoke execute on function public.miembros_desde_invitacion() from public, anon, authenticated;
revoke execute on function public.miembros_desde_pareja()     from public, anon, authenticated;
