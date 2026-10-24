"use client";

import { useState, useTransition, type ReactNode } from "react";
import { marcarEnvioAccion } from "@/app/panel/acciones";
import IconoPanel from "./IconosPanel";
import { ui } from "./estilos";

/**
 * Abre WhatsApp con el mensaje escrito y, de paso, apunta que se ha mandado
 * (para el aviso de «lleva una semana sin contestar»). El apunte no bloquea:
 * WhatsApp se abre al instante aunque el servidor tarde.
 */
export default function BotonWhatsApp({
  slug,
  ids,
  href,
  tipo,
  children,
  lleno = false,
  onEnviado,
}: {
  slug: string;
  ids: string[];
  href: string;
  tipo: "enviado" | "recordado";
  children: ReactNode;
  lleno?: boolean;
  onEnviado?: () => void;
}) {
  const [, empezar] = useTransition();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => {
        empezar(async () => {
          await marcarEnvioAccion(slug, ids, tipo);
        });
        onEnviado?.();
      }}
      className={lleno ? ui.botonLleno : ui.boton}
    >
      <IconoPanel id="whatsapp" size={20} />
      {children}
      <span className="sr-only"> (abre WhatsApp)</span>
    </a>
  );
}

/** Copiar al portapapeles con confirmación visible y anunciada. */
export function BotonCopiar({ texto, children = "Copiar" }: { texto: string; children?: ReactNode }) {
  const [hecho, setHecho] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setHecho(true);
          window.setTimeout(() => setHecho(false), 2200);
        } catch {
          window.prompt("Copiad el texto:", texto);
        }
      }}
      className={ui.boton}
    >
      <IconoPanel id={hecho ? "check" : "copiar"} size={20} />
      <span aria-live="polite">{hecho ? "Copiado" : children}</span>
    </button>
  );
}
