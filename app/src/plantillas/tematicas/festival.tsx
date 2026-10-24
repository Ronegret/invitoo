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
import { FestivalCartel, FestivalFoil } from "./FestivalPiezas";
import { fuentesFestival } from "./fuentes/festival";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import MusicaRsvp from "./MusicaRsvp";
import "./tematicas.css";
import "./musicales.css";
import "./festival.css";

/**
 * PASE VIP (Conciertos / Festival) — K4. docs/16b §1.
 *
 * El objeto noble: una acreditación laminada con foil holográfico y troquel,
 * nunca el flyer flúor. Cartulina marfil #f4efe4, tinta #1c1a2b, coral
 * magenta (acento) y el foil solo como BRILLO (nunca lleva texto encima).
 *
 * El guion:
 *  1. Cabecera: vuestro vídeo a la hora dorada, con «Line-up de una vida» y
 *     los nombres en letra de cartel.
 *  2. La acreditación baja colgada de su cordón al bajar (foil que sigue al
 *     dedo, código de barras hecho con la fecha).
 *  3. La cuenta atrás es un cartel: DÍAS es el cabeza de cartel.
 *  4. «El line-up de nuestra historia»: cada capítulo, una línea que se estira.
 *  5. Horarios por escenario: un punto «ahora suena» recorre el programa.
 *  6. Código de pulsera (dress code): pulseras de tela que se cierran.
 *  7. MOMENTO WOW · al confirmar, el talón se arranca por la perforación.
 *  8. «Bis»: el atardecer se hace noche y se encienden luces de móvil.
 */

