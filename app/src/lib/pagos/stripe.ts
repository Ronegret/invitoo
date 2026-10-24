import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Producto } from "./productos";

/**
 * Stripe, sin SDK: dos llamadas REST y la verificación de la firma del
 * webhook (HMAC-SHA256, el mismo algoritmo que usa `stripe.webhooks
 * .constructEvent`). Así no hay dependencia nueva ni versión de API
 * fijada por un paquete.
 *
 * Variables:
 *   STRIPE_SECRET_KEY       sk_live_… / sk_test_…  (sin ella: modo demo)
 *   STRIPE_WEBHOOK_SECRET   whsec_…                 (sin ella: el webhook rechaza todo)
 *   STRIPE_API_VERSION      opcional; si falta, la de la cuenta
 *   STRIPE_IVA_TAX_RATE     opcional: id `txr_…` de un tipo «IVA 21 %, incluido»
 *                           (Dashboard → Productos → Tipos impositivos). Con él la
 *                           factura desglosa base e IVA; sin él, el total es el mismo.
 *   STRIPE_CONDICIONES      opcional: "1" = casilla obligatoria «Acepto las
 *                           condiciones» en Checkout (antes, la URL en el Dashboard).
 */

const API = "https://api.stripe.com/v1";
const TIEMPO_MS = 15_000;

export function stripeConfigurado() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function cabeceras(extra: Record<string, string> = {}) {
  const h: Record<string, string> = {
    authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    "content-type": "application/x-www-form-urlencoded",
    ...extra,
  };
  if (process.env.STRIPE_API_VERSION) h["stripe-version"] = process.env.STRIPE_API_VERSION;
  return h;
}

/** `{ a: { b: 1 } }` → `a[b]=1`, como lo quiere la API de Stripe. */
function formulario(datos: Record<string, unknown>, prefijo = "", salida = new URLSearchParams()) {
  for (const [k, v] of Object.entries(datos)) {
    if (v === undefined || v === null) continue;
    const clave = prefijo ? `${prefijo}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === "object" ? formulario(x as Record<string, unknown>, `${clave}[${i}]`, salida) : salida.append(`${clave}[${i}]`, String(x))));
    else if (typeof v === "object") formulario(v as Record<string, unknown>, clave, salida);
    else salida.append(clave, String(v));
  }
  return salida;
}

export type SesionCheckout = { id: string; url: string };

/** Lo que se cobra: una sola línea, con el importe que decide el servidor. */
export type LineaCobro = { nombre: string; descripcion?: string; importe: number };

/**
 * Una sesión de Stripe Checkout. Es la ÚNICA función que crea sesiones: la
 * usan En directo (panel), los planes (/precios) y los cobros del Estudio
 * (/pagar/<token>). Lo que el webhook necesita viaja en `metadata` (de la
 * sesión y del pago), con `tipo` = "directo" | "plan" | "cobro".
 *
 *  · `payment_method_types` NO se fija: Checkout enseña lo que esté activo
 *    en el Dashboard (tarjeta, Apple Pay, Google Pay y Bizum si la cuenta
 *    lo tiene aprobado).
 *  · `invoice_creation`: Stripe emite factura con el IVA incluido.
 *  · `datosBoda`: pide teléfono y, con `custom_fields` (máximo 3 en Stripe),
 *    los nombres de los dos novios y la fecha de la boda.
 *  · `custom_text.submit`: el aviso de las condiciones junto al botón. Con
 *    STRIPE_CONDICIONES=1, además, la casilla obligatoria de Stripe
 *    (`consent_collection.terms_of_service`), que EXIGE haber puesto la URL de
 *    las condiciones en el Dashboard (Configuración → Datos públicos); sin
 *    ella, Stripe rechaza la sesión. Ver docs/21.
 *  · `Idempotency-Key`: un doble clic no crea dos sesiones.
 */
export async function crearCheckout(o: {
  linea: LineaCobro;
  metadata: Record<string, string>;
  exito: string;
  cancelar: string;
  origen: string;
  email?: string | null;
  referencia?: string | null;
  descripcionPago: string;
  descripcionFactura: string;
  datosBoda?: boolean;
  codigos?: boolean;
  boton?: "pay" | "book";
  idempotencia?: string;
}): Promise<SesionCheckout> {
  const condiciones = `${o.origen.replace(/^https?:\/\//, "")}/condiciones`;
  const cuerpo = formulario({
    mode: "payment",
    locale: "es",
    submit_type: o.boton ?? "pay",
    client_reference_id: o.referencia || undefined,
    customer_email: o.email || undefined,
    success_url: o.exito,
    cancel_url: o.cancelar,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: o.linea.importe,
          tax_behavior: "inclusive",
          product_data: { name: o.linea.nombre.startsWith("Invitoo") ? o.linea.nombre : `Invitoo · ${o.linea.nombre}`, description: o.linea.descripcion || undefined },
        },
        tax_rates: process.env.STRIPE_IVA_TAX_RATE ? [process.env.STRIPE_IVA_TAX_RATE] : undefined,
      },
    ],
    metadata: o.metadata,
    payment_intent_data: { metadata: o.metadata, description: o.descripcionPago },
    invoice_creation: {
      enabled: true,
      invoice_data: {
        metadata: o.metadata,
        description: o.descripcionFactura,
        rendering_options: { amount_tax_display: "include_inclusive_tax" },
        footer: "Invitoo · Precio con IVA (21 %) incluido.",
      },
    },
    phone_number_collection: o.datosBoda ? { enabled: true } : undefined,
    custom_fields: o.datosBoda
      ? [
          { key: "novioa", label: { type: "custom", custom: "Nombre de uno de los novios" }, type: "text", text: { minimum_length: 2, maximum_length: 60 } },
          { key: "noviob", label: { type: "custom", custom: "Nombre del otro" }, type: "text", text: { minimum_length: 2, maximum_length: 60 } },
          { key: "fecha", label: { type: "custom", custom: "Fecha de la boda (si ya la tenéis)" }, type: "text", optional: true, text: { maximum_length: 40 } },
        ]
      : undefined,
    custom_text: {
      submit: { message: `Al pagar aceptáis las condiciones de contratación (${condiciones}).` },
    },
    consent_collection: process.env.STRIPE_CONDICIONES === "1" ? { terms_of_service: "required" } : undefined,
    allow_promotion_codes: o.codigos ?? true,
    billing_address_collection: "auto",
    tax_id_collection: { enabled: true },
  });
  const r = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: cabeceras(o.idempotencia ? { "idempotency-key": o.idempotencia } : {}),
    body: cuerpo,
    signal: AbortSignal.timeout(TIEMPO_MS),
  });
  const j = (await r.json().catch(() => ({}))) as { id?: string; url?: string; error?: { message?: string } };
  if (!r.ok || !j.id || !j.url) throw new Error(`Stripe ${r.status}: ${j.error?.message ?? "sin url"}`);
  return { id: j.id, url: j.url };
}

