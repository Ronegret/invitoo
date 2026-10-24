"use client";

import { useState } from "react";

/**
 * MEMORIAS (K2) — el álbum de instantáneas: un carrusel con scroll-snap,
 * cada foto con su ángulo y su esquinero (la centrada se endereza, CSS).
 * Al tocar una se da la vuelta y en el dorso aparece una nota a mano, con
 * el mismo texto en Courier debajo para leerlo bien. Cada foto es un
 * botón (`aria-pressed`) de 48 px o más.
 */
export type Instantanea = { foto: string; nota: string; cuando?: string };

export default function MemoriasInstantaneas({ fotos }: { fotos: Instantanea[] }) {
  const [vuelta, setVuelta] = useState<number | null>(null);
  return (
    <ul className="me-carril" aria-label="Fotos antiguas: tocad una para leer el dorso">
      {fotos.map((f, i) => {
        const dada = vuelta === i;
        return (
          <li key={f.foto + i} className="me-polaroid-caja" style={{ "--r": `${i % 2 ? 3.5 : -4}deg` } as React.CSSProperties}>
            <button
              type="button"
              className="me-polaroid"
              data-vuelta={dada ? "1" : undefined}
              aria-pressed={dada}
              onClick={() => setVuelta(dada ? null : i)}
            >
              <span className="me-polaroid-cara">
                {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
                <img src={f.foto} alt="" width={480} height={560} loading="lazy" decoding="async" />
                <span className="me-esquinero a" aria-hidden="true" />
                <span className="me-esquinero b" aria-hidden="true" />
                <span className="me-polaroid-pie" aria-hidden="true">{f.cuando ?? ""}</span>
              </span>
              <span className="me-polaroid-dorso">
                <span className="me-dorso-mano" aria-hidden="true">{f.nota}</span>
                <span className="me-dorso-texto">
                  {f.cuando ? `${f.cuando}. ` : ""}
                  {f.nota}
                </span>
              </span>
              <span className="sr-only">{dada ? "Volver a la foto" : "Ver el dorso de la foto"}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
