"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/app/estudio/sesion";
import { anadirMiembro, guardarContrato, obtenerContrato, obtenerPorId } from "@/lib/datos";
import { baseUrl } from "@/lib/momentos/servidor";
import { cambiarPedido, crearPedido, ESTADOS_PEDIDO, listarPedidos, pedidoPorId, type EstadoPedido, type Pedido } from "./pedidos";
import { euros } from "./productos";

/**
 * «Cobrar» del Estudio y la bandeja de reservas. REGLA: la primera línea de
 * cada acción es `exigirSesion()` (las server actions se pueden llamar por
 * POST desde cualquier ruta; el proxy de /estudio no las protege).
 *
 * El enlace que se manda a la pareja es /pagar/<token>, no una URL de
 * Checkout: una sesión de Checkout caduca a las 24 horas, y este enlace
 * abre una nueva cada vez, con el importe guardado aquí, hasta que se paga.
 */

export type ResultadoCobro =
  | { ok: true; mensaje: string; enlace: string; importe: string; concepto: string; telefono: string | null; email: string | null; t: number }
  | { ok: false; mensaje: string; t: number }
  | null;

const fallo = (mensaje: string): ResultadoCobro => ({ ok: false, mensaje, t: Date.now() });
const texto = (d: FormData, k: string, max: number) => String(d.get(k) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** «12,50» o «449» → céntimos. `null` si no es un importe válido. */
function centimos(v: string): number | null {
  const limpio = v.replace(/\s|€/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(limpio)) return null;
  const c = Math.round(Number(limpio) * 100);
  return c >= 100 && c <= 1_000_000 ? c : null;
}

async function enlaceDe(p: Pedido) {
  return `${await baseUrl()}/pagar/${p.token}`;
}

async function exito(p: Pedido, mensaje: string): Promise<ResultadoCobro> {
  revalidatePath("/estudio/cobros");
  return {
    ok: true,
    mensaje,
    enlace: await enlaceDe(p),
    importe: euros(p.importe),
    concepto: p.concepto,
    telefono: p.telefono,
    email: p.email,
    t: Date.now(),
  };
}

/** Crear un cobro: importe, concepto, boda (opcional) y, si se quiere, señal. */
export async function crearCobroAccion(_: ResultadoCobro, datos: FormData): Promise<ResultadoCobro> {
  if (!(await exigirSesion())) return fallo("La sesión del estudio ha caducado. Vuelve a entrar.");

  const total = centimos(texto(datos, "importe", 20));
  if (!total) return fallo("El importe va en euros, entre 1 y 10.000 (por ejemplo, 449 o 12,50).");
  const concepto = texto(datos, "concepto", 120);
  if (concepto.length < 3) return fallo("Escribe el concepto: es lo que verán en el pago y en la factura.");

  let invitacion_id: string | null = null;
  let slug: string | null = null;
  let pareja = texto(datos, "pareja", 120) || null;
  const boda = texto(datos, "boda", 64);
  if (boda) {
    const inv = await obtenerPorId(boda);
    if (!inv) return fallo("No encuentro esa boda.");
    invitacion_id = boda;
    slug = inv.slug;
    pareja ??= `${inv.pareja.a} y ${inv.pareja.b}`;
  }
  const email = texto(datos, "email", 120).toLowerCase() || null;
  if (email && !EMAIL.test(email)) return fallo("Ese email no parece válido.");
  const telefono = texto(datos, "telefono", 30).replace(/[^\d+]/g, "") || null;

  const enDos = datos.get("forma") === "senal";
  const pct = Number(texto(datos, "porcentaje", 3) || 50);
  if (enDos && (!Number.isInteger(pct) || pct < 10 || pct > 90)) return fallo("La señal va del 10 % al 90 %.");
  const importe = enDos ? Math.round((total * pct) / 100) : total;
  if (importe < 100 || (enDos && total - importe < 100)) return fallo("Con ese importe, cada parte tiene que ser de al menos 1 €.");

  const p = await crearPedido({
    tipo: "cobro",
    plan: "estudio",
    concepto: enDos ? `${concepto} · señal del ${pct} %` : concepto,
    importe,
    parte: enDos ? "senal" : "total",
    total: enDos ? total : null,
    grupo: null,
    invitacion_id,
    slug,
    pareja,
    fecha_boda: null,
    email,
    telefono,
    estado_pago: "pendiente",
    sesion: null,
    pago_stripe: null,
    pagado: null,
    descuento: null,
    pagado_en: null,
  });
  if (!p) return fallo("No se ha podido guardar. Prueba otra vez.");
  return exito(p, enDos ? `Señal de ${euros(importe)} lista. El resto (${euros(total - importe)}) lo cobras cuando toque.` : `Cobro de ${euros(importe)} listo.`);
}

/** Desde una señal pagada: el enlace del resto. Si ya existe, el mismo. */
export async function cobrarRestoAccion(id: string): Promise<ResultadoCobro> {
  if (!(await exigirSesion())) return fallo("La sesión del estudio ha caducado. Vuelve a entrar.");
  const senal = await pedidoPorId(String(id ?? ""));
  if (!senal || senal.parte !== "senal" || !senal.total) return fallo("Ese cobro no tiene resto.");
  if (senal.estado_pago !== "pagado" && senal.estado_pago !== "demo") return fallo("Primero tiene que estar pagada la señal.");
  const ya = (await listarPedidos("cobro")).find((x) => x.grupo === senal.id && x.estado_pago !== "anulado");
  if (ya) return exito(ya, "Este es el enlace del resto.");
  const concepto = senal.concepto.replace(/ · señal del \d+ %$/, "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _i, token: _t, creado: _c, actualizado: _a, estado: _e, ...base } = senal;
  const p = await crearPedido({
    ...base,
    concepto: `${concepto} · resto`,
    importe: senal.total - senal.importe,
    parte: "resto",
    grupo: senal.id,
    estado_pago: "pendiente",
    sesion: null,
    pago_stripe: null,
    pagado: null,
    descuento: null,
    pagado_en: null,
  });
  if (!p) return fallo("No se ha podido guardar. Prueba otra vez.");
  return exito(p, `Resto de ${euros(p.importe)} listo.`);
}

/** Anular un enlace que aún no se ha pagado. */
export async function anularCobroAccion(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await exigirSesion())) return { ok: false, mensaje: "La sesión del estudio ha caducado." };
  const p = await pedidoPorId(String(id ?? ""));
  if (!p || p.tipo !== "cobro") return { ok: false, mensaje: "No encuentro ese cobro." };
  if (p.estado_pago !== "pendiente") return { ok: false, mensaje: "Solo se anula un enlace sin pagar." };
  await cambiarPedido(p.id, { estado_pago: "anulado" });
  revalidatePath("/estudio/cobros");
  return { ok: true, mensaje: "Anulado: el enlace ya no cobra." };
}

