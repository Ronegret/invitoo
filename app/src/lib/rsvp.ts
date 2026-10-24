/**
 * El vocabulario del RSVP: menús, los 14 alérgenos de declaración obligatoria
 * en la UE (Reglamento 1169/2011, anexo II) y las opciones de autobús.
 *
 * Lo comparten el formulario del invitado (cliente), la acción de servidor que
 * valida y el panel de los novios. Sin dependencias de servidor.
 */

export const MENUS = [
  { id: "adulto", nombre: "Adulto" },
  { id: "infantil", nombre: "Infantil" },
  { id: "vegetariano", nombre: "Vegetariano" },
  { id: "vegano", nombre: "Vegano" },
] as const;

export type Menu = (typeof MENUS)[number]["id"];

export const ALERGENOS = [
  { id: "gluten", nombre: "Gluten" },
  { id: "crustaceos", nombre: "Crustáceos" },
  { id: "huevo", nombre: "Huevo" },
  { id: "pescado", nombre: "Pescado" },
  { id: "cacahuete", nombre: "Cacahuete" },
  { id: "soja", nombre: "Soja" },
  { id: "lacteos", nombre: "Lácteos" },
  { id: "frutos_cascara", nombre: "Frutos de cáscara" },
  { id: "apio", nombre: "Apio" },
  { id: "mostaza", nombre: "Mostaza" },
  { id: "sesamo", nombre: "Sésamo" },
  { id: "sulfitos", nombre: "Sulfitos" },
  { id: "altramuces", nombre: "Altramuces" },
  { id: "moluscos", nombre: "Moluscos" },
] as const;

export type Alergeno = (typeof ALERGENOS)[number]["id"];

export const BUS = [
  { id: "no", nombre: "No necesito autobús" },
  { id: "ida", nombre: "Solo ida" },
  { id: "vuelta", nombre: "Solo vuelta" },
  { id: "ida_vuelta", nombre: "Ida y vuelta" },
] as const;

export type Bus = (typeof BUS)[number]["id"];

/** Una persona dentro de una respuesta («Los Fernández» son tres). */
export type PersonaRsvp = {
  nombre: string;
  menu: Menu;
  alergenos: Alergeno[];
  alergias_texto: string | null;
  /**
   * Permiso expreso (art. 9.2.a RGPD) para compartir sus alergias con los
   * novios y el catering. Las respuestas antiguas no lo tienen: cuentan como
   * sin permiso.
   */
  consentimiento_salud?: boolean;
};

/** ¿Ha dicho algo de su salud (alérgenos o texto libre)? */
export const tieneDatosSalud = (p: Pick<PersonaRsvp, "alergenos" | "alergias_texto">) =>
  p.alergenos.length > 0 || Boolean(p.alergias_texto?.trim());

/** Ha indicado alergias pero no ha dado permiso para compartirlas. */
export const saludSinPermiso = (p: PersonaRsvp) => tieneDatosSalud(p) && p.consentimiento_salud !== true;

/** Lo que ve quien no es el propio invitado cuando no hay permiso. */
export const ALERGIA_SIN_PERMISO = "Alergia: consultar con el invitado";

/**
 * Las alergias de una persona tal y como se pueden enseñar o exportar: el
 * detalle si dio permiso; si no, solo que hay que preguntarle.
 */
export function alergiasCompartibles(p: PersonaRsvp): string {
  if (!tieneDatosSalud(p)) return "";
  if (p.consentimiento_salud !== true) return ALERGIA_SIN_PERMISO;
  return [p.alergenos.map(nombreAlergeno).join(", "), p.alergias_texto?.trim()].filter(Boolean).join(" · ");
}

/** El texto del permiso, tal cual lo ve el invitado (y lo que se guarda que aceptó). */
export const TEXTO_PERMISO_SALUD =
  "Autorizo que mis alergias e intolerancias se compartan con los novios y el catering para preparar mi menú";

/** Cupo cuando el invitado no viene con token: nadie confirma por 30. */
export const CUPO_SIN_TOKEN = 8;

export const nombreMenu = (id: string) =>
  MENUS.find((m) => m.id === id)?.nombre ?? id;
export const nombreAlergeno = (id: string) =>
  ALERGENOS.find((a) => a.id === id)?.nombre ?? id;
export const nombreBus = (id: string) =>
  BUS.find((b) => b.id === id)?.nombre ?? id;

export const esMenu = (x: unknown): x is Menu =>
  typeof x === "string" && MENUS.some((m) => m.id === x);
export const esAlergeno = (x: unknown): x is Alergeno =>
  typeof x === "string" && ALERGENOS.some((a) => a.id === x);
export const esBus = (x: unknown): x is Bus =>
  typeof x === "string" && BUS.some((b) => b.id === x);

/**
 * La clave con la que se deduplica una respuesta sin token: «José  Pérez» y
 * «jose perez» son la misma persona. Debe coincidir con la normalización de
 * la migración SQL (minúsculas, sin tildes, espacios colapsados).
 */
export function normalizarNombre(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
