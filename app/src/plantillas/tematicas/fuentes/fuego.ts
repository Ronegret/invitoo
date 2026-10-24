import { Mr_Dafoe, Work_Sans, Yeseva_One } from "next/font/google";

/**
 * SON DE FUEGO (salsa).
 *  · Yeseva One (display): didona de cartel de club de los 50.
 *  · Work Sans (texto, 18 px).
 *  · Mr Dafoe (`--p-acento`): pincel con movimiento, para la «y» y dedicatorias cortas.
 */
export const fuegoDisplay = Yeseva_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const fuegoTexto = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const fuegoAcento = Mr_Dafoe({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-acento",
  display: "swap",
  preload: false,
});

export const fuentesFuego = `${fuegoDisplay.variable} ${fuegoTexto.variable} ${fuegoAcento.variable}`;
