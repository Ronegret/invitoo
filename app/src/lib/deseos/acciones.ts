"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { avisarDeseo } from "@/lib/avisos/avisar";
import { obtenerInvitacion, invitacionPorSlug } from "@/lib/datos";
import { tamano, urlSubida, type DestinoSubida } from "@/lib/momentos/almacen";
import { ritmoIp } from "@/lib/momentos/servidor";
import { deseosRecientes, insertarDeseo } from "./datos";

/**
 * Acciones PÚBLICAS del QR de deseos (/i/<slug>/deseos). Es la frontera de
 * confianza: el invitado no tiene cuenta, se escribe con service role y nada
 * de lo que llega del formulario se da por bueno.
 *
 * Antispam, por capas (ninguna molesta a una persona de verdad):
 *   1. Campo trampa `sitio_web` (oculto a personas, lo rellenan los bots).
 *   2. Tiempo mínimo desde que se pintó el formulario (2 s).
 *   3. Límite por dispositivo: 3 cada 10 minutos y 8 al día. El dispositivo
 *      es una cookie propia (vale sin JS) y, si hay JS, su id local.
 *   4. Límite grueso por IP (60/h: el salón entero comparte wifi).
 *   5. El mismo texto dos veces desde el mismo dispositivo no se duplica.
 */

export type ResultadoDeseo =
  | { ok: true; nombre: string; t: number }
  | { ok: false; error: string; t: number }
  | null;

const COOKIE = "invitoo_dispositivo";
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DISPOSITIVO = /^[A-Za-z0-9-]{8,64}$/;

const limpio = (s: unknown, max: number) =>
  String(s ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);

async function quien(datos?: FormData) {
  const jar = await cookies();
  let dispositivo = jar.get(COOKIE)?.value ?? "";
  if (!DISPOSITIVO.test(dispositivo)) {
    const local = String(datos?.get("dispositivo") ?? "");
    dispositivo = DISPOSITIVO.test(local) ? local : randomBytes(12).toString("hex");
    jar.set(COOKIE, dispositivo, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 400, path: "/" });
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "?";
  return { dispositivo, ip: createHash("sha256").update(`invitoo:${ip}`).digest("hex").slice(0, 32) };
}

/** Prepara la subida de la foto opcional (misma tubería que «En directo»). */
export async function prepararFotoDeseo(
  slug: string,
  mime: string,
): Promise<{ ok: true; ruta: string; destino: DestinoSubida } | { ok: false; error: string }> {
  if (!SLUG.test(String(slug))) return { ok: false, error: "Algo ha fallado. Prueba a recargar." };
  if (mime !== "image/webp" && mime !== "image/jpeg") return { ok: false, error: "Esa foto no se puede usar." };
  if (!(await ritmoIp(`deseo-foto:${slug}`, 30, 3_600_000))) return { ok: false, error: "Demasiadas fotos seguidas. Espera un poco." };
  const inv = await invitacionPorSlug(slug);
  if (!inv || inv.estado === "archivada") return { ok: false, error: "No encontramos esta boda." };
  const ruta = `${inv.id}/p/${randomBytes(10).toString("hex")}.${mime === "image/webp" ? "webp" : "jpg"}`;
  const destino = await urlSubida(ruta, mime);
  if (!destino) return { ok: false, error: "Ahora mismo no se pueden subir fotos. Deja tu deseo sin ella." };
  return { ok: true, ruta, destino };
}

export async function dejarDeseo(_: ResultadoDeseo, datos: FormData): Promise<ResultadoDeseo> {
  const t = Date.now();
  const mal = (error: string): ResultadoDeseo => ({ ok: false, error, t });
  const slug = String(datos.get("slug") ?? "");
  if (!SLUG.test(slug)) return mal("Algo ha fallado. Prueba a recargar la página.");

  const nombre = limpio(datos.get("nombre"), 80);
  const texto = limpio(datos.get("deseo"), 1200);
  if (nombre.length < 2) return mal("Nos falta tu nombre (con el de pila basta).");
  if (texto.length < 4) return mal("Escribe tu deseo: aunque sea una frase corta, les hará ilusión.");

  // 1 y 2: trampa y tiempo. A un bot le decimos que sí y no guardamos nada.
  if (String(datos.get("sitio_web") ?? "").trim()) return { ok: true, nombre, t };
  const pintado = Number(datos.get("pintado") ?? 0);
  if (pintado && t - pintado < 2000) return { ok: true, nombre, t };

  const inv = await obtenerInvitacion(slug);
  const privada = await invitacionPorSlug(slug);
  if (!inv || !privada) return mal("No encontramos esta boda. Revisa el enlace del QR.");

  const yo = await quien(datos);
  if (!(await ritmoIp(`deseo:${slug}`, 60, 3_600_000))) return mal("Han llegado muchos deseos a la vez. Prueba en un minuto.");
  const [diez, dia] = await Promise.all([
    deseosRecientes(privada.id, yo, 600),
    deseosRecientes(privada.id, yo, 86_400),
  ]);
  if (diez.textos.some((x) => x.trim() === texto)) return { ok: true, nombre, t };
  if (diez.dispositivo >= 3 || dia.dispositivo >= 8) {
    return mal("Ya has dejado varios deseos desde este móvil. ¡Gracias! Si quieres añadir algo, díselo a los novios en persona.");
  }

  // La foto (opcional): solo una ruta que hayamos firmado nosotros para esta boda.
  let fotoRuta: string | null = null;
  const foto = String(datos.get("foto_ruta") ?? "");
  if (foto) {
    const valida = new RegExp(`^${privada.id.replace(/[^A-Za-z0-9-]/g, "")}/p/[a-f0-9]{20}\\.(webp|jpg)$`).test(foto);
    const bytes = valida ? await tamano(foto) : null;
    if (bytes && bytes <= 3 * 1024 * 1024) fotoRuta = foto;
  }

  const r = await insertarDeseo({ invitacionId: privada.id, nombre, texto, fotoRuta, dispositivo: yo.dispositivo, ip: yo.ip });
  if (!r.ok) return mal(r.error);
  after(() => avisarDeseo(slug, { nombre, texto, donde: "por el QR" }));
  return { ok: true, nombre, t };
}
