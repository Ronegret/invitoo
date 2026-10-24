import { Cinzel, Manrope } from "next/font/google";
import { Despedida, Secciones, type Props } from "./comun";
import { CitaGrande } from "./vida";
import { datosPortada } from "./datos-portada";
import Lienzo from "./Lienzo";
import { Filete } from "./ornamentos";

/**
 * VELO — boda de etiqueta, urbana o de palacio (absorbe Lino y Bruma).
 *
 * Tipografía: Cinzel, capitulares romanas de inscripción —se escriben
 * espaciadas, como un grabado— + Manrope. Fondo: piedra, perla o champán,
 * neutros sin calidez de cuaderno. Ornamento: doble filete con rombo.
 * Portada: la foto a pantalla completa con un VELO del color del papel que
 * cae desde arriba y deja los nombres grabados encima. Orden: sin hashtag,
 * sin álbum, sin playlist (si la pareja los pone, van a «Y además»).
 */
const display = Cinzel({
  subsets: ["latin"],
  variable: "--p-display",
  display: "swap",
  preload: false,
});
const texto = Manrope({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="relative min-h-[100svh] overflow-hidden">
      {d.foto && (
        /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
        <img
          src={d.foto}
          alt={`${d.a} y ${d.b}`}
          width={1100}
          height={1400}
          fetchPriority="high"
          className="foto-entra absolute inset-0 h-full w-full object-cover object-[50%_70%] md:object-[50%_32%]"
        />
      )}
      {/* El velo: el papel cae desde arriba y se vuelve transparente. */}
      <span
        aria-hidden
        className="velo-caida absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--papel) 0%, var(--papel) 34%, color-mix(in srgb, var(--papel) 82%, transparent) 50%, transparent 74%)",
        }}
      />
      {/* El momento: dos capas de tul que se mecen despacio sobre la foto. */}
      <span aria-hidden className="velo-tul capa-1 wow decor" />
      <span aria-hidden className="velo-tul capa-2 wow decor" />
      <div className="relative z-[1] px-6 pt-[max(3.5rem,env(safe-area-inset-top))] text-center">
        <p className="text-[1.0625rem] tracking-[0.08em] opacity-85 first-letter:uppercase">{d.fechaLarga}</p>
        <h1 className="display asienta vt-nombres mt-6 text-[clamp(2.4rem,11vw,4.4rem)] leading-[1.08] tracking-[0.08em]">
          {d.a}
          <Filete ancho={110} className="mx-auto my-3 block text-[var(--acento-texto)]" />
          {d.b}
        </h1>
        <p className="mt-5 text-[1.0625rem]">
          {d.lugar}, a las {d.hora}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-[1] px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center">
        <a
          href="#confirmar"
          className="inline-flex min-h-14 items-center bg-[var(--papel)] px-9 text-[1.0625rem] tracking-[0.06em] text-[var(--tinta)]"
        >
          Confirmar asistencia
        </a>
      </div>
    </header>
  );
}

/** Las clases de next/font de esta plantilla (también las usa el <main>). */
export const fuentes = `${display.variable} ${texto.variable}`;

export default function Velo(props: Props) {
  const d = datosPortada(props);
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <CitaGrande frase={d.frase} firma={`${d.a} y ${d.b}`} />
      <Secciones {...props} opciones={{ tonos: { dressCode: "velo", capitulos: "velo", notas: "velo", cuentaAtras: "hondo" } }} />
      <Despedida inv={props.inv} ornamento="filete" />
    </Lienzo>
  );
}
