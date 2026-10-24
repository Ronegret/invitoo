import Azulejo, { fuentes as f_azulejo } from "./azulejo";
import Carta, { fuentes as f_carta } from "./carta";
import Constelacion, { fuentes as f_constelacion } from "./constelacion";
import Floracion, { fuentes as f_floracion } from "./floracion";
import Mar, { fuentes as f_mar } from "./mar";
import Registro, { fuentes as f_registro } from "./registro";
import Sobre, { fuentes as f_sobre } from "./sobre";
import Tinta, { fuentes as f_tinta } from "./tinta";
import Velo, { fuentes as f_velo } from "./velo";
import { ALIAS_PLANTILLAS, resolverPlantillaId } from "@/data/plantillas";
import type { PlantillaAntigua, PlantillaGuardada, PlantillaId } from "@/lib/tipos";
import type { Props } from "./comun";
import { FUENTES_TEMATICAS, MAQUETAS_TEMATICAS } from "./tematicas";

/**
 * El registro de plantillas: id de la boda → maqueta que la pinta.
 *
 * Nueve archivos, nueve páginas: cada una con sus fuentes (cargadas solo en
 * su archivo y sin precarga), su portada, su ornamento y su cierre. El
 * orden de las secciones es un dato del catálogo (`src/data/plantillas.ts`).
 *
 * Los ids antiguos siguen resolviendo: `MAQUETAS.cielo` es Mar, así que una
 * boda guardada como «cielo» se pinta sin tocar la base de datos.
 */
type Maqueta = (p: Props) => React.ReactNode;

const PROPIAS: Record<PlantillaId, Maqueta> = {
  carta: Carta,
  sobre: Sobre,
  floracion: Floracion,
  mar: Mar,
  velo: Velo,
  constelacion: Constelacion,
  tinta: Tinta,
  registro: Registro,
  azulejo: Azulejo,
  ...MAQUETAS_TEMATICAS,
};

export const MAQUETAS: Record<PlantillaGuardada, Maqueta> = {
  ...PROPIAS,
  ...(Object.fromEntries(
    Object.entries(ALIAS_PLANTILLAS).map(([viejo, nuevo]) => [viejo, PROPIAS[nuevo]]),
  ) as Record<PlantillaAntigua, Maqueta>),
};

/** Las clases de next/font de cada plantilla, para el `<main>` de la invitación. */
export const FUENTES: Record<PlantillaId, string> = {
  carta: f_carta,
  sobre: f_sobre,
  floracion: f_floracion,
  mar: f_mar,
  velo: f_velo,
  constelacion: f_constelacion,
  tinta: f_tinta,
  registro: f_registro,
  azulejo: f_azulejo,
  ...FUENTES_TEMATICAS,
};

/** La maqueta de cualquier id (nuevo, antiguo o desconocido → Sobre). */
export function maquetaDe(id: string | null | undefined): Maqueta {
  return PROPIAS[resolverPlantillaId(id)];
}

export type { Props };
