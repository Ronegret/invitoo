import { Cinzel_Decorative, Crimson_Pro, UnifrakturCook } from "next/font/google";

/**
 * BLASÓN (K2). Sin precarga: solo se descargan en las bodas que la pintan.
 *  · Cinzel Decorative: los nombres y los titulares grandes (capitales de lápida).
 *  · Crimson Pro a 19 px: el texto (ojo pequeño, sube un punto).
 *  · UnifrakturCook SOLO en capitulares y en el «Anno Domini», siempre
 *    `aria-hidden` y con el texto real al lado (`--p-gotica`).
 */
export const blasonDisplay = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const blasonTexto = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const blasonGotica = UnifrakturCook({
  subsets: ["latin"],
  weight: "700",
  variable: "--p-gotica",
  display: "swap",
  preload: false,
});

export const fuentesBlason = `${blasonDisplay.variable} ${blasonTexto.variable} ${blasonGotica.variable}`;
