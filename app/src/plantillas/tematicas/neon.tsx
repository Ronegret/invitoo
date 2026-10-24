import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import { horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { GuionEscenas } from "./escenas";
import { fuentesNeon } from "./fuentes/neon";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import MusicaRsvp from "./MusicaRsvp";
import { NeonPista } from "./NeonPiezas";
import "./tematicas.css";
import "./musicales.css";
import "./neon.css";

/**
 * NEÓN DE MEDIANOCHE (Reggaeton y fiesta) — K4. docs/16b §3.
 *
 * El objeto noble: un rótulo de neón soplado a mano sobre cristal negro, no
 * flúor ni graffiti. Negro tinta #0a0910, rosa desaturado #ff5fa8 y un
 * segundo tubo violeta. La regla del neón elegante: como mucho dos piezas
 * encendidas por pantalla, resplandor ≤ 18 px y ≤ 0,55, nada de arcoíris.
 *
 * El guion:
 *  1. MOMENTO WOW · al salir la apertura, vuestros nombres se encienden
 *     letra a letra, tubo a tubo, con su reflejo en el asfalto mojado. Al
 *     bajar, el vídeo se acerca y se oscurece.
 *  2. La puerta: «Lista de invitados» y un cordón de terciopelo que se abre.
 *  3. El set de la noche: una línea de neón baja y enciende cada hora.
 *  4. La pista: la cuenta atrás en baldosas de cristal.
 *  5. Historia en tarjetas de cristal cuyo filete de neón da una vuelta.
 *  6. Negro y brillo (dress code): muestras de cristal con un reflejo.
 *  7. Al confirmar, se enciende el rótulo «Nos vemos en la pista».
 *  8. La última: el cielo clarea hacia un amanecer violeta.
 */

// Metraje provisional: public/aperturas/bruma (orquídeas), virado a noche
// rosa y violeta en CSS. Lo sustituye el vídeo de los novios.
const HERO: FuenteVideo = {
  vertical: "/aperturas/bruma/vertical.mp4",
  horizontal: "/aperturas/bruma/horizontal.mp4",
  poster: "/tematicas/neon/poster-v.avif",
  posterHorizontal: "/tematicas/neon/poster-h.avif",
  webm: "/tematicas/neon/hero-v.webm",
  webmHorizontal: "/tematicas/neon/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** El tubo: un trazo de neón con sus dos electrodos. */
function Tubo({ className = "" }: { className?: string }) {
  return (
    <svg className={`ne-tubo ${className}`} viewBox="0 0 140 16" aria-hidden="true">
      <rect x="1" y="5" width="8" height="6" rx="1.5" className="ne-tubo-e" />
      <path d="M12 8 C40 2 52 14 70 8 S100 2 128 8" className="ne-tubo-luz" />
      <rect x="131" y="5" width="8" height="6" rx="1.5" className="ne-tubo-e" />
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="ne-titulo" data-k-escena="">
      {antes && <p className="ne-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Tubo />
    </div>
  );
}

/** Cada letra es un tubo que se enciende. El nombre real va en el aria-label. */
function Letras({ texto, desde }: { texto: string; desde: number }) {
  return (
    <>
      {Array.from(texto).map((l, i) => (
        <span key={i} className="ne-l" aria-hidden="true" style={{ "--i": desde + i } as React.CSSProperties}>
          {l}
        </span>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  const tam = d.tamNombres(3.4, 17, 0.42, 6);
  const nombres = (
    <>
      <span className="block"><Letras texto={d.a} desde={0} /></span>
      <span className="ne-y" aria-hidden="true" style={{ "--i": d.a.length } as React.CSSProperties}>y</span>
      <span className="block"><Letras texto={d.b} desde={d.a.length + 1} /></span>
    </>
  );
  return (
    <>
    <header className="k-hero ne-hero">
      <HeroVideo fuente={fuenteHero(props)} clase="grad-neon" etiqueta="Ver el vídeo">
        <span className="ne-tinte" aria-hidden="true" />
      </HeroVideo>
      <div className="ne-rotulo k-hero-sale">
        <h1 className="ne-nombres vt-nombres wow" aria-label={`${d.a} y ${d.b}`} style={{ fontSize: tam }}>
          {nombres}
        </h1>
        {/* El reflejo en el asfalto mojado. */}
        <div className="ne-reflejo wow decor" aria-hidden="true" style={{ fontSize: tam }}>
          {nombres}
        </div>
        <p className="ne-cuando display tabular-nums">
          {d.numerica.replace(/\./g, " · ")} — desde las {d.hora}
        </p>
        <p className="ne-lugar">{mayuscula(d.fechaLarga)}{d.lugar && <> · {d.lugar}</>}</p>
        <a href="#k-inicio" className="k-baja ne-baja">
          Entrad
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </div>
    </header>
    <div id="k-inicio" />
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

type Itin = Extract<Bloque, { t: "itinerario" }>;

function LaNoche({ x, inv, d }: { x: Itin; inv: Props["inv"]; d: ReturnType<typeof datosPortada> }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="ne-seccion">
        <div className="ne-puerta k-ancho" data-k-escena="">
          <span className="ne-cordon" aria-hidden="true">
            <span className="ne-poste a" />
            <svg viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M10 8 C60 62 140 62 190 8" /></svg>
            <span className="ne-poste b" />
          </span>
          <p className="ne-antes">Lista de invitados</p>
          <p className="ne-puerta-t display">{d.a} y {d.b}</p>
          {d.frase && <p className="ne-puerta-frase">{d.frase}</p>}
          <p className="ne-puerta-dato tabular-nums">{mayuscula(d.fechaLarga)}</p>
          {primera && <p className="ne-puerta-dato">{primera.lugar}</p>}
        </div>
      </section>
      <section className="ne-seccion">
        <Titulo antes="Cuándo y dónde">{x.titulo ?? "El set de la noche"}</Titulo>
        <ol className="ne-set k-ancho" data-k-escena="">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} style={{ "--i": i, "--n": x.paradas.length } as React.CSSProperties}>
              <span className="ne-set-hora display tabular-nums">{p.hora}</span>
              <span className="ne-set-que">{p.titulo}</span>
              <span className="ne-set-donde">{p.lugar}</span>
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
    <section className="ne-seccion">
      <Titulo antes="Faltan">La pista</Titulo>
      <NeonPista hasta={fecha} />
    </section>
  );
}

type Caps = Extract<Bloque, { t: "capitulos" }>;

function Historia({ titulo, capitulos }: Caps) {
  return (
    <section className="ne-seccion">
      <Titulo antes="Nuestra historia">{titulo ?? "Así empezó"}</Titulo>
      <ol className="ne-capitulos k-ancho">
        {capitulos.map((c) => (
          <li key={c.titulo} className="ne-cristal" data-k-escena="">
            {c.foto && (
              /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
              <img src={c.foto} alt="" width={640} height={480} loading="lazy" decoding="async" className="ne-cap-foto" />
            )}
            <div className="ne-cap-texto">
              {c.cuando && <p className="ne-cap-cuando">{c.cuando}</p>}
              <h3 className="display">{c.titulo}</h3>
              <p>{c.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NegroYBrillo({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="ne-seccion">
      <Titulo antes="Dress code">Negro y brillo</Titulo>
      <ul className="ne-muestras" aria-hidden="true">
        {paleta.map((c, i) => (
          <li key={c + i} data-k-escena="" style={{ "--c": c, "--i": i } as React.CSSProperties} />
        ))}
      </ul>
      {paleta.length > 0 && <p className="sr-only">Colores sugeridos: {paleta.join(", ")}.</p>}
      <p className="ne-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function Detalle(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="ne-detalle ne-cristal k-ancho" data-k-escena="">
      <Regalos {...x} />
    </div>
  );
}

function Rotulo() {
  return (
    <div className="ne-rotulo-rsvp" aria-hidden="true">
      <span className="ne-rotulo-t">Nos vemos en la pista</span>
    </div>
  );
}

function Confirmar({ x, inv }: { x: Extract<Bloque, { t: "rsvp" }>; inv: Props["inv"] }) {
  return (
    <>
      {x.limite && <LimiteRsvp limite={x.limite} motivo={x.motivoLimite} />}
      <MusicaRsvp slug={inv.slug} efecto="neon" frase="¡Tu nombre ya está en la lista{n}!" arriba={<Rotulo />}>
        <Rsvp slug={inv.slug} {...x} />
      </MusicaRsvp>
    </>
  );
}

/** La última: el cielo clarea hacia un amanecer violeta. */
function Amanecer() {
  return (
    <section className="ne-amanecer" aria-label="La última">
      <p className="ne-antes">La última</p>
      <p className="ne-amanecer-t display">Hasta que salga el sol</p>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesNeon;

export default function Neon(props: Props) {
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
            itinerario: itin && <LaNoche x={itin} inv={inv} d={d} />,
            cuentaAtras: b("cuentaAtras") && <Cuenta fecha={inv.pareja.fecha} />,
            capitulos: caps && <Historia {...caps} />,
            dressCode: dress && <NegroYBrillo {...dress} />,
            regalos: regalos && <Detalle {...regalos} />,
            rsvp: rsvp && <Confirmar x={rsvp} inv={inv} />,
          },
          tonos: { cuentaAtras: "hondo", alojamiento: "velo" },
        }}
      />
      <Amanecer />
      <Despedida inv={inv} ornamento="punto" flor={<Tubo className="ne-tubo-cierre" />} />
      <GuionEscenas />
    </Lienzo>
  );
}
