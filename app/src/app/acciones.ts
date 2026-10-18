"use server";

import { revalidatePath } from "next/cache";
import { guardarInvitacion, guardarMensaje, guardarRsvp } from "@/lib/datos";

export type Resultado =
  | { ok: true; mensaje: string }
  | { ok: false; error: string };

/**
 * Acciones de servidor.
 *
 * Validan aquí y solo aquí. El invitado no tiene cuenta, así que la escritura
 * en base de datos va con service role: no hay `auth.uid()` con el que darle
 * permiso bajo RLS. Por eso estas funciones son la frontera de confianza y no
 * pueden dar por bueno nada de lo que llega del formulario.
 */

function texto(datos: FormData, campo: string, max = 500) {
  return String(datos.get(campo) ?? "").trim().slice(0, max);
}

export async function confirmarAsistencia(
  _previo: Resultado | null,
  datos: FormData,
): Promise<Resultado> {
  const slug = texto(datos, "invitacion", 80);
  const nombre = texto(datos, "nombre", 120);
  const asiste = datos.get("asiste") === "si";
  const acompanantes = Number(datos.get("acompanantes") ?? 0);

  if (nombre.length < 2) return { ok: false, error: "Nos falta tu nombre." };
  if (!slug) return { ok: false, error: "Algo ha fallado. Prueba a recargar." };
  if (!Number.isInteger(acompanantes) || acompanantes < 0 || acompanantes > 8) {
    return { ok: false, error: "Revisa el número de acompañantes." };
  }

  const guardado = await guardarRsvp({
    slug,
    nombre,
    asiste,
    acompanantes: asiste ? acompanantes : 0,
    menu: asiste ? texto(datos, "menu", 60) || null : null,
    alergias: asiste ? texto(datos, "alergias", 400) || null : null,
    bus: asiste && datos.get("bus") === "si",
  });

  if (!guardado) {
    return {
      ok: false,
      error: "No hemos podido guardarlo. Escríbenos por WhatsApp y lo apuntamos.",
    };
  }

  return asiste
    ? { ok: true, mensaje: "Contamos contigo. Nos vemos allí." }
    : { ok: true, mensaje: "Gracias por avisar. Te echaremos de menos." };
}

export async function dejarMensaje(
  _previo: Resultado | null,
  datos: FormData,
): Promise<Resultado> {
  const slug = texto(datos, "invitacion", 80);
  const nombre = texto(datos, "nombre", 120);
  const mensaje = texto(datos, "mensaje", 2000);

  if (nombre.length < 2) return { ok: false, error: "Nos falta tu nombre." };
  if (mensaje.length < 4) return { ok: false, error: "Escribe algo más." };
  if (!slug) return { ok: false, error: "Algo ha fallado. Prueba a recargar." };

  const guardado = await guardarMensaje({ slug, nombre, mensaje });
  if (!guardado) {
    return { ok: false, error: "No hemos podido guardarlo. Inténtalo otra vez." };
  }
  return { ok: true, mensaje: "Escrito. Se lo daremos el día de la boda." };
}

// ───────────────────────────────────────────────────────────────── el estudio

export async function guardarDesdeEstudio(
  _previo: Resultado | null,
  datos: FormData,
): Promise<Resultado> {
  const id = texto(datos, "id", 40) || null;
  const slug = texto(datos, "slug", 80);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      error: "El slug solo admite minúsculas, números y guiones. Ej: laura-y-ruben",
    };
  }

  // Los bloques llegan como JSON del textarea. Se valida aquí: un JSON roto
  // guardado es una invitación que revienta el sábado por la mañana.
  let bloques: unknown;
  try {
    bloques = JSON.parse(texto(datos, "bloques", 60000) || "[]");
  } catch {
    return { ok: false, error: "Los bloques no son JSON válido." };
  }
  if (!Array.isArray(bloques)) {
    return { ok: false, error: "Los bloques tienen que ser una lista." };
  }

  const fecha = texto(datos, "fecha", 40);
  if (Number.isNaN(Date.parse(fecha))) {
    return { ok: false, error: "La fecha no es válida." };
  }

  const estado = texto(datos, "estado", 20);
  const resultado = await guardarInvitacion(id, {
    slug,
    plantilla: texto(datos, "plantilla", 20) as never,
    estado: estado as never,
    nombre_a: texto(datos, "nombre_a", 60),
    nombre_b: texto(datos, "nombre_b", 60),
    fecha: new Date(fecha).toISOString(),
    tema: {
      tinta: texto(datos, "tinta", 9),
      papel: texto(datos, "papel", 9),
      acento: texto(datos, "acento", 9),
      grano: Number(datos.get("grano") ?? 0.04),
    },
    bloques: bloques as never,
  });

  if (!resultado.ok) return { ok: false, error: resultado.error ?? "Error" };

  // La invitación es estática: hay que decirle a Next que se ha movido.
  revalidatePath(`/i/${slug}`);
  revalidatePath("/estudio");

  return { ok: true, mensaje: `Guardada. Ver en /i/${slug}` };
}
