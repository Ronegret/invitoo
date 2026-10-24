import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { Regalos } from "@/components/bloques/Simples";
import Icono from "@/components/Iconos";
import { horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { GuionEscenas } from "./escenas";
import { fuentesOrbita } from "./fuentes/orbita";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import OrbitaCuenta from "./OrbitaCuenta";
import OrbitaToque from "./OrbitaToque";
import "./tematicas.css";
import "./orbita.css";

/**
 * ÓRBITA (`orbita`, K3) — docs/16a §9. El espacio y los planetas.
 *
 * Noche profunda #0B0F24, luz de estrella #ECEAF6, violeta claro #B9A6F2 y
 * plata (#C7CCD6, material fijo). Josefin Sans 200/300 en caja alta, Sora
 * para leer y Parisienne solo a 32 px o más. Modo oscuro.
 *
 * El guion (un solo wow):
 *  1. Cabecera: un atardecer convertido en crepúsculo violeta, polvo de
 *     estrellas y dos planetas pequeños que orbitan, cada uno en su elipse,
 *     alrededor de las iniciales.
 *  2. EL WOW, «Dos órbitas que se encuentran» (escena fijada de 160 svh):
 *     dos elipses con un nombre cada una se acercan con el pulgar hasta
 *     compartir una sola; en el centro brillan dos anillos entrelazados.
 *  3. La luna: una foto en un círculo con halo de plata.
 *  4. Coordenadas: la fecha y el lugar sobre una carta celeste que se dibuja.
 *  5. «T menos»: la cuenta atrás de lanzamiento sobre un mini sistema solar.
 *  6. Las fases de la misión (el programa), con un punto que avanza.
 *  7. El dress code en planetas; la cápsula de los regalos.
 */

// El vídeo de la casa: el atardecer a contraluz (`aperturas/constelacion`),
// recortado sin el principio ni la tarta, y virado a crepúsculo en CSS.
const HERO: FuenteVideo = {
  vertical: "/aperturas/constelacion/vertical.mp4",
  horizontal: "/aperturas/constelacion/horizontal.mp4",
  poster: "/tematicas/orbita/poster-v.avif",
  posterHorizontal: "/tematicas/orbita/poster-h.avif",
  webm: "/tematicas/orbita/hero-v.webm",
  webmHorizontal: "/tematicas/orbita/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

function sitio(direccion?: string) {
  const t = (direccion ?? "").split(",").map((s) => s.trim().replace(/^\d{5}\s*/, "")).filter(Boolean);
  return t.length < 2 ? (t[0] ?? "") : t.at(-2)!;
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const FASES = ["Ignición", "Despegue", "En órbita", "Gravedad cero", "Reentrada", "Aterrizaje"];

function Planeta({ className = "", anillo = true }: { className?: string; anillo?: boolean }) {
  return (
    <svg className={`or-planeta ${className}`} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="10" className="or-planeta-cuerpo" />
      {anillo && <ellipse cx="20" cy="20" rx="18" ry="5" transform="rotate(-18 20 20)" className="or-planeta-anillo" />}
    </svg>
  );
}

/** Separador: un filete de plata con una órbita y su planeta. */
function Vineta() {
  return (
    <span className="or-vineta" aria-hidden="true">
      <span />
      <svg viewBox="0 0 32 16">
        <ellipse cx="16" cy="8" rx="14" ry="5" />
        <circle cx="29" cy="7" r="2.2" />
      </svg>
      <span />
    </span>
  );
}

function Titulo({ antes, children, id }: { antes?: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="or-titulo">
      {antes && <p className="or-antes">{antes}</p>}
      <h2 id={id} className="display sin-orn">{children}</h2>
      <Vineta />
    </div>
  );
}

// ────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="k-hero or-hero">
      <HeroVideo fuente={fuenteHero(props)} clase="grad-orbita" etiqueta="Ver el vídeo">
        <span className="or-tinte" aria-hidden="true" />
        <span className="or-polvo" aria-hidden="true" />
      </HeroVideo>
      <div className="or-astros" aria-hidden="true">
        <span className="or-elipse or-e1">
          <span className="or-gx"><span className="or-gy"><Planeta className="or-p1" /></span></span>
        </span>
        <span className="or-elipse or-e2">
          <span className="or-gx"><span className="or-gy"><Planeta className="or-p2" anillo={false} /></span></span>
        </span>
        <span className="or-iniciales">
          {d.a.charAt(0)}
          <span>·</span>
          {d.b.charAt(0)}
        </span>
      </div>
      <div className="or-rotulo k-hero-sale">
        <p className="or-lema">Dos órbitas, un mismo cielo</p>
        <h1 className="or-nombres" style={{ fontSize: d.tamNombres(2.2, 12, 0.78, 4.4) }}>
          <span className="block">{d.a}</span>
          <span className="or-y">y</span>
          <span className="block">{d.b}</span>
        </h1>
        <p className="or-fecha">{mayuscula(d.fechaLarga)}</p>
        {d.lugar && <p className="or-lugar">{d.lugar}</p>}
        <a href="#k-inicio" className="k-baja or-baja">
          Despegad
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </div>
    </header>
  );
}

// ─────────────────────────────────────── el wow: dos órbitas que se encuentran

type Caps = Extract<Bloque, { t: "capitulos" }>;

function DosOrbitas({ x, a, b }: { x: Caps; a: string; b: string }) {
  return (
    <section id="k-inicio" className="or-historia" aria-labelledby="or-historia">
      <div className="or-escena">
        <div className="or-escenario">
          <Titulo antes="Nuestra historia" id="or-historia">{x.titulo ?? "Dos órbitas"}</Titulo>
          <div className="or-cielo" aria-hidden="true">
            <span className="or-elipse-g or-ga"><span className="or-nombre">{a}</span></span>
            <span className="or-elipse-g or-gb"><span className="or-nombre">{b}</span></span>
            <svg className="or-anillos" viewBox="0 0 80 50">
              <circle cx="31" cy="25" r="14" />
              <circle cx="49" cy="25" r="14" />
            </svg>
          </div>
          <p className="or-escena-pie">
            {a} y {b}: dos trayectorias que, por fin, comparten órbita.
          </p>
        </div>
      </div>
      <ol className="or-bitacora k-ancho">
        {x.capitulos.map((c, i) => (
          <li key={c.titulo} className="or-entrada" data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
            {c.cuando && <p className="or-cuando">{c.cuando}</p>}
            <h3 className="or-cap">{c.titulo}</h3>
            {c.foto && (
              /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
              <img className="or-foto" src={c.foto} alt="" width={480} height={360} loading="lazy" decoding="async" />
            )}
            <p className="or-texto">{c.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── la luna

function Luna({ foto, frase }: { foto?: string; frase: string }) {
  if (!foto) return null;
  return (
    <section className="or-luna" aria-label="Un respiro">
      <div className="or-luna-disco">
        {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
        <img src={foto} alt="" width={600} height={600} loading="lazy" decoding="async" />
      </div>
      <p className="or-luna-frase">{frase}</p>
    </section>
  );
}

// ───────────────────────────────────── coordenadas, cuenta atrás y misión

type Itin = Extract<Bloque, { t: "itinerario" }>;

function Mision({ x, props, conCuenta }: { x: Itin; props: Props; conCuenta: boolean }) {
  const { inv } = props;
  const d = datosPortada(props);
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="or-seccion or-coordenadas" aria-labelledby="or-coord">
        <svg className="or-carta" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="92" pathLength={1} />
          <circle cx="100" cy="100" r="64" pathLength={1} />
          <circle cx="100" cy="100" r="36" pathLength={1} />
          <path d="M100 4V196M4 100H196M32 32L168 168M168 32L32 168" pathLength={1} />
        </svg>
        <div className="or-coord-dentro" data-k-escena="">
          <Titulo antes="Coordenadas" id="or-coord">Cuándo y dónde</Titulo>
          <p className="or-coord-fecha">{mayuscula(d.fechaLarga)}</p>
          {primera && (
            <dl className="or-coord-datos">
              <div><dt>Hora</dt><dd className="tabular-nums">{primera.hora}</dd></div>
              <div><dt>Lugar</dt><dd>{primera.lugar}</dd></div>
              <div><dt>Dirección</dt><dd>{primera.direccion}</dd></div>
            </dl>
          )}
        </div>
      </section>
      {conCuenta && <TMenos fecha={fecha} />}
      <section className="or-seccion" aria-labelledby="or-mision">
        <Titulo antes="Fases de la misión" id="or-mision">{x.titulo ?? "El programa"}</Titulo>
        <div className="or-fases k-ancho">
          <span className="or-trayecto" aria-hidden="true"><i /></span>
          <ol>
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} className="or-fase" data-k-escena="">
              <span className="or-fase-icono" aria-hidden="true">
                <Icono id={p.icono ?? "copas"} size={20} />
              </span>
              <span className="or-fase-nombre">{FASES[i] ?? `Fase ${i + 1}`}</span>
              <span className="or-fase-hora tabular-nums">{p.hora}</span>
              <span className="or-fase-que">{p.titulo}</span>
              <span className="or-fase-donde">
                {p.lugar}
                {sitio(p.direccion) && <> · {sitio(p.direccion)}</>}
              </span>
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

function TMenos({ fecha }: { fecha: string }) {
  return (
    <section className="or-seccion" aria-labelledby="or-tmenos">
      <Titulo antes="Cuenta atrás para el lanzamiento" id="or-tmenos">T menos</Titulo>
      <div data-k-escena="">
        <OrbitaCuenta hasta={fecha} />
      </div>
    </section>
  );
}

function Planetas({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="or-seccion" aria-labelledby="or-dress">
      <Titulo antes="Dress code" id="or-dress">Colores de la galaxia</Titulo>
      <ul className="or-planetas" aria-label="Colores sugeridos">
        {paleta.map((c, i) => (
          <li key={c + i} data-k-escena="" style={{ "--c": c, "--i": i } as React.CSSProperties}>
            <span className="or-mundo" />
            {i % 2 === 1 && <span className="or-mundo-anillo" aria-hidden="true" />}
            <span className="sr-only">{c}</span>
          </li>
        ))}
      </ul>
      <p className="or-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function Capsula(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="or-capsula k-ancho" data-k-escena="">
      <p className="or-capsula-antes" aria-hidden="true">Combustible para la luna de miel</p>
      <Regalos {...x} />
    </div>
  );
}

/** El cierre: un sistema binario, dos luces que giran juntas muy despacio. */
function Binario() {
  return (
    <span className="or-binario" aria-hidden="true">
      <span className="or-binario-giro">
        <i />
        <i />
      </span>
    </span>
  );
}

export const fuentes = fuentesOrbita;

export default function Orbita(props: Props) {
  const { b, inv } = props;
  const caps = b("capitulos");
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  const galeria = b("galeria");
  const cuenta = Boolean(b("cuentaAtras"));
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <OrbitaToque />
      <Portada {...props} />
      {!caps && <div id="k-inicio" />}
      <Secciones
        {...props}
        opciones={{
          piezas: {
            capitulos: caps && <DosOrbitas x={caps} a={inv.pareja.a} b={inv.pareja.b} />,
            respiro: <Luna foto={galeria?.fotos[2] ?? galeria?.fotos[0]} frase="Y de todo el universo, nos tocó coincidir." />,
            itinerario: itin && <Mision x={itin} props={props} conCuenta={cuenta} />,
            cuentaAtras: itin ? null : cuenta && <TMenos fecha={inv.pareja.fecha} />,
            dressCode: dress && <Planetas {...dress} />,
            regalos: regalos && <Capsula {...regalos} />,
          },
          tonos: { rsvp: "velo", notas: "velo" },
        }}
      />
      <Despedida inv={inv} ornamento="estrella" flor={<Binario />} />
      <GuionEscenas />
    </Lienzo>
  );
}
