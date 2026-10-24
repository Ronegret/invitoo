import type { Metadata } from "next";
import Link from "next/link";
import { ProbadorColor } from "@/components/color";
import { obtenerPlantilla, PLANTILLAS } from "@/data/plantillas";
import { paletasDe, resolverPaleta } from "@/lib/color";
import VistaMovil from "./VistaMovil";

/**
 * Banco de pruebas del color en vivo (G3). Interno: noindex.
 *   /sistema/color?p=carta
 * El probador completo junto al iframe de la demo de la plantilla, el
 * modo compacto (hoja inferior) y la tabla de contrastes de sus paletas.
 */
export const metadata: Metadata = {
  title: "Color en vivo · Sistema · Invitoo",
  robots: { index: false, follow: false },
};

export default async function PaginaColor({ searchParams }: { searchParams: Promise<{ p?: string; movil?: string }> }) {
  const { p: pedida, movil } = await searchParams;
  const p = obtenerPlantilla(pedida ?? "carta");
  // /sistema/color?p=mar&movil=1 — la invitación a pantalla completa con la hoja.
  if (movil === "1") return <VistaMovil slug={p.demo} plantilla={p.id} />;
  const filas = paletasDe(p.id).map((c) => ({ ...c, r: resolverPaleta(c, p.modo) }));
  const fmt = (x: number) => x.toFixed(2).replace(".", ",");

  return (
    <main className="mx-auto w-full max-w-[76rem] px-4 pb-24 pt-8 sm:px-6" style={{ fontSize: "1.0625rem" }}>
      <p className="text-[1.0625rem] uppercase tracking-[0.18em] opacity-70">Sistema · G3</p>
      <h1 className="mt-2 font-serif text-[clamp(2rem,6vw,3rem)] leading-tight">Color en vivo</h1>

      <nav aria-label="Plantilla" className="mt-6 flex flex-wrap gap-2">
        {PLANTILLAS.map((x) => (
          <Link
            key={x.id}
            href={`/sistema/color?p=${x.id}`}
            aria-current={x.id === p.id ? "page" : undefined}
            className="inline-flex min-h-12 items-center rounded-full border px-4 aria-[current=page]:bg-[var(--tinta)] aria-[current=page]:text-[var(--papel)]"
          >
            {x.nombre}
          </Link>
        ))}
      </nav>

      <div className="mt-10">
        {/* key: al cambiar de plantilla, probador e iframe nuevos */}
        <ProbadorColor key={p.id} slug={p.demo} plantilla={p.id} modo="completo" titulo={`Colores de ${p.nombre}`} />
      </div>

      <section className="mt-16" aria-labelledby="compacto">
        <h2 id="compacto" className="font-serif text-[1.6rem]">Modo compacto</h2>
        <p className="mt-2 max-w-[40rem] opacity-80">
          Para la barra de la demo y el móvil: el botón abre una hoja inferior plegable con las paletas en una fila
          deslizable. Aquí se aplica a esta misma página.
        </p>
        <div className="mt-4">
          <ProbadorColor key={`c-${p.id}`} slug={p.demo} plantilla={p.id} modo="compacto" />
        </div>
      </section>

      <section className="mt-16" aria-labelledby="tabla">
        <h2 id="tabla" className="font-serif text-[1.6rem]">Contrastes de las paletas de {p.nombre}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4">Paleta</th>
                <th className="py-2 pr-4">Tinta / papel</th>
                <th className="py-2 pr-4">Acento texto</th>
                <th className="py-2 pr-4">Sobre acento</th>
                <th className="py-2">Ajuste</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="border-b" style={{ background: f.r.papel, color: f.r.tinta }}>
                  <td className="py-3 pl-2 pr-4">{f.nombre}</td>
                  <td className="py-3 pr-4 tabular-nums">{fmt(f.r.ratios.tinta)}</td>
                  <td className="py-3 pr-4 tabular-nums" style={{ color: f.r.acentoTexto }}>
                    {fmt(f.r.ratios.acentoTexto)} · {f.r.acentoTexto}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex min-h-10 items-center rounded-full px-3" style={{ background: f.r.acento, color: f.r.sobreAcento }}>
                      {fmt(f.r.ratios.sobreAcento)}
                    </span>
                  </td>
                  <td className="py-3">{f.r.ajustes.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
