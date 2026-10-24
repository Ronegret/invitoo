import { Marcellus, Outfit } from "next/font/google";
import { Despedida, Secciones, type Props } from "./comun";
import { datosPortada } from "./datos-portada";
import InicialesEstrellas from "./estrellas";
import Lienzo from "./Lienzo";
import { Estrella } from "./ornamentos";

/**
 * CONSTELACIÓN — boda de noche, moderna.
 *
 * Tipografía: Marcellus, romana de inscripción con remate abierto, que
 * brilla en claro sobre oscuro + Outfit. Fondo: AZUL NOCHE DE VERDAD
 * (#0E1428), con una capa de estrellas en CSS (tres gradientes repetidos,
 * cero imágenes, cero JS). Oro con contraste AA calculado. Ornamento:
 * estrella de cuatro puntas. Portada: las dos alianzas dibujadas como una
 * constelación, punto a punto, encima de los nombres; la foto entra como
 * una luna pequeña. Orden: empieza por la fiesta, la historia de madrugada.
 */
const display = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--p-display",
  display: "swap",
  preload: false,
});
const texto = Outfit({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});

/** Dos anillos de estrellas que se tocan: las alianzas como constelación. */
function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 py-16 text-center">
      {/* El momento: las estrellas se encienden y dibujan vuestras iniciales. */}
      <InicialesEstrellas a={d.a} b={d.b} />
      <p className="mt-8 text-[1.125rem] tracking-[0.1em] text-[var(--acento-texto)] first-letter:uppercase">
        {d.fechaLarga}
      </p>
      <h1 className="display asienta vt-nombres mt-5 text-[clamp(3rem,14vw,5.4rem)] leading-[1.02]">
        {d.a}
        <Estrella size={18} className="mx-auto my-3 block text-[var(--acento-texto)]" />
        {d.b}
      </h1>
      <p className="mt-6 text-[1.125rem] opacity-90">
        Desde las {d.hora}, {d.lugar}
      </p>
      {d.frase && <p className="mx-auto mt-5 max-w-[24rem] text-[1.125rem] leading-[1.7] opacity-85">{d.frase}</p>}
      <a
        href="#confirmar"
        className="mt-9 inline-flex min-h-14 items-center bg-[var(--acento)] px-9 text-[1.0625rem] text-[var(--sobre-acento)]"
        style={{ borderRadius: "var(--radio)" }}
      >
        Confirmar asistencia
      </a>
      {d.foto && (
        /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
        <img
          src={d.foto}
          alt={`${d.a} y ${d.b}`}
          width={600}
          height={600}
          loading="lazy"
          className="foto-entra mt-14 aspect-square w-40 rounded-full object-cover ring-1 ring-[var(--acento)]/50 ring-offset-8 ring-offset-[var(--papel)]"
        />
      )}
    </header>
  );
}

/** Las clases de next/font de esta plantilla (también las usa el <main>). */
export const fuentes = `${display.variable} ${texto.variable}`;

export default function Constelacion(props: Props) {
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <div aria-hidden className="cielo-estrellas" />
      <Portada {...props} />
      <Secciones
        {...props}
        opciones={{ itinerario: "lista", galeria: "tira", tonos: { cuentaAtras: "hondo", dressCode: "velo", rsvp: "velo" } }}
      />
      <Despedida inv={props.inv} ornamento="estrella" />
    </Lienzo>
  );
}
