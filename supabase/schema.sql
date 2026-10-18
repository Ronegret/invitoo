-- ============================================================================
-- Invitoo — esquema
-- ----------------------------------------------------------------------------
-- Se ejecuta entero en el editor SQL de Supabase. Es idempotente: se puede
-- volver a lanzar sin romper nada.
--
-- Dos ideas mandan aquí:
--
--   1. La invitación publicada es PÚBLICA: la abre cualquiera con el enlace,
--      sin cuenta. Pedirle a la tía Mari que se registre es el mayor generador
--      de fricción posible en este producto.
--   2. Todo lo demás es PRIVADO: la lista de invitados, quién ha confirmado,
--      qué come cada uno y los mensajes del muro solo los ven los novios y el
--      estudio. Eso se cierra con RLS, no con «es que nadie sabe la URL».
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────── parejas (clientes)
create table if not exists public.parejas (
  id               uuid primary key default gen_random_uuid(),
  auth_id          uuid unique references auth.users (id) on delete set null,
  email            text not null,
  nombres          text not null,
  plan             text not null default 'invitoo'
                     check (plan in ('invitoo', 'cancion', 'estudio')),
  stripe_customer  text,
  creado_en        timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────  invitaciones
create table if not exists public.invitaciones (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null
                 check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  pareja_id    uuid references public.parejas (id) on delete cascade,
  plantilla    text not null
                 check (plantilla in ('sobre','floracion','cielo','velo',
                                      'constelacion','bruma','marea',
                                      'terracota','tinta','jardin',
                                      'lino','brasa')),
  estado       text not null default 'borrador'
                 check (estado in ('borrador','publicada','archivada')),
  -- Los nombres y la fecha van en columnas y no dentro del jsonb porque se
  -- ordenan, se filtran y salen en el panel. Lo demás sí es jsonb: cambia de
  -- forma por boda y no se consulta nunca por dentro.
  nombre_a     text not null,
  nombre_b     text not null,
  fecha        timestamptz not null,
  tema         jsonb not null default '{}'::jsonb,
  apertura     jsonb,
  musica       jsonb,
  bloques      jsonb not null default '[]'::jsonb,
  publicada_en timestamptz,
  creado_en    timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- La tabla ya existía con seis plantillas. `create table if not exists` no
-- la toca, así que la restricción se rehace aquí a mano.
alter table public.invitaciones drop constraint if exists invitaciones_plantilla_check;
alter table public.invitaciones add constraint invitaciones_plantilla_check
  check (plantilla in ('sobre','floracion','cielo','velo','constelacion',
                       'bruma','marea','terracota','tinta','jardin','lino','brasa'));

create index if not exists invitaciones_pareja_idx on public.invitaciones (pareja_id);
create index if not exists invitaciones_estado_idx on public.invitaciones (estado);

-- ─────────────────────────────────────────────────────────────────────  paneles
-- El enlace privado del panel de los novios. Sin login: la pareja recibe una
-- URL y ya está; una boda no es sitio para gestionar contraseñas.
--
-- Va en tabla APARTE y no como columna de `invitaciones` por un motivo
-- concreto: `invitaciones` tiene una política de lectura pública para las
-- publicadas, y RLS filtra filas, no columnas. Una columna `token` ahí
-- dentro se la llevaría cualquiera que pidiese la fila. Aquí no hay política
-- pública: solo se lee con service role desde el servidor.
create table if not exists public.paneles (
  invitacion_id uuid primary key references public.invitaciones (id) on delete cascade,
  token         text unique not null default encode(gen_random_bytes(9), 'hex'),
  creado_en     timestamptz not null default now()
);

-- Cada invitación nueva estrena su panel sin que haya que acordarse.
create or replace function public.crear_panel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.paneles (invitacion_id) values (new.id)
  on conflict (invitacion_id) do nothing;
  return new;
end $$;

drop trigger if exists invitaciones_crear_panel on public.invitaciones;
create trigger invitaciones_crear_panel
  after insert on public.invitaciones
  for each row execute function public.crear_panel();

-- ──────────────────────────────────────────────────────────────────  invitados
-- Opcional: solo para bodas con lista cerrada. Si no hay lista, el invitado
-- escribe su nombre y ya está.
create table if not exists public.invitados (
  id              uuid primary key default gen_random_uuid(),
  invitacion_id   uuid not null references public.invitaciones (id) on delete cascade,
  nombre          text not null,
  grupo           text,
  acompanantes_max int not null default 0,
  token           text unique default encode(gen_random_bytes(6), 'hex'),
  creado_en       timestamptz not null default now()
);

create index if not exists invitados_invitacion_idx on public.invitados (invitacion_id);

-- ───────────────────────────────────────────────────────────────────────  rsvp
create table if not exists public.rsvp (
  id            uuid primary key default gen_random_uuid(),
  invitacion_id uuid not null references public.invitaciones (id) on delete cascade,
  invitado_id   uuid references public.invitados (id) on delete set null,
  nombre        text not null,
  asiste        boolean not null,
  acompanantes  int not null default 0 check (acompanantes between 0 and 8),
  menu          text,
  alergias      text,
  bus           boolean not null default false,
  creado_en     timestamptz not null default now()
);

create index if not exists rsvp_invitacion_idx on public.rsvp (invitacion_id, creado_en desc);

-- ───────────────────────────────────────────────────────────────────────  muro
create table if not exists public.muro (
  id            uuid primary key default gen_random_uuid(),
  invitacion_id uuid not null references public.invitaciones (id) on delete cascade,
  nombre        text not null,
  mensaje       text not null,
  aprobado      boolean not null default true,
  creado_en     timestamptz not null default now()
);

create index if not exists muro_invitacion_idx on public.muro (invitacion_id, creado_en desc);

-- ──────────────────────────────────────────────────────────────────────  album
create table if not exists public.album (
  id            uuid primary key default gen_random_uuid(),
  invitacion_id uuid not null references public.invitaciones (id) on delete cascade,
  ruta          text not null,
  subido_por    text,
  aprobado      boolean not null default false,
  creado_en     timestamptz not null default now()
);

create index if not exists album_invitacion_idx on public.album (invitacion_id, creado_en desc);

-- ──────────────────────────────────────────────────────────────────────  leads
-- El motor de referidos: cada invitación la abren ~120 personas en edad de
-- casarse. Esto es lo que convierte esas visitas en algo medible.
create table if not exists public.leads (
  id                   uuid primary key default gen_random_uuid(),
  email                text,
  telefono             text,
  origen_invitacion_id uuid references public.invitaciones (id) on delete set null,
  codigo               text,
  creado_en            timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────── actualizado_en al día
create or replace function public.tocar_actualizado()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end $$;

drop trigger if exists invitaciones_tocar on public.invitaciones;
create trigger invitaciones_tocar
  before update on public.invitaciones
  for each row execute function public.tocar_actualizado();

-- ============================================================================
-- RLS
-- ----------------------------------------------------------------------------
-- Con RLS activo y sin políticas, la tabla queda cerrada. Se abre solo lo que
-- hace falta, y las escrituras de invitados van por service role desde las
-- acciones de servidor, nunca desde el navegador.
-- ============================================================================

alter table public.parejas      enable row level security;
alter table public.invitaciones enable row level security;
alter table public.invitados    enable row level security;
alter table public.rsvp         enable row level security;
alter table public.muro         enable row level security;
alter table public.album        enable row level security;
alter table public.leads        enable row level security;
alter table public.paneles      enable row level security;

-- ¿Es esta invitación mía?
create or replace function public.es_mia(inv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.invitaciones i
      join public.parejas p on p.id = i.pareja_id
     where i.id = inv
       and p.auth_id = auth.uid()
  );
$$;

-- invitaciones: el mundo ve las publicadas; la pareja ve y edita las suyas.
drop policy if exists "invitaciones publicadas son publicas" on public.invitaciones;
create policy "invitaciones publicadas son publicas"
  on public.invitaciones for select
  using (estado = 'publicada');

drop policy if exists "la pareja ve las suyas" on public.invitaciones;
create policy "la pareja ve las suyas"
  on public.invitaciones for select
  using (exists (select 1 from public.parejas p
                  where p.id = pareja_id and p.auth_id = auth.uid()));

drop policy if exists "la pareja edita las suyas" on public.invitaciones;
create policy "la pareja edita las suyas"
  on public.invitaciones for update
  using (exists (select 1 from public.parejas p
                  where p.id = pareja_id and p.auth_id = auth.uid()));

-- parejas: cada uno, lo suyo.
drop policy if exists "cada pareja se ve a si misma" on public.parejas;
create policy "cada pareja se ve a si misma"
  on public.parejas for select using (auth_id = auth.uid());

-- rsvp / muro / album / invitados: SOLO la pareja lee. Nadie más.
-- Ni siquiera el invitado que acaba de escribir: el muro se escribe, no se lee.
do $$
declare t text;
begin
  foreach t in array array['rsvp','muro','album','invitados'] loop
    execute format('drop policy if exists "solo la pareja lee" on public.%I', t);
    execute format(
      'create policy "solo la pareja lee" on public.%I for select using (public.es_mia(invitacion_id))', t);
  end loop;
end $$;

-- leads y paneles: ninguna política. Quedan cerrados a cal y canto para
-- cualquier cliente; solo se tocan con service role desde el servidor.

-- ============================================================================
-- Storage: el álbum compartido
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('album', 'album', false, 15728640,
        array['image/jpeg','image/png','image/webp','image/avif','image/heic'])
on conflict (id) do nothing;

-- Las fotos entran por una URL firmada que emite el servidor, no con el
-- anon key desde el navegador: si no, cualquiera con el enlace de la
-- invitación puede llenar el bucket.
