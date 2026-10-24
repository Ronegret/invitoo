-- ============================================================================
-- Invitoo — migración «Todos los pagos por Stripe» (noviembre 2026)
-- ----------------------------------------------------------------------------
-- Idempotente. Después de 2026-11-pagos.sql.
--
--   node herramientas/db.mjs migrar
--
-- Qué añade:
--   1. `pedidos`: lo que el estudio tiene que atender después de un pago.
--        · tipo 'plan'  → una reserva de Invitoo (149 €) o Con canción
--          (249 €) pagada en /precios. Se crea en el webhook con lo que la
--          pareja escribe en Checkout (nombres, fecha, email y teléfono).
--          Todavía no hay boda: el estudio la vincula cuando la crea.
--        · tipo 'cobro' → un cobro a medida del Estudio (presupuesto). Lo crea
--          Rodrigo en /estudio/cobros; el enlace /pagar/<token> abre Checkout
--          con el importe guardado aquí (nunca con uno que llegue del
--          navegador). Admite señal + resto (`parte`, `grupo`).
--      `estado_pago` es lo que dice Stripe; `estado` es el trabajo del estudio
--      (nueva → en curso → hecha), igual que las solicitudes de cambio.
--   2. `pagos` (el libro de eventos de Stripe) admite ahora planes y cobros:
--      `invitacion_id` y `slug` pasan a ser opcionales, `producto` acepta
--      'invitoo', 'cancion', 'estudio' y 'cobro', y se añade `pedido_id`.
--      La idempotencia sigue siendo la misma: `evento` único.
--
-- RLS cerrada: solo el servidor (service role) lee y escribe.
-- Rollback: `drop table public.pedidos;` y volver a poner las restricciones
-- de 2026-11-pagos.sql (solo si no hay filas de planes o cobros en `pagos`).
-- ============================================================================

begin;

create table if not exists public.pedidos (
  id             uuid primary key default gen_random_uuid(),
  -- Aleatorio (32 hex). Es lo que va en /pagar/<token> y /gracias?pedido=.
  token          text not null,
  tipo           text not null check (tipo in ('plan', 'cobro')),
  -- El plan reservado (solo tipo 'plan'; en 'cobro', 'estudio' o null).
  plan           text check (plan in ('invitoo', 'cancion', 'estudio')),
  concepto       text not null check (char_length(concepto) between 2 and 200),
  -- Céntimos, IVA incluido. Lo que se cobra en ESTE pedido.
  importe        integer not null check (importe > 0),
  -- 'total', o 'senal' + 'resto' cuando el estudio cobra en dos partes.
  parte          text not null default 'total' check (parte in ('total', 'senal', 'resto')),
  -- En 'senal' y 'resto': el importe del encargo entero (céntimos).
  total          integer check (total is null or total > 0),
  -- En 'resto': el id de la señal de la que sale.
  grupo          uuid references public.pedidos (id) on delete set null,
  invitacion_id  uuid references public.invitaciones (id) on delete set null,
  slug           text,
  pareja         text,
  fecha_boda     text,
  email          text,
  telefono       text,
  estado_pago    text not null default 'pendiente'
                 check (estado_pago in ('pendiente', 'pagado', 'demo', 'reembolsado', 'disputado', 'fallido', 'anulado')),
  estado         text not null default 'nueva' check (estado in ('nueva', 'en_curso', 'hecha')),
  -- cs_… y pi_… para cruzar con Stripe, los reembolsos y las disputas.
  sesion         text,
  pago_stripe    text,
  -- Lo pagado de verdad (puede ser menos que `importe` con un código).
  pagado         integer,
  descuento      integer,
  creado         timestamptz not null default now(),
  actualizado    timestamptz not null default now(),
  pagado_en      timestamptz
);

create unique index if not exists pedidos_token_key on public.pedidos (token);
-- Una sesión de Checkout = como mucho un pedido de plan (aunque Stripe
-- entregue dos eventos de la misma sesión).
create unique index if not exists pedidos_sesion_plan_key on public.pedidos (sesion) where tipo = 'plan' and sesion is not null;
create index if not exists pedidos_pendientes_idx on public.pedidos (estado, creado desc);
create index if not exists pedidos_pago_stripe_idx on public.pedidos (pago_stripe) where pago_stripe is not null;

alter table public.pedidos enable row level security;
revoke all on public.pedidos from anon, authenticated;

-- ─────────────────────────────────────────── pagos: planes y cobros también
alter table public.pagos alter column invitacion_id drop not null;
alter table public.pagos alter column slug drop not null;
alter table public.pagos add column if not exists pedido_id uuid references public.pedidos (id) on delete set null;
alter table public.pagos drop constraint if exists pagos_producto_check;
alter table public.pagos add constraint pagos_producto_check
  check (producto in ('directo', 'gestionado', 'conservar', 'invitoo', 'cancion', 'estudio', 'cobro'));

commit;
