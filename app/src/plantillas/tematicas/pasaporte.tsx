import CuentaPortada from "@/components/bloques/CuentaPortada";
import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { LimiteRsvp } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import { Regalos } from "@/components/bloques/Simples";
import { formatearFecha, horaDelDia, partesMadrid } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { Despedida, Secciones, type Props } from "../comun";
import { datosPortada } from "../datos-portada";
import Lienzo from "../Lienzo";
import { GuionEscenas } from "./escenas";
import { fuentesPasaporte } from "./fuentes/pasaporte";
import HeroVideo, { type FuenteVideo } from "./HeroVideo";
import PasaporteSalidas from "./PasaporteSalidas";
import PasaporteToque from "./PasaporteToque";
import "./tematicas.css";
import "./pasaporte.css";

/**
 * PASAPORTE (Viajeros enamorados) — K2, docs/16a §6.
 *
 * Kraft claro #F3EADB, tinta #2B2620, terracota de tinta de sello #9A4A22,
 * azul petróleo de mapa #2F5D62 y latón (solo adorno). DM Serif Display
 * para los nombres, IBM Plex Sans a 18 px para todo dato de verdad, IBM
 * Plex Mono solo en la línea MRZ y los sellos, Caveat en las notas.
 *
 * El guion:
 *  1. Cabecera: vuestro vídeo a través de la ventanilla de un avión; la
 *     persiana sube al cargar. Debajo, la tarjeta de embarque. Al bajar,
 *     la ventanilla crece y la atravesamos.
 *  2. EL MOMENTO: «La ruta de los dos». Un mapa donde el vuelo se traza
 *     de una ciudad a otra con el pulgar, un avión lo recorre y aparecen
 *     las notas a mano. Las ciudades salen de los capítulos («2019 ·
 *     Lisboa»): sin cambiar el modelo de datos.
 *  3. Las páginas del pasaporte (fotos con su sello), la etiqueta de
 *     equipaje del destino, el panel de salidas y el sello del día.
 *  4. Itinerario de vuelo, la maleta del dress code, el fondo para la luna
 *     de miel y la tarjeta de embarque del RSVP.
 */

const HERO: FuenteVideo = {
  vertical: "/tematicas/pasaporte/hero-v.mp4",
  horizontal: "/tematicas/pasaporte/hero-h.mp4",
  poster: "/tematicas/pasaporte/poster-v.avif",
  posterHorizontal: "/tematicas/pasaporte/poster-h.avif",
  webm: "/tematicas/pasaporte/hero-v.webm",
  webmHorizontal: "/tematicas/pasaporte/hero-h.webm",
};

function fuenteHero(props: Props): FuenteVideo {
  const h = props.inv.tema?.heroVideo;
  if (h?.src) return { vertical: h.src, horizontal: h.horizontal, poster: h.poster, posterHorizontal: h.posterHorizontal };
  return HERO;
}

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const dos = (n: number) => String(n).padStart(2, "0");

/** «Hacienda del Sol, Camino X, 38001 Santa Cruz de Tenerife» → «Santa Cruz de Tenerife». */
function ciudadDe(direccion?: string) {
  const t = (direccion ?? "").split(",").map((s) => s.trim().replace(/^\d{5}\s*/, "")).filter(Boolean);
  return t.at(-1) ?? "";
}

/** El código de tres letras de la etiqueta: el de la última palabra («Tenerife» → TEN). */
function codigo(ciudad: string) {
  const p = (ciudad || "Boda").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).at(-1) ?? "Boda";
  return p.slice(0, 3).toUpperCase();
}

