/**
 * Las flores, dibujadas con números.
 *
 * Cada variante es una lista de piezas (tallos, hojas, pétalos, centros y
 * frutos) con su retraso de entrada. Nada de clipart: geometría de lámina
 * botánica, generada de forma determinista (siempre sale igual en el
 * servidor y en el cliente) y con un poco de irregularidad para que no
 * parezca un mandala.
 *
 * Convenciones:
 *  · Cada pétalo, hoja o fruto se dibuja APUNTANDO HACIA ARRIBA desde su
 *    base (0,0); el `t` (transform SVG) lo lleva a su sitio. Así el CSS
 *    puede abrirlo con un `scale()` desde la base (transform-origin 0 0).
 *  · `d0`: el retraso de entrada, en ms (luego se multiplica por la
 *    velocidad de la boda).
 *  · `c`: el tono (fl-p1…fl-p4 pétalos de claro a hondo, fl-h hoja, fl-h2
 *    envés, fl-c centro, fl-o fruto, fl-e estambre).
 *  · `x`: pieza «extra», solo con densidad plena o con el jardín entero.
 */

export type Pieza = {
  k: "tallo" | "hoja" | "petalo" | "centro" | "fruto" | "estambre" | "vena";
  d: string;
  t?: string;
  d0: number;
  c?: string;
  x?: boolean;
  /** Variante de origen (en composiciones: tiñe cada flor con su color). */
  v?: VarianteFlor;
};

export type Dibujo = { vb: [number, number]; piezas: Pieza[] };

export type VarianteFlor = "peonia" | "rosa" | "eucalipto" | "azahar" | "olivo" | "lavanda";

// ───────────────────────────────────────────────────────────── utilidades

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Aleatorio con semilla (mulberry32): mismo dibujo siempre. */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = [number, number];
type Curva = [P, P, P, P];

function enCurva([a, b, c, d]: Curva, t: number) {
  const u = 1 - t;
  const x = u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0];
  const y = u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1];
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
  // Ángulo SVG: 0° = hacia arriba (−y), positivo en sentido horario.
  const ang = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return { x, y, ang };
}

const curvaD = ([a, b, c, d]: Curva) =>
  `M${r1(a[0])} ${r1(a[1])}C${r1(b[0])} ${r1(b[1])} ${r1(c[0])} ${r1(c[1])} ${r1(d[0])} ${r1(d[1])}`;

const tr = (x: number, y: number, rot = 0, sx = 1, sy = sx) =>
  `translate(${r1(x)} ${r1(y)})${rot ? ` rotate(${r1(rot)})` : ""}${sx !== 1 || sy !== 1 ? ` scale(${r1(sx * 100) / 100} ${r1(sy * 100) / 100})` : ""}`;

// ──────────────────────────────────────────────────────────── las formas

