import { Cormorant, EB_Garamond, Pinyon_Script } from "next/font/google";

/**
 * ALTA SOCIEDAD. Sin precarga: solo se descargan en las bodas que la pintan.
 *  · Cormorant (titulares, en cursiva): la serif clásica de la Regencia.
 *  · EB Garamond (texto, 19 px): legible de verdad.
 *  · Pinyon Script SOLO para los nombres de la pareja (`--p-script`).
 */
export const regenciaDisplay = Cormorant({
  subsets: ["latin"],
  variable: "--p-display",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});
export const regenciaTexto = EB_Garamond({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const regenciaScript = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-script",
  display: "swap",
  preload: false,
});

export const fuentesRegencia = `${regenciaDisplay.variable} ${regenciaTexto.variable} ${regenciaScript.variable}`;
