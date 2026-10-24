import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { Regalos } from "@/components/bloques/Simples";
import Icono from "@/components/Iconos";
import { formatearFecha, horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, Y, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { Enfoca } from "../vida";
import { HERO_TEMATICO } from "./catalogo";
import { GuionEscenas } from "./escenas";
import { fuentesRegencia } from "./fuentes/regencia";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import RelojBolsillo from "./RelojBolsillo";
import "./tematicas.css";
import "./regencia.css";

/**
 * ALTA SOCIEDAD (Regencia) — boda de palacio o de jardín inglés.
 *
 * Paleta: marfil #f8f4ec, azul empolvado, rosa té y glicinia, con oro
 * (#c7a35a) solo en filetes, lacre y reloj. Tipografía: Pinyon Script SOLO
 * para los nombres; Cormorant en cursiva para los titulares; EB Garamond a
 * 19 px para leer.
 *
 * El guion:
 *  1. Apertura: el sobre de papel de E1 con lacre de oro (se rompe al tocar).
 *  2. Cabecera: vuestro vídeo con una gradación pastel; desde arriba caen
 *     glicinias como una cortina y dos mariposas cruzan. Abajo, una cartela
 *     de papel con ribete y los nombres a pluma. Al bajar, la cortina sube.
 *  3. El reloj de bolsillo se mece colgado de su cadena hasta quedarse quieto.
 *  4. El orden del día es un carné de baile que se despliega.
 *  5. La etiqueta (dress code) es un abanico que se abre con el scroll.
 *  6. Los regalos llegan con un lacre que se estampa.
 */

function sitio(direccion?: string) {
  const t = (direccion ?? "").split(",").map((s) => s.trim().replace(/^\d{5}\s*/, "")).filter(Boolean);
  return t.length < 2 ? (t[0] ?? "") : t.at(-2)!;
}

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO_TEMATICO.regencia;
}

// ─────────────────────────────────────────────── las glicinias y mariposas

/** Pseudoaleatorio con semilla: el mismo HTML en servidor y cliente. */
function semilla(n: number) {
  let s = n;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const COLORES_GLICINIA = ["#8a73c2", "#a28fd3", "#b9abe0", "#d0c5ec", "#e5ddf5", "#f5f1fb"];
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Un racimo de glicinia: florecillas de dos pétalos, más pálidas hacia la punta. */
function racimo(seed: number, largo: number) {
  const r = semilla(seed);
  const n = Math.round(largo / 2.4);
  const flores = [];
  for (let k = n; k >= 0; k--) {
    const t = k / n;
    const abre = 15 * (1 - t * 0.82) * (0.75 + r() * 0.4);
    const x = (r() - 0.5) * 2 * abre;
    const y = 8 + t * largo + (r() - 0.5) * 4;
    const tam = 3.9 * (1 - t * 0.5) + r() * 1.1;
    const c = Math.min(5, Math.floor(t * 5 + r() * 1.6));
    const giro = Math.round((r() - 0.5) * 70);
    flores.push({ x: r1(x), y: r1(y), tam: r1(tam), c, giro });
  }
  return flores;
}

const RACIMOS = [racimo(11, 150), racimo(23, 112), racimo(37, 182)];

/**
 * La cortina de glicinias. Cada racimo es un `<span>` HTML con su SVG (que
 * reutiliza uno de tres racimos dibujados una vez): así caer y mecerse son
 * `transform` en el compositor, sin repintar cientos de flores por fotograma.
 */
function Glicinias() {
  const r = semilla(7);
  const delante = Array.from({ length: 12 }, (_, i) => ({
    x: r1(((10 + i * 34 + (r() - 0.5) * 16) / 400) * 100),
    s: r1(0.72 + r() * 0.5),
    v: i % 3,
    i,
  }));
  const detras = Array.from({ length: 9 }, (_, i) => ({
    x: r1(((-4 + i * 47 + r() * 20) / 400) * 100),
    s: r1(0.55 + r() * 0.3),
    v: (i + 1) % 3,
    i,
  }));
  const racimo = (g: { x: number; s: number; v: number; i: number }, fondo = false) => (
    <span
      key={`${fondo ? "f" : "d"}${g.i}`}
      className={`rg-racimo${fondo ? " fondo" : ""}`}
      style={{ left: `${g.x}%`, "--s": g.s, "--i": fondo ? g.i + 3 : g.i } as React.CSSProperties}
    >
      <svg viewBox="-24 -2 48 200" aria-hidden="true">
        <use href={`#rg-rac-${g.v}`} />
      </svg>
    </span>
  );
  return (
    <div className="rg-glicinias wow decor" aria-hidden="true">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          {RACIMOS.map((flores, v) => (
            <symbol key={v} id={`rg-rac-${v}`} overflow="visible">
              <path d="M0 0 C2 40 -2 90 0 160" stroke="#6b7d5a" strokeWidth=".8" fill="none" opacity=".5" />
              {flores.map((f, k) => (
                <g key={k} transform={`translate(${f.x} ${f.y}) rotate(${f.giro})`}>
                  <ellipse rx={f.tam} ry={r1(f.tam * 0.62)} fill={COLORES_GLICINIA[f.c]} fillOpacity=".9" />
                  <ellipse cx={r1(-f.tam * 0.22)} cy={r1(-f.tam * 0.16)} rx={r1(f.tam * 0.48)} ry={r1(f.tam * 0.26)} fill="#fff" fillOpacity=".38" />
                </g>
              ))}
            </symbol>
          ))}
          <symbol id="rg-hoja" overflow="visible">
            <path d="M0 0 C6 10 18 22 34 26" stroke="#5f7550" strokeWidth=".9" fill="none" />
            {[0, 1, 2, 3, 4].map((k) => (
              <g key={k}>
                <ellipse cx={6 + k * 6.5} cy={8 + k * 4.4} rx="7.5" ry="2" fill="#93ab80" fillOpacity=".92" transform={`rotate(${-34 + k * 6} ${6 + k * 6.5} ${8 + k * 4.4}) translate(-4 -4)`} />
                <ellipse cx={6 + k * 6.5} cy={8 + k * 4.4} rx="6.8" ry="1.8" fill="#aec29c" fillOpacity=".92" transform={`rotate(${38 + k * 6} ${6 + k * 6.5} ${8 + k * 4.4}) translate(4 3)`} />
              </g>
            ))}
          </symbol>
        </defs>
      </svg>
      {detras.map((g) => racimo(g, true))}
      <svg className="rg-rama" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-10 6 C60 -2 110 16 170 6 S290 -2 410 8" fill="none" stroke="#7a6a58" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
      {delante.map((g) => racimo(g))}
      <svg className="rg-rama hojas" viewBox="0 0 400 40" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <use key={k} href="#rg-hoja" transform={`translate(${k * 54 - 12} ${4 + (k % 2) * 3}) ${k % 2 ? "scale(-1 1)" : ""} rotate(${k % 2 ? -8 : 6})`} />
        ))}
      </svg>
    </div>
  );
}

