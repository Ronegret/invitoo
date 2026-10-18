"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Un corte a sangre: una fotografía a pantalla completa con una frase encima.
 *
 * Es el recurso que separa una web de boda de una landing de producto. En
 * lugar de ir de bloque de texto en bloque de texto, cada tanto la página se
 * abre en una imagen grande, se respira, y se sigue.
 *
 * La foto se mueve más despacio que la página —parallax suave, un 18 %—, así
 * que da sensación de profundidad sin que nadie sepa por qué. En móvil el
 * parallax se apaga: ahí cuesta batería y no se aprecia.
 */
export default function Corte({
  foto,
  frase,
  pie,
  alto = "70svh",
}: {
  foto: string;
  frase: string;
  pie?: string;
  alto?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const quieto =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(min-width: 768px)").matches;

    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { rootMargin: "120px 0px", threshold: 0 },
    );
    if (caja.current) obs.observe(caja.current);
    const rescate = window.setTimeout(() => setVisible(true), 1200);

    if (quieto) {
      return () => {
        obs.disconnect();
        window.clearTimeout(rescate);
      };
    }

    let pedido = 0;
    const mover = () => {
      if (pedido) return;
      pedido = requestAnimationFrame(() => {
        pedido = 0;
        const n = caja.current;
        if (!n) return;
        const r = n.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        // -1 arriba del todo, +1 abajo del todo.
        const centro = (r.top + r.height / 2 - window.innerHeight / 2) /
          (window.innerHeight / 2 + r.height / 2);
        setY(centro * 9);
      });
    };
    mover();
    window.addEventListener("scroll", mover, { passive: true });
    return () => {
      obs.disconnect();
      window.clearTimeout(rescate);
      window.removeEventListener("scroll", mover);
      if (pedido) cancelAnimationFrame(pedido);
    };
  }, []);

  return (
    <section
      ref={caja}
      className="relative w-full overflow-hidden"
      style={{ height: alto }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
      <img
        src={foto}
        alt=""
        width={1700}
        height={1133}
        loading="lazy"
        decoding="async"
        className="absolute left-0 h-[118%] w-full object-cover"
        style={{ top: `${-9 + y}%`, transition: "top 120ms linear" }}
      />
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(12,10,9,.34) 0%, rgba(12,10,9,.18) 40%, rgba(12,10,9,.62) 100%)",
        }}
      />

      <div className="relative grid h-full place-items-center px-6 text-center">
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(20px)",
            transition: "opacity 1100ms ease 160ms, transform 1100ms cubic-bezier(.22,.7,.28,1) 160ms",
          }}
        >
          <p
            className="display mx-auto max-w-[22ch] text-[clamp(1.7rem,4.6vw,3rem)] leading-[1.28] text-white"
            style={{ textShadow: "0 1px 30px rgba(0,0,0,.5)" }}
          >
            {frase}
          </p>
          {pie && (
            <p className="mt-6 text-[0.76rem] uppercase tracking-[0.36em] text-white/70">
              {pie}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
