import { partesMadrid } from "@/lib/fecha";
import SelloRegistro from "./aperturas/SelloRegistro";
import { Despedida, Secciones, Y, type Props } from "./comun";
import { datosPortada } from "./datos-portada";
import { registroFuente as fuente } from "./fuentes/registro";
import Lienzo from "./Lienzo";

/**
 * REGISTRO — boda civil urbana. NUEVA.
 *
 * Tipografía: Inter Tight y solo Inter Tight —grotesca suiza, 650 en
 * titulares con interletra negativa, 400 en cuerpo—. Fondo: blanco puro y
 * grafito, sin grano: papel de oficina, no de cuaderno. Acento: el que
 * elija la pareja (lima, naranja o azul eléctrico) SOLO como superficie;
 * como texto se usa su versión AA (`--acento-texto`). Ornamento: una
 * regla gruesa. Todo alineado a la izquierda.
 * Portada: una ficha de registro —nombres en grande, y debajo fecha, hora y
 * lugar como un formulario—, con el sello ya estampado en la esquina.
 * Apertura: sin vídeo, el sello cayendo (aperturas/Registro.tsx).
 */

function Portada(props: Props) {
  const d = datosPortada(props);
  const p = partesMadrid(props.inv.pareja.fecha);
  const fechaSello = `${String(p.dia).padStart(2, "0")}.${String(p.mes).padStart(2, "0")}.${p.anio}`;
  return (
    <header className="relative mx-auto flex min-h-[100svh] max-w-[40rem] flex-col justify-between px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))] text-left">
      <div className="relative flex items-start justify-between border-b-2 border-current pb-3 text-[1.0625rem] font-medium">
        <span>Boda civil</span>
        <span className="tabular-nums">{d.numerica}</span>
        {/* El acento que se mueve: una cinta de color bajo el membrete. */}
        <span aria-hidden className="registro-cinta wow decor absolute inset-x-0 -bottom-[10px] m-0" />
      </div>

      <div className="relative isolate py-10">
        {/* El momento: el sello cae con tinta y deja su salpicadura. */}
        <svg aria-hidden viewBox="0 0 100 100" className="registro-tinta wow -right-6 -top-8 h-[190px] w-[190px]">
          <path
            fill="currentColor"
            d="M50 8c7 0 9 8 15 9s12-6 17-1-2 12 2 17 13 4 13 11-9 7-10 13 7 12 2 17-12-1-17 3-4 14-11 14-8-9-14-10-12 7-17 2 1-12-3-17-14-4-14-11 9-7 10-13-7-12-2-17 12 1 17-3 5-14 12-14Z"
          />
          <circle cx="94" cy="20" r="3" fill="currentColor" />
          <circle cx="8" cy="84" r="2.2" fill="currentColor" />
          <circle cx="86" cy="92" r="1.6" fill="currentColor" />
        </svg>
        <SelloRegistro
          id="sello-portada"
          a={d.a}
          b={d.b}
          fecha={fechaSello}
          hora={d.hora}
          size={150}
          className="registro-sello-fijo wow absolute -right-2 -top-4 rotate-[-12deg] text-[var(--acento-texto)] opacity-90"
        />
        <h1
          className="display asienta vt-nombres relative leading-[0.88]"
          style={{ fontSize: d.tamNombres(3, 22, 0.56, 7.5) }}
        >
          <span className="block">{d.a}</span>
          <span className="block">
            <Y /> <span className="registro-marca wow">{d.b}</span>
          </span>
        </h1>
        {d.frase && <p className="mt-8 max-w-[28rem] text-[1.1875rem] leading-[1.55]">{d.frase}</p>}
      </div>

      <div>
        <dl className="grid grid-cols-[6.5rem_1fr] border-t border-current/30 text-[1.125rem]">
          <dt className="border-b border-current/20 py-3 opacity-75">Fecha</dt>
          <dd className="border-b border-current/20 py-3 first-letter:uppercase">{d.fechaLarga}</dd>
          <dt className="border-b border-current/20 py-3 opacity-75">Hora</dt>
          <dd className="border-b border-current/20 py-3 tabular-nums">{d.hora}</dd>
          <dt className="border-b border-current/20 py-3 opacity-75">Lugar</dt>
          <dd className="border-b border-current/20 py-3">{d.lugar}</dd>
          {d.ciudad && (
            <>
              <dt className="border-b border-current/20 py-3 opacity-75">Ciudad</dt>
              <dd className="border-b border-current/20 py-3">{d.ciudad}</dd>
            </>
          )}
        </dl>
        <a
          href="#confirmar"
          className="mt-6 flex min-h-14 w-full items-center justify-between bg-[var(--acento)] px-5 text-[1.125rem] font-semibold text-[var(--sobre-acento)]"
        >
          <span>Confirmar asistencia</span>
          <span aria-hidden className="text-[1.4rem] leading-none">↓</span>
        </a>
      </div>
    </header>
  );
}

/** Las clases de next/font de esta plantilla (también las usa el <main>). */
export const fuentes = fuente.variable;

export default function Registro(props: Props) {
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <Secciones {...props} opciones={{
          itinerario: "ficha",
          galeria: "tira",
          alineado: "izquierda",
          tonos: { notas: "velo", alojamiento: "velo", cuentaAtras: "hondo" },
        }} />
      <Despedida inv={props.inv} ornamento="regla" alineado="izquierda" />
    </Lienzo>
  );
}
