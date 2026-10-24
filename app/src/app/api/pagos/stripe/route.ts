import { NextResponse, type NextRequest } from "next/server";
import { avisarEstudio } from "@/lib/avisos/avisar";
import { resolverBodaPrivada } from "@/lib/momentos/datos";
import { activarProducto } from "@/lib/pagos/activar";
import { revertirPago, procesarPago } from "@/lib/pagos/cobrar";
import { registrarPago } from "@/lib/pagos/datos";
import { esProducto, euros } from "@/lib/pagos/productos";
import { campoDe, firmaValida, type SesionStripe } from "@/lib/pagos/stripe";

/**
 * POST /api/pagos/stripe — el webhook de Stripe. UNO para todo:
 *
 *   metadata.tipo = "plan"    → reserva de Invitoo / Con canción (/precios):
 *                                pedido nuevo en la bandeja del estudio, email
 *                                a la pareja y aviso al estudio.
 *   metadata.tipo = "cobro"   → cobro a medida del Estudio (/pagar/<token>):
 *                                el pedido pasa a pagado y se avisa.
 *   metadata.tipo = "directo" → En directo desde el panel (o sin `tipo`: las
 *                                sesiones creadas antes de este cambio).
 *
 * Eventos que hay que activar en el Dashboard (Desarrolladores → Webhooks):
 *   checkout.session.completed               → pago con tarjeta / Bizum ya cobrado
 *   checkout.session.async_payment_succeeded → métodos diferidos que llegan tarde
 *   checkout.session.async_payment_failed    → se registra; no se activa
 *   charge.refunded                          → «reembolsado» si es total (no se apaga solo)
 *   charge.dispute.created                   → «disputado» y aviso al estudio
 *   charge.dispute.closed                    → ganada: vuelve a «pagado»; perdida: aviso
 *   refund.failed                            → aviso: el reembolso no ha llegado
 *
 * Reglas:
 *   · se lee el cuerpo CRUDO y se verifica `Stripe-Signature` con
 *     STRIPE_WEBHOOK_SECRET; si no cuadra, 400 y nada más;
 *   · idempotente por `event.id` (clave única en `pagos.evento`): si Stripe
 *     reintenta, 200 sin hacer nada;
 *   · si falla nuestra base, 500: Stripe reintenta (hasta 3 días);
 *   · siempre responde rápido (sin esperar correos: `activarProducto` los
 *     lanza en segundo plano).
 */

export const dynamic = "force-dynamic";

type Sesion = SesionStripe;
type Cargo = { payment_intent?: string | null; amount_refunded?: number; amount?: number; status?: string };
type Evento = { id: string; type: string; data: { object: unknown } };

const ok = (extra: Record<string, unknown> = {}) => NextResponse.json({ recibido: true, ...extra });

