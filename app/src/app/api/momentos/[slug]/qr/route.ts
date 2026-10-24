import { NextResponse, type NextRequest } from "next/server";
import { exigirAccesoBoda } from "@/lib/auth/acceso";
import { obtenerConfig, resolverBodaPrivada } from "@/lib/momentos/datos";
import { qrPng, qrSvg } from "@/lib/momentos/qr";
import { enlacesDe } from "@/lib/momentos/servidor";

/**
 * GET /api/momentos/<slug>/qr?formato=svg|png — el QR de subida, para
 * descargar. Solo con acceso a la boda: el QR lleva el token del álbum.
 */
export async function GET(peticion: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  try {
    await exigirAccesoBoda(slug);
  } catch {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }
  const boda = await resolverBodaPrivada(slug);
  if (!boda?.id) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const config = await obtenerConfig({ ...boda, id: boda.id });
  if (!config) return NextResponse.json({ error: "No disponible" }, { status: 503 });
  const { subida } = await enlacesDe(slug, config);
  const nombre = `qr-fotos-${slug}`;
  const comunes = { "cache-control": "private, no-store" };

  if (peticion.nextUrl.searchParams.get("formato") === "png") {
    const png = await qrPng(subida);
    return new NextResponse(new Uint8Array(png), {
      headers: { ...comunes, "content-type": "image/png", "content-disposition": `attachment; filename="${nombre}.png"` },
    });
  }
  const svg = await qrSvg(subida, "#1d1712", "#ffffff");
  return new NextResponse(svg, {
    headers: { ...comunes, "content-type": "image/svg+xml", "content-disposition": `attachment; filename="${nombre}.svg"` },
  });
}
