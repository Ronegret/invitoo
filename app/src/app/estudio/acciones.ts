"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Resultado } from "@/app/acciones";
import { PLANTILLAS } from "@/data/plantillas";
import { validarBloques } from "@/lib/bloques";
import { guardarContrato, guardarInvitacion, guardarOnlineHasta, obtenerPorId } from "@/lib/datos";
import { esAnadidoBoda, esPlanBoda, INFO_PLAN } from "@/lib/planes-boda";
import { madridAInstante } from "@/lib/fecha";
import type { Invitacion, PlantillaId } from "@/lib/tipos";
import { COOKIE, exigirSesion, huella, iguales } from "./sesion";

/**
 * Acciones del estudio.
 *
 * REGLA: toda acción que lea o escriba datos empieza por `exigirSesion()`.
 * El proxy de /estudio no protege las server actions (se invocan por POST
 * desde cualquier ruta), y aquí se escribe con service role.
 */

export async function entrar(_previo: string | null, datos: FormData) {
  const volver = String(datos.get("volver") ?? "");
  const esperada = process.env.ESTUDIO_CLAVE;
  if (!esperada) return "Falta ESTUDIO_CLAVE en el entorno.";

  // Se comparan los hashes, no las cadenas: así la comparación es siempre
  // sobre la misma longitud y no delata nada por el tiempo que tarda.
  if (!iguales(huella(String(datos.get("clave") ?? "")), huella(esperada))) {
    return "No es esa.";
  }

  (await cookies()).set(COOKIE, huella(esperada), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/estudio",
    maxAge: 60 * 60 * 24 * 14,
  });
  // Solo rutas internas: un `volver` con dominio ajeno (o `//otro.com`) sería
  // una redirección abierta de manual.
  redirect(/^\/estudio(\/[\w-]*)*$/.test(volver) ? volver : "/estudio");
}

export async function salir() {
  (await cookies()).delete({ name: COOKIE, path: "/estudio" });
  redirect("/entrar");
}

function texto(datos: FormData, campo: string, max = 500) {
  return String(datos.get(campo) ?? "").trim().slice(0, max);
}

function sinDerivados(tema: Invitacion["tema"] | undefined): Partial<Invitacion["tema"]> {
  if (!tema) return {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { acentoTexto, sobreAcento, ...resto } = tema;
  return resto;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const ESTADOS: Invitacion["estado"][] = ["borrador", "publicada", "archivada"];

export async function guardarDesdeEstudio(
  _previo: Resultado | null,
  datos: FormData,
): Promise<Resultado> {
  if (!(await exigirSesion())) {
    return { ok: false, error: "La sesión ha caducado. Vuelve a entrar." };
  }

  const id = texto(datos, "id", 40) || null;
  const slug = texto(datos, "slug", 80);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      error: "El slug solo admite minúsculas, números y guiones. Ej: laura-y-ruben",
    };
  }

  const nombre_a = texto(datos, "nombre_a", 60);
  const nombre_b = texto(datos, "nombre_b", 60);
  if (!nombre_a || !nombre_b) return { ok: false, error: "Faltan los nombres." };

  const plantilla = texto(datos, "plantilla", 30);
  if (!PLANTILLAS.some((p) => p.id === plantilla)) {
    return { ok: false, error: "Esa plantilla no existe." };
  }
  const estado = texto(datos, "estado", 20) as Invitacion["estado"];
  if (!ESTADOS.includes(estado)) return { ok: false, error: "Estado no válido." };

  // La fecha llega del datetime-local: es hora de MADRID, sin zona. Se
  // convierte al instante correcto (antes se guardaba como si fuera UTC y
  // la boda se movía una o dos horas).
  const instante = madridAInstante(texto(datos, "fecha", 40));
  if (!instante) return { ok: false, error: "La fecha no es válida." };

  const colores = ["tinta", "papel", "acento"].map((c) => texto(datos, c, 9));
  if (colores.some((c) => !HEX.test(c))) {
    return { ok: false, error: "Los colores van como #rrggbb." };
  }
  const grano = Number(datos.get("grano") ?? 0.04);
  if (!Number.isFinite(grano) || grano < 0 || grano > 0.3) {
    return { ok: false, error: "El grano va de 0 a 0,3." };
  }

  let crudo: unknown;
  try {
    crudo = JSON.parse(texto(datos, "bloques", 120000) || "[]");
  } catch {
    return { ok: false, error: "Los bloques no son JSON válido." };
  }
  const bloques = validarBloques(crudo);
  if (!bloques.ok) return { ok: false, error: bloques.error };

  const previa = id ? await obtenerPorId(id) : null;
  const slugAnterior = previa?.slug ?? null;

  const resultado = await guardarInvitacion(id, {
    slug,
    plantilla: plantilla as PlantillaId,
    estado,
    nombre_a,
    nombre_b,
    fecha: instante.toISOString(),
    // El movimiento (`guardarMovimiento`), la variante y lo demás que la
    // pareja haya tocado desde el panel se conservan. Los dos colores
    // derivados se quitan: se recalculan con los colores nuevos.
    tema: {
      ...sinDerivados(previa?.tema),
      tinta: colores[0],
      papel: colores[1],
      acento: colores[2],
      grano,
    },
    bloques: bloques.bloques,
    // La apertura y la música no se editan aquí: al editar se conservan; una
    // boda nueva estrena la apertura de su plantilla.
    ...(id ? {} : { apertura: PLANTILLAS.find((p) => p.id === plantilla)?.apertura ?? null }),
  });

  if (!resultado.ok) return { ok: false, error: resultado.error };

  // La invitación es estática: hay que decirle a Next que ha cambiado. Su
  // imagen de vista previa y su .ics también.
  for (const s of new Set([slug, slugAnterior].filter(Boolean) as string[])) {
    revalidatePath(`/i/${s}`);
    revalidatePath(`/i/${s}/opengraph-image`);
    revalidatePath(`/i/${s}/calendario`);
  }
  revalidatePath("/estudio");

  if (!id) redirect(`/estudio/${resultado.id}`);
  return { ok: true, mensaje: `Guardada. Ver en /i/${slug}` };
}

