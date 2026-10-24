"use client";

import { useEffect } from "react";

/**
 * ORILLA (K2) — al tocar fuera de un control, ondas concéntricas de agua:
 * dos anillos turquesa de 1,5 px que se abren a 9× y desaparecen en
 * 900 ms. Nunca sobre un control, uno cada 350 ms como mucho y nada con
 * «menos movimiento».
 */
const CONTROLES = "a,button,input,textarea,select,label,summary,[role=button],[data-sin-toque]";

export default function OrillaOndas() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ultimo = 0;
    const toca = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest(CONTROLES)) return;
      if (e.timeStamp - ultimo < 350) return;
      ultimo = e.timeStamp;
      const raiz = document.querySelector(".lienzo");
      for (let i = 0; i < 2; i++) {
        const s = document.createElement("span");
        s.className = "ol-onda";
        s.setAttribute("aria-hidden", "true");
        s.style.left = `${e.clientX}px`;
        s.style.top = `${e.clientY}px`;
        s.style.animationDelay = `${i * 140}ms`;
        s.addEventListener("animationend", () => s.remove(), { once: true });
        raiz?.appendChild(s);
      }
    };
    document.addEventListener("pointerdown", toca, { passive: true });
    return () => document.removeEventListener("pointerdown", toca);
  }, []);
  return null;
}
