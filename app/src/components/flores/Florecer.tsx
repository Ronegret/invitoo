import { colocar, dibujo, type Dibujo, type Pieza, type VarianteFlor } from "./dibujos";

export type { VarianteFlor };

/**
 * Flores que florecen. Ilustración botánica fina en SVG, sin JavaScript
 * propio: es un componente de servidor.
 *
 *   <Florecer variante="peonia" />
 *   <Florecer variante="eucalipto" lado="derecha" tamano={140} tono="#8aa39d" />
 *   <Florecer variante="rosa" alCargar densidad="plena" />   // en la portada
 *
 * Cómo se anima: lleva `data-flor`, y el guion del revelado del lienzo
 * (`movimiento/programa.ts`, el único IntersectionObserver de la página)
 * le pone `data-espera` mientras está por debajo y `data-entrando` al
 * llegar. Entonces el tallo crece (stroke-dashoffset), salen las hojas y
 * los pétalos se abren uno a uno (scale + rotate) y se llenan de color.
 * Después la ramita se mece, muy despacio (solo `transform` del <svg>:
 * va por el compositor).
 *
 * Sin JavaScript, con «menos movimiento» o con el revelado apagado, la flor
 * se ve abierta y quieta. Con `flores: "ninguna"` en el movimiento de la
 * boda no se pinta (CSS); con `"sutiles"`, sin las piezas extra.
 */
export type PropsFlorecer = {
  variante: VarianteFlor;
  /** Color de la flor (CSS). Por defecto, el de la variante o el acento de la boda. */
  tono?: string;
  /** Color de las hojas (CSS). */
  hoja?: string;
  /** Ancho: px (número) o cualquier medida CSS. Por defecto 120 px. */
  tamano?: number | string;
  /**
   * De qué lado de la página cuelga: «izquierda» se inclina hacia dentro
   * (a la derecha), «derecha» es su espejo, «centro» recta.
   */
  lado?: "izquierda" | "derecha" | "centro";
  /** «ligera» sin piezas extra, «plena» con todas (capullos, segundas ramas). */
  densidad?: "ligera" | "media" | "plena";
  /** Florece al entrar en la invitación (tras la apertura), no al llegar a ella: para la portada. */
  alCargar?: boolean;
  /** Retraso extra, en ms (para escalonar varias flores juntas). */
  retraso?: number;
  className?: string;
  style?: React.CSSProperties;
};

/** Tonos por defecto de cada variante (flor, hoja). `null` = el acento de la boda. */
const TONOS: Record<VarianteFlor, [string | null, string]> = {
  peonia: [null, "#6f8160"],
  rosa: [null, "#6a7d5c"],
  eucalipto: ["#8ea6a0", "#87a19b"],
  azahar: ["#fbf6ea", "#56704a"],
  olivo: ["#58603a", "#7f8c6a"],
  lavanda: ["#8a77b6", "#7d8c6c"],
};

const medida = (t: number | string | undefined, porDefecto: string) =>
  t === undefined ? porDefecto : typeof t === "number" ? `${t}px` : t;

export function Florecer({
  variante,
  tono,
  hoja,
  tamano,
  lado = "izquierda",
  densidad = "media",
  alCargar = false,
  retraso = 0,
  className = "",
  style,
}: PropsFlorecer) {
  const d = dibujo(variante);
  const [t0, h0] = TONOS[variante] ?? TONOS.peonia;
  return (
    <Lamina
      dib={d}
      piezas={d.piezas}
      variante={variante}
      lado={lado}
      densidad={densidad}
      alCargar={alCargar}
      className={className}
      style={{
        ...vars(tono ?? t0, hoja ?? h0, medida(tamano, "120px"), retraso),
        ...style,
      }}
    />
  );
}

/**
 * La esquina floral de las portadas: peonía y rosa sobre una cama de
 * eucalipto y olivo, con unas flores de azahar. Florece al entrar (tras la
 * apertura).
 *
 *   <Guirnalda esquina="sup-izq" />
 *   <Guirnalda esquina="inf-der" tamano="min(46vw, 260px)" tono="var(--acento)" />
 */