/** Hasta cuándo sigue en línea la boda. Vacío = doce meses después de la boda. */
export async function guardarOnlineHastaEstudio(id: string, fecha: string): Promise<Resultado> {
  if (!(await exigirSesion())) return { ok: false, error: "La sesión ha caducado. Vuelve a entrar." };
  const limpia = String(fecha ?? "").trim();
  if (limpia && !/^\d{4}-\d{2}-\d{2}$/.test(limpia)) return { ok: false, error: "Fecha no válida." };
  const inv = await obtenerPorId(String(id ?? ""));
  if (!inv) return { ok: false, error: "No encuentro esa boda." };
  const r = await guardarOnlineHasta(String(id), limpia || null);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath(`/panel/${inv.slug}`, "layout");
  return {
    ok: true,
    mensaje: limpia ? `En línea hasta el ${limpia}.` : "Vuelve a lo del plan: doce meses después de la boda.",
  };
}

/**
 * El contrato de la boda a mano: plan (Invitoo, Con canción, Estudio) y
 * añadidos. Lo normal es que lo fije el pago al «Vincular a una boda» desde
 * la bandeja (P2); esto es para lo que se cobra fuera de Stripe, para
 * regalar un añadido o para corregir. En directo tiene además su propio
 * plan de fotos (el bloque de al lado).
 */
export async function guardarContratoEstudio(id: string, plan: string, anadidos: string[]): Promise<Resultado> {
  if (!(await exigirSesion())) return { ok: false, error: "La sesión ha caducado. Vuelve a entrar." };
  if (!esPlanBoda(plan)) return { ok: false, error: "Plan no válido." };
  const lista = [...new Set((Array.isArray(anadidos) ? anadidos : []).filter(esAnadidoBoda))];
  const inv = await obtenerPorId(String(id ?? ""));
  if (!inv) return { ok: false, error: "No encuentro esa boda." };
  const r = await guardarContrato(String(id), { plan, anadidos: lista });
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath(`/panel/${inv.slug}`, "layout");
  revalidatePath(`/estudio/${id}`);
  return { ok: true, mensaje: `Plan ${INFO_PLAN[plan].nombre}${lista.length ? ` con ${lista.length} añadido(s)` : ""}. El panel ya lo refleja.` };
}
