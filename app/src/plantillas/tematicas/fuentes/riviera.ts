import { Bodoni_Moda, Hanken_Grotesk, Tenor_Sans } from "next/font/google";

/**
 * RIVIERA (K5). Sin precarga.
 *  · Bodoni Moda (display, 400 y 600, con cursiva y `opsz`): la letra de una casa de costura. Nunca por debajo de 28 px.
 *  · Hanken Grotesk (texto, 18 px), en 400 y 500.
 *  · Tenor Sans (`--p-acento`): los rótulos en versalitas con tracking («Atelier», «RSVP»).
 */
export const rivieraDisplay = Bodoni_Moda({ subsets: ["latin"], weight: "variable", style: ["normal", "italic"], axes: ["opsz"], variable: "--p-display", display: "swap", preload: false });
export const rivieraTexto = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500"], variable: "--p-texto", display: "swap", preload: false });
export const rivieraAcento = Tenor_Sans({ subsets: ["latin"], weight: "400", variable: "--p-acento", display: "swap", preload: false });

export const fuentesRiviera = `${rivieraDisplay.variable} ${rivieraTexto.variable} ${rivieraAcento.variable}`;
