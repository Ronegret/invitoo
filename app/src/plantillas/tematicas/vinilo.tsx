import CuentaPortada from "@/components/bloques/CuentaPortada";
import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import { horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, Y, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { GuionEscenas } from "./escenas";
import { fuentesVinilo } from "./fuentes/vinilo";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import MusicaRsvp from "./MusicaRsvp";
import { ViniloCuenta, ViniloDisco } from "./ViniloPiezas";
import "./tematicas.css";
import "./musicales.css";
import "./vinilo.css";

/**
 * CARA A (Rock & Roll) — K4. docs/16b §2.
 *
 * El objeto noble: la funda de un LP de 180 g con estampación en seco, no
 * calaveras ni llamas. Negro vinilo #111011, marfil de funda #eee8df, rojo de
 * luz de escenario (acento, corregido a texto por el sistema) y cromo de
 * micro antiguo en filetes. Actitud, pero con traje.
 *
 * El guion:
 *  1. Cabecera: vuestro vídeo en blanco y negro con un contraluz rojo.
 *  2. La funda: al bajar, el LP sale de ella hacia la derecha.
 *     MOMENTO WOW · tocadlo: acelera a 33⅓ rpm y suena un segundo.
 *  3. Tracklist de nuestra historia: la pista del centro lleva ecualizador.
 *  4. La contraportada (cuenta atrás) con el brazo del tocadiscos.
 *  5. El setlist del día, en una tira de papel con cinta; cada hora se subraya.
 *  6. Rock elegante: tres púas que giran hasta su sitio.
 *  7. Se apagan las luces: un solo foco acompaña al scroll hasta la firma.
 */

// Metraje provisional: public/aperturas/velo (la falda que gira), en B/N y
// con el rojo de escenario en CSS. Lo sustituye el vídeo de los novios.
const HERO: FuenteVideo = {
  vertical: "/tematicas/vinilo/hero-v.mp4",
  horizontal: "/tematicas/vinilo/hero-h.mp4",
  poster: "/tematicas/vinilo/poster-v.avif",
  posterHorizontal: "/tematicas/vinilo/poster-h.avif",
  webm: "/tematicas/vinilo/hero-v.webm",
  webmHorizontal: "/tematicas/vinilo/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** El surco: tres arcos concéntricos de vinilo. */
function Surco({ className = "" }: { className?: string }) {
  return (
    <svg className={`vi-surco ${className}`} viewBox="0 0 120 24" aria-hidden="true">
      <path d="M8 22a52 52 0 0 1 104 0" />
      <path d="M22 22a38 38 0 0 1 76 0" />
      <path d="M36 22a24 24 0 0 1 48 0" />
      <circle cx="60" cy="22" r="3" />
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="vi-titulo" data-k-escena="">
      {antes && <p className="vi-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Surco />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <>
      <header className="k-hero vi-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-vinilo" etiqueta="Ver el vídeo">
          <span className="vi-tinte" aria-hidden="true" />
        </HeroVideo>
        <div className="vi-rotulo k-hero-sale">
          <p className="vi-cara">Cara A</p>
          <h1 className="vi-nombres display vt-nombres" style={{ fontSize: d.tamNombres(3.2, 15, 0.46, 5.6) }}>
            <span className="block">{d.a}</span>
            <Y className="vi-y" />
            <span className="block">{d.b}</span>
          </h1>
          <p className="vi-directo">
            <span>En directo</span> · {mayuscula(d.fechaLarga)}
            {d.lugar && <span className="block">{d.lugar}</span>}
          </p>
          <CuentaPortada hasta={d.fechaIso} estilo="dos-puntos" className="k-cuenta vinilo-cuenta" />
          <a href="#k-inicio" className="k-baja vi-baja">
            Sacad el disco
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </a>
        </div>
      </header>

      {/* La funda y el LP: el disco sale al bajar; un toque y suena. */}
      <section id="k-inicio" className="vi-funda-escena" aria-label="El disco">
        <div className="vi-funda-marco">
          <div className="vi-disco-carril">
            <ViniloDisco iniciales={`${d.a.charAt(0)}${d.b.charAt(0)}`} />
          </div>
          <div className="vi-funda" aria-hidden="true">
            <span className="vi-funda-aro" />
            <span className="vi-funda-mono">{d.a.charAt(0)}{d.b.charAt(0)}</span>
          </div>
        </div>
        <p className="vi-funda-t display">
          {d.a} <span className="vi-y">y</span> {d.b}
        </p>
        <p className="vi-funda-sub">LP · {d.anio} · Edición única</p>
        <p className="vi-toca">Tocad el disco</p>
        {d.frase && <blockquote className="vi-frase display">{d.frase}</blockquote>}
      </section>
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

type Caps = Extract<Bloque, { t: "capitulos" }>;

function Tracklist({ titulo, capitulos }: Caps) {
  return (
    <section className="vi-seccion">
      <Titulo antes="Nuestra historia">{titulo ?? "Tracklist"}</Titulo>
      <ol className="vi-tracks k-ancho">
        {capitulos.map((c, i) => (
          <li key={c.titulo} data-k-escena="">
            <span className="vi-track-n tabular-nums" aria-hidden="true">{dos(i + 1)}</span>
            <div className="vi-track-cuerpo">
              <h3 className="display">
                {c.titulo}
                <span className="vi-eq" aria-hidden="true"><i /><i /><i /></span>
              </h3>
              {c.cuando && <p className="vi-track-cuando">{c.cuando}</p>}
              <p className="vi-track-texto">{c.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
const dos = (n: number) => String(n).padStart(2, "0");

function Contraportada({ fecha }: { fecha: string }) {
  return (
    <section className="vi-seccion vi-cuenta">
      <Titulo antes="Cara B">Lo que falta</Titulo>
      <ViniloCuenta hasta={fecha} />
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;

function Setlist({ x, inv }: { x: Itin; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="vi-seccion">
        <Titulo antes="Cuándo y dónde">{x.titulo ?? "Setlist"}</Titulo>
        <div className="vi-setlist" data-k-escena="">
          <span className="vi-cinta a" aria-hidden="true" />
          <span className="vi-cinta b" aria-hidden="true" />
          <ol>
            {x.paradas.map((p) => (
              <li key={p.titulo + p.hora}>
                <span className="vi-set-hora display tabular-nums">
                  {p.hora}
                  <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M2 5 C25 2 55 7 98 3" pathLength={1} />
                  </svg>
                </span>
                <span className="vi-set-que">{p.titulo}</span>
                <span className="vi-set-donde">{p.lugar}</span>
              </li>
            ))}
          </ol>
        </div>
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

function Puas({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="vi-seccion">
      <Titulo antes="Dress code">Rock elegante</Titulo>
      <ul className="vi-puas" aria-hidden="true">
        {paleta.map((c, i) => (
          <li key={c + i} style={{ "--c": c, "--i": i } as React.CSSProperties}>
            <svg viewBox="0 0 40 46">
              <path d="M20 44 C9 34 2 22 2 12 C2 5 10 2 20 2 C30 2 38 5 38 12 C38 22 31 34 20 44 Z" />
              <path className="vi-pua-brillo" d="M10 9 C14 6 24 6 29 8" />
            </svg>
          </li>
        ))}
      </ul>
      {paleta.length > 0 && <p className="sr-only">Colores sugeridos: {paleta.join(", ")}.</p>}
      <p className="vi-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function CaraB(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="vi-carab k-ancho" data-k-escena="">
      <p className="vi-carab-cab" aria-hidden="true">Cara B · Créditos</p>
      <Regalos {...x} />
    </div>
  );
}

function Lleno({ a, b }: { a: string; b: string }) {
  return (
    <div className="vi-lleno-escena" aria-hidden="true">
      <span className="vi-lleno">
        <span>Lleno absoluto</span>
        <span className="vi-lleno-sub">{a} y {b} · en directo</span>
      </span>
    </div>
  );
}

function Confirmar({ x, inv, d }: { x: Extract<Bloque, { t: "rsvp" }>; inv: Props["inv"]; d: ReturnType<typeof datosPortada> }) {
  return (
    <>
      {x.limite && <LimiteRsvp limite={x.limite} motivo={x.motivoLimite} />}
      <MusicaRsvp slug={inv.slug} efecto="vinilo" frase="Te guardamos sitio junto al escenario{n}" arriba={<Lleno a={d.a} b={d.b} />}>
        <Rsvp slug={inv.slug} {...x} />
      </MusicaRsvp>
    </>
  );
}

/** Se apagan las luces: un foco que acompaña al scroll. */
function Foco() {
  return (
    <section className="vi-foco" aria-label="Fin de la cara A">
      <span className="vi-foco-luz" aria-hidden="true" />
      <p className="vi-foco-t display">Y ahora, la cara B</p>
      <p className="vi-foco-sub">La escribimos juntos. Con vosotros en primera fila.</p>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesVinilo;

export default function Vinilo(props: Props) {
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
            capitulos: caps && <Tracklist {...caps} />,
            cuentaAtras: b("cuentaAtras") && <Contraportada fecha={inv.pareja.fecha} />,
            itinerario: itin && <Setlist x={itin} inv={inv} />,
            dressCode: dress && <Puas {...dress} />,
            regalos: regalos && <CaraB {...regalos} />,
            rsvp: rsvp && <Confirmar x={rsvp} inv={inv} d={d} />,
          },
          tonos: { cuentaAtras: "hondo", alojamiento: "velo" },
        }}
      />
      <Foco />
      <Despedida inv={inv} ornamento="punto" flor={<Surco className="vi-surco-cierre" />} />
      <GuionEscenas />
    </Lienzo>
  );
}
