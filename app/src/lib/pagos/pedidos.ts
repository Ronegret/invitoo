import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { modoAlmacen } from "@/lib/momentos/almacen";
import type { PlanBoda } from "@/lib/planes-boda";
import { servicio } from "@/lib/supabase/clientes";

/**
 * Los pedidos: lo que el estudio tiene que atender después de un pago
 * (tabla `pedidos`, migración 2026-11-planes-pago.sql).
 *
 *  · `plan`  — una reserva pagada en /precios. Se crea en el webhook (o en
 *    el pago demo) con lo que la pareja escribe en Checkout. Sale en la
 *    bandeja del estudio, arriba, hasta que se marca «hecha».
 *  · `cobro` — un cobro a medida del Estudio. Lo crea Rodrigo con su importe
 *    y su concepto; la pareja paga en /pagar/<token>.
 *
 * El `token` (32 hex, aleatorio) es lo único que viaja en los enlaces. El
 * `id` no sale nunca del servidor y del estudio.
 *
 * En local (sin Supabase), un JSON en `.pagos-local/pedidos.json`, igual que
 * los pagos: sobrevive a un reinicio del servidor de desarrollo.
 */

export type TipoPedido = "plan" | "cobro";
export type ParteCobro = "total" | "senal" | "resto";
export type EstadoPagoPedido = "pendiente" | "pagado" | "demo" | "reembolsado" | "disputado" | "fallido" | "anulado";
export type EstadoPedido = "nueva" | "en_curso" | "hecha";
export const ESTADOS_PEDIDO: EstadoPedido[] = ["nueva", "en_curso", "hecha"];

export type Pedido = {
  id: string;
  token: string;
  tipo: TipoPedido;
  plan: PlanBoda | null;
  concepto: string;
  /** Céntimos, IVA incluido. */
  importe: number;
  parte: ParteCobro;
  total: number | null;
  grupo: string | null;
  invitacion_id: string | null;
  slug: string | null;
  pareja: string | null;
  fecha_boda: string | null;
  email: string | null;
  telefono: string | null;
  estado_pago: EstadoPagoPedido;
  estado: EstadoPedido;
  sesion: string | null;
  pago_stripe: string | null;
  pagado: number | null;
  descuento: number | null;
  creado: string;
  actualizado: string;
  pagado_en: string | null;
};

export const TOKEN = /^[a-f0-9]{32}$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

const DIR = path.join(/* turbopackIgnore: true */ process.cwd(), ".pagos-local");
const ARCHIVO = path.join(DIR, "pedidos.json");

async function local(): Promise<Pedido[]> {
  const g = globalThis as { __invitooPedidos?: Promise<Pedido[]> };
  g.__invitooPedidos ??= readFile(ARCHIVO, "utf8")
    .then((t) => JSON.parse(t) as Pedido[])
    .catch(() => []);
  return g.__invitooPedidos;
}

