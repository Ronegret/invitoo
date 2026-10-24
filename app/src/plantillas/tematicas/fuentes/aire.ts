import { Cormorant_Garamond, Italiana } from "next/font/google";

/**
 * AIRE (elegancia pura). Italiana (display, fina y alta) + Cormorant Garamond
 * (texto a 20 px, con su cursiva para los detalles). Sin precarga.
 */
export const aireDisplay = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const aireTexto = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--p-texto",
  style: ["normal", "italic"],
  // Variable (sin `weight`): con pesos sueltos Turbopack falla al resolver
  // Cormorant («next/font/google queries have exactly one entry»).
  display: "swap",
  preload: false,
});

export const fuentesAire = `${aireDisplay.variable} ${aireTexto.variable}`;
