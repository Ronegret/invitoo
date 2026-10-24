import "server-only";

import { randomBytes } from "node:crypto";
import { servicio } from "@/lib/supabase/clientes";
import { diaMadrid, diasEntre } from "@/lib/visitas/registrar";
import { archivoLocal, modoDatos } from "@/lib/visitas/local";
import type { Categoria, Correo, IdCorreo } from "./tipos";

/**
 * El envío de un correo, con todo lo que pide la entregabilidad:
 *
 *  · IDEMPOTENCIA: cada envío tiene una `clave` (boda · paso · destinatario,
 *    y el periodo si se repite). Está en `correos_envios` con índice único:
 *    el mismo correo no sale dos veces a la misma persona. A Resend también
 *    le va como `Idempotency-Key`.
 *  · LÍMITES: como mucho `CORREOS_POR_PERSONA_DIA` (1) a cada pareja al día y
 *    `CORREOS_LIMITE_DIA` (90, por debajo de los 100/día del plan gratuito de
 *    Resend) en total. Lo que no cabe se queda «aplazado» y lo recoge el cron
 *    siguiente. Los correos del estudio no cuentan.
 *  · REINTENTOS con backoff: 3 intentos (0,6 s · 2 s) ante 429/5xx o red; si
 *    aun así falla, queda «fallido» con su contenido y el cron lo reintenta
 *    al día siguiente (hasta 4 veces).
 *  · BAJA: `List-Unsubscribe` (URL + mailto) y `List-Unsubscribe-Post:
 *    List-Unsubscribe=One-Click` en todo correo a los novios.
 *  · SIN RESEND (local, demo): no sale nada. Se guarda en el buzón
 *    `.correos-local/buzon.json`, que enseña `/estudio/correos`.
 *
 * Variables: RESEND_API_KEY · AVISOS_REMITENTE · CORREOS_RESPONDER_A (Reply-To,
 * info@invitoo.es por defecto).
 */

export type EstadoEnvio = "pendiente" | "enviado" | "buzon" | "fallido" | "omitido" | "aplazado";

export type FilaEnvio = {
  clave: string;
  correo: IdCorreo | "__inicio__";
  categoria: Categoria;
  email: string;
  invitacion_id: string | null;
  slug: string | null;
  estado: EstadoEnvio;
  intentos: number;
  error: string | null;
  resend_id: string | null;
  asunto: string | null;
  /** Solo si falló: lo necesario para reintentar sin volver a montar el correo. */
  carga: (Correo & { baja?: string | null }) | null;
  /** Día (Madrid) en que salió o se intentó. */
  dia: string;
  creado: string;
  enviado_en: string | null;
};

export type CorreoBuzon = {
  id: string;
  clave: string;
  correo: IdCorreo;
  categoria: Categoria;
  para: string;
  de: string;
  asunto: string;
  preheader: string;
  html: string;
  texto: string;
  cabeceras: Record<string, string>;
  creado: string;
};

type Local = { envios: Record<string, FilaEnvio>; buzon: CorreoBuzon[] };
const local = archivoLocal<Local>(".correos-local", "correos", () => ({ envios: {}, buzon: [] }));

