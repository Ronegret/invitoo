import { NextResponse, type NextRequest } from "next/server";
import { slugPorTokenSubida } from "@/lib/momentos/datos";

/**
 * GET /m/<token> — el enlace corto del QR de las mesas. Redirige a la
 * página de subida de esa boda. Si el token no existe (QR viejo o
 * regenerado), a la portada: nunca a un error en mitad de la boda.
 */
export async function GET(peticion: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const slug = await slugPorTokenSubida(token.toLowerCase());
  const destino = slug
    ? new URL(`/i/${slug}/momentos?t=${encodeURIComponent(token.toLowerCase())}`, peticion.url)
    : new URL("/", peticion.url);
  return NextResponse.redirect(destino, 307);
}
