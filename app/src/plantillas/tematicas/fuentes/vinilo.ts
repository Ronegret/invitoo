import { DM_Serif_Display, Karla, UnifrakturCook } from "next/font/google";

/**
 * CARA A (rock & roll).
 *  · DM Serif Display (display, normal y cursiva): portada de disco de los 70.
 *  · Karla (texto, 18 px; 400 y 500).
 *  · UnifrakturCook (`--p-acento`) SOLO para el monograma de la galleta.
 */
export const viniloDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
// Misma configuración EXACTA que la Karla de Bosque Encantado (K3): dos
// configuraciones distintas de una misma familia con la misma variable dan
// el mismo módulo en Turbopack y rompen la compilación.
export const viniloTexto = Karla({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const viniloAcento = UnifrakturCook({
  subsets: ["latin"],
  weight: "700",
  variable: "--p-acento",
  display: "swap",
  preload: false,
});

export const fuentesVinilo = `${viniloDisplay.variable} ${viniloTexto.variable} ${viniloAcento.variable}`;
