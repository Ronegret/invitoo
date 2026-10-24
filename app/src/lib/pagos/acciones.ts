"use server";

import { randomBytes } from "node:crypto";
import { exigirAccesoBoda } from "@/lib/auth/acceso";
import { leerDiseno, obtenerConfig, resolverBodaPrivada } from "@/lib/momentos/datos";
import type { DisenoDirecto } from "@/lib/momentos/diseno";
import { limitesDe, type PlanMomentos } from "@/lib/momentos/planes";
import { baseUrl } from "@/lib/momentos/servidor";
import { activarProducto } from "./activar";
import { pagosDe, registrarPago, type EstadoPago } from "./datos";
import { esProducto, PRODUCTOS, type ProductoDirecto } from "./productos";
import { modoCobro, type ModoCobro } from "./modo";
import { crearSesionCheckout } from "./stripe";

/**
 * Comprar «En directo» desde el panel. La primera línea de cada acción es
 * `exigirAccesoBoda(slug)`.
 *
 * Modo de cobro:
 *   · "stripe" — hay STRIPE_SECRET_KEY: se crea una sesión de Checkout y se
 *     activa SOLO cuando llega el webhook firmado (`/api/pagos/stripe`).
 *   · "demo"   — no hay clave y estamos en desarrollo, con INVITOO_MEMORIA=1
 *     o con PAGOS_DEMO=1: se activa al momento y se dice «Modo demo: no se
 *     ha cobrado nada».
 *   · "no"     — producción sin clave: no se vende (nunca se regala).
 */

type Fallo = { ok: false; error: string };

/** Qué se puede comprar con el plan que se tiene. */
function disponibles(plan: PlanMomentos): ProductoDirecto[] {
  if (plan === "album") return ["directo", "gestionado"];
  if (plan === "directo") return ["gestionado", "conservar"];
  return ["conservar"];
}

export type EstadoCompra = {
  ok: true;
  modo: ModoCobro;
  plan: PlanMomentos;
  nombrePlan: string;
  conPantalla: boolean;
  anosExtra: number;
  retencionHasta: string | null;
  disponibles: ProductoDirecto[];
  pareja: { a: string; b: string; fecha: string };
  plantilla: string;
  diseno: DisenoDirecto;
  pagos: { producto: ProductoDirecto; importe: number; estado: EstadoPago; creado: string }[];
  /** Solo el estudio o la pareja pagan; el planner ve, pero no compra. */
  puedeComprar: boolean;
};

export async function estadoCompra(slug: string): Promise<EstadoCompra | Fallo> {
  let acceso;
  try {
    acceso = await exigirAccesoBoda(String(slug ?? ""));
  } catch {
    return { ok: false, error: "No tenéis acceso a esta boda. Volved a entrar." };
  }
  const boda = await resolverBodaPrivada(acceso.slug);
  if (!boda?.id) return { ok: false, error: "No encontramos esta boda." };
  const conId = { ...boda, id: boda.id };
  const [config, diseno, pagos] = await Promise.all([obtenerConfig(conId), leerDiseno(boda.id), pagosDe(boda.id)]);
  if (!config) return { ok: false, error: "Ahora mismo no podemos cargarlo. Probad dentro de un rato." };
  const l = limitesDe(config.plan, config.anos_extra);
  return {
    ok: true,
    modo: modoCobro(),
    plan: config.plan,
    nombrePlan: l.nombre,
    conPantalla: l.pantallaTv,
    anosExtra: config.anos_extra,
    retencionHasta: config.retencion_hasta,
    disponibles: disponibles(config.plan),
    pareja: boda.inv.pareja,
    plantilla: boda.inv.plantilla,
    diseno,
    // Solo lo de En directo: los planes y los cobros del Estudio no se listan aquí.
    pagos: pagos.flatMap((p) => (esProducto(p.producto) ? [{ producto: p.producto, importe: p.importe, estado: p.estado, creado: p.creado }] : [])),
    puedeComprar: acceso.rol === "pareja" || acceso.rol === "estudio",
  };
}

export type ResultadoContratar =
  | { ok: true; modo: "stripe"; url: string }
  | { ok: true; modo: "demo"; plan: PlanMomentos; anosExtra: number }
  | Fallo;

export async function contratarDirecto(slug: string, producto: ProductoDirecto): Promise<ResultadoContratar> {
  let acceso;
  try {
    acceso = await exigirAccesoBoda(String(slug ?? ""));
  } catch {
    return { ok: false, error: "No tenéis acceso a esta boda. Volved a entrar." };
  }
  if (acceso.rol !== "pareja" && acceso.rol !== "estudio") {
    return { ok: false, error: "Solo los novios pueden contratar. Pedídselo a ellos." };
  }
  if (!esProducto(producto)) return { ok: false, error: "Eso no se puede contratar." };
  const boda = await resolverBodaPrivada(acceso.slug);
  if (!boda?.id) return { ok: false, error: "No encontramos esta boda." };
  const config = await obtenerConfig({ ...boda, id: boda.id });
  if (!config) return { ok: false, error: "Ahora mismo no podemos cargarlo. Probad dentro de un rato." };
  if (!disponibles(config.plan).includes(producto)) {
    return { ok: false, error: "Ya lo tenéis incluido." };
  }

  const modo = modoCobro();
  const p = PRODUCTOS[producto];
  if (modo === "no") {
    console.error("[pagos.contratar] Falta STRIPE_SECRET_KEY en producción");
    return { ok: false, error: "Ahora mismo no podemos cobrar en línea. Escribidnos a info@invitoo.es y lo activamos." };
  }

  if (modo === "demo") {
    const evento = `demo_${randomBytes(9).toString("hex")}`;
    const nuevo = await registrarPago({
      evento,
      invitacion_id: boda.id,
      slug: acceso.slug,
      producto,
      importe: p.importe,
      moneda: "eur",
      estado: "demo",
      sesion: null,
      pago_stripe: null,
      email: acceso.usuario?.email ?? null,
    });
    if (nuevo === null) return { ok: false, error: "No hemos podido guardarlo. Probad otra vez." };
    const r = await activarProducto(acceso.slug, producto, { demo: true });
    if (!r.ok) return r;
    return { ok: true, modo: "demo", plan: r.plan, anosExtra: r.anosExtra };
  }

  try {
    const s = await crearSesionCheckout({
      producto: p,
      slug: acceso.slug,
      invitacionId: boda.id,
      email: acceso.usuario?.email,
      origen: await baseUrl(),
      vuelta: `/panel/${acceso.slug}/directo`,
    });
    console.info("[pagos.checkout]", JSON.stringify({ slug: acceso.slug, producto, sesion: s.id }));
    return { ok: true, modo: "stripe", url: s.url };
  } catch (e) {
    console.error("[pagos.checkout]", (e as Error).message);
    return { ok: false, error: "No hemos podido abrir el pago. Probad otra vez en un momento." };
  }
}
