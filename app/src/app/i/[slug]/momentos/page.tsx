import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { obtenerPlantilla } from "@/data/plantillas";
import { obtenerInvitado } from "@/lib/datos";
import { formatearFecha } from "@/lib/fecha";
import { leerDiseno, obtenerConfig, resolverBoda } from "@/lib/momentos/datos";
import { DISENO_INICIAL } from "@/lib/momentos/diseno";
import { limitesDe, MAX_PIE, RETOS_FOTO } from "@/lib/momentos/planes";
import { canalInvitados, iguales, realtimePublico, vigente } from "@/lib/momentos/servidor";
import { FUENTES } from "@/plantillas";
import { resolverTokens, variablesCss } from "@/plantillas/tokens";
import SubidaMomentos, { type EstadoSubida } from "./SubidaMomentos";

/**
 * /i/<slug>/momentos?t=<token> — a donde lleva el QR de las mesas.
 *
 * Viste como la invitación (tokens y fuentes de su plantilla) y pide lo
 * mínimo: un nombre, una casilla y un botón enorme. Es dinámica (lee `?t=`
 * y el estado del álbum en cada visita): el día de la boda manda lo que
 * digan los novios en ese momento, no una caché.
 */

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string | string[]; n?: string | string[]; v?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const boda = await resolverBoda(slug);
  if (!boda) return {};
  const { a, b } = boda.inv.pareja;
  return {
    title: `Las fotos de ${a} & ${b}`,
    description: "Sube aquí tus fotos de la boda. Sin apps ni registro.",
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function PaginaMomentos({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t, n, v } = await searchParams;
  const boda = await resolverBoda(slug);
  if (!boda) notFound();

  const plantilla = obtenerPlantilla(boda.inv.plantilla);
  const tokens = resolverTokens(boda.inv.plantilla, boda.inv.tema);
  const config = boda.id ? await obtenerConfig({ ...boda, id: boda.id }) : null;
  let tokenUrl = typeof t === "string" ? t.slice(0, 64) : null;
  let tokenUrlValido = Boolean(config && tokenUrl && iguales(tokenUrl, config.token_subida));
  // Desde la invitación con enlace personal (`?n=`): es un invitado de la
  // lista, así que no hace falta que escanee el QR de la mesa.
  if (config && !tokenUrlValido && typeof n === "string" && n.length <= 64) {
    if (await obtenerInvitado(slug, n)) {
      tokenUrl = config.token_subida;
      tokenUrlValido = true;
    }
  }

  let estado: EstadoSubida = "muestra";
  if (config) {
    if (!vigente(config)) estado = "caducado";
    else if (!config.activo) estado = "cerrado";
    else if (!config.subidas_abiertas) estado = "subidasCerradas";
    else estado = "abierto";
  }
  const plan = config ? limitesDe(config.plan, config.anos_extra) : limitesDe("album");
  const borrado = config?.retencion_hasta ? formatearFecha(config.retencion_hasta) : null;
  const diseno = boda.id ? await leerDiseno(boda.id) : DISENO_INICIAL;
  const rt = realtimePublico();

  return (
    <main
      className={`grano relative min-h-dvh overflow-x-clip ${FUENTES[plantilla.id]}`}
      data-modo={tokens.modo}
      data-plantilla={plantilla.id}
      style={
        {
          ...variablesCss(tokens),
          background: "var(--papel)",
          color: "var(--tinta)",
          fontFamily: "var(--texto)",
        } as React.CSSProperties
      }
    >
      <SubidaMomentos
        slug={slug}
        tokenUrl={tokenUrl}
        tokenUrlValido={tokenUrlValido}
        pareja={{ a: boda.inv.pareja.a, b: boda.inv.pareja.b, fecha: formatearFecha(boda.inv.pareja.fecha) }}
        estado={estado}
        videos={plan.videos > 0 ? { duracion: plan.duracionVideo } : null}
        pantalla={plan.pantallaTv}
        borrado={borrado}
        retos={[...RETOS_FOTO]}
        diseno={{ marco: diseno.marco, frase: diseno.frase }}
        maxPie={MAX_PIE}
        vistaInicial={v === "directo" ? "directo" : "subir"}
        realtime={rt && config && tokenUrlValido ? { ...rt, canal: canalInvitados(config) } : null}
      />
    </main>
  );
}
