import type { ForroSobre } from "@/lib/tipos";

/**
 * Los forros del sobre: diez papeles pintados en SVG, teñibles.
 *
 * El fondo es el color elegido; el dibujo va en un marfil translúcido (o en
 * oro, en olivo y constelación), así cualquier tinte queda bien. Se dibuja
 * dentro de un `<svg>` del sobre, en unidades de su viewBox (142 × 100):
 *
 *   <svg viewBox="0 0 142 100"><Forro id="olivo" color="#1f3a2e" pid="x" /></svg>
 *
 * `pid` hace únicos los ids de los <pattern> (puede haber varios sobres en
 * la misma página: el selector del panel enseña los diez).
 */
const MARFIL = "#fbf4e6";
const ORO = "#d8bd84";

export default function Forro({
  id,
  color,
  pid,
  ancho = 142,
  alto = 100,
}: {
  id: ForroSobre;
  color: string;
  pid: string;
  ancho?: number;
  alto?: number;
}) {
  const p = `${pid}-f-${id}`;
  const lleno = (relleno: string, extra?: React.ReactNode) => (
    <>
      <rect width={ancho} height={alto} fill={color} />
      <rect width={ancho} height={alto} fill={relleno} />
      {extra}
      {/* Satinado: el forro es papel fino y brilla un poco. */}
      <rect width={ancho} height={alto} fill={`url(#${p}-brillo)`} />
    </>
  );

  const brillo = (
    <linearGradient id={`${p}-brillo`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity=".14" />
      <stop offset=".45" stopColor="#fff" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity=".18" />
    </linearGradient>
  );

  switch (id) {
    case "olivo":
      return (
        <>
          <defs>
            {brillo}
            <pattern id={p} width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
              <Rama x={3} y={6} rot={0} />
              <Rama x={16} y={19} rot={180} />
            </pattern>
          </defs>
          {lleno(`url(#${p})`)}
        </>
      );
    case "azulejo":
      return (
        <>
          <defs>
            {brillo}
            <pattern id={p} width="16" height="16" patternUnits="userSpaceOnUse">
              <g fill="none" stroke={MARFIL} strokeOpacity=".55" strokeWidth=".45">
                <circle cx="0" cy="0" r="5.5" />
                <circle cx="16" cy="0" r="5.5" />
                <circle cx="0" cy="16" r="5.5" />
                <circle cx="16" cy="16" r="5.5" />
                <path d="M8 2.2 13.8 8 8 13.8 2.2 8Z" />
                <path d="M8 4.6 11.4 8 8 11.4 4.6 8Z" strokeOpacity=".35" />
              </g>
              <circle cx="8" cy="8" r=".9" fill={MARFIL} fillOpacity=".6" />
              <circle cx="0" cy="0" r="1.6" fill={MARFIL} fillOpacity=".35" />
              <circle cx="16" cy="16" r="1.6" fill={MARFIL} fillOpacity=".35" />
              <circle cx="16" cy="0" r="1.6" fill={MARFIL} fillOpacity=".35" />
              <circle cx="0" cy="16" r="1.6" fill={MARFIL} fillOpacity=".35" />
            </pattern>
          </defs>
          {lleno(`url(#${p})`)}
        </>
      );
    case "moare":
      // Dos tramas de ondas casi iguales, una girada 3°: la interferencia es
      // el moaré de la seda.
      return (
        <>
          <defs>
            {brillo}
            <pattern id={p} width="24" height="1.5" patternUnits="userSpaceOnUse">
              <path d="M0 .75 Q6 -.1 12 .75 T24 .75" fill="none" stroke={MARFIL} strokeOpacity=".22" strokeWidth=".42" />
            </pattern>
            <pattern
              id={`${p}-b`}
              width="31"
              height="1.62"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(3) translate(0 .4)"
            >
              <path d="M0 .8 Q7.75 0 15.5 .8 T31 .8" fill="none" stroke={MARFIL} strokeOpacity=".18" strokeWidth=".42" />
            </pattern>
          </defs>
          {lleno(`url(#${p})`, <rect width={ancho} height={alto} fill={`url(#${p}-b)`} />)}
        </>
      );
    case "rayas":
      return (
        <>
          <defs>
            {brillo}
            <pattern id={p} width="7.2" height="10" patternUnits="userSpaceOnUse">
              <rect x="0" width=".55" height="10" fill={MARFIL} fillOpacity=".5" />
              <rect x="1.4" width=".22" height="10" fill={MARFIL} fillOpacity=".35" />
              <rect x="2.6" width=".22" height="10" fill={MARFIL} fillOpacity=".25" />
              <rect x="3.8" width=".22" height="10" fill={MARFIL} fillOpacity=".35" />
              <rect x="5" width=".22" height="10" fill={MARFIL} fillOpacity=".25" />
            </pattern>
          </defs>
          {lleno(`url(#${p})`)}
        </>
      );
    case "constelacion": {
      const estrellas: [number, number, number][] = [];
      // Pseudoaleatorio determinista: el servidor y el cliente pintan lo mismo.
      let s = 7;
      const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      for (let i = 0; i < 70; i++) estrellas.push([r() * ancho, r() * alto, 0.18 + r() * 0.42]);
      const lineas = [
        [18, 14, 29, 22, 37, 17, 49, 26],
        [92, 12, 104, 20, 116, 15, 124, 27],
        [60, 34, 70, 30, 82, 38],
      ];
      return (
        <>
          <defs>{brillo}</defs>
          {lleno(
            "transparent",
            <>
              <g fill={MARFIL}>
                {estrellas.map(([x, y, rr], i) => (
                  <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r={rr.toFixed(2)} fillOpacity={0.35 + (i % 4) * 0.15} />
                ))}
              </g>
              <g fill="none" stroke={ORO} strokeOpacity=".55" strokeWidth=".25">
                {lineas.map((l, i) => (
                  <polyline key={i} points={l.join(" ")} />
                ))}
              </g>
              <g fill={ORO}>
                {lineas.flatMap((l, i) =>
                  l
                    .filter((_, j) => j % 2 === 0)
                    .map((x, j) => <Destello key={`${i}-${j}`} x={x} y={l[j * 2 + 1]} r={1.4} />),
                )}
              </g>
            </>,
          )}
        </>
      );
    }
    case "lino":
      return (
        <>
          <defs>
            {brillo}
            <pattern id={p} width="5" height="5" patternUnits="userSpaceOnUse">
              <g fill={MARFIL}>
                <rect y=".3" width="5" height=".22" fillOpacity=".22" />
                <rect y="1.5" width="5" height=".32" fillOpacity=".14" />
                <rect y="2.6" width="5" height=".2" fillOpacity=".24" />
                <rect y="3.9" width="5" height=".28" fillOpacity=".12" />
                <rect x=".6" width=".2" height="5" fillOpacity=".2" />
                <rect x="1.9" width=".3" height="5" fillOpacity=".12" />
                <rect x="3.1" width=".2" height="5" fillOpacity=".22" />
                <rect x="4.3" width=".26" height="5" fillOpacity=".14" />
              </g>
            </pattern>
          </defs>
          {lleno(`url(#${p})`)}
        </>
      );
    case "floral":
      return (
        <>
          <defs>
            {brillo}
            <pattern id={p} width="14" height="14" patternUnits="userSpaceOnUse">
              <Flor x={3.5} y={3.5} />
              <Flor x={10.5} y={10.5} />
              <g fill={MARFIL} fillOpacity=".3">
                <ellipse cx="9.4" cy="3.8" rx="1.3" ry=".45" transform="rotate(-35 9.4 3.8)" />
                <ellipse cx="2.6" cy="10.4" rx="1.3" ry=".45" transform="rotate(30 2.6 10.4)" />
              </g>
            </pattern>
          </defs>
          {lleno(`url(#${p})`)}
        </>
      );
    case "damasco":
      return (
        <>
          <defs>
            {brillo}
            <pattern id={p} width="20" height="28" patternUnits="userSpaceOnUse">
              <g fill="none" stroke={MARFIL} strokeOpacity=".32" strokeWidth=".4">
                <path d="M10 0C16 5 16 9 10 14 4 19 4 23 10 28" />
                <path d="M10 0C4 5 4 9 10 14 16 19 16 23 10 28" />
                <path d="M0 14C6 19 6 23 0 28M20 14c-6 5-6 9 0 14M0 0c6 5 6 9 0 14M20 0c-6 5-6 9 0 14" strokeOpacity=".18" />
              </g>
              <g fill={MARFIL} fillOpacity=".32">
                <path d="M10 9.6c1.3 1.6 1.3 3.2 0 4.4-1.3-1.2-1.3-2.8 0-4.4Z" />
                <path d="M10 14c1.8-.6 3-.2 3.6 1-1.4.6-2.6.3-3.6-1Zm0 0c-1.8-.6-3-.2-3.6 1 1.4.6 2.6.3 3.6-1Z" />
                <circle cx="0" cy="0" r=".8" />
                <circle cx="20" cy="0" r=".8" />
                <circle cx="0" cy="28" r=".8" />
                <circle cx="20" cy="28" r=".8" />
              </g>
            </pattern>
          </defs>
          {lleno(`url(#${p})`)}
        </>
      );
    case "cuadros":
      return (
        <>
          <defs>
            {brillo}
            <pattern id={p} width="12" height="12" patternUnits="userSpaceOnUse">
              <g fill={MARFIL}>
                <rect width="12" height=".28" fillOpacity=".4" />
                <rect y=".75" width="12" height=".14" fillOpacity=".25" />
                <rect width=".28" height="12" fillOpacity=".4" />
                <rect x=".75" width=".14" height="12" fillOpacity=".25" />
              </g>
            </pattern>
          </defs>
          {lleno(`url(#${p})`)}
        </>
      );
    case "liso":
    default:
      return (
        <>
          <defs>{brillo}</defs>
          {lleno("transparent")}
        </>
      );
  }
}

/** Una rama de olivo: tallo curvo, seis hojas y una aceituna. */
function Rama({ x, y, rot }: { x: number; y: number; rot: number }) {
  const hojas: [number, number, number][] = [
    [2.2, 1.2, -38],
    [3.8, 2.9, 32],
    [5.4, 3.6, -30],
    [7.3, 5.2, 36],
    [8.6, 5.9, -26],
    [10.4, 7.6, 30],
  ];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot} 6 4)`}>
      <path d="M0 0C3 2 7 4 12 8.4" fill="none" stroke={ORO} strokeOpacity=".7" strokeWidth=".35" strokeLinecap="round" />
      <g fill={ORO} fillOpacity=".62">
        {hojas.map(([hx, hy, r], i) => (
          <ellipse key={i} cx={hx} cy={hy} rx="1.9" ry=".55" transform={`rotate(${r} ${hx} ${hy})`} />
        ))}
      </g>
      <circle cx="6.6" cy="6.2" r=".75" fill={MARFIL} fillOpacity=".35" />
    </g>
  );
}

function Flor({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={MARFIL}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-1.05" rx=".62" ry=".95" fillOpacity=".42" transform={`rotate(${a})`} />
      ))}
      <circle r=".45" fill={ORO} fillOpacity=".8" />
    </g>
  );
}

function Destello({ x, y, r }: { x: number; y: number; r: number }) {
  const k = r * 0.22;
  return <path d={`M${x} ${y - r}L${x + k} ${y - k}L${x + r} ${y}L${x + k} ${y + k}L${x} ${y + r}L${x - k} ${y + k}L${x - r} ${y}L${x - k} ${y - k}Z`} fillOpacity=".75" />;
}
