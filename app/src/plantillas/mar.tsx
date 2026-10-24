import CuentaPortada from "@/components/bloques/CuentaPortada";
import { Italiana, Jost } from "next/font/google";
import { Alojamiento, Despedida, Secciones, Y, type Props } from "./comun";
import { datosPortada } from "./datos-portada";
import Lienzo from "./Lienzo";

/**
 * MAR — boda de playa o de destino (absorbe Cielo y Marea).
 *
 * Tipografía: Italiana, una didone de trazo finísimo y muy abierta, que en
 * grande se lee como un horizonte + Jost, geométrica y clara. Fondo: bruma
 * marina; la variante Arena lo pasa a arena seca. Ornamento: una ola de
 * línea. Portada: la foto arriba y el mar cortándola con una ola; debajo,
 * una franja de arena con el destino escrito en grande. Orden: ALOJAMIENTO
 * EN SEGUNDO LUGAR, porque quien coge un avión necesita saber dónde duerme.
 */
const display = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-display",
  display: "swap",
  preload: false,
});
const texto = Jost({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="relative">
      <div className="relative h-[44svh] min-h-[17rem] w-full md:h-[56svh] md:min-h-[22rem] overflow-hidden bg-[color-mix(in_srgb,var(--acento)_30%,var(--papel))]">
        {d.foto && (
          /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
          <img
            src={d.foto}
            alt={`${d.a} y ${d.b}`}
            width={1100}
            height={1400}
            fetchPriority="high"
            className="foto-entra respira-lento absolute inset-x-0 top-0 h-[calc(100%-52px)] w-full object-cover object-[50%_80%]"
          />
        )}
        {/* El momento: el mar al pie de la foto. Tres capas de olas que se
            desplazan a distinto ritmo y, encima, la luz que rompe en el agua
            (brillos que ondean, un barrido de sol y chispas). Solo transform
            y opacity; con «menos movimiento», el mar quieto. */}
        <span aria-hidden className="mar-agua wow decor">
          <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="mar-ola-1">
            <path d="M0 34c33.3 -20 66.7 -20 100 0c33.3 20 66.7 20 100 0c33.3 -20 66.7 -20 100 0c33.3 20 66.7 20 100 0c33.3 -20 66.7 -20 100 0c33.3 20 66.7 20 100 0c33.3 -20 66.7 -20 100 0c33.3 20 66.7 20 100 0V120H0Z" />
          </svg>
          <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="mar-ola-2">
            <path d="M0 52c33.3 -14 66.7 -14 100 0c33.3 14 66.7 14 100 0c33.3 -14 66.7 -14 100 0c33.3 14 66.7 14 100 0c33.3 -14 66.7 -14 100 0c33.3 14 66.7 14 100 0c33.3 -14 66.7 -14 100 0c33.3 14 66.7 14 100 0V120H0Z" />
          </svg>
          <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="mar-ola-3">
            <path d="M0 74c26.7 -10 53.3 -10 80 0c26.7 10 53.3 10 80 0c26.7 -10 53.3 -10 80 0c26.7 10 53.3 10 80 0c26.7 -10 53.3 -10 80 0c26.7 10 53.3 10 80 0c26.7 -10 53.3 -10 80 0c26.7 10 53.3 10 80 0c26.7 -10 53.3 -10 80 0c26.7 10 53.3 10 80 0V120H0Z" />
          </svg>
          <span className="mar-reflejo">
            <span className="mar-brillos" />
            <span className="mar-barrido" />
            <span className="mar-chispas" />
          </span>
        </span>
        <svg
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="mar-ola absolute inset-x-0 bottom-[-1px] h-10 w-full"
        >
          <path d="M0 22c50-18 100-18 150 0s100 18 150 0 70-14 100-6V40H0Z" fill="var(--papel)" />
          <path d="M0 30c50-14 100-14 150 0s100 14 150 0 70-10 100-4" fill="none" stroke="var(--acento)" strokeOpacity=".5" strokeWidth="1.2" />
        </svg>
      </div>
      <div className="px-6 pb-16 pt-6 text-center">
        {d.ciudad && (
          <p className="text-[1.125rem] tracking-[0.12em] text-[var(--acento-texto)]">{d.ciudad}</p>
        )}
        <h1 className="display asienta vt-nombres mt-3 text-[clamp(3.3rem,16vw,5.8rem)] leading-[0.95]">
          {d.a}
          <Y bloque className="my-1 text-[0.5em]" />
          {d.b}
        </h1>
        <CuentaPortada hasta={props.inv.pareja.fecha} estilo="filete" antes="" className="mt-6" />
        <div className="mx-auto mt-8 flex max-w-[22rem] items-center justify-between border-y border-current/25 py-4 text-[1.125rem]">
          <span className="first-letter:uppercase">{d.fechaCorta}</span>
          <span className="tabular-nums">{d.hora}</span>
        </div>
        {d.frase && (
          <p className="mx-auto mt-7 max-w-[25rem] text-[1.125rem] leading-[1.7] opacity-90">{d.frase}</p>
        )}
        <div className="mt-9 flex flex-col items-center gap-3">
          <a
            href="#confirmar"
            className="inline-flex min-h-14 items-center bg-[var(--acento)] px-9 text-[1.0625rem] text-[var(--sobre-acento)]"
          >
            Confirmar asistencia
          </a>
          {props.b("alojamiento") && (
            <a href="#donde-dormir" className="inline-flex min-h-12 items-center text-[1.0625rem] underline decoration-current/40 underline-offset-4">
              Dónde dormir
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

/** Las clases de next/font de esta plantilla (también las usa el <main>). */
export const fuentes = `${display.variable} ${texto.variable}`;

export default function Mar(props: Props) {
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <Secciones
        {...props}
        opciones={{
          itinerario: "lista",
          galeria: "tira",
          tonos: { alojamiento: "velo", cuentaAtras: "hondo", rsvp: "velo", playlist: "velo" },
          piezas: { alojamiento: <AlojamientoAncla {...props} /> },
        }}
      />
      <Despedida inv={props.inv} ornamento="ola" />
    </Lienzo>
  );
}


/** El alojamiento con ancla, para el enlace «Dónde dormir» de la portada. */
function AlojamientoAncla({ b }: Props) {
  const x = b("alojamiento");
  if (!x) return null;
  return (
    <div id="donde-dormir" className="scroll-mt-10">
      <Alojamiento {...x} />
    </div>
  );
}
