"use client";

import { useEffect, useRef } from "react";

/**
 * CUENTO DE HADAS — el polvo de hadas que sigue al dedo (o al ratón).
 *
 * Un solo `<canvas>` fijo, `aria-hidden` y sin eventos (no tapa nada: los
 * toques pasan). Solo dibuja mientras hay chispas vivas; en reposo no hay
 * bucle. Como mucho 90 chispas, densidad de píxel limitada a 2. Con «menos
 * movimiento» no existe.
 */
type Chispa = { x: number; y: number; vx: number; vy: number; vida: number; r: number; tono: number };

export default function PolvoHadas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = ref.current;
    if (!lienzo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const medir = () => {
      lienzo.width = Math.round(window.innerWidth * dpr);
      lienzo.height = Math.round(window.innerHeight * dpr);
    };
    medir();
    window.addEventListener("resize", medir, { passive: true });

    const chispas: Chispa[] = [];
    let raf = 0;
    let ultimo = 0;

    const pintar = (t: number) => {
      const dt = Math.min(48, t - (ultimo || t)) / 16.7;
      ultimo = t;
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = chispas.length - 1; i >= 0; i--) {
        const c = chispas[i];
        c.vida -= 0.018 * dt;
        if (c.vida <= 0) {
          chispas.splice(i, 1);
          continue;
        }
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vy += 0.035 * dt; // cae despacio, como polvo
        c.vx *= 0.985;
        const a = c.vida;
        const r = c.r * dpr * (0.6 + a * 0.6);
        const g = ctx.createRadialGradient(c.x * dpr, c.y * dpr, 0, c.x * dpr, c.y * dpr, r * 3);
        g.addColorStop(0, `hsla(${c.tono}, 95%, 88%, ${a})`);
        g.addColorStop(0.4, `hsla(${c.tono}, 85%, 65%, ${a * 0.35})`);
        g.addColorStop(1, "hsla(45, 80%, 60%, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x * dpr, c.y * dpr, r * 3, 0, Math.PI * 2);
        ctx.fill();
        // Un destello en cruz en las más grandes.
        if (c.r > 2.2 && a > 0.5) {
          ctx.strokeStyle = `hsla(48, 100%, 92%, ${a * 0.7})`;
          ctx.lineWidth = dpr * 0.8;
          ctx.beginPath();
          ctx.moveTo(c.x * dpr - r * 2.4, c.y * dpr);
          ctx.lineTo(c.x * dpr + r * 2.4, c.y * dpr);
          ctx.moveTo(c.x * dpr, c.y * dpr - r * 2.4);
          ctx.lineTo(c.x * dpr, c.y * dpr + r * 2.4);
          ctx.stroke();
        }
      }
      raf = chispas.length ? requestAnimationFrame(pintar) : 0;
      if (!raf) ultimo = 0;
    };

    let px = -1;
    let py = -1;
    const soltar = (x: number, y: number, n: number) => {
      for (let i = 0; i < n && chispas.length < 90; i++) {
        chispas.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 1.4,
          vy: -Math.random() * 1.2 - 0.2,
          vida: 0.7 + Math.random() * 0.3,
          r: 0.9 + Math.random() * 2,
          tono: 38 + Math.random() * 22,
        });
      }
      if (!raf) raf = requestAnimationFrame(pintar);
    };
    const mover = (e: PointerEvent) => {
      const d = Math.hypot(e.clientX - px, e.clientY - py);
      if (px >= 0 && d < 6) return;
      px = e.clientX;
      py = e.clientY;
      soltar(e.clientX, e.clientY, e.pointerType === "mouse" ? 1 : 2);
    };
    const tocar = (e: PointerEvent) => soltar(e.clientX, e.clientY, 10);
    // Al arrastrar para hacer scroll, el navegador cancela los pointer
    // events: el dedo se sigue con touchmove (pasivo, no frena el scroll).
    const arrastrar = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const d = Math.hypot(t.clientX - px, t.clientY - py);
      if (px >= 0 && d < 8) return;
      px = t.clientX;
      py = t.clientY;
      soltar(t.clientX, t.clientY, 2);
    };
    window.addEventListener("touchmove", arrastrar, { passive: true });
    window.addEventListener("pointermove", mover, { passive: true });
    window.addEventListener("pointerdown", tocar, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", medir);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("touchmove", arrastrar);
      window.removeEventListener("pointerdown", tocar);
    };
  }, []);

  return <canvas ref={ref} className="polvo-hadas" aria-hidden="true" />;
}
