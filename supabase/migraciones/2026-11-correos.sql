-- ============================================================================
-- Invitoo — migración «Correos automáticos y visitas» (noviembre 2026)
-- ----------------------------------------------------------------------------
-- Idempotente. Después de 2026-11-planes-pago.sql.
--
--   node herramientas/db.mjs migrar
--
-- Qué añade:
--   1. `visitas_dia`: contadores por día (tipo + clave → n). Es TODO lo que
--      queda de las visitas: sin IP, sin cookies, sin identificadores.
--      `visitas_sumar()` suma de forma atómica y devuelve el total.
--   2. `visitas_unicos` y `visitas_sal`: el hash de visitante del día y la sal
--      aleatoria con la que se calcula. Se vacían a los dos días (cron
--      /api/correos/estudio): pasado ese tiempo no se puede rehacer el hash.
--   3. `correos_envios`: un envío por fila con `clave` ÚNICA (boda · paso ·
--      destinatario · periodo): es lo que impide que un correo salga dos veces.
--      Estado, intentos, error y, si falló, su contenido para reintentar.
--   4. `correos_preferencias`: qué grupos de correos quiere recibir cada email
--      y si se dio de baja de todo.
--
-- RLS cerrada: solo el servidor (service role) lee y escribe.
-- Rollback:
--   drop function public.visitas_sumar(date, text, text, integer);
--   drop table public.visitas_dia, public.visitas_unicos, public.visitas_sal,
--              public.correos_envios, public.correos_preferencias;
-- (sin estas tablas la web sigue funcionando: no mide ni manda correos).
-- ============================================================================

begin;

-- ─────────────────────────────────────────────────────────────── visitas

create table if not exists public.visitas_dia (
  dia    date    not null,
  tipo   text    not null check (tipo in (
           'vistas', 'visitantes', 'ruta', 'plantilla', 'origen', 'clic',
           'checkout', 'hora', 'apertura', 'rsvp', 'foto')),
  clave  text    not null default '*' check (char_length(clave) <= 120),
  n      integer not null default 0 check (n >= 0),
  primary key (dia, tipo, clave)
);
create index if not exists visitas_dia_tipo_idx on public.visitas_dia (tipo, dia);

create table if not exists public.visitas_unicos (
  dia        date not null,
  visitante  text not null check (char_length(visitante) <= 32),
  primary key (dia, visitante)
);

create table if not exists public.visitas_sal (
  dia  date primary key,
  sal  text not null
);

create or replace function public.visitas_sumar(p_dia date, p_tipo text, p_clave text, p_n integer default 1)
returns integer
language sql
security definer
-- E3: search_path vacío (todo va con esquema: public.visitas_dia), como pide
-- el linter de Supabase para las funciones security definer.
set search_path = ''
as $$
  insert into public.visitas_dia as v (dia, tipo, clave, n)
  values (p_dia, p_tipo, coalesce(nullif(p_clave, ''), '*'), greatest(p_n, 0))
  on conflict (dia, tipo, clave) do update set n = v.n + excluded.n
  returning n;
$$;
revoke all on function public.visitas_sumar(date, text, text, integer) from public, anon, authenticated;
grant execute on function public.visitas_sumar(date, text, text, integer) to service_role;

-- ─────────────────────────────────────────────────────────────── correos

create table if not exists public.correos_envios (
  clave          text primary key,
  correo         text not null,
  categoria      text not null check (categoria in ('servicio', 'fidelizacion', 'estudio')),
  email          text not null,
  invitacion_id  uuid references public.invitaciones (id) on delete set null,
  slug           text,
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente', 'enviado', 'buzon', 'fallido', 'omitido', 'aplazado')),
  intentos       integer not null default 0,
  error          text,
  resend_id      text,
  asunto         text,
  -- Solo mientras está «fallido»: asunto, html y texto para reintentar.
  carga          jsonb,
  -- Día (Madrid) del envío o del último intento: para el límite diario.
  dia            date not null default (now() at time zone 'Europe/Madrid')::date,
  creado         timestamptz not null default now(),
  enviado_en     timestamptz
);
create index if not exists correos_envios_dia_idx on public.correos_envios (dia, estado);
create index if not exists correos_envios_email_dia_idx on public.correos_envios (email, dia);
create index if not exists correos_envios_invitacion_idx on public.correos_envios (invitacion_id) where invitacion_id is not null;
create index if not exists correos_envios_fallidos_idx on public.correos_envios (estado) where estado = 'fallido';
create index if not exists correos_envios_creado_idx on public.correos_envios (creado desc);

create table if not exists public.correos_preferencias (
  email        text primary key,
  grupos       jsonb not null default '{"servicio": true, "rsvp": true, "cuenta-atras": true, "fidelizacion": true}'::jsonb,
  baja_total   boolean not null default false,
  actualizado  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────── RLS

alter table public.visitas_dia          enable row level security;
alter table public.visitas_unicos       enable row level security;
alter table public.visitas_sal          enable row level security;
alter table public.correos_envios       enable row level security;
alter table public.correos_preferencias enable row level security;
-- Sin políticas: nadie con la clave anónima ni con sesión las lee.
revoke all on public.visitas_dia, public.visitas_unicos, public.visitas_sal,
              public.correos_envios, public.correos_preferencias from anon, authenticated;

commit;
