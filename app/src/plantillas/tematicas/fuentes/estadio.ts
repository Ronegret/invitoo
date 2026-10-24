import { Barlow, Barlow_Condensed, Libre_Caslon_Text } from "next/font/google";

/**
 * NOCHE DE ESTADIO (K5). Sin precarga.
 *  · Barlow Condensed (display, 600 y 800): la letra de marcador y de programa.
 *  · Barlow (texto, 18 px), en 400 y 500.
 *  · Libre Caslon Text en cursiva (`--p-acento`): los nombres y la «y», el toque de gala.
 */
export const estadioDisplay = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "800"], variable: "--p-display", display: "swap", preload: false });
export const estadioTexto = Barlow({ subsets: ["latin"], weight: ["400", "500"], variable: "--p-texto", display: "swap", preload: false });
export const estadioAcento = Libre_Caslon_Text({ subsets: ["latin"], weight: "400", style: "italic", variable: "--p-acento", display: "swap", preload: false });

export const fuentesEstadio = `${estadioDisplay.variable} ${estadioTexto.variable} ${estadioAcento.variable}`;
