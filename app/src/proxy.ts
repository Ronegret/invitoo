import { NextResponse, type NextRequest } from "next/server";

/**
 * La puerta del estudio, de verdad.
 *
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
 * Se usa Web Crypto y no `node:crypto` porque esto corre antes que la
 * aplicación y no conviene atarlo a un runtime concreto.
 */

const COOKIE = "invitoo_estudio";

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

export async function proxy(peticion: NextRequest) {
  const esperada = process.env.ESTUDIO_CLAVE;
  // Sin clave configurada, el estudio no se abre a nadie.
  if (!esperada) return NextResponse.redirect(new URL("/entrar", peticion.url));

  const cookie = peticion.cookies.get(COOKIE)?.value;
  if (cookie && iguales(cookie, await huella(esperada))) {
    return NextResponse.next();
  }

  const destino = new URL("/entrar", peticion.url);
  destino.searchParams.set("volver", peticion.nextUrl.pathname);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/estudio/:path*", "/estudio"],
};
