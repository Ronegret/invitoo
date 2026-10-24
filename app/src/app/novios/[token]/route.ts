import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ENLACE, leerTokens, opcionesCookie } from "@/lib/auth/enlace";
import { invitacionPorToken, sembrarDemo } from "@/lib/datos";

/**
 * GET /novios/<token> — el enlace privado de siempre.
 *
 * Los enlaces que ya circulan por WhatsApp siguen valiendo: se comprueba el
 * token, se deja en una cookie httpOnly (ver `lib/auth/enlace.ts`) y se
 * redirige al panel nuevo, `/panel/<slug>`. A partir de ahí el token no
 * vuelve a ir en la URL, que es por donde se filtran las cosas (historial,
 * capturas, «te paso el enlace»).
 *
 * Los avisos de las acciones antiguas (`?aviso=`) se conservan.
 */
export async function GET(peticion: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const inv = await invitacionPorToken(token);
  if (!inv) {
    return NextResponse.redirect(new URL("/cuenta/entrar?error=privado", peticion.url));
  }
  if (token.startsWith("demo-")) await sembrarDemo(inv.slug);

  const destino = new URL(`/panel/${inv.slug}`, peticion.url);
  const aviso = peticion.nextUrl.searchParams.get("aviso");
  if (aviso) destino.searchParams.set("aviso", aviso.slice(0, 300));

  const previos = leerTokens(peticion.cookies.get(COOKIE_ENLACE)?.value).filter((t) => t !== token);
  const respuesta = NextResponse.redirect(destino);
  respuesta.cookies.set(COOKIE_ENLACE, [token, ...previos].slice(0, 5).join("."), opcionesCookie());
  respuesta.headers.set("Cache-Control", "private, no-store");
  respuesta.headers.set("Referrer-Policy", "no-referrer");
  return respuesta;
}
