import Rama from "@/components/Botanica";
import Agendar from "@/components/bloques/Agendar";
import Capitulos from "@/components/bloques/Capitulos";
import CuentaAtras from "@/components/bloques/CuentaAtras";
import Galeria from "@/components/bloques/Galeria";
import Muro from "@/components/bloques/Muro";
import { Cierre, Hashtag, Notas } from "@/components/bloques/Nuevos";
import PortadaFoto from "@/components/bloques/PortadaFoto";
import Rsvp from "@/components/bloques/Rsvp";
import {
  Album,
  Alojamiento,
  DressCode,
  Playlist,
  Regalos,
} from "@/components/bloques/Simples";
import Icono from "@/components/Iconos";
import Revelar from "@/components/Revelar";
import type { Bloque, Invitacion } from "@/lib/tipos";

/**
 * Las piezas que comparten todas las plantillas.
 *
 * Cada plantilla vive en su propio archivo —`sobre.tsx`, `cielo.tsx`…— y
 * monta su página con estas piezas EN EL ORDEN QUE QUIERA, con los nombres
 * que quiera y añadiendo lo que le dé la gana. Ahí está la diferencia con
 * lo que había antes: un único renderizador que pintaba los bloques del
 * JSON siempre en el mismo orden, y por eso las doce se parecían.
 *
 * Aquí solo están las piezas. Las decisiones están en cada plantilla.
 */

export type Props = {
  inv: Invitacion;
  /** Busca un bloque por tipo en los datos de esta boda. */
  b: <T extends Bloque["t"]>(t: T) => Extract<Bloque, { t: T }> | undefined;
};

/** Envuelve una sección con su aparición al entrar en pantalla. */
export function Entra({
  children,
  retraso = 0,
}: {
  children: React.ReactNode;
  retraso?: number;
}) {
  return <Revelar retraso={retraso}>{children}</Revelar>;
}

/**
 * Cada parada guarda solo la hora («12:30»); el día lo pone la boda. Esto
 * las junta para que el .ics tenga una fecha completa.
 */
function horaDelDia(fechaBoda: string, hora: string) {
  const d = new Date(fechaBoda);
  const [h, m] = hora.split(":").map(Number);
  if (Number.isFinite(h)) d.setHours(h, Number.isFinite(m) ? m : 0, 0, 0);
  return d.toISOString();
}

export function Itinerario({
  paradas,
  fecha,
  titulo = "El gran día",
  /** `centrado` es lo clásico; `lista` ocupa menos y se lee de un vistazo. */
  forma = "centrado",
}: Extract<Bloque, { t: "itinerario" }> & {
  fecha: string;
  forma?: "centrado" | "lista";
}) {
  if (forma === "lista") {
    return (
      <section className="mx-auto max-w-[34rem] px-6 py-24">
        <h2 className="display text-center text-[clamp(2.1rem,9vw,3.1rem)]">
          {titulo}
        </h2>
        <ol className="mt-12 flex flex-col">
          {paradas.map((p, i) => (
            <li
              key={p.titulo}
              className="flex gap-6 border-t border-current/12 py-6"
            >
              <span className="display w-20 shrink-0 text-[1.5rem] text-[var(--acento)]">
                {p.hora}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[1.05rem]">{p.titulo}</p>
                <p className="mt-1 text-[0.92rem] opacity-60">{p.lugar}</p>
                {i === 0 && (
                  <p className="mt-1 select-all text-[0.88rem] opacity-50">
                    {p.direccion}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[36rem] px-6 py-24">
      <h2 className="display text-center text-[clamp(2.1rem,9vw,3.1rem)]">
        {titulo}
      </h2>
      <div className="mt-5 flex justify-center text-[var(--acento)] opacity-45">
        <Rama forma="espiga" ancho={22} />
      </div>
      <div className="mt-14 flex flex-col gap-16">
        {paradas.map((p, i) => (
          <article key={p.titulo} className="text-center">
            <Icono
              id={p.icono ?? (i === 0 ? "iglesia" : "copas")}
              size={26}
              className="mx-auto text-[var(--acento)]"
            />
            <p className="mt-4 text-[0.78rem] uppercase tracking-[0.3em] opacity-55">
              {p.titulo}
            </p>
            <p className="display mt-3 text-[2.4rem]">{p.hora}</p>
            <p className="mt-4 text-[1.05rem]">{p.lugar}</p>
            {/* Texto copiable Y enlace: alguien lo querrá pegar en su GPS. */}
            <p className="mx-auto mt-1.5 max-w-[22rem] select-all text-[0.95rem] leading-relaxed opacity-65">
              {p.direccion}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {p.mapa && (
                <a
                  href={p.mapa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-current/25 px-6 text-[0.78rem] uppercase tracking-[0.18em] transition-colors duration-500 hover:border-current/60"
                >
                  <Icono id="mapa" size={16} />
                  Cómo llegar
                </a>
              )}
              <Agendar
                titulo={p.titulo}
                inicio={horaDelDia(fecha, p.hora)}
                lugar={p.lugar}
                direccion={p.direccion}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Un corte a sangre dentro de la invitación, para dejar respirar. */
export function Respiro({ foto, frase }: { foto?: string; frase?: string }) {
  if (!foto) return null;
  return (
    <section className="relative h-[52svh] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
      <img
        src={foto}
        alt=""
        width={900}
        height={1200}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {frase && (
        <>
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ background: "rgba(10,8,7,.44)" }}
          />
          <div className="relative grid h-full place-items-center px-8 text-center">
            <p
              className="display max-w-[20ch] text-[clamp(1.4rem,5vw,2.2rem)] leading-[1.35] text-white"
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

export {
  Album,
  Alojamiento,
  Capitulos,
  Cierre,
  CuentaAtras,
  DressCode,
  Galeria,
  Hashtag,
  Muro,
  Notas,
  Playlist,
  PortadaFoto,
  Regalos,
  Rsvp,
};
