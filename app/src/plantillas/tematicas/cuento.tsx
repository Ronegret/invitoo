import CuentaPortada from "@/components/bloques/CuentaPortada";
import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { Regalos } from "@/components/bloques/Simples";
import Icono from "@/components/Iconos";
import { horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { HERO_TEMATICO } from "./catalogo";
import { GuionEscenas } from "./escenas";
import { fuentesCuento } from "./fuentes/cuento";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import PolvoHadas from "./PolvoHadas";
import RelojArena from "./RelojArena";
import "./tematicas.css";
import "./cuento.css";

/**
 * CUENTO DE HADAS — púrpura profundo y oro, libro antiguo y polvo de hadas.
 *
 * Tipografía: Cinzel Decorative para los titulares de libro, IM Fell
 * English en cursiva para los nombres y las capitulares, Lora a 19 px para
 * leer en la oscuridad. Paleta: púrpura #1d1030, pergamino #f4ecdc y oro
 * #d8b45e (variantes medianoche y ciruela).
 *
 * El guion:
 *  1. Apertura: el vídeo de noche (bengalas) con los nombres.
 *  2. Cabecera: vuestro vídeo teñido de púrpura y oro, dentro de un marco
 *     dorado que se dibuja; «Érase una vez» y los nombres. El polvo de hadas
 *     sigue al dedo en toda la invitación.
 *  3. Un libro antiguo se abre página a página al bajar: vuestra historia.
 *  4. El reloj de arena se da la vuelta cada minuto.
 *  5. El día es un camino de estrellas que se dibuja al bajar.
 *  6. Cómo vestir: gemas de cada color con un destello.
 *  7. Un deseo: los datos de los regalos en un marco que brilla.
 */

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO_TEMATICO.cuento;
}

