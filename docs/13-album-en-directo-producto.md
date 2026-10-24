# 13 · El álbum «En directo» como producto (H1)

> Rodrigo: «los invitados suben la foto por un QR y pueden ver todos a la vez, en una pestaña, la foto con algún mensaje opcional que quieran dejar; todo después se almacena y se entrega a los novios si quieren». Se contrata aparte desde el portal y desde la web; lo no contratado, en gris con candado; espectacular y con diseño personalizado.

## 1. Cómo se cobra: la decisión

**Stripe Checkout (página alojada) y un webhook firmado.** Sin SDK: dos llamadas REST y la verificación HMAC de la firma. No añade ninguna dependencia.

| Opción | Veredicto |
|---|---|
| **Stripe Checkout + webhook `checkout.session.completed`** | **Elegida.** Lleva el `slug`, el producto y la invitación en `metadata`, así que la activación es automática y por boda. Admite tarjeta, Apple Pay, Google Pay y **Bizum** (si está activo en el Dashboard). Emite la factura (`invoice_creation`). |
| Payment Links | Sirven para un enlace suelto (WhatsApp), pero no llevan la boda dentro: habría que activar a mano. Quedan como plan B manual. |
| Bizum directo (Redsys) | Exige un TPV bancario y un contrato. Stripe ya lo ofrece. |

