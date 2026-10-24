import { NextResponse, type NextRequest } from "next/server";

/** Ruta antigua del panel («confirmaciones»): ahora vive en «invitados/respuestas». Se redirige para no romper enlaces guardados. */
export async function GET(peticion: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destino = new URL(`/panel/${encodeURIComponent(slug)}/invitados/respuestas`, peticion.url);
  destino.search = peticion.nextUrl.search;
  return NextResponse.redirect(destino, 308);
}