export async function POST(peticion: NextRequest) {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const cuerpo = await peticion.text();
  if (!secreto || !firmaValida(cuerpo, peticion.headers.get("stripe-signature"), secreto)) {
    console.warn("[pagos.webhook] firma no válida");
    return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  }

  let evento: Evento;
  try {
    evento = JSON.parse(cuerpo) as Evento;
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }

  switch (evento.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = evento.data.object as Sesion;
      // Con Bizum y tarjeta llega ya «paid»; con un método diferido llega
      // «unpaid» y se espera a async_payment_succeeded.
      if (s.payment_status !== "paid") return ok({ esperando: true });
      const tipo = s.metadata?.tipo;
      if (tipo === "plan" || tipo === "cobro") {
        const r = await procesarPago({
          evento: evento.id,
          demo: false,
          tipo,
          plan: s.metadata?.plan ?? null,
          pedidoId: s.metadata?.pedido ?? null,
          sesion: s.id,
          pagoStripe: s.payment_intent ?? null,
          importe: s.amount_total ?? 0,
          descuento: s.total_details?.amount_discount || null,
          email: s.customer_details?.email ?? null,
          telefono: s.customer_details?.phone ?? null,
          novios: { a: campoDe(s, "novioa", 60), b: campoDe(s, "noviob", 60) },
          fecha: campoDe(s, "fecha", 40),
        });
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
        return ok(r.repetido ? { repetido: true } : r.ignorado ? { ignorado: r.ignorado } : {});
      }
      const slug = s.metadata?.slug ?? "";
      const producto = s.metadata?.producto;
      if (!slug || !esProducto(producto)) {
        console.error("[pagos.webhook] sesión sin metadata", s.id);
        return ok({ ignorado: "sin metadata" });
      }
      // La boda manda: el id se saca del slug (y se avisa si no cuadra con la metadata).
      const boda = await resolverBodaPrivada(slug);
      if (!boda?.id) {
        console.error("[pagos.webhook] boda no encontrada", slug, s.id);
        void avisarEstudio(`Pago de una boda que no encontramos: ${slug}`, [{ titulo: `Sesión ${s.id}`, detalle: producto }], "/estudio");
        return ok({ ignorado: "boda no encontrada" });
      }
      const invitacion = boda.id;
      if (s.metadata?.invitacion_id && s.metadata.invitacion_id !== invitacion) {
        console.warn("[pagos.webhook] invitacion_id distinto en metadata", slug, s.metadata.invitacion_id);
      }
      const nuevo = await registrarPago({
        evento: evento.id,
        invitacion_id: invitacion,
        slug,
        producto,
        importe: s.amount_total ?? 0,
        moneda: s.currency ?? "eur",
        estado: "pagado",
        sesion: s.id,
        pago_stripe: s.payment_intent ?? null,
        email: s.customer_details?.email ?? null,
      });
      if (nuevo === null) return NextResponse.json({ error: "Base no disponible" }, { status: 500 });
      if (!nuevo) return ok({ repetido: true });
      const r = await activarProducto(slug, producto, { importe: s.amount_total ?? undefined });
      if (!r.ok) {
        // Cobrado pero no activado: que lo vea el estudio (el pago ya consta).
        console.error("[pagos.webhook] no activado", slug, producto, r.error);
        void avisarEstudio(`Pago SIN activar: ${slug}`, [{ titulo: r.error, detalle: `${producto} · sesión ${s.id}` }], "/estudio");
      }
      return ok();
    }
    case "checkout.session.async_payment_failed": {
      const s = evento.data.object as Sesion;
      console.warn("[pagos.webhook] pago diferido fallido", s.id, s.metadata?.slug);
      return ok();
    }
    case "charge.refunded":
    case "charge.dispute.created":
    case "charge.dispute.closed": {
      const c = evento.data.object as Cargo;
      const pi = c.payment_intent ?? null;
      if (!pi) return ok({ ignorado: "sin payment_intent" });
      let estado: "reembolsado" | "disputado" | "pagado" | null;
      let asunto: string;
      if (evento.type === "charge.refunded") {
        // Un reembolso parcial (de cortesía, por ejemplo) no cambia el estado.
        const total = (c.amount_refunded ?? 0) >= (c.amount ?? 0);
        estado = total ? "reembolsado" : null;
        asunto = total ? "Pago reembolsado" : `Reembolso parcial: ${euros(c.amount_refunded ?? 0)}`;
      } else if (evento.type === "charge.dispute.created") {
        estado = "disputado";
        asunto = "Disputa abierta en un pago";
      } else {
        const ganada = c.status === "won";
        estado = ganada ? "pagado" : null;
        asunto = ganada ? "Disputa ganada: el pago vuelve a contar" : "Disputa cerrada en contra";
      }
      const info = estado ? await revertirPago(pi, estado) : { resumen: pi, detalle: null };
      // No se apaga nada solo: puede ser un reembolso de cortesía. Lo decide
      // el estudio (En directo con `fijarPlanDirecto`; un plan, en la bandeja).
      void avisarEstudio(asunto, [{ titulo: info.resumen, detalle: info.detalle }], "/estudio/cobros");
      return ok();
    }
    case "refund.failed": {
      const r = evento.data.object as { payment_intent?: string | null; amount?: number };
      void avisarEstudio(
        "Un reembolso no ha llegado",
        [{ titulo: r.payment_intent ?? "Sin pago", detalle: `${euros(r.amount ?? 0)}: hay que devolverlo por otra vía (Bizum o transferencia).` }],
        "/estudio/cobros",
      );
      return ok();
    }
    default:
      return ok({ ignorado: evento.type });
  }
}
