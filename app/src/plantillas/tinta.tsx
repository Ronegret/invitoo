import CuentaPortada from "@/components/bloques/CuentaPortada";
import { Geist, Instrument_Serif } from "next/font/google";
import { Despedida, Secciones, type Props } from "./comun";
import { CitaGrande } from "./vida";
import { datosPortada } from "./datos-portada";
import Lienzo from "./Lienzo";

/**
 * TINTA — boda mínima, en blanco y negro.
 *
 * Tipografía: Instrument Serif, condensada y de contraste alto, a un tamaño
 * que ocupa el ancho de la pantalla + Geist, neutra. Fondo: papel blanco
 * roto con el grano más marcado del catálogo, como un papel de algodón.
 * Ornamento: un punto de tinta, nada más. Portada: SOLO TIPOGRAFÍA —los dos
 * nombres enormes, una gota y la fecha—; la foto, en blanco y negro, debajo.
 * Orden: seis secciones. Lo demás, si la pareja lo rellena, compacto al
 * final: quitar no es esconder.
 */
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
const texto = Geist({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="tinta-portada px-5 pb-20 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="flex min-h-[86svh] flex-col justify-center text-center">
        <h1 className="display asienta vt-nombres leading-[0.86] tracking-[-0.03em]" style={{ fontSize: d.tamNombres(2.6, 26, 0.42) }}>
          <span className="block">{d.a}</span>
          {/* El momento: la gota cae, se posa y la tinta se expande por el
              papel en una mancha de bordes vivos, con dos ondas. */}
          <span className="tinta-gota wow mx-auto my-5 block h-4 w-4 rounded-full bg-[var(--tinta)]" aria-hidden>
            <span className="tinta-mancha">
              <svg viewBox="-100 -100 200 200" focusable="false">
                <defs>
                  <filter id="tinta-borde" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" />
                    <feDisplacementMap in="SourceGraphic" scale="16" />
                  </filter>
                  <radialGradient id="tinta-fondo">
                    <stop offset="0" stopColor="currentColor" stopOpacity=".09" />
                    <stop offset=".62" stopColor="currentColor" stopOpacity=".06" />
                    <stop offset=".86" stopColor="currentColor" stopOpacity=".1" />
                    <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle r="58" fill="url(#tinta-fondo)" filter="url(#tinta-borde)" />
              </svg>
            </span>
            <span className="tinta-onda" style={{ "--o": 0 } as React.CSSProperties} />
            <span className="tinta-onda" style={{ "--o": 1 } as React.CSSProperties} />
          </span>
          <span className="block italic">{d.b}</span>
        </h1>
        <p className="mt-10 text-[1.125rem] first-letter:uppercase">{d.fechaLarga}</p>
        <p className="mt-1 text-[1.0625rem] opacity-80">
          {d.hora}, {d.lugar}
        </p>
        <CuentaPortada hasta={props.inv.pareja.fecha} estilo="filete" antes="" className="mt-8" />
        <a
          href="#confirmar"
          className="mx-auto mt-10 inline-flex min-h-14 items-center border-b-2 border-current px-2 text-[1.125rem]"
        >
          Confirmar asistencia
        </a>
      </div>
      {d.foto && (
        /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
        <img
          src={d.foto}
          alt={`${d.a} y ${d.b}`}
          width={900}
          height={900}
          loading="lazy"
          className="mx-auto mt-6 aspect-square w-full max-w-[26rem] object-cover grayscale"
        />
      )}
    </header>
  );
}

/** Las clases de next/font de esta plantilla (también las usa el <main>). */
export const fuentes = `${display.variable} ${texto.variable}`;

export default function Tinta(props: Props) {
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <CitaGrande frase={datosPortada(props).frase} firma={`${props.inv.pareja.a} y ${props.inv.pareja.b}`} />
      <Secciones {...props} opciones={{ itinerario: "lista", tonos: { cuentaAtras: "hondo", notas: "velo" } }} />
      <Despedida inv={props.inv} ornamento="punto" />
    </Lienzo>
  );
}
