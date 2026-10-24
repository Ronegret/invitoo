"use client";

import { useEffect, useRef } from "react";
import { programaApertura, type ConfigApertura } from "./programa";

/**
 * La parte de la apertura que necesita React, que es poca:
 *
 *  · Si el script en línea no llegó a correr (se llegó aquí navegando desde
 *    otra página de la web, sin recarga), arranca el mismo programa.
 *  · Mientras la apertura está en pantalla, lo de detrás queda `inert`: ni
 *    el tabulador ni un lector de pantalla se cuelan en una portada que no
 *    se ve. Se hace aquí, ya hidratado, para no tocar atributos que React
 *    va a comparar al hidratar.
 *  · Al salir, el foco va al titular de la portada y no se pierde en
 *    `<body>`.
 */
export default function ArranqueApertura({ cfg }: { cfg: ConfigApertura }) {
  const ancla = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const raiz = ancla.current?.closest<HTMLElement>("[data-apertura]");
    if (!raiz) return;

    const hermanos = () =>
      Array.from(raiz.parentElement?.children ?? []).filter(
        (n): n is HTMLElement => n !== raiz && n instanceof HTMLElement && n.tagName !== "STYLE",
      );

    const bloquear = () => hermanos().forEach((n) => n.setAttribute("inert", ""));
    const soltar = (enfocar: boolean) => {
      hermanos().forEach((n) => n.removeAttribute("inert"));
      if (!enfocar) return;
      const titular = raiz.parentElement?.querySelector<HTMLElement>("h1");
      const perdido =
        !document.activeElement ||
        document.activeElement === document.body ||
        raiz.contains(document.activeElement);
      if (titular && perdido) {
        titular.setAttribute("tabindex", "-1");
        titular.focus({ preventScroll: true });
      }
    };

    const alCambiar = (e: Event) => {
      const estado = (e as CustomEvent<string>).detail;
      if (estado === "fuera") soltar(true);
      else if (estado === "dentro") bloquear();
    };
    window.addEventListener("invitoo:apertura", alCambiar);

    if (raiz.getAttribute("data-listo") !== "1") programaApertura(raiz, cfg);
    if (raiz.getAttribute("data-estado") === "dentro") bloquear();

    return () => {
      window.removeEventListener("invitoo:apertura", alCambiar);
      soltar(false);
    };
  }, [cfg]);

  return <span ref={ancla} hidden />;
}