async function guardarLocal() {
  try {
    await mkdir(DIR, { recursive: true });
    const tmp = `${ARCHIVO}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(await local(), null, 1));
    await rename(tmp, ARCHIVO);
  } catch (e) {
    console.error("[pedidos.guardarLocal]", e);
  }
}

const esLocal = () => modoAlmacen() === "local";

export const nuevoToken = () => randomBytes(16).toString("hex");

type Nuevo = Omit<Pedido, "id" | "token" | "creado" | "actualizado" | "estado"> & { estado?: EstadoPedido };

/** Crea un pedido. `null` si no se ha podido escribir. */
export async function crearPedido(e: Nuevo): Promise<Pedido | null> {
  const ahora = new Date().toISOString();
  const fila = { ...e, estado: e.estado ?? "nueva", token: nuevoToken() };
  if (esLocal()) {
    const p: Pedido = { ...fila, id: `pd_${Date.now().toString(36)}${randomBytes(4).toString("hex")}`, creado: ahora, actualizado: ahora };
    (await local()).unshift(p);
    await guardarLocal();
    return p;
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db.from("pedidos").insert(fila).select("*").maybeSingle();
  if (error || !data) {
    console.error("[pedidos.crear]", error?.message);
    return null;
  }
  return data as Pedido;
}

/**
 * El pedido de plan de una sesión de Checkout, o lo crea. Si Stripe entrega
 * dos eventos de la misma sesión, el segundo encuentra el primero.
 */
export async function pedidoDePlan(e: Nuevo & { sesion: string }): Promise<{ pedido: Pedido; nuevo: boolean } | null> {
  const previo = await pedidoPorSesion(e.sesion);
  if (previo) return { pedido: previo, nuevo: false };
  const p = await crearPedido(e);
  return p ? { pedido: p, nuevo: true } : null;
}

async function pedidoPorSesion(sesion: string): Promise<Pedido | null> {
  if (esLocal()) return (await local()).find((p) => p.tipo === "plan" && p.sesion === sesion) ?? null;
  const db = servicio();
  if (!db) return null;
  const { data } = await db.from("pedidos").select("*").eq("tipo", "plan").eq("sesion", sesion).maybeSingle();
  return (data as Pedido) ?? null;
}

export async function pedidoPorToken(token: string): Promise<Pedido | null> {
  if (!TOKEN.test(token)) return null;
  if (esLocal()) return (await local()).find((p) => p.token === token) ?? null;
  const db = servicio();
  if (!db) return null;
  const { data } = await db.from("pedidos").select("*").eq("token", token).maybeSingle();
  return (data as Pedido) ?? null;
}

export async function pedidoPorId(id: string): Promise<Pedido | null> {
  if (!ID.test(id)) return null;
  if (esLocal()) return (await local()).find((p) => p.id === id) ?? null;
  const db = servicio();
  if (!db) return null;
  const { data } = await db.from("pedidos").select("*").eq("id", id).maybeSingle();
  return (data as Pedido) ?? null;
}

export async function pedidoPorPago(pagoStripe: string): Promise<Pedido | null> {
  if (esLocal()) return (await local()).find((p) => p.pago_stripe === pagoStripe) ?? null;
  const db = servicio();
  if (!db) return null;
  const { data } = await db.from("pedidos").select("*").eq("pago_stripe", pagoStripe).limit(1).maybeSingle();
  return (data as Pedido) ?? null;
}

type Cambios = Partial<Omit<Pedido, "id" | "token" | "tipo" | "creado" | "actualizado">>;

export async function cambiarPedido(id: string, cambios: Cambios): Promise<Pedido | null> {
  if (!ID.test(id)) return null;
  const actualizado = new Date().toISOString();
  if (esLocal()) {
    const x = (await local()).find((p) => p.id === id);
    if (!x) return null;
    Object.assign(x, cambios, { actualizado });
    await guardarLocal();
    return x;
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db.from("pedidos").update({ ...cambios, actualizado }).eq("id", id).select("*").maybeSingle();
  if (error) console.error("[pedidos.cambiar]", error.message);
  return (data as Pedido) ?? null;
}

/** Todos, los más nuevos primero. Solo tras `exigirSesion`. */
export async function listarPedidos(tipo?: TipoPedido): Promise<Pedido[]> {
  if (esLocal()) {
    const xs = (await local()).filter((p) => !tipo || p.tipo === tipo);
    return [...xs].sort((a, b) => b.creado.localeCompare(a.creado));
  }
  const db = servicio();
  if (!db) return [];
  let q = db.from("pedidos").select("*").order("creado", { ascending: false }).limit(300);
  if (tipo) q = q.eq("tipo", tipo);
  const { data, error } = await q;
  if (error) {
    // Sin la migración todavía: la bandeja sigue funcionando, sin pedidos.
    console.warn("[pedidos.listar]", error.message);
    return [];
  }
  return (data ?? []) as Pedido[];
}

/** Reservas pagadas que el estudio aún no ha cerrado (para el contador). */
export async function contarReservasAbiertas(): Promise<number> {
  const xs = await listarPedidos("plan");
  return xs.filter((p) => p.estado !== "hecha" && (p.estado_pago === "pagado" || p.estado_pago === "demo")).length;
}
