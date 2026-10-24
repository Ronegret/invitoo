import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import { formatearFecha, horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { GuionEscenas } from "./escenas";
import { fuentesOrilla } from "./fuentes/orilla";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import OrillaMarea from "./OrillaMarea";
import OrillaOndas from "./OrillaOndas";
import "./tematicas.css";
import "./orilla.css";

/**
 * ORILLA (Playa y mar) — K2, docs/16a §7.
 *
 * Arena blanca #F7F4EE, azul de profundidad #0F2F3A, turquesa hondo
 * #0E6973 y el turquesa de agua somera (#7FCFCB) solo en las acuarelas.
 * Bellefair para los nombres, Nunito Sans a 18 px para leer y Allura
 * (de 32 px para arriba) para la firma en la arena.
 *
 * El guion:
 *  1. Cabecera: el vídeo termina en una ola de acuarela que se funde con
 *     la arena del papel. Los nombres, sobre el agua; la fecha, ya en la
 *     arena, con dos conchas que se dibujan. EL MOMENTO, «La resaca»: al
 *     bajar, la ola se retira hacia arriba y deja la invitación en la arena.
 *  2. La historia en mensajes dentro de una botella, que llegan flotando.
 *  3. La ola que pasa página: una banda de acuarela cruza la pantalla.
 *  4. El lugar escrito en la arena, con huellas que se acercan; la marea
 *     de la cuenta atrás sube a medida que se acerca el día.
 *  5. Boyas para el programa, guijarros pintados para el dress code, una
 *     caja de conchas para los regalos y un RSVP en azul profundo.
 *  6. Al tocar, ondas de agua.
 */

const HERO: FuenteVideo = {
  vertical: "/tematicas/orilla/hero-v.mp4",
  horizontal: "/tematicas/orilla/hero-h.mp4",
  poster: "/tematicas/orilla/poster-v.avif",
  posterHorizontal: "/tematicas/orilla/poster-h.avif",
  webm: "/tematicas/orilla/hero-v.webm",
  webmHorizontal: "/tematicas/orilla/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function Ola({ className = "" }: { className?: string }) {
  return (
    <svg className={`ol-ola ${className}`} viewBox="0 0 200 20" aria-hidden="true">
      <path d="M2 12 C22 2 38 2 52 10 S82 18 100 10 S134 2 148 10 S178 18 198 8" pathLength={1} />
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="ol-titulo" data-k-escena="">
      {antes && <p className="ol-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Ola />
    </div>
  );
}

function Concha({ className = "" }: { className?: string }) {
  return (
    <svg className={`ol-concha ${className}`} viewBox="0 0 40 36" aria-hidden="true">
      <path pathLength={1} d="M20 33 C8 30 2 20 4 12 C8 4 32 4 36 12 C38 20 32 30 20 33 Z M20 33 L10 8 M20 33 L16 6 M20 33 L24 6 M20 33 L30 8 M20 33 L5 15 M20 33 L35 15" />
    </svg>
  );
}

function Estrella({ className = "" }: { className?: string }) {
  return (
    <svg className={`ol-estrella ${className}`} viewBox="0 0 40 40" aria-hidden="true">
      <path pathLength={1} d="M20 3 C22 12 24 15 37 15 C27 21 26 24 31 36 C23 29 17 29 9 36 C14 24 13 21 3 15 C16 15 18 12 20 3 Z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="k-hero ol-hero">
      <div className="ol-mar">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-orilla" etiqueta="Ver el vídeo">
          <span className="ol-velo" aria-hidden="true" />
        </HeroVideo>
        <div className="ol-sobre-agua k-hero-sale">
          <p className="ol-lema">Nos casamos a la orilla del mar</p>
          <h1 className="ol-nombres vt-nombres" style={{ fontSize: d.tamNombres(3, 15, 0.42, 5.2) }}>
            <span className="block">{d.a}</span>
            <span className="ol-y">y</span>
            <span className="block">{d.b}</span>
          </h1>
        </div>
      </div>
      <div className="ol-arena">
        <Concha className="c1" />
        <p className="ol-fecha">{mayuscula(d.fechaLarga)}</p>
        {d.lugar && <p className="ol-lugar">{d.lugar}{d.ciudad && d.ciudad !== d.lugar ? ` · ${d.ciudad}` : ""}</p>}
        <Estrella className="c2" />
        <a href="#k-inicio" className="k-baja ol-baja">
          Bajad a la orilla
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </div>
    </header>
  );
}

// ──────────────────────────────────────── mensajes en una botella

type Caps = Extract<Bloque, { t: "capitulos" }>;

function Botellas({ x }: { x: Caps }) {
  return (
    <section id="k-inicio" className="ol-seccion" aria-label={x.titulo ?? "Nuestra historia"}>
      <Titulo antes="Mensajes en una botella">{x.titulo ?? "Nuestra historia"}</Titulo>
      <ol className="ol-mensajes">
        {x.capitulos.map((c, i) => (
          <li key={c.titulo} className="ol-mensaje" data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
            <svg className="ol-botella" viewBox="0 0 30 60" aria-hidden="true">
              <path d="M11 2 H19 V12 C19 16 26 18 26 26 V54 C26 57 24 58 22 58 H8 C6 58 4 57 4 54 V26 C4 18 11 16 11 12 Z" />
              <path d="M10 30 H20 V46 H10 Z" className="ol-botella-papel" />
              <rect x="10.5" y="0" width="9" height="5" rx="1.5" className="ol-botella-corcho" />
            </svg>
            <div className="ol-mensaje-papel">
              {c.cuando && <p className="ol-cuando">{c.cuando}</p>}
              <h3 className="ol-cap">{c.titulo}</h3>
              {c.foto && (
                /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
                <img className="ol-mensaje-foto" src={c.foto} alt="" width={480} height={320} loading="lazy" decoding="async" />
              )}
              <p className="ol-texto">{c.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** La ola que pasa página: una banda de acuarela que cruza de derecha a izquierda. */
function OlaPasa() {
  return (
    <div className="ol-pasa" aria-hidden="true">
      <span />
    </div>
  );
}

// ──────────────────────────────── escrito en la arena + la marea

function Huellas() {
  const pie = "M8 2 C12 2 14 8 13 14 C12 20 10 24 7 24 C4 24 3 20 3 15 C3 8 4 2 8 2 Z";
  return (
    <svg className="ol-huellas" viewBox="0 0 120 220" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => {
        const izq = i % 2 === 0;
        return (
          <g key={i} transform={`translate(${izq ? 34 : 70} ${190 - i * 34}) rotate(${izq ? -8 : 8})`} className="ol-huella" style={{ "--i": i } as React.CSSProperties}>
            <path d={pie} />
            <circle cx="3" cy="-3" r="2" /><circle cx="7" cy="-4.5" r="2" /><circle cx="11" cy="-3.6" r="1.8" />
          </g>
        );
      })}
    </svg>
  );
}

function EnLaArena({ inv, x }: { inv: Props["inv"]; x?: Extract<Bloque, { t: "itinerario" }> }) {
  const primera = x?.paradas[0];
  return (
    <>
      <section className="ol-seccion ol-escrito" aria-label="Cuándo y dónde">
        <Titulo antes="Cuándo y dónde">Escrito en la arena</Titulo>
        <div className="ol-arena-escena">
          <Huellas />
          <div className="ol-arena-texto" data-k-escena="">
            <p className="ol-arena-dia display">{formatearFecha(inv.pareja.fecha, { day: "numeric", month: "long" })}</p>
            <p className="ol-arena-larga">
              {mayuscula(formatearFecha(inv.pareja.fecha, { weekday: "long" }))} · {formatearFecha(inv.pareja.fecha, { year: "numeric" })}
              {primera && <> · a las {primera.hora}</>}
            </p>
            {primera && (
              <p className="ol-arena-lugar">
                <strong>{primera.lugar}</strong>
                <span className="block">{primera.direccion}</span>
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="ol-seccion ol-seccion-marea" aria-label="Cuenta atrás">
        <Titulo antes="Sube la marea">Faltan</Titulo>
        <div data-k-escena="">
          <OrillaMarea hasta={inv.pareja.fecha} />
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────────── boyas (programa)

function Boyas({ x, inv }: { x: Extract<Bloque, { t: "itinerario" }>; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="ol-seccion">
        <Titulo antes={formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" })}>{x.titulo ?? "El día"}</Titulo>
        <ol className="ol-boyas k-ancho">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
              <span className="ol-boya" aria-hidden="true">
                <svg viewBox="0 0 30 40"><path d="M15 2 V10" /><path d="M5 22 C5 13 25 13 25 22 L23 32 H7 Z" /><path d="M6 25 H24" className="ol-boya-banda" /><path d="M2 36 C8 33 12 39 18 36 S26 33 28 36" className="ol-boya-agua" /></svg>
              </span>
              <span className="ol-boya-hora tabular-nums">{p.hora}</span>
              <span className="ol-boya-que">{p.titulo}</span>
              <span className="ol-boya-donde">{p.lugar}</span>
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

// ──────────────────────────────────────── guijarros pintados (dress)

const FORMAS = ["52% 48% 44% 56% / 58% 46% 54% 42%", "46% 54% 58% 42% / 50% 58% 42% 50%", "58% 42% 50% 50% / 44% 52% 48% 56%", "50% 50% 42% 58% / 56% 44% 56% 44%"];

function Guijarros({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="ol-seccion">
      <Titulo antes="Dress code">Descalzos y de lino</Titulo>
      <ul className="ol-guijarros" aria-label="Colores sugeridos">
        {paleta.map((c, i) => (
          <li key={c + i} style={{ "--c": c, "--i": i, borderRadius: FORMAS[i % FORMAS.length] } as React.CSSProperties}>
            <span className="sr-only">{c}</span>
          </li>
        ))}
      </ul>
      <p className="ol-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

// ────────────────────────────────────── caja de conchas (regalos)

function CajaConchas(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="ol-regalo">
      <div className="ol-regalo-conchas" data-k-escena="" aria-hidden="true">
        <Concha />
        <Estrella />
        <Concha />
      </div>
      <Regalos {...x} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesOrilla;

export default function Orilla(props: Props) {
  const { b, inv } = props;
  const caps = b("capitulos");
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  const rsvp = b("rsvp");
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <OrillaOndas />
      <Portada {...props} />
      {!caps && <div id="k-inicio" />}
      <Secciones
        {...props}
        opciones={{
          piezas: {
            capitulos: caps && <Botellas x={caps} />,
            respiro: <OlaPasa />,
            cuentaAtras: b("cuentaAtras") && <EnLaArena inv={inv} x={itin} />,
            itinerario: itin && <Boyas x={itin} inv={inv} />,
            dressCode: dress && <Guijarros {...dress} />,
            regalos: regalos && <CajaConchas {...regalos} />,
            rsvp: rsvp && (
              <div className="ol-rsvp">
                <p className="ol-antes">Contadnos si venís</p>
                {rsvp.limite && <LimiteRsvp limite={rsvp.limite} motivo={rsvp.motivoLimite} />}
                <Rsvp slug={inv.slug} {...rsvp} />
              </div>
            ),
          },
          tonos: { cuentaAtras: "velo", rsvp: "hondo", album: "velo" },
        }}
      />
      <div className="ol-despedida">
        <Despedida
          inv={inv}
          ornamento="ola"
          flor={
            <div className="ol-cierre-conchas" aria-hidden="true">
              <Concha />
              <Estrella />
            </div>
          }
        />
        <span className="ol-moja" aria-hidden="true" />
      </div>
      <GuionEscenas />
    </Lienzo>
  );
}
