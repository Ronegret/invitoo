import { Cinzel_Decorative, IM_Fell_English, Lora } from "next/font/google";

/**
 * CUENTO DE HADAS. Cinzel Decorative (titulares de libro antiguo) +
 * IM Fell English en cursiva para los nombres y las capitulares
 * (`--p-fell`) + Lora para el texto (19 px, se lee en la oscuridad).
 */
export const cuentoDisplay = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const cuentoFell = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--p-fell",
  display: "swap",
  preload: false,
});
export const cuentoTexto = Lora({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});

export const fuentesCuento = `${cuentoDisplay.variable} ${cuentoFell.variable} ${cuentoTexto.variable}`;
