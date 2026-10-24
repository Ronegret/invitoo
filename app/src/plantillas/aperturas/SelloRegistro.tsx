/**
 * El sello de registro civil: doble aro, el texto girando alrededor y la
 * fecha y la hora en el centro, como un tampón de fechador. Lo usan la
 * apertura de Registro (estampándose) y su portada (ya estampado).
 *
 * Sin estado ni efectos: vale en servidor y en cliente. Tinta = currentColor.
 */
export default function SelloRegistro({
  a,
  b,
  fecha,
  hora,
  size = 220,
  className,
  style,
  id = "sello",
}: {
  a: string;
  b: string;
  /** «19.06.2027» */
  fecha: string;
  /** «12:00» */
  hora: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Id único para el trazado del texto (si hay dos sellos en la página). */
  id?: string;
}) {
  const vuelta = `Registro civil · Boda de ${a} y ${b} · `.toUpperCase();
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={style}
      role="img"
      aria-label={`Sello del registro civil: ${fecha}, ${hora}`}
    >
      <defs>
        <path id={`${id}-vuelta`} d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="96" strokeWidth="3.5" />
        <circle cx="100" cy="100" r="88" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="58" strokeWidth="1.2" />
      </g>
      <text fill="currentColor" style={{ fontFamily: "var(--display)", fontSize: 11.5, fontWeight: 600, letterSpacing: 2.4 }}>
        <textPath href={`#${id}-vuelta`} textLength="455" lengthAdjust="spacingAndGlyphs">
          {vuelta}
        </textPath>
      </text>
      <g fill="currentColor" textAnchor="middle" style={{ fontFamily: "var(--display)", fontWeight: 700 }}>
        <text x="100" y="100" style={{ fontSize: 22, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>
          {fecha}
        </text>
        <rect x="58" y="108" width="84" height="1.6" />
        <text x="100" y="132" style={{ fontSize: 20, fontVariantNumeric: "tabular-nums" }}>
          {hora} h
        </text>
      </g>
    </svg>
  );
}