/**
 * La sesión de En directo de una boda (panel). Igual que antes, ahora con
 * `tipo: "directo"` en la metadata (el webhook también acepta las antiguas,
 * sin `tipo`).
 */
export async function crearSesionCheckout(o: {
  producto: Producto;
  slug: string;
  invitacionId: string;
  email?: string | null;
  origen: string;
  vuelta: string;
}): Promise<SesionCheckout> {
  const metadata = { tipo: "directo", slug: o.slug, invitacion_id: o.invitacionId, producto: o.producto.id };
  const minuto = Math.floor(Date.now() / 60_000);
  return crearCheckout({
    linea: { nombre: o.producto.nombre, descripcion: o.producto.resumen, importe: o.producto.importe },
    metadata,
    origen: o.origen,
    exito: `${o.origen}${o.vuelta}?pago=ok&sesion={CHECKOUT_SESSION_ID}`,
    cancelar: `${o.origen}${o.vuelta}?pago=cancelado`,
    email: o.email,
    referencia: o.invitacionId,
    descripcionPago: `${o.producto.nombre} · ${o.slug}`,
    descripcionFactura: `${o.producto.nombre} para la boda ${o.slug}`,
    idempotencia: `ck-${o.invitacionId}-${o.producto.id}-${minuto}`,
  });
}

/** Lo que se lee de una sesión para la página de gracias y el webhook. */
export type SesionStripe = {
  id: string;
  status?: string | null;
  payment_status?: string;
  payment_intent?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_details?: { email?: string | null; phone?: string | null; name?: string | null } | null;
  metadata?: Record<string, string> | null;
  custom_fields?: { key: string; text?: { value?: string | null } | null }[] | null;
  total_details?: { amount_discount?: number | null } | null;
};

export const ID_SESION = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

/** GET de una sesión (para /gracias). `null` si no hay clave o no existe. */
export async function leerSesionCheckout(id: string): Promise<SesionStripe | null> {
  if (!stripeConfigurado() || !ID_SESION.test(id)) return null;
  try {
    const r = await fetch(`${API}/checkout/sessions/${id}`, {
      headers: cabeceras(),
      signal: AbortSignal.timeout(TIEMPO_MS),
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as SesionStripe;
  } catch {
    return null;
  }
}

/** El valor de un `custom_field` de texto, limpio. */
export function campoDe(s: SesionStripe, clave: string, max = 80): string | null {
  const v = s.custom_fields?.find((c) => c.key === clave)?.text?.value;
  const limpio = String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return limpio || null;
}

/**
 * Verifica la cabecera `Stripe-Signature` (`t=…,v1=…[,v1=…]`) contra el
 * cuerpo CRUDO. Rechaza firmas de más de `tolerancia` segundos (repetición).
 */
export function firmaValida(cuerpo: string, cabecera: string | null, secreto: string, tolerancia = 300) {
  if (!cabecera || !secreto) return false;
  const partes = cabecera.split(",").map((x) => x.trim().split("="));
  const t = Number(partes.find(([k]) => k === "t")?.[1]);
  const firmas = partes.filter(([k]) => k === "v1").map(([, v]) => v ?? "");
  if (!Number.isFinite(t) || !firmas.length) return false;
  if (Math.abs(Date.now() / 1000 - t) > tolerancia) return false;
  const esperada = Buffer.from(createHmac("sha256", secreto).update(`${t}.${cuerpo}`).digest("hex"));
  return firmas.some((f) => {
    const b = Buffer.from(f);
    return b.length === esperada.length && timingSafeEqual(b, esperada);
  });
}

/** Para firmar eventos de prueba en QA (mismo algoritmo, al revés). */
export function firmarParaPrueba(cuerpo: string, secreto: string, t = Math.floor(Date.now() / 1000)) {
  return `t=${t},v1=${createHmac("sha256", secreto).update(`${t}.${cuerpo}`).digest("hex")}`;
}
