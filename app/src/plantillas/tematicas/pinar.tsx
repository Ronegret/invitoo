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
import { fuentesPinar } from "./fuentes/pinar";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import PinarCuenta from "./PinarCuenta";
import PinarToque from "./PinarToque";
import "./tematicas.css";
import "./pinar.css";

/**
 * BOSQUE ENCANTADO (`pinar`, K3) — docs/16a §8.
 *
 * Kraft claro #ECE4D3, verde casi negro #1F2A22, verde pino #2F5D3A y cobre
 * (#A07D4A, solo adorno). Young Serif + Karla + Sacramento.
 *
 * El guion (un solo wow, en dos actos con el mismo gesto):
 *  1. Cabecera: el claro del bosque en vídeo, con niebla; dos helechos en
 *     primer plano. Al bajar, EL BOSQUE SE ABRE: los helechos se apartan y
 *     la cámara entra.
 *  2. La historia, en tarjetas kraft colgadas de una rama con cordel.
 *  3. Respiro: foto con parallax de tres capas (foto, rama, niebla).
 *  4. Cuándo y dónde: CAE LA NOCHE y se encienden las luciérnagas.
 *  5. La rodaja de tronco: un anillo más cada día que falta menos.
 *  6. El sendero: carteles de madera con la hora.
 *  7. Tonos de bosque: hojas que caen y se posan.
 *  8. Una caja de madera con cordel para los regalos.
 */

// El vídeo de la casa mientras no haya uno de la pareja: el claro con el
// arco entre pinos (metraje propio, `aperturas/marea`, recortado y en bucle).
const HERO: FuenteVideo = {
  vertical: "/aperturas/marea/vertical.mp4",
  horizontal: "/aperturas/marea/horizontal.mp4",
  poster: "/tematicas/pinar/poster-v.avif",
  posterHorizontal: "/tematicas/pinar/poster-h.avif",
  webm: "/tematicas/pinar/hero-v.webm",
  webmHorizontal: "/tematicas/pinar/hero-h.webm",
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

/** Pseudoaleatorio con semilla: el mismo HTML en servidor y cliente. */
function semilla(n: number) {
  let s = n || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const hash = (t: string) => [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 7);

// ────────────────────────────────────────────────────────────── dibujos

/** Una fronda de helecho: tallo curvo y foliolos que menguan hacia la punta. */
function frondaHelecho() {
  const P = (t: number) => {
    // Bézier cuadrática: (14,236) → (20,90) → (92,8)
    const x = (1 - t) ** 2 * 14 + 2 * (1 - t) * t * 20 + t * t * 92;
    const y = (1 - t) ** 2 * 236 + 2 * (1 - t) * t * 90 + t * t * 8;
    return [x, y];
  };
  let d = "M14 236 Q20 90 92 8";
  for (let k = 1; k < 19; k++) {
    const t = k / 19;
    const [x, y] = P(t);
    const [x2, y2] = P(Math.min(1, t + 0.01));
    const ang = Math.atan2(y2 - y, x2 - x);
    const largo = 34 * (1 - t * 0.78);
    for (const s of [-1, 1]) {
      const a = ang + s * 1.15;
      const ex = x + Math.cos(a) * largo;
      const ey = y + Math.sin(a) * largo;
      const cx = x + Math.cos(a + s * 0.35) * largo * 0.55;
      const cy = y + Math.sin(a + s * 0.35) * largo * 0.55;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }
  }
  return d;
}
const FRONDA = frondaHelecho();

function Helecho({ lado }: { lado: "izq" | "der" }) {
  return (
    <svg className="pi-helecho" data-lado={lado} viewBox="0 0 110 240" aria-hidden="true">
      <path d={FRONDA} />
      <path d={FRONDA} transform="translate(30 10) rotate(14 14 236) scale(.8)" opacity=".75" />
    </svg>
  );
}

/** Una ramita de pino: eje y agujas en abanico. */
function RamaPino({ className = "" }: { className?: string }) {
  const agujas: string[] = [];
  for (let k = 0; k < 22; k++) {
    const x = 8 + k * 9;
    const y = 30 - Math.sin(k / 7) * 6;
    const l = 22 - Math.abs(k - 9) * 0.6;
    agujas.push(`M${x} ${y.toFixed(1)}l${(l * 0.45).toFixed(1)} ${(-l).toFixed(1)}M${x} ${y.toFixed(1)}l${(l * 0.5).toFixed(1)} ${(l * 0.9).toFixed(1)}`);
  }
  return (
    <svg className={`pi-pino ${className}`} viewBox="0 0 220 60" aria-hidden="true">
      <path className="pi-pino-eje" d="M0 32 Q90 22 214 30" />
      <path className="pi-pino-agujas" d={agujas.join("")} />
    </svg>
  );
}

/** Separador: un filete de cordel con una hoja de eucalipto en medio. */
function Vineta() {
  return (
    <span className="pi-vineta" aria-hidden="true">
      <span />
      <svg viewBox="0 0 24 24">
        <path d="M12 3c5 4 5 13 0 18-5-5-5-14 0-18Z" />
        <path d="M12 5v15" className="pi-nervio" />
      </svg>
      <span />
    </span>
  );
}

function Titulo({ antes, children, id }: { antes?: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="pi-titulo">
      {antes && <p className="pi-antes">{antes}</p>}
      <h2 id={id} className="display sin-orn">{children}</h2>
      <Vineta />
    </div>
  );
}

// ────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="k-hero pi-hero">
      <HeroVideo fuente={fuenteHero(props)} clase="grad-pinar" etiqueta="Ver el vídeo">
        <span className="pi-velo" aria-hidden="true" />
        <span className="pi-niebla" aria-hidden="true" />
      </HeroVideo>
      <Helecho lado="izq" />
      <Helecho lado="der" />
      <div className="pi-rotulo k-hero-sale">
        <h1 className="pi-nombres" style={{ fontSize: d.tamNombres(2.6, 15, 0.62, 4.6) }}>
          <span className="block">{d.a}</span>
          <span className="pi-y">y</span>
          <span className="block">{d.b}</span>
        </h1>
        <p className="pi-lema">nos casamos en el bosque</p>
        <p className="pi-fecha">{mayuscula(d.fechaLarga)}</p>
        {d.lugar && <p className="pi-lugar">{d.lugar}</p>}
        <a href="#k-inicio" className="k-baja pi-baja">
          Entrad en el bosque
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </div>
    </header>
  );
}

