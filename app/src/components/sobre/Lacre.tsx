import type { ColorLacre } from "@/lib/tipos";
import { CERAS } from "./config";

/**
 * El lacre: cera derramada (borde irregular), el disco que dejó el sello
 * al presionar, y en el centro las iniciales de la pareja o las alianzas
 * de Invitoo, hundidas en la cera.
 *
 * Se pinta DOS veces, recortado por una grieta en zigzag: al abrir, cada
 * mitad cae hacia su lado (ver `.sc-lacre` en `Sobre.tsx`). Un reflejo de
 * oro lo cruza una vez al llegar. Todo es SVG en línea: es parte del LCP
 * y no pesa nada.
 */
const BORDE =
  "M52.6 0C53 2.7 52.7 5.7 51.8 8.2C50.8 10.7 48.2 12.8 47 15.3C45.9 17.7 46.1 20.5 45 22.9C44 25.3 42.8 27.9 40.9 29.7C38.9 31.4 35.6 32 33.4 33.4C31.3 34.9 29.6 36.4 28 38.5C26.3 40.6 25.4 44 23.5 46.2C21.7 48.3 19.2 50.3 16.7 51.5C14.2 52.7 11.2 53.4 8.4 53.3C5.7 53.3 2.7 51.9 0 51C-2.7 50 -5 48.2 -7.5 47.6C-10.1 47 -12.9 48 -15.4 47.3C-17.8 46.6 -20.1 45 -22.2 43.6C-24.3 42.2 -26.1 40.2 -28.2 38.8C-30.3 37.3 -32.8 36.4 -34.9 34.9C-37 33.4 -38.6 31.4 -40.7 29.6C-42.8 27.8 -45.6 26.3 -47.3 24.1C-49 21.9 -50.7 19.3 -50.9 16.5C-51 13.8 -48.6 10.4 -48 7.6C-47.4 4.8 -47.3 2.5 -47.4 0C-47.5 -2.5 -48.6 -5.2 -48.4 -7.7C-48.3 -10.2 -47.1 -12.6 -46.4 -15.1C-45.8 -17.6 -45.5 -20.3 -44.6 -22.7C-43.6 -25.1 -42.3 -27.5 -40.9 -29.7C-39.5 -31.9 -37.6 -33.8 -36 -36C-34.4 -38.3 -33.4 -41.4 -31.4 -43.3C-29.5 -45.1 -26.9 -47.1 -24.1 -47.2C-21.2 -47.4 -17.2 -44.5 -14.4 -44.4C-11.7 -44.3 -9.8 -46.1 -7.4 -46.9C-5 -47.6 -2.6 -48.5 0 -49C2.6 -49.5 5.2 -49.7 7.9 -49.8C10.6 -49.8 13.6 -50.2 16.1 -49.4C18.6 -48.6 20.6 -46.4 22.9 -45C25.3 -43.7 27.6 -42.6 30 -41.3C32.3 -40 35.5 -39.2 37.1 -37.1C38.6 -35 38.6 -31.2 39.3 -28.6C40 -25.9 40.2 -23.3 41.3 -21C42.4 -18.8 44.5 -17.1 45.9 -14.9C47.2 -12.7 48.2 -10.3 49.4 -7.8C50.5 -5.3 52.2 -2.7 52.6 0Z";

/** La grieta, de arriba abajo, algo torcida: nunca se parte por la mitad exacta. */
const GRIETA = "M4 -60 L-2 -38 L6 -22 L-3 -6 L5 8 L-4 24 L3 40 L-1 60";
const IZQ = `M-70 -70 L4 -70 ${GRIETA.replace(/^M4 -60 /, "L4 -60 ").replace(/L-1 60$/, "L-1 60 L-1 70")} L-70 70 Z`;
const DER = `M70 -70 L4 -70 ${GRIETA.replace(/^M4 -60 /, "L4 -60 ").replace(/L-1 60$/, "L-1 60 L-1 70")} L70 70 Z`;

