import Rama from "@/components/Botanica";
import type { Ornamento as TipoOrnamento } from "@/lib/tipos";

/**
 * Los ocho ornamentos. Uno por plantilla, y es una de las cinco cosas que
 * las separan: un lacre no es una ola, una regla suiza no es una cenefa.
 *
 * Todos son SVG de línea o de mancha con `currentColor`: se tiñen con
 * `--acento-texto` y pesan menos de 1 KB. El mismo dibujo vive también en
 * `globals.css` como máscara (`--orn`), para colgarlo debajo de los títulos
 * de los bloques compartidos sin tocar sus archivos.
 */

export function Lacre({
  iniciales,
  size = 76,
  className,
}: {
  iniciales: string;
  size?: number;
  className?: string;
}) {
  // Borde irregular de cera: 18 lóbulos de radio alterno.
  const puntos = Array.from({ length: 36 }, (_, i) => {
    const ang = (i / 36) * Math.PI * 2;
    const r = i % 2 === 0 ? 48 : 45.2 + ((i * 7) % 3) * 0.6;
    return `${(50 + r * Math.cos(ang)).toFixed(1)},${(50 + r * Math.sin(ang)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Lacre con las iniciales ${iniciales}`}
    >
      <polygon points={puntos} fill="var(--acento)" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="var(--sobre-acento)" strokeOpacity=".45" strokeWidth="1.2" />
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--sobre-acento)"
        style={{ fontFamily: "var(--display)", fontSize: 26, fontStyle: "italic" }}
      >
        {iniciales}
      </text>
    </svg>
  );
}

export function Ola({ ancho = 120, className }: { ancho?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 14" width={ancho} height={(ancho * 14) / 120} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 9c8-7 16-7 24 0s16 7 24 0 16-7 24 0 16 7 24 0 16-7 20-3" />
    </svg>
  );
}

export function Filete({ ancho = 150, className }: { ancho?: number; className?: string }) {
  return (
    <svg viewBox="0 0 150 10" width={ancho} height={(ancho * 10) / 150} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M0 3.5h64M86 3.5h64M0 6.5h64M86 6.5h64" />
      <path d="M75 1l4 4-4 4-4-4z" fill="currentColor" />
    </svg>
  );
}

export function Estrella({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0Z" />
    </svg>
  );
}

export function Punto({ size = 10, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} className={className} aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="5" r="5" />
    </svg>
  );
}

export function Regla({ className }: { className?: string }) {
  return <span aria-hidden className={`block h-[6px] w-14 bg-[var(--acento)] ${className ?? ""}`} />;
}

/**
 * Una pieza de azulejo de 40×40: estrella de ocho puntas con flor central,
 * en cobalto + ocre + buganvilla. Los colores salen de variables para que
 * la variante de la pareja tiña la cenefa entera.
 */
export function PiezaAzulejo({
  x = 0,
  y = 0,
  s = 40,
  gira,
}: {
  x?: number;
  y?: number;
  s?: number;
  /** Retraso (ms) del giro de la tesela, en las portadas vivas. */
  gira?: number;
}) {
  const k = s / 40;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <g className={gira === undefined ? undefined : "tesela"} style={gira === undefined ? undefined : ({ "--t": gira } as React.CSSProperties)}>
      <rect width="40" height="40" fill="var(--papel)" />
      <path d="M20 2 25 15 38 20 25 25 20 38 15 25 2 20 15 15Z" fill="var(--acento)" />
      <path d="M0 0h8L0 8ZM40 0h-8l8 8ZM0 40h8l-8-8ZM40 40h-8l8-8Z" fill="var(--azulejo-2, #d9a441)" />
      <circle cx="20" cy="20" r="5" fill="var(--papel)" />
      <circle cx="20" cy="20" r="2.4" fill="var(--azulejo-3, #b23a6e)" />
      <rect width="40" height="40" fill="none" stroke="var(--acento)" strokeOpacity=".35" strokeWidth=".8" />
      </g>
    </g>
  );
}

export function Cenefa({ piezas = 9, alto = 28, className }: { piezas?: number; alto?: number; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${piezas * 40} 40`}
      height={alto}
      width={(alto * piezas * 40) / 40}
      className={className}
      aria-hidden="true"
      style={{ maxWidth: "100%" }}
      preserveAspectRatio="xMidYMid slice"
    >
      {Array.from({ length: piezas }, (_, i) => (
        <PiezaAzulejo key={i} x={i * 40} />
      ))}
    </svg>
  );
}

/** El ornamento de separación de cada plantilla, por nombre. */
export function Ornamento({ tipo, className }: { tipo: TipoOrnamento; className?: string }) {
  const cls = `mx-auto text-[var(--acento-texto)] ${className ?? ""}`;
  switch (tipo) {
    case "rama":
      return <Rama forma="olivo" ancho={150} className={`${cls} opacity-70`} />;
    case "ola":
      return <Ola className={cls} />;
    case "filete":
      return <Filete className={cls} />;
    case "estrella":
      return <Estrella className={cls} />;
    case "punto":
      return <Punto className={cls} />;
    case "regla":
      return <Regla className={className} />;
    case "cenefa":
      return <Cenefa className={`mx-auto ${className ?? ""}`} />;
    case "lacre":
    default:
      return <Filete className={cls} />;
  }
}
