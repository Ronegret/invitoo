import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import { formatearFecha, horaDelDia, partesMadrid } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, Y, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { Enfoca } from "../vida";
import { EstadioGol, EstadioGrada, EstadioMarcador } from "./EstadioPiezas";
import { GuionEscenas } from "./escenas";
import { fuentesEstadio } from "./fuentes/estadio";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import "./tematicas.css";
import "./estadio.css";

/**
 * NOCHE DE ESTADIO (Fútbol) — K5. docs/16b §7.
 *
 * El objeto noble: la entrada de abono grabada en relieve y el programa
 * de una final. Cartulina, cal y oro de trofeo; el color 1 y el color 2
 * son los de vuestro equipo (acento y acento2, sin escudos ni nombres de
 * club). Barlow Condensed + Barlow + Libre Caslon en cursiva para la «y».
 *
 * El guion:
 *  1. Cabecera: el césped al atardecer, «La final» y vuestros nombres.
 *     Debajo sube la entrada en relieve; al bajar, la luz cambia de lado.
 *  2. El marcador: la cuenta atrás en paletas abatibles.
 *  3. «Historial de partidos», unidos por una línea de cal que se traza.
 *  4. «Puerta 7»: los cuatro focos se encienden y el programa del partido.
 *  5. La alineación: vosotros dos en el círculo central.
 *  6. «Equipación»: el dress code en camisetas lisas.
 *  7. RSVP: ¡gol! (el momento wow). 8. La grada hace la ola.
 */

const fuente: FuenteVideo = {
  vertical: "/aperturas/marea/vertical.mp4",
  horizontal: "/aperturas/marea/horizontal.mp4",
  poster: "/tematicas/estadio/poster-v.avif",
  posterHorizontal: "/tematicas/estadio/poster-h.avif",
  webm: "/tematicas/estadio/hero-v.webm",
  webmHorizontal: "/tematicas/estadio/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return fuente;
}

function sitio(direccion?: string) {
  const t = (direccion ?? "").split(",").map((s) => s.trim().replace(/^\d{5}\s*/, "")).filter(Boolean);
  return t.at(-1) ?? "";
}

/** La línea de medio campo con su círculo central: el ornamento. */
function Cal({ className = "" }: { className?: string }) {
  return (
    <svg className={`es-cal ${className}`} viewBox="0 0 160 30" aria-hidden="true">
      <path pathLength={1} d="M0 15 H64 M96 15 H160" />
      <circle pathLength={1} cx="80" cy="15" r="13" />
      <circle cx="80" cy="15" r="2.2" className="es-cal-punto" />
    </svg>
  );
}

