/**
 * Enlaces que salen del panel: el personal de cada invitado y el de WhatsApp.
 * Sin dependencias de servidor.
 */

/** Dominio público. En Vercel, `NEXT_PUBLIC_SITIO_URL=https://invitoo.es`. */
export const SITIO_URL = (process.env.NEXT_PUBLIC_SITIO_URL ?? "https://invitoo.es").replace(
  /\/$/,
  "",
);

/** `https://invitoo.es/i/laura-y-ruben?n=ab12cd34` */
export function enlacePersonal(slug: string, token: string, base = SITIO_URL) {
  return `${base}/i/${slug}?n=${encodeURIComponent(token)}`;
}

/**
 * Teléfono → solo dígitos con prefijo de país, como lo quiere wa.me.
 * Un móvil español de 9 cifras (6… o 7…) recibe el 34 delante.
 * Devuelve null si no parece un teléfono.
 */
export function normalizarTelefono(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  let d = telefono.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  d = d.replace(/\D/g, "");
  if (/^[6789]\d{8}$/.test(d)) d = `34${d}`;
  return d.length >= 8 && d.length <= 15 ? d : null;
}

/** wa.me con el texto ya escrito. Sin teléfono, WhatsApp deja elegir el chat. */
export function enlaceWhatsApp(texto: string, telefono?: string | null) {
  const tel = normalizarTelefono(telefono);
  return `https://wa.me/${tel ?? ""}?text=${encodeURIComponent(texto)}`;
}

export function textoInvitacion(nombre: string, pareja: string, enlace: string) {
  return `Hola, ${nombre}. ¡Nos casamos! Aquí tienes nuestra invitación, con la hora, el sitio y dónde confirmar: ${enlace}\n${pareja}`;
}

export function textoRecordatorio(nombre: string, pareja: string, enlace: string) {
  return `Hola, ${nombre}. Para ir cerrando números, ¿nos dices si vienes? Se confirma aquí en un minuto: ${enlace}\n${pareja}`;
}