function Mariposa({ clase }: { clase: string }) {
  return (
    <svg className={`rg-mariposa wow decor ${clase}`} viewBox="0 0 40 32" aria-hidden="true">
      <g className="ala izq">
        <path d="M20 16 C12 2 1 4 3 12 C4 18 12 18 20 16 Z" fill="#c9d6ea" stroke="#5f7aa0" strokeWidth=".6" />
        <path d="M20 17 C12 20 6 28 11 29 C15 30 19 24 20 17 Z" fill="#e9cbd0" stroke="#5f7aa0" strokeWidth=".6" />
      </g>
      <g className="ala der">
        <path d="M20 16 C28 2 39 4 37 12 C36 18 28 18 20 16 Z" fill="#c9d6ea" stroke="#5f7aa0" strokeWidth=".6" />
        <path d="M20 17 C28 20 34 28 29 29 C25 30 21 24 20 17 Z" fill="#e9cbd0" stroke="#5f7aa0" strokeWidth=".6" />
      </g>
      <path d="M20 9 V24" stroke="#3b3346" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Un florón caligráfico que se dibuja al llegar. */
function Floron({ className = "" }: { className?: string }) {
  return (
    <svg className={`rg-floron ${className}`} viewBox="0 0 220 24" aria-hidden="true">
      <path
        pathLength={1}
        d="M4 12 C40 12 54 3 76 8 C92 12 86 20 78 17 C70 14 80 4 96 8 C104 10 106 12 110 12 C114 12 116 10 124 8 C140 4 150 14 142 17 C134 20 128 12 144 8 C166 3 180 12 216 12"
      />
      <circle cx="110" cy="12" r="2.6" />
    </svg>
  );
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="rg-titulo" data-k-escena="">
      {antes && <p className="rg-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <Floron />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Portada(props: Props) {
  const d = datosPortada(props);
  const primera = props.b("itinerario")?.paradas[0];
  return (
    <>
      <header className="k-hero rg-hero">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-regencia" etiqueta="Ver nuestro vídeo">
          <span className="rg-tinte" aria-hidden="true" />
        </HeroVideo>
        <Glicinias />
        <Mariposa clase="m1" />
        <Mariposa clase="m2" />

        <div className="rg-cartela k-hero-sale">
          <span className="rg-esquina a" aria-hidden="true" />
          <span className="rg-esquina b" aria-hidden="true" />
          <p className="rg-lema">Tenemos el honor de invitaros a nuestro enlace</p>
          <h1 className="rg-nombres vt-nombres" style={{ fontSize: d.tamNombres(2.8, 15.5, 0.5, 4.8) }}>
            <span className="block">{d.a}</span>
            <Y bloque signo="&" className="rg-y" />
            <span className="block">{d.b}</span>
          </h1>
          <p className="rg-fecha">
            <span className="first-letter:uppercase inline-block">{d.fechaLarga}</span>
            {primera && <span className="block tabular-nums">a las {primera.hora} · {d.lugar}</span>}
          </p>
          <a href="#k-inicio" className="k-baja rg-baja">
            Descubrid la invitación
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </a>
        </div>
      </header>
      <div id="k-inicio" />

      {d.frase && (
        <section className="rg-dedicatoria k-ancho" aria-label="Unas palabras de los novios">
          <Floron />
          <blockquote className="display">
            <Enfoca texto={d.frase} />
          </blockquote>
          <p className="rg-firma">{d.a} &amp; {d.b}</p>
        </section>
      )}
    </>
  );
}

// ───────────────────────────────────────────────────── piezas de sección

function Reloj({ fecha }: { fecha: string }) {
  return (
    <section className="rg-seccion rg-reloj">
      <Titulo antes="Hasta el primer vals">Faltan</Titulo>
      <div className="rg-reloj-escena" data-k-escena="">
        <RelojBolsillo hasta={fecha} />
      </div>
    </section>
  );
}

type Itin = Extract<Bloque, { t: "itinerario" }>;

function OrdenDelDia({ x, inv }: { x: Itin; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="rg-seccion">
        <Titulo antes={formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" })}>
          {x.titulo ?? "El orden del día"}
        </Titulo>
        <div className="rg-carne" data-k-escena="">
          <p className="rg-carne-cab">Carné de baile</p>
          <ol>
            {x.paradas.map((p, i) => (
              <li key={p.titulo + p.hora} style={{ "--i": i } as React.CSSProperties}>
                <span className="rg-hora display tabular-nums">{p.hora}</span>
                <span className="rg-que">
                  <span className="rg-que-t">{p.titulo}</span>
                  <span className="rg-que-l">
                    {p.lugar}
                    {sitio(p.direccion) && <span className="opacity-80"> · {sitio(p.direccion)}</span>}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <Icono id="anillos" size={22} className="rg-carne-pie" />
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

function Etiqueta({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  const n = Math.max(1, paleta.length);
  return (
    <section className="rg-seccion rg-etiqueta">
      <Titulo antes="Dress code">La etiqueta</Titulo>
      <div className="rg-abanico" data-k-escena="" aria-hidden="true">
        {paleta.map((c, i) => (
          <span
            key={c + i}
            className="rg-varilla"
            style={{ "--c": c, "--a": `${(i - (n - 1) / 2) * (110 / Math.max(1, n - 1 || 1))}deg`, "--i": i } as React.CSSProperties}
          />
        ))}
        <span className="rg-abanico-eje" />
      </div>
      <p className="rg-nota k-ancho" data-k-escena="">{nota}</p>
      {paleta.length > 0 && <p className="sr-only">Colores sugeridos: {paleta.join(", ")}.</p>}
    </section>
  );
}

function Obsequio(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="rg-obsequio">
      <div className="rg-lacre" data-k-escena="" aria-hidden="true">
        <svg viewBox="0 0 80 80">
          <defs>
            <radialGradient id="rg-cera" cx="38%" cy="32%" r="75%">
              <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--acento) 45%, #fff)" }} />
              <stop offset=".55" style={{ stopColor: "var(--acento)" }} />
              <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--acento) 70%, #000)" }} />
            </radialGradient>
          </defs>
          <path d="M40 4 C52 3 58 9 66 13 C74 19 77 28 76 40 C77 52 72 61 64 67 C56 74 49 77 40 76 C29 77 21 72 14 66 C7 58 3 51 4 40 C3 28 8 19 15 13 C22 7 29 5 40 4 Z" fill="url(#rg-cera)" />
          <circle cx="40" cy="40" r="25" fill="none" stroke="#000" strokeOpacity=".25" strokeWidth="1.2" />
          <circle cx="40" cy="40" r="22" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth=".8" />
          <path d="M40 27 l3.5 8.5 9 .7-6.9 5.8 2.2 8.8L40 46l-7.8 4.8 2.2-8.8-6.9-5.8 9-.7z" fill="#000" fillOpacity=".22" />
        </svg>
      </div>
      <Regalos {...x} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesRegencia;

export default function Regencia(props: Props) {
  const { b, inv } = props;
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <Secciones
        {...props}
        opciones={{
          respiro: "Y, entre baile y baile, un poco de nosotros.",
          piezas: {
            cuentaAtras: b("cuentaAtras") && <Reloj fecha={inv.pareja.fecha} />,
            itinerario: itin && <OrdenDelDia x={itin} inv={inv} />,
            dressCode: dress && <Etiqueta {...dress} />,
            regalos: regalos && <Obsequio {...regalos} />,
          },
          tonos: { cuentaAtras: "velo", dressCode: "hondo", alojamiento: "velo", album: "velo" },
        }}
      />
      <Despedida inv={inv} ornamento="lacre" />
      <GuionEscenas />
    </Lienzo>
  );
}