function Titulo({ antes, children }: { antes?: string; children: React.ReactNode }) {
  return (
    <div className="ps-titulo" data-k-escena="">
      {antes && <p className="ps-antes">{antes}</p>}
      <h2 className="display sin-orn">{children}</h2>
      <span className="ps-perforado" aria-hidden="true" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── portada

function Billete({ a, b, destino, fecha, hora }: { a: string; b: string; destino: string; fecha: string; hora: string }) {
  return (
    <div className="ps-billete">
      <div className="ps-billete-cab">
        <span className="ps-billete-marca">Tarjeta de embarque</span>
        <span className="ps-billete-marca" aria-hidden="true">Boarding pass</span>
      </div>
      <dl className="ps-billete-datos">
        <div className="ps-dato ancho">
          <dt>Pasajeros</dt>
          <dd>
            <h1 className="ps-nombres vt-nombres">
              {a} <span className="ps-y">&amp;</span> {b}
            </h1>
          </dd>
        </div>
        <div className="ps-dato">
          <dt>Destino</dt>
          <dd>{destino}</dd>
        </div>
        <div className="ps-dato">
          <dt>Fecha</dt>
          <dd className="tabular-nums">{fecha}</dd>
        </div>
        <div className="ps-dato">
          <dt>Embarque</dt>
          <dd className="tabular-nums">{hora}</dd>
        </div>
        <div className="ps-dato">
          <dt>Puerta</dt>
          <dd>Sí, quiero</dd>
        </div>
      </dl>
      <p className="ps-mrz decor" aria-hidden="true">
        {`P<ESP${a.toUpperCase()}<<${b.toUpperCase()}`.padEnd(36, "<").slice(0, 36)}
      </p>
    </div>
  );
}

function Portada(props: Props) {
  const d = datosPortada(props);
  const p = partesMadrid(props.inv.pareja.fecha);
  const destino = d.ciudad || d.lugar;
  return (
    <header className="k-hero ps-hero">
      <div className="ps-ventanilla wow">
        <HeroVideo fuente={fuenteHero(props)} clase="grad-pasaporte" etiqueta="Ver el vídeo">
          <span className="ps-velo-ventana" aria-hidden="true" />
        </HeroVideo>
        <span className="ps-persiana" aria-hidden="true" />
        <span className="ps-reflejo" aria-hidden="true" />
      </div>
      <div className="ps-rotulo k-hero-sale">
        <p className="ps-lema">Os invitamos a nuestro viaje más importante</p>
        <CuentaPortada hasta={d.fechaIso} estilo="filete" antes="Embarque en" className="k-cuenta pasaporte-cuenta" />
        <Billete a={d.a} b={d.b} destino={destino} fecha={`${dos(p.dia)} ${MESES[p.mes - 1]} ${p.anio}`} hora={d.hora} />
        <a href="#k-inicio" className="k-baja ps-baja">
          Empezad el viaje
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </a>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────── la ruta de los dos

const PENINSULA =
  "M24 38 L47 18 L72 22 L97 21 L124 27 L144 25 L180 27 L186 35 L217 46 L248 53 L283 55 L281 69 L262 83 L236 92 L223 109 L211 134 L221 153 L207 167 L200 186 L184 194 L173 210 L155 209 L126 211 L113 219 L101 230 L87 216 L73 197 L62 198 L51 202 L33 202 L35 178 L20 156 L22 137 L33 114 L37 87 L33 68 L24 54 Z";

/** Unas 40 ciudades sobre el mapa de 320×260 (Canarias, en su recuadro). */
const CIUDADES: Record<string, [number, number]> = {
  Sevilla: [93, 192], Bilbao: [156, 30], Lisboa: [28, 155], Madrid: [140, 108], Barcelona: [262, 82],
  Valencia: [209, 135], "Málaga": [125, 210], Granada: [142, 198], Zaragoza: [198, 75], Oporto: [39, 88],
  "A Coruña": [43, 28], Santiago: [40, 41], Salamanca: [100, 93], Valladolid: [119, 75], Santander: [138, 25],
  "San Sebastián": [176, 29], Donostia: [176, 29], Pamplona: [183, 43], Murcia: [194, 175], Alicante: [207, 165],
  Palma: [272, 132], Mallorca: [272, 132], Ibiza: [246, 150], "Córdoba": [118, 178], "Cádiz": [87, 215],
  Toledo: [134, 124], Oviedo: [96, 28], "Gijón": [100, 23], Girona: [275, 66], Tarragona: [243, 89],
  "Cáceres": [85, 135], "Almería": [166, 207], Segovia: [132, 94], Burgos: [140, 58], "León": [101, 52],
  Tenerife: [36, 240], "Santa Cruz de Tenerife": [36, 240], "Las Palmas": [62, 244], "Gran Canaria": [62, 244],
  Lanzarote: [88, 232], Menorca: [298, 120],
};

type Parada = { nombre: string; x: number; y: number; nota: string };

function paradasDeRuta(caps?: Extract<Bloque, { t: "capitulos" }>): Parada[] {
  const nombres = Object.keys(CIUDADES).sort((a, b) => b.length - a.length);
  const ruta: Parada[] = [];
  for (const c of caps?.capitulos ?? []) {
    const texto = `${c.cuando ?? ""}`;
    const n = nombres.find((k) => texto.toLowerCase().includes(k.toLowerCase()));
    if (!n) continue;
    const [x, y] = CIUDADES[n];
    if (ruta.at(-1)?.x === x && ruta.at(-1)?.y === y) continue;
    ruta.push({ nombre: n, x, y, nota: c.titulo });
  }
  return ruta;
}

/** Arcos suaves entre ciudades: como los vuelos en un mapa de revista. */
function trazado(ps: Parada[]) {
  let d = `M${ps[0].x} ${ps[0].y}`;
  for (let i = 1; i < ps.length; i++) {
    const a = ps[i - 1];
    const b = ps[i];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const k = 0.28 * (i % 2 ? 1 : -1);
    d += ` Q${Math.round(mx - dy * k)} ${Math.round(my + dx * k)} ${b.x} ${b.y}`;
  }
  return d;
}

function Ruta({ paradas }: { paradas: Parada[] }) {
  const D = trazado(paradas);
  const n = paradas.length;
  return (
    <div className="ps-ruta" aria-label={`La ruta: ${paradas.map((p) => p.nombre).join(", ")}`} role="img">
      <div className="ps-ruta-fija">
        <div className="ps-mapa">
          <svg viewBox="0 0 320 260" className="ps-mapa-svg" aria-hidden="true">
            <defs>
              <pattern id="ps-reticula" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0 H0 V20" fill="none" />
              </pattern>
              <mask id="ps-ruta-mascara" maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="260">
                <path d={D} pathLength={1} className="ps-ruta-revela" />
              </mask>
            </defs>
            <rect width="320" height="260" className="ps-mar" />
            <rect width="320" height="260" fill="url(#ps-reticula)" className="ps-reticula" />
            <path d={PENINSULA} className="ps-tierra" />
            <ellipse cx="272" cy="132" rx="11" ry="7" className="ps-tierra" />
            <ellipse cx="298" cy="120" rx="6" ry="3.5" className="ps-tierra" />
            <ellipse cx="246" cy="150" rx="5" ry="3" className="ps-tierra" />
            <rect x="8" y="222" width="96" height="32" rx="2" className="ps-recuadro" />
            <ellipse cx="36" cy="240" rx="7" ry="4" className="ps-tierra" />
            <ellipse cx="62" cy="244" rx="6" ry="5" className="ps-tierra" />
            <ellipse cx="88" cy="232" rx="5" ry="3" className="ps-tierra" />
            <path d={D} className="ps-ruta-trazo" mask="url(#ps-ruta-mascara)" />
            {paradas.map((p, i) => (
              <circle key={p.nombre + i} cx={p.x} cy={p.y} r="4.5" className="ps-punto" style={{ "--t": i / Math.max(1, n - 1) } as React.CSSProperties} />
            ))}
            <g transform="translate(296 236)" className="ps-rosa">
              <path d="M0 -14 L3 0 0 14 -3 0Z M-14 0 L0 3 14 0 0 -3Z" />
              <text y="-17" textAnchor="middle">N</text>
            </g>
          </svg>
          <span className="ps-avion" aria-hidden="true" style={{ offsetPath: `path("${D}")` }}>
            <svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
          </span>
          {paradas.map((p, i) => (
            <p
              key={p.nombre + i}
              className="ps-nota-mapa"
              aria-hidden="true"
              data-lado={p.x < 110 ? "izq" : p.x > 210 ? "der" : undefined}
              style={{
                left: `${p.x < 110 ? Math.max(p.x - 12, 2) : p.x > 210 ? p.x + 12 : p.x}px`,
                top: `${p.y < 70 ? p.y + 8 : p.y - 36}px`,
                "--t": i / Math.max(1, n - 1),
              } as React.CSSProperties}
            >
              {p.nombre.replace("Santa Cruz de ", "")}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

type Caps = Extract<Bloque, { t: "capitulos" }>;

function Viaje({ x }: { x: Caps }) {
  const paradas = paradasDeRuta(x);
  return (
    <section id="k-inicio" className="ps-seccion ps-viaje" aria-label={x.titulo ?? "Nuestra ruta"}>
      <Titulo antes="Diario de a bordo">{x.titulo ?? "Nuestra ruta"}</Titulo>
      {paradas.length >= 2 && <Ruta paradas={paradas} />}
      <ol className="ps-paginas">
        {x.capitulos.map((c, i) => (
          <li key={c.titulo} className="ps-pagina" data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
            <span className="ps-pagina-sello decor" aria-hidden="true">
              <span>{(c.cuando ?? "").split("·")[0].trim() || "✓"}</span>
            </span>
            {c.cuando && <p className="ps-pagina-cuando">{c.cuando}</p>}
            <h3 className="ps-pagina-titulo">{c.titulo}</h3>
            <p className="ps-pagina-texto">{c.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ──────────────────────────────────────────── las páginas (respiro)

function Paginas({ fotos, lugares }: { fotos: string[]; lugares: string[] }) {
  return (
    <section className="ps-seccion ps-respiro" aria-label="Fotos de nuestros viajes">
      <Titulo antes="Sellos y recuerdos">Nuestros viajes</Titulo>
      <ul className="ps-carril">
        {fotos.map((f, i) => (
          <li key={f + i} className="ps-foto">
            {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
            <img src={f} alt={lugares[i] ? `Foto de viaje: ${lugares[i]}` : "Foto de viaje"} width={480} height={600} loading="lazy" decoding="async" />
            <span className="ps-foto-sello" aria-hidden="true" style={{ "--g": `${i % 2 ? 12 : -14}deg` } as React.CSSProperties}>
              {lugares[i] || "Visado"}
            </span>
          </li>
        ))}
      </ul>
      <p className="ps-pista" aria-hidden="true">Deslizad para pasar páginas</p>
    </section>
  );
}

// ──────────────────────── destino final (etiqueta) + panel de salidas

function Destino({ inv, x }: { inv: Props["inv"]; x?: Extract<Bloque, { t: "itinerario" }> }) {
  const primera = x?.paradas[0];
  const ciudad = ciudadDe(primera?.direccion);
  return (
    <>
      <section className="ps-seccion" aria-label="Cuándo y dónde">
        <Titulo antes="Cuándo y dónde">Destino final</Titulo>
        <div className="ps-etiqueta-caja" data-k-escena="">
          <span className="ps-cinta" aria-hidden="true" />
          <div className="ps-etiqueta">
            <span className="ps-ojal" aria-hidden="true" />
            <p className="ps-etiqueta-codigo" aria-hidden="true">{codigo(ciudad)}</p>
            <p className="ps-etiqueta-ciudad">{ciudad}</p>
            <p className="ps-etiqueta-fecha">
              {mayuscula(formatearFecha(inv.pareja.fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}
              {primera && <>, a las {primera.hora}</>}
            </p>
            {primera && (
              <p className="ps-etiqueta-lugar">
                <strong>{primera.lugar}</strong>
                <span className="block">{primera.direccion}</span>
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="ps-seccion ps-seccion-salidas" aria-label="Cuenta atrás">
        <Titulo antes="Embarque en">Faltan</Titulo>
        <div data-k-escena="">
          <PasaporteSalidas hasta={inv.pareja.fecha} destino={ciudad || "Destino"} />
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────────── itinerario de vuelo

function Itinerario({ x, inv }: { x: Extract<Bloque, { t: "itinerario" }>; inv: Props["inv"] }) {
  const fecha = inv.pareja.fecha;
  const primera = x.paradas[0];
  return (
    <>
      <section className="ps-seccion">
        <Titulo antes={formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long" })}>{x.titulo ?? "Itinerario de vuelo"}</Titulo>
        <ol className="ps-escalas k-ancho">
          {x.paradas.map((p, i) => (
            <li key={p.titulo + p.hora} data-k-escena="" style={{ "--i": i } as React.CSSProperties}>
              <span className="ps-escala-punto" aria-hidden="true" />
              <span className="ps-escala-hora tabular-nums">{p.hora}</span>
              <span className="ps-escala-que">{p.titulo}</span>
              <span className="ps-escala-donde">{p.lugar}</span>
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

// ─────────────────────────────────────── equipaje recomendado (dress)

function Maleta({ nota, paleta }: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="ps-seccion">
      <Titulo antes="Dress code">Equipaje recomendado</Titulo>
      <div className="ps-maleta" data-k-escena="">
        <span className="ps-maleta-tapa" aria-hidden="true" />
        <ul className="ps-maleta-caja" aria-label="Colores sugeridos">
          {paleta.map((c, i) => (
            <li key={c + i} style={{ "--c": c, "--i": i } as React.CSSProperties}>
              <span className="sr-only">{c}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="ps-nota k-ancho" data-k-escena="">{nota}</p>
    </section>
  );
}

// ────────────────────────────────────────── fondo para la luna de miel

function Globo(x: Extract<Bloque, { t: "regalos" }>) {
  return (
    <div className="ps-regalo">
      <svg className="ps-globo" viewBox="0 0 100 110" aria-hidden="true" data-k-escena="">
        <circle cx="50" cy="46" r="38" className="ps-globo-mar" />
        <path d="M30 22 C40 18 46 28 40 36 C34 44 42 52 36 60 C30 56 22 44 24 32Z M58 14 C70 16 80 28 76 40 C70 42 64 34 60 40 C56 36 52 24 58 14Z M56 58 C66 54 74 62 70 74 C64 80 56 76 56 68Z" className="ps-globo-tierra" />
        <path d="M14 46 A36 36 0 0 0 86 46 M50 8 V84" className="ps-globo-eje" />
        <path d="M50 84 V96 M34 100 H66" className="ps-globo-pie" />
      </svg>
      <Regalos {...x} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────── la maqueta

export const fuentes = fuentesPasaporte;

export default function Pasaporte(props: Props) {
  const { b, inv } = props;
  const caps = b("capitulos");
  const itin = b("itinerario");
  const dress = b("dressCode");
  const regalos = b("regalos");
  const rsvp = b("rsvp");
  const galeria = b("galeria");
  const lugares = (caps?.capitulos ?? []).map((c) => (c.cuando ?? "").split("·").at(-1)?.trim() ?? "");
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      <PasaporteToque />
      <Portada {...props} />
      {!caps && <div id="k-inicio" />}
      <Secciones
        {...props}
        opciones={{
          piezas: {
            capitulos: caps && <Viaje x={caps} />,
            respiro: galeria && galeria.fotos.length > 0 && <Paginas fotos={galeria.fotos.slice(0, 5)} lugares={lugares} />,
            cuentaAtras: b("cuentaAtras") && <Destino inv={inv} x={itin} />,
            itinerario: itin && <Itinerario x={itin} inv={inv} />,
            dressCode: dress && <Maleta {...dress} />,
            regalos: regalos && <Globo {...regalos} />,
            rsvp: rsvp && (
              <div className="ps-rsvp">
                <div className="ps-rsvp-billete">
                  <p className="ps-antes">Tarjeta de embarque · confirmad vuestro asiento</p>
                  {rsvp.limite && <LimiteRsvp limite={rsvp.limite} motivo={rsvp.motivoLimite} />}
                  <Rsvp slug={inv.slug} {...rsvp} />
                </div>
              </div>
            ),
          },
          tonos: { itinerario: "velo", alojamiento: "velo", album: "velo" },
        }}
      />
      <Despedida
        inv={inv}
        ornamento="punto"
        flor={
          <div className="ps-tapa" aria-hidden="true">
            <span className="ps-tapa-ini">{inv.pareja.a.charAt(0)}&nbsp;&amp;&nbsp;{inv.pareja.b.charAt(0)}</span>
            <span className="ps-tapa-txt">Pasaporte</span>
            <svg viewBox="0 0 40 40" className="ps-tapa-chip"><rect x="4" y="10" width="32" height="20" rx="4" /><circle cx="20" cy="20" r="5" /></svg>
          </div>
        }
      />
      <GuionEscenas />
    </Lienzo>
  );
}
