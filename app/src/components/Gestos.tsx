"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Los tres gestos de la web.
 *
 * Todos comparten la misma regla: son de ratón y de adorno, así que en
 * táctil y con `prefers-reduced-motion` no existen —no se degradan, no
 * existen— y la página funciona exactamente igual sin ellos.
 */

function quietos() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function hayRaton() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
}

/* ─────────────────────────────────────────────────── chispa al hacer clic */

/**
 * Cada clic deja un destello de líneas finas que se abren y se apagan.
 *
 * Va en un solo canvas a pantalla completa y no en un elemento por clic:
 * así no se toca el DOM, no hay reflow y da igual cuántas veces se pulse.
 * El canvas solo se anima mientras hay chispas vivas; el resto del tiempo
 * el bucle está parado y no gasta nada.
 */
export function ChispaClic({
  color = "var(--acento)",
  radio = 26,
  lineas = 9,
}: {
  color?: string;
  radio?: number;
  lineas?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (quietos() || !hayRaton()) return;
    const lienzo = ref.current;
    if (!lienzo) return;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const medir = () => {
      lienzo.width = window.innerWidth * dpr;
      lienzo.height = window.innerHeight * dpr;
      lienzo.style.width = `${window.innerWidth}px`;
      lienzo.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    medir();
    window.addEventListener("resize", medir);

    // El color viene como variable CSS: se resuelve una vez a un valor real.
    const tinta =
      color.startsWith("var(")
        ? getComputedStyle(document.documentElement)
            .getPropertyValue(color.slice(4, -1))
            .trim() || "#8c1d2c"
        : color;

    type Chispa = { x: number; y: number; t: number };
    const vivas: Chispa[] = [];
    let animando = false;
    const DURACION = 520;

    function pintar(ahora: number) {
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = vivas.length - 1; i >= 0; i--) {
        const c = vivas[i];
        const p = (ahora - c.t) / DURACION;
        if (p >= 1) {
          vivas.splice(i, 1);
          continue;
        }
        // Salida rápida y frenada al final: se siente como un chasquido.
        const e = 1 - Math.pow(1 - p, 3);
        ctx!.globalAlpha = 1 - p;
        ctx!.strokeStyle = tinta;
        ctx!.lineWidth = 1.4;
        ctx!.lineCap = "round";
        for (let l = 0; l < lineas; l++) {
          const a = (l / lineas) * Math.PI * 2;
          const d0 = radio * e;
          const d1 = d0 + 10 * (1 - p);
          ctx!.beginPath();
          ctx!.moveTo(c.x + Math.cos(a) * d0, c.y + Math.sin(a) * d0);
          ctx!.lineTo(c.x + Math.cos(a) * d1, c.y + Math.sin(a) * d1);
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = 1;
      if (vivas.length) {
        requestAnimationFrame(pintar);
      } else {
        animando = false;
      }
    }

    const alPulsar = (e: PointerEvent) => {
      vivas.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (!animando) {
        animando = true;
        requestAnimationFrame(pintar);
      }
    };
    window.addEventListener("pointerdown", alPulsar);

    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("pointerdown", alPulsar);
    };
  }, [color, radio, lineas]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
    />
  );
}

/* ────────────────────────────────────────────────────────── botón imantado */

/**
 * El elemento se deja atraer por el cursor cuando se acerca. Es el gesto que
 * hace que un botón parezca que te está esperando.
 *
 * `fuerza` es cuánto se desplaza como máximo, en píxeles; `alcance`, a qué
 * distancia empieza a notarse.
 */
export function Iman({
  children,
  fuerza = 12,
  alcance = 90,
  className,
}: {
  children: React.ReactNode;
  fuerza?: number;
  alcance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [d, setD] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (quietos() || !hayRaton()) return;
    const nodo = ref.current;
    if (!nodo) return;

    const mover = (e: PointerEvent) => {
      const r = nodo.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const limite = Math.max(r.width, r.height) / 2 + alcance;
      if (dist > limite) {
        setD((v) => (v.x === 0 && v.y === 0 ? v : { x: 0, y: 0 }));
        return;
      }
      const k = (1 - dist / limite) * fuerza;
      setD({ x: (dx / (dist || 1)) * k, y: (dy / (dist || 1)) * k });
    };

    window.addEventListener("pointermove", mover);
    return () => window.removeEventListener("pointermove", mover);
  }, [fuerza, alcance]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-block",
        transform: `translate3d(${d.x}px, ${d.y}px, 0)`,
        transition: "transform 380ms cubic-bezier(.22,.7,.28,1)",
      }}
    >
      {children}
    </span>
  );
}

/* ───────────────────────────────────────────────────────────── volumen 3D */

/**
 * Inclina el contenido siguiendo al cursor, con un brillo que se mueve con
 * él. Es lo que hace que el móvil de la galería parezca un objeto y no una
 * imagen pegada.
 *
 * El giro es pequeño a propósito —10 grados— porque de lo que se trata es
 * de sugerir volumen, no de marear.
 */
export function Volumen({
  children,
  grados = 10,
  className,
}: {
  children: React.ReactNode;
  grados?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, bx: 50, by: 50, dentro: false });

  if (typeof window !== "undefined" && (quietos() || !hayRaton())) {
    return <div className={className}>{children}</div>;
  }

  function mover(e: React.PointerEvent) {
    const nodo = ref.current;
    if (!nodo) return;
    const r = nodo.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({
      rx: (0.5 - py) * grados * 2,
      ry: (px - 0.5) * grados * 2,
      bx: px * 100,
      by: py * 100,
      dentro: true,
    });
  }

  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={mover}
      onPointerLeave={() => setT((v) => ({ ...v, rx: 0, ry: 0, dentro: false }))}
      style={{ perspective: "900px" }}
    >
      <div
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg) scale(${t.dentro ? 1.035 : 1})`,
          transition: t.dentro
            ? "transform 140ms ease-out"
            : "transform 700ms cubic-bezier(.22,.7,.28,1)",
        }}
      >
        {children}
        {/* El brillo va detrás del contenido en Z para no tapar los botones. */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: t.dentro ? 0.45 : 0,
            transition: "opacity 420ms ease",
            background: `radial-gradient(38% 38% at ${t.bx}% ${t.by}%, rgba(255,255,255,.55), transparent 70%)`,
            mixBlendMode: "soft-light",
          }}
        />
      </div>
    </div>
  );
}
