-- ============================================================================
-- Invitoo — migración «cuentas» (noviembre 2026)
-- ----------------------------------------------------------------------------
-- Idempotente: se puede lanzar las veces que haga falta, después de
-- schema.sql y de 2026-10-mejora.sql.
--
--   node herramientas/db.mjs migrar
--
-- Qué añade:
--   1. `miembros`: quién lleva cada boda. Las dos personas de la pareja, el
--      planner y el estudio. Una fila por persona; el `email` sirve para
--      invitar antes de que esa persona tenga cuenta (al entrar por primera
--      vez con su código se rellena `user_id`).
--   2. `mesas` y `mesa_asientos`: el plano del banquete. Se sienta a cada
--      PERSONA confirmada (`persona` = '<rsvp_id>:<nombre normalizado>'), no a
--      la invitación entera: una familia de cuatro puede repartirse.
--   3. invitados: `enviado_en` y `recordado_en`, para saber a quién se le
--      mandó el enlace y cuándo, y avisar de quien lleva días sin contestar.
--   4. muro: `revisado`, para que el panel sepa qué mensajes no ha mirado
--      nadie todavía (la moderación sigue siendo a posteriori).
--   5. invitaciones: `cronograma` (el día hora a hora, privado o publicado
--      en la invitación) y `online_hasta` (hasta cuándo sigue en línea).
--   6. RLS por membresía, con el mismo patrón que events-planner
--      (`can_access_wedding`): una función `security definer` que responde
--      «¿es esta boda mía?» y políticas que la usan.
--
-- El servidor de Invitoo sigue escribiendo con service role (después de
-- comprobar el acceso en `src/lib/auth/acceso.ts`). Las políticas son la
-- segunda cerradura: si algún día se lee con la sesión del usuario, RLS ya
-- filtra por boda.
-- ============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────  miembros
create table if not exists public.miembros (
  id             uuid primary key default gen_random_uuid(),
  invitacion_id  uuid not null references public.invitaciones (id) on delete cascade,
  user_id        uuid references auth.users (id) on delete cascade,
  email          text,
  rol            text not null default 'pareja'
                   check (rol in ('pareja', 'planner', 'estudio')),
  nombre         text,
  invitado_por   uuid references auth.users (id) on delete set null,
  creado_en      timestamptz not null default now(),
  constraint miembros_quien check (user_id is not null or email is not null)
);

-- Emails siempre en minúsculas: «Laura@Gmail.com» y «laura@gmail.com» son la
-- misma persona.
create or replace function public.miembros_normalizar()
returns trigger language plpgsql as $$
begin
  if new.email is not null then new.email = lower(btrim(new.email)); end if;
  return new;
end $$;

drop trigger if exists miembros_normalizar on public.miembros;
create trigger miembros_normalizar
  before insert or update on public.miembros
  for each row execute function public.miembros_normalizar();

create unique index if not exists miembros_invitacion_email_key
  on public.miembros (invitacion_id, email) where email is not null;
create unique index if not exists miembros_invitacion_user_key
  on public.miembros (invitacion_id, user_id) where user_id is not null;
create index if not exists miembros_user_idx on public.miembros (user_id);
create index if not exists miembros_email_idx on public.miembros (email);

-- La pareja que ya existía (parejas.email) pasa a ser miembro de sus bodas.
insert into public.miembros (invitacion_id, user_id, email, rol)
select i.id, p.auth_id, lower(p.email), 'pareja'
  from public.invitaciones i
  join public.parejas p on p.id = i.pareja_id
 where p.email is not null
on conflict do nothing;

-- ───────────────────────────────────────────────────── ¿es esta boda mía?
-- Miembro por user_id, o por email aún sin vincular (la primera visita).
create or replace function public.es_miembro(inv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.miembros m
     where m.invitacion_id = inv
       and (m.user_id = auth.uid()
            or (m.user_id is null and m.email = lower(coalesce(auth.jwt() ->> 'email', ''))))
  );
$$;

