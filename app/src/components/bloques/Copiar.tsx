"use client";

import { useEffect, useRef, useState } from "react";

/**
 * «Copiar», para lo que se pega en otro sitio: la dirección en el GPS, el
 * IBAN en la app del banco. Avisa con texto (no solo con un icono) y el aviso
 * lo lee también el lector de pantalla.
 *
 * El texto que se copia está SIEMPRE además escrito en la página y es
 * seleccionable: sin JavaScript, o si el navegador no deja copiar, se puede
 * hacer a mano.
 */
export default function Copiar({
  texto,
  que = "",
  className = "",
}: {
  texto: string;
  /** Qué se copia, para el aviso: «la dirección», «el IBAN». */
  que?: string;
  className?: string;
}) {
  const [estado, setEstado] = useState<"" | "ok" | "error">("");
  const reloj = useRef(0);
  useEffect(() => () => window.clearTimeout(reloj.current), []);

  async function copiar() {
    let bien = false;
    try {
      await navigator.clipboard.writeText(texto);
      bien = true;
    } catch {
      // WebViews antiguos (el de WhatsApp entre ellos) sin API de portapapeles.
      try {
        const t = document.createElement("textarea");
        t.value = texto;
        t.setAttribute("readonly", "");
        t.style.position = "fixed";
        t.style.opacity = "0";
        document.body.appendChild(t);
        t.select();
        bien = document.execCommand("copy");
        t.remove();
      } catch {
        bien = false;
      }
    }
    setEstado(bien ? "ok" : "error");
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setEstado(""), 2600);
  }

  return (
    <>
      <button
        type="button"
        onClick={copiar}
        className={`copiar inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-current/30 px-6 text-[1rem] transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))] ${className}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          {estado === "ok" ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
              <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
            </>
          )}
        </svg>
        {estado === "ok" ? "Copiado" : "Copiar"}
      </button>
      <span role="status" className="sr-only">
        {estado === "ok"
          ? `Copiado${que ? ` ${que}` : ""}.`
          : estado === "error"
            ? "No se ha podido copiar. Mantén el dedo sobre el texto para seleccionarlo."
            : ""}
      </span>
      <style>{`
        .copiar:active { scale: .97; }
        @media (hover: hover) and (pointer: fine) { .copiar:hover { border-color: color-mix(in srgb, currentColor 60%, transparent); } }
      `}</style>
    </>
  );
}
