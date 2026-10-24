"use server";

import { revalidatePath } from "next/cache";
import { obtenerPlantilla } from "@/data/plantillas";
import { exigirAccesoBoda, SinAcceso } from "@/lib/auth/acceso";
import { actualizarContenido, invitacionPorSlug } from "@/lib/datos";
import { cumpleAA, resolverPaleta, type Colores, type Paleta } from "./paleta";

export type ResultadoPaleta =
  | { ok: true; mensaje: string; paleta: Paleta; ajustado: boolean }
  | { ok: false; error: string };

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Guarda la paleta de una boda en su `tema`.
 *
 *  · `exigirAccesoBoda` es la primera línea: una server action se puede
 *    invocar por POST desde cualquier sitio.
 *  · Solo se aceptan tres hex (#rrggbb). `acentoTexto` y `sobreAcento` NO
 *    se aceptan del cliente: se recalculan aquí con `resolverPaleta`, en el
 *    modo de la plantilla de la boda. Lo que se guarda pasa AA siempre.
 *  · Se FUNDE con el tema guardado (`actualizarContenido`): `movimiento`,
 *    `sobre`, `variante`, `radio`, fuentes… no se tocan.
 */
export async function guardarPaleta(slug: string, colores: Colores): Promise<ResultadoPaleta> {
  if (typeof slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: "Esa boda no existe." };
  }

  let acceso;
  try {
    acceso = await exigirAccesoBoda(slug);
  } catch (e) {
    if (e instanceof SinAcceso) return { ok: false, error: "La sesión ha caducado. Volved a entrar." };
    throw e;
  }

  if (
    !colores ||
    typeof colores !== "object" ||
    ![colores.papel, colores.tinta, colores.acento].every((x) => typeof x === "string" && HEX.test(x))
  ) {
    return { ok: false, error: "Esos colores no son válidos." };
  }

  const inv = await invitacionPorSlug(slug);
  if (!inv) return { ok: false, error: "No encontramos vuestra boda." };
  const modo = obtenerPlantilla(inv.plantilla).modo;

  const r = resolverPaleta(
    { papel: colores.papel, tinta: colores.tinta, acento: colores.acento },
    modo,
  );
  const paleta: Paleta = {
    papel: r.papel,
    tinta: r.tinta,
    acento: r.acento,
    acentoTexto: r.acentoTexto,
    sobreAcento: r.sobreAcento,
  };
  if (!cumpleAA(paleta, modo)) return { ok: false, error: "Esa combinación no se lee bien." };

  const g = await actualizarContenido(acceso.invitacionId, { tema: paleta });
  if (!g.ok) return g;

  // La invitación es estática: hay que regenerarla.
  revalidatePath(`/i/${slug}`);
  return {
    ok: true,
    mensaje: r.ajustado ? "Paleta guardada (ajustada para que se lea)." : "Paleta guardada.",
    paleta,
    ajustado: r.ajustado,
  };
}