/** El escudo propio: vuestras iniciales en un sello circular con la fecha. */
function Escudo({ a, b, fecha }: { a: string; b: string; fecha: string }) {
  return (
    <svg className="es-escudo" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id="es-arco-b" d="M16 60 A44 44 0 0 0 104 60" />
      </defs>
      <circle cx="60" cy="60" r="56" className="es-escudo-aro" />
      <circle cx="60" cy="60" r="47" className="es-escudo-fino" />
      <text className="es-escudo-ini" x="60" y="72" textAnchor="middle">
        {a}
        <tspan className="es-escudo-y">y</tspan>
        {b}
      </text>
      <text className="es-escudo-arco">
        <textPath href="#es-arco-b" startOffset="50%" textAnchor="middle">{fecha}</textPath>
      </text>
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="es-titulo" data-k-escena="">
      {antes && <p className="es-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Cal />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  const p = partesMadrid(props.inv.pareja.fecha);
  const fecha = d.numerica.replace(/(\d\d)$/, String(d.anio));
  return (
    <>
      <header className="k-hero es-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-estadio" etiqueta="Ver el vídeo">
          <span className="es-velo" aria-hidden="true" />
        </HeroVideo>
        <div className="es-rotulo k-hero-sale">
          <p className="es-final">La final</p>
          <h1 className="es-nombres display" style={{ fontSize: d.tamNombres(3, 18, 0.5, 6.4) }}>
            <span>{d.a}</span> <Y className="es-y" /> <span>{d.b}</span>
          </h1>
          <p className="es-datos tabular-nums">
            <span className="sr-only">{d.fechaLarga}. </span>
            <span aria-hidden="true">{fecha}</span> · Saque inicial {d.hora}
            {d.lugar && <span className="block">{d.lugar}</span>}
          </p>
        </div>
        <a href="#es-entrada" className="k-baja es-baja">
          Vuestra entrada
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </header>

      {/* La entrada de abono en relieve. La luz cambia de lado con el scroll. */}
      <section id="es-entrada" className="es-entrada-zona" aria-label="Vuestra entrada">
        <div className="es-entrada" data-k-escena="">
          <div className="es-entrada-cuerpo">
            <p className="es-entrada-tipo">Entrada · Final</p>
            <p className="es-entrada-nombres">
              {d.a} <span className="es-y">y</span> {d.b}
            </p>
            <dl className="es-entrada-datos tabular-nums">
              <div><dt>Puerta</dt><dd>7</dd></div>
              <div><dt>Fila</dt><dd>{String(p.mes).padStart(2, "0")}</dd></div>
              <div><dt>Asiento</dt><dd>{String(p.dia).padStart(2, "0")}</dd></div>
            </dl>
            <p className="es-entrada-cuando first-letter:uppercase">{d.fechaLarga} · {d.hora}</p>
          </div>
          <div className="es-entrada-talon" aria-hidden="true">
            <Escudo a={d.a.charAt(0)} b={d.b.charAt(0)} fecha={d.numerica} />
          </div>
        </div>
        {d.frase && (
          <blockquote className="es-frase display k-ancho">
            <Enfoca texto={d.frase} />
          </blockquote>
        )}
      </section>
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

function Historial({ titulo, capitulos }: Extract<Bloque, { t: "capitulos" }>) {
  return (
    <section className="es-seccion">
      <Titulo antes="Nuestra historia">{titulo ?? "Historial de partidos"}</Titulo>
      <ol className="es-historial k-ancho">
        {capitulos.map((c, i) => (
          <li key={c.titulo} className="es-ficha" data-k-escena="">
            <p className="es-ficha-n">Partido {i + 1}{c.cuando && <> · {c.cuando}</>}</p>
            <h3 className="display">{c.titulo}</h3>
            <p>{c.texto}</p>
            {c.foto && (
              // eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado
              <img className="es-ficha-foto" src={c.foto} alt="" width={600} height={750} loading="lazy" decoding="async" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;
const TIEMPOS = ["Saque inicial", "Descanso", "Segunda parte", "Prórroga", "Tiempo de descuento", "Penaltis"];

function PuertaSiete({ x, inv }: { x: Itin; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="es-seccion es-puerta">
        <div className="es-focos" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="es-foco-torre" style={{ "--i": i } as React.CSSProperties}>
              <i /><i /><i /><i /><i /><i />
            </span>
          ))}
        </div>
        <Titulo antes={formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" })}>{x.titulo ?? "Puerta 7"}</Titulo>
        <ol className="es-programa k-ancho">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} data-k-escena="">
              <span className="es-programa-hora display tabular-nums">{p.hora}</span>
              <span className="es-programa-que">
                <span className="es-programa-tiempo">{TIEMPOS[Math.min(i, TIEMPOS.length - 1)]}</span>
                <span className="es-programa-t">{p.titulo}</span>
                <span className="es-programa-l">
                  {p.lugar}
                  {sitio(p.direccion) && <> · {sitio(p.direccion)}</>}
                </span>
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

/**
 * La alineación. El bloque `alineacion` (docs/16b §7.4) aún no existe en
 * los datos: mientras tanto, la pareja juntos en el círculo central y la
 * leyenda «Y en la grada: vosotros».
 */
function Alineacion({ a, b }: { a: string; b: string }) {
  return (
    <section className="es-seccion es-alineacion">
      <Titulo antes="La alineación">Los novios</Titulo>
      <div className="es-campo" data-k-escena="" aria-hidden="true">
        <svg viewBox="0 0 200 300" className="es-campo-lineas">
          <rect pathLength={1} x="8" y="8" width="184" height="284" rx="2" />
          <path pathLength={1} d="M8 150 H192" />
          <circle pathLength={1} cx="100" cy="150" r="34" />
          <path pathLength={1} d="M58 8 V52 H142 V8 M58 292 V248 H142 V292" />
          <path pathLength={1} d="M80 8 V22 H120 V8 M80 292 V278 H120 V292" />
        </svg>
        <span className="es-jugador uno"><b>{a.charAt(0)}</b><span>{a}</span></span>
        <span className="es-jugador dos"><b>{b.charAt(0)}</b><span>{b}</span></span>
      </div>
      <p className="es-grada-leyenda display">Y en la grada: vosotros</p>
      <p className="sr-only">La alineación: {a} y {b}, de delanteros centro. Y en la grada, vosotros.</p>
    </section>
  );
}

function Equipacion({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="es-seccion">
      <Titulo antes="Dress code">Equipación</Titulo>
      {paleta.length > 0 && (
        <ul className="es-camisetas" aria-label="Colores sugeridos">
          {paleta.map((c, i) => (
            <li key={c + i} data-k-escena="" style={{ "--c": c, "--i": i } as React.CSSProperties}>
              <svg viewBox="0 0 60 56" aria-hidden="true">
                <path d="M30 4 L22 4 L6 12 L2 26 L12 29 L14 22 L14 52 L46 52 L46 22 L48 29 L58 26 L54 12 L38 4 Q34 10 30 10 Q26 10 22 4" />
              </svg>
              <span className="sr-only">{c}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="es-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function Gol({ slug, x }: { slug: string; x: Extract<Bloque, { t: "rsvp" }> }) {
  return (
    <EstadioGol slug={slug}>
      {x.limite && <LimiteRsvp limite={x.limite} motivo={x.motivoLimite} />}
      <Rsvp slug={slug} {...x} />
    </EstadioGol>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesEstadio;

export default function EstadioPlantilla(props: Props) {
  const { b, inv } = props;
  const d = datosPortada(props);
  const itin = b("itinerario");
  const caps = b("capitulos");
  const dress = b("dressCode");
  const regalos = b("regalos");
  const rsvp = b("rsvp");
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <Secciones
        {...props}
        opciones={{
          piezas: {
            cuentaAtras: b("cuentaAtras") && (
              <section className="es-marcador-zona">
                <EstadioMarcador hasta={inv.pareja.fecha} a={d.a} b={d.b} />
              </section>
            ),
            capitulos: caps && <Historial {...caps} />,
            itinerario: itin && (
              <>
                <PuertaSiete x={itin} inv={inv} />
                <Alineacion a={d.a} b={d.b} />
              </>
            ),
            dressCode: dress && <Equipacion {...dress} />,
            regalos: regalos && <Regalos {...regalos} titulo={regalos.titulo ?? "Fichajes"} />,
            rsvp: rsvp && <Gol slug={inv.slug} x={rsvp} />,
          },
          tonos: { alojamiento: "velo", notas: "velo", album: "velo" },
        }}
      />
      <section className="es-cierre" aria-label="La grada">
        <EstadioGrada />
        <p className="es-cierre-pista">Tocad la grada y haced la ola</p>
      </section>
      <Despedida inv={inv} ornamento="regla" flor={<Cal className="es-cal-cierre" />} />
      <GuionEscenas />
    </Lienzo>
  );
}
