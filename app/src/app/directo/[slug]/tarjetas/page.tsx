import type { Metadata } from "next";
import { obtenerPlantilla } from "@/data/plantillas";
import { accesoBoda } from "@/lib/auth/acceso";
import { formatearFecha } from "@/lib/fecha";
import { obtenerConfig, resolverBodaPrivada } from "@/lib/momentos/datos";
import { limitesDe } from "@/lib/momentos/planes";
import { qrSvg } from "@/lib/momentos/qr";
import { enlacesDe } from "@/lib/momentos/servidor";
import { FUENTES } from "@/plantillas";
import { resolverTokens, variablesCss } from "@/plantillas/tokens";
import Imprimir from "./Imprimir";

/**
 * /directo/<slug>/tarjetas?copias=12 — las tarjetas de mesa, en A6.
 *
 * Una tarjeta por página A6 (105 × 148 mm), con la estética de la boda:
 * sus fuentes, su papel y su acento. Solo con acceso a la boda (el QR lleva
 * el token del álbum). Cada copia va en su página: se imprime en A6 o en A4
 * con «4 por hoja» y se corta.
 */

export const metadata: Metadata = { title: "Tarjetas de mesa · Invitoo", robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ copias?: string }> };

export default async function Tarjetas({ params, searchParams }: Props) {
  const { slug } = await params;
  const { copias } = await searchParams;
  const acceso = await accesoBoda(slug);
  const boda = acceso ? await resolverBodaPrivada(slug) : null;
  const config = boda?.id ? await obtenerConfig({ ...boda, id: boda.id }) : null;
  if (!boda || !config) {
    return (
      <main className="grid min-h-dvh place-items-center p-8 text-center">
        <p className="text-[1.125rem]">Entrad en vuestro panel para imprimir las tarjetas.</p>
      </main>
    );
  }

  const n = Math.min(Math.max(Number(copias) || 1, 1), 60);
  const plantilla = obtenerPlantilla(boda.inv.plantilla);
  const tokens = resolverTokens(boda.inv.plantilla, boda.inv.tema);
  const { subida } = await enlacesDe(slug, config);
  const claro = tokens.modo !== "oscuro";
  const qr = qrSvg(subida, claro ? tokens.tinta : "#1d1712", claro ? tokens.papel : "#ffffff", {
    acento: tokens.acentoTexto ?? tokens.acento,
  });
  const conPantalla = limitesDe(config.plan, config.anos_extra).pantallaTv;
  const { a, b, fecha } = boda.inv.pareja;

  return (
    <main
      className={`tarjetas min-h-dvh bg-[#e9e5df] ${FUENTES[plantilla.id]}`}
      style={{ ...variablesCss(tokens), fontFamily: "var(--texto)" } as React.CSSProperties}
    >
      <div className="no-imprimir mx-auto flex max-w-[40rem] flex-col items-center gap-4 px-5 py-8 text-center text-[#1F1A17]">
        <h1 className="display text-[2rem]">Tarjetas para las mesas</h1>
        <p className="text-[1.0625rem] leading-relaxed">
          Cada tarjeta ocupa una página A6. En una impresora normal, elegid «4 páginas por hoja» y cortad.
        </p>
        <form className="flex items-center gap-3">
          <label htmlFor="copias" className="text-[1.0625rem]">Copias</label>
          <input id="copias" name="copias" type="number" min={1} max={60} defaultValue={n} className="min-h-12 w-24 rounded-xl border border-black/15 bg-white px-3 text-[1.0625rem]" />
          <button type="submit" className="min-h-12 rounded-full border border-black/20 bg-white px-5 text-[1rem]">Cambiar</button>
        </form>
        <Imprimir />
      </div>

      <div className="flex flex-col items-center gap-6 pb-12">
        {Array.from({ length: n }, (_, i) => (
          <article
            key={i}
            className="tarjeta grano relative flex flex-col items-center justify-between overflow-hidden text-center shadow-[0_10px_30px_-12px_rgba(0,0,0,.3)]"
            style={{ background: "var(--papel)", color: "var(--tinta)" }}
          >
            <div className="filete" aria-hidden />
            <header>
              <p className="eyebrow">Nuestra boda en fotos</p>
              <h2 className="display nombres">
                {a} <span className="amp">&amp;</span> {b}
              </h2>
              <p className="fecha">{formatearFecha(fecha)}</p>
            </header>
            <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
            <div>
              <p className="display llamada">Compartid vuestras fotos</p>
              <p className="pasos">Apuntad con la cámara del móvil al código.<br />Sin apps ni registro.</p>
              {conPantalla && (
                <p className="aviso">
                  Hay una pantalla con las fotos de los invitados. Si no quieres aparecer, díselo a los novios.
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      <style>{`
        .tarjetas .tarjeta { width: 105mm; height: 148mm; padding: 11mm 9mm 9mm; box-sizing: border-box; }
        .tarjetas .filete { position: absolute; inset: 4.5mm; border: 0.3mm solid var(--acento-texto, var(--acento)); opacity: .55; pointer-events: none; }
        .tarjetas .eyebrow { font-size: 7.5pt; letter-spacing: .28em; text-transform: uppercase; opacity: .75; }
        .tarjetas .nombres { margin-top: 3mm; font-size: 23pt; line-height: 1; }
        .tarjetas .amp { font-style: italic; color: var(--acento-texto, var(--acento)); }
        .tarjetas .fecha { margin-top: 2mm; font-size: 9pt; opacity: .8; }
        .tarjetas .qr { width: 44mm; height: 44mm; padding: 2.5mm; background: #fff; border-radius: 2mm; }
        .tarjetas .qr svg { width: 100%; height: 100%; display: block; }
        .tarjetas .llamada { font-size: 15pt; line-height: 1.1; }
        .tarjetas .pasos { margin-top: 2mm; font-size: 8.5pt; line-height: 1.35; opacity: .85; }
        .tarjetas .aviso { margin-top: 3mm; font-size: 7pt; line-height: 1.35; opacity: .7; max-width: 78mm; }
        @page { size: A6; margin: 0; }
        @media print {
          .tarjetas { background: none !important; }
          .tarjetas .no-imprimir { display: none !important; }
          .tarjetas > div { gap: 0 !important; padding: 0 !important; }
          .tarjetas .tarjeta { box-shadow: none !important; break-after: page; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </main>
  );
}
