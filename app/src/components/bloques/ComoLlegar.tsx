import Copiar from "./Copiar";

/**
 * Cómo llegar: UN solo bloque para todo el día.
 *
 * Antes cada parada del itinerario llevaba sus cinco botones (Copiar,
 * Google Maps, Apple Maps, Waze…) y, con cuatro paradas en dos sitios, la
 * invitación repetía la misma fila de botones tres veces seguidas. Ahora
 * las paradas se agrupan por sitio y hay un selector («La ceremonia», «La
 * celebración»): se ve un destino cada vez.
 *
 * Sin JavaScript: el selector son radios de verdad y el panel visible se
 * elige con `:has(:checked)`. Un navegador sin `:has` los enseña todos, uno
 * debajo de otro (nunca esconde una dirección). La dirección es texto
 * seleccionable; «Copiar» es lo único de cliente.
 */
export function enlacesMapa(lugar: string, direccion: string, mapa?: string) {
  const q = encodeURIComponent([lugar, direccion].filter(Boolean).join(", "));
  return {
    google: mapa || `https://www.google.com/maps/search/?api=1&query=${q}`,
    apple: `https://maps.apple.com/?q=${q}`,
    waze: `https://waze.com/ul?q=${q}&navigate=yes`,
  };
}

export type Destino = {
  /** Lo que se lee en el selector: «La ceremonia», «La celebración». */
  etiqueta: string;
  lugar: string;
  direccion: string;
  mapa?: string;
  /** Las horas que pasan allí, para el pie: «12:30» o «14:00 – 19:00». */
  horas?: string;
};

type Parada = { titulo: string; hora: string; lugar: string; direccion: string; mapa?: string };

/**
 * Las paradas agrupadas por sitio, en orden de llegada. La primera es «La
 * ceremonia»; las demás, «La celebración» (o el título de su primera
 * parada si hay más de dos sitios).
 */
export function destinosDe(paradas: Parada[]): Destino[] {
  const grupos: (Destino & { clave: string; desde: string; hasta: string; titulo: string })[] = [];
  for (const p of paradas) {
    if (!p.lugar && !p.direccion) continue;
    const clave = (p.direccion || p.lugar).trim().toLowerCase();
    const g = grupos.find((x) => x.clave === clave);
    if (g) {
      g.hasta = p.hora;
      if (!g.mapa && p.mapa) g.mapa = p.mapa;
    } else {
      grupos.push({ clave, etiqueta: "", titulo: p.titulo, lugar: p.lugar, direccion: p.direccion, mapa: p.mapa, desde: p.hora, hasta: p.hora });
    }
  }
  return grupos.map((g, i) => ({
    etiqueta:
      grupos.length === 1
        ? g.lugar || "El sitio"
        : i === 0
          ? "La ceremonia"
          : grupos.length === 2
            ? "La celebración"
            : g.titulo,
    lugar: g.lugar,
    direccion: g.direccion,
    mapa: g.mapa,
    horas: g.desde === g.hasta ? g.desde : `${g.desde} – ${g.hasta}`,
  }));
}

const enlace =
  "como-enlace inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-current/30 px-5 text-[1.0625rem] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))]";

function Panel({ d }: { d: Destino }) {
  const e = enlacesMapa(d.lugar, d.direccion, d.mapa);
  const destino = d.lugar || d.direccion;
  return (
    <>
      <p className="display text-[clamp(1.6rem,6.5vw,2.1rem)] leading-tight">{d.lugar}</p>
      {d.direccion && (
        <p className="como-dir mt-2 max-w-[26rem] select-all text-[1.0625rem] leading-relaxed opacity-90">
          {d.direccion}
        </p>
      )}
      <div className="como-botones mt-6 flex flex-wrap gap-2.5">
        {d.direccion && <Copiar texto={d.direccion} que="la dirección" />}
        <a href={e.google} target="_blank" rel="noopener noreferrer" className={enlace}>
          Google Maps<span className="sr-only">: cómo llegar a {destino}</span>
        </a>
        <a href={e.apple} target="_blank" rel="noopener noreferrer" className={enlace}>
          Apple Maps<span className="sr-only">: cómo llegar a {destino}</span>
        </a>
        <a href={e.waze} target="_blank" rel="noopener noreferrer" className={enlace}>
          Waze<span className="sr-only">: cómo llegar a {destino}</span>
        </a>
      </div>
    </>
  );
}

export default function ComoLlegar({
  destinos,
  id = "como-llegar",
  titulo = "Cómo llegar",
  centrado = true,
}: {
  destinos: Destino[];
  /** Único en la página: da nombre al grupo de radios. */
  id?: string;
  titulo?: string;
  centrado?: boolean;
}) {
  if (destinos.length === 0) return null;
  const varios = destinos.length > 1;
  return (
    <section
      className={`como-llegar mx-auto max-w-[40rem] px-6 py-20 ${centrado ? "text-center" : "text-left"}`}
      aria-labelledby={`${id}-t`}
      data-centrado={centrado ? "" : undefined}
    >
      <h2 id={`${id}-t`} className="display sin-orn text-[clamp(2.1rem,9vw,3.1rem)]">
        {titulo}
      </h2>
      {varios ? (
        <fieldset className="mt-8">
          <legend className="sr-only">Elige a qué sitio quieres ir</legend>
          <div className={`como-selector inline-flex flex-wrap gap-1 rounded-full border border-current/20 p-1 ${centrado ? "justify-center" : ""}`}>
            {destinos.map((d, i) => (
              <label key={d.etiqueta + i} className="como-opcion relative inline-flex min-h-12 cursor-pointer items-center rounded-full px-5 text-[1.0625rem]">
                <input
                  type="radio"
                  name={id}
                  value={String(i)}
                  defaultChecked={i === 0}
                  className="peer absolute inset-0 cursor-pointer opacity-0"
                  data-destino={i}
                />
                <span>{d.etiqueta}</span>
                {d.horas && <span className="sr-only">, {d.horas}</span>}
              </label>
            ))}
          </div>
          {destinos.map((d, i) => (
            <div key={d.etiqueta + i} className="como-panel mt-10" data-panel={i}>
              <Panel d={d} />
            </div>
          ))}
        </fieldset>
      ) : (
        <div className="mt-8">
          <Panel d={destinos[0]} />
        </div>
      )}
      {/* Un panel por radio: se ve el del radio marcado. Hasta 6 sitios. */}
      <style>{`
        .como-llegar[data-centrado] .como-dir { margin-inline: auto; }
        .como-llegar[data-centrado] .como-botones { justify-content: center; }
        .como-opcion { transition: background-color 200ms var(--ease-carta, ease-out), color 200ms var(--ease-carta, ease-out); }
        .como-opcion:has(input:checked) { background: var(--acento); color: var(--sobre-acento); }
        .como-opcion:has(input:focus-visible) { outline: 3px solid var(--acento-texto); outline-offset: 2px; }
        .como-enlace:active { scale: .97; }
        @media (hover: hover) and (pointer: fine) {
          .como-enlace:hover { border-color: color-mix(in srgb, currentColor 60%, transparent); }
          .como-opcion:not(:has(input:checked)):hover { background: color-mix(in srgb, currentColor 7%, transparent); }
        }
        @supports selector(:has(*)) {
          .como-llegar .como-panel { display: none; }
          ${[0, 1, 2, 3, 4, 5]
            .map((i) => `.como-llegar:has(input[data-destino="${i}"]:checked) .como-panel[data-panel="${i}"]`)
            .join(",")} { display: block; }
        }
      `}</style>
    </section>
  );
}
