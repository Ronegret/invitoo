"use client";

import { useEffect, useId, useRef, useState } from "react";
import s from "./efectos.module.css";

/**
 * FlipCard: una tarjeta con dos caras que gira sobre su eje. Aquí, «lo que
 * ve el invitado» y «lo que veis vosotros»: la misma confirmación, desde
 * los dos lados.
 *
 * Se gira con los dos botones de arriba (no con hover: en el móvil no
 * existe). La cara de atrás es `inert` y queda oculta al lector de
 * pantalla. Si nadie la toca, gira una sola vez al entrar en pantalla, para
 * que se entienda el gesto. Con movimiento reducido, cambia con un fundido.
 */
export default function FlipCard({
  frente,
  dorso,
  etiquetas,
}: {
  frente: React.ReactNode;
  dorso: React.ReactNode;
  etiquetas: [string, string];
}) {
  const [cara, setCara] = useState<0 | 1>(0);
  const tocada = useRef(false);
  const caja = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const el = caja.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || tocada.current) return;
        io.disconnect();
        t = window.setTimeout(() => {
          if (!tocada.current) setCara(1);
        }, 1800);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  const elegir = (c: 0 | 1) => {
    tocada.current = true;
    setCara(c);
  };

  return (
    <div className={s.flip}>
      <div className={s.conmutador} role="group" aria-label="Ver desde">
        <span className={s.deslizador} data-cara={cara} aria-hidden />
        {etiquetas.map((e, i) => (
          <button
            key={e}
            type="button"
            aria-pressed={cara === i}
            aria-controls={id}
            onClick={() => elegir(i as 0 | 1)}
            className={s.opcion}
          >
            {e}
          </button>
        ))}
      </div>
      <div ref={caja} id={id} className={s.escena} data-cara={cara}>
        <div className={s.interior}>
          <div className={s.cara} inert={cara !== 0} aria-hidden={cara !== 0}>
            {frente}
          </div>
          <div className={`${s.cara} ${s.atras}`} inert={cara !== 1} aria-hidden={cara !== 1}>
            {dorso}
          </div>
        </div>
      </div>
    </div>
  );
}
