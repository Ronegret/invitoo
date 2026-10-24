import type { PlantillaId, TransicionApertura } from "@/lib/tipos";

/**
 * La transición de la apertura a la invitación (U1), compartida por las 28
 * plantillas. Dos gestos:
 *
 *  · «destello»: al acabar el vídeo (o al tocar, deslizar o pulsar
 *    «Saltar») florece una luz cálida desde el centro, tapa el último
 *    fotograma y se disuelve dejando la invitación debajo. ~680 ms.
 *  · «velo-scroll»: la apertura es un velo que se retira hacia arriba con
 *    el dedo (o la rueda). Si se suelta antes de un cuarto, vuelve a su
 *    sitio; si no, termina de subir sola. Al acabar el vídeo sube sola.
 *
 * El color del destello va por estilo: oro en las clásicas, plata en las
 * de cielo y noche, rosa en las de baile y flor, perla en las de agua y
 * en las minimalistas.
 */

export type LuzDestello = "oro" | "plata" | "rosa" | "perla";

const LUZ: Partial<Record<PlantillaId, LuzDestello>> = {
  constelacion: "plata",
  orbita: "plata",
  aire: "plata",
  vinilo: "plata",
  meta: "plata",
  neon: "rosa",
  bachata: "rosa",
  floracion: "rosa",
  cuento: "rosa",
  mar: "perla",
  orilla: "perla",
  brazada: "perla",
  velo: "perla",
  tinta: "perla",
  registro: "perla",
};

export function luzDestello(id: PlantillaId): LuzDestello {
  return LUZ[id] ?? "oro";
}

/** Velo se retira con el dedo: es su nombre. El resto, destello. */
export function transicionPorDefecto(id: PlantillaId): TransicionApertura {
  return id === "velo" ? "velo-scroll" : "destello";
}

export function resolverTransicion(id: PlantillaId, pedida?: TransicionApertura): TransicionApertura {
  return pedida === "destello" || pedida === "velo-scroll" ? pedida : transicionPorDefecto(id);
}

/** Lo que dura el destello entero (florece y se disuelve), en ms. */
export const DESTELLO_MS = 680;
/** Lo que tarda el velo en terminar de subir solo, en ms. */
export const VELO_MS = 620;
