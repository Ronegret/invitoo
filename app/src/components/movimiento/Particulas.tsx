"use client";

import { useEffect, useRef } from "react";
import type { Movimiento } from "@/lib/tipos";

/**
 * Pétalos, destellos o polvo de oro. Muy pocos y muy tenues: si alguien
 * repara en ellos al primer vistazo, están mal calibrados.
 *
 *  · Un solo canvas fijo, DETRÁS del texto (z-index -1 dentro del lienzo,
 *    que es `isolate`): nunca tapan una letra, y cualquier sección con
 *    fondo propio los cubre.
 *  · Se reparten sobre todo por los márgenes, no por la columna de texto.
 *  · Se para cuando la invitación no está en pantalla, cuando la pestaña
 *    está oculta, con `prefers-reduced-motion` y con «ahorro de datos».
 *  · DPR máximo 1,5 y menos de 40 partículas: < 0,3 ms por fotograma en un
 *    móvil medio. Este archivo se carga aparte, solo si la boda los pide.
 */

type Tipo = Exclude<Movimiento["particulas"], "ninguna">;

type P = { x: number; y: number; v: number; a: number; f: number; t: number; s: number; g: number };

const CUANTAS: Record<Tipo, number> = { petalos: 14, destellos: 22, "polvo-de-oro": 36 };

export default function Particulas({ tipo }: { tipo: Tipo }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = ref.current;
    const raiz = lienzo?.closest<HTMLElement>(".lienzo");
    if (!lienzo || !raiz) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    const red = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (quieto.matches || red?.saveData) return;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return;

    const css = getComputedStyle(raiz);
    const acento = css.getPropertyValue("--acento").trim() || "#8c1d2c";
    const tinta = css.getPropertyValue("--tinta").trim() || "#1a1512";
    const oscuro = raiz.getAttribute("data-modo") === "oscuro";
    const oro = oscuro ? "#e2c58a" : "#b08d57";
    const color = tipo === "petalos" ? acento : tipo === "destellos" ? (oscuro ? tinta : acento) : oro;

    let ancho = 0;
    let alto = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const medir = () => {
      ancho = window.innerWidth;
      alto = window.innerHeight;
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      lienzo.style.width = `${ancho}px`;
      lienzo.style.height = `${alto}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    medir();

    // Más en los márgenes que en el centro: el texto va en la columna.
    const xMargen = () => {
      const u = Math.random();
      if (u < 0.7) {
        const lado = Math.random() < 0.5 ? 0 : 0.75;
        return (lado + Math.random() * 0.25) * ancho;
      }
      return Math.random() * ancho;
    };
    const nueva = (y?: number): P => ({
      x: xMargen(),
      y: y ?? Math.random() * alto,
      v: tipo === "petalos" ? 12 + Math.random() * 14 : tipo === "polvo-de-oro" ? 4 + Math.random() * 7 : 1.5 + Math.random() * 2,
      a: tipo === "petalos" ? 0.14 + Math.random() * 0.16 : tipo === "polvo-de-oro" ? 0.22 + Math.random() * 0.35 : 0.35 + Math.random() * 0.3,
      f: Math.random() * Math.PI * 2,
      t: Math.random() * Math.PI * 2,
      s: tipo === "petalos" ? 4.5 + Math.random() * 3.5 : tipo === "polvo-de-oro" ? 0.6 + Math.random() * 1.1 : 1.8 + Math.random() * 2.6,
      g: 0.4 + Math.random() * 0.8,
    });
    const n = Math.round(CUANTAS[tipo] * (ancho < 600 ? 0.7 : 1));
    const ps: P[] = Array.from({ length: n }, () => nueva());

    const estrella = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
    };

    let anterior = 0;
    let raf = 0;
    let visible = false;
    const paso = (ahora: number) => {
      const dt = Math.min(0.05, anterior ? (ahora - anterior) / 1000 : 0.016);
      anterior = ahora;
      ctx.clearRect(0, 0, ancho, alto);
      ctx.fillStyle = color;
      for (const p of ps) {
        p.f += dt * p.g;
        if (tipo === "petalos") {
          p.y += p.v * dt;
          p.x += Math.sin(p.f) * 14 * dt;
          p.t += dt * 0.6 * p.g;
          if (p.y > alto + 12) Object.assign(p, nueva(-12));
          ctx.globalAlpha = p.a;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.t);
          ctx.scale(1, 0.45 + 0.25 * Math.sin(p.f * 1.3));
          ctx.beginPath();
          ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (tipo === "polvo-de-oro") {
          p.y -= p.v * dt;
          p.x += Math.sin(p.f) * 4 * dt;
          if (p.y < -6) Object.assign(p, nueva(alto + 6));
          ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.f * 2));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
          ctx.fill();
        } else {
          p.y -= p.v * dt;
          if (p.y < -6) Object.assign(p, nueva(alto + 6));
          // Casi siempre apagados; de vez en cuando, un destello.
          const brillo = Math.pow(0.5 + 0.5 * Math.sin(p.f), 4);
          ctx.globalAlpha = p.a * brillo;
          estrella(p.x, p.y, p.s * (0.6 + 0.4 * brillo));
        }
      }
      ctx.globalAlpha = 1;
      raf = window.requestAnimationFrame(paso);
    };

    const arrancar = () => {
      if (raf || !visible || document.hidden || quieto.matches) return;
      anterior = 0;
      raf = window.requestAnimationFrame(paso);
    };
    const parar = () => {
      window.cancelAnimationFrame(raf);
      raf = 0;
    };

    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) arrancar();
      else parar();
    });
    obs.observe(raiz);
    const alCambiarVisibilidad = () => (document.hidden ? parar() : arrancar());
    const alCambiarQuieto = () => {
      if (quieto.matches) {
        parar();
        ctx.clearRect(0, 0, ancho, alto);
      } else arrancar();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    quieto.addEventListener("change", alCambiarQuieto);
    window.addEventListener("resize", medir, { passive: true });

    return () => {
      parar();
      obs.disconnect();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      quieto.removeEventListener("change", alCambiarQuieto);
      window.removeEventListener("resize", medir);
    };
  }, [tipo]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="particulas pointer-events-none fixed left-0 top-0 -z-10"
    />
  );
}
