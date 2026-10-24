"use client";

import { useEffect, useRef } from "react";

/**
 * Una cifra que cuenta hasta su valor al entrar en pantalla (CountUp
 * suave: 1,1 s con frenada). El HTML del servidor ya trae el número final,
 * así que sin JavaScript, con «menos movimiento» o si el observador no
 * llega a disparar, se lee el número correcto. Solo cambia el texto de un
 * `<span aria-hidden>`; el valor accesible es fijo.
 */
export default function Cifra({
  valor,
  desde,
  className,
}: {
  valor: number;
  /** Desde dónde cuenta. Por defecto, el 80 % del valor (un año: 3 antes). */
  desde?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let quieto = false;
    try {
      quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* noop */
    }
    if (quieto) return;
    const inicio = desde ?? (valor > 1900 && valor < 2200 ? valor - 3 : Math.round(valor * 0.8));
    // Solo si aún no se ve: lo que ya está en pantalla no se recuenta.
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) return;
    el.textContent = String(inicio);
    let marco = 0;
    const io = new IntersectionObserver(
      (e) => {
        if (!e.some((x) => x.isIntersecting)) return;
        io.disconnect();
        const t0 = performance.now();
        const paso = (t: number) => {
          const k = Math.min(1, (t - t0) / 1100);
          const suave = 1 - (1 - k) ** 3;
          el.textContent = String(Math.round(inicio + (valor - inicio) * suave));
          if (k < 1) marco = requestAnimationFrame(paso);
        };
        marco = requestAnimationFrame(paso);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(marco);
      el.textContent = String(valor);
    };
  }, [valor, desde]);

  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      <span className="sr-only">{valor}</span>
      <span ref={ref} aria-hidden="true">
        {valor}
      </span>
    </span>
  );
}
