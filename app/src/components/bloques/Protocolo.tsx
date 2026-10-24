import Icono from "@/components/Iconos";
import { formatearFecha } from "@/lib/fecha";
import type { Bloque } from "@/lib/tipos";
import { enlacesMapa } from "./ComoLlegar";
import Titulo from "./titulo";

/**
 * El protocolo de una boda española (docs/12 §3): quién invita, niños,
 * preguntas frecuentes, autobús, invitados de fuera, preboda y la fecha
 * límite para confirmar. Todos son opcionales y de servidor: ni un byte de
 * JavaScript. El acordeón de preguntas es <details>, que funciona sin JS y
 * con teclado, y el lector de pantalla lo anuncia como «contraído».
 */

const ACENTO = "text-[var(--acento-texto,var(--acento))]";
const FOCO =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))]";

type B<T extends Bloque["t"]> = Extract<Bloque, { t: T }>;

/** Quién invita. Clásico: el texto de los padres, como en el papel. Moderno: la pareja. */
export function Anuncio({ estilo, texto, padrinos }: B<"anuncio">) {
  const clasico = estilo === "clasico";
  return (
    <section className="anuncio mx-auto max-w-[38rem] px-6 py-20 text-center" aria-label="Quién invita">
      <p
        className={
          clasico
            ? "display mx-auto max-w-[30ch] text-[clamp(1.35rem,5.2vw,1.65rem)] leading-[1.55]"
            : "display mx-auto max-w-[18ch] text-[clamp(1.9rem,8vw,2.8rem)] italic leading-[1.2]"
        }
      >
        {texto}
      </p>
      {padrinos && (
        <p className="mt-8 text-[1.0625rem] leading-relaxed">
          <span className={`block ${ACENTO}`}>Padrinos</span>
          {padrinos}
        </p>
      )}
    </section>
  );
}

/** Los niños: si vienen, solo los de la familia, o es una noche de adultos. */
export function Ninos({ admitidos, nota, menuInfantil }: B<"ninos">) {
  const titulo =
    admitidos === "si" ? "Los peques, bienvenidos" : admitidos === "solo-familia" ? "Los peques de la familia" : "Una noche para adultos";
  return (
    <section className="mx-auto max-w-[34rem] px-6 py-20 text-center" aria-labelledby="ninos-t">
      <Titulo id="ninos-t">{titulo}</Titulo>
      <p className="mx-auto mt-6 max-w-[28rem] text-[1.125rem] leading-relaxed">{nota}</p>
      {menuInfantil && (
        <p className={`mx-auto mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border border-current/25 px-5 text-[1.0625rem] ${ACENTO}`}>
          <Icono id="plato" size={20} />
          Habrá menú infantil
        </p>
      )}
    </section>
  );
}

