import { Caveat } from "next/font/google";

/**
 * La letra a mano de «En directo»: el nombre en el pie de cada polaroid y
 * los mensajes como tarjetas escritas. Caveat (OFL) porque se lee a cinco
 * metros en una TV; una caligráfica de boda (Pinyon) no se leería.
 */
export const aMano = Caveat({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  variable: "--a-mano",
  display: "swap",
});
