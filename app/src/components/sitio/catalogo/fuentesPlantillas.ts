import {
  Cinzel,
  Cormorant_Garamond,
  Fraunces,
  Instrument_Serif,
  Inter_Tight,
  Italiana,
  Marcellus,
  Playfair_Display,
} from "next/font/google";

/**
 * La letra de cada plantilla, para las portadas vivas del catálogo.
 *
 * Son las mismas familias que cargan las invitaciones (`src/plantillas/`),
 * pero aquí con `preload: false`: el catálogo no bloquea nada esperándolas.
 * Hasta que llegan, la portada se ve en Bodoni (el respaldo de la variable)
 * y luego cambia sola. Solo se descarga el subconjunto latino.
 */

const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", preload: false, weight: ["500"], style: ["normal", "italic"], variable: "--fp-cormorant" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--fp-playfair" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--fp-fraunces" });
const italiana = Italiana({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--fp-italiana" });
const cinzel = Cinzel({ subsets: ["latin"], display: "swap", preload: false, variable: "--fp-cinzel" });
const marcellus = Marcellus({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--fp-marcellus" });
const instrument = Instrument_Serif({ subsets: ["latin"], display: "swap", preload: false, weight: "400", style: ["normal", "italic"], variable: "--fp-instrument" });
const interTight = Inter_Tight({ subsets: ["latin"], display: "swap", preload: false, variable: "--fp-intertight" });

/** Todas las variables, para ponerlas una vez en el contenedor del catálogo. */
export const VARIABLES_PLANTILLAS = [
  cormorant,
  playfair,
  fraunces,
  italiana,
  cinzel,
  marcellus,
  instrument,
  interTight,
]
  .map((f) => f.variable)
  .join(" ");

/** La familia de cada plantilla, por id. */
export const FAMILIA: Record<string, string> = {
  carta: "var(--fp-cormorant)",
  sobre: "var(--fp-playfair)",
  floracion: "var(--fp-fraunces)",
  mar: "var(--fp-italiana)",
  velo: "var(--fp-cinzel)",
  constelacion: "var(--fp-marcellus)",
  tinta: "var(--fp-instrument)",
  registro: "var(--fp-intertight)",
  azulejo: "var(--fp-cormorant)",
};
