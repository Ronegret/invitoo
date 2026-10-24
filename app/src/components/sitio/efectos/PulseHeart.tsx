"use client";

import { useEffect, useRef } from "react";
import s from "./efectos.module.css";

/**
 * PulseHeart: un corazón que late dos veces, como un pulso, al entrar en
 * pantalla y cada vez que se pasa el ratón o el dedo por su tarjeta
 * (el ancestro más cercano con `data-latir`). Nunca en bucle: un latido
 * que no para deja de significar algo. Con movimiento reducido no late.
 */
export default function PulseHeart({ size = 22, className = "" }: { size?: number; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const latir = () => {
      el.removeAttribute("data-late");
      void el.getBoundingClientRect();
      el.setAttribute("data-late", "");
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          latir();
          io.disconnect();
        }
      },
      { threshold: 1 },
    );
    io.observe(el);
    const padre = el.closest("[data-latir]");
    padre?.addEventListener("pointerenter", latir);
    return () => {
      io.disconnect();
      padre?.removeEventListener("pointerenter", latir);
    };
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className={`${s.corazon} ${className}`}
    >
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.3 4.5 6.9 4.5c2.2 0 3.6 1.2 5.1 3 1.5-1.8 2.9-3 5.1-3 3.6 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
    </svg>
  );
}
