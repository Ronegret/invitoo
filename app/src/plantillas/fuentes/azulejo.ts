import { Cormorant_Garamond, DM_Sans } from "next/font/google";

/** Las fuentes de Azulejo: las usan la plantilla y su apertura. Sin precarga. */
// Variable (sin `weight`): con pesos sueltos ["500","600"], Turbopack 16.3
// falla al resolver los archivos de Google Fonts («next/font/google queries
// have exactly one entry»). Un solo archivo variable cubre el 500 y el 600.
export const azulejoDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});

export const azulejoTexto = DM_Sans({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
