import { obtenerPlantilla } from "@/data/plantillas";
import type { Invitacion } from "@/lib/tipos";
import EscenaAzulejo, { DURACION_AZULEJO_MS } from "./Azulejo";
import EscenaRegistro, { DURACION_REGISTRO_MS } from "./Registro";

/**
 * Aperturas SIN VÍDEO del catálogo (Registro y Azulejo).
 *
 * CÓMO LAS LLAMA EL ORQUESTADOR (components/aperturas/Apertura.tsx, de B):
 *
 *   const sinVideo = aperturaSinVideo(inv);      // null si la boda tiene vídeo
 *   if (!inv.apertura && sinVideo) {
 *     cfg.espera = sinVideo.duracionMs;          // se cierra sola al acabar
 *     // dentro de la capa `.apertura`, en lugar de <SobreEscena …/>:
 *     <sinVideo.Escena inv={inv} />
 *   }
 *
 * Las escenas son Server Components sin estado: pura animación CSS/SVG que
 * arranca cuando la capa pasa de `display:none` a visible (lo hace
 * `programaApertura`). No necesitan `data-abrir` ni `data-fase`. Pintan su
 * propio fondo, sus fuentes y sus tokens (calculados con la variante por
 * defecto de la boda), así que no dependen del lienzo de la plantilla.
 * Con `prefers-reduced-motion` el orquestador ni las muestra.
 */
export type EscenaSinVideo = {
  Escena: (p: { inv: Invitacion }) => React.ReactNode;
  /** Lo que dura la animación entera, en ms: es el `espera` del orquestador. */
  duracionMs: number;
};

export const APERTURAS_SIN_VIDEO: Record<"registro" | "azulejo", EscenaSinVideo> = {
  registro: { Escena: EscenaRegistro, duracionMs: DURACION_REGISTRO_MS },
  azulejo: { Escena: EscenaAzulejo, duracionMs: DURACION_AZULEJO_MS },
};

/** La apertura sin vídeo de la plantilla de esta boda, o null. */
export function aperturaSinVideo(inv: Pick<Invitacion, "plantilla">): EscenaSinVideo | null {
  const clave = obtenerPlantilla(inv.plantilla).aperturaComponente;
  return clave ? APERTURAS_SIN_VIDEO[clave] : null;
}
