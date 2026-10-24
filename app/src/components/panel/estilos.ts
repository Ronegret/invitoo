import type { CSSProperties } from "react";
import "@/components/sistema/sistema.css";

/**
 * El vestido del panel: la marca de Invitoo (Bodoni para titulares,
 * Instrument Sans para todo lo demás, papel #FAF8F5 y granate #8C1D2C).
 *
 * Los tokens van en el contenedor del panel y no en globals.css: el panel
 * tiene su papel algo más frío que la web y no hay que tocar lo de nadie.
 *
 * Contraste (sobre #FAF8F5): tinta 15,9:1 · suave 6,7:1 · granate 8,6:1 ·
 * verde 6,1:1. Los textos secundarios usan `--suave`, nunca opacidad: con
 * opacidad el gris depende del fondo y se cae del AA sin avisar.
 */
export const TOKENS_PANEL = {
  "--papel": "#FAF8F5",
  "--tinta": "#1F1A17",
  "--suave": "#5E5650",
  "--linea": "rgba(31, 26, 23, 0.12)",
  "--acento": "#8C1D2C",
  "--acento-claro": "#F4E9EA",
  "--verde": "#4F6146",
  "--verde-claro": "#E9EEE5",
  "--oro": "#B08D57",
  "--tarjeta": "#FFFFFF",
} as CSSProperties;

const foco =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)]";

export const ui = {
  eyebrow: "text-[0.75rem] font-medium uppercase tracking-[0.22em] text-[var(--suave)]",
  h1: "display text-[clamp(1.9rem,6vw,2.6rem)] leading-[1.1]",
  h2: "display text-[1.45rem] leading-tight",
  texto: "text-[1rem] leading-relaxed",
  suave: "text-[var(--suave)]",
  // Sombras y radios del sistema de G2 (globals.css, /* SISTEMA */), con respaldo.
  tarjeta: "rounded-[var(--radio-m,1rem)] border border-[var(--linea)] bg-[var(--tarjeta)] p-5 shadow-[var(--sombra-1,0_1px_2px_rgba(31,26,23,.05))] sm:p-6",
  etiqueta: "block text-[0.85rem] font-medium text-[var(--suave)]",
  campo: `mt-1.5 min-h-12 w-full rounded-xl border border-[var(--linea)] bg-white px-3.5 text-[1rem] outline-none transition-colors focus:border-[var(--acento)] ${foco}`,
  area: `mt-1.5 w-full rounded-xl border border-[var(--linea)] bg-white p-3.5 text-[1rem] leading-relaxed outline-none focus:border-[var(--acento)] ${foco}`,
  // Los botones del panel son los del sistema de G2 (`Boton`, clases `.bt-*`
  // de components/sistema/sistema.css, que importa el layout del panel):
  // mismas sombras, pulsación, foco y estado deshabilitado que en la web.
  // Se exponen como clases para los <button>/<Link>/<a> que ya existían.
  boton: "bt bt-contorno gap-2 bg-white [font-family:inherit] text-[1rem]",
  botonLleno: "bt bt-primario gap-2 [font-family:inherit] text-[1rem]",
  botonPeligro: "bt bt-contorno gap-2 bg-white [font-family:inherit] text-[1rem] !text-[var(--acento)] [--tinta:var(--acento)]",
  enlace: `underline decoration-[var(--acento)]/40 underline-offset-4 hover:decoration-[var(--acento)] ${foco}`,
  chip: "inline-flex min-h-7 items-center rounded-full px-2.5 text-[0.8rem] font-medium",
  foco,
} as const;

/** Color y texto del estado de un invitado. Nunca solo color: siempre texto. */
export const ESTADOS = {
  viene: { texto: "Viene", clase: "bg-[var(--verde-claro)] text-[var(--verde)]" },
  noViene: { texto: "No viene", clase: "bg-[#EFECE8] text-[var(--suave)]" },
  pendiente: { texto: "Sin respuesta", clase: "bg-[var(--acento-claro)] text-[var(--acento)]" },
} as const;
