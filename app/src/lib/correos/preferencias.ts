import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { SITIO_URL } from "@/lib/enlaces";
import { servicio } from "@/lib/supabase/clientes";
import { archivoLocal, modoDatos } from "@/lib/visitas/local";
import { esEmail, normalizarEmail } from "./enviar";
import {
  GRUPO_DE,
  PREFERENCIAS_CORREO_INICIALES,
  type GrupoPreferencia,
  type IdCorreo,
  type IdNovios,
  type PreferenciasCorreo,
} from "./tipos";

/**
 * Preferencias de correo POR EMAIL (no por boda): una persona decide qué le
 * llega, tenga una boda o dos. Tabla `correos_preferencias`.
 *
 * Los enlaces de baja y de preferencias no necesitan sesión: llevan el email
 * y una firma HMAC (`CORREOS_SECRETO`). Quien tiene el enlace es quien
 * recibió el correo; con él solo se puede cambiar qué correos le llegan.
 */

export const GRUPOS: GrupoPreferencia[] = ["servicio", "rsvp", "cuenta-atras", "fidelizacion"];

export const TEXTO_GRUPO: Record<GrupoPreferencia, { nombre: string; ayuda: string }> = {
  servicio: {
    nombre: "Vuestra invitación",
    ayuda: "Bienvenida, recordatorios para terminarla, cuando se publica y el álbum después de la boda.",
  },
  rsvp: {
    nombre: "Confirmaciones",
    ayuda: "Un resumen semanal de quién ha respondido y el aviso de la fecha límite.",
  },
  "cuenta-atras": {
    nombre: "Cuenta atrás",
    ayuda: "Tres notas cortas: a 30 días, a una semana y la víspera. Solo lo de Invitoo.",
  },
  fidelizacion: {
    nombre: "Después de la boda",
    ayuda: "Pediros una reseña, el código para amigos que se casan y la felicitación del aniversario.",
  },
};

type Fila = { email: string; grupos: PreferenciasCorreo; baja_total: boolean; actualizado: string };
const local = archivoLocal<{ prefs: Record<string, Fila> }>(".correos-local", "preferencias", () => ({ prefs: {} }));

// ─────────────────────────────────────────────────────────── firma

function secreto(): string {
  const s =
    process.env.CORREOS_SECRETO ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (process.env.NODE_ENV === "production" ? "" : "invitoo-local-correos");
  if (!s) console.error("[correos.preferencias] falta CORREOS_SECRETO: los enlaces de baja no se podrán verificar");
  return s;
}

function firma(email: string): string {
  return createHmac("sha256", secreto()).update(`baja:${email}`).digest("base64url").slice(0, 32);
}

export function codificarEmail(email: string) {
  return Buffer.from(normalizarEmail(email)).toString("base64url");
}

/** Devuelve el email si `e` y `t` (de la URL) casan; si no, null. */
export function verificar(e: unknown, t: unknown): string | null {
  if (typeof e !== "string" || typeof t !== "string" || e.length > 400 || t.length > 64) return null;
  let email: string;
  try {
    email = normalizarEmail(Buffer.from(e, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!esEmail(email) || !secreto()) return null;
  const a = Buffer.from(firma(email));
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b) ? email : null;
}

/** /baja?e=…&t=… — la página de preferencias (y de baja). */
export function enlacePreferencias(email: string, base = SITIO_URL) {
  return `${base}/baja?e=${codificarEmail(email)}&t=${firma(normalizarEmail(email))}`;
}
/** El enlace de baja del pie: abre la página con la baja ya preparada (un clic para confirmar). */
export function enlaceBaja(email: string, base = SITIO_URL) {
  return `${enlacePreferencias(email, base)}&baja=1`;
}
/**
 * La URL del `List-Unsubscribe` (POST de un clic de Gmail y Yahoo). Con
 * `grupo`, la baja apaga solo ese grupo (el del correo en el que se pulsó).
 * El grupo no va firmado a propósito: solo puede RESTRINGIR lo que ya permite
 * la firma del email (con el enlace se podría apagar todo igualmente).
 */
export function enlaceBajaUnClic(email: string, grupo?: GrupoPreferencia, base = SITIO_URL) {
  const g = grupo && GRUPOS.includes(grupo) ? `&g=${grupo}` : "";
  return `${base}/api/correos/baja?e=${codificarEmail(email)}&t=${firma(normalizarEmail(email))}${g}`;
}

export function esGrupo(x: unknown): x is GrupoPreferencia {
  return typeof x === "string" && (GRUPOS as string[]).includes(x);
}

// ─────────────────────────────────────────────────────────── datos

export type EstadoPreferencias = { grupos: PreferenciasCorreo; bajaTotal: boolean };

export async function leerPreferencias(email: string): Promise<EstadoPreferencias> {
  email = normalizarEmail(email);
  const vacio = { grupos: { ...PREFERENCIAS_CORREO_INICIALES }, bajaTotal: false };
  const modo = modoDatos();
  let fila: Fila | null = null;
  if (modo === "local") fila = (await local.leer()).prefs[email] ?? null;
  else if (modo === "supabase") {
    const { data, error } = await servicio()!.from("correos_preferencias").select("*").eq("email", email).maybeSingle();
    if (error) console.error("[correos.leerPreferencias]", error.message);
    fila = (data as Fila) ?? null;
  }
  if (!fila) return vacio;
  return { grupos: { ...PREFERENCIAS_CORREO_INICIALES, ...(fila.grupos ?? {}) }, bajaTotal: Boolean(fila.baja_total) };
}

export async function guardarPreferencias(email: string, p: EstadoPreferencias): Promise<boolean> {
  email = normalizarEmail(email);
  const grupos = Object.fromEntries(GRUPOS.map((g) => [g, Boolean(p.grupos[g])])) as PreferenciasCorreo;
  const fila: Fila = { email, grupos, baja_total: p.bajaTotal, actualizado: new Date().toISOString() };
  const modo = modoDatos();
  if (modo === "local") {
    (await local.leer()).prefs[email] = fila;
    await local.guardarYa();
    return true;
  }
  if (modo !== "supabase") return false;
  const { error } = await servicio()!.from("correos_preferencias").upsert(fila, { onConflict: "email" });
  if (error) console.error("[correos.guardarPreferencias]", error.message);
  return !error;
}

/**
 * Baja. Sin `grupo`, de todo lo que se puede apagar (el botón de /baja). Con
 * `grupo`, solo de ese (el «Cancelar suscripción» de Gmail en un correo de ese grupo).
 */
export async function darDeBaja(email: string, grupo?: GrupoPreferencia): Promise<boolean> {
  if (grupo) {
    const p = await leerPreferencias(email);
    return guardarPreferencias(email, { grupos: { ...p.grupos, [grupo]: false }, bajaTotal: p.bajaTotal });
  }
  const grupos = Object.fromEntries(GRUPOS.map((g) => [g, false])) as PreferenciasCorreo;
  return guardarPreferencias(email, { grupos, bajaTotal: true });
}

/**
 * ¿Puede salir este correo a este email? Los del estudio, siempre. Los
 * marcados `imprescindible` (p. ej. que el álbum se va a borrar) son de
 * servicio y salen siempre: perder las fotos de la boda por haberse dado de
 * baja de las reseñas sería peor que un correo.
 */
export async function puedeRecibir(email: string, id: IdCorreo, imprescindible = false): Promise<boolean> {
  if (!(id in GRUPO_DE)) return true;
  if (imprescindible) return true;
  const p = await leerPreferencias(email);
  if (p.bajaTotal) return false;
  return p.grupos[GRUPO_DE[id as IdNovios]] !== false;
}
