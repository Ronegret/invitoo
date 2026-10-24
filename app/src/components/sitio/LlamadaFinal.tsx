import Link from "next/link";
import SelloAlianzas from "@/components/SelloAlianzas";
import EnlaceReserva from "@/components/sitio/EnlaceReserva";
import { PLANTILLAS } from "@/data/plantillas";
import { PLANTILLA_PORTADA } from "@/data/sitio";
import { EMAIL, enlaceReserva } from "@/lib/contacto";

/**
 * El cierre de todas las páginas públicas: el sello, una pregunta y la
 * videollamada. Cada página tiene que poder terminar en una conversación;
 * una página sin salida devuelve la visita a Google.
 *
 * Es el único bloque centrado de la web, y a propósito: después de tantas
 * composiciones a un lado, el cierre se para en el eje, como el lacre de un
 * sobre.
 */
export default function LlamadaFinal({
  sobre = "Os esperamos",
  titulo = "¿Hablamos?",
  texto = "Veinte minutos por vídeo, gratis y sin compromiso. Nos contáis cómo es vuestra boda, quién viene y qué os hace ilusión, y os enseñamos por dónde iría la invitación.",
  boton = "Hablamos 20 minutos",
  href,
}: {
  sobre?: string;
  titulo?: string;
  texto?: string;
  boton?: string;
  /** Destino del botón principal. Por defecto, la videollamada. */
  href?: string;
}) {
  const demo =
    PLANTILLAS.find((p) => (p.id as string) === PLANTILLA_PORTADA) ?? PLANTILLAS[0];

  return (
    <section
      data-cursor-tema="oscuro"
      id="hablamos"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--tinta)] px-4 py-28 text-[var(--papel)] sm:px-6 sm:py-32"
    >
      <div className="relative mx-auto max-w-[40rem] text-center">
        <SelloAlianzas size={64} className="mx-auto text-[var(--oro)]" />
        <p className="mt-8 text-[1rem] opacity-70">{sobre}</p>
        <h2 className="display mt-4 text-[clamp(2.8rem,9vw,4.8rem)] leading-[1.02]">
          {titulo}
        </h2>
        <p className="mx-auto mt-8 max-w-[32rem] text-[1.06rem] leading-[1.8] opacity-75">
          {texto}
        </p>

        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <EnlaceReserva
            href={href ?? enlaceReserva()}
            className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[var(--papel)] px-9 text-[1rem] text-[var(--tinta)] transition-transform duration-200 ease-out hover:scale-[1.02] sm:w-auto"
            data-petalos
          >
            {boton}
          </EnlaceReserva>
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex min-h-14 w-full items-center justify-center rounded-full border border-[var(--papel)]/35 px-9 text-[1rem] transition-colors duration-200 hover:border-[var(--papel)] sm:w-auto"
          >
            {EMAIL}
          </a>
        </div>

        <p className="mt-10 text-[1rem] opacity-70">
          <Link
            href={`/i/${demo.demo}`}
            className="inline-flex min-h-12 items-center underline decoration-[var(--papel)]/35 underline-offset-4 hover:decoration-[var(--papel)]"
          >
            O abrid primero una invitación de ejemplo
          </Link>
        </p>
      </div>
    </section>
  );
}
