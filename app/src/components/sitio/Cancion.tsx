import Link from "next/link";
import Reproductor from "@/components/sitio/Reproductor";
import { PLANES } from "@/data/sitio";

/**
 * La canción, en primer plano.
 *
 * Era una línea en una lista de quince. Es lo único que no tiene nadie más
 * en España, así que tiene su propia sección, en tinta —el único bloque
 * oscuro de la home antes del cierre—, con la canción sonando aquí mismo.
 * Se oye antes de leer el precio.
 *
 * Composición: la frase enorme a la izquierda, ocupando dos tercios; el
 * reproductor a la derecha, más bajo, como un pie de foto.
 */
export default function Cancion() {
  const plan = PLANES.find((p) => p.id === "cancion");

  return (
    <section
      data-cursor-tema="oscuro"
      id="cancion"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--tinta)] px-4 py-24 text-[var(--papel)] sm:px-6 sm:py-32"
    >
      <div className="mx-auto grid max-w-[72rem] gap-14 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="flex items-center gap-3 text-[1rem] opacity-70">
            <span aria-hidden className="h-px w-8 bg-current" />
            Lo que no tiene nadie más
          </p>
          <h2 className="display mt-5 text-[clamp(2.6rem,7.6vw,5.4rem)] leading-[1]">
            Una canción que no existía antes de vuestra boda.
          </h2>
          <p className="mt-8 max-w-[36rem] text-[1.08rem] leading-[1.8] opacity-75">
            La compone Dedícalo con vuestra historia dentro. Suena en la
            invitación cuando el invitado le da al sonido, y os la quedáis en
            alta calidad para que suene en la ceremonia.
          </p>
        </div>

        <div className="lg:col-span-5">
          <div className="border-t border-[var(--papel)]/20 pt-8">
            <Reproductor
              src="/musica/demo.m4a"
              titulo="Una canción de muestra de Dedícalo"
              duracion={100}
            />
          </div>
          {plan && (
            <p className="mt-8 text-[1rem] leading-[1.7] opacity-70">
              Va en el plan {plan.nombre}, {plan.precio} € con IVA.{" "}
              <Link
                href="/precios"
                className="underline decoration-[var(--papel)]/40 underline-offset-4 hover:decoration-[var(--papel)]"
              >
                Ver qué más incluye
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
