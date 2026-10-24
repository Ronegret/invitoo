"use client";

import { useEffect, useRef } from "react";

/**
 * BOSQUE ENCANTADO — al tocar: 4–5 hojas de eucalipto caen girando desde el
 * dedo; en la sección de noche, se enciende una luciérnaga que se apaga en
 * 2 s. Nunca sobre un control, como mucho uno cada 350 ms y nada con «menos
 * movimiento». Son `<i>` efímeros (CSS) en una capa fija sin eventos.
 */
const CONTROLES = "a,button,input,textarea,select,label,summary,[role=button],[data-sin-toque]";

export default function PinarToque() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const capa = ref.current;
    if (!capa || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ultimo = 0;
    const tocar = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest(CONTROLES) || e.timeStamp - ultimo < 350) return;
      ultimo = e.timeStamp;
      const noche = t?.closest(".pi-noche");
      const n = noche ? 1 : 4 + (e.timeStamp % 2);
      for (let i = 0; i < n; i++) {
        const h = document.createElement("i");
        h.className = noche ? "pi-chispa" : "pi-hoja";
        h.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${((i - n / 2) * 18).toFixed(0)}px;--r:${(i % 2 ? 1 : -1) * (160 + i * 40)}deg;--d:${i * 70}ms`;
        h.addEventListener("animationend", () => h.remove());
        capa.appendChild(h);
      }
    };
    document.addEventListener("pointerdown", tocar, { passive: true });
    return () => document.removeEventListener("pointerdown", tocar);
  }, []);
  return <div ref={ref} className="pi-toque" aria-hidden="true" />;
}
