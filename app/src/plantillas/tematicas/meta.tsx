import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import { formatearFecha, horaDelDia, partesMadrid } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, Y, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { Enfoca } from "../vida";
import { GuionEscenas } from "./escenas";
import { fuentesMeta } from "./fuentes/meta";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import { MetaCinta, MetaMedalla, MetaReloj } from "./MetaPiezas";
import "./tematicas.css";
import "./meta.css";

/**
 * LÍNEA DE META (Runners) — K5. docs/16b §8.
 *
 * El objeto noble: el dorsal de Tyvek con sus cuatro imperdibles, la
 * medalla fundida y el cronómetro. Blanco roto, tinta, un naranja de
 * energía (--acento), azul de calle y oro de medalla (solo adorno).
 * Archivo expandida + Albert Sans + Chivo Mono para los tiempos.
 *
 * El guion:
 *  1. Cabecera: vuestro vídeo y, encima, el dorsal con el número de la
 *     fecha (1206 = 12 de junio); se tensa al llegar y las calles de la
 *     pista corren debajo al bajar.
 *  2. «Nuestros parciales»: km 0, km 21, km 42; una barra se llena.
 *  3. «Salida»: el arco se dibuja; «Avituallamientos»: el horario por mojones.
 *  4. El reloj de meta y los kilómetros que faltan.
 *  5. RSVP: la cinta se rompe y cae la medalla (el momento wow).
 *  6. Cierre: la medalla se balancea; un toque y se da la vuelta.
 */

const fuente: FuenteVideo = {
  vertical: "/aperturas/cielo/vertical.mp4",
  horizontal: "/aperturas/cielo/horizontal.mp4",
  poster: "/tematicas/meta/poster-v.avif",
  posterHorizontal: "/tematicas/meta/poster-h.avif",
  webm: "/tematicas/meta/hero-v.webm",
  webmHorizontal: "/tematicas/meta/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return fuente;
}

function sitio(direccion?: string) {
  const t = (direccion ?? "").split(",").map((s) => s.trim().replace(/^\d{5}\s*/, "")).filter(Boolean);
  return t.at(-1) ?? "";
}

/** El ornamento: una cinta de meta tensada entre dos postes. */
function Cinta({ className = "" }: { className?: string }) {
  return (
    <svg className={`mt-orn ${className}`} viewBox="0 0 160 24" aria-hidden="true">
      <path d="M8 2 V22 M152 2 V22" className="mt-orn-poste" />
      <path pathLength={1} d="M8 8 Q80 14 152 8" className="mt-orn-cinta" />
    </svg>
  );
}

