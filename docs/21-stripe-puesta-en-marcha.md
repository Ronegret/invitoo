# 21 · Stripe: puesta en marcha paso a paso

Para Rodrigo. No hace falta saber nada de Stripe: sigue los pasos en orden. Mientras no termines, la web funciona igual: en local cobra «de mentira» (modo demo) y en producción, sin claves, los botones de reservar llevan a WhatsApp. Nunca se regala nada.

> **Qué se cobra ya por Stripe, todo con el mismo webhook:**
> 1. **Los planes** en /precios: «Reservar por 149 €» (Invitoo) y «Reservar por 249 €» (Con canción). Stripe pide el email, el teléfono, los nombres de los dos novios y la fecha de la boda. Al pagar, la reserva aparece en **/estudio/solicitudes** («Reservas pagadas»), a la pareja le llega un correo de confirmación y a ti un aviso.
> 2. **El Estudio y cualquier presupuesto**: en **/estudio/cobros** pones el importe, el concepto y, si quieres, la boda. Puedes cobrar todo o una señal (por ejemplo, el 50 %) y el resto después. Sale un enlace `invitoo.es/pagar/…` para mandarlo por WhatsApp o por email.
> 3. **En directo** (89 €, 179 € y el año extra de 19 €) desde el panel de los novios, como hasta ahora.
>
> Los enlaces sueltos de pago (`NEXT_PUBLIC_PAGO_INVITOO` y `NEXT_PUBLIC_PAGO_CANCION`) ya no se usan. **Desactiva esos Payment Links en Stripe**, porque nadie se enteraba de quién pagaba.

---

## 1. Crear la cuenta y verificarla

1. Entra en <https://dashboard.stripe.com/register> con `info@invitoo.es` y elige **España** como país.
2. Ve a **Activar pagos** (o **Configuración → Datos de la empresa**) y rellena:
   - **Tipo de empresa:** autónomo («Persona física / empresario individual») o sociedad, según lo que seas.
   - **DNI/NIE** (autónomo) o **NIF** de la sociedad. **Bizum lo exige** (ver paso 2).
   - Domicilio, teléfono y fecha de nacimiento.
   - **Sitio web:** `https://invitoo.es`. **Descripción:** «Invitaciones de boda digitales a medida».
   - **Descriptor del extracto:** `INVITOO` (es lo que verá la pareja en el banco).
   - **Cuenta bancaria (IBAN)** donde quieres recibir el dinero.
3. **Configuración → Datos públicos de la empresa:** pon el email de soporte (`info@invitoo.es`), el teléfono y, en **Condiciones del servicio**, `https://invitoo.es/condiciones`. Ojo: esa página es un borrador; revísala antes con tu asesor (ver paso 10).
4. Stripe puede pedirte una foto del DNI. Hasta que no verifique, solo funciona el **modo de prueba**, y no pasa nada: todo lo que sigue se puede probar así.

## 2. Activar tarjeta, Apple Pay, Google Pay y Bizum

