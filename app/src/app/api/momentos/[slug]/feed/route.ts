import { NextResponse, type NextRequest } from "next/server";
import { obtenerConfig, resolverBoda } from "@/lib/momentos/datos";
import { construirFeed, iguales } from "@/lib/momentos/servidor";

/**
 * GET /api/momentos/<slug>/feed?k=<clave>&desde=<iso>   — la pantalla de la TV
 * GET /api/momentos/<slug>/feed?t=<token>&desde=<iso>   — el muro del invitado
 *
 * Sin `desde`: lo último y la lista de ids visibles (la pantalla quita lo que
 * se haya ocultado). Con `desde`: solo lo nuevo. Siempre con URLs firmadas
 * de corta duración; nunca sale una ruta del bucket ni nada pendiente.
 */
export async function GET(peticion: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const q = peticion.nextUrl.searchParams;
  const k = q.get("k");
  const t = q.get("t");
  const prohibido = NextResponse.json({ error: "Sin acceso" }, { status: 403, headers: SIN_CACHE });

  const boda = await resolverBoda(slug);
  if (!boda?.id) return prohibido;
  const conId = { ...boda, id: boda.id };
  const config = await obtenerConfig(conId);
  if (!config) return NextResponse.json({ error: "No disponible" }, { status: 503, headers: SIN_CACHE });

  let para: "pantalla" | "invitado";
  if (k && iguales(k, config.clave_pantalla)) para = "pantalla";
  else if (t && iguales(t, config.token_subida)) para = "invitado";
  else return prohibido;

  const feed = await construirFeed(conId, config, {
    para,
    desde: q.get("desde"),
    limite: para === "invitado" ? Math.min(Number(q.get("limite")) || 60, 120) : undefined,
  });
  return NextResponse.json(feed, { headers: SIN_CACHE });
}

const SIN_CACHE = { "cache-control": "no-store", "x-robots-tag": "noindex" };
