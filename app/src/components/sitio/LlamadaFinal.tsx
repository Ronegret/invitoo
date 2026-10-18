import Link from "next/link";
import Rama from "@/components/Botanica";
import { Iman } from "@/components/Gestos";
import Revelar from "@/components/Revelar";
import SelloAlianzas from "@/components/SelloAlianzas";
import { EMAIL, enlaceReserva } from "@/lib/contacto";

/**
 * El cierre: la misma pieza con la que acaba una invitación nuestra —sello,
 * ramas, fondo en tinta, la pregunta grande— convertida en la llamada a la
 * acción del sitio.
 *
 * Va al final de TODAS las páginas públicas, y es deliberado: ahora que la
 * web está partida en cuatro, cada página tiene que poder terminar en una
 * conversación. Una página sin salida es una página que devuelve la visita
 * a Google.
 *
 * El texto cambia según de dónde venga: quien acaba de leer los precios no
 * necesita que le expliquen otra vez qué es esto.
 */
export default function LlamadaFinal({
  sobre = "Os esperamos",
  titulo = "¿Hablamos?",
  texto = "Veinte minutos por Meet. Nos contáis cómo es vuestra boda, quién viene y qué os hace ilusión, y os enseñamos por dónde iría la invitación.",
}: {
  sobre?: string;
  titulo?: string;
  texto?: string;
}) {
  return (
    <section
      id="hablamos"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--tinta)] px-5 py-32 text-[var(--papel)]"
    >
      <Rama
        forma="olivo"
        ancho={300}
        className="pointer-events-none absolute -left-20 top-10 opacity-[0.14]"
      />
      <Rama
        forma="eucalipto"
        ancho={240}
        espejo
        retraso={200}
        className="pointer-events-none absolute -right-16 bottom-10 opacity-[0.14]"
      />

      <div className="relative mx-auto max-w-[40rem] text-center">
        <Revelar>
          <SelloAlianzas size={70} className="mx-auto opacity-90" />
          <p className="mt-9 text-[0.75rem] uppercase tracking-[0.42em] opacity-55">
            {sobre}
          </p>
          <h2 className="display mt-6 text-[clamp(2.6rem,9vw,4.4rem)] leading-[1.02]">
            {titulo}
          </h2>
          <span className="mx-auto mt-8 block h-px w-32 bg-[var(--papel)]/30" />
          <p className="mx-auto mt-8 max-w-[31rem] text-[1.04rem] leading-[1.9] opacity-70">
            {texto}
          </p>

          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Iman fuerza={14}>
              <a
                href={enlaceReserva()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[var(--papel)] px-9 text-[0.8rem] uppercase tracking-[0.2em] text-[var(--tinta)] transition-transform duration-500 hover:scale-[1.03] sm:w-auto"
              >
                Reservar los 20 minutos
              </a>
            </Iman>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full border border-[var(--papel)]/35 px-9 text-[0.8rem] uppercase tracking-[0.2em] transition-colors duration-500 hover:border-[var(--papel)] sm:w-auto"
            >
              {EMAIL}
            </a>
          </div>

          <p className="mt-12 text-[0.82rem] opacity-50">
            <Link href="/i/nora-y-sebas" className="enlace-sub">
              O abrid primero una invitación entera
            </Link>
          </p>
        </Revelar>
      </div>
    </section>
  );
}
