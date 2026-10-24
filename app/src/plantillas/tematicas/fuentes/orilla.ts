import { Allura, Bellefair, Nunito_Sans } from "next/font/google";

/**
 * ORILLA (K2). Sin precarga.
 *  · Bellefair: una romana alta y fluida para nombres y titulares.
 *  · Nunito Sans a 18 px: redondeada y suave, se lee en la playa.
 *  · Allura (`--p-mano`) a partir de 32 px: la firma en la arena.
 */
export const orillaDisplay = Bellefair({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const orillaTexto = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const orillaMano = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-mano",
  display: "swap",
  preload: false,
});

export const fuentesOrilla = `${orillaDisplay.variable} ${orillaTexto.variable} ${orillaMano.variable}`;
