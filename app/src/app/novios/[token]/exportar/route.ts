import type { NextRequest } from "next/server";
import { respuestaCsv } from "@/lib/csv";
import { invitacionPorToken, listarInvitados, obtenerRsvps } from "@/lib/datos";
import { csvBus, csvPersonas } from "@/lib/resumen";

/**
 * GET /novios/<token>/exportar?tipo=personas|bus
 *
 * El Excel del catering (una fila por persona, con menú y alérgenos) y el del
 * transportista (personas por parada). El token se valida aquí, en el
 * servidor, igual que en la página.
 */
export async function GET(peticion: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const inv = await invitacionPorToken(token);
  if (!inv) return new Response("No encontrado", { status: 404 });

  const [rsvps, invitados] = await Promise.all([obtenerRsvps(inv.id), listarInvitados(inv.id)]);
  const tipo = peticion.nextUrl.searchParams.get("tipo");

  if (tipo === "bus") return respuestaCsv(`autobus-${inv.slug}.csv`, csvBus(rsvps));
  return respuestaCsv(`invitados-${inv.slug}.csv`, csvPersonas(rsvps, invitados));
}
