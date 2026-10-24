import "server-only";

import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { DEMO } from "@/data/demo";
import { bodasDeCuenta, vincularMiembro } from "@/lib/datos";

/**
 * Lo que pasa justo DESPUÉS de entrar, venga de donde venga (código por
 * email, enlace mágico o Google): una sola lógica para todos.
 *
 * La boda se encuentra por el email VERIFICADO en `miembros`, que ya reúne:
 *   · el email de la pareja (`parejas.email`, migración de cuentas y
 *     `2026-11-google.sql`);
 *   · el email de la reserva pagada, al «Vincular a una boda» en el estudio;
 *   · las personas que la pareja invita desde «Cuenta» (la otra mitad de la
 *     pareja con su propio Gmail, o el planner).
 */

/** El email de la cuenta, solo si el proveedor lo ha verificado. */
export function emailVerificado(u: Pick<User, "email" | "email_confirmed_at" | "identities">): string | null {
  if (!u.email || !u.email_confirmed_at) return null;
  // Google dice si el email está verificado; si dice que no, no nos fiamos.
  const google = u.identities?.find((i) => i.provider === "google");
  if (google && google.identity_data?.email_verified === false) return null;
  return u.email.trim().toLowerCase();
}

/**
 * Vincula la cuenta a sus bodas (rellena `user_id` en las invitaciones por
 * email) y dice si tiene alguna.
 */
export async function abrirCuenta(userId: string, email: string): Promise<boolean> {
  await vincularMiembro(userId, email);
  return (await bodasDeCuenta(userId, email)).length > 0;
}

// ─────────────────────────────── «esta cuenta no tiene boda» (solo mostrar)

/**
 * El email que no encontró boda, para que /cuenta/sin-boda pueda decir cuál
 * era sin ponerlo en la URL (las URL acaban en logs e historiales). Solo se
 * MUESTRA: no abre nada, así que no hace falta firmarla.
 */
export const COOKIE_SIN_BODA = "invitoo_sin_boda";

export async function recordarSinBoda(email: string) {
  (await cookies()).set(COOKIE_SIN_BODA, email.slice(0, 254), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/cuenta",
    maxAge: 60 * 10,
  });
}

export async function emailSinBoda(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE_SIN_BODA)?.value ?? "";
  return /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}$/.test(v) ? v : null;
}

// ─────────────────────────────────────────── demo local: «Google» simulado

/**
 * En la demo local (INVITOO_MEMORIA, sin Supabase) no hay Google de verdad:
 * /cuenta/google-demo deja elegir una cuenta y guarda su email aquí.
 * `usuarioActual` SOLO la lee cuando `modoDemo()` es cierto; en producción
 * esta cookie no abre nada aunque alguien la invente.
 */
export const COOKIE_DEMO_GOOGLE = "invitoo_demo_google";

export async function guardarCuentaDemo(email: string) {
  (await cookies()).set(COOKIE_DEMO_GOOGLE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function cuentaDemo(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE_DEMO_GOOGLE)?.value ?? "";
  return /^[a-z0-9._+-]{1,64}@[a-z0-9.-]{1,190}$/.test(v) ? v : null;
}

export type CuentaDemo = { email: string; nombre: string; boda: string | null; slug: string | null };

const sinTildes = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * Las cuentas del selector de la demo: las dos personas de las dos primeras
 * bodas de ejemplo (cada una con su Gmail, como en la vida real) y una
 * cuenta sin boda, para ver la página amable de «no está asociada».
 */
export function cuentasDemo(): CuentaDemo[] {
  const bodas = Object.values(DEMO).slice(0, 2);
  const cuentas: CuentaDemo[] = bodas.flatMap((b) => [
    { email: `${sinTildes(b.pareja.a)}.boda@gmail.com`, nombre: b.pareja.a, boda: `${b.pareja.a} y ${b.pareja.b}`, slug: b.slug },
    { email: `${sinTildes(b.pareja.b)}.boda@gmail.com`, nombre: b.pareja.b, boda: `${b.pareja.a} y ${b.pareja.b}`, slug: b.slug },
  ]);
  cuentas.push({ email: "otra.cuenta@gmail.com", nombre: "Otra cuenta", boda: null, slug: null });
  return cuentas;
}
