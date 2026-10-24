import { formatearFecha } from "@/lib/fecha";
import type { Invitacion } from "@/lib/tipos";
import { azulejoDisplay, azulejoTexto } from "../fuentes/azulejo";
import { PiezaAzulejo } from "../ornamentos";
import { resolverTokens, variablesCss } from "../tokens";

/**
 * Apertura de AZULEJO, sin vídeo: 3,4 s de SVG y CSS.
 *
 *   0,0 s  una sola pieza de azulejo en el centro de la cal.
 *   0,2–1,7 s la pieza se repite hacia fuera, por anillos, hasta formar un
 *          panel con una puerta en arco.
 *   1,9–2,9 s las dos hojas de la puerta giran hacia dentro y detrás, en
 *          la cal, están los nombres: el mismo arco que la portada.
 *   3,4 s  el orquestador cierra la capa (`duracionMs`).
 *
 * Server Component sin estado: arranca cuando la capa se hace visible.
 * Las piezas leen `--acento`, `--azulejo-2` y `--papel`, así que la puerta
 * sale del color de la variante de la pareja.
 */
const ANCHO = 300;
const ALTO = 400;
const LADO = 40;
const ARCO = "M60 400V170a90 90 0 0 1 180 0V400Z";
const CENTRO = { x: 130, y: 220 };

function retraso(x: number, y: number) {
  const d = Math.hypot(x - CENTRO.x, y - CENTRO.y);
  return Math.round(200 + d * 4.6);
}

function Piezas({ desde = 0, hasta = ANCHO }: { desde?: number; hasta?: number }) {
  const out = [];
  for (let y = 0; y < ALTO; y += LADO) {
    for (let x = 0; x < ANCHO; x += LADO) {
      if (x + LADO <= desde || x >= hasta) continue;
      out.push(
        <g key={`${x}-${y}`} className="ap-az-pieza" style={{ animationDelay: `${retraso(x, y)}ms` }}>
          <PiezaAzulejo x={x} y={y} />
        </g>,
      );
    }
  }
  return out;
}

export default function EscenaAzulejo({ inv }: { inv: Invitacion }) {
  const t = resolverTokens(inv.plantilla, inv.tema);
  const { a, b } = inv.pareja;
  return (
    <div
      className={`ap-azulejo ${azulejoDisplay.variable} ${azulejoTexto.variable}`}
      style={variablesCss(t) as React.CSSProperties}
    >
      <div className="ap-az-marco">
        {/* El marco: todas las piezas menos el hueco de la puerta. */}
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <mask id="ap-az-hueco">
              <rect width={ANCHO} height={ALTO} fill="#fff" />
              <path d={ARCO} fill="#000" />
            </mask>
          </defs>
          <g mask="url(#ap-az-hueco)">
            <Piezas />
          </g>
        </svg>

        {/* Lo que hay detrás de la puerta. */}
        <div className="ap-az-dentro">
          <p className="ap-az-nombres">
            <span className="block">{a}</span>
            <span className="block text-[0.55em] not-italic">y</span>
            <span className="block">{b}</span>
          </p>
          <p className="mt-3 text-[1.0625rem]">{formatearFecha(inv.pareja.fecha, { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>

        {/* Las dos hojas: el mismo panel recortado al arco, partido en dos. */}
        <div className="ap-az-hoja ap-az-izq">
          <svg viewBox={`60 80 90 320`} preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
            <defs>
              <clipPath id="ap-az-arco-i">
                <path d={ARCO} />
              </clipPath>
            </defs>
            <g clipPath="url(#ap-az-arco-i)">
              <Piezas desde={60} hasta={150} />
            </g>
          </svg>
        </div>
        <div className="ap-az-hoja ap-az-der">
          <svg viewBox={`150 80 90 320`} preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
            <defs>
              <clipPath id="ap-az-arco-d">
                <path d={ARCO} />
              </clipPath>
            </defs>
            <g clipPath="url(#ap-az-arco-d)">
              <Piezas desde={150} hasta={240} />
            </g>
          </svg>
        </div>
      </div>

      <style>{`
        .ap-azulejo {
          position: absolute; inset: 0; overflow: hidden;
          display: grid; place-items: center;
          background: var(--papel); color: var(--tinta);
          font-family: var(--texto);
          --azulejo-2: #d9a441;
          --azulejo-3: var(--tinta);
        }
        .ap-az-marco {
          position: relative; width: min(92vw, 30rem, 66svh); aspect-ratio: 3 / 4;
          perspective: 1100px;
        }
        .ap-az-pieza {
          transform-box: fill-box; transform-origin: center;
          animation: ap-az-tesela 680ms cubic-bezier(.22,.61,.36,1) both;
        }
        .ap-az-dentro {
          position: absolute; left: 20%; right: 20%; top: 30%; bottom: 6%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
        }
        .ap-az-nombres {
          font-family: var(--display); font-style: italic; font-weight: 500;
          font-size: clamp(2.1rem, 11vw, 4.4rem); line-height: .95;
        }
        .ap-az-hoja {
          position: absolute; top: 20%; bottom: 0; width: 30%;
          backface-visibility: hidden;
          animation: ap-az-abre 1000ms 1900ms cubic-bezier(.6,0,.2,1) both;
        }
        .ap-az-izq { left: 20%; transform-origin: 0 50%; --giro: -104deg; }
        .ap-az-der { left: 50%; transform-origin: 100% 50%; --giro: 104deg; }
        @keyframes ap-az-tesela {
          from { transform: scale(.6) rotate(24deg); opacity: 0; }
          to   { transform: none; opacity: 1; }
        }
        @keyframes ap-az-abre {
          from { transform: rotateY(0); }
          to   { transform: rotateY(var(--giro)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ap-az-pieza { animation: none; }
          .ap-az-hoja { display: none; }
        }
      `}</style>
    </div>
  );
}

export const DURACION_AZULEJO_MS = 3400;
