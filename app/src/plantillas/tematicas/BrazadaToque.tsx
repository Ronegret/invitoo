"use client";

import { useEffect, useRef } from "react";

/**
 * BRAZADA — al tocar, 5–7 burbujas suben desde el dedo y revientan. Nunca
 * sobre un control, una ráfaga cada 350 ms como mucho y nada con «menos
 * movimiento». `<i>` efímeros (CSS) en una capa fija sin eventos.
 */
const CONTROLES = "a,button,input,textarea,select,label,summary,[role=button],[data-sin-toque]";

export default function BrazadaToque() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const capa = ref.current;
    if (!capa || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ultimo = 0;
    const tocar = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest(CONTROLES) || e.timeStamp - ultimo < 350) return;
      ultimo = e.timeStamp;
      const n = 5 + Math.round(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        const b = document.createElement("i");
        b.className = "br-burbuja";
        const t = 5 + Math.random() * 9;
        b.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;width:${t}px;height:${t}px;--dx:${((Math.random() - 0.5) * 50).toFixed(0)}px;--d:${i * 60}ms`;
        b.addEventListener("animationend", () => b.remove());
        capa.appendChild(b);
      }
    };
    document.addEventListener("pointerdown", tocar, { passive: true });
    return () => document.removeEventListener("pointerdown", tocar);
  }, []);
  return <div ref={ref} className="br-toque" aria-hidden="true" />;
}
