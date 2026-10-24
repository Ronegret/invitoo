"use client";

import { useEffect, useRef } from "react";
import {
  aplicarPaleta,
  decodificarPaleta,
  prepararFundido,
  resolverPaleta,
  TODAS_LAS_VARIABLES,
  type MensajeColor,
  type Modo,
} from "@/lib/color";

/**
 * El lado de la invitación del color en vivo. Lo monta F2 dentro del
 * `.lienzo` (junto a `VarianteCliente`):
 *
 *   <EscuchaColor />
 *
 * Qué hace, todo en el navegador (la invitación sigue siendo estática):
 *  · `?pal=papel-tinta-acento` (hex sin #): pinta esa paleta. Sirve para
 *    compartir una demo «con nuestros colores».
 *  · con `?vista=1` escucha `postMessage` del probador (`ProbadorColor`):
 *      { tipo: "invitoo:color", paleta }    → la aplica con fundido de 600 ms
 *      { tipo: "invitoo:color-original" }   → vuelve a los colores del servidor
 *    y responde { tipo: "invitoo:color-listo" } al padre cuando escucha.
 *
 * Nunca se fía de lo que llega: cada paleta vuelve a pasar por
 * `resolverPaleta`, en el modo del lienzo (`data-modo`), así que lo que se
 * pinta cumple AA aunque el mensaje venga manipulado. Solo acepta mensajes
 * del mismo origen.
 *
 * Escribe las variables en el lienzo (su padre) y en el `<main>`, igual
 * que `VarianteCliente`.
 */
export default function EscuchaColor() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const raiz = ref.current?.parentElement;
    if (!raiz) return;
    const destinos = [raiz, raiz.closest("main")].filter(
      (x, i, a): x is HTMLElement => !!x && a.indexOf(x) === i,
    );
    const modo: Modo = (raiz.closest("[data-modo]") as HTMLElement | null)?.dataset.modo === "oscuro" ? "oscuro" : "claro";

    // Lo del servidor, para «volver al original».
    const originales = destinos.map((n) =>
      TODAS_LAS_VARIABLES.map((v) => [v, n.style.getPropertyValue(v)] as const),
    );
    const restaurar = () => {
      destinos.forEach((n, i) => {
        for (const [v, valor] of originales[i]) {
          if (valor) n.style.setProperty(v, valor);
          else n.style.removeProperty(v);
        }
        delete n.dataset.colorPaleta;
      });
    };

    let params: URLSearchParams;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return;
    }

    const pedida = decodificarPaleta(params.get("pal"));
    if (pedida) aplicarPaleta(destinos, resolverPaleta(pedida, modo));

    if (params.get("vista") !== "1") return;
    prepararFundido(document);

    const alMensaje = (e: MessageEvent<MensajeColor>) => {
      if (e.origin !== window.location.origin || !e.data || typeof e.data !== "object") return;
      if (e.data.tipo === "invitoo:color") {
        const p = e.data.paleta;
        if (!p || typeof p.papel !== "string" || typeof p.tinta !== "string" || typeof p.acento !== "string") return;
        aplicarPaleta(destinos, resolverPaleta(p, modo));
      } else if (e.data.tipo === "invitoo:color-original") {
        restaurar();
      }
    };
    window.addEventListener("message", alMensaje);
    (window as Window & { __invitooColor?: boolean }).__invitooColor = true;
    try {
      window.parent?.postMessage({ tipo: "invitoo:color-listo" } satisfies MensajeColor, window.location.origin);
    } catch {
      /* noop */
    }
    return () => window.removeEventListener("message", alMensaje);
  }, []);

  return <span ref={ref} hidden />;
}
