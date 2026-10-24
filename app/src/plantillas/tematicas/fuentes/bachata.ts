import { Allura, Gilda_Display, Mulish } from "next/font/google";

/**
 * LUNA DE BACHATA.
 *  · Gilda Display (display): romana fina e íntima.
 *  · Mulish (texto, 18 px).
 *  · Allura (`--p-acento`): caligrafía para los nombres y la «y», a ≥ 3 rem.
 */
export const bachataDisplay = Gilda_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const bachataTexto = Mulish({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const bachataAcento = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-acento",
  display: "swap",
  preload: false,
});

export const fuentesBachata = `${bachataDisplay.variable} ${bachataTexto.variable} ${bachataAcento.variable}`;
