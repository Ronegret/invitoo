import Rama from "@/components/Botanica";
import type { Bloque } from "@/lib/tipos";

/**
 * La historia, contada por capítulos.
 *
 * Copiado —bien— de lo que Rodrigo ya hace en nico-y-gaby.invitoo.es: allí
 * la historia no es un bloque de tres párrafos, son capítulos con nombre y
 * año: «El inicio de nuestra historia», «Nuestras aventuras», «Nuestra
 * familia», «2026», «El Muelle de los Enamorados».
 *
 * La diferencia es enorme y no cuesta nada: un bloque de texto se salta,
 * una línea de tiempo se lee. Y da sitio a una foto por capítulo sin que
 * parezca un álbum pegado al final.
 *
 * Es un Server Component: cero JavaScript al cliente.
 */
export default function Capitulos({
  titulo = "Nuestra historia",
  capitulos,
}: Extract<Bloque, { t: "capitulos" }>) {
  return (
    <section className="mx-auto max-w-[36rem] px-6 py-24">
      <h2 className="display text-center text-[clamp(2.1rem,9vw,3.1rem)]">
        {titulo}
      </h2>
      <Rama
        forma="guirnalda"
        ancho={170}
        className="mx-auto mt-5 text-[var(--acento-texto,var(--acento))] opacity-45"
      />

      <ol className="mt-16 flex flex-col">
        {capitulos.map((c, i) => (
          <li key={c.titulo} className="relative pb-16 pl-10 last:pb-0">
            {/* El hilo de la línea de tiempo, con su nudo en cada capítulo. */}
            <span
              aria-hidden
              className="absolute left-[7px] top-2 bottom-0 w-px"
              style={{
                background:
                  i === capitulos.length - 1
                    ? "none"
                    : "color-mix(in srgb, var(--acento) 30%, transparent)",
              }}
            />
            <span
              aria-hidden
              className="absolute left-0 top-1.5 grid h-[15px] w-[15px] place-items-center rounded-full border"
              style={{
                borderColor: "color-mix(in srgb, var(--acento) 55%, transparent)",
              }}
            >
              <span
                className="block h-[5px] w-[5px] rounded-full"
                style={{ background: "var(--acento)" }}
              />
            </span>

            {c.cuando && (
              <p className="text-[1rem] uppercase tracking-[0.28em] text-[color-mix(in_srgb,var(--acento-texto,var(--acento))_82%,var(--tinta))]">
                {c.cuando}
              </p>
            )}
            <h3 className="display mt-2 text-[1.6rem] leading-tight">
              {c.titulo}
            </h3>
            <p className="mt-3 text-[1.0625rem] leading-[1.8] opacity-85">
              {c.texto}
            </p>
            {c.foto && (
              /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
              <img
                src={c.foto}
                alt=""
                width={900}
                height={1125}
                sizes="(min-width: 600px) 36rem, 100vw"
                loading="lazy"
                decoding="async"
                className="revela-foto mt-7 h-72 w-full object-cover sm:h-96"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
