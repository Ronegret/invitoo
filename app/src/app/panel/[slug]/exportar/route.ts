import type { NextRequest } from "next/server";
import { accesoBoda } from "@/lib/auth/acceso";
import { respuestaCsv } from "@/lib/csv";
import { listarInvitados, obtenerRsvps } from "@/lib/datos";
import { csvBus, csvPersonas } from "@/lib/resumen";

/**
 * GET /panel/<slug>/exportar?tipo=personas|bus
 *
 * Los mismos Excel que el panel antiguo (catering y autobús), con el acceso
 * del panel nuevo: estudio, cuenta o enlace privado.
 */
export async function GET(peticion: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const acceso = await accesoBoda(slug);
  if (!acceso) return new Response("No encontrado", { status: 404 });

  const [rsvps, invitados] = await Promise.all([
    obtenerRsvps(acceso.invitacionId),
    listarInvitados(acceso.invitacionId),
  ]);
  if (peticion.nextUrl.searchParams.get("tipo") === "bus") {
    return respuestaCsv(`autobus-${slug}.csv`, csvBus(rsvps));
  }
  return respuestaCsv(`invitados-${slug}.csv`, csvPersonas(rsvps, invitados));
}
