import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { servicio } from "@/lib/supabase/clientes";

/**
 * Dónde viven los archivos de «En directo». Dos backends, la misma API:
 *
 *  · **Supabase Storage** (producción): bucket privado `momentos`. El
 *    navegador sube DIRECTAMENTE a Storage con una URL firmada de subida
 *    (`createSignedUploadUrl`): los megas no pasan por Vercel. Se lee con
 *    URLs firmadas de corta duración.
 *  · **Disco local** (desarrollo, sin nube): `app/.momentos-local/`. La
 *    «URL firmada» apunta a `/api/momentos/local/<ruta>` con caducidad y una
 *    firma HMAC; ese route handler recibe el PUT y sirve el GET (con Range,
 *    que Safari lo exige para el vídeo).
 *
 * El navegador no sabe en cuál está: recibe una URL y hace PUT.
 */

const PRODUCCION = process.env.NODE_ENV === "production";
const MEMORIA_FORZADA = process.env.INVITOO_MEMORIA === "1";
export const BUCKET = "momentos";
export const DIR_LOCAL = path.join(/* turbopackIgnore: true */ process.cwd(), ".momentos-local");

export type Modo = "supabase" | "local";

/** Mismo criterio que `lib/datos.ts`: Supabase si hay service role; local en desarrollo. */
export function modoAlmacen(): Modo | null {
  if (servicio()) return "supabase";
  if (!PRODUCCION || MEMORIA_FORZADA) return "local";
  return null;
}

/** Una ruta del bucket: `<invitacion>/<f|p|m|v>/<id>.<ext>` (grande, pantalla, miniatura, vídeo). */
const RUTA = /^[A-Za-z0-9-]{1,80}\/(f|p|m|v)\/[a-z0-9]{8,40}\.(webp|jpg|png|mp4|mov|webm)$/;
export function rutaValida(ruta: string) {
  return RUTA.test(ruta) && !ruta.includes("..");
}

// ─────────────────────────────────────────────────────────────── firma local

function secreto() {
  const g = globalThis as { __invitooSecretoMomentos?: string };
  g.__invitooSecretoMomentos ??=
    process.env.MOMENTOS_LOCAL_SECRETO || randomBytes(24).toString("hex");
  return g.__invitooSecretoMomentos;
}

function firmar(op: "subir" | "leer", ruta: string, exp: number) {
  return createHmac("sha256", secreto()).update(`${op}:${ruta}:${exp}`).digest("hex").slice(0, 40);
}

export function firmaLocalValida(op: "subir" | "leer", ruta: string, exp: number, firma: string) {
  if (!rutaValida(ruta) || !Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const esperada = Buffer.from(firmar(op, ruta, exp));
  const dada = Buffer.from(firma);
  return esperada.length === dada.length && timingSafeEqual(esperada, dada);
}

function urlLocal(op: "subir" | "leer", ruta: string, segundos: number) {
  const exp = Math.floor(Date.now() / 1000) + segundos;
  return `/api/momentos/local/${ruta}?op=${op}&exp=${exp}&f=${firmar(op, ruta, exp)}`;
}

export function archivoLocal(ruta: string) {
  return path.join(DIR_LOCAL, ...ruta.split("/"));
}

/** El PUT del route handler local, con tope de tamaño. */
export async function escribirLocal(ruta: string, cuerpo: ReadableStream<Uint8Array>, max: number) {
  const destino = archivoLocal(ruta);
  await mkdir(path.dirname(destino), { recursive: true });
  let total = 0;
  const entrada = Readable.fromWeb(cuerpo as import("node:stream/web").ReadableStream<Uint8Array>);
  entrada.on("data", (trozo: Buffer) => {
    total += trozo.length;
    if (total > max) entrada.destroy(new Error("demasiado grande"));
  });
  try {
    await pipeline(entrada, createWriteStream(destino));
  } catch (e) {
    await rm(destino, { force: true });
    throw e;
  }
  return total;
}

export function leerLocal(ruta: string, inicio?: number, fin?: number) {
  return Readable.toWeb(createReadStream(archivoLocal(ruta), { start: inicio, end: fin })) as ReadableStream<Uint8Array>;
}

// ───────────────────────────────────────────────────────────────── API común

export type DestinoSubida = { url: string; cabeceras: Record<string, string> };

export async function urlSubida(ruta: string, tipoMime: string): Promise<DestinoSubida | null> {
  const modo = modoAlmacen();
  if (modo === "local") {
    return { url: urlLocal("subir", ruta, 2 * 3600), cabeceras: { "content-type": tipoMime } };
  }
  const db = servicio();
  if (!db) return null;
  // upsert: si el móvil reintenta tras un corte, la segunda vez no falla.
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(ruta, { upsert: true });
  if (error || !data) {
    console.error("[momentos.urlSubida]", error?.message);
    return null;
  }
  return {
    url: data.signedUrl,
    cabeceras: { "content-type": tipoMime, "x-upsert": "true", "cache-control": "max-age=31536000" },
  };
}

/** Bytes del archivo ya subido, o null si no está. Así no se fía del navegador. */
export async function tamano(ruta: string): Promise<number | null> {
  const modo = modoAlmacen();
  if (modo === "local") {
    try {
      return (await stat(archivoLocal(ruta))).size;
    } catch {
      return null;
    }
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db.storage.from(BUCKET).info(ruta);
  if (error || !data) return null;
  return Number(data.size ?? 0);
}

/** URLs firmadas de lectura, en bloque. Las que fallan no aparecen. */
export async function urlsLectura(rutas: string[], segundos = 15 * 60): Promise<Map<string, string>> {
  const unicas = [...new Set(rutas.filter(Boolean))];
  const mapa = new Map<string, string>();
  if (!unicas.length) return mapa;
  const modo = modoAlmacen();
  if (modo === "local") {
    for (const r of unicas) mapa.set(r, urlLocal("leer", r, segundos));
    return mapa;
  }
  const db = servicio();
  if (!db) return mapa;
  // De mil en mil: el endpoint acepta lotes, pero no infinitos.
  for (let i = 0; i < unicas.length; i += 1000) {
    const lote = unicas.slice(i, i + 1000);
    const { data, error } = await db.storage.from(BUCKET).createSignedUrls(lote, segundos);
    if (error) {
      console.error("[momentos.urlsLectura]", error.message);
      continue;
    }
    for (const x of data ?? []) if (x.path && x.signedUrl) mapa.set(x.path, x.signedUrl);
  }
  return mapa;
}

export async function borrarArchivos(rutas: string[]) {
  const validas = rutas.filter((r) => r && rutaValida(r));
  if (!validas.length) return;
  const modo = modoAlmacen();
  if (modo === "local") {
    await Promise.all(validas.map((r) => rm(archivoLocal(r), { force: true })));
    return;
  }
  const db = servicio();
  if (!db) return;
  for (let i = 0; i < validas.length; i += 1000) {
    const { error } = await db.storage.from(BUCKET).remove(validas.slice(i, i + 1000));
    if (error) console.error("[momentos.borrarArchivos]", error.message);
  }
}
