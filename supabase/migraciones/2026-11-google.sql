-- ============================================================================
-- Invitoo — migración «google» (noviembre 2026)
-- ----------------------------------------------------------------------------
-- Idempotente. Después de 2026-11-cuentas.sql.
--
--   node herramientas/db.mjs migrar
--
-- «Continuar con Google» busca la boda por el email VERIFICADO en `miembros`
-- (igual que el código por email). Las dos personas de la pareja ya caben:
-- una fila por persona, y la pareja invita a la otra desde «Cuenta».
--
-- Lo único que faltaba: la migración de cuentas copió `parejas.email` a
-- `miembros` UNA vez. Una boda nueva (o un email corregido en `parejas`)
-- después de esa migración no entraba con Google. Estos disparadores lo
-- mantienen al día solos. No borran nunca a nadie: si el email cambia, el
-- anterior sigue teniendo acceso hasta que la pareja lo quite en «Cuenta».
-- ============================================================================

begin;

-- Una boda nueva con pareja → su email entra como miembro «pareja».
create or replace function public.miembros_desde_invitacion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.pareja_id is not null then
    insert into public.miembros (invitacion_id, user_id, email, rol)
    select new.id, p.auth_id, lower(btrim(p.email)), 'pareja'
      from public.parejas p
     where p.id = new.pareja_id and p.email is not null
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists miembros_desde_invitacion on public.invitaciones;
create trigger miembros_desde_invitacion
  after insert or update of pareja_id on public.invitaciones
  for each row execute function public.miembros_desde_invitacion();

-- El email de la pareja cambia → el nuevo también entra en todas sus bodas.
create or replace function public.miembros_desde_pareja()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is not null and new.email is distinct from old.email then
    insert into public.miembros (invitacion_id, email, rol)
    select i.id, lower(btrim(new.email)), 'pareja'
      from public.invitaciones i
     where i.pareja_id = new.id
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists miembros_desde_pareja on public.parejas;
create trigger miembros_desde_pareja
  after update of email on public.parejas
  for each row execute function public.miembros_desde_pareja();

-- Y lo que se creó entre una migración y otra.
insert into public.miembros (invitacion_id, user_id, email, rol)
select i.id, p.auth_id, lower(btrim(p.email)), 'pareja'
  from public.invitaciones i
  join public.parejas p on p.id = i.pareja_id
 where p.email is not null
on conflict do nothing;

commit;
