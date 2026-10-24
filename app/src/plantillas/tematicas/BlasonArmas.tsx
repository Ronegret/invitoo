/**
 * BLASÓN (K2) — el escudo de armas de la pareja, dibujado en el servidor.
 * Partido: un mueble para cada uno (torre y flor de lis por defecto) y las
 * iniciales en el jefe.
 */
export type Mueble = "torre" | "lis" | "estrella" | "corazon" | "llave" | "espiga";

export const ESCUDO = "M6 6 H94 V58 C94 88 72 106 50 114 C28 106 6 88 6 58 Z";

export function MuebleSvg({ m, x, y, s = 1, color }: { m: Mueble; x: number; y: number; s?: number; color: string }) {
  const t = `translate(${x} ${y}) scale(${s})`;
  switch (m) {
    case "torre":
      return (
        <g transform={t} fill={color}>
          <path d="M-10 14 V-4 H-12 V-12 H-7 V-8 H-3 V-12 H3 V-8 H7 V-12 H12 V-4 H10 V14 Z" />
          <path d="M-3 14 V7 A3 3 0 0 1 3 7 V14 Z" fill="rgb(0 0 0 / .35)" />
          <rect x="-1.2" y="-2" width="2.4" height="5" rx="1.2" fill="rgb(0 0 0 / .3)" />
        </g>
      );
    case "lis":
      return (
        <g transform={t} fill={color}>
          <path d="M0 -17 C6 -10 6 -3 0 4 C-6 -3 -6 -10 0 -17 Z" />
          <path d="M-1.5 3 C-6 -7 -16 -6 -15 2 C-14 8 -8 8 -6 4 C-8 9 -3 10 -1.5 6 Z" />
          <path d="M1.5 3 C6 -7 16 -6 15 2 C14 8 8 8 6 4 C8 9 3 10 1.5 6 Z" />
          <rect x="-9" y="5" width="18" height="3.4" rx="1" />
          <path d="M-2 8 C-3 12 -6 15 -8 16 H8 C6 15 3 12 2 8 Z" />
        </g>
      );
    case "estrella":
      return (
        <g transform={t} fill={color}>
          <path d="M0 -15 L4.4 -4.6 15 -4.6 6.4 2.2 9.6 13 0 6.6 -9.6 13 -6.4 2.2 -15 -4.6 -4.4 -4.6Z" />
        </g>
      );
    case "corazon":
      return (
        <g transform={t} fill={color}>
          <path d="M0 13 C-12 4 -15 -3 -12 -9 C-9 -14 -3 -13 0 -8 C3 -13 9 -14 12 -9 C15 -3 12 4 0 13 Z" />
        </g>
      );
    case "llave":
      return (
        <g transform={t} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
          <circle cx="0" cy="-9" r="5.5" />
          <path d="M0 -3.5 V14 M0 8 H5 M0 12 H4" />
        </g>
      );
    case "espiga":
      return (
        <g transform={t} fill={color}>
          <path d="M0 16 V-14" stroke={color} strokeWidth="1.6" />
          {[-10, -4, 2, 8].map((yy) => (
            <g key={yy}>
              <ellipse cx="-3.4" cy={yy} rx="2.4" ry="4.6" transform={`rotate(-28 -3.4 ${yy})`} />
              <ellipse cx="3.4" cy={yy} rx="2.4" ry="4.6" transform={`rotate(28 3.4 ${yy})`} />
            </g>
          ))}
        </g>
      );
  }
}

/** El anverso, dibujado: sirve también fijo (estandarte, cierre). */
export function EscudoArmas({
  iniciales,
  izquierda = "torre",
  derecha = "lis",
  className = "",
  id = "bl",
}: {
  iniciales: string;
  izquierda?: Mueble;
  derecha?: Mueble;
  className?: string;
  id?: string;
}) {
  return (
    <svg className={`bl-escudo-svg ${className}`} viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-campo`}>
          <path d={ESCUDO} />
        </clipPath>
        <linearGradient id={`${id}-oro`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e3c77f" />
          <stop offset=".5" stopColor="#b58f45" />
          <stop offset="1" stopColor="#8a6a2c" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-campo)`}>
        <rect x="0" y="0" width="50" height="120" className="bl-esmalte-a" />
        <rect x="50" y="0" width="50" height="120" className="bl-esmalte-b" />
        <rect x="0" y="0" width="100" height="32" className="bl-esmalte-jefe" />
        <path d="M0 32 H100" stroke={`url(#${id}-oro)`} strokeWidth="2" />
        <path d="M50 32 V120" stroke={`url(#${id}-oro)`} strokeWidth="1.4" />
        {/* un damasquinado discreto, como el bordado */}
        <path d="M10 46 l4 4 -4 4 -4 -4Z M10 70 l4 4 -4 4 -4 -4Z M90 46 l4 4 -4 4 -4 -4Z M90 70 l4 4 -4 4 -4 -4Z" fill="#fff" fillOpacity=".08" />
      </g>
      <MuebleSvg m={izquierda} x={28} y={66} s={1.05} color={`url(#${id}-oro)`} />
      <MuebleSvg m={derecha} x={72} y={66} s={1.05} color={`url(#${id}-oro)`} />
      <text x="50" y="25" textAnchor="middle" className="bl-escudo-ini" fill={`url(#${id}-oro)`}>
        {iniciales}
      </text>
      <path d={ESCUDO} fill="none" stroke={`url(#${id}-oro)`} strokeWidth="3.2" strokeLinejoin="round" />
      <path d={ESCUDO} fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth=".8" transform="translate(50 60) scale(.9) translate(-50 -60)" />
    </svg>
  );
}

