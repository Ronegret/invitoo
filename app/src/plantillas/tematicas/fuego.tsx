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
import { FuegoClave } from "./FuegoPiezas";
import { fuentesFuego } from "./fuentes/fuego";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import MusicaRsvp from "./MusicaRsvp";
import "./tematicas.css";
import "./musicales.css";
import "./fuego.css";

/**
 * SON DE FUEGO (Salsa) — K4. docs/16b §4.
 *
 * El objeto noble: el cartel de un club de 1957 —terciopelo rojo, latón
 * pulido y bombillas cálidas—, nunca maracas ni sombreros. Crema #f8eee3,
 * tinta #2a1411, rojo terciopelo #b3261e; brasa y latón son brillos.
 *
 * El guion:
 *  1. Cabecera: «Esta noche se baila», vuestro vídeo en luz de tungsteno.
 *  2. MOMENTO WOW · el abanico: al bajar, nueve pliegues de terciopelo con
 *     varillas de latón se abren como la falda en un giro.
 *  3. «Nuestros pasos»: cada capítulo entra alternando lado, como un cross-body.
 *  4. La clave (cuenta atrás) con bombillas y el ritmo 3-2.
 *  5. El cartel del club: sus bombillas se encienden una a una al bajar.
 *  6. Vestid para bailar: terciopelo y seda que se balancean.
 *  7. Al final, las bombillas se apagan salvo dos: vosotros.
 */

