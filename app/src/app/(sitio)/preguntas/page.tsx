import type { Metadata } from "next";
import Link from "next/link";
import Revelar from "@/components/Revelar";
import Encabezado from "@/components/sitio/Encabezado";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import Preguntas from "@/components/sitio/Preguntas";
import { PREGUNTAS } from "@/data/sitio";

export const metadata: Metadata = {
  title: "Preguntas frecuentes · Invitoo",
  description:
    "Si vuestra abuela podrá abrirla, qué pasa si cambia algo, cuánto tarda, cuánto tiempo está online y qué es lo de la canción.",
};

/**
 * Las preguntas, todas juntas.
 *
 * En /precios y /servicios salen filtradas —allí solo estorban las que no
 * vienen a cuento—, pero hace falta una página que las tenga todas: es la
 * que se enlaza desde el pie, la que se manda cuando alguien duda, y la que
 * Google enseña cuando se busca «invitación digital boda abuela móvil».
 *
 * Los datos estructurados son de verdad: salen de la misma lista que se
 * pinta debajo, así que no pueden desincronizarse ni prometer respuestas que
 * no estén en la página.
 */
export default function PaginaPreguntas() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PREGUNTAS.map((p) => ({
      "@type": "Question",
      name: p.q,
      acceptedAnswer: { "@type": "Answer", text: p.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Contenido propio, generado arriba: no viene de fuera.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Encabezado
        sobre="Antes de decidir"
        titulo="Preguntas"
        bajo="Las que nos hacen siempre, respondidas sin rodeos. Si falta la vuestra, escribidnos y la añadimos."
        foto="/fotos/sitio/corte-1.avif"
      />

      <section className="grano relative bg-[var(--papel)] px-5 py-24 sm:py-28">
        <div className="mx-auto max-w-[46rem]">
          <Preguntas />

          <Revelar>
            <p className="mt-16 text-center text-[0.94rem] leading-[1.8] opacity-60">
              Lo que se pregunta después suele ser el precio.{" "}
              <Link href="/precios" className="enlace-sub">
                Los cuatro planes están aquí
              </Link>
              , y{" "}
              <Link href="/servicios" className="enlace-sub">
                lo que lleva dentro, aquí
              </Link>
              .
            </p>
          </Revelar>
        </div>
      </section>

      <LlamadaFinal
        sobre="¿Falta la vuestra?"
        titulo="Preguntádnosla"
        texto="Veinte minutos por Meet, o un correo. Lo que sea más cómodo: no hay presupuesto por delante ni compromiso de nada."
      />
    </>
  );
}