// El metraje provisional (public/aperturas/constelacion, la hora dorada),
// recortado en bucle limpio y sin rótulos. Lo sustituye el vídeo de los novios.
const HERO: FuenteVideo = {
  vertical: "/tematicas/festival/hero-v.mp4",
  horizontal: "/tematicas/festival/hero-h.mp4",
  poster: "/tematicas/festival/poster-v.avif",
  posterHorizontal: "/tematicas/festival/poster-h.avif",
  webm: "/tematicas/festival/hero-v.webm",
  webmHorizontal: "/tematicas/festival/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** La línea de troquel: un filete de puntos con una muesca a cada lado. */
function Perforado({ className = "" }: { className?: string }) {
  return (
    <svg className={`fe-perforado ${className}`} viewBox="0 0 160 14" aria-hidden="true">
      <circle cx="4" cy="7" r="4" />
      <path d="M16 7H144" strokeDasharray="1.5 5" strokeLinecap="round" />
      <circle cx="156" cy="7" r="4" />
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="fe-titulo" data-k-escena="">
      {antes && <p className="fe-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Perforado />
    </div>
  );
}

/**
 * Código de barras con la fecha de la boda: cada dígito da el ancho de una
 * barra y del hueco que la sigue. Decorativo; debajo va la fecha en claro.
 */
function Barras({ cifras }: { cifras: string }) {
  const ds = cifras.replace(/\D/g, "").split("").map(Number);
  const serie = [...ds, ...ds.slice().reverse(), ...ds];
  let x = 0;
  const barras: { x: number; w: number }[] = [];
  serie.forEach((n, i) => {
    const w = 1 + (n % 3);
    barras.push({ x, w });
    x += w + 1 + ((n + i) % 3);
  });
  return (
    <svg className="fe-barras" viewBox={`0 0 ${x} 30`} preserveAspectRatio="none" aria-hidden="true">
      {barras.map((b) => (
        <rect key={b.x} x={b.x} y="0" width={b.w} height="30" />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  const cifras = d.numerica.replace(/\./g, "");
  return (
    <>
      <header className="k-hero fe-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-festival" etiqueta="Ver el vídeo">
          <span className="fe-tinte" aria-hidden="true" />
        </HeroVideo>
        <div className="fe-rotulo k-hero-sale">
          <p className="fe-lineup">Line-up de una vida</p>
          <h1 className="fe-nombres display vt-nombres" style={{ fontSize: d.tamNombres(3.2, 17, 0.5, 6) }}>
            <span className="block">{d.a}</span>
            <Y className="fe-y" />
            <span className="block">{d.b}</span>
          </h1>
          <p className="fe-cuando">
            {mayuscula(d.fechaLarga)}
            {d.lugar && <span className="block">{d.lugar}</span>}
          </p>
          <CuentaPortada hasta={d.fechaIso} estilo="filete" className="k-cuenta festival-cuenta" />
          <a href="#k-inicio" className="k-baja fe-baja">
            Recoged vuestro pase
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </a>
        </div>
      </header>

      {/* La acreditación, colgada de su cordón: baja y se asienta al hacer scroll. */}
      <section id="k-inicio" className="fe-pase-escena" aria-label="Vuestro pase">
        <span className="fe-cordon" aria-hidden="true" />
        <FestivalFoil>
          <article className="fe-pase">
            <span className="fe-pase-ojal" aria-hidden="true" />
            <div className="fe-foil" aria-hidden="true" />
            <div className="fe-pase-cab">
              <span>Pase VIP</span>
              <span>Acceso total</span>
            </div>
            <p className="fe-pase-nombres">
              {d.a} <span className="fe-y">y</span> {d.b}
            </p>
            {d.frase && <p className="fe-pase-frase">{d.frase}</p>}
            <dl className="fe-pase-datos">
              <div>
                <dt>Fecha</dt>
                <dd className="tabular-nums">{d.numerica.replace(/\./g, " · ")}</dd>
              </div>
              <div>
                <dt>Puertas</dt>
                <dd className="tabular-nums">{d.hora}</dd>
              </div>
              {d.ciudad && (
                <div className="fe-pase-ancho">
                  <dt>Escenario</dt>
                  <dd>{d.lugar || d.ciudad}</dd>
                </div>
              )}
            </dl>
            <Perforado className="fe-pase-troquel" />
            <div className="fe-pase-pie">
              <Barras cifras={cifras} />
              <p className="tabular-nums">{d.numerica.replace(/\./g, "·")} · {d.iniciales}</p>
            </div>
          </article>
        </FestivalFoil>
      </section>
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

function Cuenta({ fecha, hora }: { fecha: string; hora: string }) {
  return (
    <section className="fe-seccion fe-cuenta">
      <p className="fe-antes">Cuenta atrás</p>
      <h2 className="sr-only">Lo que falta</h2>
      <FestivalCartel hasta={fecha} pie={`Escenario principal · Puertas ${hora}`} />
    </section>
  );
}

type Caps = Extract<Bloque, { t: "capitulos" }>;

/** El line-up de vuestra historia: la última línea es el cabeza de cartel. */
function LineUp({ titulo, capitulos }: Caps) {
  const n = capitulos.length;
  return (
    <section className="fe-seccion">
      <Titulo antes="Nuestra historia">{titulo ?? "El line-up"}</Titulo>
      <ol className="fe-lineup-lista k-ancho">
        {capitulos.map((c, i) => (
          <li key={c.titulo} data-k-escena="" data-cabeza={i === n - 1 ? "1" : undefined}>
            {c.cuando && <p className="fe-lineup-cuando">{c.cuando}</p>}
            <h3 className="display">{c.titulo}</h3>
            <p className="fe-lineup-texto">{c.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;

function Programa({ x, inv }: { x: Itin; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="fe-seccion">
        <Titulo antes="Cuándo y dónde">{x.titulo ?? "Horarios por escenario"}</Titulo>
        <ol className="fe-programa k-ancho" data-k-escena="">
          {x.paradas.map((p) => (
            <li key={p.titulo + p.hora}>
              <span className="fe-hora display tabular-nums">{p.hora}</span>
              <span className="fe-que">{p.titulo}</span>
              <span className="fe-donde">{p.lugar}</span>
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

function Pulseras({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="fe-seccion">
      <Titulo antes="Dress code">Código de pulsera</Titulo>
      <ul className="fe-pulseras k-ancho" aria-hidden="true">
        {paleta.map((c, i) => (
          <li key={c + i} data-k-escena="" style={{ "--c": c, "--i": i } as React.CSSProperties}>
            <span className="fe-pulsera" />
            <span className="fe-cierre" />
          </li>
        ))}
      </ul>
      {paleta.length > 0 && <p className="sr-only">Colores sugeridos: {paleta.join(", ")}.</p>}
      <p className="fe-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function Reverso(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="fe-reverso k-ancho" data-k-escena="">
      <p className="fe-reverso-cab" aria-hidden="true">Reverso del pase</p>
      <Regalos {...x} />
    </div>
  );
}

/** El talón: lo que se arranca al confirmar. Decorativo. */
function Talon({ a, b, numerica }: { a: string; b: string; numerica: string }) {
  return (
    <div className="fe-talon-escena" aria-hidden="true">
      <div className="fe-talon-pase">
        <span className="fe-talon-sello">Acceso confirmado</span>
        <span className="fe-talon-nombres">{a} y {b}</span>
      </div>
      <Perforado className="fe-talon-linea" />
      <div className="fe-talon">
        <span>Talón de asistencia</span>
        <span className="tabular-nums">{numerica}</span>
      </div>
    </div>
  );
}

function Confirmar({ x, inv, d }: { x: Extract<Bloque, { t: "rsvp" }>; inv: Props["inv"]; d: ReturnType<typeof datosPortada> }) {
  return (
    <>
      {x.limite && <LimiteRsvp limite={x.limite} motivo={x.motivoLimite} />}
      <MusicaRsvp
        slug={inv.slug}
        efecto="talon"
        frase="Te esperamos en primera fila{n}"
        arriba={<Talon a={d.a} b={d.b} numerica={d.numerica} />}
      >
        <Rsvp slug={inv.slug} {...x} />
      </MusicaRsvp>
    </>
  );
}

/** «Bis»: el cielo pasa del atardecer a la noche y se encienden luces de móvil. */
function Bis() {
  const luces = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 37 + (i % 3) * 11) % 100,
    y: 50 + ((i * 53) % 46),
    i,
  }));
  return (
    <section className="fe-bis" aria-label="Bis">
      <div className="fe-bis-cielo" aria-hidden="true">
        {luces.map((l) => (
          <span key={l.i} className="fe-luz" style={{ left: `${l.x}%`, top: `${l.y}%`, "--i": l.i } as React.CSSProperties} />
        ))}
      </div>
      <p className="fe-bis-t display">Bis</p>
      <p className="fe-bis-sub">Y que vuelva a sonar, todos los años, con vosotros.</p>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesFestival;

export default function Festival(props: Props) {
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
            cuentaAtras: b("cuentaAtras") && <Cuenta fecha={inv.pareja.fecha} hora={d.hora} />,
            capitulos: caps && <LineUp {...caps} />,
            itinerario: itin && <Programa x={itin} inv={inv} />,
            dressCode: dress && <Pulseras {...dress} />,
            regalos: regalos && <Reverso {...regalos} />,
            rsvp: rsvp && <Confirmar x={rsvp} inv={inv} d={d} />,
          },
          tonos: { cuentaAtras: "hondo", dressCode: "velo", alojamiento: "velo" },
        }}
      />
      <Bis />
      <Despedida inv={inv} ornamento="punto" flor={<Perforado className="fe-perforado-cierre" />} />
      <GuionEscenas />
    </Lienzo>
  );
}
