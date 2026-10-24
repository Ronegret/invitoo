import CuentaPortada from "@/components/bloques/CuentaPortada";
import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import { formatearFecha, horaDelDia, partesMadrid } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { GuionEscenas } from "./escenas";
import { fuentesMemorias } from "./fuentes/memorias";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import MemoriasInstantaneas, { type Instantanea } from "./MemoriasInstantaneas";
import MemoriasMaquina from "./MemoriasMaquina";
import "./tematicas.css";
import "./memorias.css";

/**
 * MEMORIAS (Historia romántica, vintage) — K2, docs/16a §5.
 *
 * Papel envejecido #EFE4CF, sepia de cinta de máquina #3B2A1E, rojo óxido
 * de sello #8B3F31 y encaje crudo. Libre Caslon Display para los nombres,
 * Courier Prime a 18 px (interlineado 1,75) para todo lo que se lee, y
 * Homemade Apple solo en frases cortas y nunca con información.
 *
 * El guion:
 *  1. Cabecera: vuestro vídeo como una proyección de Super 8 (sepia, grano
 *     que no parpadea, perforaciones). «Querida familia, queridos amigos:»
 *     se teclea; cae una instantánea vuestra. Al bajar se apagan las luces.
 *  2. EL MOMENTO: «La carta que se escribe». La historia aparece como tinta
 *     que baja, línea a línea, al ritmo del pulgar; el texto está entero en
 *     el DOM desde el principio.
 *  3. Instantáneas con esquineros que se enderezan y se dan la vuelta.
 *  4. El sobre de correo aéreo con el matasellos (cuándo y dónde) y la
 *     máquina de escribir que teclea la cuenta atrás.
 *  5. La ficha del programa, las muestras de tela, el sobre con cordel de
 *     los regalos y «Contestad a vuelta de correo».
 */

const HERO: FuenteVideo = {
  vertical: "/tematicas/memorias/hero-v.mp4",
  horizontal: "/tematicas/memorias/hero-h.mp4",
  poster: "/tematicas/memorias/poster-v.avif",
  posterHorizontal: "/tematicas/memorias/poster-h.avif",
  webm: "/tematicas/memorias/hero-v.webm",
  webmHorizontal: "/tematicas/memorias/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="me-titulo" data-k-escena="">
      {antes && <p className="me-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <span className="me-encaje" aria-hidden="true" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Perforaciones() {
  return (
    <svg className="me-perforaciones" viewBox="0 0 16 400" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <rect key={i} x="3" y={6 + i * 18} width="10" height="9" rx="2" />
      ))}
    </svg>
  );
}

