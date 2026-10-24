import "server-only";

import { cookies } from "next/headers";

/**
 * El acceso por enlace privado (`/novios/<token>`), en una cookie.
 *
 * La cookie guarda los TOKENS de los paneles abiertos en este navegador (como
 * mucho cinco: la pareja, la hermana que ayuda con dos bodas…). No hace falta
 * firmarla: el token ya es el secreto, y se vuelve a validar contra la base en
 * cada petición. Si el estudio rota el token, el acceso muere solo.
 *
 * httpOnly (no la lee JavaScript), SameSite=Lax y Secure en producción.
 */

export const COOKIE_ENLACE = "invitoo_panel";
const MAX = 5;
const DURACION = 60 * 60 * 24 * 180; // seis meses

const TOKEN = /^[A-Za-z0-9-]{6,80}$/;

export function leerTokens(valor: string | undefined): string[] {
  if (!valor) return [];
  return valor
    .split(".")
    .filter((t) => TOKEN.test(t))
    .slice(0, MAX);
}

export async function tokensGuardados(): Promise<string[]> {
  return leerTokens((await cookies()).get(COOKIE_ENLACE)?.value);
}

/** Solo en una acción de servidor o un route handler. */
export async function guardarToken(token: string) {
  if (!TOKEN.test(token)) return;
  const almacen = await cookies();
  const previos = leerTokens(almacen.get(COOKIE_ENLACE)?.value).filter((t) => t !== token);
  almacen.set(COOKIE_ENLACE, [token, ...previos].slice(0, MAX).join("."), opcionesCookie());
}

export async function olvidarTokens() {
  (await cookies()).delete(COOKIE_ENLACE);
}

export function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION,
  };
}
