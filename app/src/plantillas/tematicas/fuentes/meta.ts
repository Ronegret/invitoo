import { Albert_Sans, Chivo_Mono, Saira } from "next/font/google";

/**
 * LÍNEA DE META (K5). Sin precarga.
 *  · Saira con el eje `wdth` (display, expandida a 125 y en 800): la letra del
 *    dorsal y de las equipaciones. (Archivo expandida ya es de Brazada.)
 *  · Albert Sans (texto, 18 px), en 400 y 500.
 *  · Chivo Mono (`--p-acento`): el cronómetro, los tiempos y los kilómetros.
 */
export const metaDisplay = Saira({ subsets: ["latin"], weight: "variable", axes: ["wdth"], variable: "--p-display", display: "swap", preload: false });
export const metaTexto = Albert_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--p-texto", display: "swap", preload: false });
export const metaAcento = Chivo_Mono({ subsets: ["latin"], weight: ["500"], variable: "--p-acento", display: "swap", preload: false });

export const fuentesMeta = `${metaDisplay.variable} ${metaTexto.variable} ${metaAcento.variable}`;
