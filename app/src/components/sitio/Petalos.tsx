"use client";

import { useEffect, useRef } from "react";

/**
 * Pétalos al tocar los CTA (un ClickSpark de pétalos).
 *
 * Todo elemento con `data-petalos` suelta, al pulsarlo, un puñado de
 * pétalos granates, rosa y oro que saltan, giran, se mecen y caen. Va en un
 * solo canvas fijo, que solo se anima mientras hay pétalos vivos: el resto
 * del tiempo no gasta nada. Funciona con ratón y con el dedo.
 *
 * Con `prefers-reduced-motion` no existe: el botón hace lo mismo sin adorno.
 */

const COLORES = ["#8c1d2c", "#b9475a", "#e7b7bd", "#c9a56a", "#f3e2d6"];

type Petalo = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  t: number;
  vida: number;
  tam: number;
  color: string;
  fase: number;
};

export default function Petalos() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lienzo = ref.current;
    const ctx = lienzo?.getContext("2d");
    if (!lienzo || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // (P3) El lienzo solo tiene tamaño mientras hay pétalos: en reposo es
    // 0×0 y no ocupa memoria de GPU ni se compone en cada fotograma de
    // scroll (a pantalla completa y dpr 2 eran ~5 MB, siempre).
    let medido = false;
    const medir = () => {
      lienzo.width = Math.round(window.innerWidth * dpr);
      lienzo.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      medido = true;
    };
    const vaciar = () => {
      lienzo.width = 0;
      lienzo.height = 0;
      medido = false;
    };
    vaciar();
    const alRedimensionar = () => medido && medir();
    window.addEventListener("resize", alRedimensionar);

    const vivos: Petalo[] = [];
    let animando = false;
    let ultimo = 0;

    function petalo(p: Petalo, e: number) {
      const s = p.tam;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.r);
      // El pétalo se «voltea» al caer: se estrecha y se ensancha.
      ctx!.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.fase + e * 9)));
      ctx!.globalAlpha = Math.min(1, (1 - e) * 1.6);
      ctx!.fillStyle = p.color;
      ctx!.beginPath();
      ctx!.moveTo(0, -s);
      ctx!.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.75, s * 0.7, 0, s);
      ctx!.bezierCurveTo(-s * 0.75, s * 0.7, -s * 0.9, -s * 0.6, 0, -s);
      ctx!.fill();
      // La vena, en papel, muy suave.
      ctx!.globalAlpha *= 0.35;
      ctx!.strokeStyle = "#fff";
      ctx!.lineWidth = 0.6;
      ctx!.beginPath();
      ctx!.moveTo(0, -s * 0.7);
      ctx!.lineTo(0, s * 0.7);
      ctx!.stroke();
      ctx!.restore();
    }

    function pintar(ahora: number) {
      const dt = Math.min(32, ahora - (ultimo || ahora)) / 16.7;
      ultimo = ahora;
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = vivos.length - 1; i >= 0; i--) {
        const p = vivos[i];
        const e = (ahora - p.t) / p.vida;
        if (e >= 1) {
          vivos.splice(i, 1);
          continue;
        }
        p.vy += 0.16 * dt; // gravedad
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += (p.vx + Math.sin(p.fase + e * 6) * 0.6) * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        petalo(p, e);
      }
      if (vivos.length) requestAnimationFrame(pintar);
      else {
        animando = false;
        ultimo = 0;
        vaciar();
      }
    }

    const alPulsar = (ev: PointerEvent) => {
      if (quieto.matches) return;
      const el = (ev.target as Element | null)?.closest?.("[data-petalos]");
      if (!el) return;
      const ahora = performance.now();
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.25;
        const v = 3.2 + Math.random() * 3.6;
        vivos.push({
          x: ev.clientX,
          y: ev.clientY,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.18,
          t: ahora,
          vida: 1100 + Math.random() * 700,
          tam: 4.5 + Math.random() * 4,
          color: COLORES[i % COLORES.length],
          fase: Math.random() * Math.PI * 2,
        });
      }
      if (!animando) {
        animando = true;
        if (!medido) medir();
        requestAnimationFrame(pintar);
      }
    };
    window.addEventListener("pointerdown", alPulsar, { passive: true });

    return () => {
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("pointerdown", alPulsar);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] h-full w-full"
    />
  );
}
