import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { urlsLectura } from "./almacen";
import { leerDiseno, listarMomentos, obtenerMomento, totalVisibles, type Boda } from "./datos";
import type { ConfigDirecto, Feed, FilaMomento, MomentoModeracion, MomentoPublico } from "./tipos";

/**
 * Piezas de servidor que comparten la subida, la pantalla y el control:
 * URLs firmadas, el feed, el aviso en tiempo real y el antispam por IP.
 */

export function iguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** ¿Sigue online? (`retencion_hasta`.) Pasada la fecha, ni se ve ni se sube. */
export function vigente(c: ConfigDirecto) {
  return !c.retencion_hasta || new Date(c.retencion_hasta).getTime() > Date.now();
}

// ──────────────────────────────────────────────────────────── a navegador

type Version = "grande" | "pantalla" | "miniatura";

/** Filas → objetos con URLs firmadas. Solo firma las versiones que se piden. */
export async function aPublicos(
  filas: FilaMomento[],
  versiones: Version[],
  segundos = 15 * 60,
): Promise<MomentoPublico[]> {
  const rutas: string[] = [];
  for (const f of filas) {
    if (versiones.includes("grande") && f.ruta) rutas.push(f.ruta);
    // La TV quiere la de 1280; si es un vídeo, el propio vídeo.
    if (versiones.includes("pantalla")) {
      if (f.ruta_pantalla) rutas.push(f.ruta_pantalla);
      else if (f.ruta) rutas.push(f.ruta);
    }
    if (versiones.includes("miniatura") && f.ruta_miniatura) rutas.push(f.ruta_miniatura);
  }
  const urls = await urlsLectura(rutas, segundos);
  const u = (r: string | null) => (r ? (urls.get(r) ?? null) : null);
  return filas.map((f) => ({
    id: f.id,
    tipo: f.tipo,
    url: versiones.includes("grande") ? u(f.ruta) : null,
    pantalla: versiones.includes("pantalla") ? u(f.ruta_pantalla ?? f.ruta) : null,
    miniatura: versiones.includes("miniatura") ? u(f.ruta_miniatura) : null,
    ancho: f.ancho,
    alto: f.alto,
    duracion: f.duracion,
    autor: f.autor,
    mensaje: f.mensaje,
    destacado: f.destacado,
    capitulo: f.capitulo,
    creado: f.creado,
  }));
}

export async function aModeracion(filas: FilaMomento[]): Promise<MomentoModeracion[]> {
  const publicos = await aPublicos(filas, ["grande", "miniatura"], 60 * 60);
  return publicos.map((p, i) => ({
    ...p,
    estado: filas[i].estado,
    bytes: filas[i].bytes,
    retiradaPedida: Boolean(filas[i].retirada_pedida),
  }));
}

/**
 * El feed de lo visible. `desde` = solo lo nuevo; sin `desde`, lo último
 * (`limite`) y la lista de ids visibles para que la pantalla quite lo que
 * se haya ocultado.
 */
export async function construirFeed(
  boda: Boda & { id: string },
  config: ConfigDirecto,
  opciones: { para: "pantalla" | "invitado"; desde?: string | null; limite?: number },
): Promise<Feed> {
  const ahora = new Date().toISOString();
  const abierto = config.activo && vigente(config);
  if (!abierto) {
    return { momentos: [], ahora, activo: false, subidasAbiertas: false, total: 0, ids: [] };
  }
  const desde = opciones.desde && !Number.isNaN(Date.parse(opciones.desde)) ? opciones.desde : null;
  const filas = await listarMomentos(boda.id, {
    estados: ["visible"],
    desde,
    limite: opciones.limite ?? (opciones.para === "pantalla" ? 300 : 60),
  });
  const versiones: Version[] = opciones.para === "pantalla" ? ["pantalla"] : ["miniatura", "grande"];
  // La pantalla guarda lo que ya bajó; aun así, una hora da margen a la wifi.
  const momentos = await aPublicos(filas, versiones, opciones.para === "pantalla" ? 3600 : 15 * 60);
  const feed: Feed = {
    momentos,
    ahora,
    activo: true,
    subidasAbiertas: config.subidas_abiertas,
    total: await totalVisibles(boda.id),
  };
  if (!desde) feed.ids = filas.map((f) => f.id);
  if (opciones.para === "pantalla") {
    const fijado = config.mensaje_fijado ? await obtenerMomento(boda.id, config.mensaje_fijado) : null;
    feed.fijado = fijado && fijado.estado === "visible" ? (await aPublicos([fijado], ["pantalla"]))[0] : null;
    feed.capitulo =
      config.capitulo && config.capitulo_desde ? { titulo: config.capitulo, desde: config.capitulo_desde } : null;
    feed.diseno = await leerDiseno(boda.id);
  }
  return feed;
}

// ──────────────────────────────────────────────────────────── tiempo real

function secretoCanal() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MOMENTOS_LOCAL_SECRETO || "invitoo-local";
}

