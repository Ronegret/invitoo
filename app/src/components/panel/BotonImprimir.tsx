"use client";

import { ui } from "./estilos";
import IconoPanel from "./IconosPanel";

/** «Imprimir» (o «Guardar como PDF» desde el mismo diálogo del navegador). */
export default function BotonImprimir({ children = "Imprimir" }: { children?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={ui.botonLleno}>
      <IconoPanel id="imprimir" size={20} />
      {children}
    </button>
  );
}