/** Hoja lanceolada, con la punta un poco vencida (`c`). */
function hoja(l: number, w: number, c = 0) {
  return `M0 0C${r1(w * 1.05)} ${r1(-l * 0.18)} ${r1(w * 0.9)} ${r1(-l * 0.72)} ${r1(c)} ${r1(-l)}C${r1(-w * 0.55)} ${r1(-l * 0.74)} ${r1(-w * 1.05)} ${r1(-l * 0.24)} 0 0Z`;
}
function vena(l: number, c = 0) {
  return `M0 0Q${r1(c * 0.25)} ${r1(-l * 0.5)} ${r1(c * 0.85)} ${r1(-l * 0.9)}`;
}
/** Hoja redonda de eucalipto (dólar de plata), con un pecíolo mínimo. */
function moneda(r: number) {
  return `M0 0L0 ${r1(-r * 0.25)}C${r1(r * 1.25)} ${r1(-r * 0.15)} ${r1(r * 1.15)} ${r1(-r * 2.15)} 0 ${r1(-r * 2.1)}C${r1(-r * 1.15)} ${r1(-r * 2.15)} ${r1(-r * 1.25)} ${r1(-r * 0.15)} 0 ${r1(-r * 0.25)}Z`;
}
/** Pétalo de peonía: abanico con el borde rizado. */
function petaloPeonia(l: number, w: number, s: () => number) {
  const j = () => 1 + (s() - 0.5) * 0.12;
  return `M0 0C${r1(w * 0.55)} ${r1(-l * 0.12)} ${r1(w * 1.08)} ${r1(-l * 0.5)} ${r1(w * 0.86 * j())} ${r1(-l * 0.84)}Q${r1(w * 0.62)} ${r1(-l * 1.02 * j())} ${r1(w * 0.3)} ${r1(-l * 0.93)}Q${r1(w * 0.05)} ${r1(-l * 1.06 * j())} ${r1(-w * 0.24)} ${r1(-l * 0.94)}Q${r1(-w * 0.58)} ${r1(-l * 1.01 * j())} ${r1(-w * 0.86 * j())} ${r1(-l * 0.83)}C${r1(-w * 1.08)} ${r1(-l * 0.5)} ${r1(-w * 0.55)} ${r1(-l * 0.12)} 0 0Z`;
}
/** Pétalo de rosa: ancho, de hombros redondos y punta apenas marcada. */
function petaloRosa(l: number, w: number) {
  return `M0 0C${r1(w * 1.05)} ${r1(-l * 0.08)} ${r1(w * 1.12)} ${r1(-l * 0.82)} ${r1(w * 0.36)} ${r1(-l)}Q0 ${r1(-l * 0.9)} ${r1(-w * 0.36)} ${r1(-l)}C${r1(-w * 1.12)} ${r1(-l * 0.82)} ${r1(-w * 1.05)} ${r1(-l * 0.08)} 0 0Z`;
}
/** Pétalo estrecho de azahar, con la punta un poco vuelta. */
function petaloAzahar(l: number, w: number) {
  return `M0 0C${r1(w * 1.1)} ${r1(-l * 0.25)} ${r1(w * 1.05)} ${r1(-l * 0.8)} ${r1(w * 0.2)} ${r1(-l)}C${r1(-w * 0.5)} ${r1(-l * 0.92)} ${r1(-w * 1.1)} ${r1(-l * 0.5)} 0 0Z`;
}
/** Óvalo con base en el origen (frutos, capullos, flores de lavanda). */
function ovalo(rx: number, ry: number) {
  return `M0 0C${r1(rx * 1.33)} 0 ${r1(rx * 1.33)} ${r1(-ry * 2)} 0 ${r1(-ry * 2)}C${r1(-rx * 1.33)} ${r1(-ry * 2)} ${r1(-rx * 1.33)} 0 0 0Z`;
}
const circulo = (r: number) =>
  `M${r1(-r)} 0A${r1(r)} ${r1(r)} 0 1 0 ${r1(r)} 0A${r1(r)} ${r1(r)} 0 1 0 ${r1(-r)} 0Z`;

// ─────────────────────────────────────────────────────────── las cabezas

