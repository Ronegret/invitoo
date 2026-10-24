import { Archivo, Lexend, Yellowtail } from "next/font/google";

/**
 * BRAZADA (`brazada`, K3). Sin precarga.
 *  · Archivo variable con eje de anchura (titulares expandidos y en cursiva:
 *    salida de bloque; el marcador, condensado).
 *  · Lexend (texto, 18 px): pensada para leer sin esfuerzo.
 *  · Yellowtail (`--p-script`), solo a 32 px o más.
 */
export const brazadaDisplay = Archivo({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["wdth"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const brazadaTexto = Lexend({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const brazadaScript = Yellowtail({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-script",
  display: "swap",
  preload: false,
});

export const fuentesBrazada = `${brazadaDisplay.variable} ${brazadaTexto.variable} ${brazadaScript.variable}`;
