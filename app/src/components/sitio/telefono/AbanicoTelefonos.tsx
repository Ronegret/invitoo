"use client";

import { useEffect, useRef } from "react";
import Iphone from "./Iphone";
import PantallaViva from "./PantallaViva";
import s from "./abanico.module.css";

/**
 * Tres invitaciones de verdad, en tres teléfonos abiertos en abanico (W2).
 *
 * El del centro abre con su vídeo, destella y enseña la invitación; los
 * tres bajan por su invitación cuando bajáis por la web (cada uno a su
 * ritmo). Con ratón, el abanico se inclina un poco hacia él.
 *
 * Solo el teléfono del centro lleva vídeo: tres vídeos a la vez en un
 * móvil serían datos y batería del visitante.
 */

export type TelefonoAbanico = {
  slug: string;
  nombre: string;
  poster: string;
  video?: string;
  fondo: string;
  hasta: string;
  acabado: "oscuro" | "claro";
};

export default function AbanicoTelefonos({
  izq,
  centro,
  der,
  aviso,
}: {
  izq: TelefonoAbanico;
  centro: TelefonoAbanico;
  der: TelefonoAbanico;
  /** «Carmen ha confirmado», la nota que llega. */
  aviso: { quien: string; que: string };
}) {
  const ref = useRef<HTMLDivElement>(null);

  /* La inclinación hacia el ratón (solo puntero fino y con movimiento). */
  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const zona = nodo.closest("section") ?? nodo;
    let raf = 0;
    const mover = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const caja = nodo.getBoundingClientRect();
        const x = (e.clientX - (caja.left + caja.width / 2)) / (window.innerWidth / 2);
        const y = (e.clientY - (caja.top + caja.height / 2)) / (window.innerHeight / 2);
        const px = Math.max(-1, Math.min(1, x));
        const py = Math.max(-1, Math.min(1, y));
        nodo.style.setProperty("--px", px.toFixed(3));
        nodo.style.setProperty("--py", py.toFixed(3));
        nodo.style.setProperty("--brillo", (-px).toFixed(3));
      });
    };
    const salir = () => {
      nodo.style.setProperty("--px", "0");
      nodo.style.setProperty("--py", "0");
      nodo.style.setProperty("--brillo", "0");
    };
    zona.addEventListener("pointermove", mover as EventListener, { passive: true });
    zona.addEventListener("pointerleave", salir);
    return () => {
      cancelAnimationFrame(raf);
      zona.removeEventListener("pointermove", mover as EventListener);
      zona.removeEventListener("pointerleave", salir);
    };
  }, []);

  const uno = (t: TelefonoAbanico, lugar: string, prioridad = false) => (
    <div className={`${s.ranura} ${lugar}`}>
      <div className={s.paralaje}>
        <div className={s.inclina}>
          <Iphone acabado={t.acabado}>
            <PantallaViva
              tira={t.slug}
              poster={t.video ? t.poster : undefined}
              video={t.video}
              fondo={t.fondo}
              hasta={t.hasta}
              desde="0px"
              hastaRango="1600px"
              href={`/i/${t.slug}`}
              titulo={`Invitación de muestra ${t.nombre}`}
              prioridad={prioridad}
            />
          </Iphone>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={ref} className={s.abanico}>
      {uno(izq, s.izq)}
      {uno(der, s.der)}
      {uno(centro, s.centro, true)}
      <p className={s.aviso} aria-hidden>
        <span className={s.corazon}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
        <span>
          <b>{aviso.quien}</b> viene
          <small>{aviso.que}</small>
        </span>
      </p>
    </div>
  );
}
