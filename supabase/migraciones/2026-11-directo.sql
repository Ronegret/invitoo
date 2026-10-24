-- ============================================================================
-- Invitoo — migración «En directo» (noviembre 2026)
-- ----------------------------------------------------------------------------
-- Idempotente: se puede lanzar las veces que haga falta, después de
-- schema.sql y de 2026-10-mejora.sql.
--
--   node herramientas/db.mjs migrar
--
-- Qué añade:
--   1. `directo`: la configuración del día de la boda, una fila por boda
--      (activo, subidas abiertas, moderación, clave de la pantalla, token
--      del QR, plan, límites, hasta cuándo se conserva, mensaje fijado y
--      momento programado en curso).
--   2. `momentos`: lo que suben los invitados (fotos, vídeos cortos y
--      mensajes), con su estado de moderación.
--   3. El bucket PRIVADO `momentos`. Se sube con URL firmada que emite el
--      servidor y se lee con URL firmada de corta duración.
--
-- RLS cerrada en las dos tablas: ni el invitado ni la pantalla leen la base.
-- Todo pasa por acciones de servidor y route handlers con service role, que
-- comprueban el token del QR o la clave de la pantalla.
-- ============================================================================

begin;

-- ──────────────────────────────────────────────────────────────────  directo
create table if not exists public.directo (
  invitacion_id   uuid primary key references public.invitaciones (id) on delete cascade,
  activo          boolean not null default false,
  moderacion      text not null default 'auto',
  -- La pantalla de la TV: /directo/<slug>?k=<clave_pantalla>. Se regenera
  -- desde el panel si se filtra.
  clave_pantalla  text not null default encode(gen_random_bytes(12), 'hex'),
  -- El token del QR (/i/<slug>/momentos?t=<token_subida>): sin él no se sube.
  token_subida    text not null default encode(gen_random_bytes(6), 'hex'),
  -- Interruptor «cerrar subidas»: la pantalla y el muro siguen, ya no entra nada.
  subidas_abiertas boolean not null default true,
  plan            text not null default 'album',
  -- Años extra comprados («Conservar 1 año más»).
  anos_extra      int not null default 0,
  limite_fotos    int not null default 150,
  limite_videos   int not null default 0,
  limite_bytes    bigint not null default 262144000,
  retencion_hasta timestamptz,
  -- Un mensaje fijado en la pantalla (id de `momentos`).
  mensaje_fijado  uuid,
  -- El momento programado en curso («Primer baile»): rótulo en la pantalla
  -- y etiqueta de capítulo en las fotos que entran mientras dura.
  capitulo        text,
  capitulo_desde  timestamptz,
  -- Cuándo se avisó a la pareja de que el álbum se borra (30 días antes).
  aviso_borrado   timestamptz,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

-- Por si la tabla ya existía con menos columnas.
alter table public.directo add column if not exists subidas_abiertas boolean not null default true;
alter table public.directo add column if not exists anos_extra int not null default 0;
alter table public.directo add column if not exists limite_bytes bigint not null default 262144000;
alter table public.directo add column if not exists retencion_hasta timestamptz;
alter table public.directo add column if not exists mensaje_fijado uuid;
alter table public.directo add column if not exists capitulo text;
alter table public.directo add column if not exists capitulo_desde timestamptz;
alter table public.directo add column if not exists aviso_borrado timestamptz;
create index if not exists directo_retencion_idx on public.directo (retencion_hasta);

alter table public.directo drop constraint if exists directo_moderacion_check;
alter table public.directo add constraint directo_moderacion_check
  check (moderacion in ('auto', 'manual'));
alter table public.directo drop constraint if exists directo_plan_check;
alter table public.directo add constraint directo_plan_check
  check (plan in ('album', 'directo', 'gestionado', 'estudio'));

drop trigger if exists directo_tocar on public.directo;
create trigger directo_tocar
  before update on public.directo
  for each row execute function public.tocar_actualizado();

-- ─────────────────────────────────────────────────────────────────  momentos
create table if not exists public.momentos (
  id              uuid primary key default gen_random_uuid(),
  invitacion_id   uuid not null references public.invitaciones (id) on delete cascade,
  tipo            text not null,
  -- Rutas LÓGICAS del bucket (nunca URLs): así se puede migrar a otro
  -- almacenamiento (R2…) sin tocar la base.
  ruta            text,            -- 2048 px (la del ZIP) o el vídeo
  ruta_pantalla   text,            -- 1280 px (la que pinta la TV)
  ruta_miniatura  text,            -- 480 px (muro y moderación)
  ancho           int,
  alto            int,
  duracion        real,
  bytes           bigint not null default 0,
  autor           text not null,
  mensaje         text,
  estado          text not null default 'visible',
  destacado       boolean not null default false,
  -- Id aleatorio que el navegador guarda: para el límite por minuto y para
  -- que cada invitado pueda reconocer lo suyo. No identifica a nadie.
  dispositivo     text,
  -- El momento programado en curso cuando se subió («Primer baile»).
  capitulo        text,
  -- Un invitado pidió retirarla: se oculta al instante y se avisa a la pareja.
  retirada_pedida timestamptz,
  creado          timestamptz not null default now()
);

alter table public.momentos add column if not exists ruta_pantalla text;
alter table public.momentos add column if not exists capitulo text;
alter table public.momentos add column if not exists retirada_pedida timestamptz;

alter table public.momentos drop constraint if exists momentos_tipo_check;
alter table public.momentos add constraint momentos_tipo_check
  check (tipo in ('foto', 'video', 'mensaje'));
alter table public.momentos drop constraint if exists momentos_estado_check;
alter table public.momentos add constraint momentos_estado_check
  check (estado in ('visible', 'oculto', 'pendiente'));
-- Una foto o un vídeo siempre tienen archivo; un mensaje siempre tiene texto.
alter table public.momentos drop constraint if exists momentos_contenido_check;
alter table public.momentos add constraint momentos_contenido_check
  check ((tipo = 'mensaje' and mensaje is not null) or (tipo <> 'mensaje' and ruta is not null));

create index if not exists momentos_feed_idx
  on public.momentos (invitacion_id, estado, creado desc);
create index if not exists momentos_dispositivo_idx
  on public.momentos (invitacion_id, dispositivo, creado desc);
create unique index if not exists momentos_ruta_key
  on public.momentos (ruta) where ruta is not null;

-- El uso de una boda en una sola consulta (contador del panel y límites).
create or replace function public.uso_momentos(inv uuid)
returns table (fotos bigint, videos bigint, mensajes bigint, bytes bigint)
language sql stable security definer set search_path = public as $$
  select count(*) filter (where tipo = 'foto'),
         count(*) filter (where tipo = 'video'),
         count(*) filter (where tipo = 'mensaje'),
         coalesce(sum(bytes), 0)::bigint
    from public.momentos
   where invitacion_id = inv;
$$;
revoke all on function public.uso_momentos(uuid) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────  RLS
alter table public.directo  enable row level security;
alter table public.momentos enable row level security;
-- Sin políticas: cerradas para anon y authenticated. Solo service role.

-- ──────────────────────────────────────────────────────────────────  storage
-- Privado. 40 MB por archivo (vídeo de 30 s); los tipos que sube la página.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('momentos', 'momentos', false, 41943040,
        array['image/webp', 'image/jpeg', 'image/png',
              'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

commit;
