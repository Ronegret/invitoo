import Sobre from "./sobre";
import Floracion from "./floracion";
import Cielo from "./cielo";
import Velo from "./velo";
import Constelacion from "./constelacion";
import Bruma from "./bruma";
import Marea from "./marea";
import Terracota from "./terracota";
import Tinta from "./tinta";
import Jardin from "./jardin";
import Lino from "./lino";
import Brasa from "./brasa";
import type { PlantillaId } from "@/lib/tipos";
import type { Props } from "./comun";

/**
 * El registro de plantillas: id de la boda → maqueta que la pinta.
 *
 * Cada plantilla vive en su propio archivo. Para cambiar cómo se ve «Cielo»
 * se abre `cielo.tsx` y se cambia ahí, y no afecta a ninguna otra. Para
 * cambiar una pieza que usan todas —el itinerario, la galería— se toca
 * `comun.tsx`.
 *
 * Antes había un único renderizador que pintaba los bloques del JSON siempre
 * en el mismo orden. Funcionaba, pero por eso las doce se parecían.
 */
export const MAQUETAS: Record<PlantillaId, (p: Props) => React.ReactNode> = {
  sobre: Sobre,
  floracion: Floracion,
  cielo: Cielo,
  velo: Velo,
  constelacion: Constelacion,
  bruma: Bruma,
  marea: Marea,
  terracota: Terracota,
  tinta: Tinta,
  jardin: Jardin,
  lino: Lino,
  brasa: Brasa,
};

export type { Props };
