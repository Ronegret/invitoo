/**
 * El matasellos: doble aro con la ciudad en arco y la fecha en el centro,
 * en tinta de tampón (un poco gastada: la tinta no carga igual en todo el
 * caucho). Va girado, como se estampa con prisa en la oficina de correos.
 */
export default function Matasellos({
  ciudad,
  fecha,
  pid,
  className,
}: {
  ciudad: string;
  /** «30 · III · 2027» */
  fecha: string;
  pid: string;
  className?: string;
}) {
  const p = `${pid}-m`;
  const texto = (ciudad || "Con amor").toLocaleUpperCase("es");
  return (
    <svg viewBox="-34 -34 68 68" className={className} aria-hidden="true" focusable="false">
      <defs>
        <path id={`${p}-arco`} d="M-21 0A21 21 0 0 1 21 0" />
        <path id={`${p}-arco-b`} d="M-22.5 0A22.5 22.5 0 0 0 22.5 0" />
        <filter id={`${p}-tinta`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="ruido" />
          <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="huecos" />
          <feComposite in="SourceGraphic" in2="huecos" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${p}-tinta)`} fill="currentColor" stroke="currentColor">
        <circle r="30" fill="none" strokeWidth="1.3" />
        <circle r="18.5" fill="none" strokeWidth=".7" />
        <text fontSize="6.4" letterSpacing="1.6" stroke="none" style={{ fontFamily: "var(--texto, system-ui), sans-serif" }} fontWeight="600">
          <textPath href={`#${p}-arco`} startOffset="50%" textAnchor="middle">
            {texto}
          </textPath>
        </text>
        <text fontSize="4.6" letterSpacing="1.4" stroke="none" style={{ fontFamily: "var(--texto, system-ui), sans-serif" }}>
          <textPath href={`#${p}-arco-b`} startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
            NOS CASAMOS
          </textPath>
        </text>
        <text y="1.6" fontSize="4.3" textAnchor="middle" stroke="none" letterSpacing=".4" style={{ fontFamily: "var(--texto, system-ui), sans-serif" }} fontWeight="600">
          {fecha}
        </text>
        <path d="M-27 -5h-3M30 -5h-3M-27 5h-3M30 5h-3" strokeWidth=".7" />
      </g>
    </svg>
  );
}
