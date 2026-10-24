import { EB_Garamond, Playfair_Display } from "next/font/google";
import { Guirnalda } from "@/components/flores";
import { Despedida, Secciones, Y, type Props } from "./comun";
import { datosPortada } from "./datos-portada";
import Lienzo from "./Lienzo";
import { Filete, Lacre } from "./ornamentos";

/**
 * SOBRE — boda clásica, ceremonia religiosa, invitados de todas las edades.
 *
 * Tipografía: Playfair Display (titulares, cursiva para los nombres) +
 * EB Garamond (cuerpo). Fondo: papel crema con grano. Ornamento: el lacre
 * granate con las iniciales. Portada: una CARTULINA con doble filete, como
 * la que sale del sobre de la apertura; la foto va debajo, como la que se
 * mete dentro. Orden: el de una invitación de papel —la hora de la misa
 * nada más abrir, confirmar antes que la historia—.
 *
 * Las fuentes se cargan aquí y solo aquí, sin precarga: el navegador
 * descarga una familia cuando la ve pintada, así que una boda de Registro
 * no baja ni un byte de Playfair.
 */
const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--p-display",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});
const texto = EB_Garamond({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="px-4 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="sobre-cartulina relative mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-[34rem] flex-col items-center justify-center px-7 pb-[clamp(7rem,30vw,9rem)] pt-[clamp(7rem,32vw,9rem)] text-center">
        {/* El momento: peonías que florecen alrededor de los nombres, en
            media luna (arriba a la izquierda, abajo a la derecha). */}
        <Guirnalda esquina="sup-izq" tamano="min(56vw, 250px)" densidad="plena" className="sobre-peonias arriba" />
        <Guirnalda esquina="sup-der" tamano="min(30vw, 140px)" densidad="ligera" className="sobre-peonias arriba-der" />
        <Guirnalda esquina="inf-der" tamano="min(46vw, 210px)" className="sobre-peonias abajo" />
        <Guirnalda esquina="inf-izq" tamano="min(28vw, 130px)" densidad="ligera" className="sobre-peonias abajo-izq" />
        <p className="text-[1.0625rem] italic opacity-85">Nos casamos</p>
        <h1 className="display asienta vt-nombres mt-8 text-[clamp(3.2rem,15vw,5.4rem)] italic leading-[1.02]">
          {d.a}
          <Y bloque className="my-2 text-[0.42em]" />
          {d.b}
        </h1>
        <Filete className="mt-8 block text-[var(--acento-texto)]" />
        <p className="mt-7 text-[1.25rem] first-letter:uppercase">{d.fechaLarga}</p>
        <p className="mt-1 text-[1.125rem] opacity-85">
          a las {d.hora}, {d.lugar}
        </p>
        {d.frase && (
          <p className="mx-auto mt-7 max-w-[24rem] text-[1.125rem] leading-[1.7] opacity-90">{d.frase}</p>
        )}
        <Lacre iniciales={d.iniciales} size={84} className="mt-10 drop-shadow-[0_6px_10px_rgba(60,10,15,.25)]" />
        <a
          href="#confirmar"
          className="mt-8 inline-flex min-h-14 items-center border border-current/40 px-8 text-[1.0625rem] transition-colors hover:border-current"
          style={{ borderRadius: "var(--radio)" }}
        >
          Confirmar asistencia
        </a>
      </div>
      {d.foto && (
        /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
        <img
          src={d.foto}
          alt={`${d.a} y ${d.b}`}
          width={1100}
          height={733}
          loading="lazy"
          className="foto-entra mx-auto mt-12 aspect-[4/5] w-[86%] max-w-[30rem] -rotate-1 border-[10px] border-white object-cover shadow-[0_18px_40px_-22px_rgba(40,20,10,.55)]"
        />
      )}
    </header>
  );
}

/** Las clases de next/font de esta plantilla (también las usa el <main>). */
export const fuentes = `${display.variable} ${texto.variable}`;

export default function Sobre(props: Props) {
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <Secciones
        {...props}
        opciones={{
          respiro: "Y ahora, si os apetece, un poco de nosotros.",
          tonos: { cuentaAtras: "hondo", notas: "velo", capitulos: "velo", regalos: "velo" },
        }}
      />
      <Despedida inv={props.inv} ornamento="lacre" />
    </Lienzo>
  );
}
