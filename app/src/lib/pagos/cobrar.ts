import "server-only";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { avisarEstudio, avisarPorSlug } from "@/lib/avisos/avisar";
import { enviarEmail, plantillaCorreo } from "@/lib/avisos/email";
import { enlaceWhatsApp } from "@/lib/contacto";
import { programar } from "@/lib/correos/programar";
import { SITIO_URL } from "@/lib/enlaces";
import { cambiarEstadoPago, olvidarEvento, registrarPago, type EstadoPago } from "./datos";
import { cambiarPedido, pedidoDePlan, pedidoPorId, pedidoPorPago, type EstadoPagoPedido, type Pedido } from "./pedidos";
import { esPlanCerrado, euros, PLANES_PAGO } from "./productos";

/**
 * Lo que pasa cuando llega el pago de un PLAN o de un COBRO del Estudio.
 * Una sola función para el webhook firmado y para el modo demo: así lo que
 * se prueba en local es exactamente lo que corre en producción.
 *
 * Orden (para que un reintento de Stripe nunca deje las cosas a medias):
 *   1. Se apunta el evento en `pagos` (clave única: idempotencia). Si ya
 *      estaba, no se hace nada más.
 *   2. Se crea (plan) o se marca pagado (cobro) el pedido. Si falla, se
 *      borra el apunte del paso 1 y se responde «reintentar» (500): Stripe
 *      lo vuelve a mandar y empieza de cero.
 *   3. Solo entonces, los avisos: el email de confirmación a la pareja
 *      (Resend; sin clave, al log) y el aviso al estudio.
 */

export type PagoRecibido = {
  /** `evt_…` de Stripe o `demo_…`. */
  evento: string;
  demo: boolean;
  tipo: "plan" | "cobro";
  /** En un plan: «invitoo» | «cancion». En un cobro: el id del pedido. */
  plan?: string | null;
  pedidoId?: string | null;
  sesion: string | null;
  pagoStripe: string | null;
  /** Lo cobrado de verdad, en céntimos (con el descuento ya aplicado). */
  importe: number;
  descuento?: number | null;
  email: string | null;
  telefono: string | null;
  novios?: { a: string | null; b: string | null };
  fecha?: string | null;
};

export type ResultadoPago =
  | { ok: true; pedido: Pedido | null; repetido?: boolean; ignorado?: string }
  | { ok: false; reintentar: true; error: string };

const REINTENTAR = (error: string): ResultadoPago => ({ ok: false, reintentar: true, error });

export async function procesarPago(p: PagoRecibido): Promise<ResultadoPago> {
  return p.tipo === "plan" ? pagoDePlan(p) : pagoDeCobro(p);
}

// ─────────────────────────────────────────────────────────────────── plan

