import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { modoAlmacen } from "@/lib/momentos/almacen";
import { servicio } from "@/lib/supabase/clientes";
import type { PlanBoda } from "@/lib/planes-boda";
import type { ProductoDirecto } from "./productos";

/**
 * El libro de pagos de Stripe (tabla `pagos`, migraciones 2026-11-pagos.sql y
 * 2026-11-planes-pago.sql): En directo, los planes y los cobros del Estudio.
 *
 * La IDEMPOTENCIA va por `evento` (el `event.id` de Stripe, o `demo_…`): es
 * clave única, así que el mismo evento entregado dos veces (Stripe reintenta
 * hasta 3 días) solo inserta una fila y solo activa una vez.
 *
 * En local, un JSON en `.pagos-local/pagos.json` (escritura atómica).
 */

export type EstadoPago = "pagado" | "demo" | "reembolsado" | "fallido" | "disputado";

/** Qué se ha pagado: un añadido de En directo, un plan o un cobro a medida. */
export type ProductoPagado = ProductoDirecto | PlanBoda | "cobro";

export type FilaPago = {
  id: string;
  evento: string;
  /** null en una reserva de plan: la boda aún no existe. */
  invitacion_id: string | null;
  slug: string | null;
  producto: ProductoPagado;
  /** El pedido (plan o cobro) al que corresponde. */
  pedido_id?: string | null;
  importe: number;
  moneda: string;
  estado: EstadoPago;
  sesion: string | null;
  pago_stripe: string | null;
  email: string | null;
  creado: string;
};

const DIR = path.join(/* turbopackIgnore: true */ process.cwd(), ".pagos-local");
const ARCHIVO = path.join(DIR, "pagos.json");

async function local(): Promise<FilaPago[]> {
  const g = globalThis as { __invitooPagos?: Promise<FilaPago[]> };
  g.__invitooPagos ??= readFile(ARCHIVO, "utf8")
    .then((t) => JSON.parse(t) as FilaPago[])
    .catch(() => []);
  return g.__invitooPagos;
}

async function guardarLocal() {
  try {
    await mkdir(DIR, { recursive: true });
    const tmp = `${ARCHIVO}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(await local(), null, 1));
    await rename(tmp, ARCHIVO);
  } catch (e) {
    console.error("[pagos.guardarLocal]", e);
  }
}

const esLocal = () => modoAlmacen() === "local";

/**
 * Inserta el pago SI el evento es nuevo. `true` = nuevo (hay que activar);
 * `false` = ya estaba (reintento de Stripe: no se hace nada); `null` = no
 * se ha podido escribir (el webhook devuelve 500 y Stripe reintenta).
 */
export async function registrarPago(f: Omit<FilaPago, "id" | "creado">): Promise<boolean | null> {
  if (esLocal()) {
    const xs = await local();
    if (xs.some((x) => x.evento === f.evento)) return false;
    xs.push({ ...f, id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, creado: new Date().toISOString() });
    await guardarLocal();
    return true;
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db
    .from("pagos")
    .upsert(f, { onConflict: "evento", ignoreDuplicates: true })
    .select("id");
  if (error) {
    console.error("[pagos.registrar]", error.message);
    return null;
  }
  return (data?.length ?? 0) > 0;
}

/**
 * Deshace el registro de un evento: si después de apuntarlo falla lo que
 * venía detrás (crear el pedido), se borra para que el reintento de Stripe
 * lo vuelva a procesar entero.
 */
export async function olvidarEvento(evento: string): Promise<void> {
  if (esLocal()) {
    const xs = await local();
    const i = xs.findIndex((x) => x.evento === evento);
    if (i >= 0) xs.splice(i, 1);
    await guardarLocal();
    return;
  }
  const db = servicio();
  if (!db) return;
  const { error } = await db.from("pagos").delete().eq("evento", evento);
  if (error) console.error("[pagos.olvidar]", error.message);
}

/** Marca reembolsado / disputado / fallido el pago de un PaymentIntent. */
export async function cambiarEstadoPago(pagoStripe: string, estado: EstadoPago): Promise<FilaPago | null> {
  if (esLocal()) {
    const x = (await local()).find((p) => p.pago_stripe === pagoStripe);
    if (!x) return null;
    x.estado = estado;
    await guardarLocal();
    return x;
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db
    .from("pagos")
    .update({ estado })
    .eq("pago_stripe", pagoStripe)
    .select("*");
  if (error) console.error("[pagos.cambiarEstado]", error.message);
  return ((data ?? [])[0] as FilaPago) ?? null;
}

export async function pagosDe(invitacionId: string): Promise<FilaPago[]> {
  if (esLocal()) {
    return (await local()).filter((p) => p.invitacion_id === invitacionId).sort((a, b) => b.creado.localeCompare(a.creado));
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("pagos")
    .select("*")
    .eq("invitacion_id", invitacionId)
    .order("creado", { ascending: false })
    .limit(50);
  if (error) console.warn("[pagos.de]", error.message);
  return (data ?? []) as FilaPago[];
}
