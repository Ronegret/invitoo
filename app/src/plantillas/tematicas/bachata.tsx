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
import { BachataCuerdas } from "./BachataPiezas";
import { GuionEscenas } from "./escenas";
import { fuentesBachata } from "./fuentes/bachata";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import MusicaRsvp from "./MusicaRsvp";
import "./tematicas.css";
import "./musicales.css";
import "./bachata.css";

/**
 * LUNA DE BACHATA — K4. docs/16b §5.
 *
 * El objeto noble: una guitarra de cedro a la luz de una vela, nunca
 * corazones ni morado chillón. Berenjena #1b1324, lila de luna #c99ad8,
 * rosa de vela y oro rosa en las cuerdas. Íntimo, lento y muy romántico.
 *
 * El guion:
 *  1. Cabecera: «Bailemos despacio», vuestro vídeo teñido de berenjena.
 *  2. La luna sube detrás de vuestras palabras al bajar.
 *  3. «Nuestra canción»: los capítulos son estrofas que se enfocan.
 *  4. Una vela se enciende al llegar la fecha y el lugar.
 *  5. El ritmo de la noche (1-2-3-tap) marca cada hora.
 *  6. MOMENTO WOW · las cuatro cuerdas: la cuenta atrás vibra y se toca.
 *  7. Morados, empolvados y piel: cintas de seda que se despliegan.
 *  8. La luna baja y queda la vela; después, la firma.
 */

