/**
 * Medición de visitas propia: sin cookies, sin almacenamiento en el
 * navegador y sin datos personales (no hace falta banner).
 *
 * Lo que se guarda son CONTADORES por día (`visitas_dia`: día, tipo, clave, n).
 * Para los visitantes únicos aproximados se calcula un hash de IP + navegador
 * con una sal aleatoria DEL DÍA; la sal se borra a los dos días y la IP no se
 * guarda nunca, así que el hash no se puede volver a unir a nadie.
 *
 * Este archivo no lleva lógica de servidor: lo importa también el script.
 */

/** Lo que manda el navegador a `POST /api/visitas` (sendBeacon). */
export type Baliza =
  | {
      t: "v"; // vista de página
      r: string; // ruta, sin query
      ref?: string; // referer (solo se usa el dominio)
      utm?: string; // utm_source (o utm_medium/utm_campaign si no hay)
      s?: string; // slug, si es una invitación
      e?: 1; // primera vista de la visita (entrada): solo entonces cuenta el origen
    }
  | { t: "c"; k: Clic; r: string }; // clic medible

export type Clic = "reservar" | "whatsapp";
export const CLICS: Clic[] = ["reservar", "whatsapp"];

/** Los tipos de contador que existen. */
export type TipoContador =
  | "vistas" // páginas vistas de la web (clave «*»)
  | "visitantes" // únicos aproximados de la web (clave «*»)
  | "ruta" // vistas por ruta
  | "plantilla" // vistas de plantillas (catálogo y demos)
  | "origen" // de dónde vienen (dominio del referer o utm)
  | "clic" // reservar | whatsapp
  | "checkout" // iniciado | pagado
  | "hora" // vistas por hora (Madrid, «yyyy-mm-ddTHH»): para detectar picos
  | "apertura" // aperturas de una invitación (clave = slug)
  | "rsvp" // respuestas nuevas (clave = slug)
  | "foto"; // fotos subidas a «En directo» (clave = slug)

export type FilaContador = { dia: string; tipo: TipoContador; clave: string; n: number };

/** Rutas que no se miden (privadas o técnicas). */
export const RUTAS_FUERA = /^\/(estudio|panel|novios|cuenta|entrar|api|directo|m|pagar|sistema|_next)(\/|$)/;
