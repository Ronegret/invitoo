import { accesoBoda } from "@/lib/auth/acceso";
import { exportarDatosBoda } from "@/lib/datos";

/**
 * GET /panel/<slug>/datos — todos los datos de la boda en un JSON
 * (portabilidad, art. 20 RGPD): invitación, lista, respuestas, mensajes,
 * mesas y quién tiene acceso. Las fotos de «En directo» se descargan aparte,
 * en su ZIP.
 */
export async function GET(_: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const acceso = await accesoBoda(slug);
  if (!acceso) return new Response("No encontrado", { status: 404 });
  const datos = await exportarDatosBoda(acceso.invitacionId);
  return new Response(JSON.stringify(datos, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="datos-${slug}.json"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
