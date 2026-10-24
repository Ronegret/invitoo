import { CURVAS, DURACIONES } from "@/lib/movimiento";

/**
 * Sistema de diseño de Invitoo: los mismos tokens que el bloque `/* SISTEMA *\/`
 * del principio de `globals.css`, para quien los necesite en TS (estilos en
 * línea, canvas, Playwright, la página `/sistema`).
 *
 * Fuente de verdad:
 *  - Curvas y duraciones largas → `src/lib/movimiento.ts` (CURVAS, DURACIONES).
 *    Aquí solo se referencian; no se copian.
 *  - Sombras, radios, foco y capas → este archivo y globals.css, que deben
 *    decir lo mismo. Si cambias uno, cambia el otro.
 *
 * En CSS usa siempre la variable (`var(--sombra-3)`), no el valor: dentro de
 * una invitación las plantillas pueden redefinirlas.
 */

/** La tinta de marca, en canales RGB, para teñir sombras: `rgb(var(--sombra-tinta) / .08)`. */
export const SOMBRA_TINTA = "18 16 14"; // #12100E

const t = (a: number) => `rgb(18 16 14 / ${a})`;

/** Elevación en capas, cálida, sin grises fríos. De reposo (1) a modal (5). */
export const SOMBRAS = {
  1: `0 1px 1px ${t(0.04)}, 0 1px 2px ${t(0.05)}`,
  2: `0 1px 1px ${t(0.04)}, 0 2px 4px -1px ${t(0.06)}, 0 6px 12px -6px ${t(0.08)}`,
  3: `0 1px 1px ${t(0.04)}, 0 4px 8px -3px ${t(0.07)}, 0 14px 28px -12px ${t(0.12)}`,
  4: `0 1px 2px ${t(0.05)}, 0 8px 16px -6px ${t(0.08)}, 0 28px 52px -20px ${t(0.16)}`,
  5: `0 2px 4px ${t(0.05)}, 0 14px 28px -10px ${t(0.12)}, 0 48px 96px -32px ${t(0.26)}`,
  /** Papel con luz cenital: filo claro arriba, sombra corta de contacto y una larga muy suave. */
  papel: `inset 0 1px 0 rgb(255 255 255 / .65), 0 1px 0 ${t(0.04)}, 0 2px 3px -1px ${t(0.07)}, 0 12px 24px -12px ${t(0.14)}, 0 32px 64px -32px ${t(0.2)}`,
  /** Lacre: volumen interior (luz arriba, fondo abajo) y una sombra exterior granate. */
  lacre: `inset 0 1.5px 1px rgb(255 228 214 / .28), inset 0 -3px 6px rgb(46 6 12 / .42), 0 1px 1px ${t(0.22)}, 0 6px 14px -4px rgb(90 14 26 / .38)`,
  /** Brillo dorado suave para los botones de oro. */
  dorada: `inset 0 1px 0 rgb(255 246 222 / .55), 0 0 0 1px rgb(150 116 64 / .35), 0 2px 4px -1px ${t(0.14)}, 0 8px 22px -8px rgb(176 141 87 / .6)`,
} as const;

export const RADIOS = { s: "6px", m: "12px", l: "20px", capsula: "999px" } as const;

/** Anillo doble: papel por dentro, granate por fuera. Se ve sobre cualquier fondo. */
export const FOCO = "0 0 0 2px var(--papel), 0 0 0 4px var(--acento)";

/** Las curvas del sistema SON las de movimiento.ts. */
export const EASE = {
  carta: CURVAS.carta,
  velo: CURVAS.velo,
  sello: CURVAS.sello,
  suave: CURVAS.suave,
  exhala: CURVAS.exhala,
} as const;

/** Duraciones en ms. Las de interfaz son cortas; las de la invitación vienen de movimiento.ts. */
export const DURACION = {
  instante: 120,
  rapida: 200,
  breve: DURACIONES.breve,
  media: DURACIONES.media,
  larga: DURACIONES.larga,
  lenta: DURACIONES.lenta,
} as const;

/** Escala fija de capas. Nunca 9999: si algo necesita más, falta un `isolation: isolate`. */
export const CAPAS = {
  base: 0,
  elevada: 10,
  pegajosa: 100,
  menu: 200,
  velo: 300,
  modal: 400,
  aviso: 500,
  apertura: 600,
  cursor: 900,
} as const;

/** Estados del cursor que se piden con `data-cursor`. */
export type EstadoCursor = "abrir" | "ver" | "arrastrar" | "texto" | "nativo";
