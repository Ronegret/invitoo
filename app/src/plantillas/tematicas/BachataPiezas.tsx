"use client";

import { useRef } from "react";
import { Anuncio, mayuscula, useCuenta } from "./cuenta";
import { LA_MENOR, pulsar, vibrar } from "./musicales";

const NOTAS = ["La", "Mi", "La", "Do"];

/**
 * LUNA DE BACHATA — «Las cuatro cuerdas» (MOMENTO WOW).
 *
 * La cuenta atrás va posada sobre cuatro cuerdas de bronce: días, horas,
 * minutos y segundos. Cuando una cifra cambia, su cuerda vibra (una onda que
 * se amortigua en 600 ms). Y se pueden TOCAR: un toque en una cuerda da su
 * nota; con el ratón, al pasar por encima con el botón pulsado, se rasguea;
 * «Tocar un acorde» arpegia La menor. Sonido sintetizado aquí (Karplus-
 * Strong), sin descargar nada. Cada cuerda tiene 48 px de alto aunque el
 * hilo sea de 2 px, y la zona deja hacer scroll vertical (`pan-y`).
 */
export function BachataCuerdas({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const ref = useRef<HTMLDivElement>(null);
  const filas = [
    ["días", c.d],
    ["horas", c.h],
    ["min", c.m],
    ["seg", c.s],
  ] as const;

  const vibra = (i: number) => {
    const li = ref.current?.querySelectorAll<HTMLElement>(".ba-cuerda")[i];
    if (!li) return;
    li.classList.remove("ba-tocada");
    void li.offsetWidth; // reinicia la animación
    li.classList.add("ba-tocada");
  };
  const toca = (i: number, retraso = 0) => {
    pulsar(LA_MENOR[i], 0.26, retraso);
    window.setTimeout(() => vibra(i), retraso * 1000);
    vibrar(5);
  };

  return (
    <div className="ba-cuerdas" ref={ref}>
      <Anuncio c={c} />
      <ul
        className="ba-mastil"
        onPointerOver={(e) => {
          // Rasgueo con ratón o lápiz: al cruzar una cuerda con el botón pulsado.
          if (e.pointerType === "touch" || !e.buttons) return;
          const i = Number((e.target as HTMLElement).closest<HTMLElement>("[data-cuerda]")?.dataset.cuerda);
          if (Number.isFinite(i)) toca(i);
        }}
      >
        {filas.map(([et, n], i) => (
          <li key={et} className="ba-cuerda" data-grosor={i}>
            <button
              type="button"
              className="ba-cuerda-toque"
              data-cuerda={i}
              aria-label={`Cuerda de ${NOTAS[i]}`}
              onPointerDown={(e) => {
                if (e.pointerType !== "touch") toca(i);
              }}
              onClick={(e) => {
                // Teclado (detail 0) y toque: el clic. El ratón ya sonó en pointerdown.
                if (e.detail === 0 || (e.nativeEvent as PointerEvent).pointerType === "touch") toca(i);
              }}
            >
              <svg key={c.vivo ? n : "q"} viewBox="0 0 400 20" preserveAspectRatio="none" className="ba-onda" aria-hidden="true">
                <path d="M0 10 Q100 2 200 10 T400 10" />
              </svg>
              <span className="ba-hilo" aria-hidden="true" />
            </button>
            {c.vivo && c.estado === "falta" && (
              <span className="ba-cifra" aria-hidden="true">
                <span className="display tabular-nums">{n}</span> <span className="ba-et">{et}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      {!(c.vivo && c.estado === "falta") && (
        <p className="ba-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy bailamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por bailar" : mayuscula(c.fecha)}
        </p>
      )}
      <button
        type="button"
        className="ba-acorde"
        onClick={() => {
          [0, 1, 2, 3].forEach((i) => toca(i, i * 0.08));
          vibrar([5, 40, 5, 40, 5, 40, 5]);
        }}
      >
        Tocar un acorde
      </button>
    </div>
  );
}
