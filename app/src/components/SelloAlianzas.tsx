/**
 * El monograma de las alianzas, redibujado.
 *
 * El logo original es un trazado automático: en vector limpio ocupa 21 KB
 * (`public/marca/aros.svg`) y a 24 px sus dos líneas concéntricas se
 * empastan hasta parecer una mancha. Esta versión es el mismo dibujo
 * simplificado a un solo trazo, en 600 bytes, y se lee a cualquier tamaño.
 *
 * Para usos grandes —cabecera, portadas, impresión— va el SVG de
 * `/marca/aros.svg`, que es fiel al original. Éste es para lo pequeño:
 * favicon, loader, firma al pie, sello de confirmación.
 *
 * Proporciones tomadas del original: aro derecho mayor que el izquierdo,
 * solapados a un tercio, y el brillante sobre el izquierdo.
 */

type Props = {
  size?: number;
  /** Los aros giran y encajan. Loader de la invitación. */
  girando?: boolean;
  className?: string;
};

export default function SelloAlianzas({
  size = 48,
  girando = false,
  className,
}: Props) {
  return (
    <svg
      viewBox="0 0 300 212"
      width={size}
      height={(size * 212) / 300}
      fill="none"
      stroke="currentColor"
      strokeWidth={9}
      aria-hidden="true"
      className={className}
    >
      <g
        className={girando ? "sello-gira" : undefined}
        style={{ transformOrigin: "150px 115px" }}
      >
        <circle cx="71" cy="118" r="65" />
        <circle cx="201" cy="110" r="84" />
        <path
          d="M71 46 42 13h58L71 46ZM42 13h58M71 46 56 13M71 46l15-33"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </g>
      <style>{`
        @keyframes selloGira { to { transform: rotate(360deg); } }
        .sello-gira { animation: selloGira 2.4s cubic-bezier(.65,0,.35,1) infinite; }
        @media (prefers-reduced-motion: reduce) { .sello-gira { animation: none; } }
      `}</style>
    </svg>
  );
}
