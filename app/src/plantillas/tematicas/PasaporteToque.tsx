"use client";

import { useEffect } from "react";

/**
 * PASAPORTE (K2) — «Sellad vuestro pasaporte»: cada toque fuera de un
 * control deja un sello de entrada en tinta terracota, girado al azar,
 * que se desvanece en 900 ms (y una vibración de 10 ms donde la haya).
 * Nunca sobre un control, uno cada 350 ms como mucho, nada con «menos
 * movimiento». Opcional: no bloquea ni esconde nada.
 */
const CONTROLES = "a,button,input,textarea,select,label,summary,[role=button],[data-sin-toque]";

export default function PasaporteToque() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ultimo = 0;
    let n = 0;
    const toca = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest(CONTROLES)) return;
      if (e.timeStamp - ultimo < 350) return;
      ultimo = e.timeStamp;
      const s = document.createElement("span");
      s.className = "ps-toque";
      s.setAttribute("aria-hidden", "true");
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      s.style.setProperty("--g", `${(n++ % 5) * 9 - 18}deg`);
      s.addEventListener("animationend", () => s.remove(), { once: true });
      document.querySelector(".lienzo")?.appendChild(s);
      try { navigator.vibrate?.(10); } catch { /* sin permiso */ }
    };
    document.addEventListener("pointerdown", toca, { passive: true });
    return () => document.removeEventListener("pointerdown", toca);
  }, []);
  return null;
}
