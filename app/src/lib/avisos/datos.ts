import "server-only";

import { randomBytes } from "node:crypto";
import { modoDemo } from "@/lib/datos";
import { servicio } from "@/lib/supabase/clientes";
import {
  esFrecuencia,
  PREFERENCIAS_INICIALES,
  TIPOS_AVISO,
  type Aviso,
  type Preferencias,
  type TipoAviso,
} from "./tipos";

/**
 * Los datos de Avisos: la campana (`avisos`), las preferencias por tipo
 * (`avisos_preferencias`) y las suscripciones Web Push (`avisos_push`).
 * Con Supabase, tablas con RLS cerrada y service role. En local, memoria
 * del proceso. Cada función recibe el `invitacionId` YA autorizado, salvo
 * las del cron (que recorren todas) y `registrarAviso` (que la llaman las
 * acciones públicas tras validar lo que llega).
 */

type FilaAviso = Aviso & { invitacion_id: string; enviado_en: string | null };
/** Quita los campos internos de la fila (boda y envío) antes de devolverla. */
function sinInternos(fila: FilaAviso): Aviso {
  const x: Partial<FilaAviso> = { ...fila };
  delete x.invitacion_id;
  delete x.enviado_en;
  return x as Aviso;
}
type Push = { id: string; invitacion_id: string; endpoint: string; p256dh: string | null; auth: string | null };
type Memoria = {
  avisos: FilaAviso[];
  prefs: Map<string, Preferencias & { ultimo_resumen: string | null }>;
  push: Push[];
};

function memoria(): Memoria {
  const g = globalThis as { __invitooAvisos?: Memoria };
  g.__invitooAvisos ??= { avisos: [], prefs: new Map(), push: [] };
  return g.__invitooAvisos;
}

const nuevoId = () => randomBytes(10).toString("hex");

// ──────────────────────────────────────────────────────────────── avisos

