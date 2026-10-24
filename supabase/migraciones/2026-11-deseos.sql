-- ============================================================================
-- Invitoo — migración «Libro de buenos deseos, Avisos y Solicitudes»
-- (noviembre 2026)
-- ----------------------------------------------------------------------------
-- Idempotente: se puede lanzar las veces que haga falta, después de
-- schema.sql, 2026-10-mejora.sql, 2026-11-cuentas.sql y 2026-11-directo.sql.
--
--   node herramientas/db.mjs migrar
--
-- Qué añade:
--   1. `deseos`: los buenos deseos que llegan por el QR propio
--      (/i/<slug>/deseos). Nombre, texto y, si acaso, una foto del bucket
--      `momentos` (misma subida firmada que «En directo»).
--   2. `deseos_marcas`: lo que la pareja decide sobre CADA deseo, venga de
--      donde venga (muro de la invitación, «En directo» o QR): favorito,
--      oculto en el libro, leído y la corrección de una errata. La fila
--      original no se toca nunca: la corrección vive aquí.
--   3. `avisos`: lo nuevo de cada boda (confirmaciones, cambios de
--      respuesta, deseos, fotos retiradas, solicitudes) para la campana.
--   4. `avisos_preferencias`: email al momento, resumen diario o nada, por
--      tipo de aviso; y cuándo se mandó el último resumen.
--   5. `avisos_push`: suscripciones Web Push de los navegadores.
--   6. `solicitudes`: «Pedir un cambio» (recibida → en curso → hecha).
--   7. `invitaciones.plan` y `invitaciones.anadidos`: lo contratado.
--
-- Mesas y cronograma: el panel ya no los usa. Sus tablas (`mesas`,
-- `mesa_asientos`) y la columna `invitaciones.cronograma` SE QUEDAN donde
-- están, sin tocar: hay datos de parejas que los usaron y no se borra nada
-- de nadie sin preguntar.
--
-- RLS cerrada en todas: ni el invitado ni la pareja leen la base
-- directamente. Todo pasa por acciones de servidor con service role que
-- comprueban el acceso (`exigirAccesoBoda`) o el antispam del QR.
-- ============================================================================

begin;

-- ──────────────────────────────────────────────────────────────────  deseos
create table if not exists public.deseos (
  id             uuid primary key default gen_random_uuid(),
  invitacion_id  uuid not null references public.invitaciones (id) on delete cascade,
  nombre         text not null check (char_length(nombre) between 2 and 80),
  texto          text not null check (char_length(texto) between 2 and 1200),
  -- Ruta del bucket `momentos` (<invitacion>/p/<id>.webp). Nunca una URL.
  foto_ruta      text,
  -- Antispam: huella del dispositivo (localStorage/cookie) y de la IP.
  dispositivo    text,
  ip_huella      text,
  creado_en      timestamptz not null default now()
);
create index if not exists deseos_invitacion_idx on public.deseos (invitacion_id, creado_en desc);
create index if not exists deseos_dispositivo_idx on public.deseos (invitacion_id, dispositivo, creado_en desc);

-- ─────────────────────────────────────────────────────────── deseos_marcas
create table if not exists public.deseos_marcas (
  invitacion_id  uuid not null references public.invitaciones (id) on delete cascade,
  -- 'muro' (invitación), 'directo' (momentos de tipo mensaje) o 'qr' (deseos).
  origen         text not null check (origen in ('muro', 'directo', 'qr')),
  -- Id de la fila original en su tabla (texto: vale para cualquier origen).
  ref            text not null,
  favorito       boolean not null default false,
  oculto         boolean not null default false,
  leido          boolean not null default false,
  -- Errata corregida con permiso de quien lo escribió. Null = el original.
  correccion     text check (correccion is null or char_length(correccion) <= 1200),
  actualizado_en timestamptz not null default now(),
  primary key (invitacion_id, origen, ref)
);

