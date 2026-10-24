import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Las puertas, antes de renderizar nada.
 *
 * ── /estudio ──────────────────────────────────────────────────────────────
 * El primer intento fue comprobar la sesión en el layout de /estudio y
 * devolver el formulario en vez de `children`. **No vale, y se comprobó
 * midiendo:** en el App Router los `children` se renderizan igual aunque el
 * layout no los pinte, y su resultado acaba serializado en el payload RSC de
 * la respuesta. Es decir, la página de login llevaba dentro los nombres y los
 * slugs de las bodas — con Supabase enchufado llevaría también los borradores
 * y los enlaces privados de los paneles.
 *
 * Lo único que corta antes de renderizar nada es esto: se redirige aquí, la
 * página protegida no llega a ejecutarse y no hay payload que filtrar.
 *
 * ── /panel ────────────────────────────────────────────────────────────────
 * Aquí solo se mira si hay ALGUNA llave (estudio, sesión de Supabase o el
 * enlace privado) y se refresca la sesión de Supabase, que un Server
 * Component no puede reescribir. Qué boda abre cada llave lo decide
 * `exigirAccesoBoda` en cada página y en cada acción: el proxy no consulta
 * la base de datos.
 *
 * Se usa Web Crypto y no `node:crypto` porque esto corre antes que la
 * aplicación y no conviene atarlo a un runtime concreto.
 */

const COOKIE_ESTUDIO = "invitoo_estudio";
const COOKIE_ENLACE = "invitoo_panel";

async function huella(clave: string) {
  const datos = new TextEncoder().encode(clave);
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(resumen)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparación en tiempo constante: no delata la clave por lo que tarda. */
function iguales(a: string, b: string) {
  if (a.length !== b.length) return false;
  let distinto = 0;
  for (let i = 0; i < a.length; i++) distinto |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return distinto === 0;
}

async function esEstudio(peticion: NextRequest) {
  const esperada = process.env.ESTUDIO_CLAVE;
  if (!esperada) return false;
  const cookie = peticion.cookies.get(COOKIE_ESTUDIO)?.value;
  return Boolean(cookie && iguales(cookie, await huella(esperada)));
}

async function puertaEstudio(peticion: NextRequest) {
  // Sin clave configurada, el estudio no se abre a nadie.
  if (!process.env.ESTUDIO_CLAVE) return NextResponse.redirect(new URL("/entrar", peticion.url));
  if (await esEstudio(peticion)) return NextResponse.next();
  const destino = new URL("/entrar", peticion.url);
  destino.searchParams.set("volver", peticion.nextUrl.pathname);
  return NextResponse.redirect(destino);
}

/**
 * Refresca la sesión de Supabase (si la hay) y devuelve la respuesta con las
 * cookies nuevas y si hay usuario. Patrón de `@supabase/ssr`.
 */
async function refrescarSesion(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { respuesta, hayUsuario: false };
  // Sin cookie de sesión no hay nada que refrescar: ni una llamada de red.
  if (!peticion.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    return { respuesta, hayUsuario: false };
  }
  const sb = createServerClient(url, anon, {
    cookies: {
      getAll: () => peticion.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) peticion.cookies.set(name, value);
        respuesta = NextResponse.next({ request: peticion });
        for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await sb.auth.getUser();
  return { respuesta, hayUsuario: Boolean(data.user) };
}

async function puertaPanel(peticion: NextRequest) {
  const { respuesta, hayUsuario } = await refrescarSesion(peticion);
  const camino = peticion.nextUrl.pathname;
  if (camino.startsWith("/cuenta")) return respuesta;

  const hayEnlace = Boolean(peticion.cookies.get(COOKIE_ENLACE)?.value);
  // Demo local sin Supabase: la cuenta «de Google» simulada. Aquí solo se
  // deja pasar; quién es lo decide `usuarioActual`, que en producción la ignora.
  const hayDemo =
    !process.env.SUPABASE_SERVICE_ROLE_KEY &&
    (process.env.NODE_ENV !== "production" || process.env.INVITOO_MEMORIA === "1") &&
    Boolean(peticion.cookies.get("invitoo_demo_google")?.value);
  if (hayUsuario || hayEnlace || hayDemo || (await esEstudio(peticion))) {
    respuesta.headers.set("Cache-Control", "private, no-store");
    respuesta.headers.set("X-Robots-Tag", "noindex");
    return respuesta;
  }
  const destino = new URL("/cuenta/entrar", peticion.url);
  destino.searchParams.set("volver", camino);
  return NextResponse.redirect(destino);
}

export async function proxy(peticion: NextRequest) {
  if (peticion.nextUrl.pathname.startsWith("/estudio")) return puertaEstudio(peticion);
  return puertaPanel(peticion);
}

export const config = {
  matcher: ["/estudio/:path*", "/estudio", "/panel/:path*", "/panel", "/cuenta/:path*", "/cuenta"],
};
