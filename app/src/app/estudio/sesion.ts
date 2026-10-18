import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Puerta del estudio.
 *
 * Una clave compartida, no cuentas de usuario: aquí entra Rodrigo y nadie
 * más. Montar Supabase Auth para un solo usuario es complejidad sin beneficio.
 *
 * La cookie no guarda la clave, guarda su hash; es httpOnly y SameSite=Lax,
 * así que no la lee JavaScript ni viaja en peticiones de otros sitios. La
 * comparación es en tiempo constante para no filtrar la clave a base de medir
 * cuánto tarda en fallar.
 *
 * Esto vive aparte de `acciones.ts` porque un módulo "use server" solo puede
 * exportar funciones asíncronas: las constantes y los ayudantes van aquí.
 */

export const COOKIE = "invitoo_estudio";

export function huella(clave: string) {
  return createHash("sha256").update(clave).digest("hex");
}

export function iguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function claveConfigurada() {
  return Boolean(process.env.ESTUDIO_CLAVE);
}

export async function sesionValida() {
  const esperada = process.env.ESTUDIO_CLAVE;
  if (!esperada) return false;
  const cookie = (await cookies()).get(COOKIE)?.value;
  if (!cookie) return false;
  return iguales(cookie, huella(esperada));
}
