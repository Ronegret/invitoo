import { Big_Shoulders, Instrument_Serif, Space_Grotesk } from "next/font/google";

/**
 * PASE VIP (festival). Sin precarga: solo se descargan en las bodas que la pintan.
 *  · Big Shoulders (display, 800–900, óptica de cartel): la letra del line-up.
 *  · Space Grotesk (texto, 18 px).
 *  · Instrument Serif en cursiva (`--p-acento`): la «y», los nombres del pase.
 */
export const festivalDisplay = Big_Shoulders({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--p-display",
  display: "swap",
  preload: false,
  // Next no tiene métricas de Big Shoulders para el fallback ajustado; el
  // respaldo es una sans estrecha del sistema (ver GENERICA en tokens.ts).
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "Roboto Condensed", "Helvetica Neue", "Arial", "sans-serif"],
});
export const festivalTexto = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const festivalAcento = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--p-acento",
  display: "swap",
  preload: false,
});

export const fuentesFestival = `${festivalDisplay.variable} ${festivalTexto.variable} ${festivalAcento.variable}`;
