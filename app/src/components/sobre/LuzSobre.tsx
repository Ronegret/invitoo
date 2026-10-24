"use client";

import { useEffect } from "react";

/**
 * Que el sobre se vea de verdad: se inclina (±5°) hacia el ratón o con el
 * giroscopio, y la luz resbala por el papel (`--sc-rx`, `--sc-ry`,
 * `--sc-luz`, `--sc-sx` en `.sc-escena`; el CSS está en Sobre.tsx). Un solo rAF por
 * movimiento, nada en reposo. En iOS el giroscopio pide permiso y solo puede
 * hacerlo tras un gesto: el primer gesto ya abre el sobre, así que allí se
 * queda con el flotar del CSS. Con «menos movimiento», quieto.
 */
export default function LuzSobre() {
  useEffect(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      /* noop */
    }
    // Las variables van en la escena: las heredan el sobre y su sombra.
    const sobre = document.querySelector<HTMLElement>(".apertura .sc-escena");
    if (!sobre) return;
    let rx = 0;
    let ry = 0;
    let pendiente = 0;
    const pintar = () => {
      pendiente = 0;
      sobre.style.setProperty("--sc-rx", `${rx.toFixed(2)}deg`);
      sobre.style.setProperty("--sc-ry", `${ry.toFixed(2)}deg`);
      sobre.style.setProperty("--sc-luz", `${(ry * 4).toFixed(1)}%`);
      // La sombra se desplaza al lado contrario de la luz.
      sobre.style.setProperty("--sc-sx", `${(-ry * 1.4).toFixed(1)}px`);
    };
    const poner = (x: number, y: number) => {
      // x, y en −1…1.
      ry = Math.max(-1, Math.min(1, x)) * 5;
      rx = Math.max(-1, Math.min(1, y)) * -4;
      if (!pendiente) pendiente = requestAnimationFrame(pintar);
    };
    const alMover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      poner((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    let base: [number, number] | null = null;
    const alInclinar = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // La postura con la que se coge el móvil es el «plano».
      base ??= [e.gamma, e.beta];
      poner((e.gamma - base[0]) / 18, (e.beta - base[1]) / 18);
    };
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("deviceorientation", alInclinar, { passive: true });
    // Al abrir, vuelve a plano (lo hace el CSS); se deja de escuchar.
    const alAbrir = (e: Event) => {
      if ((e as CustomEvent<string>).detail === "abriendo") quitar();
    };
    window.addEventListener("invitoo:apertura", alAbrir);
    function quitar() {
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("deviceorientation", alInclinar);
      window.removeEventListener("invitoo:apertura", alAbrir);
      if (pendiente) cancelAnimationFrame(pendiente);
    }
    return quitar;
  }, []);
  return null;
}