/** Mover una reserva en la bandeja (nueva → en curso → hecha). */
export async function moverPedidoAccion(id: string, estado: EstadoPedido): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await exigirSesion())) return { ok: false, mensaje: "La sesión del estudio ha caducado." };
  if (!ESTADOS_PEDIDO.includes(estado)) return { ok: false, mensaje: "Estado no válido." };
  const p = await cambiarPedido(String(id ?? ""), { estado });
  if (!p) return { ok: false, mensaje: "Esa reserva ya no está." };
  revalidatePath("/estudio", "layout");
  return { ok: true, mensaje: estado === "hecha" ? "Cerrada." : "Hecho." };
}

/**
 * Vincular una reserva a la boda que el estudio acaba de crear: la boda
 * queda con el plan pagado y el email de la reserva entra como pareja en
 * el panel (le llegará el enlace al entrar con ese email).
 */
export async function vincularPedidoAccion(id: string, invitacionId: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await exigirSesion())) return { ok: false, mensaje: "La sesión del estudio ha caducado." };
  const p = await pedidoPorId(String(id ?? ""));
  if (!p) return { ok: false, mensaje: "Esa reserva ya no está." };
  const inv = await obtenerPorId(String(invitacionId ?? ""));
  if (!inv) return { ok: false, mensaje: "No encuentro esa boda." };
  await cambiarPedido(p.id, { invitacion_id: invitacionId, slug: inv.slug, estado: p.estado === "nueva" ? "en_curso" : p.estado });
  if (p.tipo === "plan" && p.plan) {
    const c = await obtenerContrato(invitacionId);
    await guardarContrato(invitacionId, { plan: p.plan, anadidos: c.anadidos });
  }
  let extra = "";
  if (p.email) {
    const m = await anadirMiembro(invitacionId, { email: p.email, rol: "pareja", nombre: p.pareja });
    extra = m.ok ? ` ${p.email} ya puede entrar en su panel.` : "";
  }
  revalidatePath("/estudio", "layout");
  return { ok: true, mensaje: `Vinculada a ${inv.pareja.a} y ${inv.pareja.b}.${extra}` };
}
