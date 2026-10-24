import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import Icono from "@/components/Iconos";
import { formatearFecha, horaDelDia, partesMadrid } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { EscudoArmas } from "./BlasonArmas";
import BlasonEscudo from "./BlasonEscudo";
import BlasonProclama from "./BlasonProclama";
import BlasonToque from "./BlasonToque";
import { GuionEscenas } from "./escenas";
import { fuentesBlason } from "./fuentes/blason";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import "./tematicas.css";
import "./blason.css";

/**
 * BLASÓN (Castillos y nobleza) — K2, docs/16a §4.
 *
 * Pergamino #F2E8D5, tinta ferrogálica, borgoña #6B1E2A, sinople y oro viejo
 * (#A8823A, solo en filetes, coronas y bordes). Cinzel Decorative para los
 * nombres; Crimson Pro a 19 px para leer; UnifrakturCook solo en las
 * capitulares y el «Anno Domini», siempre decorativo.
 *
 * El guion:
 *  1. Cabecera: vuestro vídeo con una gradación de oro gastado. Del borde de
 *     arriba se despliega un estandarte borgoña con vuestro escudo bordado;
 *     un rastrillo de hierro cierra la vista y, al bajar, sube: se abren las
 *     puertas.
 *  2. «El cantar»: la historia en estrofas de códice que se iluminan.
 *  3. EL MOMENTO: «El castillo se pinta». La lámina del lugar, primero a
 *     tinta, se colorea en acuarela desde la puerta mientras bajáis.
 *  4. Anno Domini (cuándo y dónde) en borgoña, y la proclama con los
 *     escudos que voltean.
 *  5. El orden de la jornada, la etiqueta de la corte en esmaltes, los
 *     aposentos, el cofre de los regalos y «Responded a la corte».
 *  6. Cierre: el escudo coronado con su cordón y borla.
 */

const HERO: FuenteVideo = {
  vertical: "/tematicas/blason/hero-v.mp4",
  horizontal: "/tematicas/blason/hero-h.mp4",
  poster: "/tematicas/blason/poster-v.avif",
  posterHorizontal: "/tematicas/blason/poster-h.avif",
  webm: "/tematicas/blason/hero-v.webm",
  webmHorizontal: "/tematicas/blason/hero-h.webm",
};

const DIVISA = "Juntos, y con los nuestros";

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

/** Las iniciales del escudo van en capitales de lápida, sin tildes. */
const sinTilde = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().split("").join("·");

function romano(n: number) {
  const t: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let s = "";
  for (const [v, l] of t) while (n >= v) { s += l; n -= v; }
  return s;
}

function sitio(direccion?: string) {
  const t = (direccion ?? "").split(",").map((s) => s.trim().replace(/^\d{5}\s*/, "")).filter(Boolean);
  return t.length < 2 ? (t[0] ?? "") : t.at(-2)!;
}

