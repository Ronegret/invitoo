import CuentaPortada from "@/components/bloques/CuentaPortada";
import { Figtree, Fraunces } from "next/font/google";
import { Florecer } from "@/components/flores";
import { Despedida, Secciones, Y, type Props } from "./comun";
import { datosPortada } from "./datos-portada";
import Lienzo from "./Lienzo";

/**
 * FLORACIÓN — boda de campo o de jardín (absorbe Jardín, Terracota y Brasa).
 *
 * Tipografía: Fraunces con el eje SOFT al máximo —una serif blanda, de
 * tinta que se corre— + Figtree. Fondo: papel verde muy pálido, o barro en
 * la variante Brasa. Ornamento: ramas de línea que se dibujan solas.
 * Portada: la foto dentro de un ARCO de invernadero, con dos ramas de olivo
 * creciendo por los lados. Orden: la historia primero, porque en el campo
 * hay tiempo; el itinerario justo después.
 */
const display = Fraunces({
  subsets: ["latin"],
  variable: "--p-display",
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});
const texto = Figtree({
  subsets: ["latin"],
  variable: "--p-texto",
  display: "swap",
  preload: false,
});

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="relative overflow-hidden px-6 pb-20 pt-[max(2rem,env(safe-area-inset-top))] text-center">
      <div className="relative mx-auto w-[min(78%,34svh)] max-w-[22rem]">
        <div className="floracion-arco aspect-[3/4] w-full overflow-hidden bg-[color-mix(in_srgb,var(--acento)_18%,var(--papel))]">
          {d.foto && (
            /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
            <img
              src={d.foto}
              alt={`${d.a} y ${d.b}`}
              width={900}
              height={1200}
              fetchPriority="high"
              className="foto-entra respira-lento h-full w-full object-cover"
            />
          )}
        </div>
      </div>
      {/* El momento: cuatro ramas nacen en los bordes de la pantalla y
          crecen hacia los nombres; al acabar, abre el azahar. */}
      <Florecer variante="olivo" alCargar retraso={200} tamano="min(48vw, 230px)" densidad="plena" className="floracion-rama izq-1" />
      <Florecer variante="azahar" alCargar retraso={900} tamano="min(28vw, 120px)" className="floracion-rama izq-2" />
      <Florecer variante="eucalipto" alCargar retraso={500} lado="derecha" tamano="min(46vw, 220px)" densidad="plena" className="floracion-rama der-1" />
      <Florecer variante="peonia" alCargar retraso={1200} lado="derecha" tamano="min(26vw, 110px)" className="floracion-rama der-2" />
      <h1 className="display asienta vt-nombres mt-8 text-[clamp(3rem,14vw,5rem)] leading-[1]">
        {d.a} <Y signo="&" /> {d.b}
      </h1>
      <p className="mt-5 text-[1.125rem] first-letter:uppercase">{d.fechaLarga}</p>
      <p className="mt-1 text-[1.0625rem] opacity-80">{d.lugar}</p>
      <CuentaPortada hasta={props.inv.pareja.fecha} estilo="punto" className="mt-6" />
      {d.frase && (
        <p className="mx-auto mt-6 max-w-[25rem] text-[1.125rem] leading-[1.7] opacity-90">{d.frase}</p>
      )}
      <a
        href="#confirmar"
        className="mt-9 inline-flex min-h-14 items-center bg-[var(--acento)] px-9 text-[1.0625rem] text-[var(--sobre-acento)]"
        style={{ borderRadius: "var(--radio)" }}
      >
        Confirmar asistencia
      </a>
    </header>
  );
}

/** Las clases de next/font de esta plantilla (también las usa el <main>). */
export const fuentes = `${display.variable} ${texto.variable}`;

export default function Floracion(props: Props) {
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <Secciones {...props} opciones={{ tonos: { capitulos: "velo", notas: "velo", playlist: "hondo" } }} />
      <Despedida inv={props.inv} ornamento="rama" />
    </Lienzo>
  );
}
