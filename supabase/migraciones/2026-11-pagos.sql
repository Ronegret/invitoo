-- ============================================================================
-- Invitoo — migración «Pagos de En directo» (noviembre 2026)
-- ----------------------------------------------------------------------------
-- Idempotente. Después de 2026-11-directo.sql.
--
--   node herramientas/db.mjs migrar
--
-- Qué añade:
--   1. `pagos`: un pago (o una compra en modo demo) por fila. `evento` es el
--      `event.id` de Stripe y es ÚNICO: es lo que hace idempotente el
--      webhook (Stripe reintenta el mismo evento hasta 3 días).
--   2. `directo.diseno` (jsonb): el estilo de la pantalla del salón y de la
--      página de subida (Revista, Polaroid, Cine, Mosaico; marco con las
--      iniciales, frase de bienvenida, rótulos y tarjetas manuscritas). La
--      app la lee aparte: si esta migración aún no está, usa el diseño de
--      partida y no se rompe nada.
--
-- RLS cerrada: solo el servidor (service role) lee y escribe.
-- Rollback: `drop table public.pagos; alter table public.directo drop column diseno;`
-- (la app sigue funcionando sin ellas, en modo «sin pagos»).
-- ============================================================================

begin;

create table if not exists public.pagos (
  id             uuid primary key default gen_random_uuid(),
  -- event.id de Stripe (evt_…) o demo_… en modo demo. Único: idempotencia.
  evento         text not null,
  invitacion_id  uuid not null references public.invitaciones (id) on delete cascade,
  slug           text not null,
  producto       text not null check (producto in ('directo', 'gestionado', 'conservar')),
  -- Céntimos, IVA incluido.
  importe        integer not null check (importe >= 0),
  moneda         text not null default 'eur',
  estado         text not null default 'pagado'
                 check (estado in ('pagado', 'demo', 'reembolsado', 'fallido', 'disputado')),
  -- cs_… (Checkout Session) y pi_… (PaymentIntent): para cruzar con Stripe,
  -- los reembolsos y las disputas.
  sesion         text,
  pago_stripe    text,
  email          text,
  creado         timestamptz not null default now()
);

create unique index if not exists pagos_evento_key on public.pagos (evento);
create index if not exists pagos_invitacion_idx on public.pagos (invitacion_id, creado desc);
create index if not exists pagos_pago_stripe_idx on public.pagos (pago_stripe) where pago_stripe is not null;

alter table public.pagos enable row level security;
-- Sin políticas: nadie con la clave anónima ni con sesión lee pagos.
revoke all on public.pagos from anon, authenticated;

alter table public.directo add column if not exists diseno jsonb;

commit;