const MAX_BUZON = 300;
const EMAIL = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i;
export const normalizarEmail = (e: string) => e.trim().toLowerCase();
export const esEmail = (e: string) => EMAIL.test(e) && e.length <= 200;
/** Para los logs: «a••@gmail.com». Ningún email entero acaba en los logs de Vercel. */
export const velar = (t: string) => t.replace(/([^\s@<>"',;:]{1})[^\s@<>"',;:]*@/g, "$1••@");

export function hayResend() {
  return Boolean(process.env.RESEND_API_KEY);
}
export function remitente() {
  return process.env.AVISOS_REMITENTE || "Invitoo <avisos@invitoo.es>";
}

const entero = (v: string | undefined, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : def;
};
export const limitePersonaDia = () => entero(process.env.CORREOS_POR_PERSONA_DIA, 1);
export const limiteDia = () => entero(process.env.CORREOS_LIMITE_DIA, 90);

// ─────────────────────────────────────────────────────────── registro

export async function leerEnvio(clave: string): Promise<FilaEnvio | null> {
  const modo = modoDatos();
  if (modo === "local") return (await local.leer()).envios[clave] ?? null;
  if (modo !== "supabase") return null;
  const { data } = await servicio()!.from("correos_envios").select("*").eq("clave", clave).maybeSingle();
  return (data as FilaEnvio) ?? null;
}

/** Varias claves de golpe (el cron mira muchas). */
export async function leerEnvios(claves: string[]): Promise<Map<string, FilaEnvio>> {
  const m = new Map<string, FilaEnvio>();
  if (!claves.length) return m;
  const modo = modoDatos();
  if (modo === "local") {
    const l = await local.leer();
    for (const c of claves) if (l.envios[c]) m.set(c, l.envios[c]);
    return m;
  }
  if (modo !== "supabase") return m;
  for (let i = 0; i < claves.length; i += 200) {
    const { data } = await servicio()!.from("correos_envios").select("*").in("clave", claves.slice(i, i + 200));
    for (const f of (data ?? []) as FilaEnvio[]) m.set(f.clave, f);
  }
  return m;
}

/** Envíos de una boda (para el ancla «publicada» y la ficha del estudio). */
export async function enviosDeBoda(invitacionId: string): Promise<FilaEnvio[]> {
  const modo = modoDatos();
  if (modo === "local") return Object.values((await local.leer()).envios).filter((f) => f.invitacion_id === invitacionId);
  if (modo !== "supabase") return [];
  const { data } = await servicio()!.from("correos_envios").select("*").eq("invitacion_id", invitacionId).limit(500);
  return (data ?? []) as FilaEnvio[];
}

export async function guardarEnvio(f: FilaEnvio): Promise<void> {
  const modo = modoDatos();
  if (modo === "local") {
    (await local.leer()).envios[f.clave] = f;
    local.guardar();
    return;
  }
  if (modo !== "supabase") return;
  const { error } = await servicio()!.from("correos_envios").upsert(f, { onConflict: "clave" });
  if (error) console.error("[correos.guardarEnvio]", error.message);
}

/**
 * Reserva la clave: la inserta como «pendiente» si no existía. Devuelve la
 * fila que manda (la nueva o la que ya estaba). Con Supabase, la carrera
 * entre dos crons la resuelve el índice único.
 */
async function reservar(f: FilaEnvio): Promise<{ fila: FilaEnvio; nueva: boolean }> {
  const modo = modoDatos();
  if (modo === "local") {
    const l = await local.leer();
    const previa = l.envios[f.clave];
    if (previa) return { fila: previa, nueva: false };
    l.envios[f.clave] = f;
    local.guardar();
    return { fila: f, nueva: true };
  }
  if (modo !== "supabase") return { fila: f, nueva: true };
  const db = servicio()!;
  const { data, error } = await db
    .from("correos_envios")
    .upsert(f, { onConflict: "clave", ignoreDuplicates: true })
    .select("*");
  if (error) console.error("[correos.reservar]", error.message);
  if (data && data.length) return { fila: data[0] as FilaEnvio, nueva: true };
  const previa = await leerEnvio(f.clave);
  return previa ? { fila: previa, nueva: false } : { fila: f, nueva: true };
}

/** Cuántos han salido hoy: en total (novios) y a este email. */
async function contarHoy(dia: string, email: string): Promise<{ total: number; persona: number }> {
  const salidos: EstadoEnvio[] = ["enviado", "buzon"];
  const modo = modoDatos();
  if (modo === "local") {
    const hoy = Object.values((await local.leer()).envios).filter((f) => f.dia === dia && salidos.includes(f.estado) && f.categoria !== "estudio");
    return { total: hoy.length, persona: hoy.filter((f) => f.email === email).length };
  }
  if (modo !== "supabase") return { total: 0, persona: 0 };
  const db = servicio()!;
  const base = () => db.from("correos_envios").select("clave", { count: "exact", head: true }).eq("dia", dia).in("estado", salidos).neq("categoria", "estudio");
  const [t, p] = await Promise.all([base(), base().eq("email", email)]);
  return { total: t.count ?? 0, persona: p.count ?? 0 };
}

// ─────────────────────────────────────────────────────────── buzón local

export async function leerBuzon(): Promise<CorreoBuzon[]> {
  if (modoDatos() !== "local") return [];
  return (await local.leer()).buzon;
}
export async function vaciarBuzon(): Promise<void> {
  if (modoDatos() !== "local") return;
  const l = await local.leer();
  l.buzon = [];
  // También se olvidan los envíos: así se puede volver a probar la secuencia.
  l.envios = {};
  await local.guardarYa();
}

async function alBuzon(c: Omit<CorreoBuzon, "id" | "creado">) {
  if (modoDatos() !== "local") {
    console.info(`[correos] (sin RESEND_API_KEY, no se envía) ${c.correo} → ${velar(c.para)}`);
    return;
  }
  const l = await local.leer();
  l.buzon.unshift({ ...c, id: randomBytes(6).toString("hex"), creado: new Date().toISOString() });
  if (l.buzon.length > MAX_BUZON) l.buzon.length = MAX_BUZON;
  local.guardar();
  console.info(`[correos] al buzón local: ${c.correo} → ${velar(c.para)}`);
}

// ─────────────────────────────────────────────────────────── Resend

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function resend(
  cuerpo: Record<string, unknown>,
  idempotencia: string,
): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const clave = process.env.RESEND_API_KEY!;
  const pausas = [0, 600, 2000];
  let ultimo = "";
  for (const pausa of pausas) {
    if (pausa) await espera(pausa);
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clave}`,
          "Content-Type": "application/json",
          // Resend recuerda la clave 24 h: un reintento nuestro no duplica.
          "Idempotency-Key": idempotencia.slice(0, 256),
        },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(10_000),
      });
      if (r.ok) {
        const j = (await r.json().catch(() => ({}))) as { id?: string };
        return { ok: true, id: j.id ?? null };
      }
      ultimo = `${r.status} ${(await r.text()).slice(0, 300)}`;
      // 4xx (salvo 429) no se arregla reintentando: datos mal, dominio sin verificar…
      if (r.status !== 429 && r.status < 500) break;
      const tras = Number(r.headers.get("retry-after"));
      if (Number.isFinite(tras) && tras > 0 && tras < 10) await espera(tras * 1000);
    } catch (e) {
      ultimo = (e as Error).message;
    }
  }
  return { ok: false, error: ultimo || "error desconocido" };
}

// ─────────────────────────────────────────────────────────── enviar

export type Envio = {
  clave: string;
  para: string;
  idCorreo: IdCorreo;
  categoria: Categoria;
  correo: Correo;
  /** URL de baja de un clic (List-Unsubscribe). Obligatoria para los novios. */
  baja?: string | null;
  invitacionId?: string | null;
  slug?: string | null;
  /** Día (Madrid) que cuenta para el límite; el cron lo pasa al simular `?hoy=`. */
  dia?: string;
  /** Confirmación de compra: no cuenta ni respeta el límite diario. */
  prioritario?: boolean;
};

export type ResultadoEnvio = "enviado" | "buzon" | "repetido" | "aplazado" | "fallido" | "invalido";

const MAX_INTENTOS = 4;

export async function enviarCorreo(e: Envio): Promise<ResultadoEnvio> {
  try {
    const para = normalizarEmail(e.para);
    if (!esEmail(para)) return "invalido";
    const dia = e.dia ?? diaMadrid();
    const ahora = new Date().toISOString();
    const { fila, nueva } = await reservar({
      clave: e.clave,
      correo: e.idCorreo,
      categoria: e.categoria,
      email: para,
      invitacion_id: e.invitacionId ?? null,
      slug: e.slug ?? null,
      estado: "pendiente",
      intentos: 0,
      error: null,
      resend_id: null,
      asunto: e.correo.asunto.slice(0, 200),
      carga: null,
      dia,
      creado: ahora,
      enviado_en: null,
    });
    if (!nueva) {
      if (fila.estado === "enviado" || fila.estado === "buzon" || fila.estado === "omitido") return "repetido";
      if (fila.estado === "fallido" && fila.intentos >= MAX_INTENTOS) return "repetido";
      // «pendiente» de hace menos de 10 minutos: otro proceso lo está enviando.
      if (fila.estado === "pendiente" && Date.now() - new Date(fila.creado).getTime() < 10 * 60_000 && fila.intentos === 0 && fila.dia === dia) {
        return "repetido";
      }
    }

    if (e.categoria !== "estudio" && !e.prioritario) {
      const hoy = await contarHoy(dia, para);
      if (hoy.persona >= limitePersonaDia() || hoy.total >= limiteDia()) {
        await guardarEnvio({ ...fila, estado: "aplazado", dia });
        return "aplazado";
      }
    }

    const cabeceras: Record<string, string> = { "Reply-To": responderA() };
    if (e.baja) {
      const mailto = buzonBaja();
      cabeceras["List-Unsubscribe"] = mailto ? `<${e.baja}>, <mailto:${mailto}?subject=baja>` : `<${e.baja}>`;
      cabeceras["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    if (!hayResend()) {
      await alBuzon({
        clave: e.clave,
        correo: e.idCorreo,
        categoria: e.categoria,
        para,
        de: remitente(),
        asunto: e.correo.asunto,
        preheader: e.correo.preheader,
        html: e.correo.html,
        texto: e.correo.texto,
        cabeceras,
      });
      await guardarEnvio({ ...fila, estado: "buzon", intentos: fila.intentos + 1, dia, enviado_en: ahora, error: null, carga: null });
      return "buzon";
    }

    const r = await resend(
      {
        from: remitente(),
        to: [para],
        subject: e.correo.asunto,
        html: e.correo.html,
        text: e.correo.texto,
        reply_to: responderA(),
        ...(e.baja ? { headers: { "List-Unsubscribe": cabeceras["List-Unsubscribe"], "List-Unsubscribe-Post": cabeceras["List-Unsubscribe-Post"] } } : {}),
        tags: [
          { name: "correo", value: e.idCorreo.replace(/[^A-Za-z0-9_-]/g, "_") },
          { name: "categoria", value: e.categoria },
        ],
      },
      e.clave,
    );
    if (r.ok) {
      await guardarEnvio({ ...fila, estado: "enviado", intentos: fila.intentos + 1, dia, enviado_en: new Date().toISOString(), resend_id: r.id, error: null, carga: null });
      return "enviado";
    }
    console.error("[correos.enviar]", e.idCorreo, velar(r.error));
    await guardarEnvio({
      ...fila,
      estado: "fallido",
      intentos: fila.intentos + 1,
      dia,
      error: velar(r.error).slice(0, 500),
      carga: { ...e.correo, baja: e.baja ?? null },
    });
    return "fallido";
  } catch (err) {
    console.error("[correos.enviar]", err);
    return "fallido";
  }
}

/**
 * Reintenta los fallidos de DÍAS ANTERIORES (lo llama el cron, una vez al
 * día: el backoff largo es de 1 día; el corto, 0,6 s y 2 s dentro de
 * `resend()`). Lo que falló hace más de 3 días ya no se manda: un «faltan 7
 * días» o un «mañana es el día» que llega tarde es peor que ninguno.
 */
export async function reintentarFallidos(hoy = diaMadrid()): Promise<number> {
  const modo = modoDatos();
  let filas: FilaEnvio[] = [];
  if (modo === "local") filas = Object.values((await local.leer()).envios).filter((f) => f.estado === "fallido");
  else if (modo === "supabase") {
    const { data } = await servicio()!.from("correos_envios").select("*").eq("estado", "fallido").lt("intentos", MAX_INTENTOS).limit(50);
    filas = (data ?? []) as FilaEnvio[];
  }
  let n = 0;
  for (const f of filas) {
    if (!f.carga || f.intentos >= MAX_INTENTOS || f.correo === "__inicio__") continue;
    if (f.dia >= hoy) continue; // lo de hoy ya tuvo sus 3 intentos
    if (diasEntre(f.dia, hoy) > 3) {
      await guardarEnvio({ ...f, estado: "omitido", error: `caducado tras ${f.intentos} intentos: ${f.error ?? ""}`.slice(0, 500), carga: null });
      continue;
    }
    const { baja, ...correo } = f.carga;
    const r = await enviarCorreo({
      clave: f.clave,
      para: f.email,
      idCorreo: f.correo,
      categoria: f.categoria,
      correo,
      baja,
      invitacionId: f.invitacion_id,
      slug: f.slug,
      dia: hoy,
    });
    if (r === "enviado" || r === "buzon") n++;
  }
  return n;
}

/** Borra el registro de envíos anterior a `antesDe` (plazo de conservación: 36 meses). */
export async function purgarEnvios(antesDe: string): Promise<void> {
  const modo = modoDatos();
  if (modo === "local") {
    const l = await local.leer();
    for (const [k, f] of Object.entries(l.envios)) if (f.dia < antesDe && f.correo !== "__inicio__") delete l.envios[k];
    local.guardar();
    return;
  }
  if (modo !== "supabase") return;
  const { error } = await servicio()!.from("correos_envios").delete().lt("dia", antesDe).neq("correo", "__inicio__");
  if (error) console.error("[correos.purgarEnvios]", error.message);
}

/** Marca una clave como «omitida» sin enviar (arranque del motor en producción). */
export async function omitir(f: Pick<FilaEnvio, "clave" | "correo" | "categoria" | "email" | "invitacion_id" | "slug">) {
  const ahora = new Date().toISOString();
  await reservar({
    ...f,
    estado: "omitido",
    intentos: 0,
    error: null,
    resend_id: null,
    asunto: null,
    carga: null,
    dia: diaMadrid(),
    creado: ahora,
    enviado_en: null,
  });
}

/** Reply-To: los textos invitan a responder. `CORREOS_RESPONDER_A` (o `CORREO_RESPONDER_A`); por defecto info@invitoo.es. */
export function responderA(): string {
  const e = (process.env.CORREOS_RESPONDER_A || process.env.CORREO_RESPONDER_A || "").trim();
  return e && esEmail(e) ? e : "info@invitoo.es";
}

/** El buzón que atiende las bajas por mailto (`CORREOS_BAJA_EMAIL`, opcional: la URL basta). */
export function buzonBaja(): string | null {
  const e = process.env.CORREOS_BAJA_EMAIL?.trim();
  return e && esEmail(e) ? e : null;
}

/** Para la página del estudio: los últimos envíos. */
export async function ultimosEnvios(n = 50): Promise<FilaEnvio[]> {
  const modo = modoDatos();
  if (modo === "local") {
    return Object.values((await local.leer()).envios)
      .filter((f) => f.correo !== "__inicio__")
      .sort((a, b) => b.creado.localeCompare(a.creado))
      .slice(0, n);
  }
  if (modo !== "supabase") return [];
  const { data } = await servicio()!
    .from("correos_envios")
    .select("clave, correo, categoria, email, slug, estado, intentos, error, asunto, dia, creado, enviado_en")
    .neq("correo", "__inicio__")
    .order("creado", { ascending: false })
    .limit(n);
  return (data ?? []) as FilaEnvio[];
}