// ────────────────────────────────────────────── historia: colgada de una rama

type Caps = Extract<Bloque, { t: "capitulos" }>;

function Colgadas({ x }: { x: Caps }) {
  return (
    <section id="k-inicio" className="pi-seccion pi-historia" aria-labelledby="pi-historia">
      <Titulo antes="Nuestra historia" id="pi-historia">{x.titulo ?? "Cómo empezó todo"}</Titulo>
      <div className="pi-rama-larga" aria-hidden="true">
        <RamaPino />
      </div>
      <ol className="pi-colgadas k-ancho">
        {x.capitulos.map((c, i) => (
          <li key={c.titulo} className="pi-colgada" data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
            <span className="pi-cordel" aria-hidden="true" />
            <article className="pi-tarjeta">
              {c.cuando && <p className="pi-cuando">{c.cuando}</p>}
              <h3 className="pi-cap">{c.titulo}</h3>
              {c.foto && (
                /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
                <img className="pi-foto" src={c.foto} alt="" width={480} height={360} loading="lazy" decoding="async" />
              )}
              <p className="pi-texto">{c.texto}</p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ──────────────────────────────────────────── respiro: tres capas de parallax

function Claro({ foto, frase }: { foto?: string; frase: string }) {
  if (!foto) return null;
  return (
    <section className="pi-claro" aria-label="Un respiro">
      {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
      <img className="pi-claro-foto" src={foto} alt="" width={900} height={1200} loading="lazy" decoding="async" />
      <span className="pi-claro-niebla" aria-hidden="true" />
      <RamaPino className="pi-claro-rama" />
      <p className="pi-claro-frase">{frase}</p>
    </section>
  );
}

// ──────────────────────────────── cuándo y dónde: cae la noche, luciérnagas

function Luciernagas({ semillaDe }: { semillaDe: string }) {
  const r = semilla(hash(semillaDe));
  const puntos = Array.from({ length: 14 }, (_, i) => {
    const izq = i % 2 === 0;
    return {
      x: (izq ? 1 + r() * 11 : 88 + r() * 10).toFixed(1),
      y: (4 + r() * 90).toFixed(1),
      t: (6 + r() * 3).toFixed(1),
      d: (-r() * 6).toFixed(1),
    };
  });
  return (
    <div className="pi-luciernagas" aria-hidden="true">
      {puntos.map((p, i) => (
        <i key={i} style={{ left: `${p.x}%`, top: `${p.y}%`, "--t": `${p.t}s`, "--d": `${p.d}s` } as React.CSSProperties} />
      ))}
    </div>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;

function Bosque({ x, props, conCuenta }: { x: Itin; props: Props; conCuenta: boolean }) {
  const { inv } = props;
  const d = datosPortada(props);
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="pi-noche" aria-labelledby="pi-cuando">
        <Luciernagas semillaDe={inv.slug} />
        <div className="pi-noche-dentro" data-k-escena="">
          <Titulo antes="Al caer la tarde…" id="pi-cuando">Cuándo y dónde</Titulo>
          <p className="pi-noche-fecha display">{mayuscula(d.fechaLarga)}</p>
          {primera && (
            <>
              <p className="pi-noche-hora">a las {primera.hora}</p>
              <p className="pi-noche-lugar">{primera.lugar}</p>
              <p className="pi-noche-dir">{primera.direccion}</p>
            </>
          )}
        </div>
      </section>
      {conCuenta && <Anillos fecha={fecha} />}
      <section className="pi-seccion" aria-labelledby="pi-sendero">
        <Titulo antes="Paso a paso" id="pi-sendero">{x.titulo ?? "El programa"}</Titulo>
        <div className="pi-sendero k-ancho">
          <svg className="pi-camino" viewBox="0 0 40 400" preserveAspectRatio="none" aria-hidden="true">
            <path d="M20 0 C36 50 4 110 20 170 S36 300 20 400" pathLength={1} />
          </svg>
          <ol>
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} className="pi-parada" data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
              <span className="pi-icono" aria-hidden="true">
                <Icono id={p.icono ?? "copas"} size={22} />
              </span>
              <span className="pi-cartel">
                <span className="pi-hora tabular-nums">{p.hora}</span>
                <span className="pi-que">{p.titulo}</span>
                <span className="pi-donde">
                  {p.lugar}
                  {sitio(p.direccion) && <> · {sitio(p.direccion)}</>}
                </span>
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

function Anillos({ fecha }: { fecha: string }) {
  return (
    <section className="pi-seccion" aria-labelledby="pi-faltan">
      <Titulo antes="Cada día, un anillo más" id="pi-faltan">Faltan</Titulo>
      <div data-k-escena="">
        <PinarCuenta hasta={fecha} />
      </div>
    </section>
  );
}

// ────────────────────────────────────────────── dress code: hojas que caen

function Hojas({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="pi-seccion" aria-labelledby="pi-dress">
      <Titulo antes="Dress code" id="pi-dress">Tonos de bosque</Titulo>
      <ul className="pi-hojas" aria-label="Colores sugeridos">
        {paleta.map((c, i) => (
          <li key={c + i} data-k-escena="" style={{ "--c": c, "--i": i } as React.CSSProperties}>
            <svg viewBox="0 0 40 64" aria-hidden="true">
              <path className="pi-hoja-lamina" d="M20 2C36 16 36 46 20 62 4 46 4 16 20 2Z" />
              <path className="pi-hoja-nervio" d="M20 6V60M20 22l-8-6M20 22l8-6M20 34l-9-6M20 34l9-6M20 46l-8-6M20 46l8-6" />
            </svg>
            <span className="sr-only">{c}</span>
          </li>
        ))}
      </ul>
      <p className="pi-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function Caja(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="pi-caja k-ancho" data-k-escena="">
      <span className="pi-nudo" aria-hidden="true" />
      <Regalos {...x} />
    </div>
  );
}

export const fuentes = fuentesPinar;

export default function Pinar(props: Props) {
  const { b, inv } = props;
  const caps = b("capitulos");
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  const galeria = b("galeria");
  const cuenta = Boolean(b("cuentaAtras"));
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <PinarToque />
      <Portada {...props} />
      {!caps && <div id="k-inicio" />}
      <Secciones
        {...props}
        opciones={{
          piezas: {
            capitulos: caps && <Colgadas x={caps} />,
            respiro: (
              <Claro
                foto={galeria?.fotos[2] ?? galeria?.fotos[0]}
                frase="Donde los pinos guardan silencio, nosotros diremos que sí."
              />
            ),
            // Con itinerario, la cuenta atrás va DENTRO, entre el cuándo y el programa.
            itinerario: itin && <Bosque x={itin} props={props} conCuenta={cuenta} />,
            cuentaAtras: itin ? null : cuenta && <Anillos fecha={inv.pareja.fecha} />,
            dressCode: dress && <Hojas {...dress} />,
            regalos: regalos && <Caja {...regalos} />,
          },
          tonos: { alojamiento: "velo", notas: "velo" },
        }}
      />
      <Despedida inv={inv} ornamento="rama" />
      <GuionEscenas />
    </Lienzo>
  );
}