**Datos comprobados (octubre de 2026):**
- **Bizum en Stripe.** Lo admiten Checkout (en modo `payment`, no en suscripción) y Payment Links.
  - Solo en EUR. Mínimo de 0,50 € y máximo de 5.000 €.
  - Reembolsos totales y parciales durante 395 días; son asíncronos (`refund.updated` / `refund.failed`).
  - Las disputas se pueden abrir hasta 120 días después y se notifican con `charge.dispute.created`.
  - Para activarlo hay que darlo de alta en el Dashboard con el NIF/DNI. La capacidad se queda en *pending* hasta que Bizum la verifica. ([docs.stripe.com/payments/bizum](https://docs.stripe.com/payments/bizum))
- **Facturas.** `invoice_creation[enabled]=true` en Checkout envía la factura en PDF y el recibo cuando el pago se completa. Se cobra aparte de Invoicing. ([docs.stripe.com/payments/checkout/receipts](https://docs.stripe.com/payments/checkout/receipts))
- **IVA del 21 %.** El precio es final, con el IVA incluido. Para que la factura desglose la base y el IVA hay que crear en el Dashboard un tipo impositivo «IVA 21 %, incluido» y poner su id en `STRIPE_IVA_TAX_RATE`. Sin él, el total es el mismo. También se recoge el NIF de quien lo pida (`tax_id_collection`).
- **Verifactu.** Se ha aplazado a 2027 para autónomos y pymes. Antes de esa fecha, la facturación de Stripe tendrá que pasar por un software homologado, o emitirse desde el programa de facturación de Rodrigo. Hay que revisarlo con la gestoría.
- **Competencia.** Todos cobran un pago único por evento, sin suscripción:
  - Wedibox: gratis, 29, 49 o 79 $.
  - GuestCam: 49 o 97 $.
  - Fotelya: desde 49 €, con muro en directo en pantalla y datos en la UE.
  - Kululu: gratis, 39 o 99 $.

  Nuestros 89 € (179 € el Gestionado) están en la franja alta. Se justifican por la pantalla con el diseño de la boda y la integración con la invitación y el Libro.

**Fallos y reembolsos.**
- El pago se activa **solo** con el webhook (`payment_status = paid`). Los métodos diferidos esperan a `checkout.session.async_payment_succeeded`.
- `charge.refunded` marca el pago como «reembolsado» y `charge.dispute.created` como «disputado». En los dos casos se avisa al estudio, pero **no** se apaga solo: un reembolso puede ser parcial o de cortesía. Lo revierte el estudio con `fijarPlanDirecto`.
- Si se cobra y no se puede activar (por ejemplo, porque la boda no aparece), el pago queda registrado y el estudio recibe un aviso.

## 2. Qué se ha construido

| Pieza | Archivo |
|---|---|
| Precios y productos (de `momentos/planes.ts`) | `src/lib/pagos/productos.ts` |
| Checkout REST y firma del webhook | `src/lib/pagos/stripe.ts` |
| Tabla `pagos` (local: `.pagos-local/`) | `src/lib/pagos/datos.ts`, `supabase/migraciones/2026-11-pagos.sql` |
| Activar (la lógica de `fijarPlanDirecto`, `revalidatePath` y avisos) | `src/lib/pagos/activar.ts` |
| Acciones `estadoCompra` y `contratarDirecto` (con `exigirAccesoBoda`) | `src/lib/pagos/acciones.ts` |
| Webhook, idempotente por `event.id` | `src/app/api/pagos/stripe/route.ts` |
| Compra en el panel (F4 la monta) | `src/components/directo/ContratarDirecto.tsx` |
| Entrega: «Vuestro álbum» | `src/components/directo/VuestroAlbum.tsx` |
| Diseño de la pantalla, con vista previa | `src/components/directo/DisenoPantalla.tsx`, `VistaPantalla.tsx`, `src/lib/momentos/diseno.ts` |
| Pantalla de TV en 4 estilos | `src/app/directo/[slug]/Pantalla.tsx` |
| Vista previa sin datos | `src/app/directo/muestra/page.tsx` |
| Subida con pie de foto y pestaña «En directo» | `src/app/i/[slug]/momentos/SubidaMomentos.tsx` |
| Página de producto | `src/app/(sitio)/en-directo/page.tsx` y `src/components/directo/DemoEnDirecto.tsx` |

**Sin claves: modo demo.** Si no hay `STRIPE_SECRET_KEY` y estamos en desarrollo, con `INVITOO_MEMORIA=1` o con `PAGOS_DEMO=1`, al contratar se activa al momento y se avisa con «Modo demo: no se ha cobrado nada». En **producción sin clave no se vende**: nunca se regala.

## 3. Variables de entorno

| Variable | Para qué |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` / `sk_test_…`. Sin ella, modo demo (solo fuera de producción) o «no se vende». |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` del endpoint `https://invitoo.es/api/pagos/stripe`. Sin ella, el webhook rechaza todo con un 400. |
| `STRIPE_IVA_TAX_RATE` | Opcional. El `txr_…` del «IVA 21 % incluido», para el desglose en la factura. |
| `STRIPE_API_VERSION` | Opcional. Fija una versión de la API. |
| `PAGOS_DEMO=1` | Fuerza el modo demo (por ejemplo, en una preview de Vercel sin claves). |
| `NEXT_PUBLIC_SITIO_URL` | Base de las URL de vuelta (`/panel/<slug>/directo?pago=ok`). |

**Eventos del webhook que hay que activar:**
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `charge.refunded`
- `charge.dispute.created`

## 4. Producto (lo que ve cada uno)

- **Invitado.** La página `/i/<slug>/momentos` tiene dos pestañas.
  - **Subir:**
    - un mensaje opcional para la tanda, que viaja en la cola IndexedDB con cada foto;
    - cada foto puede llevar su propio mensaje, antes o después de subir, solo desde su móvil y durante 24 h (`ponerPie`).
  - **En directo:**
    - el muro de todos: Realtime si está configurado y, si no, polling de 6 s con la pestaña delante, 30 s detrás y nada con el móvil bloqueado; feed completo cada 2 min;
    - lo nuevo entra con un fundido y, si estás leyendo más abajo, espera arriba («3 nuevas · Ver») para que no salte nada;
    - al tocar una foto se abre a pantalla completa con el mensaje y el autor **debajo**, nunca encima; se pasa deslizando, con las flechas o con los botones, y se puede pedir que se retire.
- **TV.** Cuatro estilos: **Revista**, **Polaroid** (las fotos caen y se apilan, con el nombre escrito a mano), **Cine** (2,39:1, Ken Burns y viñeta) y **Mosaico** (12 teselas que se renuevan de una en una).
  - Marco con las iniciales en el margen, y paleta y tipografía de la invitación.
  - Portada con la frase de los novios y el QR grande.
  - Rótulo animado al lanzar un momento.
  - Mensajes como tarjetas manuscritas (Caveat).
  - **Ningún texto pisa una foto:** el pie, los nombres, el contador y el QR van en una banda inferior reservada.
  - Nunca pasa por negro y respeta `prefers-reduced-motion`.
- **Novios:**
  - en `ControlDirecto`:
    - «Diseño de la pantalla», con una vista previa en vivo que se actualiza por postMessage;
    - «Ampliar» (o «Contratar», si aún es el álbum);
  - `VuestroAlbum`: el ZIP con las fotos y los vídeos, `abrid-aqui.html` (el álbum sin conexión, cada foto con su pie) y `mensajes.txt`.
  - **Libro de buenos deseos (F4):** lee los pies de `momentos.mensaje` (fotos y vídeos) con el origen «directo»; la campana suena una vez por tanda.

## 5. Pendiente o para decidir

- **Rodrigo:** la política de devolución («si no lo habéis usado, os devolvemos el dinero»). Está escrita así en la web y en el panel: confirmadla o cambiadla.
- **Rodrigo:**
  - dar de alta Bizum y el tipo impositivo en Stripe;
  - decidir cómo emitir las facturas de cara a Verifactu.
- **F4:**
  - usar `ContratarDirecto` en lugar de `ContratarDirectoPanel`;
  - que el candado mire también `directo.plan`;
  - montar `VuestroAlbum`.
- **F3:** enlazar `/en-directo` desde el menú, la portada y `/precios`.
- La lista del Gestionado («Modo carrete», «Vídeo resumen») viene de antes: hay que confirmar que se presta.
