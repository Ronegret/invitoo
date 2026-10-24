import { Courier_Prime, Homemade_Apple, Libre_Caslon_Display } from "next/font/google";

/**
 * MEMORIAS (K2). Sin precarga.
 *  · Libre Caslon Display: los nombres y los titulares.
 *  · Courier Prime a 18 px con interlineado 1,75: la máquina de escribir
 *    hecha para leer en pantalla. Da el carácter.
 *  · Homemade Apple (`--p-mano`) solo en frases cortas de 24 px o más y
 *    nunca con información: la hora o la dirección van en Courier.
 */
export const memoriasDisplay = Libre_Caslon_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const memoriasTexto = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const memoriasMano = Homemade_Apple({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-mano",
  display: "swap",
  preload: false,
});

export const fuentesMemorias = `${memoriasDisplay.variable} ${memoriasTexto.variable} ${memoriasMano.variable}`;
