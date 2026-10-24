"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./sistema.css";

type Props = {
  children: ReactNode;
  /** Desplazamiento máximo hacia el cursor, en px. Máximo 6. */
  fuerza?: number;
  className?: string;
};

/**
 * Atrae suavemente su contenido hacia el ratón (≤ 6 px) y lo suelta con un
 * muelle. Solo con puntero fino y sin reduced-motion; en táctil es un
 * <span> inerte. Solo mueve `transform` del hijo: el hueco del layout no
 * cambia, así que nada de alrededor se desplaza ni se solapa.
 *
 *   <Magnetico><Boton href="/empezar">Empezar</Boton></Magnetico>
 */
export default function Magnetico({ children, fuerza = 6, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const mq = matchMedia("(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)");
    const max = Math.min(6, fuerza);
    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, raf = 0;

    const paso = () => {
      // Muelle amortiguado (k 0,12 · amortiguación 0,72): llega sin prisa y
      // al soltar pasa un pelo del centro antes de quedarse quieto.
      vx = (vx + (tx - x) * 0.12) * 0.72;
      vy = (vy + (ty - y) * 0.12) * 0.72;
      x += vx;
      y += vy;
      el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.02 ? requestAnimationFrame(paso) : 0;
    };
    const ir = () => (raf ||= requestAnimationFrame(paso));
    const mover = (e: PointerEvent) => {
      if (e.pointerType != "mouse" || !mq.matches) return;
      const b = el.getBoundingClientRect();
      const nx = (e.clientX - b.left - b.width / 2) / (b.width / 2);
      const ny = (e.clientY - b.top - b.height / 2) / (b.height / 2);
      tx = Math.max(-1, Math.min(1, nx)) * max;
      ty = Math.max(-1, Math.min(1, ny)) * max;
      ir();
    };
    const soltar = () => ((tx = ty = 0), ir());

    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", soltar);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", soltar);
      cancelAnimationFrame(raf);
    };
  }, [fuerza]);

  return (
    <span ref={ref} className={className ? `magnetico ${className}` : "magnetico"}>
      {children}
    </span>
  );
}
