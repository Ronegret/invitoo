import EscuchaColor from "@/components/color/EscuchaColor";
import { CapaInteraccion } from "@/components/flores";
import MovimientoCliente from "@/components/movimiento/MovimientoCliente";
import { programaMovimiento, SCRIPT_JS } from "@/components/movimiento/programa";
import { obtenerPlantilla } from "@/data/plantillas";
import { atributosMovimiento, resolverMovimiento, variablesMovimiento } from "@/lib/movimiento";
import type { Invitacion } from "@/lib/tipos";
import { resolverTokens, variablesCss, variablesDeVariantes } from "./tokens";
import VarianteCliente from "./VarianteCliente";
import "./vida.css";

/**
 * El contenedor de cada invitación: aquí se cuelgan TODOS los tokens como
 * variables CSS (`--display`, `--texto`, `--papel`, `--tinta`, `--acento`,
 * `--acento-texto`, `--sobre-acento`, `--radio`, `--grano`) y las clases de
 * las fuentes de esa plantilla, y nada más.
 *
 * `data-plantilla`, `data-ornamento` y `data-modo` son los ganchos del
 * bloque «plantillas» de globals.css: ahí se tiñen los bloques compartidos
 * (títulos, iconos) sin editar sus archivos.
 *
 * El movimiento de la boda (`lib/movimiento.ts`) cuelga aquí también:
 * variables `--mov-*` y ganchos `data-mov-*`. Dos guiones en línea: el
 * primero marca `html.js` antes de pintar; el último, al final del lienzo,
 * prepara el revelado de las secciones (`movimiento/programa.ts`).
 */
const GUION = `(${programaMovimiento.toString()})(document.currentScript&&document.currentScript.parentNode);`;

export default function Lienzo({
  inv,
  fuentes,
  variante,
  children,
}: {
  inv: Invitacion;
  /** `${display.variable} ${texto.variable}` de next/font. */
  fuentes: string;
  /** Variante de color ya conocida en servidor (si la hay). */
  variante?: string;
  children: React.ReactNode;
}) {
  const p = obtenerPlantilla(inv.plantilla);
  const t = resolverTokens(inv.plantilla, inv.tema, variante);
  const m = resolverMovimiento(p.id, inv.tema?.movimiento);
  return (
    <div
      className={`lienzo grano relative isolate ${fuentes}`}
      data-plantilla={p.id}
      data-ornamento={t.ornamento}
      data-modo={t.modo}
      {...atributosMovimiento(m)}
      // `data-mov-listo` lo pone el guion de abajo antes de hidratar.
      suppressHydrationWarning
      style={{ ...variablesCss(t), ...variablesMovimiento(m) } as React.CSSProperties}
    >
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_JS }} />
      <VarianteCliente variantes={variablesDeVariantes(inv.plantilla, inv.tema)} inicial={variante} />
      {/* Color en vivo (G3): ?pal= y los mensajes del probador. */}
      <EscuchaColor />
      {/* Pétalos al tocar y reflejo dorado de los nombres (F1). */}
      <CapaInteraccion />
      {children}
      <MovimientoCliente plantilla={p.id} guardado={inv.tema?.movimiento} />
      <script dangerouslySetInnerHTML={{ __html: GUION }} />
    </div>
  );
}
