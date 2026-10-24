"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { programaMovimiento } from "@/components/movimiento/programa";

/**
 * Arranca el revelado (`[data-revelar]`) en la web comercial.
 *
 * Es el mismo guion de las invitaciones, sobre el `<main>` de la web. Como
 * el layout no se desmonta al pasar de una página a otra, se vuelve a
 * arrancar en cada cambio de ruta para las piezas nuevas. Lo que ya está en
 * pantalla nunca se esconde, y sin JavaScript no hay nada que esconder.
 */
export default function RevelarSitio() {
  const ref = useRef<HTMLSpanElement>(null);
  const ruta = usePathname();

  // Antes del pintado: las piezas nuevas no llegan a verse y desaparecer.
  useLayoutEffect(() => {
    const raiz = ref.current?.closest("main");
    if (!raiz) return;
    raiz.removeAttribute("data-mov-listo");
    programaMovimiento(raiz);
  }, [ruta]);

  return <span ref={ref} hidden />;
}
