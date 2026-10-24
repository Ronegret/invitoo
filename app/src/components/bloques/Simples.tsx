import Icono from "@/components/Iconos";
import Copiar from "./Copiar";
import Titulo from "./titulo";
import EnlaceAlbum from "./EnlaceAlbum";
import { formatearFecha } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";

/**
 * Los bloques que no necesitan JavaScript. Todos son Server Components:
 * no mandan ni un byte de cliente a la invitación.
 */

const ACENTO = "text-[var(--acento-texto,var(--acento))]";
const FOCO =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))]";

/**
 * Ritmo: los bloques ya no son todos «icono + título + ornamento + texto
 * centrado». Cada uno tiene su composición:
 *   · Historia — párrafos y fotos a sangre (de borde a borde en el móvil).
 *   · Cómo vestir — a dos columnas desde tablet; la paleta, en grande.
 *   · La música — una cita grande en cursiva, sin icono.
 *   · El regalo — los datos detrás de «Ver datos», con Copiar y Bizum.
 *   · Dónde dormir — lateral: título a la izquierda, lista a la derecha.
 * El icono se queda solo donde ayuda a escanear (el regalo y el álbum).
 */

export function Historia({
  parrafos,
  fotos,
}: Extract<Bloque, { t: "historia" }>) {
  return (
    <section className="mx-auto max-w-[34rem] px-6 py-24">
      <Titulo>Cómo empezó</Titulo>
      <div className="mt-10 flex flex-col gap-8">
        {parrafos.map((p, i) => (
          <div key={i}>
            <p className="text-[1.125rem] leading-[1.75] opacity-90">{p}</p>
            {/* Una foto entre párrafos, a sangre en el móvil: el texto
                respira y se lee como un álbum, no como un muro. */}
            {fotos?.[i] && (
              /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
              <img
                src={fotos[i]}
                alt=""
                width={900}
                height={1125}
                loading="lazy"
                decoding="async"
                sizes="(min-width: 600px) 34rem, 100vw"
                className="-mx-6 mt-8 aspect-[4/5] w-[calc(100%+3rem)] max-w-none object-cover sm:mx-0 sm:aspect-[3/2] sm:w-full"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function DressCode({
  nota,
  paleta,
}: Extract<Bloque, { t: "dressCode" }>) {
  return (
    <section className="mx-auto max-w-[52rem] px-6 py-24">
      <div className="grid items-center gap-10 sm:grid-cols-[1.1fr_1fr] sm:gap-14">
        <div className="text-center sm:text-left">
          <Titulo alineado="lateral">Cómo vestir</Titulo>
          <p className="mt-6 max-w-[26rem] text-[1.125rem] leading-relaxed opacity-90 max-sm:mx-auto">
            {nota}
          </p>
        </div>
        {paleta.length > 0 && (
          <ul className="flex justify-center sm:justify-start" aria-label="Colores sugeridos">
            {paleta.map((c, i) => (
              <li
                key={c}
                title={c}
                aria-label={c}
                className="h-16 w-16 rounded-full border-2 border-[var(--papel)] sm:h-20 sm:w-20"
                style={{ background: c, marginLeft: i === 0 ? 0 : "-0.85rem" }}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function Playlist({ spotify, titulo, nota }: Extract<Bloque, { t: "playlist" }>) {
  return (
    <section className="mx-auto max-w-[40rem] px-6 py-24 text-center">
      <h2 className="text-[1.0625rem] tracking-[0.06em] opacity-85">{titulo ?? "El soundtrack"}</h2>
      {/* La cita grande, en la cursiva de la plantilla: es una petición,
          no un formulario. */}
      <p className="display mx-auto mt-6 max-w-[22ch] text-[clamp(1.9rem,7.5vw,2.8rem)] italic leading-[1.2]">
        <span aria-hidden className={`${ACENTO} mr-1`}>“</span>
        {nota ?? "Si hay una canción que te levanta de la silla, queremos oírla esa noche."}
        <span aria-hidden className={`${ACENTO} ml-1`}>”</span>
      </p>
      <a
        href={spotify}
        target="_blank"
        rel="noopener noreferrer"
        className={`boton-linea mt-10 inline-flex min-h-14 items-center gap-3 rounded-full border border-current/30 px-8 text-[1.0625rem] ${FOCO}`}
      >
        <Icono id="nota" size={20} className={ACENTO} />
        Añadir mi canción en Spotify
      </a>
    </section>
  );
}

export function Regalos({ iban, enlacePago, titulo, nota, bizum, titular }: Extract<Bloque, { t: "regalos" }>) {
  const telefono = bizum?.replace(/[^\d+]/g, "");
  return (
    <section className="px-6 py-24 text-center">
      <Icono id="regalo" size={26} className={`mx-auto ${ACENTO}`} />
      <Titulo>{titulo ?? "Un detalle especial"}</Titulo>
      <p className="mx-auto mt-6 max-w-[27rem] text-[1.125rem] leading-relaxed opacity-90">
        {nota ??
          "Con que vengáis nos sobra. Pero si os apetece tener un detalle, os dejamos esto por aquí."}
      </p>
      {(iban || telefono) && (
        // Los datos no se enseñan de entrada: un IBAN a la vista incomoda.
        // <details> funciona sin JavaScript y el lector de pantalla lo
        // anuncia como «Ver datos, contraído».
        <details className="regalo-datos mx-auto mt-9 max-w-[26rem] text-center">
          <summary
            className={`boton-linea mx-auto inline-flex min-h-14 cursor-pointer list-none items-center gap-2 rounded-full border border-current/30 px-8 text-[1.0625rem] ${FOCO}`}
          >
            <span className="regalo-ver">Ver datos</span>
            <span className="regalo-ocultar">Ocultar datos</span>
          </summary>
          <div className="mt-6 border-y border-current/15 py-6">
            {iban && (
              <>
                <p className="text-[1.0625rem] opacity-85">Cuenta{titular ? ` a nombre de ${titular}` : ""}</p>
                <p className="mt-2 select-all break-all text-[1.1875rem] tabular-nums tracking-wide">{iban}</p>
                <Copiar texto={iban.replace(/\s+/g, "")} que="el IBAN" className="mt-4" />
              </>
            )}
            {telefono && (
              <div className={iban ? "mt-7 border-t border-current/15 pt-6" : ""}>
                <p className="text-[1.0625rem] opacity-85">Por Bizum</p>
                <p className="mt-2 select-all text-[1.1875rem] tabular-nums tracking-wide">{bizum}</p>
                <Copiar texto={telefono} que="el teléfono de Bizum" className="mt-4" />
              </div>
            )}
          </div>
        </details>
      )}
      {enlacePago && (
        <a
          href={enlacePago}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-8 inline-flex min-h-14 items-center rounded-full border border-current/30 px-8 text-[1.0625rem] ${FOCO}`}
        >
          Hacerlo desde aquí
        </a>
      )}
      <style>{`
        .regalo-datos > summary::-webkit-details-marker { display: none; }
        .regalo-datos[open] .regalo-ver, .regalo-datos:not([open]) .regalo-ocultar { display: none; }
      `}</style>
    </section>
  );
}

export function Alojamiento({
  opciones,
}: Extract<Bloque, { t: "alojamiento" }>) {
  return (
    <section className="mx-auto max-w-[52rem] px-6 py-24">
      <div className="grid gap-10 sm:grid-cols-[0.8fr_1.2fr] sm:gap-14">
        <div>
          <Titulo alineado="izquierda">Dónde dormir</Titulo>
        </div>
        <ul className="flex flex-col">
          {opciones.map((h) => (
            <li
              key={h.nombre}
              className="flex items-baseline justify-between gap-5 border-t border-current/15 py-5 last:border-b"
            >
              <span>
                <span className="display text-[1.5rem] leading-tight">{h.nombre}</span>
                {h.nota && (
                  <span className="mt-1 block text-[1.0625rem] opacity-85">
                    {h.nota}
                  </span>
                )}
              </span>
              {h.enlace && (
                <a
                  href={h.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-12 shrink-0 items-center text-[1.0625rem] ${ACENTO} underline decoration-current/40 underline-offset-4 hover:decoration-current ${FOCO}`}
                >
                  Reservar<span className="sr-only"> en {h.nombre}</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Album({
  subidaInvitados,
  titulo,
  slug,
  fecha,
}: Extract<Bloque, { t: "album" }> & { slug: string; fecha: string }) {
  return (
    <section className="px-6 py-24 text-center">
      <Icono id="camara" size={26} className={`mx-auto ${ACENTO}`} />
      <Titulo>{titulo ?? "Comparte tus fotos"}</Titulo>
      <p className="mx-auto mt-6 max-w-[27rem] text-[1.125rem] leading-relaxed opacity-90">
        {subidaInvitados
          ? "Si haces una foto buena, súbela aquí. Así las tenemos todas en el mismo sitio y no repartidas por ochenta móviles."
          : "Aquí irán las fotos del día. Vuelve después de la boda."}
      </p>
      {subidaInvitados && (
        <EnlaceAlbum
          slug={slug}
          fecha={fecha}
          fechaTexto={formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        />
      )}
    </section>
  );
}
