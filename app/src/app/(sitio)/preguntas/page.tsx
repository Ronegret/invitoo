import type { Metadata } from "next";
import DatosEstructurados from "@/components/sitio/DatosEstructurados";
import Encabezado from "@/components/sitio/Encabezado";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import Preguntas from "@/components/sitio/Preguntas";
import type { Pregunta } from "@/data/sitio";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Si vuestra abuela podrá abrirla (y si no tiene WhatsApp), cuánto tarda, qué pasa si cambia algo, idiomas, quién ve la lista de invitados, cómo funcionan las fotos en directo el día de la boda y qué pasa después.",
  alternates: { canonical: "/preguntas" },
};

const GRUPOS: { de: Pregunta["de"]; titulo: string; id: string }[] = [
  { de: "invitados", titulo: "Vuestros invitados", id: "invitados" },
  { de: "producto", titulo: "La invitación", id: "la-invitacion" },
  { de: "precio", titulo: "Precio y plazos", id: "precio" },
  { de: "directo", titulo: "El día de la boda, en directo", id: "el-dia-de-la-boda" },
  { de: "despues", titulo: "Después de la boda", id: "despues" },
];

/**
 * Las preguntas, todas, agrupadas por lo que preocupa: primero los
 * invitados (la abuela, el papel, la privacidad), que es lo que de verdad
 * quita el sueño; el dinero después.
 *
 * El FAQPage sale de la misma lista que se pinta, así que no puede
 * prometer respuestas que no estén en la página.
 */
export default function PaginaPreguntas() {
  return (
    <>
      <DatosEstructurados tipo="preguntas" />

      <Encabezado
        sobre="Antes de decidir"
        titulo="Preguntas"
        bajo="Las que nos hacen siempre, respondidas sin rodeos. Si falta la vuestra, escribidnos y la añadimos."
      />

      <div className="bg-[var(--papel)] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto flex max-w-[72rem] flex-col gap-16 sm:gap-20">
          {GRUPOS.map((g) => (
            <section key={g.de} id={g.id} className="scroll-mt-28 grid gap-6 lg:grid-cols-12 lg:gap-10">
              <h2 className="display text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.05] lg:col-span-4">
                {g.titulo}
              </h2>
              <div className="lg:col-span-8">
                <Preguntas de={g.de} />
              </div>
            </section>
          ))}
        </div>
      </div>

      <LlamadaFinal
        sobre="¿Falta la vuestra?"
        titulo="Preguntádnosla"
        texto="Veinte minutos por vídeo, o un correo. Lo que os resulte más cómodo: no hay presupuesto por delante ni compromiso de nada."
      />
    </>
  );
}