/** Peonía en tres cuartos: cuatro coronas de pétalos, de fuera adentro. */
function cabezaPeonia(cx: number, cy: number, esc: number, inclina: number, d0: number, semilla: number, x = false): Pieza[] {
  const s = azar(semilla);
  const out: Pieza[] = [];
  const aplasta = 0.8;
  // Sépalos: asoman por debajo.
  for (let i = 0; i < 3; i++) {
    const a = 150 + i * 30 + (s() - 0.5) * 10 + inclina;
    out.push({ k: "hoja", d: hoja(13 * esc, 5 * esc, 2), t: tr(cx, cy, a), d0: d0 - 80, c: "fl-h", x });
  }
  const coronas = [
    { n: 9, l: 38, w: 22, c: "fl-p1", off: 0 },
    { n: 8, l: 31, w: 20, c: "fl-p1", off: 20 },
    { n: 8, l: 24, w: 17, c: "fl-p2", off: 8 },
    { n: 7, l: 17, w: 13, c: "fl-p2", off: 30 },
    { n: 6, l: 11, w: 9, c: "fl-p3", off: 12 },
    { n: 4, l: 6, w: 6, c: "fl-p3", off: 45 },
  ];
  coronas.forEach((co, ci) => {
    for (let i = 0; i < co.n; i++) {
      const a = (360 / co.n) * i + co.off + (s() - 0.5) * 14;
      // La perspectiva: los de delante (abajo) más cortos, los de atrás más altos.
      const rad = ((a + inclina) * Math.PI) / 180;
      const fondo = 1 + 0.2 * Math.cos(rad);
      const l = co.l * esc * fondo * (0.92 + s() * 0.16);
      out.push({
        k: "petalo",
        d: petaloPeonia(l, co.w * esc * (0.9 + s() * 0.2), s),
        t: `${tr(cx, cy, inclina, 1, aplasta)} rotate(${r1(a)})`,
        d0: d0 + ci * 130 + i * 38,
        c: co.c,
        x,
      });
    }
  });
  return out;
}

/** Rosa inglesa: roseta en espiral (ángulo áureo), copa cerrada. */
function cabezaRosa(cx: number, cy: number, esc: number, inclina: number, d0: number, semilla: number, x = false): Pieza[] {
  const s = azar(semilla);
  const out: Pieza[] = [];
  for (let i = 0; i < 3; i++) {
    const a = 140 + i * 40 + (s() - 0.5) * 12 + inclina;
    out.push({ k: "hoja", d: hoja(14 * esc, 4 * esc, 3), t: tr(cx, cy, a), d0: d0 - 80, c: "fl-h", x });
  }
  const N = 22;
  for (let k = 0; k < N; k++) {
    const f = 1 - k / N; // 1 fuera → 0 dentro
    const a = k * 137.508 + (s() - 0.5) * 8;
    const rad = ((a + inclina) * Math.PI) / 180;
    const off = 3 * esc * f;
    const l = (7 + 25 * Math.pow(f, 0.8)) * esc * (1 + 0.12 * Math.cos(rad));
    const w = (6 + 18 * f) * esc;
    const ox = Math.sin((a * Math.PI) / 180) * off;
    const oy = -Math.cos((a * Math.PI) / 180) * off * 0.78;
    out.push({
      k: "petalo",
      d: petaloRosa(l, w),
      t: `${tr(cx, cy, inclina, 1, 0.78)} translate(${r1(ox)} ${r1(oy / 0.78)}) rotate(${r1(a)})`,
      d0: d0 + k * 42,
      c: f > 0.6 ? "fl-p1" : f > 0.3 ? "fl-p2" : "fl-p3",
      x,
    });
  }
  // El corazón de la rosa inglesa: pétalos en espiral apretada, a pluma.
  const e = esc;
  out.push({
    k: "vena",
    d: `M${r1(-1 * e)} ${r1(-1 * e)}C${r1(3 * e)} ${r1(-5 * e)} ${r1(8 * e)} ${r1(-1 * e)} ${r1(5 * e)} ${r1(3 * e)}C${r1(1 * e)} ${r1(8 * e)} ${r1(-8 * e)} ${r1(5 * e)} ${r1(-8 * e)} ${r1(-1 * e)}C${r1(-8 * e)} ${r1(-9 * e)} ${r1(4 * e)} ${r1(-12 * e)} ${r1(10 * e)} ${r1(-6 * e)}`,
    t: `${tr(cx, cy, inclina, 1, 0.78)}`,
    d0: d0 + N * 42,
    c: "fl-espiral",
    x,
  });
  return out;
}

