import { NextResponse, type NextRequest } from "next/server";

/** Ruta antigua del panel («dia»): ahora vive en «directo». Se redirige para no romper enlaces guardados. */
export async function GET(peticion: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destino = new URL(`/panel/${encodeURIComponent(slug)}/directo`, peticion.url);
  destino.search = peticion.nextUrl.search;
  return NextResponse.redirect(destino, 308);
}
