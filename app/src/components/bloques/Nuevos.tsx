import { Fragment } from "react";
import Titulo from "./titulo";
import Rama from "@/components/Botanica";
import type { Bloque } from "@/lib/tipos";

/**
 * Bloques que tiene la competencia y faltaban aquí.
 *
 * Salen de abrir cuatro modelos de fixdate.io con un navegador: los cuatro
 * son el mismo esqueleto con distinta piel, y en todos aparecen «Tips y
 * Notas» y un bloque de hashtag para compartir. Los dos resuelven algo real
 * y no estaban.
 */

/**
 * Tips y notas: lo que los novios saben del sitio y los invitados no.
 * Que hay grava y los tacones se clavan, que en la finca no hay cobertura,
 * que el aparcamiento se llena a las doce.
 */
export function Notas({ items }: Extract<Bloque, { t: "notas" }>) {
  // Lateral: el título en su columna y las notas en la otra. En el móvil,
  // todo a la izquierda, como una lista que se escanea.
  return (
    <section className="mx-auto max-w-[52rem] px-6 py-24">
      <div className="grid gap-10 sm:grid-cols-[0.8fr_1.2fr] sm:gap-14">
        <div>
          <Titulo alineado="izquierda">Cosas que conviene saber</Titulo>
        </div>
        <ul className="flex flex-col">
          {items.map((n) => (
            <li key={n.titulo} className="border-t border-current/15 py-6 last:border-b">
              <p className="display text-[1.5rem] leading-tight">{n.titulo}</p>
              <p className="mt-2 text-[1.0625rem] leading-[1.7] opacity-90">
                {n.texto}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * El hashtag. Es lo que convierte a ciento veinte invitados en ciento
 * veinte fotógrafos, y de paso deja el rastro del día en un sitio donde los
 * novios lo pueden recuperar.
 */
/** «OliviaYEdmundo2027» → ["Olivia", "Y", "Edmundo", "2027"]: dónde puede partirse. */
function trozosHashtag(etiqueta: string): string[] {
  return etiqueta.split(/(?<=[a-záéíóúñü])(?=[A-ZÁÉÍÓÚÑ])|(?<=\D)(?=\d)|(?<=_)/u).filter(Boolean);
}

export function Hashtag({ etiqueta, nota }: Extract<Bloque, { t: "hashtag" }>) {
  return (
    <section className="px-6 py-24 text-center">
      <Titulo>Compartid el día</Titulo>
      <p className="mx-auto mt-7 max-w-[27rem] text-[1.0625rem] leading-[1.75] opacity-85">
        {nota ??
          "Si subís algo a Instagram, ponedle esta etiqueta. Así lo encontramos todo junto y no se nos pierde nada."}
      </p>
      {/* El tamaño se ajusta a la longitud (cabe en una línea en el móvil) y,
          si aun así no cabe, se parte entre palabras (MayúsculaInicial,
          números), nunca a mitad de palabra. */}
      <p
        className="display mx-auto mt-9 max-w-full italic leading-[1.15] [overflow-wrap:break-word] text-[var(--acento-texto,var(--acento))]"
        style={{ fontSize: `clamp(1.55rem, calc(172vw / ${Math.max(8, etiqueta.length + 1)}), 3.4rem)` }}
      >
        #
        {trozosHashtag(etiqueta).map((t, i) => (
          <Fragment key={i}>
            {i > 0 && <wbr />}
            {t}
          </Fragment>
        ))}
      </p>
    </section>
  );
}

/**
 * El cierre: se repite la portada al final.
 *
 * Fixdate lo hace en sus cuatro modelos y tiene sentido. Quien llega abajo
 * ha leído toda la invitación; ahí es donde más cerca está de confirmar, y
 * donde peor queda que no haya nada.
 */
export function Cierre({
  a,
  b,
  fecha,
}: {
  a: string;
  b: string;
  fecha: string;
}) {
  const dia = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "Europe/Madrid",
  }).format(new Date(fecha));
  return (
    <section className="px-6 pb-8 pt-24 text-center">
      <Rama
        forma="guirnalda"
        ancho={220}
        className="mx-auto text-[var(--acento-texto,var(--acento))] opacity-45"
      />
      <p className="display mt-10 text-[clamp(2.2rem,11vw,3.4rem)] leading-[1.05] [overflow-wrap:anywhere] [text-wrap:balance]">
        {a}
        <span className="italic text-[var(--acento-texto,var(--acento))]"> &amp; </span>
        {b}
      </p>
      <p className="mt-5 text-[1rem] uppercase tracking-[0.28em] opacity-80">
        {dia}
      </p>
      <a
        href="#confirmar"
        className="mt-10 inline-flex min-h-14 items-center rounded-full border border-current/30 px-8 text-[1rem] uppercase tracking-[0.16em] transition-colors duration-150 hover:border-current/60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))]"
      >
        Confirmar asistencia
      </a>
      <Rama
        forma="guirnalda"
        ancho={220}
        espejo
        className="mx-auto mt-12 text-[var(--acento-texto,var(--acento))] opacity-45"
      />
    </section>
  );
}