async function pagoDePlan(p: PagoRecibido): Promise<ResultadoPago> {
  if (!esPlanCerrado(p.plan)) {
    console.error("[pagos.plan] plan desconocido", p.plan, p.sesion);
    luego(() => avisarEstudio("Pago de un plan que no reconocemos", [{ titulo: `Sesión ${p.sesion ?? "—"}`, detalle: String(p.plan) }], "/estudio/solicitudes"));
    return { ok: true, pedido: null, ignorado: "plan desconocido" };
  }
  const plan = PLANES_PAGO[p.plan];
  const estado: EstadoPago = p.demo ? "demo" : "pagado";

  const nuevo = await registrarPago({
    evento: p.evento,
    invitacion_id: null,
    slug: null,
    producto: plan.id,
    importe: p.importe,
    moneda: "eur",
    estado,
    sesion: p.sesion,
    pago_stripe: p.pagoStripe,
    email: p.email,
  });
  if (nuevo === null) return REINTENTAR("Base no disponible");
  if (!nuevo) return { ok: true, pedido: null, repetido: true };

  const a = p.novios?.a ?? null;
  const b = p.novios?.b ?? null;
  const pareja = a && b ? `${a} y ${b}` : (a ?? b);
  const r = await pedidoDePlan({
    tipo: "plan",
    plan: plan.id,
    concepto: `Reserva · ${plan.nombre}`,
    importe: plan.importe,
    parte: "total",
    total: null,
    grupo: null,
    invitacion_id: null,
    slug: null,
    pareja,
    fecha_boda: p.fecha ?? null,
    email: p.email,
    telefono: p.telefono,
    estado_pago: p.demo ? "demo" : "pagado",
    sesion: p.sesion ?? p.evento,
    pago_stripe: p.pagoStripe,
    pagado: p.importe,
    descuento: p.descuento ?? null,
    pagado_en: new Date().toISOString(),
  });
  if (!r) {
    await olvidarEvento(p.evento);
    return REINTENTAR("No se pudo crear el pedido");
  }
  if (!r.nuevo) {
    // Otro evento de la misma sesión: el pago ya está apuntado con el primero.
    await olvidarEvento(p.evento);
    return { ok: true, pedido: r.pedido, repetido: true };
  }

  const pedido = r.pedido;
  // E3: un solo correo a la pareja al pagar. La bienvenida de lib/correos ES
  // la confirmación de la reserva (plan, importe, IVA/factura o demo,
  // videollamada, plazo, condiciones y devolución); el antiguo «Vuestra
  // invitación está reservada» se ha quitado para no mandar dos.
  // Alerta al estudio y bienvenida a la pareja (lib/correos, idempotentes).
  luego(() => programar({
    evento: "pago",
    pedidoId: pedido.id,
    email: p.email,
    pareja,
    nombres: { a, b },
    fecha: p.fecha ?? null,
    plan: plan.nombre,
    plazo: plan.plazo,
    importe: p.importe,
    demo: p.demo,
  }));
  refrescarEstudio();
  console.info("[pagos.plan]", JSON.stringify({ pedido: pedido.id, plan: plan.id, importe: p.importe, demo: p.demo }));
  return { ok: true, pedido };
}

// ────────────────────────────────────────────────────────────────── cobro

async function pagoDeCobro(p: PagoRecibido): Promise<ResultadoPago> {
  const pedido = p.pedidoId ? await pedidoPorId(p.pedidoId) : null;
  if (!pedido || pedido.tipo !== "cobro") {
    console.error("[pagos.cobro] pedido no encontrado", p.pedidoId, p.sesion);
    luego(() => avisarEstudio("Pago de un cobro que no encontramos", [{ titulo: `Sesión ${p.sesion ?? "—"}`, detalle: `${euros(p.importe)} · pedido ${p.pedidoId ?? "—"}` }], "/estudio/cobros"));
    return { ok: true, pedido: null, ignorado: "pedido no encontrado" };
  }
  if (pedido.estado_pago === "pagado" || pedido.estado_pago === "demo") {
    return { ok: true, pedido, repetido: true };
  }

  const nuevo = await registrarPago({
    evento: p.evento,
    invitacion_id: pedido.invitacion_id,
    slug: pedido.slug,
    producto: "cobro",
    pedido_id: pedido.id,
    importe: p.importe,
    moneda: "eur",
    estado: p.demo ? "demo" : "pagado",
    sesion: p.sesion,
    pago_stripe: p.pagoStripe,
    email: p.email ?? pedido.email,
  });
  if (nuevo === null) return REINTENTAR("Base no disponible");
  if (!nuevo) return { ok: true, pedido, repetido: true };

  const hecho = await cambiarPedido(pedido.id, {
    estado_pago: p.demo ? "demo" : "pagado",
    sesion: p.sesion,
    pago_stripe: p.pagoStripe,
    pagado: p.importe,
    descuento: p.descuento ?? null,
    pagado_en: new Date().toISOString(),
    email: pedido.email ?? p.email,
    telefono: pedido.telefono ?? p.telefono,
  });
  if (!hecho) {
    await olvidarEvento(p.evento);
    return REINTENTAR("No se pudo marcar el cobro");
  }

  const parte = hecho.parte === "senal" ? "Señal" : hecho.parte === "resto" ? "Resto" : "Pago";
  luego(() => correoCobro(hecho, p.demo));
  // Alerta al estudio (lib/correos, plantilla «alerta-cobro»).
  luego(() => programar({
    evento: "cobro",
    pedidoId: hecho.id,
    importe: p.importe,
    concepto: `${hecho.concepto} · ${parte}${hecho.total ? ` de ${euros(hecho.total)}` : ""}`,
    pareja: hecho.pareja,
    slug: hecho.slug,
    demo: p.demo,
  }));
  const slug = hecho.slug;
  if (slug) {
    luego(() => avisarPorSlug(slug, {
      tipo: "solicitud",
      titulo: `Pago recibido: ${euros(p.importe)}`,
      detalle: `${hecho.concepto}${p.demo ? " · Modo demo: no se ha cobrado nada." : ""}`,
      enlace: `/panel/${slug}`,
    }));
  }
  refrescarEstudio();
  console.info("[pagos.cobro]", JSON.stringify({ pedido: hecho.id, parte: hecho.parte, importe: p.importe, demo: p.demo }));
  return { ok: true, pedido: hecho };
}