**Configuración → Pagos → Métodos de pago** (<https://dashboard.stripe.com/settings/payment_methods>).

- **Tarjetas:** activadas por defecto.
- **Apple Pay y Google Pay:** actívalos. Con Checkout no hace falta verificar el dominio: Stripe los enseña solo en los móviles y navegadores que los admiten.
- **Bizum:** pulsa **Activar**. Requisitos:
  - Cuenta en España, cobros en euros. Mínimo 0,50 € y máximo 5.000 € por pago.
  - Haber puesto el **DNI/NIE** (autónomo) o el **NIF** (sociedad) en **Configuración → Impuestos** y el tipo de empresa.
  - **La capacidad se queda en «Pendiente» hasta que Bizum verifica la cuenta.** Mientras tanto, Checkout simplemente no lo enseña; no hay que tocar nada en el código. Si tarda, escribe al soporte de Stripe.
  - Los reembolsos de Bizum tardan unos minutos. Si uno falla, te llega un aviso («Un reembolso no ha llegado») y hay que devolverlo por otra vía.
- No actives métodos que tarden días (como el adeudo SEPA) si no quieres esperar: el código los soporta, pero la reserva no llega hasta que el banco confirma.

El código **no** fija los métodos (`payment_method_types`): lo que actives aquí es lo que sale en Checkout.

## 3. Correos de Stripe: recibo y factura

**Configuración → Correos electrónicos de clientes:** activa **Pagos correctos** y **Reembolsos**. El código pide a Stripe que emita una **factura** en cada pago (`invoice_creation`), con el IVA incluido, y Stripe la manda por correo con el recibo. La facturación de Checkout tiene una pequeña comisión aparte (consúltala en la página de precios de Stripe).

**IVA desglosado (opcional, recomendado):** **Productos → Tipos impositivos → Nuevo**, con estos datos:
- Nombre visible: `IVA`
- Porcentaje: `21`
- **Incluido en el precio:** sí (*inclusive*)
- Jurisdicción: España

Copia su id (`txr_…`) en `STRIPE_IVA_TAX_RATE` (paso 4). Sin él se cobra lo mismo, pero la factura no separa base e IVA.

## 4. Las claves: en Vercel y en tu ordenador

**Desarrolladores → Claves de API.** Arriba a la derecha está el interruptor **Modo de prueba**: las claves de prueba empiezan por `sk_test_`, las reales por `sk_live_`.

| Variable | Qué es | Dónde se saca |
|---|---|---|
| `STRIPE_SECRET_KEY` | Clave secreta. **Solo servidor.** | Claves de API → «Clave secreta» |
| `STRIPE_WEBHOOK_SECRET` | Secreto de firma del webhook (`whsec_…`) | Paso 5 (o `stripe listen` en local) |
| `STRIPE_IVA_TAX_RATE` | Opcional, `txr_…` | Paso 3 |
| `STRIPE_CONDICIONES` | Opcional, `1` = casilla «Acepto las condiciones» | Paso 6 |
| `NEXT_PUBLIC_SITIO_URL` | `https://invitoo.es` | — |
| `ESTUDIO_EMAIL` | Tu correo, para los avisos de reservas, cobros, reembolsos y disputas | — |
| `RESEND_API_KEY` | Para mandar el correo de confirmación a la pareja | resend.com (si ya lo usas para Avisos, es la misma) |

**En Vercel:** proyecto → **Settings → Environment Variables**. Añade cada una en **Production** (y, si quieres, en Preview con las claves de **prueba**). Después, **Deployments → … → Redeploy** para que las coja.

**En local:** copia `app/.env.example` a `app/.env.local` y rellena solo lo que necesites. **Nunca subas `.env.local` a git** (ya está en `.gitignore`) ni pegues claves en el chat, en un issue o en el código. La clave secreta no lleva el prefijo `NEXT_PUBLIC_`, y así debe seguir: con ese prefijo llegaría al navegador.

Sin `STRIPE_SECRET_KEY` en local, todo va en **modo demo**: se puede reservar, pagar un cobro y ver el «gracias» con el aviso «Modo demo: no se ha cobrado nada».

## 5. Crear el webhook

El webhook es la llamada con la que Stripe le dice a la web «esta pareja ha pagado». Sin él, el pago se cobra pero nadie se entera: ni sale la reserva ni se manda el correo.

1. **Desarrolladores → Webhooks → Añadir destino** (o «Añadir endpoint»).
2. **URL:** `https://invitoo.es/api/pagos/stripe`
3. **Eventos** (marca exactamente estos siete):
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
   - `refund.failed`
4. Guarda, entra en el webhook y en **Secreto de firma** pulsa **Mostrar**. Ese `whsec_…` va en `STRIPE_WEBHOOK_SECRET` en Vercel. Redeploy.
5. Haz uno en **modo de prueba** y otro en **modo real**: cada modo tiene su webhook y su secreto.

El webhook rechaza (400) cualquier llamada que no venga firmada por Stripe, ignora los avisos repetidos (Stripe reintenta hasta 3 días) y, si la base de datos falla, responde 500 para que Stripe lo vuelva a intentar.

## 6. La casilla «Acepto las condiciones» (opcional)

Checkout ya enseña junto al botón «Al pagar aceptáis las condiciones de contratación (invitoo.es/condiciones)». Si además quieres una **casilla obligatoria**:

1. Pon `https://invitoo.es/condiciones` en **Configuración → Datos públicos de la empresa → Condiciones del servicio** (paso 1.3). **Sin esa URL, Stripe rechaza el pago entero.**
2. Pon `STRIPE_CONDICIONES=1` en Vercel y redeploy.
3. Prueba una reserva en modo de prueba para comprobar que sale la casilla.

## 7. Los códigos de descuento (invitados que se casan)

La web promete 20 € menos con el código de la boda de la que vienen (el slug, por ejemplo `ana-y-luis`). Checkout ya tiene la casilla «Añadir código promocional» en los planes; los códigos se crean en Stripe:

1. **Productos → Cupones → Nuevo:** «Invitado de boda», **importe fijo 20 €**, EUR, duración «una vez».
2. Dentro del cupón, **Añadir código promocional** con el slug de cada boda publicada (`ana-y-luis`). Se admiten letras, números y guiones; Stripe no distingue mayúsculas.
3. Si quieres, limita cada código a unos cuantos usos.

En los cobros del Estudio no se admiten códigos: el presupuesto ya está hablado.

## 8. Probar en local con la CLI de Stripe

1. Instala la CLI: <https://docs.stripe.com/stripe-cli> y ejecuta `stripe login`.
2. En `app/.env.local`, pon tu `STRIPE_SECRET_KEY=sk_test_…`.
3. En una terminal: `stripe listen --forward-to localhost:3100/api/pagos/stripe`. Te imprime un `whsec_…`: ponlo en `STRIPE_WEBHOOK_SECRET` de `app/.env.local`.
4. En otra terminal, arranca la web en el puerto 3100: `cd app && npx next dev -p 3100`.
5. Ve a <http://localhost:3100/precios>, pulsa **Reservar por 149 €** y paga con una **tarjeta de prueba**:
   - `4242 4242 4242 4242`: pago correcto (cualquier fecha futura, cualquier CVC y cualquier código postal).
   - `4000 0025 0000 3155`: pide autenticación 3D Secure.
   - `4000 0000 0000 9995`: tarjeta rechazada.
   - `4000 0000 0000 0259`: el pago se cobra y después llega una disputa.
6. Comprueba: la página «gracias» con vuestros nombres, la reserva en **/estudio/solicitudes**, el correo en el log (o en tu bandeja, con Resend) y el evento `200` en la terminal de `stripe listen`.
7. Para reembolsar, en el Dashboard: **Pagos → el pago → Reembolsar**. La reserva pasa a «reembolsado» y te llega el aviso.

Sin la CLI también se puede probar el flujo entero: sin `STRIPE_SECRET_KEY` y con `INVITOO_MEMORIA=1`, todo funciona en **modo demo**. Los scripts de QA están en `qa/v3/p2/` (`flujo.mjs` y `webhook.mjs`).

## 9. Aplicar la migración de Supabase

Añade la tabla `pedidos` (reservas y cobros) y deja que `pagos` guarde también planes y cobros. Necesita que `2026-11-pagos.sql` ya esté aplicada.

```bash
node herramientas/db.mjs migrar
```

(usa `SUPABASE_DB_URL` de `app/.env.local`; aplica todas las migraciones en orden y se puede repetir sin problema). También vale copiar `supabase/migraciones/2026-11-planes-pago.sql` en **Supabase → SQL Editor** y ejecutarla. **Hazlo antes de activar las claves reales**: sin la migración, el webhook de un plan responde 500 y Stripe reintenta hasta que la tabla exista.

## 10. Lo legal antes de cobrar de verdad

- **Datos del titular:** en `app/src/lib/legal.ts` están `[RAZÓN SOCIAL]`, `[NIF]` y `[DOMICILIO]`. Sustitúyelos (salen en el aviso legal, la privacidad y las condiciones).
- **Condiciones de contratación** (`/condiciones`): es un **borrador; revísalo con tu asesor**. La propuesta es esta: devolución íntegra hasta que empieza el diseño y, desde entonces, ninguna, por ser un servicio hecho a medida (art. 103 TRLGDCU). Para que valga, **antes de empezar el diseño hay que pedir por escrito la conformidad expresa de la pareja** («Os confirmamos que empezamos; desde ahora renunciáis al desistimiento»). Pregúntale al asesor cómo dejar constancia de ella (email, WhatsApp o una casilla en el panel).

## 11. Facturas y Verifactu

- Stripe emite y manda una factura por cada pago, con el IVA incluido. **No está garantizado que las facturas de Stripe cumplan Verifactu:** Stripe no se presenta como un sistema de facturación adaptado a Verifactu (no hay homologación; cada programa declara por su cuenta que cumple).
- **Verifactu será obligatorio el 1 de enero de 2027 para las sociedades y el 1 de julio de 2027 para los autónomos.** Desde entonces, las facturas tienen que salir de un programa de facturación que cumpla el reglamento (con su QR y el registro enviado a Hacienda).
- **Recomendación:** pregunta a tu asesor y usa un programa de facturación compatible con Verifactu (muchos importan los cobros de Stripe). Si el asesor lo pide, se puede desactivar la factura de Stripe y dejar solo el recibo: es una línea en `app/src/lib/pagos/stripe.ts` (`invoice_creation`).

## 12. Pasar de prueba a real

1. Comprueba que la cuenta está **verificada** (paso 1) y que Bizum está activo o, si sigue pendiente, que no lo prometes.
2. Aplica la **migración** (paso 9).
3. Apaga **Modo de prueba** en el Dashboard y repite el **paso 5** (webhook real, con su `whsec_` real).
4. Crea otra vez, en real, el **tipo impositivo** del IVA y los **cupones y códigos** (los de prueba no pasan a real).
5. En Vercel (**Production**), cambia `STRIPE_SECRET_KEY` por la `sk_live_…`, `STRIPE_WEBHOOK_SECRET` por el `whsec_` real y `STRIPE_IVA_TAX_RATE` por el `txr_` real. Redeploy.
6. Haz **una reserva real de verdad** con tu tarjeta y reembólsatela desde el Dashboard. Comprueba la reserva en la bandeja, el correo, el aviso del reembolso y la factura.
7. Desactiva los Payment Links antiguos y borra `NEXT_PUBLIC_PAGO_INVITOO` y `NEXT_PUBLIC_PAGO_CANCION` de Vercel.

## Dónde está cada cosa en el código

| Qué | Archivo |
|---|---|
| Checkout por REST, firma del webhook y `firmarParaPrueba` | `app/src/lib/pagos/stripe.ts` |
| Productos y precios (salen de `planes-boda.ts` y `momentos/planes.ts`) | `app/src/lib/pagos/productos.ts` |
| Modo stripe / demo / sin cobro | `app/src/lib/pagos/modo.ts` |
| Reservar un plan y pagar un cobro (acciones públicas) | `app/src/lib/pagos/acciones-planes.ts` |
| Cobrar, señal y resto, bandeja de reservas (acciones del estudio) | `app/src/lib/pagos/acciones-estudio.ts` |
| Lo que pasa al pagar (pedido, correo y avisos) y los reembolsos | `app/src/lib/pagos/cobrar.ts` |
| Pedidos (reservas y cobros) | `app/src/lib/pagos/pedidos.ts` |
| Webhook | `app/src/app/api/pagos/stripe/route.ts` |
| Páginas | `/gracias`, `/pagar/[token]`, `/pagar/demo/[plan]`, `/condiciones`, `/estudio/cobros` |