export default function Lacre({
  color,
  grabado,
  iniciales,
  pid,
  className,
}: {
  color: ColorLacre;
  grabado: "iniciales" | "alianzas";
  iniciales: [string, string];
  pid: string;
  className?: string;
}) {
  const c = CERAS[color] ?? CERAS.granate;
  const p = `${pid}-l`;
  return (
    <svg viewBox="-60 -60 120 120" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${p}-cera`} cx="34%" cy="28%" r="78%">
          <stop offset="0" stopColor={c.luz} />
          <stop offset=".38" stopColor={c.base} />
          <stop offset=".86" stopColor={c.sombra} />
          <stop offset="1" stopColor={c.sombra} />
        </radialGradient>
        <radialGradient id={`${p}-disco`} cx="62%" cy="70%" r="80%">
          <stop offset="0" stopColor={c.luz} stopOpacity=".55" />
          <stop offset=".55" stopColor={c.base} stopOpacity="0" />
          <stop offset="1" stopColor={c.sombra} stopOpacity=".6" />
        </radialGradient>
        <linearGradient id={`${p}-reflejo`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff6dc" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${p}-borde`}>
          <path d={BORDE} />
        </clipPath>
        <clipPath id={`${p}-izq`}>
          <path d={IZQ} />
        </clipPath>
        <clipPath id={`${p}-der`}>
          <path d={DER} />
        </clipPath>
        <g id={`${p}-todo`}>
          <path d={BORDE} fill={`url(#${p}-cera)`} />
          {/* El canto de la cera, que brilla por arriba y se hunde por abajo. */}
          <path d={BORDE} fill="none" stroke={c.luz} strokeOpacity=".35" strokeWidth="1.2" transform="translate(-.6 -.8) scale(.97)" />
          {/* El disco que dejó el sello: hundido (sombra arriba, luz abajo). */}
          <circle r="36.5" fill={c.base} />
          <circle r="36.5" fill={`url(#${p}-disco)`} />
          <circle r="36" fill="none" stroke={c.sombra} strokeOpacity=".7" strokeWidth="1.6" transform="translate(-.5 -.7)" />
          <circle r="36" fill="none" stroke={c.luz} strokeOpacity=".5" strokeWidth=".9" transform="translate(.6 .9)" />
          <circle r="31" fill="none" stroke={c.grabado} strokeOpacity=".55" strokeWidth=".5" strokeDasharray=".6 1.9" strokeLinecap="round" />
          {grabado === "iniciales" ? (
            <g
              style={{ fontFamily: "var(--display, 'Bodoni Moda', Didot, serif)" }}
              fontStyle="italic"
              textAnchor="middle"
            >
              {/* El relieve: el mismo texto, una vez en luz (abajo) y otra hundido. */}
              <g fill={c.luz} fillOpacity=".55" transform="translate(.7 1)">
                <Monograma i={iniciales} />
              </g>
              <g fill={c.grabado}>
                <Monograma i={iniciales} />
              </g>
            </g>
          ) : (
            <g transform="translate(-24 -17) scale(.16)" fill="none" strokeWidth="11">
              <g stroke={c.luz} strokeOpacity=".55" transform="translate(5 6)">
                <Alianzas />
              </g>
              <g stroke={c.grabado}>
                <Alianzas />
              </g>
            </g>
          )}
        </g>
      </defs>

      <g className="sc-lacre-mitad sc-lacre-izq" clipPath={`url(#${p}-izq)`}>
        <use href={`#${p}-todo`} />
      </g>
      <g className="sc-lacre-mitad sc-lacre-der" clipPath={`url(#${p}-der)`}>
        <use href={`#${p}-todo`} />
      </g>
      <path className="sc-lacre-grieta" d={GRIETA} fill="none" stroke={c.sombra} strokeWidth="1.4" strokeLinejoin="round" pathLength={1} clipPath={`url(#${p}-borde)`} />
      <g clipPath={`url(#${p}-borde)`}>
        <rect className="sc-lacre-reflejo" x="-30" y="-70" width="26" height="140" fill={`url(#${p}-reflejo)`} transform="rotate(22)" />
      </g>
    </svg>
  );
}

function Monograma({ i }: { i: [string, string] }) {
  return (
    <>
      <text x="-11" y="7" fontSize="30">
        {i[0]}
      </text>
      <text x="0" y="5" fontSize="15" opacity=".85">
        &amp;
      </text>
      <text x="12" y="13" fontSize="30">
        {i[1]}
      </text>
    </>
  );
}

/** Las alianzas de la marca (mismo dibujo que `SelloAlianzas`). */
function Alianzas() {
  return (
    <>
      <circle cx="71" cy="118" r="65" />
      <circle cx="201" cy="110" r="84" />
      <path d="M71 46 42 13h58L71 46ZM42 13h58M71 46 56 13M71 46l15-33" strokeWidth="7" strokeLinejoin="round" />
    </>
  );
}