async function correoCobro(pedido: Pedido, demo: boolean) {
  if (!pedido.email) return;
  const { html, texto } = plantillaCorreo({
    saludo: pedido.pareja ? `Gracias, ${pedido.pareja}` : "Gracias: pago recibido",
    lineas: [
      { titulo: `${pedido.concepto} · ${euros(pedido.pagado ?? pedido.importe)}`, detalle: demo ? "Modo demo: no se ha cobrado nada." : "IVA incluido. La factura os llega de Stripe en otro correo." },
      ...(pedido.parte === "senal" && pedido.total
        ? [{ titulo: `Queda el resto: ${euros(pedido.total - pedido.importe)}`, detalle: "Os mandaremos el enlace cuando toque. No tenéis que hacer nada ahora." }]
        : []),
    ],
    boton: { texto: "Escribirnos por WhatsApp", url: enlaceWhatsApp(`Hola, acabamos de pagar «${pedido.concepto}».`) },
    pie: `Condiciones de contratación: ${SITIO_URL}/condiciones.`,
  });
  await enviarEmail({ para: [pedido.email], asunto: `${demo ? "[Demo] " : ""}Pago recibido · Invitoo`, html, texto });
}

// ─────────────────────────────────────────────── reembolsos y disputas

/**
 * Un reembolso o una disputa de CUALQUIER pago (En directo, plan o cobro):
 * se cambia el estado en `pagos` y, si es de un pedido, también en él.
 * Nunca se apaga nada solo: lo decide el estudio.
 */
export async function revertirPago(
  pagoStripe: string,
  estado: Extract<EstadoPago, "reembolsado" | "disputado" | "pagado">,
): Promise<{ resumen: string; detalle: string | null }> {
  const fila = await cambiarEstadoPago(pagoStripe, estado);
  const pedido = await pedidoPorPago(pagoStripe);
  if (pedido) {
    const nuevo: EstadoPagoPedido = estado;
    await cambiarPedido(pedido.id, { estado_pago: nuevo });
    refrescarEstudio();
  }
  const resumen = pedido?.pareja ?? pedido?.concepto ?? fila?.slug ?? pagoStripe;
  const detalle = pedido ? `${pedido.concepto} · ${euros(pedido.pagado ?? pedido.importe)}` : fila ? `${fila.producto} · ${euros(fila.importe)}` : null;
  return { resumen, detalle };
}

/** Después de responder (correos y avisos no retrasan el 200 a Stripe). */
function luego(tarea: () => Promise<unknown>) {
  try {
    after(tarea);
  } catch {
    void tarea().catch((e) => console.error("[pagos.luego]", e));
  }
}

function refrescarEstudio() {
  try {
    revalidatePath("/estudio", "layout");
  } catch {}
}
