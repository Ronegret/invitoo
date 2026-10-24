import type { NextRequest } from "next/server";
import { generarIcs } from "@/lib/calendario";
import { obtenerInvitacion } from "@/lib/datos";
import { SITIO_URL } from "@/lib/enlaces";

/**
 * GET /i/<slug>/calendario → el .ics de la boda (RFC 5545).
 *
 * Horas locales con TZID=Europe/Madrid y su VTIMEZONE, un evento por parada
 * del itinerario y un aviso el día antes. Se genera en el servidor con la
 * hora de Madrid explícita: el servidor está en UTC y antes la misa salía
 * desplazada. Se revalida al guardar la boda en el estudio.
 */
export async function GET(_peticion: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const inv = await obtenerInvitacion(slug);
  if (!inv) return new Response("No encontrada", { status: 404 });

  return new Response(generarIcs(inv, `${SITIO_URL}/i/${slug}`), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="boda-${slug}.ics"`,
      "Cache-Control": "public, max-age=0, s-maxage=60",
      "X-Robots-Tag": "noindex",
    },
  });
}