/** Preguntas frecuentes, en acordeón nativo. */
export function Preguntas({ titulo = "Preguntas que nos hacéis", items }: B<"preguntas">) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-[38rem] px-6 py-20" aria-labelledby="preguntas-t">
      <Titulo id="preguntas-t">{titulo}</Titulo>
      <div className="mt-10 border-t border-current/15">
        {items.map((x) => (
          <details key={x.p} className="pregunta group border-b border-current/15">
            <summary
              className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[1.125rem] ${FOCO}`}
            >
              <span>{x.p}</span>
              <span aria-hidden className={`pregunta-signo relative block h-4 w-4 shrink-0 ${ACENTO}`} />
            </summary>
            <p className="pb-6 pr-8 text-[1.0625rem] leading-relaxed opacity-90">{x.r}</p>
          </details>
        ))}
      </div>
      <style>{`
        .pregunta > summary::-webkit-details-marker { display: none; }
        .pregunta-signo::before, .pregunta-signo::after {
          content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1.5px; margin-top: -.75px;
          background: currentColor; transition: transform 240ms var(--ease-carta, ease-out);
        }
        .pregunta-signo::after { transform: rotate(90deg); }
        .pregunta[open] .pregunta-signo::after { transform: rotate(0deg); }
        @media (prefers-reduced-motion: reduce) { .pregunta-signo::before, .pregunta-signo::after { transition: none; } }
      `}</style>
    </section>
  );
}

/** El autobús: dónde y cuándo sale, y a qué horas vuelve. */
export function Autobus({ ida, vueltas, nota }: B<"autobus">) {
  return (
    <section className="mx-auto max-w-[36rem] px-6 py-20 text-center" aria-labelledby="autobus-t">
      <Icono id="coche" size={26} className={`mx-auto ${ACENTO}`} />
      <Titulo id="autobus-t">El autobús</Titulo>
      <ul className="mt-10 text-left">
        {ida.map((s) => {
          const mapa = s.mapa ?? enlacesMapa("", s.desde).google;
          return (
            <li key={s.hora + s.desde} className="grid grid-cols-[5rem_1fr] items-baseline gap-x-5 border-t border-current/15 py-5">
              <span className="display text-[1.9rem] leading-none tabular-nums">{s.hora}</span>
              <span className="min-w-0 text-[1.0625rem]">
                Sale de {s.desde}
                <a
                  href={mapa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ml-2 inline-flex min-h-12 items-center underline decoration-current/40 underline-offset-4 ${FOCO}`}
                >
                  Ver en el mapa
                </a>
              </span>
            </li>
          );
        })}
      </ul>
      {vueltas.length > 0 && (
        <div className="border-t border-current/15 pt-6">
          <p className="text-[1.0625rem]">{vueltas.length === 1 ? "Vuelta" : "Vueltas"}</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-3" aria-label="Horas de vuelta">
            {vueltas.map((v) => (
              <li key={v} className="inline-flex min-h-12 items-center rounded-full border border-current/25 px-5 text-[1.125rem] tabular-nums">
                {v}
              </li>
            ))}
          </ul>
        </div>
      )}
      {nota && <p className="mx-auto mt-7 max-w-[28rem] text-[1.0625rem] leading-relaxed opacity-90">{nota}</p>}
    </section>
  );
}

/** Para los invitados de fuera, en su idioma (`lang` para el lector de pantalla). */
export function Extranjeros({ titulo, texto, idioma = "en" }: B<"extranjeros">) {
  return (
    <section lang={idioma} className="mx-auto max-w-[34rem] px-6 py-20 text-center" aria-labelledby="fuera-t">
      <Titulo id="fuera-t">{titulo}</Titulo>
      <p className="mx-auto mt-6 max-w-[28rem] text-[1.125rem] leading-relaxed">{texto}</p>
    </section>
  );
}

/** La preboda: un plan sin protocolo la víspera. */
export function Preboda({ cuando, lugar, texto, direccion }: B<"preboda">) {
  const mapa = direccion ? enlacesMapa(lugar, direccion).google : undefined;
  return (
    <section className="mx-auto max-w-[34rem] px-6 py-20 text-center" aria-labelledby="preboda-t">
      <Titulo id="preboda-t">La víspera</Titulo>
      <p className="display mt-8 text-[clamp(1.6rem,6.5vw,2.1rem)] leading-[1.2]">{cuando}</p>
      <p className={`mt-2 text-[1.125rem] ${ACENTO}`}>{lugar}</p>
      <p className="mx-auto mt-6 max-w-[28rem] text-[1.125rem] leading-relaxed">{texto}</p>
      {mapa && (
        <a
          href={mapa}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-7 inline-flex min-h-12 items-center rounded-full border border-current/30 px-7 text-[1.0625rem] ${FOCO}`}
        >
          Cómo llegar
        </a>
      )}
    </section>
  );
}

/** La fecha límite, justo encima del formulario de confirmación. */
export function LimiteRsvp({ limite, motivo }: { limite: string; motivo?: string }) {
  const fecha = formatearFecha(limite, { day: "numeric", month: "long" });
  return (
    <p className="limite-rsvp mx-auto max-w-[30rem] px-6 pt-16 text-center text-[1.125rem] leading-relaxed">
      Necesitamos saberlo <strong className={`font-semibold ${ACENTO}`}>antes del {fecha}</strong>
      {motivo ? `: ${motivo}.` : "."} Si cambian tus planes, puedes corregir tu respuesta con este mismo enlace.
    </p>
  );
}