export async function registrarAviso(
  invitacionId: string,
  a: { tipo: TipoAviso; titulo: string; detalle?: string | null; enlace?: string | null },
): Promise<FilaAviso | null> {
  const fila: FilaAviso = {
    id: nuevoId(),
    invitacion_id: invitacionId,
    tipo: a.tipo,
    titulo: a.titulo.slice(0, 160),
    detalle: a.detalle ? a.detalle.slice(0, 400) : null,
    enlace: a.enlace ?? null,
    leido: false,
    creado: new Date().toISOString(),
    enviado_en: null,
  };
  if (modoDemo()) {
    const m = memoria();
    m.avisos.unshift(fila);
    if (m.avisos.length > 2000) m.avisos.length = 2000;
    return fila;
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db
    .from("avisos")
    .insert({
      invitacion_id: invitacionId,
      tipo: fila.tipo,
      titulo: fila.titulo,
      detalle: fila.detalle,
      enlace: fila.enlace,
    })
    .select("id, creado_en")
    .maybeSingle();
  if (error || !data) {
    console.error("[avisos.registrar]", error?.message);
    return null;
  }
  return { ...fila, id: String(data.id), creado: String(data.creado_en) };
}

export async function listarAvisos(invitacionId: string, limite = 30): Promise<Aviso[]> {
  if (modoDemo()) {
    return memoria()
      .avisos.filter((x) => x.invitacion_id === invitacionId)
      .slice(0, limite)
      .map(sinInternos);
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("avisos")
    .select("id, tipo, titulo, detalle, enlace, leido, creado_en")
    .eq("invitacion_id", invitacionId)
    .order("creado_en", { ascending: false })
    .limit(limite);
  if (error) {
    console.error("[avisos.listar]", error.message);
    return [];
  }
  return (data ?? []).map((x) => ({
    id: String(x.id),
    tipo: x.tipo as TipoAviso,
    titulo: x.titulo,
    detalle: x.detalle,
    enlace: x.enlace,
    leido: Boolean(x.leido),
    creado: x.creado_en,
  }));
}

export async function contarNoLeidos(invitacionId: string): Promise<number> {
  if (modoDemo()) return memoria().avisos.filter((x) => x.invitacion_id === invitacionId && !x.leido).length;
  const db = servicio();
  if (!db) return 0;
  const { count } = await db
    .from("avisos")
    .select("id", { count: "exact", head: true })
    .eq("invitacion_id", invitacionId)
    .eq("leido", false);
  return count ?? 0;
}

/** `ids` vacío = todos. */
export async function marcarLeidos(invitacionId: string, ids: string[] = []): Promise<boolean> {
  if (modoDemo()) {
    for (const x of memoria().avisos) {
      if (x.invitacion_id === invitacionId && (!ids.length || ids.includes(x.id))) x.leido = true;
    }
    return true;
  }
  const db = servicio();
  if (!db) return false;
  let q = db.from("avisos").update({ leido: true }).eq("invitacion_id", invitacionId).eq("leido", false);
  if (ids.length) q = q.in("id", ids.slice(0, 200));
  const { error } = await q;
  return !error;
}

export async function marcarEnviados(ids: string[]) {
  if (!ids.length) return;
  const ahora = new Date().toISOString();
  if (modoDemo()) {
    for (const x of memoria().avisos) if (ids.includes(x.id)) x.enviado_en = ahora;
    return;
  }
  const db = servicio();
  if (!db) return;
  for (let i = 0; i < ids.length; i += 200) {
    await db.from("avisos").update({ enviado_en: ahora }).in("id", ids.slice(i, i + 200));
  }
}

/** Lo que aún no ha salido por email, de una boda (para el resumen). */
export async function pendientesDeEnviar(invitacionId: string): Promise<Aviso[]> {
  if (modoDemo()) {
    return memoria()
      .avisos.filter((x) => x.invitacion_id === invitacionId && !x.enviado_en)
      .map(sinInternos);
  }
  const db = servicio();
  if (!db) return [];
  const { data } = await db
    .from("avisos")
    .select("id, tipo, titulo, detalle, enlace, leido, creado_en")
    .eq("invitacion_id", invitacionId)
    .is("enviado_en", null)
    .order("creado_en", { ascending: true })
    .limit(300);
  return (data ?? []).map((x) => ({
    id: String(x.id),
    tipo: x.tipo as TipoAviso,
    titulo: x.titulo,
    detalle: x.detalle,
    enlace: x.enlace,
    leido: Boolean(x.leido),
    creado: x.creado_en,
  }));
}

/** Bodas con algo pendiente de mandar (para el cron del resumen diario). */
export async function bodasConPendientes(): Promise<string[]> {
  if (modoDemo()) return [...new Set(memoria().avisos.filter((x) => !x.enviado_en).map((x) => x.invitacion_id))];
  const db = servicio();
  if (!db) return [];
  const { data } = await db.from("avisos").select("invitacion_id").is("enviado_en", null).limit(5000);
  return [...new Set((data ?? []).map((x) => String(x.invitacion_id)))];
}

// ───────────────────────────────────────────────────────────── preferencias

export async function leerPreferencias(invitacionId: string): Promise<Preferencias> {
  if (modoDemo()) {
    const p = memoria().prefs.get(invitacionId);
    return p ? limpiar(p) : { ...PREFERENCIAS_INICIALES };
  }
  const db = servicio();
  if (!db) return { ...PREFERENCIAS_INICIALES };
  const { data } = await db.from("avisos_preferencias").select("*").eq("invitacion_id", invitacionId).maybeSingle();
  return data ? limpiar(data as Record<string, unknown>) : { ...PREFERENCIAS_INICIALES };
}

function limpiar(x: Record<string, unknown>): Preferencias {
  const p = { ...PREFERENCIAS_INICIALES };
  for (const t of TIPOS_AVISO) if (esFrecuencia(x[t])) p[t] = x[t];
  return p;
}

export async function guardarPreferencias(invitacionId: string, p: Preferencias): Promise<boolean> {
  if (modoDemo()) {
    const m = memoria().prefs;
    m.set(invitacionId, { ...p, ultimo_resumen: m.get(invitacionId)?.ultimo_resumen ?? null });
    return true;
  }
  const db = servicio();
  if (!db) return false;
  const { error } = await db
    .from("avisos_preferencias")
    .upsert({ invitacion_id: invitacionId, ...p, actualizado_en: new Date().toISOString() }, { onConflict: "invitacion_id" });
  if (error) console.error("[avisos.preferencias]", error.message);
  return !error;
}

export async function marcarResumen(invitacionId: string) {
  const ahora = new Date().toISOString();
  if (modoDemo()) {
    const m = memoria().prefs;
    m.set(invitacionId, { ...(m.get(invitacionId) ?? PREFERENCIAS_INICIALES), ultimo_resumen: ahora });
    return;
  }
  const db = servicio();
  if (!db) return;
  const actual = await leerPreferencias(invitacionId);
  await db
    .from("avisos_preferencias")
    .upsert({ invitacion_id: invitacionId, ...actual, ultimo_resumen: ahora }, { onConflict: "invitacion_id" });
}

// ─────────────────────────────────────────────────────────────────── push

export async function guardarSuscripcion(
  invitacionId: string,
  s: { endpoint: string; p256dh: string | null; auth: string | null },
): Promise<boolean> {
  if (modoDemo()) {
    const m = memoria();
    m.push = m.push.filter((x) => x.endpoint !== s.endpoint);
    m.push.push({ id: nuevoId(), invitacion_id: invitacionId, ...s });
    return true;
  }
  const db = servicio();
  if (!db) return false;
  const { error } = await db
    .from("avisos_push")
    .upsert({ invitacion_id: invitacionId, ...s }, { onConflict: "endpoint" });
  return !error;
}

export async function quitarSuscripcion(endpoint: string, invitacionId?: string) {
  if (modoDemo()) {
    const m = memoria();
    m.push = m.push.filter((x) => !(x.endpoint === endpoint && (!invitacionId || x.invitacion_id === invitacionId)));
    return;
  }
  const db = servicio();
  if (!db) return;
  let q = db.from("avisos_push").delete().eq("endpoint", endpoint);
  if (invitacionId) q = q.eq("invitacion_id", invitacionId);
  await q;
}

export async function suscripciones(invitacionId: string): Promise<Push[]> {
  if (modoDemo()) return memoria().push.filter((x) => x.invitacion_id === invitacionId);
  const db = servicio();
  if (!db) return [];
  const { data } = await db
    .from("avisos_push")
    .select("id, invitacion_id, endpoint, p256dh, auth")
    .eq("invitacion_id", invitacionId);
  return (data ?? []) as Push[];
}

/** La boda de una suscripción (para que el service worker pida el último aviso). */
export async function bodaDeSuscripcion(endpoint: string): Promise<string | null> {
  if (modoDemo()) return memoria().push.find((x) => x.endpoint === endpoint)?.invitacion_id ?? null;
  const db = servicio();
  if (!db) return null;
  const { data } = await db.from("avisos_push").select("invitacion_id").eq("endpoint", endpoint).maybeSingle();
  return data ? String(data.invitacion_id) : null;
}