/** Flor de azahar: cinco pétalos estrechos y un manojo de estambres. */
function cabezaAzahar(cx: number, cy: number, esc: number, giro: number, d0: number, semilla: number, x = false): Pieza[] {
  const s = azar(semilla);
  const out: Pieza[] = [];
  for (let i = 0; i < 5; i++) {
    const a = giro + i * 72 + (s() - 0.5) * 10;
    out.push({
      k: "petalo",
      d: petaloAzahar(15 * esc * (0.9 + s() * 0.2), 5.6 * esc),
      t: `${tr(cx, cy, 0, 1, 0.86)} rotate(${r1(a)})`,
      d0: d0 + i * 60,
      c: "fl-p1",
      x,
    });
  }
  for (let i = 0; i < 9; i++) {
    const a = giro + i * 40 + (s() - 0.5) * 16;
    const l = (6 + s() * 2.5) * esc;
    out.push({
      k: "estambre",
      d: `M0 0L0 ${r1(-l)}M${r1(-0.9 * esc)} ${r1(-l)}a${r1(0.9 * esc)} ${r1(0.9 * esc)} 0 1 0 ${r1(1.8 * esc)} 0a${r1(0.9 * esc)} ${r1(0.9 * esc)} 0 1 0 ${r1(-1.8 * esc)} 0`,
      t: tr(cx, cy, a),
      d0: d0 + 320 + i * 25,
      c: "fl-e",
      x,
    });
  }
  out.push({ k: "centro", d: circulo(1.8 * esc), t: tr(cx, cy), d0: d0 + 300, c: "fl-c", x });
  return out;
}

// ─────────────────────────────────────────────────────────── las ramas

function hojasEnTallo(
  curva: Curva,
  ts: number[],
  forma: (i: number, s: () => number) => { d: string; ang: number; sx?: number },
  d0: number,
  dur: number,
  semilla: number,
  c = "fl-h",
  conVena = true,
  extraDesde = Infinity,
): Pieza[] {
  const s = azar(semilla);
  const out: Pieza[] = [];
  ts.forEach((t, i) => {
    const p = enCurva(curva, t);
    const f = forma(i, s);
    const x = i >= extraDesde;
    out.push({ k: "hoja", d: f.d, t: tr(p.x, p.y, p.ang + f.ang, f.sx ?? 1, 1), d0: d0 + t * dur, c, x });
    if (conVena && f.d.length) {
      // La vena sigue la misma forma (misma longitud aproximada).
      const m = /C[^C]*C[^ ]+ [^ ]+ [^ ]+ [^ ]+ (-?[\d.]+) (-?[\d.]+)/.exec(f.d);
      const l = m ? -Number(m[2]) : 20;
      const cc = m ? Number(m[1]) : 0;
      out.push({ k: "vena", d: vena(l, cc), t: tr(p.x, p.y, p.ang + f.ang, f.sx ?? 1, 1), d0: d0 + t * dur + 140, c, x });
    }
  });
  return out;
}

// ─────────────────────────────────────────────────────────── variantes

function peonia(): Dibujo {
  const tallo: Curva = [[104, 318], [96, 250], [118, 190], [96, 116]];
  const rama: Curva = [[103, 232], [130, 214], [150, 196], [160, 168]];
  const p: Pieza[] = [
    { k: "tallo", d: curvaD(tallo), d0: 0 },
    { k: "tallo", d: curvaD(rama), d0: 420, x: true },
  ];
  // Hojas de peonía: lóbulos en tres, sobre el tallo.
  const lob = (l: number, w: number, c: number) => hoja(l, w, c);
  for (const [t, lado, l] of [
    [0.22, -1, 46],
    [0.4, 1, 42],
    [0.62, -1, 34],
  ] as const) {
    const q = enCurva(tallo, t);
    for (const [da, k] of [
      [0, 1],
      [-28, 0.72],
      [28, 0.72],
    ] as const) {
      const ang = q.ang + lado * 52 + da;
      p.push({ k: "hoja", d: lob(l * k, 7 * k, lado * 4), t: tr(q.x, q.y, ang), d0: 260 + t * 700, c: "fl-h" });
      p.push({ k: "vena", d: vena(l * k, lado * 4), t: tr(q.x, q.y, ang), d0: 420 + t * 700, c: "fl-h" });
    }
  }
  // El capullo de la rama.
  p.push({ k: "hoja", d: hoja(10, 4, 2), t: tr(160, 168, 160), d0: 900, c: "fl-h", x: true });
  p.push({ k: "hoja", d: hoja(10, 4, -2), t: tr(160, 168, 205), d0: 900, c: "fl-h", x: true });
  p.push({ k: "fruto", d: ovalo(8, 9), t: tr(160, 170, 22), d0: 1000, c: "fl-p2", x: true });
  p.push(...cabezaPeonia(96, 112, 1.55, -8, 1000, 7));
  return { vb: [200, 320], piezas: p };
}

