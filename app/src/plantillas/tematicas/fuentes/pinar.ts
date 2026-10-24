import { Karla, Sacramento, Young_Serif } from "next/font/google";

/**
 * BOSQUE ENCANTADO (`pinar`, K3). Sin precarga: solo baja en las bodas que la pintan.
 *  · Young Serif (titulares): serif cálida de cartel de madera tallada.
 *  · Karla (texto, 18 px): limpia y legible sobre el kraft.
 *  · Sacramento (`--p-script`), solo a 32 px o más.
 */
export const pinarDisplay = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const pinarTexto = Karla({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const pinarScript = Sacramento({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-script",
  display: "swap",
  preload: false,
});

export const fuentesPinar = `${pinarDisplay.variable} ${pinarTexto.variable} ${pinarScript.variable}`;