function Portada(props: Props) {
  const d = datosPortada(props);
  const foto = d.foto ?? props.b("galeria")?.fotos[0];
  return (
    <header className="k-hero me-hero">
      <div className="me-proyeccion">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-memorias" etiqueta="▶ Proyectar">
          <span className="me-grano bucle" aria-hidden="true" />
          <span className="me-vineta" aria-hidden="true" />
          <span className="me-apagon" aria-hidden="true" />
        </HeroVideo>
        <Perforaciones />
        {foto && (
          <figure className="me-foto-cae wow" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
            <img src={foto} alt="" width={320} height={360} fetchPriority="low" decoding="async" />
            <span className="me-washi" />
          </figure>
        )}
      </div>
      <div className="me-rotulo k-hero-sale">
        <p className="me-saludo">
          <span className="sr-only">Querida familia, queridos amigos:</span>
          <span className="me-teclea uno" aria-hidden="true">Querida familia,</span>
          <span className="me-teclea dos" aria-hidden="true">queridos amigos:</span>
        </p>
        <p className="me-nos-casamos">nos casamos</p>
        <h1 className="me-nombres vt-nombres" style={{ fontSize: d.tamNombres(2.6, 13, 0.5, 5) }}>
          <span className="block">{d.a}</span>
          <span className="me-y">&amp;</span>
          <span className="block">{d.b}</span>
        </h1>
        <p className="me-fecha">
          {mayuscula(d.fechaLarga)}
          {d.lugar && <span className="block">{d.lugar}</span>}
        </p>
        <CuentaPortada hasta={d.fechaIso} estilo="dos-puntos" className="k-cuenta memorias-cuenta" />
        <a href="#k-inicio" className="k-baja me-baja">
          Leed nuestra carta
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────── la carta que se escribe

type Caps = Extract<Bloque, { t: "capitulos" }>;

function Carta({ x, a, b, frase }: { x: Caps; a: string; b: string; frase: string }) {
  return (
    <section id="k-inicio" className="me-seccion" aria-label={x.titulo ?? "Nuestra historia"}>
      <Titulo antes="Querida familia, queridos amigos">{x.titulo ?? "Nuestra historia"}</Titulo>
      <article className="me-carta">
        <span className="me-sello-postal" aria-hidden="true">
          <span>{a.charAt(0)}&amp;{b.charAt(0)}</span>
        </span>
        {frase && <p className="me-carta-abre">{frase}</p>}
        {x.capitulos.map((c) => (
          <div key={c.titulo} className="me-carta-parte">
            {c.cuando && <p className="me-carta-cuando">{c.cuando}</p>}
            <h3 className="me-carta-titulo">{c.titulo}</h3>
            <p className="me-carta-texto">{c.texto}</p>
          </div>
        ))}
        <p className="me-carta-despide">Con todo nuestro cariño,</p>
        <p className="me-carta-firma" aria-hidden="true">{a} y {b}</p>
        <p className="sr-only">{a} y {b}</p>
      </article>
    </section>
  );
}

// ───────────────────────────────────── sobre aéreo + máquina de escribir

function SobreAereo({ inv, x }: { inv: Props["inv"]; x?: Extract<Bloque, { t: "itinerario" }> }) {
  const fecha = inv.pareja.fecha;
  const p = partesMadrid(fecha);
  const primera = x?.paradas[0];
  const dosd = (n: number) => String(n).padStart(2, "0");
  return (
    <section className="me-seccion" aria-label="Cuándo y dónde">
      <Titulo antes="Cuándo y dónde">Os escribimos para</Titulo>
      <div className="me-sobre" data-k-escena="">
        <span className="me-sobre-borde" aria-hidden="true" />
        <div className="me-matasellos" aria-hidden="true">
          <svg viewBox="0 0 230 120">
            <defs>
              <path id="me-arco" d="M60 60 m-44 0 a44 44 0 1 1 88 0" />
            </defs>
            <circle cx="60" cy="60" r="54" />
            <circle cx="60" cy="60" r="34" />
            <text><textPath href="#me-arco" startOffset="50%" textAnchor="middle">CORREO · {p.anio}</textPath></text>
            <text x="60" y="58" textAnchor="middle" className="me-mat-dia">{dosd(p.dia)}.{dosd(p.mes)}</text>
            <text x="60" y="76" textAnchor="middle" className="me-mat-hora">{primera?.hora ?? ""}</text>
            <path d="M118 46 C140 40 150 52 172 46 S200 40 222 46 M118 60 C140 54 150 66 172 60 S200 54 222 60 M118 74 C140 68 150 80 172 74 S200 68 222 74" />
          </svg>
        </div>
        <p className="me-sobre-via" aria-hidden="true">Par avion · Por avión</p>
        <dl className="me-sobre-datos">
          <dt>Cuándo</dt>
          <dd>
            {mayuscula(formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}
            {primera && <>, a las {primera.hora}</>}
          </dd>
          {primera && (
            <>
              <dt>Dónde</dt>
              <dd>
                {primera.lugar}
                <span className="block">{primera.direccion}</span>
              </dd>
            </>
          )}
        </dl>
      </div>
    </section>
  );
}

function Cuenta({ inv, x }: { inv: Props["inv"]; x?: Extract<Bloque, { t: "itinerario" }> }) {
  return (
    <>
      <SobreAereo inv={inv} x={x} />
      <section className="me-seccion me-seccion-maquina" aria-label="Cuenta atrás">
        <Titulo antes="Lo tenemos contado">Faltan</Titulo>
        <div data-k-escena="">
          <MemoriasMaquina hasta={inv.pareja.fecha} />
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────────── la ficha del programa

function Ficha({ x, inv }: { x: Extract<Bloque, { t: "itinerario" }>; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="me-seccion">
        <Titulo antes={formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" })}>{x.titulo ?? "El programa"}</Titulo>
        <ol className="me-ficha" data-k-escena="">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} style={{ "--i": i } as React.CSSProperties}>
              <span className="me-ficha-hora tabular-nums">{p.hora}</span>
              <span className="me-ficha-que">
                <span className={i === 0 ? "me-lapiz" : undefined}>{p.titulo}</span>
                <span className="me-ficha-donde">{p.lugar}</span>
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

// ──────────────────────────────────────────────── muestras de tela

function Muestras({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="me-seccion">
      <Titulo antes="Dress code">Cómo vestir</Titulo>
      <ul className="me-muestras" aria-label="Colores sugeridos">
        {paleta.map((c, i) => (
          <li key={c + i} style={{ "--c": c, "--i": i, "--g": `${i % 2 ? 4 : -5}deg` } as React.CSSProperties}>
            <span className="me-tela" aria-hidden="true" />
            <span className="me-alfiler" aria-hidden="true" />
            <span className="sr-only">{c}</span>
          </li>
        ))}
      </ul>
      <p className="me-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

// ───────────────────────────────────────── el sobre con cordel (regalos)

function SobreCordel(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="me-regalo">
      <svg className="me-regalo-sobre" viewBox="0 0 140 92" aria-hidden="true" data-k-escena="">
        <rect x="4" y="4" width="132" height="84" rx="3" className="me-rs-papel" />
        <path d="M4 6 L70 52 L136 6" className="me-rs-solapa" />
        <path d="M70 0 V92" pathLength={1} className="me-cordel" />
        <path d="M0 50 H140" pathLength={1} className="me-cordel" />
        <path d="M70 50 c-14 -14 -22 -2 -10 4 M70 50 c14 -14 22 -2 10 4 M70 50 l-8 16 M70 50 l8 16" className="me-lazo" />
      </svg>
      <Regalos {...x} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesMemorias;

export default function Memorias(props: Props) {
  const { b, inv } = props;
  const caps = b("capitulos");
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  const rsvp = b("rsvp");
  const galeria = b("galeria");
  const frase = b("portada")?.frase ?? "";
  const notas = caps?.capitulos ?? [];
  const instantaneas: Instantanea[] = (galeria?.fotos ?? []).slice(0, 4).map((foto, i) => ({
    foto,
    cuando: notas[i]?.cuando?.split("·")[0]?.trim(),
    nota: notas[i]?.titulo ?? "Nosotros",
  }));
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      {!caps && <div id="k-inicio" />}
      <Secciones
        {...props}
        opciones={{
          piezas: {
            capitulos: caps && <Carta x={caps} a={inv.pareja.a} b={inv.pareja.b} frase={frase} />,
            respiro: instantaneas.length > 0 && (
              <section className="me-seccion me-album" aria-label="Instantáneas">
                <Titulo antes="Del cajón de las fotos">Instantáneas</Titulo>
                <MemoriasInstantaneas fotos={instantaneas} />
                <p className="me-pista" aria-hidden="true">Deslizad y tocad una foto para leer el dorso</p>
              </section>
            ),
            cuentaAtras: b("cuentaAtras") && <Cuenta inv={inv} x={itin} />,
            itinerario: itin && <Ficha x={itin} inv={inv} />,
            dressCode: dress && <Muestras {...dress} />,
            regalos: regalos && <SobreCordel {...regalos} />,
            rsvp: rsvp && (
              <div className="me-rsvp">
                <p className="me-antes">Contestad a vuelta de correo</p>
                {rsvp.limite && <LimiteRsvp limite={rsvp.limite} motivo={rsvp.motivoLimite} />}
                <Rsvp slug={inv.slug} {...rsvp} />
              </div>
            ),
          },
          tonos: { cuentaAtras: "velo", rsvp: "velo", alojamiento: "velo" },
        }}
      />
      <Despedida
        inv={inv}
        ornamento="cenefa"
        flor={
          <svg className="me-lazo-encaje" viewBox="0 0 160 70" aria-hidden="true">
            <path d="M80 34 C60 6 22 6 24 28 C26 46 60 42 80 34 C100 42 134 46 136 28 C138 6 100 6 80 34 Z" />
            <path d="M80 34 C72 48 62 60 52 66 M80 34 C88 48 98 60 108 66" />
            <circle cx="80" cy="34" r="6" />
            <path d="M30 22 C40 14 54 16 64 26 M130 22 C120 14 106 16 96 26" className="me-calado" />
          </svg>
        }
      />
      <GuionEscenas />
    </Lienzo>
  );
}
