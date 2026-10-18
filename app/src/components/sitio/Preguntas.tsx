import Revelar from "@/components/Revelar";
import { PREGUNTAS, type Pregunta } from "@/data/sitio";

/**
 * El acordeón de preguntas.
 *
 * Va con `<details>` nativo a propósito: se abre sin JavaScript, el buscador
 * lo lee y el teclado lo maneja solo. Un acordeón hecho a mano con estado de
 * React aquí sería más código, peor accesibilidad y ninguna ventaja.
 *
 * `de` filtra: en /precios solo salen las dudas de dinero, en /servicios las
 * de producto, y en /preguntas todas.
 */
export default function Preguntas({ de }: { de?: Pregunta["de"] }) {
  const lista = de ? PREGUNTAS.filter((p) => p.de === de) : PREGUNTAS;

  return (
    <div>
      {lista.map((p, i) => (
        <Revelar key={p.q} retraso={i * 50}>
          <details className="group border-b border-[var(--tinta)]/12 py-2">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 text-[1.04rem]">
              {p.q}
              <span
                aria-hidden
                className="shrink-0 text-[1.3rem] leading-none text-[var(--acento)] transition-transform duration-500 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-6 pr-8 text-[0.98rem] leading-[1.8] opacity-70">
              {p.a}
            </p>
          </details>
        </Revelar>
      ))}
    </div>
  );
}