function rosa(): Dibujo {
  const tallo: Curva = [[100, 318], [108, 258], [88, 196], [104, 130]];
  const p: Pieza[] = [{ k: "tallo", d: curvaD(tallo), d0: 0 }];
  // Hojas compuestas: grupos de tres con un peciolo.
  for (const [t, lado] of [
    [0.25, 1],
    [0.5, -1],
    [0.72, 1],
  ] as const) {
    const q = enCurva(tallo, t);
    const a = q.ang + lado * 58;
    const rad = (a * Math.PI) / 180;
    const fx = q.x + Math.sin(rad) * 26;
    const fy = q.y - Math.cos(rad) * 26;
    p.push({ k: "tallo", d: `M${r1(q.x)} ${r1(q.y)}L${r1(fx)} ${r1(fy)}`, d0: 300 + t * 700 });
    for (const [da, k, off] of [
      [0, 1, 26],
      [-38, 0.8, 12],
      [38, 0.8, 12],
    ] as const) {
      const bx = q.x + Math.sin(rad) * off;
      const by = q.y - Math.cos(rad) * off;
      p.push({ k: "hoja", d: hoja(20 * k, 8 * k, lado * 2), t: tr(bx, by, a + da), d0: 420 + t * 700 + (da ? 80 : 0), c: "fl-h" });
      p.push({ k: "vena", d: vena(20 * k, lado * 2), t: tr(bx, by, a + da), d0: 520 + t * 700, c: "fl-h" });
    }
  }
  // Un capullo cerrado, extra.
  const rb: Curva = [[97, 210], [76, 196], [66, 178], [62, 158]];
  p.push({ k: "tallo", d: curvaD(rb), d0: 380, x: true });
  p.push({ k: "fruto", d: ovalo(5.5, 8), t: tr(62, 160, -14), d0: 950, c: "fl-p3", x: true });
  p.push({ k: "hoja", d: hoja(11, 3.5, 1), t: tr(62, 160, -40), d0: 900, c: "fl-h", x: true });
  p.push({ k: "hoja", d: hoja(11, 3.5, -1), t: tr(62, 160, 20), d0: 900, c: "fl-h", x: true });
  p.push(...cabezaRosa(104, 124, 1.45, 6, 1000, 11));
  return { vb: [200, 320], piezas: p };
}

