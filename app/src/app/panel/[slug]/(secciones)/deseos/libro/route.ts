import type { NextRequest } from "next/server";
import { accesoBoda } from "@/lib/auth/acceso";
import { invitacionPorSlug } from "@/lib/datos";
import { listarDeseos } from "@/lib/deseos/datos";
import { generarLibro } from "@/lib/deseos/libro";

export const maxDuration = 60;

/**
 * GET /panel/<slug>/deseos/libro?composicion=uno|editorial&favoritos=1&dedicatoria=…
 *
 * «Nuestro libro de buenos deseos» en PDF A5, generado en el servidor
 * (pdf-lib, nada en el navegador). Mismo acceso que el panel.
 */
export async function GET(peticion: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const acceso = await accesoBoda(slug);
  if (!acceso) return new Response("No encontrado", { status: 404 });
  const q = peticion.nextUrl.searchParams;
  const [inv, deseos] = await Promise.all([invitacionPorSlug(slug), listarDeseos(acceso.invitacionId)]);
  if (!inv) return new Response("No encontrado", { status: 404 });

  const pdf = await generarLibro(inv, deseos, {
    composicion: q.get("composicion") === "uno" ? "uno" : "editorial",
    soloFavoritos: q.get("favoritos") === "1" && deseos.some((d) => d.favorito && !d.oculto),
    dedicatoria: (q.get("dedicatoria") ?? "").slice(0, 180),
  });
  const nombre = `libro-de-buenos-deseos-${slug}.pdf`;
  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      // inline: se abre en la pestaña; desde ahí se guarda o se imprime.
      "Content-Disposition": `${q.get("descargar") === "1" ? "attachment" : "inline"}; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
