import Calendario from "@/components/bloques/Calendario";
import ComoLlegar, { destinosDe } from "@/components/bloques/ComoLlegar";
import Capitulos from "@/components/bloques/Capitulos";
import CuentaAtras from "@/components/bloques/CuentaAtras";
import Galeria from "@/components/bloques/Galeria";
import Muro from "@/components/bloques/Muro";
import { Hashtag, Notas } from "@/components/bloques/Nuevos";
import { Anuncio, Autobus, Extranjeros, LimiteRsvp, Ninos, Preboda, Preguntas } from "@/components/bloques/Protocolo";
import Rsvp from "@/components/bloques/Rsvp";
import {
  Album,
  Alojamiento,
  DressCode,
  Historia,
  Playlist,
  Regalos,
} from "@/components/bloques/Simples";
import Icono from "@/components/Iconos";
import Revelar from "@/components/Revelar";
import FirmaManuscrita from "@/components/sobre/FirmaManuscrita";
import { obtenerPlantilla, type Seccion } from "@/data/plantillas";
import { formatearFecha, horaDelDia } from "@/lib/fecha";
import type { Bloque, Invitacion, Ornamento as TipoOrnamento } from "@/lib/tipos";
import { Ornamento } from "./ornamentos";
import { Enfoca } from "./vida";

/**
 * Las piezas que comparten las plantillas, y el contrato.
 *
 * Cada plantilla (`sobre.tsx`, `registro.tsx`…) pone SUS fuentes, SU
 * portada y SU cierre; el orden de las secciones es un dato del catálogo
 * (`Plantilla.orden` en src/data/plantillas.ts) y `Secciones` lo recorre.
 * Lo que la pareja rellenó y la plantilla no destaca va a `YAdemas`, al
 * final y compacto: nunca se descarta en silencio.
 */

export type Props = {
  inv: Invitacion;
  /** Busca un bloque por tipo en los datos de esta boda. */
  b: <T extends Bloque["t"]>(t: T) => Extract<Bloque, { t: T }> | undefined;
  /** Variante de color si la página ya la conoce en servidor (?c=). */
  variante?: string;
};

/** Envuelve una sección con su aparición al entrar en pantalla. */
export function Entra({
  children,
  retraso = 0,
  tono,
}: {
  children: React.ReactNode;
  retraso?: number;
  /** Banda de color de la sección (vida.css): «velo» teñida, «hondo» en negativo. */
  tono?: Tono;
}) {
  return (
    <Revelar retraso={retraso} className={tono ? `tono tono-${tono}` : undefined}>
      {children}
    </Revelar>
  );
}

export type Tono = "velo" | "hondo";

/**
 * La «y» entre los dos nombres, tratada como un gesto tipográfico: cursiva
 * de la display, en el acento, y llega un instante después que los
 * nombres. En `bloque` va en su propia línea, entre dos hilos finos que se
 * abren. Se lee «Laura y Rubén» (el texto es una «y» de verdad). En
 * línea, quien la usa pone los espacios FUERA: `{a} <Y /> {b}`.
 */
export function Y({
  bloque = false,
  signo = "y",
  className,
}: {
  bloque?: boolean;
  /** «y» o «&». */
  signo?: string;
  className?: string;
}) {
  return (
    <span className={`y-gesto ${className ?? ""}`} data-forma={bloque ? "bloque" : undefined}>
      {signo}
    </span>
  );
}

