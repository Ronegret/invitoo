import { NextResponse, type NextRequest } from "next/server";

/** Ruta antigua del panel («mensajes»): ahora vive en «deseos». Se redirige para no romper enlaces guardados. */
export async function GET(peticion: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destino = new URL(`/panel/${encodeURIComponent(slug)}/deseos`, peticion.url);
  destino.search = peticion.nextUrl.search;
  return NextResponse.redirect(destino, 308);
}
