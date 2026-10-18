"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cierre de sesión por inactividad.
 *
 * El estudio enseña borradores, enlaces privados de los paneles de cada
 * pareja y la lista de quién viene a cada boda. Si Rodrigo se deja el
 * portátil abierto en una cafetería o en casa de un cliente, eso queda a la
 * vista. La cookie dura dos semanas a propósito —para no estar tecleando la
 * clave cada día—, así que el corte tiene que venir por aquí.
 *
 * Treinta minutos sin tocar nada y se sale. Dos minutos antes avisa, porque
 * echar a alguien de un formulario a medio rellenar sin decir nada es la
 * peor forma de proteger nada.
 *
 * Cualquier gesto reinicia la cuenta: ratón, teclado, dedo o scroll.
 */

const LIMITE = 30 * 60 * 1000;
const AVISO = 2 * 60 * 1000;

export default function Caducidad({ salir }: { salir: () => Promise<void> }) {
  const [quedan, setQuedan] = useState<number | null>(null);
  const ultimo = useRef(Date.now());

  useEffect(() => {
    const tocar = () => {
      ultimo.current = Date.now();
      setQuedan(null);
    };
    const eventos = ["pointerdown", "keydown", "scroll", "pointermove"] as const;
    for (const e of eventos) {
      window.addEventListener(e, tocar, { passive: true });
    }

    const reloj = window.setInterval(() => {
      const pasado = Date.now() - ultimo.current;
      if (pasado >= LIMITE) {
        void salir();
      } else if (pasado >= LIMITE - AVISO) {
        setQuedan(Math.ceil((LIMITE - pasado) / 1000));
      }
    }, 1000);

    return () => {
      for (const e of eventos) window.removeEventListener(e, tocar);
      window.clearInterval(reloj);
    };
  }, [salir]);

  if (quedan === null) return null;

  const min = Math.floor(quedan / 60);
  const seg = String(quedan % 60).padStart(2, "0");

  return (
    <div
      role="status"
      className="fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <p className="rounded-full border border-[var(--acento)]/40 bg-[var(--papel)] px-6 py-3.5 text-[0.85rem] shadow-[0_18px_40px_-20px_rgba(0,0,0,.4)]">
        Se cierra la sesión en{" "}
        <strong className="font-normal text-[var(--acento)]">
          {min}:{seg}
        </strong>
        . Mueve el ratón para seguir.
      </p>
    </div>
  );
}
