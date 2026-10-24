import "server-only";

import { estadoDelPanel } from "./cargar";
import { AVISO_BORRADO_DIAS } from "@/lib/momentos/planes";

/**
 * Lo de «En directo» que tiene que saltar a la vista en Hoy y en Día de la
 * boda: fotos retiradas por un invitado que esperan revisión y el aviso de
 * que el álbum se va a borrar.
 */
export async function avisosDirecto(slug: string): Promise<{
  retiradas: number;
  borrado: string | null;
  avisoBorrado: boolean;
}> {
  const e = await estadoDelPanel(slug);
  if (!e || !e.ok) return { retiradas: 0, borrado: null, avisoBorrado: false };
  const hasta = e.retencionHasta ? new Date(e.retencionHasta) : null;
  const quedan = hasta ? (hasta.getTime() - Date.now()) / 86_400_000 : Infinity;
  const hayFotos = e.uso.fotos + e.uso.videos > 0;
  return {
    retiradas: e.retiradas,
    borrado: e.retencionHasta,
    // El cron lo marca; si aún no ha pasado, se avisa igual en los últimos días.
    avisoBorrado: hayFotos && (e.avisoBorrado || quedan <= AVISO_BORRADO_DIAS),
  };
}
