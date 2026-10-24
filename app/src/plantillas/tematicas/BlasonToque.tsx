"use client";

import { useEffect } from "react";

/**
 * BLASÓN (K2) — al tocar fuera de un control queda un sello de lacre
 * borgoña de 28 px que se desvanece en 900 ms. Nunca encima de un control,
 * como mucho uno cada 350 ms, y nada con «menos movimiento».
 */
const CONTROLES = "a,button,input,textarea,select,label,summary,[role=button],[data-sin-toque]";

export default function BlasonToque() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ultimo = 0;
    const toca = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest(CONTROLES)) return;
      if (e.timeStamp - ultimo < 350) return;
      ultimo = e.timeStamp;
      const s = document.createElement("span");
      s.className = "bl-toque";
      s.setAttribute("aria-hidden", "true");
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      s.addEventListener("animationend", () => s.remove(), { once: true });
      document.querySelector(".lienzo")?.appendChild(s);
    };
    document.addEventListener("pointerdown", toca, { passive: true });
    return () => document.removeEventListener("pointerdown", toca);
  }, []);
  return null;
}
