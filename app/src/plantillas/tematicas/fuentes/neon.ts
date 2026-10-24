import { Plus_Jakarta_Sans, Sacramento, Unbounded } from "next/font/google";

/**
 * NEÓN DE MEDIANOCHE (reggaeton y fiesta).
 *  · Unbounded (display, 500/700): geométrica y ancha.
 *  · Plus Jakarta Sans (texto, 18 px).
 *  · Sacramento (`--p-acento`): un trazo único que ES un tubo de neón. Solo nombres.
 */
export const neonDisplay = Unbounded({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const neonTexto = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const neonAcento = Sacramento({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-acento",
  display: "swap",
  preload: false,
});

export const fuentesNeon = `${neonDisplay.variable} ${neonTexto.variable} ${neonAcento.variable}`;