export function Guirnalda({
  esquina = "sup-izq",
  tono,
  tamano,
  densidad = "media",
  className = "",
  style,
}: {
  esquina?: "sup-izq" | "sup-der" | "inf-izq" | "inf-der";
  tono?: string;
  tamano?: number | string;
  densidad?: "ligera" | "media" | "plena";
  className?: string;
  style?: React.CSSProperties;
}) {
  // Compuesta en la esquina superior izquierda de un lienzo de 300×300: las
  // ramas nacen de la esquina y se abren en abanico; las demás esquinas son
  // espejos. Ángulos: 90 = hacia la derecha, 180 = hacia abajo.
  const C = (v: VarianteFlor, esc: number, rot: number, retraso: number, espejo = false, x = 0, y = 0) =>
    colocar(dibujo(v), x, y, esc, rot, retraso, espejo, v);
  const piezas: Pieza[] = [
    ...C("eucalipto", 0.82, 108, 0, false, -6, 4),
    ...C("olivo", 0.8, 160, 80, true, 4, -6),
    ...C("eucalipto", 0.66, 150, 180, true, 0, 0).map((p) => ({ ...p, x: true })),
    ...C("lavanda", 0.6, 122, 300, false, 0, 0).map((p) => ({ ...p, x: true })),
    ...C("azahar", 0.66, 96, 380, false, 0, 10),
    ...C("rosa", 0.72, 156, 220, false, 4, 0),
    ...C("peonia", 0.8, 128, 0, false, -10, -10),
  ];
  const sx = esquina.endsWith("der") ? -1 : 1;
  const sy = esquina.startsWith("inf") ? -1 : 1;
  return (
    <Lamina
      dib={{ vb: [300, 300], piezas }}
      piezas={piezas}
      variante="guirnalda"
      lado="centro"
      densidad={densidad}
      alCargar
      espejo={[sx, sy]}
      className={`flor-guirnalda ${className}`}
      style={{ ...vars(tono ?? null, "#6f8160", medida(tamano, "min(52vw, 280px)"), 0), ...style }}
    />
  );
}

/**
 * El ramo del cierre: todas las flores juntas, atadas con una cinta.
 *
 *   <Ramo />
 *   <Ramo tono="var(--acento)" tamano={220} />
 */
export function Ramo({
  tono,
  tamano,
  densidad = "plena",
  className = "",
  style,
}: {
  tono?: string;
  tamano?: number | string;
  densidad?: "ligera" | "media" | "plena";
  className?: string;
  style?: React.CSSProperties;
}) {
  const base: [number, number] = [150, 330];
  const C = (v: VarianteFlor, esc: number, rot: number, retraso: number, espejo = false) =>
    colocar(dibujo(v), ...base, esc, rot, retraso, espejo, v);
  const piezas: Pieza[] = [
    ...C("eucalipto", 0.92, -38, 0),
    ...C("olivo", 0.95, 34, 80, true),
    ...C("lavanda", 0.86, -14, 200),
    ...C("lavanda", 0.8, 20, 260, true).map((p) => ({ ...p, x: true })),
    ...C("eucalipto", 0.7, 52, 140, true).map((p) => ({ ...p, x: true })),
    ...C("azahar", 0.86, 26, 300),
    ...C("rosa", 0.86, -24, 160),
    ...C("peonia", 0.9, 6, 60),
    // La cinta: un lazo de dos lazadas y dos caídas.
    { k: "tallo", d: "M132 270C112 258 104 276 120 282C132 286 140 276 150 272C160 276 168 286 180 282C196 276 188 258 168 270", d0: 1700, c: "fl-cinta" },
    { k: "tallo", d: "M146 274C142 292 134 306 124 318M154 274C160 294 168 304 178 314", d0: 1900, c: "fl-cinta" },
  ];
  return (
    <Lamina
      dib={{ vb: [300, 340], piezas }}
      piezas={piezas}
      variante="ramo"
      lado="centro"
      densidad={densidad}
      alCargar={false}
      className={`flor-ramo ${className}`}
      style={{ ...vars(tono ?? null, "#6f8160", medida(tamano, "min(70vw, 300px)"), 0), ...style }}
    />
  );
}

// ─────────────────────────────────────────────────────────────── interno

function vars(tono: string | null, hoja: string, ancho: string, retraso: number) {
  const v: Record<string, string> = { "--fl-ancho": ancho, "--fl-hoja": hoja };
  if (tono) v["--fl-tono"] = tono;
  if (retraso) v["--fl-retraso"] = String(retraso);
  return v as React.CSSProperties;
}

function Lamina({
  dib,
  piezas,
  variante,
  lado,
  densidad,
  alCargar,
  espejo,
  className,
  style,
}: {
  dib: Dibujo;
  piezas: Pieza[];
  variante: string;
  lado: "izquierda" | "derecha" | "centro";
  densidad: "ligera" | "media" | "plena";
  alCargar: boolean;
  espejo?: [number, number];
  className: string;
  style: React.CSSProperties;
}) {
  const [w, h] = dib.vb;
  const voltea = lado === "derecha" ? [-1, 1] : espejo ?? [1, 1];
  return (
    <span
      className={`flor ${className}`}
      data-flor={alCargar ? "al-cargar" : ""}
      data-variante={variante}
      data-lado={lado}
      data-densidad={densidad}
      aria-hidden="true"
      style={style}
      // El guion del revelado le pone `data-espera` antes de hidratar.
      suppressHydrationWarning
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        focusable="false"
        style={voltea[0] !== 1 || voltea[1] !== 1 ? { scale: `${voltea[0]} ${voltea[1]}` } : undefined}
      >
        <g className="fl-mece">
          {piezas.map((p, i) => {
            const st = { "--d": Math.round(p.d0) } as React.CSSProperties;
            const extra = p.x ? { "data-extra": "" } : {};
            const tono = p.v ? ` fl-vv-${p.v}` : "";
            if (p.k === "tallo") {
              return <path key={i} className={`fl-tallo ${p.c ?? ""}${tono}`} d={p.d} transform={p.t} pathLength={1} style={st} {...extra} />;
            }
            return (
              <g key={i} transform={p.t} {...extra}>
                <path className={`fl-${p.k} ${p.c ?? ""}${tono}`} d={p.d} style={st} />
              </g>
            );
          })}
        </g>
      </svg>
      <style href="invitoo-flores" precedence="invitoo">
        {CSS_FLORES}
      </style>
    </span>
  );
}

