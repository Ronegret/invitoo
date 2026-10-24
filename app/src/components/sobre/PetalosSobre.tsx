"use client";

import { useEffect } from "react";

/**
 * Momento firma 1: al partirse el lacre, salen pétalos del sobre.
 *
 * No pinta nada. Escucha el aviso de la apertura (`invitoo:apertura` con
 * «abriendo») y lanza un abanico de pétalos desde el lacre con el motor
 * compartido (`flores/motor.ts`, un único canvas). El motor se descarga en
 * cuanto el navegador está libre, para que el primer pétalo salga con el
 * toque y no 100 ms después. Con «menos movimiento», nada.
 */
export default function PetalosSobre() {
  useEffect(() => {
    let quieto = false;
    try {
      quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* noop */
    }
    if (quieto) return;
    // Si la apertura no se ve (ya la abrió otro día), nada que precargar.
    if (!document.querySelector('.apertura[data-estado="dentro"]')) return;
    const modulo = () => import("@/components/flores/motor");
    const cargar = () => modulo().then((m) => m.motor());
    // Se precarga el código (no el canvas) en cuanto el navegador está libre.
    const ric = (window as Window & { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback;
    const id = ric ? ric(() => void modulo()) : window.setTimeout(() => void modulo(), 600);
    const alAbrir = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== "abriendo") return;
      const lacre = document.querySelector<HTMLElement>(".apertura [data-abrir] .sc-lacre, .apertura .sc-lacre, .apertura [data-abrir]");
      const r = lacre?.getBoundingClientRect();
      const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
      const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
      void cargar().then((m) => m.abanico(x, y));
    };
    window.addEventListener("invitoo:apertura", alAbrir);
    return () => {
      window.removeEventListener("invitoo:apertura", alAbrir);
      if (!ric) window.clearTimeout(id);
    };
  }, []);
  return null;
}