/** El filete de oro con un rombo: separador de la casa. */
function Filete() {
  return (
    <svg className="bl-filete" viewBox="0 0 220 16" aria-hidden="true">
      <path d="M4 8 H96 M124 8 H216" pathLength={1} />
      <path d="M110 1 L117 8 110 15 103 8Z" className="bl-filete-rombo" />
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="bl-titulo" data-k-escena="">
      {antes && <p className="bl-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Filete />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

/** El rastrillo de hierro: barras y travesaños con puntas abajo. */
function Rastrillo() {
  const barras = Array.from({ length: 13 }, (_, i) => 8 + i * 32);
  return (
    <div className="bl-rastrillo decor" aria-hidden="true">
      <svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMax slice">
        <g className="bl-hierro">
          {barras.map((x) => (
            <path key={x} d={`M${x} -10 V392 l-5 10 5 16 5 -16 -5 -10`} />
          ))}
          {[60, 150, 240, 330].map((y) => (
            <rect key={y} x="-10" y={y} width="420" height="9" rx="2" />
          ))}
        </g>
      </svg>
    </div>
  );
}

function Estandarte({ iniciales, anio }: { iniciales: string; anio: string }) {
  return (
    <div className="bl-estandarte wow" aria-hidden="true">
      <span className="bl-asta" />
      <div className="bl-pano">
        <EscudoArmas iniciales={iniciales} id="ble" className="bl-estandarte-escudo" />
        <p className="bl-estandarte-anio">{anio}</p>
      </div>
    </div>
  );
}

function Portada(props: Props) {
  const d = datosPortada(props);
  const primera = props.b("itinerario")?.paradas[0];
  return (
    <>
      <header className="k-hero bl-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-blason" etiqueta="Ver el vídeo">
          <span className="bl-tinte" aria-hidden="true" />
        </HeroVideo>
        <Rastrillo />
        <Estandarte iniciales={sinTilde(d.iniciales)} anio={`A.D. ${romano(d.anio)}`} />
        <div className="bl-rotulo k-hero-sale">
          <p className="bl-lema">Con la venia de nuestras familias, tenemos el honor de invitaros a nuestro enlace</p>
          <h1 className="bl-nombres vt-nombres" style={{ fontSize: d.tamNombres(2.2, 11, 0.62, 4.2) }}>
            <span className="block">{d.a}</span>
            <span className="bl-y">y</span>
            <span className="block">{d.b}</span>
          </h1>
          <p className="bl-fecha">
            <span className="first-letter:uppercase inline-block">{d.fechaLarga}</span>
            {primera && <span className="block">{d.lugar}</span>}
          </p>
          <a href="#k-inicio" className="k-baja bl-baja">
            Abrid las puertas
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </a>
        </div>
      </header>
      <div id="k-inicio" />
      <section className="bl-dedicatoria k-ancho" aria-label="El escudo y la divisa de los novios">
        <BlasonEscudo iniciales={sinTilde(d.iniciales)} nombres={`${d.a} y ${d.b}`} divisa={DIVISA} />
        {d.frase && <p className="bl-frase">{d.frase}</p>}
      </section>
    </>
  );
}

// ───────────────────────────────────────────────────────── el cantar

type Caps = Extract<Bloque, { t: "capitulos" }>;

function Cantar({ x }: { x: Caps }) {
  return (
    <section className="bl-seccion" aria-label={x.titulo ?? "Nuestro cantar"}>
      <Titulo antes="Crónica de la casa">{x.titulo ?? "Nuestro cantar"}</Titulo>
      <ol className="bl-codice">
        {x.capitulos.map((c, i) => (
          <li key={c.titulo} className="bl-estrofa" data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
            {c.cuando && <p className="bl-cuando">{c.cuando}</p>}
            <h3 className="bl-cap">{c.titulo}</h3>
            {c.foto && (
              /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
              <img className="bl-miniatura" src={c.foto} alt="" width={480} height={320} loading="lazy" decoding="async" />
            )}
            <p className="bl-verso">{c.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ──────────────────────────────────────────── el castillo que se pinta

/** El castillo a tinta: un dibujo de línea, con la puerta abajo en el centro. */
function CastilloLinea() {
  return (
    <g className="bl-linea">
      <path d="M0 262 C60 250 120 256 180 252 S300 248 360 258" />
      {/* murallas exteriores */}
      <path d="M40 262 V204 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 v-8 h8 v8 h2 V262" />
      <path d="M270 262 V204 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 v-8 h8 v8 h2 V262" />
      {/* torres */}
      <path d="M90 256 V130 H122 V256" />
      <path d="M238 256 V130 H270 V256" />
      <path d="M85 131 L106 84 L127 131 Z" />
      <path d="M233 131 L254 84 L275 131 Z" />
      <path d="M106 84 V62 l17 5 -17 5" />
      <path d="M254 84 V62 l17 5 -17 5" />
      {/* lienzos de muralla */}
      <path d="M122 172 h4 v-7 h6 v7 h6 v-7 h6 v7 h6 V256" />
      <path d="M238 172 h-4 v-7 h-6 v7 h-6 v-7 h-6 v7 h-6 V256" />
      {/* torre del homenaje */}
      <path d="M150 252 V112 h-4 v-12 h9 v8 h7 v-8 h9 v8 h7 v-8 h9 v8 h7 v-8 h9 v12 h-4 V252" />
      <path d="M180 100 V70 l20 6 -20 6" />
      {/* la puerta y el puente */}
      <path d="M166 252 V222 A14 14 0 0 1 194 222 V252" />
      <path d="M170 252 V224 M175 252 V218 M180 252 V216 M185 252 V218 M190 252 V224 M166 232 H194 M166 242 H194" className="fina" />
      <path d="M160 262 L166 252 M200 262 L194 252" />
      {/* ventanas */}
      <path d="M176 150 v-10 a4 4 0 0 1 8 0 v10 Z M176 186 v-10 a4 4 0 0 1 8 0 v10 Z M102 166 v-9 a4 4 0 0 1 8 0 v9 Z M250 166 v-9 a4 4 0 0 1 8 0 v9 Z M102 206 v-9 a4 4 0 0 1 8 0 v9 Z M250 206 v-9 a4 4 0 0 1 8 0 v9 Z" />
      {/* sillares */}
      <path d="M150 140 H210 M150 196 H210 M90 190 H122 M238 190 H270 M40 232 H90 M270 232 H320" className="fina" />
      {/* cipreses y pájaros */}
      <path d="M22 262 C18 236 22 214 26 200 C30 214 34 236 30 262 M338 262 C334 240 338 222 342 210 C346 222 350 240 346 262" />
      <path d="M60 70 q6 -6 12 0 q6 -6 12 0 M290 50 q5 -5 10 0 q5 -5 10 0" className="fina" />
    </g>
  );
}

/** La acuarela: manchas de color con borde orgánico (un filtro que se pinta una vez). */
function CastilloColor() {
  return (
    <svg viewBox="0 0 360 300" className="bl-acuarela-svg" aria-hidden="true">
      <defs>
        <filter id="bl-papel-agua" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="9" />
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
        <linearGradient id="bl-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9c9d6" />
          <stop offset=".55" stopColor="#f2d5b4" />
          <stop offset="1" stopColor="#f6e2c6" />
        </linearGradient>
      </defs>
      <g filter="url(#bl-papel-agua)" opacity=".86">
        <path d="M-6 0 H366 V256 H-6Z" fill="url(#bl-cielo)" opacity=".7" />
        <path d="M-6 262 C60 250 120 256 180 252 S300 248 366 258 V306 H-6Z" fill="#7d9467" />
        <path d="M40 262 V200 H92 V262Z M268 262 V200 H322 V262Z" fill="#cdbb9b" />
        <path d="M90 256 V130 H122 V256Z M238 256 V130 H270 V256Z M122 256 V168 H150 V256Z M210 256 V168 H238 V256Z" fill="#c4b08c" />
        <path d="M150 252 V104 H210 V252Z" fill="#d3c19f" />
        <path d="M85 131 L106 84 L127 131 Z M233 131 L254 84 L275 131 Z" fill="#7b2733" />
        <path d="M106 62 l17 5 -17 5Z M254 62 l17 5 -17 5Z M180 70 l20 6 -20 6Z" fill="#7b2733" />
        <path d="M166 252 V222 A14 14 0 0 1 194 222 V252Z" fill="#5a3b26" />
        <path d="M22 262 C18 236 22 214 26 200 C30 214 34 236 30 262Z M338 262 C334 240 338 222 342 210 C346 222 350 240 346 262Z" fill="#3f5a3f" />
        <circle cx="300" cy="96" r="20" fill="#f3c98b" opacity=".8" />
      </g>
    </svg>
  );
}

function Lamina({ lugar }: { lugar: string }) {
  return (
    <section className="bl-lamina" aria-label={`Ilustración de ${lugar || "el castillo"}, que se colorea al bajar`}>
      <div className="bl-lamina-fija">
        <p className="bl-antes">Así os esperamos</p>
        <figure className="bl-lamina-marco">
          <div className="bl-lamina-papel">
            <div className="bl-acuarela">
              <CastilloColor />
            </div>
            <svg viewBox="0 0 360 300" className="bl-linea-svg" aria-hidden="true">
              <CastilloLinea />
            </svg>
          </div>
          <figcaption>{lugar || "El castillo"}</figcaption>
        </figure>
      </div>
    </section>
  );
}

// ───────────────────────────────────────── cuándo y dónde · la proclama

function AnnoDomini({ inv, x }: { inv: Props["inv"]; x?: Extract<Bloque, { t: "itinerario" }> }) {
  const fecha = inv.pareja.fecha;
  const p = partesMadrid(fecha);
  const primera = x?.paradas[0];
  const larga = formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="bl-hondo">
      <p className="bl-ad" aria-hidden="true">Anno Domini {romano(p.anio)}</p>
      <p className="bl-ad-fecha" data-k-escena="">
        <span className="first-letter:uppercase inline-block">{larga}</span>
        {primera && <span className="block">a las {primera.hora}</span>}
      </p>
      {primera && (
        <div className="bl-ad-lugar" data-k-escena="">
          <span className="bl-pin" aria-hidden="true" />
          <p className="bl-ad-sitio">{primera.lugar}</p>
          <p className="bl-ad-dir">{primera.direccion}</p>
        </div>
      )}
    </div>
  );
}

function Proclama({ inv, x }: { inv: Props["inv"]; x?: Extract<Bloque, { t: "itinerario" }> }) {
  return (
    <>
      <AnnoDomini inv={inv} x={x} />
      <section className="bl-seccion bl-seccion-proclama">
        <Titulo antes="Oíd, oíd">La proclama</Titulo>
        <div className="bl-proclama-escena" data-k-escena="">
          <BlasonProclama hasta={inv.pareja.fecha} />
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────────── orden de la jornada

const ICONO_HERALDICO: Record<number, string> = { 0: "iglesia", 1: "copas", 2: "plato", 3: "nota" };

function Jornada({ x, inv }: { x: Extract<Bloque, { t: "itinerario" }>; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="bl-seccion">
        <Titulo antes={formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" })}>
          {x.titulo ?? "Orden de la jornada"}
        </Titulo>
        <ol className="bl-jornada k-ancho">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
              <span className="bl-jornada-icono" aria-hidden="true">
                <Icono id={(p.icono ?? ICONO_HERALDICO[i] ?? "copas") as "copas"} size={22} />
              </span>
              <span className="bl-jornada-hora display tabular-nums">{p.hora}</span>
              <span className="bl-jornada-que">{p.titulo}</span>
              <span className="bl-jornada-donde">
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

// ──────────────────────────────────────────────── la etiqueta de la corte

function Etiqueta({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="bl-seccion">
      <Titulo antes="Dress code">Etiqueta de la corte</Titulo>
      <ul className="bl-esmaltes" aria-label="Colores sugeridos">
        {paleta.map((c, i) => (
          <li key={c + i} style={{ "--c": c, "--i": i } as React.CSSProperties}>
            <svg viewBox="0 0 100 120" aria-hidden="true">
              <path d="M6 6 H94 V58 C94 88 72 106 50 114 C28 106 6 88 6 58 Z" className="bl-esmalte-fondo" />
              <path d="M6 6 H94 V58 C94 88 72 106 50 114 C28 106 6 88 6 58 Z" className="bl-esmalte-color" />
              <path d="M6 6 H94 V58 C94 88 72 106 50 114 C28 106 6 88 6 58 Z" className="bl-esmalte-borde" />
            </svg>
            <span className="sr-only">{c}</span>
          </li>
        ))}
      </ul>
      <p className="bl-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── el cofre

function Cofre(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="bl-cofre">
      <svg className="bl-cofre-svg" viewBox="0 0 120 92" aria-hidden="true" data-k-escena="">
        <path d="M10 40 C10 16 110 16 110 40 Z" className="bl-cofre-tapa" />
        <rect x="10" y="40" width="100" height="46" rx="3" className="bl-cofre-caja" />
        <path d="M10 52 H110 M30 22 V86 M90 22 V86" className="bl-cofre-fleje" />
        <rect x="50" y="44" width="20" height="22" rx="3" className="bl-cofre-cerradura" />
        <g className="bl-llave">
          <circle cx="60" cy="52" r="3" />
          <path d="M60 55 V61" />
        </g>
      </svg>
      <Regalos {...x} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesBlason;

export default function Blason(props: Props) {
  const { b, inv } = props;
  const caps = b("capitulos");
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  const rsvp = b("rsvp");
  const iniciales = sinTilde(`${inv.pareja.a.charAt(0)}${inv.pareja.b.charAt(0)}`);
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <BlasonToque />
      <Portada {...props} />
      <Secciones
        {...props}
        opciones={{
          piezas: {
            capitulos: caps && <Cantar x={caps} />,
            respiro: <Lamina lugar={itin?.paradas[0]?.lugar ?? ""} />,
            cuentaAtras: b("cuentaAtras") && <Proclama inv={inv} x={itin} />,
            itinerario: itin && <Jornada x={itin} inv={inv} />,
            dressCode: dress && <Etiqueta {...dress} />,
            regalos: regalos && <Cofre {...regalos} />,
            rsvp: rsvp && (
              <div className="bl-rsvp">
                <p className="bl-antes bl-rsvp-antes">Responded a la corte</p>
                {rsvp.limite && <LimiteRsvp limite={rsvp.limite} motivo={rsvp.motivoLimite} />}
                <Rsvp slug={inv.slug} {...rsvp} />
              </div>
            ),
          },
          tonos: { alojamiento: "velo", album: "velo", rsvp: "velo" },
        }}
      />
      <Despedida
        inv={inv}
        ornamento="lacre"
        flor={
          <div className="bl-cierre" aria-hidden="true">
            <svg className="bl-corona" viewBox="0 0 80 34">
              <path d="M6 30 L4 8 L20 20 L30 4 L40 18 L50 4 L60 20 L76 8 L74 30 Z" />
              <circle cx="4" cy="8" r="3" /><circle cx="30" cy="4" r="3" /><circle cx="50" cy="4" r="3" /><circle cx="76" cy="8" r="3" />
              <path d="M8 26 H72" className="bl-corona-banda" />
            </svg>
            <EscudoArmas iniciales={iniciales} id="blc" className="bl-cierre-escudo" />
            <span className="bl-borla" />
          </div>
        }
      />
      <GuionEscenas />
    </Lienzo>
  );
}
