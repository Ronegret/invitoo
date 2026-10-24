import type { NextRequest } from "next/server";
import { obtenerInvitado } from "@/lib/datos";

/**
 * GET /api/invitado?slug=<slug>&n=<token>  →  { nombre, cupo, trato? }  |  404
 * (`trato`: "querida" | "querido" | "queridos", solo si la pareja lo ha puesto)
 *
 * Lo usa la invitación (estática) para personalizarse en el cliente: el
 * saludo «Querida Carmen» y el número de plazas del RSVP. Solo devuelve el
 * nombre y el cupo; nunca el teléfono, el grupo ni nada de otros invitados.
 * No se cachea en ningún intermediario: es de una persona.
 */
export async function GET(peticion: NextRequest) {
  const q = peticion.nextUrl.searchParams;
  const slug = (q.get("slug") ?? "").slice(0, 80);
  const token = (q.get("n") ?? "").slice(0, 64);
  const cabeceras = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  };

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !token) {
    return Response.json({ error: "no encontrado" }, { status: 404, headers: cabeceras });
  }
  const invitado = await obtenerInvitado(slug, token);
  if (!invitado) {
    return Response.json({ error: "no encontrado" }, { status: 404, headers: cabeceras });
  }
  return Response.json(
    {
      nombre: invitado.nombre,
      cupo: invitado.cupo,
      ...(invitado.trato ? { trato: invitado.trato } : {}),
    },
    { headers: cabeceras },
  );
}
