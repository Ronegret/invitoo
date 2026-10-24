import CuentaPortada from "@/components/bloques/CuentaPortada";
import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { Regalos } from "@/components/bloques/Simples";
import { horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import BrazadaCuenta from "./BrazadaCuenta";
import BrazadaToque from "./BrazadaToque";
import { GuionEscenas } from "./escenas";
import { fuentesBrazada } from "./fuentes/brazada";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import "./tematicas.css";
import "./brazada.css";

/**
 * BRAZADA (`brazada`, K3) — docs/16a §10. Natación y agua.
 *
 * Blanco de azulejo #F2FAFB, azul de fondo de piscina #06303A, cian
 * profundo #00707F; el cian iluminado (cáusticas, burbujas) y el cromo son
 * materiales fijos. Archivo expandida y en cursiva (salida de bloque),
 * Lexend para leer y Yellowtail solo a 32 px o más.
 *
 * El guion (un solo wow, «La zambullida»):
 *  1. Cabecera: arriba, una franja de papel con «SALIDA · fecha» y la
 *     superficie del agua; debajo, el vídeo «bajo el agua» con cáusticas.
 *     Los nombres entran como una brazada. Al bajar, la superficie sube y
 *     sale de la pantalla y el vídeo se hunde: estáis bajo el agua.
 *  2. Bajo el agua: la historia en azul piscina, con la luz bailando en el
 *     fondo y burbujas por los márgenes; cada capítulo entra nadando.
 *  3. Emergemos: una corchera cruza y el fondo vuelve al blanco.
 *  4. Salida: la fecha enorme sobre la cruz del fondo de la piscina.
 *  5. El reloj de ritmo (pace clock) descuenta los segundos.
 *  6. Calles de piscina: cada parada, una calle con su corchera.
 *  7. Gorros de natación para el dress code; una gota abre los regalos.
 */

// El vídeo de la casa: el tul que flota (`aperturas/velo`, recortado y en
// ida y vuelta), virado a cian con cáusticas encima: se lee como agua.
const HERO: FuenteVideo = {
  vertical: "/aperturas/velo/vertical.mp4",
  horizontal: "/aperturas/velo/horizontal.mp4",
  poster: "/tematicas/brazada/poster-v.avif",
  posterHorizontal: "/tematicas/brazada/poster-h.avif",
  webm: "/tematicas/brazada/hero-v.webm",
  webmHorizontal: "/tematicas/brazada/hero-h.webm",
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

/** Separador: una corchera corta (cápsulas alternas). */
function Corchera({ className = "" }: { className?: string }) {
  return <span className={`br-corchera ${className}`} aria-hidden="true" />;
}

function Titulo({ antes, children, id }: { antes?: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="br-titulo">
      {antes && <p className="br-antes">{antes}</p>}
      <h2 id={id} className="display sin-orn">{children}</h2>
      <Corchera className="br-corchera-corta" />
    </div>
  );
}

/** Burbujas que suben por los márgenes (posiciones fijas, sin azar). */
function Burbujas() {
  const b = [
    [4, 9, 0], [9, 6, 3.1], [6, 12, 6.4], [3, 7, 9.2], [11, 5, 1.7], [7, 10, 4.8],
    [92, 8, 1.2], [96, 11, 4.4], [89, 6, 7.1], [94, 9, 2.6], [97, 5, 5.9], [90, 12, 8.3],
  ];
  return (
    <div className="br-burbujas" aria-hidden="true">
      {b.map(([x, s, d], i) => (
        <i key={i} style={{ left: `${x}%`, top: `${20 + ((i * 37) % 75)}%`, width: s, height: s, "--d": `${-d}s` } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="k-hero br-hero">
      <HeroVideo fuente={fuenteHero(props)} clase="grad-brazada" etiqueta="Ver el vídeo">
        <span className="br-causticas" aria-hidden="true" />
        <span className="br-velo" aria-hidden="true" />
      </HeroVideo>
      <div className="br-borde">
        <p className="br-salida">
          Salida · <span className="tabular-nums">{d.numerica}</span>
        </p>
        <svg className="br-superficie" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
          <path className="br-agua-arriba" d="M0 0 V12 C50 4 100 20 150 12 S250 4 300 12 S380 20 400 12 V0Z" />
          <path className="br-linea" d="M0 12 C50 4 100 20 150 12 S250 4 300 12 S380 20 400 12" />
        </svg>
      </div>
      <div className="br-rotulo k-hero-sale">
        <h1 className="br-nombres" style={{ fontSize: d.tamNombres(2.4, 12, 0.72, 4.6) }}>
          <span className="block">{d.a}</span>
          <span className="br-y">y</span>
          <span className="block">{d.b}</span>
        </h1>
        <p className="br-fecha">{mayuscula(d.fechaLarga)}</p>
        {d.lugar && <p className="br-lugar">{d.lugar}</p>}
        <CuentaPortada hasta={d.fechaIso} estilo="filete" className="k-cuenta brazada-cuenta" />
        <a href="#k-inicio" className="k-baja br-baja">
          Al agua
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </div>
    </header>
  );
}

// ────────────────────────────────────────────────────── bajo el agua

type Caps = Extract<Bloque, { t: "capitulos" }>;

function BajoElAgua({ x }: { x: Caps }) {
  return (
    <section id="k-inicio" className="br-agua" aria-labelledby="br-historia">
      <span className="br-causticas br-causticas-fondo" aria-hidden="true" />
      <Burbujas />
      <div className="br-agua-dentro">
        <Titulo antes="Bajo el agua" id="br-historia">{x.titulo ?? "Nuestra historia"}</Titulo>
        <ol className="br-largos k-ancho">
          {x.capitulos.map((c, i) => (
            <li key={c.titulo} className="br-largo" data-k-escena="" style={{ "--s": i % 2 ? 1 : -1 } as React.CSSProperties}>
              <span className="br-largo-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              {c.cuando && <p className="br-cuando">{c.cuando}</p>}
              <h3 className="br-cap">{c.titulo}</h3>
              {c.foto && (
                /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
                <img className="br-foto" src={c.foto} alt="" width={480} height={360} loading="lazy" decoding="async" />
              )}
              <p className="br-texto">{c.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Emergemos({ foto, frase }: { foto?: string; frase: string }) {
  return (
    <section className="br-emerge" aria-label="Un respiro">
      <Corchera className="br-corchera-larga" />
      <p className="br-emerge-frase">{frase}</p>
      {foto && (
        /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
        <img className="br-emerge-foto" src={foto} alt="" width={900} height={1100} loading="lazy" decoding="async" />
      )}
    </section>
  );
}

// ─────────────────────────────────────── salida, reloj de ritmo y calles

type Itin = Extract<Bloque, { t: "itinerario" }>;

function Piscina({ x, props, conCuenta }: { x: Itin; props: Props; conCuenta: boolean }) {
  const { inv } = props;
  const d = datosPortada(props);
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="br-seccion br-salida-s" aria-labelledby="br-cuando">
        <span className="br-cruz" aria-hidden="true" />
        <div className="br-salida-dentro">
          <Titulo antes="Salida" id="br-cuando">Cuándo y dónde</Titulo>
          <p className="br-dia tabular-nums" aria-hidden="true">{d.numerica}</p>
          <p className="br-dia-largo">{mayuscula(d.fechaLarga)}</p>
          {primera && (
            <>
              <p className="br-dia-hora">a las {primera.hora}</p>
              <p className="br-dia-lugar">{primera.lugar}</p>
              <p className="br-dia-dir">{primera.direccion}</p>
            </>
          )}
        </div>
      </section>
      {conCuenta && <Ritmo fecha={fecha} />}
      <section className="br-seccion" aria-labelledby="br-calles">
        <Titulo antes="Calle a calle" id="br-calles">{x.titulo ?? "El programa"}</Titulo>
        <ol className="br-calles">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} className="br-calle" data-k-escena="">
              <span className="br-calle-n" aria-hidden="true">{i + 1}</span>
              <span className="br-calle-dentro">
                <span className="br-calle-hora tabular-nums">{p.hora}</span>
                <span className="br-calle-que">{p.titulo}</span>
                <span className="br-calle-donde">
                  {p.lugar}
                  {sitio(p.direccion) && <> · {sitio(p.direccion)}</>}
                </span>
              </span>
              <Corchera className="br-calle-cuerda" />
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

function Ritmo({ fecha }: { fecha: string }) {
  return (
    <section className="br-seccion" aria-labelledby="br-ritmo">
      <Titulo antes="El reloj de ritmo" id="br-ritmo">Faltan</Titulo>
      <div data-k-escena="">
        <BrazadaCuenta hasta={fecha} />
      </div>
    </section>
  );
}

function Gorros({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="br-seccion" aria-labelledby="br-dress">
      <Titulo antes="Dress code" id="br-dress">Colores de piscina</Titulo>
      <ul className="br-gorros" aria-label="Colores sugeridos">
        {paleta.map((c, i) => (
          <li key={c + i} data-k-escena="" style={{ "--c": c, "--i": i } as React.CSSProperties}>
            <span className="br-gorro" />
            <span className="br-gota" aria-hidden="true" />
            <span className="sr-only">{c}</span>
          </li>
        ))}
      </ul>
      <p className="br-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function Viaje(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="br-viaje k-ancho" data-k-escena="">
      <span className="br-viaje-gota" aria-hidden="true" />
      <Regalos {...x} />
    </div>
  );
}

export const fuentes = fuentesBrazada;

export default function Brazada(props: Props) {
  const { b, inv } = props;
  const caps = b("capitulos");
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  const galeria = b("galeria");
  const cuenta = Boolean(b("cuentaAtras"));
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <BrazadaToque />
      <Portada {...props} />
      {!caps && <div id="k-inicio" />}
      <Secciones
        {...props}
        opciones={{
          piezas: {
            capitulos: caps && <BajoElAgua x={caps} />,
            respiro: <Emergemos foto={galeria?.fotos[2] ?? galeria?.fotos[0]} frase="Y salimos a respirar, juntos." />,
            itinerario: itin && <Piscina x={itin} props={props} conCuenta={cuenta} />,
            cuentaAtras: itin ? null : cuenta && <Ritmo fecha={inv.pareja.fecha} />,
            dressCode: dress && <Gorros {...dress} />,
            regalos: regalos && <Viaje {...regalos} />,
          },
          tonos: { alojamiento: "velo", notas: "velo" },
        }}
      />
      <Despedida inv={inv} ornamento="ola" />
      <GuionEscenas />
    </Lienzo>
  );
}
