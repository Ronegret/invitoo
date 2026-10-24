"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { enlaceReserva } from "@/lib/contacto";
import { baseUrl } from "@/lib/momentos/servidor";
import { procesarPago } from "./cobrar";
import { modoCobro } from "./modo";
import { cambiarPedido, pedidoPorToken, TOKEN } from "./pedidos";
import { esPlanCerrado, PLANES_PAGO } from "./productos";
import { contar } from "@/lib/visitas/registrar";
import { crearCheckout } from "./stripe";

/**
 * Las acciones PÚBLICAS de pago: reservar un plan en /precios y pagar un
 * cobro del Estudio en /pagar/<token>.
 *
 * Seguridad: el navegador solo manda QUÉ (el id del plan o el token del
 * pedido). El importe lo pone siempre el servidor: de `PLANES_PAGO` (que sale
 * de `planes-boda.ts`) o del pedido guardado. Nada de lo que llega del
 * formulario acaba en `unit_amount`.
 */

const minuto = () => Math.floor(Date.now() / 60_000);

/** «Reservar por 149 €» / «249 €». Siempre termina en un `redirect`. */
export async function reservarPlan(datos: FormData): Promise<void> {
  const id = datos.get("plan");
  if (!esPlanCerrado(id)) redirect("/precios");
  const plan = PLANES_PAGO[id];
  const modo = modoCobro();

  if (modo === "no") {
    console.error("[pagos.plan] Falta STRIPE_SECRET_KEY en producción");
    redirect(enlaceReserva(`Hola, queremos reservar el plan «${plan.nombre}» para nuestra boda`));
  }
  // Embudo de /estudio/visitas: un pago empezado (Stripe o demo).
  await contar("checkout", "iniciado");
  if (modo === "demo") redirect(`/pagar/demo/${plan.id}`);

  const origen = await baseUrl();
  let url: string | null = null;
  try {
    const s = await crearCheckout({
      linea: { nombre: plan.nombre, descripcion: plan.resumen, importe: plan.importe },
      metadata: { tipo: "plan", plan: plan.id },
      origen,
      exito: `${origen}/gracias?sesion={CHECKOUT_SESSION_ID}`,
      cancelar: `${origen}/precios?pago=cancelado`,
      descripcionPago: `Reserva · ${plan.nombre}`,
      descripcionFactura: `${plan.nombre}: invitación de boda digital a medida`,
      datosBoda: true,
      codigos: true,
      boton: "book",
    });
    url = s.url;
    console.info("[pagos.plan.checkout]", JSON.stringify({ plan: plan.id, sesion: s.id }));
  } catch (e) {
    console.error("[pagos.plan.checkout]", (e as Error).message);
  }
  redirect(url ?? "/gracias?error=checkout");
}

export type ResultadoDemo = { error: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const limpio = (datos: FormData, campo: string, max: number) =>
  String(datos.get(campo) ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * El «Checkout» de mentira del modo demo (/pagar/demo/<plan>): recoge lo
 * mismo que Stripe y pasa por `procesarPago`, la misma función que el
 * webhook. Solo funciona en modo demo.
 */
export async function confirmarPlanDemo(_: ResultadoDemo, datos: FormData): Promise<ResultadoDemo> {
  if (modoCobro() !== "demo") return { error: "El modo demo no está activo." };
  const id = datos.get("plan");
  if (!esPlanCerrado(id)) return { error: "Ese plan no existe." };
  const email = limpio(datos, "email", 120).toLowerCase();
  const a = limpio(datos, "novioa", 60);
  const b = limpio(datos, "noviob", 60);
  if (!EMAIL.test(email)) return { error: "Revisad el email: así no nos llega." };
  if (a.length < 2 || b.length < 2) return { error: "Faltan vuestros nombres." };

  const r = await procesarPago({
    evento: `demo_${randomBytes(9).toString("hex")}`,
    demo: true,
    tipo: "plan",
    plan: id,
    sesion: null,
    pagoStripe: null,
    importe: PLANES_PAGO[id].importe,
    email,
    telefono: limpio(datos, "telefono", 30) || null,
    novios: { a, b },
    fecha: limpio(datos, "fecha", 40) || null,
  });
  if (!r.ok || !r.pedido) return { error: "No hemos podido guardarlo. Probad otra vez." };
  redirect(`/gracias?pedido=${r.pedido.token}`);
}

/** «Pagar» en /pagar/<token>: un cobro del Estudio. */
export async function pagarPedido(datos: FormData): Promise<void> {
  const token = String(datos.get("token") ?? "");
  if (!TOKEN.test(token)) redirect("/");
  const pedido = await pedidoPorToken(token);
  if (!pedido || pedido.tipo !== "cobro" || pedido.estado_pago !== "pendiente") redirect(`/pagar/${token}`);

  const modo = modoCobro();
  if (modo === "no") redirect(`/pagar/${token}?error=1`);

  if (modo === "demo") {
    const r = await procesarPago({
      evento: `demo_${randomBytes(9).toString("hex")}`,
      demo: true,
      tipo: "cobro",
      pedidoId: pedido.id,
      sesion: null,
      pagoStripe: null,
      importe: pedido.importe,
      email: pedido.email,
      telefono: pedido.telefono,
    });
    redirect(r.ok ? `/gracias?pedido=${token}` : `/pagar/${token}?error=1`);
  }

  const origen = await baseUrl();
  const parte = pedido.parte === "senal" ? "Señal" : pedido.parte === "resto" ? "Resto" : null;
  let url: string | null = null;
  try {
    const s = await crearCheckout({
      linea: {
        nombre: pedido.concepto,
        descripcion: [parte, pedido.pareja].filter(Boolean).join(" · ") || undefined,
        importe: pedido.importe,
      },
      metadata: { tipo: "cobro", pedido: pedido.id, ...(pedido.slug ? { slug: pedido.slug } : {}) },
      origen,
      exito: `${origen}/gracias?sesion={CHECKOUT_SESSION_ID}`,
      cancelar: `${origen}/pagar/${token}`,
      email: pedido.email,
      referencia: pedido.invitacion_id,
      descripcionPago: `${pedido.concepto}${pedido.slug ? ` · ${pedido.slug}` : ""}`,
      descripcionFactura: pedido.concepto,
      // Un presupuesto ya está hablado: sin códigos de descuento encima.
      codigos: false,
      idempotencia: `ck-cobro-${pedido.id}-${minuto()}`,
    });
    await cambiarPedido(pedido.id, { sesion: s.id });
    url = s.url;
  } catch (e) {
    console.error("[pagos.cobro.checkout]", (e as Error).message);
  }
  redirect(url ?? `/pagar/${token}?error=1`);
}