function sitio(direccion?: string) {
  const t = (direccion ?? "").split(",").map((s) => s.trim().replace(/^\d{5}\s*/, "")).filter(Boolean);
  return t.at(-2) ?? t.at(-1) ?? "";
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function Estrella({ className = "" }: { className?: string }) {
  return (
    <svg className={`cu-estrella ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5 13.9 10.1 22.5 12 13.9 13.9 12 22.5 10.1 13.9 1.5 12 10.1 10.1Z" />
    </svg>
  );
}

/** Separador: un filete con una estrella en medio. */
function Vineta() {
  return (
    <span className="cu-vineta" aria-hidden="true">
      <span />
      <Estrella />
      <span />
    </span>
  );
}

/** Las esquinas de oro del marco de la cabecera. */
function Marco() {
  const esquina = "M4 70 V22 C4 12 12 4 22 4 H70 M14 60 V28 C14 20 20 14 28 14 H60 M22 22 C30 30 26 40 18 38 C12 36 16 26 22 22 Z";
  return (
    <div className="cu-marco wow decor" aria-hidden="true">
      {["si", "sd", "ii", "id"].map((e) => (
        <svg key={e} className={`cu-esquina ${e}`} viewBox="0 0 74 74">
          <path d={esquina} pathLength={1} />
        </svg>
      ))}
      <span className="cu-marco-linea arriba" />
      <span className="cu-marco-linea abajo" />
    </div>
  );
}

/** Destellos quietos que titilan en la cabecera (CSS). */
function Destellos() {
  const pos = [
    [12, 18], [82, 12], [70, 30], [22, 42], [88, 48], [8, 66], [56, 20], [36, 12], [92, 74], [16, 84],
  ];
  return (
    <div className="cu-destellos wow decor" aria-hidden="true">
      {pos.map(([x, y], i) => (
        <span key={i} style={{ left: `${x}%`, top: `${y}%`, "--i": i } as React.CSSProperties}>
          <Estrella className="cu-titila" />
        </span>
      ))}
    </div>
  );
}

function Portada(props: Props) {
  const d = datosPortada(props);
  return (
    <header className="k-hero cu-hero">
      <HeroVideo fuente={fuenteHero(props)} clase="grad-cuento" etiqueta="Ver el vídeo">
        <span className="cu-tinte" aria-hidden="true" />
      </HeroVideo>
      <Destellos />
      <Marco />
      <div className="cu-rotulo k-hero-sale">
        <p className="cu-erase display">Érase una vez</p>
        <h1 className="cu-nombres vt-nombres" style={{ fontSize: d.tamNombres(3, 18, 0.46, 5.6) }}>
          <span className="block">{d.a}</span>
          <span className="cu-y">y</span>
          <span className="block">{d.b}</span>
        </h1>
        <Vineta />
        <p className="cu-fecha">{mayuscula(d.fechaLarga)}</p>
        <p className="cu-lugar">{d.lugar}</p>
        <CuentaPortada hasta={d.fechaIso} estilo="punto" className="k-cuenta cuento-cuenta" />
        <a href="#k-inicio" className="k-baja cu-baja">
          Abrid el libro
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────── el libro

type Caps = Extract<Bloque, { t: "capitulos" }>;

/**
 * El libro: con `animation-timeline` y sin «menos movimiento», una pista
 * alta con el tomo fijado (sticky) y cada hoja girando sobre el lomo según
 * avanza el scroll; el usuario manda: si sube, las hojas vuelven. Sin eso,
 * las mismas páginas apiladas, una tras otra, que se leen igual.
 */
function Libro({ x, a, b, frase }: { x: Caps; a: string; b: string; frase: string }) {
  const hojas = x.capitulos;
  const n = hojas.length + 1; // la tapa + un capítulo por hoja
  return (
    <section id="k-inicio" className="cu-libro" aria-label={x.titulo ?? "Érase una vez"} style={{ "--n": n } as React.CSSProperties}>
      <div className="cu-titulo">
        <p className="cu-antes">Nuestra historia</p>
        <h2 className="display sin-orn">{x.titulo ?? "Érase una vez"}</h2>
        <Vineta />
      </div>
      <div className="cu-pista">
        <div className="cu-escena">
          <div className="cu-tomo">
            <article className="cu-hoja cu-tapa" style={{ "--i": 0 } as React.CSSProperties}>
              <div className="cu-cara">
                <span className="cu-tapa-marco" aria-hidden="true" />
                <Estrella className="cu-tapa-estrella" />
                <p className="cu-tapa-titulo">
                  {a} <span className="cu-y">y</span> {b}
                </p>
                <p className="cu-tapa-sub">{frase || "Un cuento en cuatro capítulos"}</p>
              </div>
              <div className="cu-dorso" aria-hidden="true" />
            </article>
            {hojas
              .map((c, i) => (
                <article key={c.titulo} className="cu-hoja" style={{ "--i": i + 1 } as React.CSSProperties}>
                  <div className="cu-cara">
                    {c.cuando && <p className="cu-cuando">{c.cuando}</p>}
                    <h3 className="cu-cap">{c.titulo}</h3>
                    {c.foto && (
                      /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
                      <img className="cu-vineta-foto" src={c.foto} alt="" width={240} height={240} loading="lazy" decoding="async" />
                    )}
                    <p className="cu-texto">{c.texto}</p>
                    <p className="cu-folio" aria-hidden="true">{i + 1}</p>
                  </div>
                  <div className="cu-dorso" aria-hidden="true" />
                </article>
              ))}
            <div className="cu-contra">
              <p className="cu-fin-antes">Y fueron felices…</p>
              <p className="cu-fin-nombres">
                {a} <span className="cu-y">y</span> {b}
              </p>
              <Estrella className="cu-fin-estrella" />
              <p className="cu-fin-pie">…y el resto lo escribimos con vosotros.</p>
            </div>
          </div>
          <p className="cu-ayuda" aria-hidden="true">Bajad para pasar página</p>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────── piezas de sección

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="cu-titulo">
      {antes && <p className="cu-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Vineta />
    </div>
  );
}

function Arena({ fecha }: { fecha: string }) {
  return (
    <section className="cu-seccion">
      <Titulo antes="El hechizo se cumple en">Faltan</Titulo>
      <div data-k-escena="">
        <RelojArena hasta={fecha} />
      </div>
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;

function Camino({ x, inv }: { x: Itin; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="cu-seccion">
        <Titulo antes="Cuándo y dónde">{x.titulo ?? "El día del cuento"}</Titulo>
        <ol className="cu-camino k-ancho">
          <svg className="cu-sendero" viewBox="0 0 40 400" preserveAspectRatio="none" aria-hidden="true">
            <path d="M20 0 C34 60 6 120 20 200 S34 340 20 400" pathLength={1} />
          </svg>
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
              <span className="cu-medalla" aria-hidden="true">
                <Icono id={p.icono ?? "copas"} size={22} />
              </span>
              <span className="cu-hora tabular-nums">{p.hora}</span>
              <span className="cu-que">{p.titulo}</span>
              <span className="cu-donde">
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

function Gemas({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="cu-seccion">
      <Titulo antes="Dress code">Cómo vestir</Titulo>
      <ul className="cu-gemas" aria-label="Colores sugeridos">
        {paleta.map((c, i) => (
          <li key={c + i} style={{ "--c": c, "--i": i } as React.CSSProperties}>
            <svg viewBox="0 0 60 60" aria-hidden="true">
              <path className="g-base" d="M14 6 H46 L58 22 L30 56 L2 22 Z" />
              <path className="g-luz" d="M14 6 L22 22 H38 L46 6 Z M2 22 H58 L30 56 Z" />
              <path className="g-filo" d="M14 6 H46 L58 22 L30 56 L2 22 Z M2 22 H58 M22 22 L30 56 L38 22 M14 6 L22 22 M46 6 L38 22" />
            </svg>
            <span className="sr-only">{c}</span>
          </li>
        ))}
      </ul>
      <p className="cu-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

function Deseo(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="cu-deseo k-ancho" data-k-escena="">
      <Estrella className="cu-deseo-estrella" />
      <Regalos {...x} />
    </div>
  );
}

export const fuentes = fuentesCuento;

export default function Cuento(props: Props) {
  const { b, inv } = props;
  const caps = b("capitulos");
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  const frase = b("portada")?.frase ?? "";
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <PolvoHadas />
      <Portada {...props} />
      {!caps && <div id="k-inicio" />}
      <Secciones
        {...props}
        opciones={{
          respiro: "Y colorín, colorado… esto no ha hecho más que empezar.",
          piezas: {
            capitulos: caps && <Libro x={caps} a={inv.pareja.a} b={inv.pareja.b} frase={frase} />,
            cuentaAtras: b("cuentaAtras") && <Arena fecha={inv.pareja.fecha} />,
            itinerario: itin && <Camino x={itin} inv={inv} />,
            dressCode: dress && <Gemas {...dress} />,
            regalos: regalos && <Deseo {...regalos} />,
          },
          tonos: { cuentaAtras: "velo", rsvp: "velo", album: "velo" },
        }}
      />
      <Despedida inv={inv} ornamento="estrella" />
      <GuionEscenas />
    </Lienzo>
  );
}
