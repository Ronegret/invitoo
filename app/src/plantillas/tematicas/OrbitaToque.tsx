"use client";

import { useEffect, useRef } from "react";

/**
 * ÓRBITA — al tocar el cielo sale una estrella fugaz desde el dedo: un trazo
 * de 60 px en diagonal que se apaga en 700 ms. Una cada 600 ms como mucho,
 * nunca sobre un control y nada con «menos movimiento».
 */
const CONTROLES = "a,button,input,textarea,select,label,summary,[role=button],[data-sin-toque]";

export default function OrbitaToque() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const capa = ref.current;
    if (!capa || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ultimo = 0;
    const tocar = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest(CONTROLES) || e.timeStamp - ultimo < 600) return;
      ultimo = e.timeStamp;
      const s = document.createElement("i");
      s.className = "or-fugaz";
      s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
      s.addEventListener("animationend", () => s.remove());
      capa.appendChild(s);
    };
    document.addEventListener("pointerdown", tocar, { passive: true });
    return () => document.removeEventListener("pointerdown", tocar);
  }, []);
  return <div ref={ref} className="or-toque" aria-hidden="true" />;
}
