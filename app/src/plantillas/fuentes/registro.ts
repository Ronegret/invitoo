import { Inter_Tight } from "next/font/google";

/**
 * La fuente de Registro, en su propio módulo porque la usan dos sitios: la
 * plantilla y su apertura (que se pinta fuera del lienzo). Una sola llamada
 * a next/font = un solo archivo de fuente. Sin precarga: solo se descarga
 * en las bodas que la pintan.
 */
export const registroFuente = Inter_Tight({
  subsets: ["latin"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