function eucalipto(): Dibujo {
  const tallo: Curva = [[96, 318], [92, 240], [130, 170], [118, 26]];
  const p: Pieza[] = [{ k: "tallo", d: curvaD(tallo), d0: 0 }];
  const ts = [0.1, 0.19, 0.28, 0.37, 0.46, 0.55, 0.63, 0.71, 0.79, 0.86, 0.92, 0.97];
  p.push(
    ...hojasEnTallo(
      tallo,
      ts,
      (i, s) => ({
        d: moneda((15 - i * 0.85) * (0.92 + s() * 0.16)),
        ang: (i % 2 ? 1 : -1) * (68 - i * 2.5),
      }),
      300,
      1300,
      5,
      "fl-h",
      false,
      9,
    ),
  );
  // Una segunda rama más fina.
  const rama: Curva = [[100, 236], [70, 210], [56, 170], [60, 120]];
  p.push({ k: "tallo", d: curvaD(rama), d0: 500, x: true });
  p.push(
    ...hojasEnTallo(
      rama,
      [0.25, 0.45, 0.65, 0.82, 0.96],
      (i, s) => ({ d: moneda((11 - i) * (0.9 + s() * 0.2)), ang: (i % 2 ? -1 : 1) * 64 }),
      800,
      900,
      9,
      "fl-h",
      false,
      0,
    ),
  );
  return { vb: [200, 320], piezas: p };
}

function azahar(): Dibujo {
  const tallo: Curva = [[100, 318], [96, 260], [110, 210], [102, 150]];
  const p: Pieza[] = [{ k: "tallo", d: curvaD(tallo), d0: 0 }];
  // Hojas de naranjo: anchas, brillantes, con la punta fina.
  p.push(
    ...hojasEnTallo(
      tallo,
      [0.18, 0.42, 0.64, 0.8],
      (i) => ({ d: hoja(42 - i * 4, 12 - i, (i % 2 ? -1 : 1) * 3), ang: (i % 2 ? 1 : -1) * 60 }),
      260,
      900,
      3,
      "fl-h",
      true,
      3,
    ),
  );
  // El ramillete: pedicelos que salen de lo alto.
  const flores: [number, number, number, number, number, boolean][] = [
    // x, y, escala, giro, retraso, extra
    [102, 108, 1.6, 8, 1000, false],
    [64, 134, 1.35, -20, 1180, false],
    [142, 128, 1.35, 30, 1260, false],
    [124, 82, 1.1, 50, 1400, true],
  ];
  for (const [x, y, e, g, d, ex] of flores) {
    p.push({ k: "tallo", d: `M102 152Q${r1((x + 102) / 2 + (x < 102 ? -4 : 4))} ${r1((y + 152) / 2)} ${x} ${y}`, d0: 700, x: ex });
    p.push(...cabezaAzahar(x, y, e, g, d, Math.round(x * 3 + y), ex));
  }
  // Capullos: perlas blancas.
  for (const [x, y, a, ex] of [
    [86, 96, -24, false],
    [146, 106, 26, true],
    [62, 116, -40, true],
  ] as const) {
    p.push({ k: "tallo", d: `M102 152Q${r1((x + 102) / 2)} ${r1((y + 152) / 2 + 6)} ${x} ${y + 4}`, d0: 760, x: ex });
    p.push({ k: "fruto", d: ovalo(3.6, 5.2), t: tr(x, y + 4, a), d0: 1300, c: "fl-p1", x: ex });
  }
  return { vb: [200, 320], piezas: p };
}