// Metraje provisional: public/aperturas/terracota (rosas), virado a rojo
// terciopelo en CSS. Lo sustituye el vídeo de los novios.
const HERO: FuenteVideo = {
  vertical: "/aperturas/terracota/vertical.mp4",
  horizontal: "/aperturas/terracota/horizontal.mp4",
  poster: "/tematicas/fuego/poster-v.avif",
  posterHorizontal: "/tematicas/fuego/poster-h.avif",
  webm: "/tematicas/fuego/hero-v.webm",
  webmHorizontal: "/tematicas/fuego/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** La clave: cinco puntos de latón (3-2) sobre un filete. */
function Clave({ className = "" }: { className?: string }) {
  return (
    <svg className={`fu-orn ${className}`} viewBox="0 0 160 12" aria-hidden="true">
      <path d="M0 6H160" />
      {[0, 3, 6, 10, 12].map((g) => (
        <circle key={g} cx={8 + g * 9.2} cy="6" r="4" />
      ))}
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="fu-titulo" data-k-escena="">
      {antes && <p className="fu-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Clave />
    </div>
  );
}

/** El abanico de nueve pliegues de terciopelo con varillas de latón. */
function Abanico({ className = "" }: { className?: string }) {
  return (
    <div className={`fu-abanico ${className}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="fu-pliegue" style={{ "--i": i - 4 } as React.CSSProperties} />
      ))}
      <span className="fu-eje" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <>
      <header className="k-hero fu-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-fuego" etiqueta="Ver el vídeo">
          <span className="fu-tinte" aria-hidden="true" />
        </HeroVideo>
        <div className="fu-rotulo k-hero-sale">
          <p className="fu-esta">Esta noche se baila</p>
          <h1 className="fu-nombres display vt-nombres" style={{ fontSize: d.tamNombres(3, 15, 0.5, 5.4) }}>
            <span className="block">{d.a}</span>
            <Y className="fu-y" />
            <span className="block">{d.b}</span>
          </h1>
          <p className="fu-cuando">
            {mayuscula(d.fechaLarga)}
            {d.lugar && <span className="block">{d.lugar}</span>}
          </p>
          <a href="#k-inicio" className="k-baja fu-baja">
            Salid a la pista
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </a>
        </div>
      </header>

      {/* MOMENTO WOW: el abanico se abre con el dedo (scroll nativo, sin secuestro). */}
      <section id="k-inicio" className="fu-abanico-escena" aria-label="Unas palabras de los novios">
        <div className="fu-abanico-fijo" data-k-escena="">
          <Abanico />
          <p className="fu-abanico-y" aria-hidden="true">{d.a.charAt(0)} <span>y</span> {d.b.charAt(0)}</p>
          {d.frase && <blockquote className="fu-frase display">{d.frase}</blockquote>}
        </div>
      </section>
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

type Caps = Extract<Bloque, { t: "capitulos" }>;
const CONTEO = ["1, 2, 3…", "5, 6, 7…", "1, 2, 3…", "5, 6, 7…"];

function Pasos({ titulo, capitulos }: Caps) {
  return (
    <section className="fu-seccion">
      <Titulo antes="Nuestra historia">{titulo ?? "Nuestros pasos"}</Titulo>
      <ol className="fu-pasos k-ancho">
        {capitulos.map((c, i) => (
          <li key={c.titulo} data-k-escena="" data-lado={i % 2 ? "der" : "izq"}>
            <p className="fu-conteo" aria-hidden="true">{CONTEO[i % CONTEO.length]}</p>
            {c.cuando && <p className="fu-paso-cuando">{c.cuando}</p>}
            <h3 className="display">{c.titulo}</h3>
            <p className="fu-paso-texto">{c.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Cuenta({ fecha }: { fecha: string }) {
  return (
    <section className="fu-seccion fu-cuenta">
      <Titulo antes="Faltan">Al compás</Titulo>
      <FuegoClave hasta={fecha} />
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;

function Repertorio({ x, inv, d }: { x: Itin; inv: Props["inv"]; d: ReturnType<typeof datosPortada> }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  const bombillas = 22;
  return (
    <>
      <section className="fu-seccion">
        <div className="fu-cartel k-ancho" data-k-escena="">
          <span className="fu-bombillas" aria-hidden="true">
            {Array.from({ length: bombillas }, (_, i) => (
              <i
                key={i}
                style={{
                  "--i": i,
                  left: `${4 + ((i % (bombillas / 2)) * 92) / (bombillas / 2 - 1)}%`,
                  top: i < bombillas / 2 ? "0" : "100%",
                } as React.CSSProperties}
              />
            ))}
          </span>
          <p className="fu-antes">Esta noche</p>
          <p className="fu-cartel-t display">{d.a} <span className="fu-y">y</span> {d.b}</p>
          <p className="fu-cartel-dato">{mayuscula(d.fechaLarga)}</p>
          {primera && <p className="fu-cartel-dato">{primera.lugar} · {primera.hora}</p>}
        </div>
      </section>
      <section className="fu-seccion">
        <Titulo antes="Cuándo y dónde">{x.titulo ?? "El repertorio de la noche"}</Titulo>
        <ol className="fu-repertorio k-ancho">
          {x.paradas.map((p) => (
            <li key={p.titulo + p.hora} data-k-escena="">
              <span className="fu-rep-hora display tabular-nums">{p.hora}</span>
              <span className="fu-rep-filete" aria-hidden="true" />
              <span className="fu-rep-que">{p.titulo}</span>
              <span className="fu-rep-donde">{p.lugar}</span>
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

function Vestid({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="fu-seccion">
      <Titulo antes="Dress code">Vestid para bailar</Titulo>
      <ul className="fu-telas" aria-hidden="true">
        {paleta.map((c, i) => (
          <li key={c + i} data-k-escena="" style={{ "--c": c, "--i": i } as React.CSSProperties} data-tela={i % 2 ? "seda" : "terciopelo"} />
        ))}
      </ul>
      {paleta.length > 0 && <p className="sr-only">Colores sugeridos: {paleta.join(", ")}.</p>}
      <p className="fu-nota k-ancho" data-k-escena="">{nota}</p>
      <p className="fu-zapato" data-k-escena="">Zapato cómodo: aquí se baila.</p>
    </section>
  );
}

function Detalle(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="fu-detalle k-ancho" data-k-escena="">
      <Regalos {...x} />
    </div>
  );
}

function Confirmar({ x, inv }: { x: Extract<Bloque, { t: "rsvp" }>; inv: Props["inv"] }) {
  return (
    <>
      {x.limite && <LimiteRsvp limite={x.limite} motivo={x.motivoLimite} />}
      <MusicaRsvp
        slug={inv.slug}
        efecto="fuego"
        frase="¡A bailar{n}!"
        arriba={<div className="fu-rsvp-abanico"><Abanico className="fu-abanico-chico" /></div>}
      >
        <Rsvp slug={inv.slug} {...x} />
      </MusicaRsvp>
    </>
  );
}

/** Al cerrar, todas las bombillas se apagan menos dos: vosotros. */
function DosBombillas() {
  return (
    <section className="fu-dos" aria-label="Fin de fiesta">
      <span className="fu-dos-fila" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} data-par={i === 3 || i === 5 ? "1" : undefined} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </span>
      <p className="fu-dos-t display">Y la última, juntos</p>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesFuego;

export default function Fuego(props: Props) {
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
            capitulos: caps && <Pasos {...caps} />,
            itinerario: itin && <Repertorio x={itin} inv={inv} d={d} />,
            cuentaAtras: b("cuentaAtras") && <Cuenta fecha={inv.pareja.fecha} />,
            dressCode: dress && <Vestid {...dress} />,
            regalos: regalos && <Detalle {...regalos} />,
            rsvp: rsvp && <Confirmar x={rsvp} inv={inv} />,
          },
          tonos: { cuentaAtras: "hondo", dressCode: "velo", alojamiento: "velo" },
        }}
      />
      <DosBombillas />
      <Despedida inv={inv} ornamento="punto" flor={<Clave className="fu-orn-cierre" />} />
      <GuionEscenas />
    </Lienzo>
  );
}
