/**
 * CONSTELACIÓN — el momento de la portada: las estrellas dibujan las
 * iniciales de la pareja. Cada letra es un trazo de estrellas sobre una
 * rejilla de 4 × 6; primero se encienden las estrellas y luego las une
 * una línea de oro, como en una carta celeste.
 *
 * SVG de servidor, sin JavaScript. Sin JS o con «menos movimiento» se ve
 * la constelación ya dibujada. Es decoración (`aria-hidden`): los nombres
 * de verdad están en el h1.
 */

type Punto = [number, number];

/** Las letras, como trazos de estrellas (x 0–4, y 0–6). */
const LETRAS: Record<string, Punto[][]> = {
  A: [[[0, 6], [2, 0], [4, 6]], [[0.9, 3.4], [3.1, 3.4]]],
  B: [[[0, 6], [0, 0], [3, 0], [4, 1.5], [3, 3], [0, 3]], [[3, 3], [4, 4.5], [3, 6], [0, 6]]],
  C: [[[4, 1], [3, 0], [1, 0], [0, 1.5], [0, 4.5], [1, 6], [3, 6], [4, 5]]],
  D: [[[0, 0], [0, 6], [2.5, 6], [4, 4.2], [4, 1.8], [2.5, 0], [0, 0]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
  G: [[[4, 1], [3, 0], [1, 0], [0, 1.5], [0, 4.5], [1, 6], [3, 6], [4, 5], [4, 3.5], [2.4, 3.5]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[2, 0], [2, 6]], [[1, 0], [3, 0]], [[1, 6], [3, 6]]],
  J: [[[4, 0], [4, 4.5], [3, 6], [1, 6], [0, 4.5]]],
  K: [[[0, 0], [0, 6]], [[4, 0], [0, 3.6]], [[1.3, 2.5], [4, 6]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3.5], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [[[1, 0], [3, 0], [4, 1.5], [4, 4.5], [3, 6], [1, 6], [0, 4.5], [0, 1.5], [1, 0]]],
  P: [[[0, 6], [0, 0], [3, 0], [4, 1.5], [3, 3], [0, 3]]],
  Q: [[[1, 0], [3, 0], [4, 1.5], [4, 4.5], [3, 6], [1, 6], [0, 4.5], [0, 1.5], [1, 0]], [[2.6, 4.4], [4.2, 6.4]]],
  R: [[[0, 6], [0, 0], [3, 0], [4, 1.5], [3, 3], [0, 3]], [[2, 3], [4, 6]]],
  S: [[[4, 1], [3, 0], [1, 0], [0, 1.3], [1, 2.8], [3, 3.2], [4, 4.7], [3, 6], [1, 6], [0, 5]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 4.5], [1, 6], [3, 6], [4, 4.5], [4, 0]]],
  V: [[[0, 0], [2, 6], [4, 0]]],
  W: [[[0, 0], [1, 6], [2, 2.5], [3, 6], [4, 0]]],
  X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
  Y: [[[0, 0], [2, 3], [4, 0]], [[2, 3], [2, 6]]],
  Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
};

function letra(c: string) {
  const l = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  return LETRAS[l] ?? LETRAS.O;
}

/** Estrellas de fondo, siempre las mismas (nada de Math.random en SSR). */
const FONDO: [number, number, number][] = [
  [8, 14, 0.9], [38, 4, 0.7], [72, 22, 1.1], [112, 8, 0.8], [152, 30, 0.7], [196, 6, 1],
  [230, 26, 0.8], [252, 60, 0.7], [4, 70, 0.8], [26, 118, 1], [246, 120, 0.9], [14, 160, 0.7],
  [62, 176, 0.8], [118, 168, 1.1], [168, 182, 0.7], [214, 168, 0.9], [244, 176, 0.7], [132, 96, 0.6],
];

export default function InicialesEstrellas({ a, b }: { a: string; b: string }) {
  const U = 17; // unidad de la rejilla
  const ox = [42, 158]; // origen x de cada letra
  const oy = 36;
  let d = 200; // ms: el reloj de la animación
  const estrellas: { x: number; y: number; d: number; g: boolean }[] = [];
  const lineas: { p: string; d: number }[] = [];
  [a.charAt(0), b.charAt(0)].forEach((c, k) => {
    const vistos = new Set<string>();
    const trazos = letra(c);
    trazos.forEach((t) => {
      t.forEach(([x, y], i) => {
        const clave = `${x},${y}`;
        if (vistos.has(clave)) return;
        vistos.add(clave);
        estrellas.push({ x: ox[k] + x * U, y: oy + y * U, d: d + i * 70, g: i === 0 });
      });
      d += t.length * 70;
    });
    // Las líneas, después de que se enciendan las estrellas de su letra.
    let dl = d + 150;
    trazos.forEach((t) => {
      lineas.push({ p: t.map(([x, y], i) => `${i ? "L" : "M"}${ox[k] + x * U} ${oy + y * U}`).join(" "), d: dl });
      dl += 260;
    });
    d = dl;
  });
  return (
    <svg viewBox="0 0 260 190" className="const-iniciales wow decor" aria-hidden="true" focusable="false">
      {FONDO.map(([x, y, r], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={r} className="c-fondo" style={{ "--d": i * 230 } as React.CSSProperties} />
      ))}
      {lineas.map((l, i) => (
        <path key={`l${i}`} d={l.p} pathLength={1} className="c-linea" style={{ "--d": l.d } as React.CSSProperties} />
      ))}
      {estrellas.map((e, i) => (
        <circle
          key={`e${i}`}
          cx={e.x}
          cy={e.y}
          r={e.g ? 2.8 : 1.9}
          className={`c-estrella ${e.g ? "grande" : ""}`}
          style={{ "--d": e.d } as React.CSSProperties}
        />
      ))}
      {/* El brillante entre las dos letras, como en el sello de Invitoo. */}
      <circle cx="130" cy="87" r="14" className="c-halo" />
      <path d="M130 75c.5 7 5 11.5 12 12-7 .5-11.5 5-12 12-.5-7-5-11.5-12-12 7-.5 11.5-5 12-12Z" className="c-estrella grande" style={{ "--d": d } as React.CSSProperties} />
    </svg>
  );
}
