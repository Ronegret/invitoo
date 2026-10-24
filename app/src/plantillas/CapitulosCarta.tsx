"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Bloque } from "@/lib/tipos";

/**
 * Los capítulos de Carta: un carrusel horizontal de fotos a sangre, con
 * imán (scroll-snap) y el pie de foto en cursiva. Es lo que hace bonita la
 * historia de Nico & Gaby, pero sin sus pasos de más: no hay que pulsar
 * nada, se desliza con el dedo.
 *
 * Sin JavaScript sigue siendo una fila que se desplaza (CSS puro). Con
 * JavaScript aparecen los botones «anterior / siguiente» y el contador; el
 * contador solo se anuncia cuando se pulsa un botón.
 */
type Capitulo = Extract<Bloque, { t: "capitulos" }>["capitulos"][number];

const subscribirNada = () => () => {};

export default function CapitulosCarta({
  titulo = "Nuestra historia",
  capitulos,
}: {
  titulo?: string;
  capitulos: Capitulo[];
}) {
  const carril = useRef<HTMLOListElement>(null);
  const hidratado = useSyncExternalStore(subscribirNada, () => true, () => false);
  const [actual, setActual] = useState(0);
  const [aviso, setAviso] = useState("");

  // El capítulo visible: el más cercano al centro del carril.
  useEffect(() => {
    const el = carril.current;
    if (!el) return;
    let marco = 0;
    const medir = () => {
      cancelAnimationFrame(marco);
      marco = requestAnimationFrame(() => {
        // Con rectángulos en pantalla, no offsetLeft: el carril no es el
        // offsetParent de sus hijos y el contador marcaba «4 / 4» al empezar.
        const caja = el.getBoundingClientRect();
        const centro = caja.left + caja.width / 2;
        let mejor = 0;
        let distancia = Infinity;
        Array.from(el.children).forEach((n, i) => {
          const r = (n as HTMLElement).getBoundingClientRect();
          const c = r.left + r.width / 2;
          if (Math.abs(c - centro) < distancia) {
            distancia = Math.abs(c - centro);
            mejor = i;
          }
        });
        setActual(mejor);
      });
    };
    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      el.removeEventListener("scroll", medir);
      cancelAnimationFrame(marco);
    };
  }, []);

  const ir = useCallback(
    (i: number) => {
      const el = carril.current;
      if (!el) return;
      const destino = Math.max(0, Math.min(capitulos.length - 1, i));
      const n = el.children[destino] as HTMLElement | undefined;
      if (!n) return;
      const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const caja = el.getBoundingClientRect();
      const r = n.getBoundingClientRect();
      el.scrollTo({
        left: el.scrollLeft + (r.left - caja.left) - (caja.width - r.width) / 2,
        behavior: quieto ? "auto" : "smooth",
      });
      setAviso(`Capítulo ${destino + 1} de ${capitulos.length}: ${capitulos[destino].titulo}`);
    },
    [capitulos],
  );

  return (
    <section className="carta-capitulos py-24" aria-labelledby="carta-historia">
      <div className="px-6 text-center">
        <h2 id="carta-historia" className="display text-[clamp(2.4rem,10vw,3.6rem)]">
          {titulo}
        </h2>
        <p className="mt-6 text-[1.0625rem] opacity-85">
          {capitulos.length === 1 ? "Un capítulo" : `En ${capitulos.length} capítulos`}
          <span className="carta-desliza" aria-hidden> · desliza</span>
        </p>
      </div>

      <ol
        ref={carril}
        className="carril carta-carril mt-12 flex gap-4 overflow-x-auto"
        tabIndex={0}
        aria-label={`${titulo}: ${capitulos.length} capítulos. Desplázate en horizontal.`}
      >
        {capitulos.map((c, i) => (
          <li key={c.titulo} className="carta-capitulo shrink-0" aria-label={`Capítulo ${i + 1} de ${capitulos.length}`}>
            <figure>
              {c.foto ? (
                /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
                <img
                  src={c.foto}
                  alt=""
                  width={900}
                  height={1125}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  sizes="(min-width: 768px) 24rem, 84vw"
                  className="carta-foto aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div aria-hidden className="carta-foto carta-sinfoto aspect-[4/5] w-full" />
              )}
              <figcaption className="px-1 pt-6">
                {c.cuando && <p className="carta-rotulo">{c.cuando}</p>}
                <h3 className="display mt-3 text-[2rem] leading-[1.08]">{c.titulo}</h3>
                <p className="carta-pie mt-3">{c.texto}</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ol>

      {hidratado && capitulos.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-5">
          <button
            type="button"
            className="carta-flecha"
            onClick={() => ir(actual - 1)}
            disabled={actual === 0}
            aria-label="Capítulo anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="min-w-[4.5rem] text-center text-[1.0625rem] tabular-nums" aria-hidden>
            {actual + 1} / {capitulos.length}
          </p>
          <button
            type="button"
            className="carta-flecha"
            onClick={() => ir(actual + 1)}
            disabled={actual === capitulos.length - 1}
            aria-label="Capítulo siguiente"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
      <p className="sr-only" role="status">
        {aviso}
      </p>
    </section>
  );
}
