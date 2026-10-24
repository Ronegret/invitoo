"use server";

import { revalidatePath } from "next/cache";
import { exigirAccesoBoda, SinAcceso } from "@/lib/auth/acceso";
import { guardarMovimientoDeBoda } from "@/lib/datos";
import { validarMovimiento } from "@/lib/movimiento";
import type { Movimiento } from "@/lib/tipos";

export type ResultadoMovimiento = { ok: true; mensaje: string } | { ok: false; error: string };

/**
 * Guarda el movimiento de una boda en `tema.movimiento`.
 *
 * Acepta sesión de estudio o de los novios (cuenta o enlace privado):
 * `exigirAccesoBoda` es la primera línea, porque una server action se puede
 * invocar por POST desde cualquier sitio. `AjustesMovimiento` manda solo
 * lo que difiere de lo recomendado por la plantilla; aquí se valida campo a
 * campo. `mov = null` o `{}` borra lo propio y vuelve a lo recomendado.
 */
export async function guardarMovimiento(
  slug: string,
  mov: Partial<Movimiento> | null,
): Promise<ResultadoMovimiento> {
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

  let limpio: Partial<Movimiento> | null = null;
  if (mov !== null) {
    const v = validarMovimiento(mov);
    if (!v.ok) return { ok: false, error: v.error };
    limpio = v.mov;
  }

  const r = await guardarMovimientoDeBoda(acceso.invitacionId, limpio);
  if (!r.ok) return r;

  // La invitación es estática: hay que regenerarla.
  revalidatePath(`/i/${slug}`);
  return {
    ok: true,
    mensaje: limpio && Object.keys(limpio).length ? "Movimiento guardado." : "Hemos vuelto a lo recomendado.",
  };
}
