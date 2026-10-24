/**
 * Lacre de cera vectorial de Invitoo, con las iniciales de la pareja o el monograma de las alianzas.
 *
 * Todo SVG (≈ 3 KB): borde de cera irregular (curvas Catmull-Rom generadas por
 * `herramientas/marca/lacre.py`), volumen con degradados radiales, anillo
 * prensado con bisel y brillo especular. Se tiñe con `tono` (por defecto, granate de marca).
 * Sin JS en cliente: sirve en SSR y como LCP.
 *
 * Uso: <LacreVectorial iniciales="I&G" />  ·  <LacreVectorial />  (alianzas)
 */
import { useId } from "react";
import { ALIANZAS_FINO, BRILLANTE_FINO } from "@/components/SelloAlianzas";

type Props = {
  /** «I&G», «IG» o «I · G». Si falta, se estampa el monograma de las alianzas. */
  iniciales?: string;
  /** Color base de la cera. */
  tono?: string;
  size?: number;
  className?: string;
  /** Texto alternativo. Si se omite, el lacre es decorativo (aria-hidden). */
  titulo?: string;
};

const BORDE = "M102.4 1.5C102.0 9.2 102.3 20.6 99.5 27.8C96.7 35.0 88.8 39.5 85.4 44.7C82.1 49.9 83.4 54.4 79.3 59.1C75.3 63.8 68.1 68.3 61.1 72.9C54.0 77.5 42.5 82.6 37.0 86.6C31.5 90.6 35.0 95.3 28.2 96.8C21.5 98.3 5.3 95.7 -3.7 95.7C-12.7 95.8 -18.9 97.2 -25.8 97.1C-32.8 97.0 -39.4 97.8 -45.3 95.0C-51.2 92.2 -55.5 85.2 -61.0 80.3C-66.5 75.4 -73.4 71.5 -78.2 65.9C-83.1 60.3 -87.2 54.0 -90.3 46.8C-93.3 39.6 -96.2 30.5 -96.7 22.7C-97.2 14.9 -93.4 7.4 -93.1 -0.1C-92.7 -7.6 -95.2 -13.9 -94.7 -22.3C-94.2 -30.6 -94.0 -43.7 -90.1 -50.2C-86.3 -56.7 -76.0 -56.0 -71.7 -61.4C-67.3 -66.8 -69.5 -77.2 -64.1 -82.9C-58.7 -88.6 -45.7 -93.2 -39.3 -95.6C-32.9 -98.0 -31.5 -95.0 -25.7 -97.3C-19.9 -99.5 -12.8 -108.7 -4.4 -109.0C3.9 -109.4 17.4 -103.1 24.1 -99.4C30.9 -95.7 30.7 -90.1 36.1 -86.8C41.5 -83.4 49.4 -83.5 56.4 -79.4C63.4 -75.3 72.6 -68.0 77.9 -61.9C83.3 -55.8 84.3 -50.3 88.4 -43.0C92.4 -35.7 99.9 -25.4 102.3 -18.0C104.6 -10.6 102.9 -6.1 102.4 1.5Z";

function mezcla(hex: string, k: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)),
  );
  return `rgb(${c.join(",")})`;
}

export default function LacreVectorial({
  iniciales,
  tono = "#8C1D2C",
  size = 120,
  className,
  titulo,
}: Props) {
  const id = useId().replace(/:/g, "");
  const partes = (iniciales ?? "").split(/\s*[&·y+]\s*|\s+/).filter(Boolean);
  return (
    <svg
      viewBox="-120 -120 240 240"
      width={size}
      height={size}
      className={className}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <defs>
        <radialGradient id={`c${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor={mezcla(tono, 0.22)} />
          <stop offset=".55" stopColor={tono} />
          <stop offset="1" stopColor={mezcla(tono, -0.45)} />
        </radialGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mezcla(tono, -0.5)} />
          <stop offset="1" stopColor={mezcla(tono, 0.3)} />
        </linearGradient>
        <radialGradient id={`h${id}`} cx="35%" cy="25%" r="35%">
          <stop offset="0" stopColor="#fff" stopOpacity=".38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`p${id}`} cx="60%" cy="65%" r="70%">
          <stop offset="0" stopColor={mezcla(tono, 0.06)} />
          <stop offset="1" stopColor={mezcla(tono, -0.3)} />
        </radialGradient>
        <filter id={`s${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#2a0a10" floodOpacity=".35" />
        </filter>
      </defs>
      <g filter={`url(#s${id})`}>
        <path d={BORDE} fill={`url(#c${id})`} />
      </g>
      {/* anillo prensado: canal hundido con bisel */}
      <circle r="74" fill="none" stroke={`url(#b${id})`} strokeWidth="5" opacity=".9" />
      <circle r="67" fill={`url(#p${id})`} />
      <circle r="67" fill="none" stroke={mezcla(tono, 0.25)} strokeWidth="1.2" opacity=".6" />
      {[
        { dx: 1.6, dy: 1.6, fill: mezcla(tono, -0.55), o: 0.9 },
        { dx: -1.1, dy: -1.1, fill: mezcla(tono, 0.45), o: 0.8 },
        { dx: 0, dy: 0, fill: mezcla(tono, 0.08), o: 1 },
      ].map((c, i) => (
        <g key={i} transform={`translate(${c.dx} ${c.dy})`} fill={c.fill} opacity={c.o}>
          {partes.length ? (
            <text
              y="3"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily: "var(--font-bodoni, 'Bodoni Moda'), 'Didot', serif",
                fontStyle: "italic",
                fontSize: partes.length > 1 ? 54 : 72,
                letterSpacing: "-0.02em",
              }}
            >
              {partes.length > 1 ? `${partes[0][0]}&${partes[1][0]}` : partes[0].slice(0, 2)}
            </text>
          ) : (
            <g transform="translate(-63 -46) scale(.42)">
              <path d={ALIANZAS_FINO} />
              <path d={BRILLANTE_FINO} />
            </g>
          )}
        </g>
      ))}
      <path d={BORDE} fill={`url(#h${id})`} />
    </svg>
  );
}
