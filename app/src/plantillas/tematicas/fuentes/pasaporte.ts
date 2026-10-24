import { Caveat, DM_Serif_Display, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

/**
 * PASAPORTE (K2). Sin precarga.
 *  · DM Serif Display (y su cursiva): nombres y titulares.
 *  · IBM Plex Sans a 18 px: el texto y todos los datos de verdad.
 *  · IBM Plex Mono (`--p-mono`): la línea MRZ y los sellos, decorativa.
 *  · Caveat (`--p-mano`): notas en el mapa, a partir de 24 px.
 */
export const pasaporteDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const pasaporteTexto = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const pasaporteMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--p-mono",
  display: "swap",
  preload: false,
});
export const pasaporteMano = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--p-mano",
  display: "swap",
  preload: false,
});

export const fuentesPasaporte = `${pasaporteDisplay.variable} ${pasaporteTexto.variable} ${pasaporteMono.variable} ${pasaporteMano.variable}`;
