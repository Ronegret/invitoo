/**
 * Los datos del titular de Invitoo para los textos legales (/privacidad y
 * /aviso-legal). UNA constante: cuando estén los datos reales, se cambian
 * aquí y en ningún otro sitio.
 *
 * NO inventar: lo que va entre corchetes es un marcador que hay que
 * sustituir antes de publicar, y todo el texto legal está pendiente de
 * revisión por un abogado.
 */
export const TITULAR = {
  marca: "Invitoo",
  razonSocial: "[RAZÓN SOCIAL]",
  nif: "[NIF]",
  domicilio: "[DOMICILIO]",
  email: "info@invitoo.es",
  web: "invitoo.es",
  /** Fecha de la última revisión del texto (se enseña al pie). */
  revision: "octubre de 2026",
} as const;

/** ¿Quedan marcadores sin sustituir? Lo usa el aviso de borrador. */
export const LEGAL_PENDIENTE = Object.values(TITULAR).some((v) => /^\[.*\]$/.test(v));
