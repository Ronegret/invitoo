import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { Regalos } from "@/components/bloques/Simples";
import { horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { Enfoca } from "../vida";
import { HERO_TEMATICO } from "./catalogo";
import CifrasFinas from "./CifrasFinas";
import { GuionEscenas } from "./escenas";
import { fuentesAire } from "./fuentes/aire";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import "./tematicas.css";
import "./aire.css";

/**
 * AIRE (Elegancia pura) — sobria, mucho blanco, una sola animación por pantalla.
 *
 * Paleta: blanco roto #fdfcfa, tinta #1b1a18 y oro (o plata, u oro rosa)
 * SOLO en filetes de 1 px. Tipografía: Italiana (display) + Cormorant
 * Garamond a 20 px.
 *
 * El guion:
 *  1. Apertura: el vídeo en blanco y negro (ramo) con los nombres.
 *  2. Cabecera: la pantalla en blanco; una línea de oro baja por el centro
 *     y dibuja vuestro monograma; la pantalla se abre en dos por esa línea y
 *     aparece vuestro vídeo, enmarcado en un filete de oro. Debajo, los
 *     nombres. Es lo único que se mueve en esta pantalla.
 *  3. El día: un filete vertical se dibuja al bajar y une las horas.
 *  4. La cuenta atrás: cifras finas que se enfocan al cambiar.
 *  5. Cómo vestir: círculos de 1 px con cada color.
 *  6. Un detalle: el marco de oro se cierra alrededor de los datos.
 */

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO_TEMATICO.aire;
}

function sitio(direccion?: string) {
  const t = (direccion ?? "").split(",").map((s) => s.trim().replace(/^\d{5}\s*/, "")).filter(Boolean);
  return t.at(-1) ?? "";
}

/** El monograma: dos iniciales a cada lado de la línea, en un círculo de 1 px. */
function Monograma({ a, b, className = "" }: { a: string; b: string; className?: string }) {
  return (
    <svg className={`pu-mono ${className}`} viewBox="0 0 200 200" aria-hidden="true">
      <circle className="pu-mono-aro" cx="100" cy="100" r="92" pathLength={1} />
      <line className="pu-mono-eje" x1="100" y1="34" x2="100" y2="166" pathLength={1} />
      <text className="pu-mono-l" x="78" y="122" textAnchor="middle">{a}</text>
      <text className="pu-mono-l" x="122" y="122" textAnchor="middle">{b}</text>
    </svg>
  );
}

function Portada(props: Props) {
  const d = datosPortada(props);
  const a = d.a.charAt(0);
  const b = d.b.charAt(0);
  return (
    <>
      <header className="k-hero pu-hero">
        <div className="pu-ventana">
          <HeroVideo fuente={fuenteHero(props)} clase="grad-aire" etiqueta="Ver el vídeo" />
          <span className="pu-marco" aria-hidden="true" />
        </div>
        <div className="pu-rotulo k-hero-sale">
          <Monograma a={a} b={b} className="pu-mono-chico" />
          <p className="pu-antes">Nos casamos</p>
          <h1 className="pu-nombres display" style={{ fontSize: d.tamNombres(2.6, 14, 0.42, 4.6) }}>
            <span className="block">{d.a}</span>
            <span className="pu-y">&amp;</span>
            <span className="block">{d.b}</span>
          </h1>
          <p className="pu-fecha tabular-nums" aria-label={d.fechaLarga}>
            {d.numerica.replace(/\./g, " · ").replace(/ · (\d\d)$/, ` · ${d.anio}`)}
          </p>
          <p className="pu-lugar">
            {d.lugar}
            {d.ciudad && <> · {d.ciudad}</>}
          </p>
        </div>
        {/* El telón: la línea de oro, el monograma y las dos hojas que se
            abren. Decorativo (aria-hidden) y sin eventos: no tapa ni un
            toque. Con «menos movimiento» no existe. */}
        <div className="pu-telon wow" aria-hidden="true">
          <span className="pu-hoja izq" />
          <span className="pu-hoja der" />
          <span className="pu-linea" />
          <Monograma a={a} b={b} className="pu-mono-telon" />
        </div>
      </header>

      {d.frase && (
        <section className="pu-frase k-ancho" aria-label="Unas palabras de los novios">
          <blockquote className="display">
            <Enfoca texto={d.frase} />
          </blockquote>
        </section>
      )}
    </>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="pu-titulo">
      {antes && <p className="pu-antes">{antes}</p>}
      <h2 className="display">{children}</h2>
    </div>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;

function ElDia({ x, inv }: { x: Itin; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="pu-seccion">
        <Titulo antes="Cuándo y dónde">{x.titulo ?? "El día"}</Titulo>
        <ol className="pu-linea-tiempo k-ancho" data-k-escena="">
          {x.paradas.map((p) => (
            <li key={p.titulo + p.hora}>
              <span className="pu-hora display tabular-nums">{p.hora}</span>
              <span className="pu-que">{p.titulo}</span>
              <span className="pu-donde">
                {p.lugar}
                {sitio(p.direccion) && <> · {sitio(p.direccion)}</>}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <ComoLlegar destinos={destinosDe(x.paradas)} centrado />
      <Calendario
        slug={inv.slug}
        a={inv.pareja.a}
        b={inv.pareja.b}
        inicio={primera ? horaDelDia(fecha, primera.hora) : fecha}
        lugar={primera ? [primera.lugar, primera.direccion].filter(Boolean).join(", ") : undefined}
      />
    </>
  );
}

function Cuenta({ fecha }: { fecha: string }) {
  return (
    <section className="pu-seccion pu-cuenta">
      <Titulo antes="Faltan">Hasta el sí</Titulo>
      <CifrasFinas hasta={fecha} />
    </section>
  );
}

function Vestir({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="pu-seccion">
      <Titulo antes="Dress code">Cómo vestir</Titulo>
      <ul className="pu-paleta" data-k-escena="" aria-label="Colores sugeridos">
        {paleta.map((c, i) => (
          <li key={c + i} style={{ "--c": c, "--i": i } as React.CSSProperties}>
            <span className="sr-only">{c}</span>
          </li>
        ))}
      </ul>
      <p className="pu-nota k-ancho">{nota}</p>
    </section>
  );
}

function Detalle(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="pu-detalle k-ancho" data-k-escena="">
      <span className="pu-detalle-marco" aria-hidden="true" />
      <Regalos {...x} />
    </div>
  );
}

export const fuentes = fuentesAire;

export default function Aire(props: Props) {
  const { b, inv } = props;
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <Secciones
        {...props}
        opciones={{
          itinerario: "lista",
          piezas: {
            itinerario: itin && <ElDia x={itin} inv={inv} />,
            cuentaAtras: b("cuentaAtras") && <Cuenta fecha={inv.pareja.fecha} />,
            dressCode: dress && <Vestir {...dress} />,
            regalos: regalos && <Detalle {...regalos} />,
          },
        }}
      />
      <Despedida inv={inv} ornamento="filete" />
      <GuionEscenas />
    </Lienzo>
  );
}
