import { Josefin_Sans, Parisienne, Sora } from "next/font/google";

/**
 * ÓRBITA (`orbita`, K3). Sin precarga.
 *  · Josefin Sans 200/300 (titulares en caja alta): geometría de la era espacial.
 *  · Sora (texto, 18 px): ojo grande, se lee bien en oscuro.
 *  · Parisienne (`--p-script`), solo a 32 px o más.
 */
export const orbitaDisplay = Josefin_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
export const orbitaTexto = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});
export const orbitaScript = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-script",
  display: "swap",
  preload: false,
});

export const fuentesOrbita = `${orbitaDisplay.variable} ${orbitaTexto.variable} ${orbitaScript.variable}`;
