import { Instrument_Sans } from "next/font/google";
import { azulejoDisplay } from "./azulejo";

/**
 * Las fuentes de Carta. Sin precarga.
 *
 * La display es Cormorant Garamond, la misma familia que lleva Azulejo:
 * se reutiliza la misma instancia de next/font (un solo archivo variable con
 * su cursiva), no se descarga dos veces. Lo que separa a las dos plantillas
 * es el papel, el texto y el uso: Azulejo la pone en redonda y con DM Sans;
 * Carta, en cursiva, con oro y con Instrument Sans a 18 px.
 */
export const cartaDisplay = azulejoDisplay;

export const cartaTexto = Instrument_Sans({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