/*
 * Un solo bloque de estilos para todas las flores de la página (React lo
 * deduplica por `href`). Colores: todo sale de `--fl-tono` y `--fl-hoja`
 * mezclados con el papel y la tinta de la boda, así que cualquier paleta
 * los tiñe sin tocar nada.
 */
export const CSS_FLORES = `
.flor {
  --fl-t: var(--fl-tono, var(--acento, #9a3b4a));
  --fl-v: calc(1 / var(--fl-vel, 1));
  display: inline-block; width: var(--fl-ancho, 120px); max-width: 100%;
  line-height: 0; pointer-events: none; user-select: none;
  contain: layout paint;
  /* (P3) Fuera de pantalla, el navegador no recalcula ni pinta la flor. Una
     guirnalda son ~780 trazos SVG (80 % del DOM de la invitación) y antes se
     volvían a calcular en cada fotograma de scroll. «auto» recuerda el
     tamaño ya pintado: no hay saltos. */
  content-visibility: auto;
  contain-intrinsic-size: auto var(--fl-ancho, 120px) auto var(--fl-ancho, 120px);
}
.flor > svg { display: block; width: 100%; height: auto; overflow: visible; }
[data-mov-flores="ninguna"] .flor { display: none; }
.flor[data-densidad="ligera"] [data-extra],
[data-mov-flores="sutiles"] .flor:not([data-densidad="plena"]) [data-extra] { display: none; }

/* —— la tinta —— */
.flor path { vector-effect: non-scaling-stroke; stroke-linecap: round; stroke-linejoin: round; }
.fl-tallo { fill: none; stroke: color-mix(in oklab, var(--fl-hoja) 62%, var(--tinta, #2a2420)); stroke-width: 1.15; }
.fl-tallo.fl-cinta { stroke: color-mix(in oklab, var(--fl-t) 80%, var(--tinta, #2a2420)); stroke-width: 1.4; }
.fl-hoja { stroke: color-mix(in oklab, var(--fl-hoja) 55%, var(--tinta, #2a2420)); stroke-width: .7; stroke-opacity: .7; }
.fl-hoja.fl-h  { fill: color-mix(in oklab, var(--fl-hoja) 78%, var(--papel, #f7f2ea)); }
.fl-hoja.fl-h2 { fill: color-mix(in oklab, var(--fl-hoja) 46%, var(--papel, #f7f2ea)); }
.fl-vena { fill: none; stroke: color-mix(in oklab, var(--fl-hoja) 40%, var(--papel, #f7f2ea)); stroke-width: .55; stroke-opacity: .85; }
.fl-petalo { stroke: color-mix(in oklab, var(--fl-t) 55%, var(--tinta, #2a2420)); stroke-width: .6; stroke-opacity: .55; }
.fl-p1 { fill: color-mix(in oklab, var(--fl-t) 26%, var(--papel, #f7f2ea)); }
.fl-p2 { fill: color-mix(in oklab, var(--fl-t) 40%, var(--papel, #f7f2ea)); }
.fl-p3 { fill: color-mix(in oklab, var(--fl-t) 58%, var(--papel, #f7f2ea)); }
.fl-p4 { fill: color-mix(in oklab, var(--fl-t) 74%, var(--papel, #f7f2ea)); }
.fl-espiral { fill: none; stroke: color-mix(in oklab, var(--fl-t) 70%, var(--tinta, #2a2420)); stroke-width: .7; stroke-opacity: .55; }
/* La rosa inglesa, más empolvada que la peonía. */
.flor[data-variante="rosa"], .fl-vv-rosa { --fl-t: color-mix(in oklab, var(--fl-tono, var(--acento, #9a3b4a)) 50%, #e3a593); }
/* En las composiciones cada flor conserva su color; peonía y rosa toman el de la boda. */
.fl-vv-eucalipto { --fl-hoja: #87a19b; }
.fl-vv-olivo { --fl-t: #58603a; --fl-hoja: #808d69; }
.fl-vv-lavanda { --fl-t: #8a77b6; --fl-hoja: #7d8c6c; }
.fl-vv-azahar { --fl-t: #fbf6ea; --fl-hoja: #56704a; }
[data-variante="azahar"] .fl-petalo, .fl-petalo.fl-vv-azahar { stroke: color-mix(in oklab, var(--fl-hoja) 40%, var(--tinta, #2a2420)); stroke-opacity: .45; }
[data-variante="azahar"] .fl-p1, .fl-p1.fl-vv-azahar { fill: color-mix(in oklab, var(--fl-t) 88%, #fff); }
.fl-fruto { stroke: color-mix(in oklab, var(--fl-t) 50%, var(--tinta, #2a2420)); stroke-width: .6; stroke-opacity: .6; }
.fl-fruto.fl-o { fill: color-mix(in oklab, var(--fl-t) 85%, var(--papel, #f7f2ea)); }
.fl-estambre { fill: #d6b25a; stroke: #b8923f; stroke-width: .5; }
.fl-centro { fill: #e2c46e; stroke: #b8923f; stroke-width: .5; }
/* En la guirnalda y el ramo el azahar es blanco aunque el resto tome el acento. */
.flor-guirnalda .fl-estambre, .flor-ramo .fl-estambre { fill: #d6b25a; }

/* —— la vida: se mece, muy despacio —— */
.fl-mece { transform-box: view-box; transform-origin: 50% 100%; }
.flor > svg { transform-origin: 50% 100%; animation: fl-mece 9s cubic-bezier(.45,0,.55,1) calc(var(--fl-retraso, 0) * 1ms + 3.2s) infinite alternate; }
.flor[data-lado="derecha"] > svg { animation-duration: 10.5s; }
.flor[data-variante="lavanda"] > svg { animation-duration: 6.5s; }
.flor[data-variante="eucalipto"] > svg { animation-duration: 8s; }
.flor-guirnalda > svg, .flor-ramo > svg { animation: none; }
@keyframes fl-mece { from { rotate: -1.1deg; } to { rotate: 1.3deg; } }

/* —— florecer —— */
html.js .flor[data-espera] .fl-tallo { stroke-dasharray: 1; stroke-dashoffset: 1; }
html.js .flor[data-espera] :is(.fl-hoja, .fl-vena, .fl-petalo, .fl-fruto, .fl-estambre, .fl-centro) { opacity: 0; }
.flor :is(.fl-hoja, .fl-vena, .fl-petalo, .fl-fruto, .fl-estambre, .fl-centro) { transform-box: view-box; transform-origin: 0 0; }
.flor[data-entrando] .fl-tallo {
  stroke-dasharray: 1;
  animation: fl-crece calc(1300ms * var(--fl-v)) cubic-bezier(.45,.05,.3,1) calc((var(--d) + var(--fl-retraso, 0)) * 1ms * var(--fl-v)) both;
}
.flor[data-entrando] :is(.fl-hoja, .fl-fruto) {
  animation: fl-brota calc(900ms * var(--fl-v)) cubic-bezier(.22,.61,.36,1) calc((var(--d) + var(--fl-retraso, 0)) * 1ms * var(--fl-v)) both;
}
.flor[data-entrando] .fl-vena { animation: fl-aparece calc(700ms * var(--fl-v)) ease-out calc((var(--d) + var(--fl-retraso, 0)) * 1ms * var(--fl-v)) both; }
.flor[data-entrando] .fl-petalo {
  animation:
    fl-abre calc(1100ms * var(--fl-v)) cubic-bezier(.22,.61,.36,1) calc((var(--d) + var(--fl-retraso, 0)) * 1ms * var(--fl-v)) both,
    fl-tine calc(1400ms * var(--fl-v)) ease-out calc((var(--d) + var(--fl-retraso, 0) + 250) * 1ms * var(--fl-v)) both;
}
.flor[data-entrando] :is(.fl-estambre, .fl-centro) { animation: fl-brota calc(700ms * var(--fl-v)) cubic-bezier(.22,.61,.36,1) calc((var(--d) + var(--fl-retraso, 0)) * 1ms * var(--fl-v)) both; }
@keyframes fl-crece { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes fl-brota { from { opacity: 0; transform: scale(.05) rotate(-14deg); } 40% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes fl-abre { from { opacity: 0; transform: scale(.12, .2) rotate(-22deg); } 30% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes fl-tine { from { fill-opacity: .1; } to { fill-opacity: 1; } }
@keyframes fl-aparece { from { opacity: 0; } to { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .flor > svg, .flor[data-entrando] * { animation: none !important; }
  html.js .flor[data-espera] * { opacity: 1 !important; stroke-dashoffset: 0 !important; }
}
`;
