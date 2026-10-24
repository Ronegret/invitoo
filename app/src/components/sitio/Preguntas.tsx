import { PREGUNTAS, type Pregunta } from "@/data/sitio";

/**
 * El acordeón de preguntas.
 *
 * Va con `<details>` nativo a propósito: se abre sin JavaScript, el buscador
 * lo lee y el teclado lo maneja solo.
 *
 * `de` filtra: en /precios solo salen las dudas de dinero, en /servicios las
 * de producto, y en /preguntas todas.
 */
export default function Preguntas({
  de,
  max,
}: {
  de?: Pregunta["de"] | Pregunta["de"][];
  /** Cuántas como mucho (en la portada, las seis primeras). */
  max?: number;
}) {
  const filtro = de ? (Array.isArray(de) ? de : [de]) : null;
  const todas = filtro ? PREGUNTAS.filter((p) => filtro.includes(p.de)) : PREGUNTAS;
  const lista = max ? todas.slice(0, max) : todas;

  return (
    <div className="border-t border-[var(--tinta)]/15">
      {lista.map((p) => (
        <details key={p.q} className="group border-b border-[var(--tinta)]/15">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-[1.12rem] leading-snug [&::-webkit-details-marker]:hidden">
            {p.q}
            <span
              aria-hidden
              className="shrink-0 text-[1.5rem] leading-none text-[var(--acento)] transition-transform duration-200 ease-out group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="max-w-[40rem] pb-7 pr-8 text-[1.04rem] leading-[1.8] opacity-80">
            {p.a}
          </p>
        </details>
      ))}
    </div>
  );
}
