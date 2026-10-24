import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import { formatearFecha, horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, Y, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { Enfoca } from "../vida";
import { GuionEscenas } from "./escenas";
import { fuentesRiviera } from "./fuentes/riviera";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import { RivieraRelojes, RivieraReserva, RivieraSeda } from "./RivieraPiezas";
import "./tematicas.css";
import "./riviera.css";

/**
 * RIVIERA (Coches clásicos y lujo) — K5. docs/16b §9.
 *
 * El objeto noble: la guantera de piel cosida a mano y el cuadro de
 * relojes cromado. Lujo silencioso: ni un logo. Piel marfil, tinta, azul
 * Riviera (o verde inglés, o burdeos), caramelo en los pespuntes, cromo y
 * champán (solo adorno). Bodoni Moda + Hanken Grotesk + Tenor Sans.
 *
 * El guion:
 *  1. Cabecera: vuestro vídeo con un velo champán; dos hojas de papel de
 *     seda se apartan (solas, o con el dedo) y descubren la tapa de la caja
 *     con vuestros nombres, cosida a mano.
 *  2. «Nuestra ruta»: una carretera de costa se dibuja con el scroll.
 *  3. La invitación del atelier, con una cinta de grosgrain que se desata.
 *  4. «Itinerario de gala» con un filete cromado.
 *  5. «Lookbook»: un carril de muestras de tela (y el dress code en texto).
 *  6. El cuadro de relojes y la llave (el momento wow).
 *  7. «La caja»: al abrir «Ver datos», se levanta la tapa.
 *  8. RSVP: «Reservado a su nombre», estampado en seco.
 */

const fuente: FuenteVideo = {
  vertical: "/aperturas/bruma/vertical.mp4",
  horizontal: "/aperturas/bruma/horizontal.mp4",
  poster: "/tematicas/riviera/poster-v.avif",
  posterHorizontal: "/tematicas/riviera/poster-h.avif",
  webm: "/tematicas/riviera/hero-v.webm",
  webmHorizontal: "/tematicas/riviera/hero-h.webm",
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

/** El ornamento: un filete cosido a mano con dos puntadas cruzadas. */
function Pespunte({ className = "" }: { className?: string }) {
  return (
    <svg className={`rv-pespunte ${className}`} viewBox="0 0 160 16" aria-hidden="true">
      <path d="M0 8 H66 M94 8 H160" className="hilo" />
      <path d="M72 3 L82 13 M82 3 L72 13 M78 3 L88 13 M88 3 L78 13" className="cruz" />
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="rv-titulo" data-k-escena="">
      {antes && <p className="rv-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Pespunte />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <>
      <header className="k-hero rv-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-riviera" etiqueta="Ver el vídeo">
          <span className="rv-velo" aria-hidden="true" />
        </HeroVideo>
        <div className="rv-tapa k-hero-sale">
          <p className="rv-rotulo">Riviera · Atelier</p>
          <h1 className="rv-nombres display" style={{ fontSize: d.tamNombres(2.6, 15, 0.5, 5.2) }}>
            <span className="block">{d.a}</span>
            <Y bloque className="rv-y" />
            <span className="block">{d.b}</span>
          </h1>
          <p className="rv-fecha">
            <span className="first-letter:uppercase inline-block">{d.fechaLarga}</span>
            {d.lugar && <span className="block">{d.lugar}</span>}
          </p>
          <RivieraSeda />
        </div>
        <a href="#k-inicio" className="k-baja rv-baja">
          Abrid la invitación
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </header>
      <div id="k-inicio" />
      {d.frase && (
        <section className="rv-frase k-ancho" aria-label="Unas palabras de los novios">
          <blockquote className="display">
            <Enfoca texto={d.frase} />
          </blockquote>
        </section>
      )}
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

function Ruta({ titulo, capitulos }: Extract<Bloque, { t: "capitulos" }>) {
  return (
    <section className="rv-seccion">
      <Titulo antes="Nuestra historia">{titulo ?? "Nuestra ruta"}</Titulo>
      <div className="rv-ruta k-ancho">
        <svg className="rv-carretera" viewBox="0 0 60 400" preserveAspectRatio="none" aria-hidden="true">
          <path pathLength={1} d="M30 0 C 6 50, 54 90, 30 140 S 6 230, 30 270 S 54 360, 30 400" className="asfalto" />
          <path pathLength={1} d="M30 0 C 6 50, 54 90, 30 140 S 6 230, 30 270 S 54 360, 30 400" className="linea" />
        </svg>
        <ol>
          {capitulos.map((c) => (
            <li key={c.titulo} data-k-escena="">
              {c.cuando && <p className="rv-senal">{c.cuando}</p>}
              <h3 className="display">{c.titulo}</h3>
              <p>{c.texto}</p>
              {c.foto && (
                // eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado
                <img className="rv-ruta-foto" src={c.foto} alt="" width={600} height={750} loading="lazy" decoding="async" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;

function Atelier({ x, inv }: { x: Itin; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="rv-seccion">
        <Titulo antes="Cuándo y dónde">La invitación</Titulo>
        {primera && (
          <div className="rv-tarjeta k-ancho" data-k-escena="">
            <span className="rv-cinta-v" aria-hidden="true" />
            <span className="rv-lazo izq" aria-hidden="true" />
            <span className="rv-lazo der" aria-hidden="true" />
            <p className="rv-tarjeta-a">Tienen el placer de invitaros</p>
            <p className="rv-tarjeta-dia display first-letter:uppercase">{formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" })}</p>
            <p className="rv-tarjeta-hora tabular-nums">a las {primera.hora}</p>
            <p className="rv-tarjeta-lugar">{primera.lugar}</p>
            {sitio(primera.direccion) && <p className="rv-tarjeta-sitio">{sitio(primera.direccion)}</p>}
          </div>
        )}
      </section>
      <section className="rv-seccion rv-gala">
        <Titulo antes="El día">{x.titulo ?? "Itinerario de gala"}</Titulo>
        <ol className="rv-horas k-ancho">
          {x.paradas.map((p) => (
            <li key={p.titulo + p.hora} data-k-escena="">
              <span className="rv-hora display tabular-nums">{p.hora}</span>
              <span className="rv-cromo" aria-hidden="true" />
              <span className="rv-que">{p.titulo}</span>
              <span className="rv-donde">
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

function Lookbook({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="rv-seccion">
      <Titulo antes="Dress code">Lookbook</Titulo>
      <p className="rv-nota k-ancho">{nota}</p>
      {paleta.length > 0 && (
        <>
          <ul className="rv-carril" aria-label="Muestras de tela sugeridas">
            {paleta.map((c, i) => (
              <li key={c + i} className="rv-funda" style={{ "--c": c } as React.CSSProperties}>
                <span className="rv-percha" aria-hidden="true" />
                <span className="rv-muestra" aria-hidden="true" />
                <span className="rv-funda-n">Muestra n.º {i + 1}</span>
                <span className="sr-only">Color {c}</span>
              </li>
            ))}
          </ul>
          <p className="rv-pista" aria-hidden="true">Deslizad para ver las muestras →</p>
        </>
      )}
    </section>
  );
}

function Caja(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="rv-caja k-ancho">
      <span className="rv-caja-tapa" aria-hidden="true">
        <span className="rv-caja-cinta" />
      </span>
      <div className="rv-caja-fondo">
        <Regalos {...x} titulo={x.titulo ?? "La caja"} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesRiviera;

export default function RivieraPlantilla(props: Props) {
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
            capitulos: caps && <Ruta {...caps} />,
            itinerario: itin && <Atelier x={itin} inv={inv} />,
            dressCode: dress && <Lookbook {...dress} />,
            cuentaAtras: b("cuentaAtras") && (
              <section className="rv-seccion rv-cuadro-zona">
                <Titulo antes="Girad la llave">El cuadro de relojes</Titulo>
                <RivieraRelojes hasta={inv.pareja.fecha} />
              </section>
            ),
            regalos: regalos && <Caja {...regalos} />,
            rsvp: rsvp && (
              <RivieraReserva slug={inv.slug}>
                {rsvp.limite && <LimiteRsvp limite={rsvp.limite} motivo={rsvp.motivoLimite} />}
                <Rsvp slug={inv.slug} {...rsvp} />
              </RivieraReserva>
            ),
          },
          tonos: { alojamiento: "velo", notas: "velo" },
        }}
      />
      <Despedida inv={inv} ornamento="filete" flor={<Pespunte className="rv-pespunte-cierre" />} />
      <GuionEscenas />
    </Lienzo>
  );
}
