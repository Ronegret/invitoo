/**
 * Cómo se reserva la videollamada, cómo se paga y cómo se escribe.
 *
 * Las reuniones son por Google Meet, así que la reserva va por la página de
 * citas de Google Calendar: genera el Meet sola, se sincroniza con la agenda
 * de Rodrigo y no mete otra herramienta en medio.
 *
 * Mientras no esté esa página, el botón cae a WhatsApp con el mensaje ya
 * escrito. Nunca se queda sin destino: un enlace de «reservar» que no lleva a
 * ningún sitio es peor que no tenerlo.
 *
 * Los pagos ya NO van por enlaces sueltos de Stripe (Payment Links): los
 * planes con precio cerrado abren Stripe Checkout desde el servidor
 * (`lib/pagos/acciones-planes.ts`), con el webhook que avisa de quién ha
 * pagado. El Estudio se presupuesta hablando y se cobra con un enlace que
 * genera el estudio (/estudio/cobros).
 */

export const WHATSAPP = "34653567610";
export const EMAIL = "info@invitoo.es";
export const INSTAGRAM = "invitoo.es";

/** Página de citas de Google Calendar. Vacío = se usa WhatsApp. */
export const AGENDA = process.env.NEXT_PUBLIC_AGENDA ?? "";

/** Los planes que se pueden reservar pagando, y el Estudio (que se habla). */
export type PlanPago = "invitoo" | "cancion" | "estudio";

/** Un enlace a WhatsApp con el mensaje ya escrito. */
export function enlaceWhatsApp(mensaje: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

export function enlaceReserva(
  mensaje = "Hola, queremos una invitación para nuestra boda",
) {
  if (AGENDA) return AGENDA;
  return enlaceWhatsApp(mensaje);
}

/** El mensaje de WhatsApp de un plan, cuando no se puede pagar en línea. */
export function mensajePlan(nombrePlan: string) {
  return `Hola, nos interesa el plan «${nombrePlan}» para nuestra boda`;
}

/** El mensaje con el que escribe un wedding planner, una finca o un hotel. */
export const MENSAJE_COLABORADOR =
  "Hola, trabajo con bodas (wedding planner / finca / hotel) y me gustaría conocer las condiciones de colaboración con Invitoo.";

/** El mensaje con el que escribe un invitado que se casa. */
export const MENSAJE_INVITADO =
  "Hola, he recibido una invitación vuestra y nos casamos nosotros. Venimos de la boda de: ";
