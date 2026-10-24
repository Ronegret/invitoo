import CuentaPortada from "@/components/bloques/CuentaPortada";
import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import { ColorVivo, Guirnalda, Ramo } from "@/components/flores";
import Icono from "@/components/Iconos";
import { formatearFecha, horaDelDia } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import CapitulosCarta from "./CapitulosCarta";
import { Despedida, Secciones, Y, type Props } from "./comun";
import { datosPortada } from "./datos-portada";
import { cartaDisplay, cartaTexto } from "./fuentes/carta";
import Lienzo from "./Lienzo";
import { Enfoca } from "./vida";
import "./carta.css";

/**
 * CARTA — la insignia de la casa. NUEVA (v2).
 *
 * Nace del ADN de Nico & Gaby (nico-y-gaby.invitoo.es): crema, oro y verde
 * bosque; Cormorant Garamond en cursiva para los nombres con la «&» en
 * cobre; fechas con el interletrado muy abierto (18 · SEPTIEMBRE · 2027);
 * botones con un degradado dorado sutil (texto oscuro sobre oro: 5,5:1 en
 * su punto más oscuro); filetes de 1 px y ornamentos mínimos; una sola
 * sección en negativo, verde bosque, con la cuenta atrás y el dress code; y
 * la historia en capítulos con año y lugar, en un carrusel de fotos a
 * sangre con el pie en cursiva.
 *
 * Lo que se corrige de Nico & Gaby: el texto es de 18 px (allí, ~11), no
 * hay pasos de más (ni «Con música / Sin música» ni «Desliza» que haya que
 * pulsar) y la cuenta atrás no se queda en 00 cuando la boda ha pasado.
 *
 * Tipografía: Cormorant Garamond (display, cursiva) + Instrument Sans
 * (texto, 18 px). El oro es solo decoración (filetes, «&», iconos y el
 * botón); el texto pequeño de acento va en el tercer color de la variante
 * (bosque, granate o noche), que pasa AA de sobra.
 *
 * Apertura: el sobre crema con lacre dorado de E1 (`usaSobre` en
 * src/components/sobre/config.ts), sin vídeo.
 */

/** «Plaza…, 40100 Real Sitio de San Ildefonso, Segovia» → «Real Sitio de San Ildefonso · Segovia». */
function sitio(direccion?: string) {
  const t = (direccion ?? "").split(",").map((s) => s.trim().replace(/^\d{5}\s*/, "")).filter(Boolean);
  if (t.length < 2) return t[0] ?? "";
  const [pueblo, provincia] = t.slice(-2);
  return pueblo === provincia ? pueblo : `${pueblo} · ${provincia}`;
}

