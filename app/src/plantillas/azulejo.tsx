import CuentaPortada from "@/components/bloques/CuentaPortada";
import { Despedida, Secciones, Y, type Props } from "./comun";
import { datosPortada } from "./datos-portada";
import { azulejoDisplay as display, azulejoTexto as texto } from "./fuentes/azulejo";
import Lienzo from "./Lienzo";
import { Cenefa, PiezaAzulejo } from "./ornamentos";

/**
 * AZULEJO — boda mediterránea de verano. NUEVA.
 *
 * Tipografía: Cormorant Garamond (cursiva para los nombres, como una
 * rotulación de cerámica pintada a mano) + DM Sans. Fondo: cal #FBF8F2.
 * Paleta: cobalto #1F4E9C, ocre #D9A441 y buganvilla #B23A6E; la variante
 * elige cuál manda. Ornamento: una cenefa de azulejo en SVG que se tiñe con
 * las variables, así que la cenefa cambia con la variante.
 * Portada: una PUERTA de azulejos —el arco hecho de piezas— con los nombres
 * dentro, en la cal. Es el último fotograma de su apertura (aperturas/
 * Azulejo.tsx): la puerta se tesela y se abre, y detrás está esto.
 */
/** El arco de azulejos: un panel de piezas al que se le recorta la puerta. */
export function PuertaAzulejo({
  className,
  id = "puerta",
  vivo = false,
}: {
  className?: string;
  id?: string;
  /** Las teselas giran en ola (el momento de la portada). */
  vivo?: boolean;
}) {
  const piezas = [];
  for (let y = 0; y < 400; y += 40) for (let x = 0; x < 300; x += 40) piezas.push([x, y]);
  return (
    <svg viewBox="0 0 300 400" className={`${vivo ? "puerta-viva wow" : ""} ${className ?? ""}`} aria-hidden="true">
      <defs>
        <mask id={`${id}-hueco`}>
          <rect width="300" height="400" fill="#fff" />
          <path d="M60 400V170a90 90 0 0 1 180 0V400Z" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id}-hueco)`}>
        {piezas.map(([x, y]) => (
          <PiezaAzulejo key={`${x}-${y}`} x={x} y={y} gira={vivo ? Math.round((x + (400 - y)) * 2.2) : undefined} />
        ))}
      </g>
      <path d="M60 400V170a90 90 0 0 1 180 0V400" fill="none" stroke="var(--acento)" strokeWidth="3" />
      <rect x="1.5" y="1.5" width="297" height="397" fill="none" stroke="var(--acento)" strokeWidth="3" />
    </svg>
  );
}

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="pb-16 pt-[max(1.5rem,env(safe-area-inset-top))] text-center">
      <div className="relative mx-auto aspect-[3/4] w-[min(92vw,30rem,45svh)]">
        {/* El momento: las teselas llegan girando, en ola desde abajo, y
            cada pocos segundos dan un cuarto de vuelta. */}
        <PuertaAzulejo className="absolute inset-0 h-full w-full" id="puerta-portada" vivo />
        <div className="absolute inset-x-[22%] bottom-[6%] top-[30%] flex flex-col items-center justify-center">
          <p className="text-[1.0625rem] tracking-[0.06em] text-[var(--acento-texto)]">Nos casamos</p>
          <h1
            className="display asienta vt-nombres mt-3 italic leading-[0.95]"
            style={{ fontSize: d.tamNombres(2.1, 13, 0.85, 4.6) }}
          >
            <span className="block">{d.a}</span>
            <Y bloque className="my-1 text-[0.55em]" />
            <span className="block">{d.b}</span>
          </h1>
          <p className="mt-4 text-[1.0625rem] font-medium first-letter:uppercase">{d.fechaCorta}</p>
        </div>
      </div>
      <div className="px-6">
        <CuentaPortada hasta={props.inv.pareja.fecha} estilo="rombo" antes="" className="mt-7" />
        <p className="mt-8 text-[1.125rem]">
          A las {d.hora}, {d.lugar}
          {d.ciudad && <span className="block opacity-80">{d.ciudad}</span>}
        </p>
        {d.frase && (
          <p className="mx-auto mt-6 max-w-[25rem] text-[1.125rem] leading-[1.7] opacity-90">{d.frase}</p>
        )}
        <a
          href="#confirmar"
          className="mt-9 inline-flex min-h-14 items-center bg-[var(--acento)] px-9 text-[1.0625rem] font-medium text-[var(--sobre-acento)]"
          style={{ borderRadius: "var(--radio)" }}
        >
          Confirmar asistencia
        </a>
      </div>
    </header>
  );
}

/** Las clases de next/font de esta plantilla (también las usa el <main>). */
export const fuentes = `${display.variable} ${texto.variable}`;

export default function Azulejo(props: Props) {
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <Cenefa piezas={12} alto={26} className="block w-full" />
      <Portada {...props} />
      <Secciones
        {...props}
        opciones={{
          galeria: "sangre",
          respiro: undefined,
          tonos: { cuentaAtras: "hondo", historia: "velo", notas: "velo", playlist: "velo" },
        }}
      />
      <Despedida inv={props.inv} ornamento="cenefa" />
      <Cenefa piezas={12} alto={26} className="block w-full" />
    </Lienzo>
  );
}
