import type { Metadata, Viewport } from "next";
import { obtenerPlantilla } from "@/data/plantillas";
import { obtenerInvitacion } from "@/lib/datos";
import { medidasMovimiento, resolverMovimiento } from "@/lib/movimiento";
import { disenoDeParam } from "@/lib/momentos/diseno";
import { feedMuestra } from "@/lib/momentos/muestra";
import { qrSvg } from "@/lib/momentos/qr";
import { FUENTES } from "@/plantillas";
import { resolverTokens, variablesCss } from "@/plantillas/tokens";
import Pantalla from "../[slug]/Pantalla";

/**
 * /directo/muestra — la pantalla del salón con fotos de muestra. Es lo que
 * va dentro del iframe de las vistas previas (Diseño en el panel, Contratar
 * y la web /en-directo). No toca datos de nadie:
 *
 *   ?a=Carmen&b=Javier&p=<plantilla>&d=<diseño base64url>&r=<ritmo>
 *   ?cap=Primer baile — lanza ese momento (rótulo) al empezar.
 *   ?s=<slug>  — si la invitación está PUBLICADA, toma de ahí nombres,
 *                plantilla y colores (lo mismo que ve cualquier invitado).
 *
 * Escucha por postMessage el diseño y la foto «subida» por el móvil de la web.
 */

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = { title: "Vista previa · En directo", robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: "#120f0d" };

const texto = (x: unknown, max: number, porDefecto: string) =>
  typeof x === "string" && x.trim() ? x.replace(/[\u0000-\u001f]/g, "").trim().slice(0, max) : porDefecto;

export default async function Muestra({ searchParams }: Props) {
  const q = await searchParams;
  const slug = typeof q.s === "string" && /^[a-z0-9-]{1,80}$/.test(q.s) ? q.s : null;
  const publicada = slug ? await obtenerInvitacion(slug) : null;
  const a = publicada?.pareja.a ?? texto(q.a, 40, "Carmen");
  const b = publicada?.pareja.b ?? texto(q.b, 40, "Javier");
  const plantillaId = publicada?.plantilla ?? texto(q.p, 40, "carta");
  const plantilla = obtenerPlantilla(plantillaId);
  const tokens = resolverTokens(plantillaId, publicada?.tema);
  const mov = medidasMovimiento(resolverMovimiento(plantillaId, publicada?.tema?.movimiento));
  const diseno = disenoDeParam(typeof q.d === "string" ? q.d : null);
  const ritmo = Math.min(1.5, Math.max(0.35, Number(q.r) || 0.7));
  const inicial = feedMuestra();
  const cap = texto(q.cap, 48, "");
  if (cap) inicial.capitulo = { titulo: cap, desde: inicial.ahora };

  return (
    <main
      className={`fixed inset-0 overflow-hidden ${FUENTES[plantilla.id]}`}
      data-plantilla={plantilla.id}
      style={{ ...variablesCss(tokens), fontFamily: "var(--texto)" } as React.CSSProperties}
    >
      <Pantalla
        slug="muestra"
        clave=""
        pareja={{ a, b }}
        qr={qrSvg("https://invitoo.es/en-directo", "#1d1712", "#ffffff", { acento: "#8c1d2c" })}
        enlaceCorto="invitoo.es/m/tu-boda"
        inicial={inicial}
        realtime={null}
        cruce={Math.round(Math.min(3200, Math.max(1600, mov.dur * 1.8)))}
        curva={mov.curva}
        diseno={diseno}
        muestra
        ritmo={ritmo}
      />
    </main>
  );
}