-- ──────────────────────────────────────────────────────────────────  avisos
create table if not exists public.avisos (
  id             uuid primary key default gen_random_uuid(),
  invitacion_id  uuid not null references public.invitaciones (id) on delete cascade,
  tipo           text not null check (tipo in ('confirmacion', 'cambio', 'deseo', 'retirada', 'solicitud')),
  titulo         text not null,
  detalle        text,
  -- Ruta relativa dentro del panel (/panel/<slug>/...).
  enlace         text,
  leido          boolean not null default false,
  -- Si ya salió por email (al momento) o en un resumen diario.
  enviado_en     timestamptz,
  creado_en      timestamptz not null default now()
);
create index if not exists avisos_invitacion_idx on public.avisos (invitacion_id, creado_en desc);
create index if not exists avisos_pendientes_idx on public.avisos (invitacion_id) where enviado_en is null;

-- ──────────────────────────────────────────────────── avisos_preferencias
create table if not exists public.avisos_preferencias (
  invitacion_id  uuid primary key references public.invitaciones (id) on delete cascade,
  -- 'momento' | 'diario' | 'nada', por tipo.
  confirmacion   text not null default 'momento' check (confirmacion in ('momento', 'diario', 'nada')),
  cambio         text not null default 'momento' check (cambio in ('momento', 'diario', 'nada')),
  deseo          text not null default 'diario' check (deseo in ('momento', 'diario', 'nada')),
  retirada       text not null default 'momento' check (retirada in ('momento', 'diario', 'nada')),
  solicitud      text not null default 'momento' check (solicitud in ('momento', 'diario', 'nada')),
  ultimo_resumen timestamptz,
  actualizado_en timestamptz not null default now()
);
alter table public.avisos_preferencias add column if not exists solicitud text not null default 'momento';

-- ────────────────────────────────────────────────────────────  avisos_push
create table if not exists public.avisos_push (
  id             uuid primary key default gen_random_uuid(),
  invitacion_id  uuid not null references public.invitaciones (id) on delete cascade,
  endpoint       text not null unique,
  p256dh         text,
  auth           text,
  creado_en      timestamptz not null default now()
);
create index if not exists avisos_push_invitacion_idx on public.avisos_push (invitacion_id);

-- ─────────────────────────────────────────────────────────────  solicitudes
create table if not exists public.solicitudes (
  id             uuid primary key default gen_random_uuid(),
  invitacion_id  uuid not null references public.invitaciones (id) on delete cascade,
  texto          text not null check (char_length(texto) between 4 and 2000),
  -- La sección de la invitación que señalan ('portada', 'historia'…), o null.
  seccion        text,
  foto_ruta      text,
  estado         text not null default 'recibida' check (estado in ('recibida', 'en_curso', 'hecha')),
  -- Lo que contesta el estudio (se ve en el panel).
  respuesta      text,
  autor          text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists solicitudes_estado_idx on public.solicitudes (estado, creado_en desc);
create index if not exists solicitudes_invitacion_idx on public.solicitudes (invitacion_id, creado_en desc);

-- ─────────────────────────────────────────────── contrato (planes-boda.ts)
-- Qué tiene contratado cada boda: lo no contratado sale en gris y con
-- candado en el panel. El plan de En directo sigue en su configuración.
alter table public.invitaciones add column if not exists plan text not null default 'invitoo';
alter table public.invitaciones add column if not exists anadidos text[] not null default '{}';
do $$ begin
  alter table public.invitaciones add constraint invitaciones_plan_chk check (plan in ('invitoo', 'cancion', 'estudio'));
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────────────────────────────  RLS
-- Cerrada: sin políticas, solo service role.
alter table public.deseos              enable row level security;
alter table public.deseos_marcas       enable row level security;
alter table public.avisos              enable row level security;
alter table public.avisos_preferencias enable row level security;
alter table public.avisos_push         enable row level security;
alter table public.solicitudes         enable row level security;

revoke all on public.deseos, public.deseos_marcas, public.avisos,
  public.avisos_preferencias, public.avisos_push, public.solicitudes
  from anon, authenticated;

commit;
