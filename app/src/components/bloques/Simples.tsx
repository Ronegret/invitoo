import Rama from "@/components/Botanica";
import Icono from "@/components/Iconos";
import type { Bloque } from "@/lib/tipos";

/**
 * Los bloques que no necesitan JavaScript. Todos son Server Components:
 * no mandan ni un byte de cliente a la invitación.
 */

/**
 * Todo título de sección lleva su guirnalda debajo.
 *
 * La competencia mete entre 36 y 61 imágenes por invitación, casi todas
 * ornamentos florales repetidos. La densidad decorativa es la mitad de por
 * qué se ven «de boda». Aquí se consigue lo mismo con SVG de línea de 2 KB
 * que además se dibujan solos.
 */
function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h2 className="display text-center text-[clamp(2.1rem,9vw,3.1rem)]">
        {children}
      </h2>
      <Rama
        forma="guirnalda"
        ancho={170}
        className="mx-auto mt-5 text-[var(--acento)] opacity-45"
      />
    </>
  );
}

export function Historia({
  parrafos,
  fotos,
}: Extract<Bloque, { t: "historia" }>) {
  return (
    <section className="mx-auto max-w-[34rem] px-6 py-24">
      <Titulo>Cómo empezó</Titulo>
      <div className="mt-10 flex flex-col gap-6">
        {parrafos.map((p, i) => (
          <div key={i}>
            <p className="text-[1.06rem] leading-[1.75] opacity-80">{p}</p>
            {/* Una foto entre párrafos, no todas juntas al final: así el
                texto respira y se lee como un álbum, no como un muro. */}
            {fotos?.[i] && (
              /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
              <img
                src={fotos[i]}
                alt=""
                width={900}
                height={1125}
                loading="lazy"
                decoding="async"
                className="mt-8 h-64 w-full object-cover sm:h-80"
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
    <section className="px-6 py-24 text-center">
      <Icono id="percha" size={26} className="mx-auto text-[var(--acento)]" />
      <Titulo>Cómo vestir</Titulo>
      <p className="mx-auto mt-6 max-w-[26rem] text-[1.02rem] leading-relaxed opacity-75">
        {nota}
      </p>
      {paleta.length > 0 && (
        <ul className="mt-9 flex justify-center gap-3" aria-label="Colores sugeridos">
          {paleta.map((c) => (
            <li
              key={c}
              title={c}
              className="h-11 w-11 rounded-full border border-current/15"
              style={{ background: c }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function Playlist({ spotify, titulo, nota }: Extract<Bloque, { t: "playlist" }>) {
  return (
    <section className="px-6 py-24 text-center">
      <Icono id="nota" size={26} className="mx-auto text-[var(--acento)]" />
      <Titulo>{titulo ?? "El soundtrack"}</Titulo>
      <p className="mx-auto mt-6 max-w-[26rem] text-[1.02rem] leading-relaxed opacity-75">
        {nota ??
          "Hay una lista en Spotify. Si hay un tema con el que no te puedes quedar sentado, añádelo."}
      </p>
      <a
        href={spotify}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex min-h-14 items-center rounded-full border border-current/25 px-8 text-[0.8rem] uppercase tracking-[0.18em]"
      >
        Añadir mi canción
      </a>
    </section>
  );
}

export function Regalos({ iban, enlacePago, titulo, nota }: Extract<Bloque, { t: "regalos" }>) {
  return (
    <section className="px-6 py-24 text-center">
      <Icono id="regalo" size={26} className="mx-auto text-[var(--acento)]" />
      <Titulo>{titulo ?? "Un detalle especial"}</Titulo>
      <p className="mx-auto mt-6 max-w-[27rem] text-[1.02rem] leading-relaxed opacity-75">
        {nota ??
          "Con que vengáis nos sobra. Pero si os apetece tener un detalle, os dejamos esto por aquí."}
      </p>
      {iban && (
        // Seleccionable de verdad: alguien lo va a copiar al banco.
        <p className="mx-auto mt-8 max-w-[24rem] select-all break-all border-y border-current/15 py-5 font-[var(--font-texto)] text-[0.98rem] tracking-wide">
          {iban}
        </p>
      )}
      {enlacePago && (
        <a
          href={enlacePago}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex min-h-14 items-center rounded-full border border-current/25 px-8 text-[0.8rem] uppercase tracking-[0.18em]"
        >
          Hacerlo desde aquí
        </a>
      )}
    </section>
  );
}

export function Alojamiento({
  opciones,
}: Extract<Bloque, { t: "alojamiento" }>) {
  return (
    <section className="mx-auto max-w-[34rem] px-6 py-24">
      <Icono id="cama" size={26} className="mx-auto text-[var(--acento)]" />
      <Titulo>Dónde dormir</Titulo>
      <ul className="mt-10 flex flex-col">
        {opciones.map((h) => (
          <li
            key={h.nombre}
            className="flex items-baseline justify-between gap-5 border-t border-current/12 py-5"
          >
            <span>
              <span className="text-[1.05rem]">{h.nombre}</span>
              {h.nota && (
                <span className="mt-1 block text-[0.88rem] opacity-55">
                  {h.nota}
                </span>
              )}
            </span>
            {h.enlace && (
              <a
                href={h.enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[0.75rem] uppercase tracking-[0.18em] text-[var(--acento)]"
              >
                Reservar
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Album({ subidaInvitados, titulo }: Extract<Bloque, { t: "album" }>) {
  return (
    <section className="px-6 py-24 text-center">
      <Icono id="camara" size={26} className="mx-auto text-[var(--acento)]" />
      <Titulo>{titulo ?? "Comparte tus fotos"}</Titulo>
      <p className="mx-auto mt-6 max-w-[27rem] text-[1.02rem] leading-relaxed opacity-75">
        {subidaInvitados
          ? "Si haces una foto buena, súbela aquí. Así las tenemos todas en el mismo sitio y no repartidas por ochenta móviles."
          : "Aquí irán las fotos del día. Vuelve después de la boda."}
      </p>
      {subidaInvitados && (
        <p className="mt-8 inline-flex min-h-14 items-center rounded-full border border-dashed border-current/25 px-8 text-[0.78rem] uppercase tracking-[0.18em] opacity-45">
          Se activa el día de la boda
        </p>
      )}
    </section>
  );
}
