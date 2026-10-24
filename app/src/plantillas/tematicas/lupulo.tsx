import CuentaPortada from "@/components/bloques/CuentaPortada";
import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import { formatearFecha, horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, Y, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { Enfoca } from "../vida";
import { GuionEscenas } from "./escenas";
import { fuentesLupulo } from "./fuentes/lupulo";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import { LupuloJarras, LupuloPizarra } from "./LupuloPiezas";
import "./tematicas.css";
import "./lupulo.css";

/**
 * LÚPULO Y COBRE (Cerveza artesanal) — K5. docs/16b §6.
 *
 * El objeto noble: la etiqueta letterpress de una cerveza de abadía, con
 * vuestro nombre. Kraft claro, tinta tostada, ámbar, verde lúpulo y cobre
 * (solo en filetes). Young Serif + Libre Franklin + IM Fell English SC.
 *
 * El guion:
 *  1. Cabecera: vuestro vídeo con un tinte ámbar; la etiqueta se imprime
 *     (se aprieta y la tinta se hunde) y suben burbujas finas.
 *  2. «Notas de cata»: aroma, cuerpo y final; cada nota graba su piña de lúpulo.
 *  3. «Dónde se sirve»: tarjeta con marco de cobre y un brillo que cruza el metal.
 *  4. «Carta de grifos»: cada hora sirve su línea de ámbar.
 *  5. La pizarra del bar: la cuenta atrás con tiza y la caña que se llena.
 *  6. «Maridaje»: el dress code como posavasos, de la rubia a la tostada.
 *  7. RSVP: ¡salud! Chocan las jarras (el momento wow).
 */

const fuente: FuenteVideo = {
  vertical: "/tematicas/lupulo/hero-v.mp4",
  horizontal: "/tematicas/lupulo/hero-h.mp4",
  poster: "/tematicas/lupulo/poster-v.avif",
  posterHorizontal: "/tematicas/lupulo/poster-h.avif",
  webm: "/tematicas/lupulo/hero-v.webm",
  webmHorizontal: "/tematicas/lupulo/hero-h.webm",
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

/** La piña de lúpulo grabada al buril: brácteas en escama y dos hojas. */
export function Lupulo({ className = "" }: { className?: string }) {
  return (
    <svg className={`lp-pina ${className}`} viewBox="0 0 64 80" aria-hidden="true">
      <path pathLength={1} d="M32 4 V14" />
      <path pathLength={1} d="M32 12 C22 6 10 10 6 18 C14 20 24 18 32 12 C40 18 50 20 58 18 C54 10 42 6 32 12" />
      <path pathLength={1} d="M32 16 C18 18 14 34 18 48 C22 62 28 72 32 76 C36 72 42 62 46 48 C50 34 46 18 32 16 Z" />
      <path pathLength={1} d="M20 30 Q32 38 44 30 M18 42 Q32 50 46 42 M21 54 Q32 62 43 54 M26 65 Q32 70 38 65" />
      <path pathLength={1} d="M32 18 Q26 26 32 34 Q38 42 32 50 Q26 58 32 66" />
    </svg>
  );
}

/** El ornamento: la piña entre dos filetes de cobre. */
function Ornamento() {
  return (
    <span className="lp-orn" aria-hidden="true">
      <span />
      <Lupulo />
      <span />
    </span>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="lp-titulo" data-k-escena="">
      {antes && <p className="lp-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Ornamento />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Burbujas() {
  return (
    <div className="lp-burbujas" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <i
          key={i}
          style={{ "--x": `${(i * 37) % 100}%`, "--t": `${3 + (i % 4)}px`, "--d": `${(i * 0.71) % 6}s`, "--v": `${7 + (i % 5)}s` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function Portada(props: Props) {
  const d = datosPortada(props);
  const fecha = d.numerica.replace(/\./g, "·").replace(/·(\d\d)$/, `·${d.anio}`);
  return (
    <>
      <header className="k-hero lp-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-lupulo" etiqueta="Ver el vídeo">
          <span className="lp-tinte" aria-hidden="true" />
        </HeroVideo>
        <Burbujas />
        <div className="lp-etiqueta k-hero-sale">
          <span className="lp-medalla" aria-hidden="true">
            <Lupulo />
          </span>
          <p className="lp-lote acento">Cosecha {d.anio} · Lote único</p>
          <h1 className="lp-nombres display" style={{ fontSize: d.tamNombres(2.6, 13, 0.56, 4.6) }}>
            <span className="block">{d.a}</span>
            <Y bloque className="lp-y" />
            <span className="block">{d.b}</span>
          </h1>
          <p className="lp-cosecha tabular-nums" aria-hidden="true">{fecha}</p>
          <p className="lp-fecha">
            <span className="first-letter:uppercase inline-block">{d.fechaLarga}</span>
            {d.lugar && <span className="block tabular-nums">a las {d.hora} · {d.lugar}</span>}
          </p>
          <CuentaPortada hasta={d.fechaIso} estilo="rombo" className="k-cuenta lupulo-cuenta" />
        </div>
        <a href="#k-inicio" className="k-baja lp-baja">
          Descubrid la invitación
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </header>
      <div id="k-inicio" />
      {d.frase && (
        <section className="lp-dedicatoria k-ancho" aria-label="Unas palabras de los novios">
          <Ornamento />
          <blockquote className="display">
            <Enfoca texto={d.frase} />
          </blockquote>
          <p className="lp-firma acento">{d.a} y {d.b}</p>
        </section>
      )}
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

const NOTAS = ["Aroma", "Cuerpo", "Final", "Retrogusto", "Y ahora"];

function NotasDeCata({ titulo, capitulos }: Extract<Bloque, { t: "capitulos" }>) {
  return (
    <section className="lp-seccion">
      <Titulo antes="Nuestra historia">{titulo ?? "Notas de cata"}</Titulo>
      <ol className="lp-notas k-ancho">
        {capitulos.map((c, i) => (
          <li key={c.titulo} className="lp-nota" data-k-escena="">
            <Lupulo className="lp-nota-pina" />
            <p className="lp-nota-tipo acento">{NOTAS[Math.min(i, NOTAS.length - 1)]}</p>
            {c.cuando && <p className="lp-nota-cuando">{c.cuando}</p>}
            <h3 className="display">{c.titulo}</h3>
            <p className="lp-nota-texto">{c.texto}</p>
            {c.foto && (
              // eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado
              <img className="lp-nota-foto" src={c.foto} alt="" width={600} height={750} loading="lazy" decoding="async" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;

function CartaDeGrifos({ x, inv }: { x: Itin; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="lp-seccion">
        <Titulo antes="Cuándo y dónde">Dónde se sirve</Titulo>
        {primera && (
          <div className="lp-cobre k-ancho" data-k-escena="">
            <p className="lp-cobre-dia first-letter:uppercase">{formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <p className="lp-cobre-hora display tabular-nums">{primera.hora}</p>
            <p className="lp-cobre-lugar">{primera.lugar}</p>
            {sitio(primera.direccion) && <p className="lp-cobre-sitio">{sitio(primera.direccion)}</p>}
          </div>
        )}
      </section>
      <section className="lp-seccion lp-seccion-grifos">
        <Titulo antes="El día">{x.titulo ?? "Carta de grifos"}</Titulo>
        <ol className="lp-grifos k-ancho">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
              <span className="lp-grifo" aria-hidden="true">
                <span className="lp-grifo-tirador" />
                <span className="lp-grifo-chorro" />
              </span>
              <span className="lp-grifo-hora display tabular-nums">{p.hora}</span>
              <span className="lp-grifo-que">
                <span className="lp-grifo-t">{p.titulo}</span>
                <span className="lp-grifo-l">
                  {p.lugar}
                  {sitio(p.direccion) && <> · {sitio(p.direccion)}</>}
                </span>
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

function Pizarra({ fecha }: { fecha: string }) {
  return (
    <section className="lp-pizarra">
      <div className="lp-titulo lp-titulo-tiza" data-k-escena="">
        <p className="lp-antes">En la pizarra del bar</p>
        <h2 className="display sin-orn">Lo que falta</h2>
      </div>
      <LupuloPizarra hasta={fecha} />
    </section>
  );
}

const MALTAS = ["Rubia", "Dorada", "Ámbar", "Roja", "Tostada", "Negra"];

function Maridaje({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="lp-seccion">
      <Titulo antes="Dress code">Maridaje</Titulo>
      {paleta.length > 0 && (
        <ul className="lp-posavasos" aria-label="Colores sugeridos">
          {paleta.map((c, i) => (
            <li key={c + i} data-k-escena="" style={{ "--c": c, "--i": i } as React.CSSProperties}>
              <span className="lp-posavaso" aria-hidden="true" />
              <span className="lp-posavaso-n acento">{MALTAS[Math.round((i / Math.max(1, paleta.length - 1)) * (MALTAS.length - 1))]}</span>
              <span className="sr-only">{c}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="lp-nota-dress k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function Barril(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="lp-barril">
      <svg className="lp-barril-icono" viewBox="0 0 64 72" aria-hidden="true" data-k-escena="">
        <path d="M14 6 Q8 36 14 66 H50 Q56 36 50 6 Z" />
        <path d="M10 20 H54 M9 52 H55" />
        <path d="M24 6 Q21 36 24 66 M40 6 Q43 36 40 66" />
      </svg>
      <Regalos {...x} titulo={x.titulo ?? "El barril de los deseos"} />
    </div>
  );
}

function Brindis({ slug, x }: { slug: string; x: Extract<Bloque, { t: "rsvp" }> }) {
  return (
    <LupuloJarras slug={slug}>
      {x.limite && <LimiteRsvp limite={x.limite} motivo={x.motivoLimite} />}
      <Rsvp slug={slug} {...x} />
    </LupuloJarras>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesLupulo;

export default function LupuloPlantilla(props: Props) {
  const { b, inv } = props;
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
            capitulos: caps && <NotasDeCata {...caps} />,
            itinerario: itin && <CartaDeGrifos x={itin} inv={inv} />,
            cuentaAtras: b("cuentaAtras") && <Pizarra fecha={inv.pareja.fecha} />,
            dressCode: dress && <Maridaje {...dress} />,
            regalos: regalos && <Barril {...regalos} />,
            rsvp: rsvp && <Brindis slug={inv.slug} x={rsvp} />,
          },
          tonos: { alojamiento: "velo", notas: "velo", album: "velo" },
        }}
      />
      <Despedida
        inv={inv}
        ornamento="punto"
        flor={
          <p className="lp-cierre display">¡Salud!</p>
        }
      />
      <GuionEscenas />
    </Lienzo>
  );
}
