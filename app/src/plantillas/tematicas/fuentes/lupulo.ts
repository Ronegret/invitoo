import { IM_Fell_English_SC, Libre_Franklin, Zilla_Slab } from "next/font/google";

/**
 * LÚPULO Y COBRE (K5). Sin precarga: solo se descargan en las bodas que la pintan.
 *  · Zilla Slab (display, 600 y 700): egipcia de tipos de madera, industrial,
 *    como la etiqueta impresa en una nave de ladrillo. (Young Serif ya es de Pinar.)
 *  · Libre Franklin (texto, 18 px), en 400 y 600.
 *  · IM Fell English SC (`--p-acento`): versalitas de imprenta, solo rótulos cortos.
 */
export const lupuloDisplay = Zilla_Slab({ subsets: ["latin"], weight: ["600", "700"], variable: "--p-display", display: "swap", preload: false });
export const lupuloTexto = Libre_Franklin({ subsets: ["latin"], weight: ["400", "600"], variable: "--p-texto", display: "swap", preload: false });
export const lupuloAcento = IM_Fell_English_SC({ subsets: ["latin"], weight: "400", variable: "--p-acento", display: "swap", preload: false });

export const fuentesLupulo = `${lupuloDisplay.variable} ${lupuloTexto.variable} ${lupuloAcento.variable}`;
