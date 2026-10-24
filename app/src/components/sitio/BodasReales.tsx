import Rotulo from "@/components/sitio/Rotulo";
import { BODAS_REALES, CIFRAS, TESTIMONIOS } from "@/data/sitio";

/**
 * Prueba social, la honesta.
 *
 * Aquí NO hay testimonios inventados ni cifras redondeadas al alza. Van las
 * invitaciones reales que ya están publicadas, con su enlace: quien dude
 * puede abrirlas y verlas funcionando.
 *
 * Testimonios y cifras están preparados en `data/sitio.ts` y vacíos. Cada
 * bloque se pinta solo si tiene contenido: una sección de «lo que dicen» con
 * cero frases es peor que no tenerla.
 *
 * Composición: una lista, no tarjetas. El nombre de la pareja grande a la
 * izquierda; cuándo, dónde y qué tenía de especial, a la derecha.
 */
export default function BodasReales() {
  return (
    <section className="grano relative bg-[var(--papel)] px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[72rem]">
        <Rotulo
          sobre="No es una maqueta"
          titulo="Bodas que ya están en marcha"
          bajo="Invitaciones de parejas reales, con sus invitados confirmando dentro. Abridlas y juzgad vosotros."
        />

        {CIFRAS.length > 0 && (
          <dl className="mt-16 grid gap-8 sm:grid-cols-3">
            {CIFRAS.map((c) => (
              <div key={c.texto}>
                <dt className="display text-[clamp(2.6rem,6vw,4rem)] leading-none tabular-nums">
                  {c.valor}
                </dt>
                <dd className="mt-3 text-[1rem] leading-[1.6] opacity-70">{c.texto}</dd>
              </div>
            ))}
          </dl>
        )}

        <ul className="mt-16 border-t border-[var(--tinta)]/15">
          {BODAS_REALES.map((b) => (
            <li
              key={b.pareja}
              className="grid gap-4 border-b border-[var(--tinta)]/15 py-10 lg:grid-cols-12 lg:items-baseline lg:gap-10"
            >
              <h3 className="display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.02] lg:col-span-5">
                {b.pareja}
              </h3>
              <div className="lg:col-span-7">
                <p className="text-[1rem] text-[var(--acento)]">
                  {b.cuando}, {b.donde}
                </p>
                <p className="mt-2 max-w-[34rem] text-[1.04rem] leading-[1.7] opacity-80">
                  {b.nota}
                </p>
                {b.enlace && (
                  <a
                    href={b.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-12 items-center text-[1rem] underline decoration-[var(--tinta)]/30 underline-offset-4 hover:decoration-[var(--tinta)]"
                  >
                    Abrir la invitación de {b.pareja}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>

        {TESTIMONIOS.length > 0 && (
          <ul className="mt-20 grid gap-12 lg:grid-cols-2">
            {TESTIMONIOS.map((t) => (
              <li key={t.pareja}>
                <figure>
                  <blockquote className="display text-[clamp(1.6rem,3.4vw,2.2rem)] leading-[1.25]">
                    «{t.texto}»
                  </blockquote>
                  <figcaption className="mt-4 text-[1rem] opacity-70">
                    {t.enlace ? (
                      <a href={t.enlace} className="underline underline-offset-4">
                        {t.pareja}
                      </a>
                    ) : (
                      t.pareja
                    )}
                    , {t.boda}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