// Metraje provisional: public/aperturas/lino (encaje y manos), virado a
// violeta. Lo sustituye el vídeo de los novios.
const HERO: FuenteVideo = {
  vertical: "/aperturas/lino/vertical.mp4",
  horizontal: "/aperturas/lino/horizontal.mp4",
  poster: "/tematicas/bachata/poster-v.avif",
  posterHorizontal: "/tematicas/bachata/poster-h.avif",
  webm: "/tematicas/bachata/hero-v.webm",
  webmHorizontal: "/tematicas/bachata/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/** La cuerda: cuatro hilos finos con un traste. */
function Cuerda({ className = "" }: { className?: string }) {
  return (
    <svg className={`ba-orn ${className}`} viewBox="0 0 140 16" aria-hidden="true">
      <path d="M0 3.5H140M0 6.5H140M0 9.5H140M0 12.5H140" />
      <rect x="68" y="0" width="4" height="16" rx="1" />
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="ba-titulo" data-k-escena="">
      {antes && <p className="ba-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Cuerda />
    </div>
  );
}

function Vela({ className = "" }: { className?: string }) {
  return (
    <span className={`ba-vela ${className}`} aria-hidden="true">
      <span className="ba-halo" />
      <span className="ba-llama" />
      <span className="ba-cera" />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <>
      <header className="k-hero ba-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-bachata" etiqueta="Ver el vídeo">
          <span className="ba-tinte" aria-hidden="true" />
        </HeroVideo>
        <div className="ba-rotulo k-hero-sale">
          <p className="ba-despacio display">Bailemos despacio</p>
          <h1 className="ba-nombres vt-nombres" style={{ fontSize: d.tamNombres(3.4, 17, 0.42, 6.2) }}>
            <span className="block">{d.a}</span>
            <Y className="ba-y" />
            <span className="block">{d.b}</span>
          </h1>
          <p className="ba-cuando">
            {mayuscula(d.fechaLarga)}
            {d.lugar && <span className="block">{d.lugar}</span>}
          </p>
          <a href="#k-inicio" className="k-baja ba-baja">
            Acercaos
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </a>
        </div>
      </header>

      <section id="k-inicio" className="ba-luna-escena" aria-label="Unas palabras de los novios">
        <div className="ba-luna-fijo">
          <span className="ba-luna" aria-hidden="true" />
          {d.frase ? (
            <blockquote className="ba-frase display">{d.frase}</blockquote>
          ) : (
            <p className="ba-frase display">Una canción lenta, y vosotros cerca.</p>
          )}
          <p className="ba-firma-luna">{d.a} <span>y</span> {d.b}</p>
        </div>
      </section>
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

type Caps = Extract<Bloque, { t: "capitulos" }>;

function Cancion({ titulo, capitulos }: Caps) {
  const n = capitulos.length;
  return (
    <section className="ba-seccion">
      <Titulo antes="Nuestra historia">{titulo ?? "Nuestra canción"}</Titulo>
      <ol className="ba-estrofas k-ancho">
        {capitulos.map((c, i) => (
          <li key={c.titulo} data-k-escena="">
            <p className="ba-estrofa-n">{i === n - 1 ? "Estribillo" : ROMANOS[i] ?? String(i + 1)}</p>
            <h3 className="display">{c.titulo}</h3>
            {c.cuando && <p className="ba-estrofa-cuando">{c.cuando}</p>}
            <p className="ba-estrofa-texto">{c.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;
const BASICO = ["1", "2", "3", "tap"];

function LaNoche({ x, inv, d }: { x: Itin; inv: Props["inv"]; d: ReturnType<typeof datosPortada> }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="ba-seccion">
        <div className="ba-velada k-ancho" data-k-escena="">
          <Vela />
          <p className="ba-antes">Cuándo y dónde</p>
          <p className="ba-velada-fecha display">{mayuscula(d.fechaLarga)}</p>
          {primera && (
            <p className="ba-velada-lugar">
              {primera.lugar} · a las {primera.hora}
            </p>
          )}
        </div>
      </section>
      <section className="ba-seccion">
        <Titulo antes="El día">{x.titulo ?? "El ritmo de la noche"}</Titulo>
        <ol className="ba-ritmo k-ancho" data-k-escena="">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora}>
              <span className="ba-paso" aria-hidden="true">{BASICO[i % 4]}</span>
              <span className="ba-ritmo-hora display tabular-nums">{p.hora}</span>
              <span className="ba-ritmo-que">{p.titulo}</span>
              <span className="ba-ritmo-donde">{p.lugar}</span>
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
    <section className="ba-seccion ba-cuenta">
      <Titulo antes="Faltan">Cuatro cuerdas</Titulo>
      <BachataCuerdas hasta={fecha} />
    </section>
  );
}

function Cintas({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="ba-seccion">
      <Titulo antes="Dress code">Morados, empolvados y piel</Titulo>
      <ul className="ba-cintas k-ancho" aria-hidden="true">
        {paleta.map((c, i) => (
          <li key={c + i} style={{ "--c": c, "--i": i } as React.CSSProperties} />
        ))}
      </ul>
      {paleta.length > 0 && <p className="sr-only">Colores sugeridos: {paleta.join(", ")}.</p>}
      <p className="ba-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function Detalle(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="ba-detalle k-ancho" data-k-escena="">
      <Regalos {...x} />
    </div>
  );
}

/** La boca de la guitarra, con su roseta y las cuerdas que la cruzan. */
function Boca() {
  return (
    <div className="ba-boca-escena" aria-hidden="true">
      <span className="ba-boca">
        <span className="ba-roseta" />
        <span className="ba-boca-cuerdas"><i /><i /><i /><i /></span>
      </span>
    </div>
  );
}

function Confirmar({ x, inv }: { x: Extract<Bloque, { t: "rsvp" }>; inv: Props["inv"] }) {
  return (
    <>
      {x.limite && <LimiteRsvp limite={x.limite} motivo={x.motivoLimite} />}
      <MusicaRsvp slug={inv.slug} efecto="bachata" frase="Guardamos vuestro baile{n}" arriba={<Boca />}>
        <Rsvp slug={inv.slug} {...x} />
      </MusicaRsvp>
    </>
  );
}

/** La luna baja y queda la vela. */
function QuedaLaVela() {
  return (
    <section className="ba-final" aria-label="Fin de la noche">
      <span className="ba-luna ba-luna-baja" aria-hidden="true" />
      <Vela className="ba-vela-final" />
      <p className="ba-final-t display">Y, al final, una vela y nosotros</p>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesBachata;

export default function Bachata(props: Props) {
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
            capitulos: caps && <Cancion {...caps} />,
            itinerario: itin && <LaNoche x={itin} inv={inv} d={d} />,
            cuentaAtras: b("cuentaAtras") && <Cuenta fecha={inv.pareja.fecha} />,
            dressCode: dress && <Cintas {...dress} />,
            regalos: regalos && <Detalle {...regalos} />,
            rsvp: rsvp && <Confirmar x={rsvp} inv={inv} />,
          },
          tonos: { cuentaAtras: "hondo", alojamiento: "velo" },
        }}
      />
      <QuedaLaVela />
      <Despedida inv={inv} ornamento="punto" flor={<Cuerda className="ba-orn-cierre" />} />
      <GuionEscenas />
    </Lienzo>
  );
}