/**
 * Nombres de canal de Supabase Realtime (Broadcast). No se pueden adivinar:
 * el de la pantalla depende de la clave (si se regenera, cambia) y el del
 * panel de un secreto del servidor. Por el canal solo viaja un «hay algo
 * nuevo»; los datos se piden después al feed, que sí comprueba la clave.
 */
export function canalPantalla(c: ConfigDirecto) {
  const h = createHmac("sha256", secretoCanal()).update(`pantalla:${c.invitacion_id}:${c.clave_pantalla}`);
  return `directo-${h.digest("hex").slice(0, 32)}`;
}
/**
 * El código corto de la TV (`invitoo.es/tv` + 6 caracteres): se teclea con
 * el mando. Sale de la clave de la pantalla con un HMAC del servidor, así
 * que no se puede deducir del slug y cambia al regenerar la clave. Sin
 * letras que se confunden (0/O, 1/I/L). 31^6 ≈ 887 millones de códigos.
 */
export const ALFABETO_TV = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function codigoTv(c: Pick<ConfigDirecto, "invitacion_id" | "clave_pantalla">) {
  const h = createHmac("sha256", secretoCanal()).update(`tv:${c.invitacion_id}:${c.clave_pantalla}`).digest();
  let s = "";
  for (let i = 0; i < 6; i++) s += ALFABETO_TV[h[i] % ALFABETO_TV.length];
  return s;
}

/** El del muro «En directo» de los invitados: depende del token del QR. */
export function canalInvitados(c: ConfigDirecto) {
  const h = createHmac("sha256", secretoCanal()).update(`invitados:${c.invitacion_id}:${c.token_subida}`);
  return `muro-${h.digest("hex").slice(0, 32)}`;
}
export function canalPanel(c: ConfigDirecto) {
  const h = createHmac("sha256", secretoCanal()).update(`panel:${c.invitacion_id}`);
  return `panel-${h.digest("hex").slice(0, 32)}`;
}

/** Config pública de Realtime para el navegador (o null si no hay Supabase). */
export function realtimePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anon ? { url, anon } : null;
}

/**
 * Avisa a la pantalla y al panel. Fuego y olvido: si falla, el polling de la
 * pantalla lo recoge en unos segundos.
 */
export async function avisar(c: ConfigDirecto, evento: "nuevo" | "cambio") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: clave, authorization: `Bearer ${clave}`, "content-type": "application/json" },
      body: JSON.stringify({
        messages: [canalPantalla(c), canalPanel(c), canalInvitados(c)].map((topic) => ({
          topic,
          event: evento,
          payload: { t: Date.now() },
          private: false,
        })),
      }),
      signal: AbortSignal.timeout(2500),
    });
  } catch (e) {
    console.warn("[momentos.avisar]", (e as Error).message);
  }
}

// ──────────────────────────────────────────────────────────── antispam IP

/**
 * Red gruesa por IP y minuto, en memoria del proceso. No es la defensa
 * principal (en Vercel cada instancia lleva su cuenta y el salón entero sale
 * por la misma IP): la principal es el límite por dispositivo en la base.
 */
export async function ritmoIp(clave: string, maximo: number, ventanaMs = 60_000): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "?";
  const g = globalThis as { __invitooRitmo?: Map<string, number[]> };
  const mapa = (g.__invitooRitmo ??= new Map<string, number[]>());
  const k = `${clave}:${ip}`;
  const ahora = Date.now();
  const marcas = (mapa.get(k) ?? []).filter((t) => ahora - t < ventanaMs);
  if (marcas.length >= maximo) {
    mapa.set(k, marcas);
    return false;
  }
  marcas.push(ahora);
  mapa.set(k, marcas);
  if (mapa.size > 5000) {
    for (const [x, v] of mapa) if (!v.some((t) => ahora - t < 3_600_000)) mapa.delete(x);
  }
  return true;
}

// ──────────────────────────────────────────────────────────────── enlaces

/**
 * La base de los enlaces que van en el QR. En producción, el dominio
 * (`NEXT_PUBLIC_SITIO_URL`); en desarrollo, el host de la petición, para que
 * el QR funcione desde el móvil en la misma wifi.
 */
export async function baseUrl() {
  const fija = process.env.NEXT_PUBLIC_SITIO_URL;
  if (fija) return fija.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return "https://invitoo.es";
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function enlacesDe(slug: string, c: ConfigDirecto) {
  const base = await baseUrl();
  return {
    // Enlace corto para el QR cuando el token es único (en producción).
    subida: /^[a-f0-9]{8,32}$/.test(c.token_subida)
      ? `${base}/m/${c.token_subida}`
      : `${base}/i/${slug}/momentos?t=${encodeURIComponent(c.token_subida)}`,
    pantalla: `${base}/directo/${slug}?k=${encodeURIComponent(c.clave_pantalla)}`,
    /** Para la tele: `invitoo.es/tv` y el código de 6. */
    tv: `${base.replace(/^https?:\/\//, "")}/tv`,
    codigoTv: codigoTv(c),
  };
}