function Portada(props: Props) {
  const d = datosPortada(props);
  const primera = props.b("itinerario")?.paradas[0];
  const semana = formatearFecha(props.inv.pareja.fecha, { weekday: "long" });
  return (
    <header className="carta-portada relative">
      <div className="carta-marco relative mx-3 my-3 flex min-h-[calc(100svh-1.5rem)] flex-col items-center justify-center px-6 pb-12 pt-[clamp(7.5rem,34vw,9.5rem)] text-center md:mx-auto md:max-w-[46rem]">
        {/* Las flores: un ramillete arriba a la izquierda y otro abajo a la
            derecha, que florecen al abrir la carta. El centro queda libre. */}
        <Guirnalda esquina="sup-izq" tamano="min(50vw, 230px)" tono="var(--carta-flor)" densidad="plena" className="carta-flores arriba" />
        <Guirnalda esquina="sup-der" tamano="min(36vw, 170px)" tono="var(--carta-flor)" className="carta-flores arriba-der" />
        <Guirnalda esquina="inf-der" tamano="min(34vw, 160px)" tono="var(--carta-flor)" className="carta-flores abajo" />
        <p className="carta-lema">Con muchísima ilusión, os invitamos a nuestra boda</p>
        <h1
          className="display asienta vt-nombres carta-nombres mt-7"
          style={{ fontSize: d.tamNombres(3.2, 19, 0.42, 7.2) }}
        >
          <span className="block">{d.a}</span>
          <Y bloque signo="&" className="carta-y my-1" />
          <span className="block">{d.b}</span>
        </h1>
        <CuentaPortada hasta={props.inv.pareja.fecha} estilo="rombo" className="carta-cuenta mt-6" />
        {/* La fecha a la manera de las cartulinas: el mes arriba y, debajo,
            el día grande entre el día de la semana y el año. */}
        <div className="carta-fecha mt-8" aria-label={d.fechaLarga} role="group">
          <p className="carta-fecha-mes" aria-hidden>
            <Enfoca texto={d.mes} al="carga" retraso={900} />
          </p>
          <p className="carta-fecha-fila mt-3" aria-hidden>
            <span className="carta-fecha-lado">{semana}</span>
            <span className="carta-fecha-dia display tabular-nums">
              <Enfoca texto={String(d.dia)} al="carga" retraso={1250} />
            </span>
            <span className="carta-fecha-lado tabular-nums">{d.anio}</span>
          </p>
        </div>
        <p className="mt-7 text-[1.125rem] leading-[1.5]">
          {primera && <span className="tabular-nums">A las {primera.hora} · </span>}
          {d.lugar}
          <br />
          <span className="carta-sitio">{sitio(primera?.direccion)}</span>
        </p>
        <a href="#confirmar" className="boton-oro mt-9 inline-flex min-h-14 items-center px-10 text-[1.0625rem]">
          Confirmar asistencia
        </a>
      </div>
      {d.foto && (
        <figure className="carta-frontis">
          {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
          <img
            src={d.foto}
            alt={`${d.a} y ${d.b}`}
            width={1100}
            height={1650}
            fetchPriority="high"
            className="foto-entra aspect-[4/5] w-full object-cover md:aspect-[16/10]"
          />
        </figure>
      )}
    </header>
  );
}

/** La frase de la portada, como una dedicatoria: una cita grande en cursiva. */
function Dedicatoria({ frase, a, b }: { frase: string; a: string; b: string }) {
  if (!frase) return null;
  return (
    <section className="px-6 pb-12 pt-28 text-center" aria-label="Unas palabras de los novios">
      <span aria-hidden className="carta-comilla cita-comilla">“</span>
      <blockquote className="display carta-cita mx-auto mt-2">
        <Enfoca texto={frase} />
      </blockquote>
      <p className="carta-rotulo mt-8">
        {a} &amp; {b}
      </p>
    </section>
  );
}

type Itinerario = Extract<Bloque, { t: "itinerario" }>;

/** «El gran día» en tarjetas, el programa en línea de tiempo y un solo «Cómo llegar». */
function GranDia({ x, fecha, slug, a, b }: { x: Itinerario; fecha: string; slug: string; a: string; b: string }) {
  const destinos = destinosDe(x.paradas);
  const primera = x.paradas[0];
  const ceremonia = destinos[0];
  const celebracion = destinos[1];
  const diaSemana = formatearFecha(fecha, { weekday: "long", day: "numeric" });
  const mesAnio = formatearFecha(fecha, { month: "long", year: "numeric" });
  const tarjetas = [
    {
      icono: "anillos",
      rotulo: "Cuándo",
      titulo: diaSemana,
      linea: mesAnio,
      pie: primera ? `a las ${primera.hora}` : undefined,
    },
    ceremonia && {
      icono: primera?.icono ?? "iglesia",
      rotulo: celebracion ? "La ceremonia" : "Dónde",
      titulo: ceremonia.lugar,
      linea: sitio(ceremonia.direccion),
      pie: ceremonia.horas,
    },
    celebracion && {
      icono: "copas",
      rotulo: "La celebración",
      titulo: celebracion.lugar,
      linea: sitio(celebracion.direccion),
      pie: celebracion.horas,
    },
  ].filter(Boolean) as { icono: string; rotulo: string; titulo: string; linea: string; pie?: string }[];

  return (
    <>
      <section className="mx-auto max-w-[52rem] px-6 py-24" aria-labelledby="carta-dia">
        <h2 id="carta-dia" className="display text-center text-[clamp(2.4rem,10vw,3.6rem)]">
          {x.titulo ?? "El gran día"}
        </h2>
        <ul className="carta-tarjetas mt-14 grid gap-4 md:grid-cols-2">
          {tarjetas.map((t, i) => (
            <li key={t.rotulo} className={`carta-tarjeta ${i === 0 ? "md:col-span-2" : ""}`}>
              <span className="carta-icono" aria-hidden>
                <Icono id={t.icono} size={24} />
              </span>
              <p className="carta-rotulo mt-6">{t.rotulo}</p>
              <p className="display mt-3 text-[clamp(1.9rem,7.5vw,2.4rem)] leading-[1.08] first-letter:uppercase">
                {t.titulo}
              </p>
              {t.linea && <p className="mt-2 text-[1.0625rem] opacity-90 first-letter:uppercase">{t.linea}</p>}
              {t.pie && <p className="carta-hora mt-5">{t.pie}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[40rem] px-6 py-20" aria-labelledby="carta-programa">
        <h2 id="carta-programa" className="display text-center text-[clamp(2.2rem,9vw,3.2rem)]">
          El programa
        </h2>
        <ol className="carta-linea mt-14">
          {x.paradas.map((p) => (
            <li key={p.titulo + p.hora} className="carta-parada">
              <p className="carta-parada-hora display tabular-nums">{p.hora}</p>
              <div className="min-w-0">
                <p className="display text-[1.75rem] leading-[1.1]">{p.titulo}</p>
                <p className="mt-1.5 text-[1.0625rem] opacity-90">{p.lugar}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <ComoLlegar destinos={destinos} />
      <Calendario
        slug={slug}
        a={a}
        b={b}
        inicio={primera ? horaDelDia(fecha, primera.hora) : fecha}
        lugar={primera ? [primera.lugar, primera.direccion].filter(Boolean).join(", ") : undefined}
      />
    </>
  );
}

/** La única sección en negativo: la cuenta atrás y, debajo, cómo vestir. */
function Negativo({ dress }: { dress?: Extract<Bloque, { t: "dressCode" }> }) {
  // U1: la cuenta atrás sube a la portada; el negativo se queda con el dress code.
  if (!dress) return null;
  return (
    <section className="carta-negativo" aria-label="Cómo vestir">
      <div className="carta-negativo-marco mx-auto max-w-[44rem]">
        {dress && (
          <div className="px-6 pb-20 pt-20 text-center">
            <h2 className="display text-[clamp(2.2rem,9vw,3.2rem)]">Dress code</h2>
            <p className="mx-auto mt-6 max-w-[28rem] text-[1.125rem] leading-[1.7]">{dress.nota}</p>
            {dress.paleta.length > 0 && (
              <ul className="mt-10 flex justify-center gap-4" aria-label="Colores sugeridos">
                {dress.paleta.map((c) => (
                  <li key={c} aria-label={c} title={c} className="carta-color" style={{ background: c }} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export const fuentes = `${cartaDisplay.variable} ${cartaTexto.variable}`;

export default function Carta(props: Props) {
  const { inv, b } = props;
  const d = datosPortada(props);
  const itinerario = b("itinerario");
  const capitulos = b("capitulos");
  return (
    <Lienzo inv={inv} variante={props.variante} fuentes={fuentes}>
      {/* El papel cambia de tono, muy despacio, de sección en sección (F1):
          crema, rubor y salvia, siempre cálidos (F1 los corrige a AA). */}
      <ColorVivo paleta={["#f6f0e4", "#f6ece6", "#eff0e3", "#f7efe0"]} />
      <Portada {...props} />
      <Dedicatoria frase={d.frase} a={d.a} b={d.b} />
      <Secciones
        {...props}
        opciones={{
          respiro: "Gracias por formar parte de nuestra historia.",
          tonos: { capitulos: "velo", rsvp: "velo", notas: "velo" },
          galeria: "tira",
          piezas: {
            capitulos: capitulos && <CapitulosCarta titulo={capitulos.titulo} capitulos={capitulos.capitulos} />,
            itinerario: itinerario && (
              <GranDia x={itinerario} fecha={inv.pareja.fecha} slug={inv.slug} a={inv.pareja.a} b={inv.pareja.b} />
            ),
            cuentaAtras: (b("cuentaAtras") || b("dressCode")) && (
              <Negativo dress={b("dressCode")} />
            ),
            // El dress code va dentro del negativo, con la cuenta atrás.
            dressCode: null,
          },
        }}
      />
      <Despedida
        inv={inv}
        ornamento="filete"
        boton="oro"
        flor={<Ramo tamano="min(62vw, 260px)" tono="var(--carta-flor)" densidad="media" />}
      />
    </Lienzo>
  );
}
