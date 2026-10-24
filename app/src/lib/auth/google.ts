import "server-only";

import { headers } from "next/headers";

/**
 * Ayudantes de «Continuar con Google» que no son acciones.
 *
 * El flujo es el de servidor con PKCE de `@supabase/ssr`: la acción pide a
 * Supabase la URL de Google (y deja el `code_verifier` en una cookie de
 * este navegador), Google vuelve a Supabase, Supabase vuelve a /cuenta/confirmar
 * con `?code=` y allí se cambia por la sesión. El secreto de Google vive SOLO
 * en el panel de Supabase, nunca aquí.
 */

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * ¿Está Google activado en Supabase? Si no, Supabase contesta a la pareja con
 * un JSON de error en vez de abrir Google. Se pregunta antes a
 * `/auth/v1/settings` (público con la anon key) para poder decirlo bonito.
 * Si la pregunta falla, se intenta igual: mejor un intento que un botón muerto.
 */
export async function googleActivado(): Promise<boolean> {
  if (!URL_SB || !ANON) return false;
  try {
    const r = await fetch(`${URL_SB}/auth/v1/settings`, {
      headers: { apikey: ANON },
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 300 },
    });
    if (!r.ok) return true;
    const j = (await r.json()) as { external?: Record<string, boolean> };
    return j.external?.google !== false;
  } catch {
    return true;
  }
}

/**
 * El origen de esta petición (https://invitoo.es, una preview de Vercel o
 * http://localhost:3100). Aunque alguien falseara la cabecera, Supabase solo
 * redirige a las URL de su lista de «Redirect URLs».
 */
export async function origen(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "invitoo.es";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
