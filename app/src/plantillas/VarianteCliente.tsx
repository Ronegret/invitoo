"use client";

import { useEffect, useRef } from "react";

/**
 * Aplica la variante de color pedida con `?c=` en el navegador.
 *
 * La invitación es estática (una sola versión en caché por boda), así que
 * la variante no puede decidirse en el servidor. Las variables de las tres
 * variantes llegan ya calculadas —con su `--acento-texto` AA— y aquí solo
 * se copian al contenedor. Sin JavaScript se ve la variante por defecto,
 * que es igual de legible.
 *
 * También se aplican al <main> de la página, para que la apertura y la
 * firma del pie lleven los mismos colores.
 */
export default function VarianteCliente({
  variantes,
  inicial,
}: {
  variantes: Record<string, Record<string, string | number>>;
  inicial?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let pedida: string | null = null;
    try {
      pedida = new URLSearchParams(window.location.search).get("c");
    } catch {
      return;
    }
    if (!pedida || pedida === inicial || !variantes[pedida]) return;
    const lienzo = ref.current?.parentElement;
    const destinos = [lienzo, lienzo?.closest("main")].filter(Boolean) as HTMLElement[];
    for (const nodo of destinos) {
      for (const [k, v] of Object.entries(variantes[pedida])) {
        nodo.style.setProperty(k, String(v));
      }
    }
  }, [variantes, inicial]);

  return <span ref={ref} hidden />;
}
