import type { Props } from "../comun";
import Cuento, { fuentes as f_cuento } from "./cuento";
import Aire, { fuentes as f_aire } from "./aire";
import Regencia, { fuentes as f_regencia } from "./regencia";
// K4
import Festival, { fuentes as f_festival } from "./festival";
import Vinilo, { fuentes as f_vinilo } from "./vinilo";
import Neon, { fuentes as f_neon } from "./neon";
import Fuego, { fuentes as f_fuego } from "./fuego";
import Bachata, { fuentes as f_bachata } from "./bachata";
// K3
import Pinar, { fuentes as f_pinar } from "./pinar";
import Orbita, { fuentes as f_orbita } from "./orbita";
import Brazada, { fuentes as f_brazada } from "./brazada";
// K5
import Lupulo, { fuentes as f_lupulo } from "./lupulo";
import Estadio, { fuentes as f_estadio } from "./estadio";
import Meta, { fuentes as f_meta } from "./meta";
import Riviera, { fuentes as f_riviera } from "./riviera";

// K2
import Blason, { fuentes as f_blason } from "./blason";
import Memorias, { fuentes as f_memorias } from "./memorias";
import Pasaporte, { fuentes as f_pasaporte } from "./pasaporte";
import Orilla, { fuentes as f_orilla } from "./orilla";
/**
 * El registro de las plantillas temáticas (K1). `src/plantillas/index.ts`
 * lo mezcla con las nueve de la casa; el catálogo (datos) está en
 * `./catalogo.ts` y las demos en `./demos.ts`.
 */
export type IdTematica = "regencia" | "aire" | "cuento"
  | "festival" | "vinilo" | "neon" | "fuego" | "bachata" // K4
  | "pinar" | "orbita" | "brazada" // K3
  | "lupulo" | "estadio" | "meta" | "riviera" // K5
  | "blason" | "memorias" | "pasaporte" | "orilla"; // K2

type Maqueta = (p: Props) => React.ReactNode;

export const MAQUETAS_TEMATICAS: Record<IdTematica, Maqueta> = {
  regencia: Regencia,
  aire: Aire,
  cuento: Cuento,
  festival: Festival, vinilo: Vinilo, neon: Neon, fuego: Fuego, bachata: Bachata, // K4
  pinar: Pinar, orbita: Orbita, brazada: Brazada, // K3
  lupulo: Lupulo, estadio: Estadio, meta: Meta, riviera: Riviera, // K5
  blason: Blason, memorias: Memorias, pasaporte: Pasaporte, orilla: Orilla, // K2
};

export const FUENTES_TEMATICAS: Record<IdTematica, string> = {
  regencia: f_regencia,
  aire: f_aire,
  cuento: f_cuento,
  festival: f_festival, vinilo: f_vinilo, neon: f_neon, fuego: f_fuego, bachata: f_bachata, // K4
  pinar: f_pinar, orbita: f_orbita, brazada: f_brazada, // K3
  lupulo: f_lupulo, estadio: f_estadio, meta: f_meta, riviera: f_riviera, // K5
  blason: f_blason, memorias: f_memorias, pasaporte: f_pasaporte, orilla: f_orilla, // K2
};

export { BASE_TEMATICAS, HERO_TEMATICO } from "./catalogo";
export { DEMOS_TEMATICAS } from "./demos";
