import type { Metadata } from "next";
import CatalogoRejilla from "@/components/sitio/catalogo/CatalogoRejilla";
import { fichasCatalogo } from "@/components/sitio/catalogo/datos";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import { PLANTILLAS } from "@/data/plantillas";
import { FAMILIAS_PLANTILLA, FILTROS_PLANTILLA, enLetra } from "@/data/sitio";

const N = PLANTILLAS.length;

export const metadata: Metadata = {
  title: `Las ${N} plantillas de invitación de boda`,
  description: `${enLetra(N, true)} invitaciones de boda digitales, vivas: escribid vuestros nombres, probad los colores y abridlas a pantalla completa, como las verá un invitado.`,
  alternates: { canonical: "/plantillas" },
};

/**
 * El catálogo entero, vivo.
 *
 * W2: las 28 en una rejilla de teléfonos iguales, con las cinco familias
 * de estilo y el tipo de boda como filtros, la apertura al pasar el ratón
 * y la vista rápida (la invitación de verdad, con vuestros nombres, sus
 * colores y «La queremos así») a un toque.
 */
export default function Plantillas() {
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--papel)] px-4 pb-16 pt-28 sm:px-6 sm:pt-36 lg:pb-24">
        <div className="mx-auto max-w-[72rem]">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
                <span aria-hidden className="h-px w-8 bg-current" />
                El catálogo
              </p>
              <h1 className="display mt-4 text-[clamp(2.6rem,8vw,4.8rem)] leading-[0.98] [text-wrap:balance]">
                {enLetra(N, true)} invitaciones vivas
              </h1>
            </div>
            <p className="max-w-[30rem] text-[1.06rem] leading-[1.75] text-[var(--tinta)]/75 lg:col-span-4 lg:pb-2">
              Cinco estilos, de la casa al festival. Pasad el ratón para ver
              cómo se abre cada una y tocadla para verla entera, con vuestros
              nombres y sus colores, como la verá un invitado.
            </p>
          </div>

          <div className="mt-10 sm:mt-14">
            <CatalogoRejilla
              fichas={fichasCatalogo()}
              familias={FAMILIAS_PLANTILLA}
              lugares={FILTROS_PLANTILLA}
              conCampo
            />
          </div>

          <p className="mx-auto mt-12 max-w-[40rem] text-center text-[1rem] leading-[1.7] text-[var(--tinta)]/70">
            La que elijáis se ajusta después a vuestros colores, vuestra
            tipografía y el orden que tenga sentido para vuestra boda. Y si
            ninguna os encaja, el Estudio la diseña desde cero.
          </p>
        </div>
      </section>

      <LlamadaFinal
        sobre="¿Ya tenéis una favorita?"
        titulo="Contadnos cuál"
        texto="Veinte minutos por vídeo. Nos decís qué plantilla os ha gustado y cómo es vuestra boda, y os enseñamos cómo quedaría con vuestros nombres."
      />
    </>
  );
}
