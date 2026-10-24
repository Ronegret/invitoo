/**
 * Cómo llega una paleta a la invitación, en vivo.
 *
 * CONTRATO DE VARIABLES (el mismo que `variablesCss` de plantillas/tokens):
 *   --papel  --tinta  --acento  --acento-texto  --sobre-acento
 * Se escriben como estilo en línea en el `.lienzo` y en su `<main>`, igual
 * que hace `VarianteCliente` con `?c=`. Todo lo que pinte color en la
 * invitación tiene que leer estas variables (nada de hex fijos) para
 * cambiar con la paleta.
 *
 * Dos caminos:
 *   · en el mismo documento: `aplicarPaleta(nodos, paleta)`;
 *   · a un iframe de `/i/<slug>?vista=1`: `postMessage` con
 *     `MensajeColor` (lo recibe `components/color/EscuchaColor.tsx`).
 *
 * El fundido (600 ms) va con `@property`: registrar las variables como
 * `<color>` hace que el navegador interpole la variable misma, y con ella
 * todo lo que la usa —fondos, textos, bordes, SVG, color-mix()—. Sin
 * `@property` (navegadores viejos) el cambio es instantáneo, que también
 * vale. Con `prefers-reduced-motion`, instantáneo.
 *
 * Sin DOM al importar: se puede importar desde el servidor.
 */

import { tonosDerivados } from "../../plantillas/tokens";
import type { Paleta } from "./paleta";

export const VARIABLES_COLOR = {
  papel: "--papel",
  tinta: "--tinta",
  acento: "--acento",
  acentoTexto: "--acento-texto",
  sobreAcento: "--sobre-acento",
} as const satisfies Record<keyof Paleta, string>;

export type MensajeColor =
  | { tipo: "invitoo:color"; paleta: Paleta }
  | { tipo: "invitoo:color-original" }
  | { tipo: "invitoo:color-listo" };

export const DURACION_FUNDIDO = 600;

/**
 * Los tonos de sección que F2 deriva del trío (`tonosDerivados` de
 * plantillas/tokens: `--velo`, `--hondo`, sus textos con AA) y
 * `--papel-base`. Se recalculan con cada paleta para que las bandas y las
 * secciones en negativo también cambien.
 */
export const VARIABLES_DERIVADAS = [
  "--papel-base",
  "--velo",
  "--velo-acento",
  "--hondo",
  "--hondo-texto",
  "--hondo-acento",
] as const;

/** Todas las variables de color que toca el color en vivo. */
export const TODAS_LAS_VARIABLES = [...Object.values(VARIABLES_COLOR), ...VARIABLES_DERIVADAS];

/** La paleta como variables CSS (las cinco + las derivadas). */
export function variablesDePaleta(p: Paleta): Record<string, string> {
  return {
    ...Object.fromEntries(
      (Object.keys(VARIABLES_COLOR) as (keyof Paleta)[]).map((k) => [VARIABLES_COLOR[k], p[k]]),
    ),
    ...tonosDerivados(p.papel, p.tinta, p.acento),
    "--papel-base": p.papel,
  };
}

const ID_ESTILO = "invitoo-color-fundido";

/** CSS del fundido. Se inyecta una vez por documento. */
export function cssFundido(selector = ".lienzo, main[data-modo], [data-color-vivo]"): string {
  const claras = new Set(["--papel", "--sobre-acento", "--papel-base", "--velo", "--hondo-texto"]);
  const reg = TODAS_LAS_VARIABLES
    .map(
      (v) =>
        `@property ${v}{syntax:'<color>';inherits:true;initial-value:${claras.has(v) ? "#ffffff" : "#111111"}}`,
    )
    .join("");
  const trans = TODAS_LAS_VARIABLES
    .map((v) => `${v} ${DURACION_FUNDIDO}ms cubic-bezier(.22,.7,.2,1)`)
    .join(",");
  return `${reg}${selector}{transition:${trans}}@media (prefers-reduced-motion:reduce){${selector}{transition:none}}`;
}

export function prepararFundido(doc: Document, selector?: string) {
  if (doc.getElementById(ID_ESTILO)) return;
  const s = doc.createElement("style");
  s.id = ID_ESTILO;
  s.textContent = cssFundido(selector);
  doc.head.appendChild(s);
}

/** Los nodos que llevan los tokens en una página de invitación. */
export function nodosDeInvitacion(doc: Document): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>(".lienzo, main[data-modo], [data-color-vivo]"));
}

/** Escribe la paleta en los nodos (con fundido si se ha preparado). */
export function aplicarPaleta(nodos: HTMLElement[], p: Paleta) {
  const vars = variablesDePaleta(p);
  for (const n of nodos) {
    for (const [k, v] of Object.entries(vars)) n.style.setProperty(k, v);
    n.dataset.colorPaleta = codificarPaleta(p);
  }
}

// ────────────────────────────────────────────── ?pal= (enlace con colores)

const HEX = /^[0-9a-f]{6}$/i;

/** `?pal=f6f0e4-1d2620-1f3a2e` (papel-tinta-acento). */
export function codificarPaleta(c: { papel: string; tinta: string; acento: string }): string {
  return [c.papel, c.tinta, c.acento].map((x) => x.replace("#", "").toLowerCase()).join("-");
}

export function decodificarPaleta(s: string | null | undefined) {
  if (!s) return null;
  const [papel, tinta, acento] = s.split("-");
  if (![papel, tinta, acento].every((x) => x && HEX.test(x))) return null;
  return { papel: `#${papel.toLowerCase()}`, tinta: `#${tinta.toLowerCase()}`, acento: `#${acento.toLowerCase()}` };
}