-- `es_mia` (schema.sql) miraba solo parejas.auth_id. Ahora vale cualquiera de
-- las dos cosas, así las políticas antiguas («solo la pareja lee») abren
-- también para los miembros.
create or replace function public.es_mia(inv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.es_miembro(inv) or exists (
    select 1
      from public.invitaciones i
      join public.parejas p on p.id = i.pareja_id
     where i.id = inv
       and p.auth_id = auth.uid()
  );
$$;

-- ¿Puede gestionar miembros y borrar datos? La pareja y el estudio; el
-- planner trabaja con la lista pero no echa a nadie ni borra la boda.
create or replace function public.puede_administrar(inv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.miembros m
     where m.invitacion_id = inv
       and m.rol in ('pareja', 'estudio')
       and m.user_id = auth.uid()
  );
$$;

alter table public.miembros enable row level security;

drop policy if exists "miembros ven a los de su boda" on public.miembros;
create policy "miembros ven a los de su boda"
  on public.miembros for select using (public.es_mia(invitacion_id));

drop policy if exists "la pareja invita" on public.miembros;
create policy "la pareja invita"
  on public.miembros for insert with check (public.puede_administrar(invitacion_id));

drop policy if exists "la pareja quita" on public.miembros;
create policy "la pareja quita"
  on public.miembros for delete
  using (public.puede_administrar(invitacion_id) or user_id = auth.uid());

-- invitaciones: los miembros ven y editan la suya (además de las públicas).
drop policy if exists "los miembros ven la suya" on public.invitaciones;
create policy "los miembros ven la suya"
  on public.invitaciones for select using (public.es_miembro(id));

drop policy if exists "los miembros editan la suya" on public.invitaciones;
create policy "los miembros editan la suya"
  on public.invitaciones for update
  using (public.es_miembro(id)) with check (public.es_miembro(id));

-- invitados / muro: los miembros también escriben (antes solo leían).
do $$
declare t text;
begin
  foreach t in array array['invitados', 'muro'] loop
    execute format('drop policy if exists "los miembros escriben" on public.%I', t);
    execute format(
      'create policy "los miembros escriben" on public.%I for all using (public.es_mia(invitacion_id)) with check (public.es_mia(invitacion_id))', t);
  end loop;
end $$;

-- rsvp: los miembros pueden borrar (derecho de supresión), no inventar respuestas.
drop policy if exists "los miembros borran" on public.rsvp;
create policy "los miembros borran"
  on public.rsvp for delete using (public.es_mia(invitacion_id));

-- ──────────────────────────────────────────────────────────────────  mesas
create table if not exists public.mesas (
  id             uuid primary key default gen_random_uuid(),
  invitacion_id  uuid not null references public.invitaciones (id) on delete cascade,
  nombre         text not null,
  forma          text not null default 'redonda' check (forma in ('redonda', 'imperial')),
  capacidad      int not null default 10 check (capacidad between 1 and 60),
  orden          int not null default 0,
  nota           text,
  creado_en      timestamptz not null default now()
);

create index if not exists mesas_invitacion_idx on public.mesas (invitacion_id, orden);

create table if not exists public.mesa_asientos (
  invitacion_id  uuid not null references public.invitaciones (id) on delete cascade,
  -- '<rsvp_id>:<nombre normalizado>'. Si el invitado cambia el nombre al
  -- corregir su respuesta, esa persona vuelve a «sin mesa» y se ve.
  persona        text not null,
  mesa_id        uuid not null references public.mesas (id) on delete cascade,
  creado_en      timestamptz not null default now(),
  primary key (invitacion_id, persona)
);

create index if not exists mesa_asientos_mesa_idx on public.mesa_asientos (mesa_id);

alter table public.mesas         enable row level security;
alter table public.mesa_asientos enable row level security;

do $$
declare t text;
begin
  foreach t in array array['mesas', 'mesa_asientos'] loop
    execute format('drop policy if exists "los miembros gestionan" on public.%I', t);
    execute format(
      'create policy "los miembros gestionan" on public.%I for all using (public.es_mia(invitacion_id)) with check (public.es_mia(invitacion_id))', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────  invitados
alter table public.invitados add column if not exists enviado_en   timestamptz;
alter table public.invitados add column if not exists recordado_en timestamptz;

-- ──────────────────────────────────────────────────────────────────── muro
alter table public.muro add column if not exists revisado boolean not null default false;
-- Lo que ya estaba antes de esta migración se da por visto: no queremos que
-- la pareja estrene panel con cien avisos viejos.
update public.muro set revisado = true
 where creado_en < now() - interval '1 day' and revisado = false;

-- ───────────────────────────────────────────────────────────  invitaciones
-- { items: [{ hora, titulo, lugar?, direccion?, mapa?, icono? }],
--   publico: bool, original?: [paradas del itinerario antes de publicar] }
alter table public.invitaciones add column if not exists cronograma jsonb;
-- Null = doce meses después de la boda (lo que incluye el plan).
alter table public.invitaciones add column if not exists online_hasta date;

commit;
