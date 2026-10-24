/**
 * Contrato E2 → E1: `PLANTILLAS: Record<IdCorreo, (d: DatosCorreo) => Correo>`.
 * Puras, sin servidor: las usa el motor, la galería y las capturas de QA.
 */
import type { Correo, DatosCorreo, IdCorreo } from "../tipos.ts";
import { ASUNTOS_B_ESTUDIO, PLANTILLAS_ESTUDIO } from "./estudio.ts";
import { ASUNTOS_B_NOVIOS, PLANTILLAS_NOVIOS } from "./novios.ts";

export const PLANTILLAS: Record<IdCorreo, (d: DatosCorreo) => Correo> = {
  ...PLANTILLAS_NOVIOS,
  ...PLANTILLAS_ESTUDIO,
};

/**
 * Asunto alternativo (B) de cada correo. El motor puede repartir A/B por
 * boda (p. ej. hash del slug par/impar) y registrar la variante enviada.
 */
export const ASUNTOS_B: Record<IdCorreo, (d: DatosCorreo) => string> = {
  ...ASUNTOS_B_NOVIOS,
  ...ASUNTOS_B_ESTUDIO,
};

/** Renderiza con la variante pedida («a» por defecto). */
export function renderizar(id: IdCorreo, d: DatosCorreo, variante: "a" | "b" = "a"): Correo {
  const c = PLANTILLAS[id](d);
  if (variante === "b") {
    const asunto = ASUNTOS_B[id](d);
    return { ...c, asunto, html: c.html.replace(/<title>[^<]*<\/title>/, `<title>${asunto.replace(/[&<>]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[x]!)}</title>`) };
  }
  return c;
}

export { forzarOscuro } from "./base.ts";
export { datosEjemplo } from "./ejemplos.ts";
