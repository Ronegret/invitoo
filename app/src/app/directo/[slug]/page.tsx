import type { Metadata, Viewport } from "next";
import { obtenerPlantilla } from "@/data/plantillas";
import { medidasMovimiento, resolverMovimiento } from "@/lib/movimiento";
import { obtenerConfig, resolverBoda } from "@/lib/momentos/datos";
import { limitesDe } from "@/lib/momentos/planes";
import { qrSvg } from "@/lib/momentos/qr";
import { canalPantalla, construirFeed, enlacesDe, iguales, realtimePublico, vigente } from "@/lib/momentos/servidor";
import { FUENTES } from "@/plantillas";
import { resolverTokens, variablesCss } from "@/plantillas/tokens";
import Pantalla from "./Pantalla";

/**
 * /directo/<slug>?k=<clave> — la pantalla del salón (TV o proyector).
 *
 * Sin la clave no se ve NADA: ni nombres ni fotos. Con ella, la pantalla
 * pinta a pantalla completa lo que suben los invitados, con la tipografía
 * y los colores de la invitación y las transiciones de su movimiento.
 */

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "En directo · Invitoo",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0c0a09", colorScheme: "dark" };

function Cerrada({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="fixed inset-0 grid place-items-center bg-[#0c0a09] p-10 text-center text-[#f4efe8]">
      <div className="max-w-[40rem]">
        <p className="text-[1.125rem] uppercase tracking-[0.3em] opacity-60">Invitoo · En directo</p>
        <h1 className="display mt-6 text-[clamp(2.4rem,5vw,4rem)] leading-tight">{titulo}</h1>
        <p className="mt-6 text-[1.375rem] leading-relaxed opacity-80">{texto}</p>
      </div>
    </main>
  );
}

export default async function PaginaDirecto({ params, searchParams }: Props) {
  const { slug } = await params;
  const { k } = await searchParams;
  const clave = typeof k === "string" ? k.slice(0, 64) : "";

  const boda = clave ? await resolverBoda(slug) : null;
  const config = boda?.id ? await obtenerConfig({ ...boda, id: boda.id }) : null;
  if (!boda?.id || !config || !clave || !iguales(clave, config.clave_pantalla)) {
    return (
      <Cerrada
        titulo="Falta la clave de la pantalla"
        texto="Abrid el enlace de la pantalla desde vuestro panel: lleva la clave dentro. Si la habéis cambiado hace poco, copiad el enlace nuevo."
      />
    );
  }
  const plan = limitesDe(config.plan, config.anos_extra);
  if (!plan.pantallaTv) {
    return (
      <Cerrada
        titulo="La pantalla en directo viene con En directo"
        texto="Vuestro álbum ya recoge las fotos de los invitados. Para verlas en directo en una TV, añadid En directo desde vuestro panel."
      />
    );
  }
  if (!vigente(config)) {
    return <Cerrada titulo="Este álbum ya se ha cerrado" texto="Las fotos siguen en vuestro panel hasta la fecha de borrado." />;
  }

  const conId = { ...boda, id: boda.id };
  const plantilla = obtenerPlantilla(boda.inv.plantilla);
  const tokens = resolverTokens(boda.inv.plantilla, boda.inv.tema);
  const mov = medidasMovimiento(resolverMovimiento(boda.inv.plantilla, boda.inv.tema?.movimiento));
  const [feed, enlaces] = await Promise.all([
    construirFeed(conId, config, { para: "pantalla" }),
    enlacesDe(slug, config),
  ]);
  const rt = realtimePublico();

  return (
    <main
      className={`fixed inset-0 overflow-hidden ${FUENTES[plantilla.id]}`}
      data-plantilla={plantilla.id}
      style={
        {
          ...variablesCss(tokens),
          background: "#0c0a09",
          color: "#f4efe8",
          fontFamily: "var(--texto)",
        } as React.CSSProperties
      }
    >
      <Pantalla
        slug={slug}
        clave={clave}
        pareja={{ a: boda.inv.pareja.a, b: boda.inv.pareja.b }}
        qr={qrSvg(enlaces.subida, "#1d1712", "#ffffff", { acento: "#8c1d2c" })}
        enlaceCorto={enlaces.subida.replace(/^https?:\/\//, "").replace(/\?.*$/, "")}
        inicial={feed}
        realtime={rt ? { ...rt, canal: canalPantalla(config) } : null}
        cruce={Math.round(Math.min(3200, Math.max(1600, mov.dur * 1.8)))}
        curva={mov.curva}
      />
    </main>
  );
}
