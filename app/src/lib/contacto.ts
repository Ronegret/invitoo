/**
 * Cómo se reserva la videollamada.
 *
 * Las reuniones son por Google Meet, así que la reserva va por la página de
 * citas de Google Calendar: genera el Meet sola, se sincroniza con la agenda
 * de Rodrigo y no mete otra herramienta en medio.
 *
 * Mientras no esté esa página, el botón cae a WhatsApp con el mensaje ya
 * escrito. Nunca se queda sin destino: un enlace de «reservar» que no lleva a
 * ningún sitio es peor que no tenerlo.
 */

export const WHATSAPP = "34653567610";
export const EMAIL = "info@invitoo.es";
export const INSTAGRAM = "invitoo.es";

/** Página de citas de Google Calendar. Vacío = se usa WhatsApp. */
export const AGENDA = process.env.NEXT_PUBLIC_AGENDA ?? "";

export function enlaceReserva(mensaje = "Hola, queremos una invitación para nuestra boda") {
  if (AGENDA) return AGENDA;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}