/** Título de una sección propia de plantilla, con el ornamento que toque. */
export function TituloSeccion({
  children,
  ornamento,
  alineado = "centro",
}: {
  children: React.ReactNode;
  ornamento: TipoOrnamento;
  alineado?: "centro" | "izquierda";
}) {
  const izq = alineado === "izquierda";
  return (
    <div className={izq ? "text-left" : "text-center"}>
      <h2 className="display sin-orn text-[clamp(2.1rem,9vw,3.1rem)]">{children}</h2>
      <div className={`mt-5 flex ${izq ? "justify-start" : "justify-center"}`}>
        <Ornamento tipo={ornamento} className={izq ? "ml-0" : ""} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────── itinerario

type FormaItinerario = "centrado" | "lista" | "ficha";

export function Itinerario({
  paradas,
  titulo = "El gran día",
  forma = "centrado",
  ornamento = "filete",
}: Extract<Bloque, { t: "itinerario" }> & {
  fecha: string;
  forma?: FormaItinerario;
  ornamento?: TipoOrnamento;
}) {
  if (forma === "ficha") {
    // Registro: una tabla de juzgado. Hora a la izquierda, en grande y con
    // cifras tabulares; todo alineado a la izquierda.
    return (
      <section className="mx-auto max-w-[40rem] px-6 py-20">
        <TituloSeccion ornamento={ornamento} alineado="izquierda">{titulo}</TituloSeccion>
        <ol className="mt-10 border-t-2 border-current">
          {paradas.map((p) => (
            <li key={p.titulo + p.hora} className="grid grid-cols-[5.5rem_1fr] gap-x-5 border-b border-current/20 py-6">
              <span className="display text-[2rem] leading-none tabular-nums">{p.hora}</span>
              <div className="min-w-0">
                <p className="text-[1.15rem] font-semibold">{p.titulo}</p>
                <p className="mt-1 text-[1.0625rem]">{p.lugar}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (forma === "lista") {
    return (
      <section className="mx-auto max-w-[36rem] px-6 py-24">
        <TituloSeccion ornamento={ornamento}>{titulo}</TituloSeccion>
        <ol className="mt-12 flex flex-col">
          {paradas.map((p) => (
            <li key={p.titulo + p.hora} className="flex gap-6 border-t border-current/15 py-7">
              <span className="display w-20 shrink-0 text-[1.6rem] text-[var(--acento-texto)]">
                {p.hora}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[1.125rem]">{p.titulo}</p>
                <p className="mt-1 text-[1.0625rem] opacity-80">{p.lugar}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  // Centrado: las paradas en una rejilla (dos columnas desde tablet), sin
  // direcciones ni botones: eso va UNA vez en «Cómo llegar», debajo.
  return (
    <section className="mx-auto max-w-[44rem] px-6 py-24">
      <TituloSeccion ornamento={ornamento}>{titulo}</TituloSeccion>
      <ol className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2">
        {paradas.map((p, i) => (
          <li key={p.titulo + p.hora} className="text-center">
            <Icono
              id={p.icono ?? (i === 0 ? "iglesia" : "copas")}
              size={28}
              className="mx-auto text-[var(--acento-texto)]"
            />
            <p className="display mt-4 text-[2.5rem] leading-none tabular-nums">{p.hora}</p>
            <p className="mt-3 text-[1.125rem]">{p.titulo}</p>
            <p className="mt-1 text-[1.0625rem] opacity-80">{p.lugar}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Un corte a sangre dentro de la invitación, para dejar respirar. */
export function Respiro({ foto, frase }: { foto?: string; frase?: string }) {
  if (!foto) return null;
  return (
    <section className="respiro-corte relative h-[64svh] min-h-[22rem] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
      <img
        src={foto}
        alt=""
        width={900}
        height={1200}
        loading="lazy"
        decoding="async"
        className="respiro-foto absolute inset-0 h-full w-full object-cover"
      />
      {frase && (
        <>
          <span aria-hidden className="absolute inset-0" style={{ background: "rgba(10,8,7,.5)" }} />
          <div className="relative grid h-full place-items-center px-8 text-center">
            <p
              className="display respiro-frase max-w-[18ch] text-[clamp(2rem,8vw,3.4rem)] italic leading-[1.18] text-white"
              style={{ textShadow: "0 1px 26px rgba(0,0,0,.5)" }}
            >
              {frase}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * El cierre: «Con cariño, Laura y Rubén» escrito a mano (FirmaManuscrita,
 * de E1: se traza al llegar al pie), la fecha y el botón de confirmar.
 * `firma` cambia el color del trazo (por defecto, la tinta).
 */
export function Despedida({
  inv,
  ornamento,
  alineado = "centro",
  firma,
  boton = "lleno",
  flor,
}: {
  inv: Invitacion;
  ornamento: TipoOrnamento;
  alineado?: "centro" | "izquierda";
  firma?: string;
  /** «lleno» (acento) o «oro» (degradado dorado de Carta). */
  boton?: "lleno" | "oro";
  /** Una pieza que sustituye al ornamento (el ramo de Carta). */
  flor?: React.ReactNode;
}) {
  const izq = alineado === "izquierda";
  return (
    <section className={`despedida px-6 pb-12 pt-28 ${izq ? "mx-auto max-w-[40rem] text-left" : "text-center"}`}>
      <div className={`flex ${izq ? "justify-start" : "justify-center"}`}>
        {flor ?? <Ornamento tipo={ornamento} />}
      </div>
      <FirmaManuscrita
        nombres={`${inv.pareja.a} y ${inv.pareja.b}`}
        prefijo="Con cariño,"
        color={firma}
        className={`mt-10 block ${izq ? "" : "mx-auto"}`}
      />
      <p className="despedida-fecha display mt-8 text-[clamp(1.5rem,6vw,2rem)] leading-[1.25]">
        <Enfoca texto={mayuscula(formatearFecha(inv.pareja.fecha, { dateStyle: "full" }))} />
      </p>
      <a
        href="#confirmar"
        className={
          boton === "oro"
            ? "boton-oro mt-10 inline-flex min-h-14 items-center px-9 text-[1.0625rem]"
            : "mt-10 inline-flex min-h-14 items-center bg-[var(--acento)] px-9 text-[1.0625rem] text-[var(--sobre-acento)]"
        }
        style={{ borderRadius: "var(--radio)" }}
      >
        Confirmar asistencia
      </a>
    </section>
  );
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// ─────────────────────────────────────────────────────────────── «Y además»

/**
 * Lo que la pareja rellenó y esta plantilla no destaca. Compacto, al final,
 * pero ENTERO: un IBAN, un hotel o un dress code no se pierden porque la
 * plantilla sea mínima.
 */
export function YAdemas({ bloques, ornamento, alineado = "centro" }: { bloques: Bloque[]; ornamento: TipoOrnamento; alineado?: "centro" | "izquierda" }) {
  if (bloques.length === 0) return null;
  const fila = "border-t border-current/15 py-6";
  return (
    <section className="mx-auto max-w-[36rem] px-6 py-20" aria-labelledby="y-ademas">
      <div id="y-ademas">
        <TituloSeccion ornamento={ornamento} alineado={alineado}>Y además</TituloSeccion>
      </div>
      <dl className="mt-10 text-left text-[1.0625rem] leading-relaxed">
        {bloques.map((x, i) => {
          switch (x.t) {
            case "dressCode":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">Cómo vestir</dt>
                  <dd className="mt-1 opacity-85">{x.nota}</dd>
                  {x.paleta.length > 0 && (
                    <dd className="mt-3 flex gap-2" aria-label="Colores sugeridos">
                      {x.paleta.map((c) => (
                        <span key={c} className="h-7 w-7 rounded-full border border-current/20" style={{ background: c }} />
                      ))}
                    </dd>
                  )}
                </div>
              );
            case "alojamiento":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">Dónde dormir</dt>
                  {x.opciones.map((h) => (
                    <dd key={h.nombre} className="mt-2">
                      {h.enlace ? (
                        <a href={h.enlace} target="_blank" rel="noopener noreferrer" className="underline decoration-current/40 underline-offset-4">
                          {h.nombre}
                        </a>
                      ) : (
                        h.nombre
                      )}
                      {h.nota && <span className="opacity-75"> — {h.nota}</span>}
                    </dd>
                  ))}
                </div>
              );
            case "regalos":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">{x.titulo ?? "Si queréis tener un detalle"}</dt>
                  {x.nota && <dd className="mt-1 opacity-85">{x.nota}</dd>}
                  {x.iban && <dd className="mt-2 select-all break-all tabular-nums">{x.iban}</dd>}
                  {x.bizum && <dd className="mt-1 tabular-nums">Bizum: {x.bizum}</dd>}
                  {x.enlacePago && (
                    <dd className="mt-2">
                      <a href={x.enlacePago} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center underline underline-offset-4">
                        Hacerlo desde aquí
                      </a>
                    </dd>
                  )}
                </div>
              );
            case "playlist":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">{x.titulo ?? "La música"}</dt>
                  <dd className="mt-1">
                    <a href={x.spotify} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center underline underline-offset-4">
                      Añadir una canción a la lista
                    </a>
                  </dd>
                </div>
              );
            case "hashtag":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">Si subís fotos</dt>
                  <dd className="mt-1">Usad #{x.etiqueta}</dd>
                </div>
              );
            case "album":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">{x.titulo ?? "Las fotos de todos"}</dt>
                  <dd className="mt-1 opacity-85">
                    {x.subidaInvitados
                      ? "El día de la boda se abre un álbum para que subáis vuestras fotos: lo encontraréis en esta invitación y en el QR de las mesas."
                      : "Después de la boda colgaremos aquí las fotos."}
                  </dd>
                </div>
              );
            case "notas":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">Conviene saber</dt>
                  {x.items.map((n) => (
                    <dd key={n.titulo} className="mt-2">
                      <strong className="font-semibold">{n.titulo}.</strong> {n.texto}
                    </dd>
                  ))}
                </div>
              );
            case "historia":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">Cómo empezó</dt>
                  {x.parrafos.map((t, j) => (
                    <dd key={j} className="mt-2 opacity-90">{t}</dd>
                  ))}
                </div>
              );
            case "capitulos":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">{x.titulo ?? "Nuestra historia"}</dt>
                  {x.capitulos.map((c) => (
                    <dd key={c.titulo} className="mt-2">
                      {c.cuando && <span className="opacity-75">{c.cuando}. </span>}
                      <strong className="font-semibold">{c.titulo}.</strong> {c.texto}
                    </dd>
                  ))}
                </div>
              );
            case "galeria":
              return (
                <div key={i} className={fila}>
                  <dt className="font-semibold">{x.titulo ?? "Fotos"}</dt>
                  <dd className="mt-3 grid grid-cols-4 gap-2">
                    {x.fotos.slice(0, 8).map((f) => (
                      /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
                      <img key={f} src={f} alt="" width={160} height={160} loading="lazy" decoding="async" className="aspect-square w-full object-cover" style={{ borderRadius: "var(--radio)" }} />
                    ))}
                  </dd>
                </div>
              );
            default:
              return null;
          }
        })}
      </dl>
    </section>
  );
}

// ─────────────────────────────────────────────────────────── el recorrido

/** Bloques que no se pueden «compactar»: se pintan enteros aunque falten en el orden. */
const SIEMPRE_ENTEROS: Bloque["t"][] = ["itinerario", "rsvp", "muro", "cuentaAtras"];

export type OpcionesSecciones = {
  itinerario?: FormaItinerario;
  galeria?: "sangre" | "tira";
  respiro?: string;
  alineado?: "centro" | "izquierda";
  /** Sustituye la pieza por defecto de una sección. */
  piezas?: Partial<Record<Seccion, React.ReactNode>>;
  /**
   * El ritmo de color: qué secciones van en banda teñida («velo») o en
   * negativo («hondo»). Al hacer scroll, cada banda entra con un fundido
   * del papel a su tono (vida.css). Nada de monotonía: papel, velo, papel,
   * hondo… y nunca dos negativos seguidos.
   */
  tonos?: Partial<Record<Seccion, Tono>>;
};

/**
 * Los bloques de protocolo (docs/12 §3) tienen un sitio natural en
 * cualquier invitación, así que no hace falta escribirlos en el orden de
 * cada plantilla: quién invita abre, el autobús y la preboda van tras el
 * día, los niños justo antes de confirmar, y las preguntas y la nota para
 * los de fuera, al final (antes del muro). Si una plantilla los coloca en
 * su `orden`, manda la plantilla.
 */
function conProtocolo(base: Seccion[]): Seccion[] {
  const o = [...base];
  const tiene = (s: Seccion) => o.includes(s);
  const tras = (ancla: Seccion, ...nuevas: Seccion[]) => {
    const i = o.indexOf(ancla);
    o.splice(i < 0 ? o.length : i + 1, 0, ...nuevas.filter((n) => !tiene(n)));
  };
  const antes = (ancla: Seccion, ...nuevas: Seccion[]) => {
    const i = o.indexOf(ancla);
    o.splice(i < 0 ? o.length : i, 0, ...nuevas.filter((n) => !tiene(n)));
  };
  if (!tiene("anuncio")) o.unshift("anuncio");
  tras("itinerario", "autobus", "preboda");
  antes("rsvp", "ninos");
  antes("muro", "preguntas", "extranjeros");
  return o;
}

/**
 * Recorre `Plantilla.orden` y pinta cada sección que la boda tenga.
 * Al final, `YAdemas` con lo que sobra.
 */
export function Secciones({ inv, b, opciones = {} }: Props & { opciones?: OpcionesSecciones }) {
  const p = obtenerPlantilla(inv.plantilla);
  const tipo = inv.tema?.ornamento ?? p.ornamento;
  const fecha = inv.pareja.fecha;
  const galeria = b("galeria");

  const pieza = (s: Seccion): React.ReactNode => {
    if (opciones.piezas && s in opciones.piezas) return opciones.piezas[s];
    switch (s) {
      case "respiro":
        return <Respiro foto={galeria?.fotos[2] ?? galeria?.fotos[0]} frase={opciones.respiro} />;
      case "itinerario": {
        const x = b("itinerario");
        if (!x) return null;
        const primera = x.paradas[0];
        return (
          <>
            <Itinerario {...x} fecha={fecha} forma={opciones.itinerario} ornamento={tipo} />
            <ComoLlegar destinos={destinosDe(x.paradas)} centrado={opciones.alineado !== "izquierda"} />
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
      case "cuentaAtras":
        // U1: la cuenta atrás va en la portada de todas las plantillas
        // (CuentaPortada). Aquí ya no se repite.
        return null;
      case "capitulos": {
        const x = b("capitulos");
        return x && <Capitulos {...x} />;
      }
      case "historia": {
        const x = b("historia");
        return x && <Historia {...x} />;
      }
      case "galeria":
        return galeria && <Galeria fotos={galeria.fotos} titulo={galeria.titulo} variante={opciones.galeria ?? galeria.variante} />;
      case "dressCode": {
        const x = b("dressCode");
        return x && <DressCode {...x} />;
      }
      case "alojamiento": {
        const x = b("alojamiento");
        return x && <Alojamiento {...x} />;
      }
      case "notas": {
        const x = b("notas");
        return x && <Notas {...x} />;
      }
      case "playlist": {
        const x = b("playlist");
        return x && <Playlist {...x} />;
      }
      case "regalos": {
        const x = b("regalos");
        return x && <Regalos {...x} />;
      }
      case "album": {
        const x = b("album");
        return x && <Album {...x} slug={inv.slug} fecha={inv.pareja.fecha} />;
      }
      case "hashtag": {
        const x = b("hashtag");
        return x && <Hashtag {...x} />;
      }
      case "rsvp": {
        const x = b("rsvp");
        return (
          x && (
            <>
              {x.limite && <LimiteRsvp limite={x.limite} motivo={x.motivoLimite} />}
              <Rsvp slug={inv.slug} {...x} />
            </>
          )
        );
      }
      case "anuncio": {
        const x = b("anuncio");
        return x && <Anuncio {...x} />;
      }
      case "ninos": {
        const x = b("ninos");
        return x && <Ninos {...x} />;
      }
      case "preguntas": {
        const x = b("preguntas");
        return x && <Preguntas {...x} />;
      }
      case "autobus": {
        const x = b("autobus");
        return x && <Autobus {...x} />;
      }
      case "extranjeros": {
        const x = b("extranjeros");
        return x && <Extranjeros {...x} />;
      }
      case "preboda": {
        const x = b("preboda");
        return x && <Preboda {...x} />;
      }
      case "muro":
        return b("muro") && <Muro slug={inv.slug} />;
    }
  };

  const orden = conProtocolo(p.orden);
  const enOrden = new Set<string>(orden);
  const sobrantes = inv.bloques.filter(
    (x) => x.t !== "portada" && !enOrden.has(x.t) && !SIEMPRE_ENTEROS.includes(x.t),
  );
  const enteros = inv.bloques.filter(
    (x) => !enOrden.has(x.t) && SIEMPRE_ENTEROS.includes(x.t),
  );

  return (
    <>
      {orden.map((s) => {
        const nodo = pieza(s);
        if (!nodo) return null;
        // El respiro es a sangre: entra como las demás, pero sin el hilo
        // separador encima (`.respiro`).
        return s === "respiro" ? (
          <Revelar key={s} className="respiro">{nodo}</Revelar>
        ) : (
          <Entra key={s} tono={opciones.tonos?.[s]}>{nodo}</Entra>
        );
      })}
      {enteros.map((x) => (
        <Entra key={x.t} tono={opciones.tonos?.[x.t as Seccion]}>{pieza(x.t as Seccion)}</Entra>
      ))}
      <YAdemas bloques={sobrantes} ornamento={tipo} alineado={opciones.alineado} />
    </>
  );
}

export {
  Album,
  Alojamiento,
  Capitulos,
  CuentaAtras,
  DressCode,
  Galeria,
  Hashtag,
  Historia,
  Muro,
  Notas,
  Playlist,
  Regalos,
  Rsvp,
};