function olivo(): Dibujo {
  const tallo: Curva = [[98, 318], [104, 240], [86, 150], [120, 34]];
  const p: Pieza[] = [{ k: "tallo", d: curvaD(tallo), d0: 0 }];
  const ts = [0.14, 0.24, 0.34, 0.44, 0.54, 0.63, 0.72, 0.8, 0.87, 0.93, 0.98];
  // Hojas estrechas, de dos en dos, con el envés plateado alternado.
  ts.forEach((t, i) => {
    const q = enCurva(tallo, t);
    for (const lado of [-1, 1]) {
      if (i === ts.length - 1 && lado === 1) continue;
      const l = (40 - i * 2) * (lado === 1 ? 0.92 : 1);
      const a = q.ang + lado * (46 - i);
      const x = i > 7;
      p.push({ k: "hoja", d: hoja(l, 4.6, lado * 3), t: tr(q.x, q.y, a), d0: 260 + t * 1300 + (lado === 1 ? 70 : 0), c: (i + (lado === 1 ? 1 : 0)) % 2 ? "fl-h2" : "fl-h", x });
      p.push({ k: "vena", d: vena(l, lado * 3), t: tr(q.x, q.y, a), d0: 360 + t * 1300, c: "fl-h", x });
    }
  });
  // Las aceitunas: cuelgan de un rabillo.
  for (const [t, lado, ex] of [
    [0.38, 1, false],
    [0.5, -1, false],
    [0.58, 1, true],
    [0.68, -1, true],
  ] as const) {
    const q = enCurva(tallo, t);
    const fx = q.x + lado * 12;
    const fy = q.y + 10;
    p.push({ k: "tallo", d: `M${r1(q.x)} ${r1(q.y)}Q${r1(q.x + lado * 10)} ${r1(q.y)} ${r1(fx)} ${r1(fy)}`, d0: 900 + t * 600, x: ex });
    p.push({ k: "fruto", d: ovalo(4.6, 6.2), t: tr(fx, fy, 180 + lado * 12), d0: 1100 + t * 600, c: "fl-o", x: ex });
  }
  return { vb: [200, 320], piezas: p };
}

function lavanda(): Dibujo {
  const tallos: Curva[] = [
    [[100, 318], [100, 240], [96, 160], [88, 40]],
    [[100, 318], [104, 250], [118, 180], [134, 76]],
    [[100, 318], [96, 260], [80, 200], [60, 112]],
  ];
  const p: Pieza[] = [];
  tallos.forEach((c, ti) => {
    const ex = ti === 2;
    p.push({ k: "tallo", d: curvaD(c), d0: ti * 120, x: ex });
    // Espiga: verticilos de florecillas, más juntos y pequeños hacia la punta.
    const s = azar(31 + ti);
    const n = 14 - ti * 2;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const t = 0.5 + 0.5 * Math.pow(f, 0.85);
      const q = enCurva(c, t);
      const tam = 1 - f * 0.45;
      for (const lado of [-1, 0, 1]) {
        const a = q.ang + lado * (38 + s() * 10);
        p.push({
          k: "petalo",
          d: ovalo(2.5 * tam, 3.6 * tam),
          t: tr(q.x, q.y, a),
          d0: 900 + i * 70 + ti * 140 + (lado + 1) * 20,
          c: lado === 0 ? "fl-p3" : i % 2 ? "fl-p2" : "fl-p1",
          x: ex,
        });
      }
    }
  });
  // Hojas finas en la base.
  for (const [a, l] of [
    [-24, 70],
    [18, 62],
    [-8, 50],
    [34, 44],
  ] as const) {
    p.push({ k: "hoja", d: hoja(l, 2.6, a > 0 ? 4 : -4), t: tr(100, 318, a), d0: 200, c: "fl-h" });
  }
  return { vb: [200, 320], piezas: p };
}

const DIBUJOS: Record<VarianteFlor, () => Dibujo> = { peonia, rosa, eucalipto, azahar, olivo, lavanda };
const cache = new Map<VarianteFlor, Dibujo>();

export function dibujo(v: VarianteFlor): Dibujo {
  let d = cache.get(v);
  if (!d) {
    d = (DIBUJOS[v] ?? DIBUJOS.peonia)();
    cache.set(v, d);
  }
  return d;
}

/** Coloca un dibujo dentro de otro: desplaza, escala, gira y retrasa. */
export function colocar(
  d: Dibujo,
  x: number,
  y: number,
  esc: number,
  rot: number,
  retraso: number,
  espejo = false,
  v?: VarianteFlor,
): Pieza[] {
  // El origen del dibujo es la base del tallo, abajo en el centro.
  const [w, h] = d.vb;
  const g = `translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)}) scale(${espejo ? -esc : esc} ${esc}) translate(${-w / 2} ${-h})`;
  return d.piezas.map((p) => ({ ...p, t: p.t ? `${g} ${p.t}` : g, d0: p.d0 + retraso, v }));
}
