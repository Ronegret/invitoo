import { Pinyon_Script } from "next/font/google";

/**
 * La letra a mano del sobre («Para Carmen») y de la firma del pie. Pinyon
 * Script: caligrafía inglesa de pluma, legible a 26 px. Sin precarga: solo
 * la baja quien la ve pintada.
 */
export const manuscrita = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--f-manuscrita",
  display: "swap",
  preload: false,
});
