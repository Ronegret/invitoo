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

/**
 * Primera línea de CADA acción de servidor del estudio. El proxy solo corta
 * las páginas de /estudio; una server action se puede llamar por POST desde
 * cualquier ruta con su id, así que la sesión se comprueba aquí dentro.
 */
export async function exigirSesion(): Promise<boolean> {
  return sesionValida();
}

// ───────────────────────────────────────────── entrar con Google (opcional)

/**
 * `ESTUDIO_EMAILS`: los emails de Google que pueden abrir el estudio,
 * separados por comas. Solo en el servidor (sin NEXT_PUBLIC_). Vacío = el
 * botón de Google no aparece y solo vale la clave.
 */
export function emailsDeEstudio(): string[] {
  return (process.env.ESTUDIO_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

export function esEmailDeEstudio(email: string | null | undefined): boolean {
  if (!email) return false;
  return emailsDeEstudio().includes(email.trim().toLowerCase());
}

/**
 * Abre la sesión del estudio: la misma cookie que pone la clave (su hash),
 * así el proxy y `sesionValida` no cambian. Por eso ESTUDIO_CLAVE sigue
 * siendo obligatoria aunque se entre con Google. Solo en una acción de
 * servidor o un route handler, y SOLO después de comprobar el email.
 */
export async function abrirSesionEstudio(): Promise<boolean> {
  const esperada = process.env.ESTUDIO_CLAVE;
  if (!esperada) return false;
  (await cookies()).set(COOKIE, huella(esperada), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/estudio",
    maxAge: 60 * 60 * 24 * 14,
  });
  return true;
}