function Imperdible({ className }: { className: string }) {
  return (
    <svg className={`mt-imperdible ${className}`} viewBox="0 0 36 12" aria-hidden="true">
      <path d="M4 6 H28 Q33 6 33 3.5 Q33 1 30 1 H8" />
      <circle cx="4" cy="6" r="2.6" />
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="mt-titulo" data-k-escena="">
      {antes && <p className="mt-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Cinta />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  const p = partesMadrid(props.inv.pareja.fecha);
  const numero = `${String(p.dia).padStart(2, "0")}${String(p.mes).padStart(2, "0")}`;
  return (
    <>
      <header className="k-hero mt-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-meta" etiqueta="Ver el vídeo">
          <span className="mt-velo" aria-hidden="true" />
        </HeroVideo>
        <div className="mt-calles" aria-hidden="true" />
        <div className="mt-dorsal k-hero-sale">
          <Imperdible className="a" />
          <Imperdible className="b" />
          <Imperdible className="c" />
          <Imperdible className="d" />
          <p className="mt-dorsal-cab">
            <span>Salida</span>
            <span className="tabular-nums">{d.anio}</span>
          </p>
          <p className="mt-dorsal-num display tabular-nums" aria-hidden="true">{numero}</p>
          <h1 className="mt-nombres display" style={{ fontSize: d.tamNombres(1.9, 10.5, 0.74, 3.2) }}>
            {d.a} <Y className="mt-y" /> {d.b}
          </h1>
          <p className="mt-salida">
            Salida: <span className="tabular-nums">{d.fechaCorta}, {d.hora}</span>
            {d.lugar && <span className="block">{d.lugar}</span>}
          </p>
        </div>
        <a href="#k-inicio" className="k-baja mt-baja">
          Al ritmo de la invitación
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </header>
      <div id="k-inicio" />
      {d.frase && (
        <section className="mt-frase k-ancho" aria-label="Unas palabras de los novios">
          <blockquote className="display">
            <Enfoca texto={d.frase} />
          </blockquote>
        </section>
      )}
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

/** El kilómetro de cada capítulo: del 0 a la meta. */
function kmDe(i: number, n: number) {
  if (n <= 1) return "km 42";
  const k = (i / (n - 1)) * 42.195;
  return i === n - 1 ? "km 42,195" : `km ${Math.round(k)}`;
}

function Parciales({ titulo, capitulos }: Extract<Bloque, { t: "capitulos" }>) {
  return (
    <section className="mt-seccion">
      <Titulo antes="Nuestra historia">{titulo ?? "Nuestros parciales"}</Titulo>
      <ol className="mt-parciales k-ancho">
        {capitulos.map((c, i) => (
          <li key={c.titulo} data-k-escena="">
            <p className="mt-parcial-km acento tabular-nums">{kmDe(i, capitulos.length)}</p>
            {c.cuando && <p className="mt-parcial-cuando">{c.cuando}</p>}
            <h3 className="display">{c.titulo}</h3>
            <p>{c.texto}</p>
            {c.foto && (
              // eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado
              <img className="mt-parcial-foto" src={c.foto} alt="" width={600} height={750} loading="lazy" decoding="async" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;
const MOJONES = [0, 10, 21, 30, 42];

function Salida({ x, inv }: { x: Itin; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="mt-seccion mt-salida-zona">
        <Titulo antes="Cuándo y dónde">Salida</Titulo>
        {primera && (
          <div className="mt-arco k-ancho" data-k-escena="">
            <svg viewBox="0 0 300 150" aria-hidden="true">
              <path pathLength={1} d="M20 148 V60 Q20 14 150 14 Q280 14 280 60 V148" />
              <path pathLength={1} d="M38 148 V64 Q38 32 150 32 Q262 32 262 64 V148" className="fino" />
            </svg>
            <p className="mt-arco-hora acento tabular-nums">{primera.hora}</p>
            <p className="mt-arco-dia first-letter:uppercase">{formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" })}</p>
            <p className="mt-arco-lugar">{primera.lugar}</p>
            {sitio(primera.direccion) && <p className="mt-arco-sitio">{sitio(primera.direccion)}</p>}
          </div>
        )}
      </section>
      <section className="mt-seccion mt-avit">
        <Titulo antes="El día">{x.titulo ?? "Avituallamientos"}</Titulo>
        <ol className="mt-mojones k-ancho">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} data-k-escena="">
              <span className="mt-mojon acento tabular-nums" aria-hidden="true">
                km {i === x.paradas.length - 1 ? 42 : MOJONES[Math.min(i, MOJONES.length - 2)]}
              </span>
              <span className="mt-mojon-hora acento tabular-nums">{p.hora}</span>
              <span className="mt-mojon-t">{p.titulo}</span>
              <span className="mt-mojon-l">
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

function Equipacion({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="mt-seccion">
      <Titulo antes="Dress code">Equipación de gala</Titulo>
      {paleta.length > 0 && (
        <ul className="mt-cintas" aria-label="Colores sugeridos">
          {paleta.map((c, i) => (
            <li key={c + i} data-k-escena="" style={{ "--c": c, "--i": i } as React.CSSProperties}>
              <span className="sr-only">{c}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesMeta;

export default function MetaPlantilla(props: Props) {
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
            capitulos: caps && <Parciales {...caps} />,
            itinerario: itin && <Salida x={itin} inv={inv} />,
            cuentaAtras: b("cuentaAtras") && (
              <section className="mt-seccion mt-reloj-zona">
                <Titulo antes="El reloj de meta">Lo que nos queda</Titulo>
                <MetaReloj hasta={inv.pareja.fecha} />
              </section>
            ),
            dressCode: dress && <Equipacion {...dress} />,
            regalos: regalos && <Regalos {...regalos} titulo={regalos.titulo ?? "Nuestro avituallamiento de luna de miel"} />,
            rsvp: rsvp && (
              <MetaCinta slug={inv.slug} hasta={inv.pareja.fecha}>
                {rsvp.limite && <LimiteRsvp limite={rsvp.limite} motivo={rsvp.motivoLimite} />}
                <Rsvp slug={inv.slug} {...rsvp} />
              </MetaCinta>
            ),
          },
          tonos: { alojamiento: "velo", notas: "velo", album: "velo" },
        }}
      />
      <Despedida inv={inv} ornamento="filete" flor={<MetaMedalla a={d.a} b={d.b} fecha={d.numerica.replace(/(\d\d)$/, String(d.anio))} />} />
      <GuionEscenas />
    </Lienzo>
  );
}
