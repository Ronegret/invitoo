import Icono from "@/components/Iconos";
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

/**
 * Tips y notas: lo que los novios saben del sitio y los invitados no.
 * Que hay grava y los tacones se clavan, que en la finca no hay cobertura,
 * que el aparcamiento se llena a las doce.
 */
export function Notas({ items }: Extract<Bloque, { t: "notas" }>) {
  return (
    <section className="mx-auto max-w-[34rem] px-6 py-24">
      <Icono id="mensaje" size={26} className="mx-auto text-[var(--acento)]" />
      <Titulo>Cosas que conviene saber</Titulo>
      <ul className="mt-12 flex flex-col">
        {items.map((n) => (
          <li key={n.titulo} className="border-t border-current/12 py-6">
            <p className="text-[1.04rem]">{n.titulo}</p>
            <p className="mt-2 text-[0.96rem] leading-[1.7] opacity-65">
              {n.texto}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * El hashtag. Es lo que convierte a ciento veinte invitados en ciento
 * veinte fotógrafos, y de paso deja el rastro del día en un sitio donde los
 * novios lo pueden recuperar.
 */
export function Hashtag({ etiqueta, nota }: Extract<Bloque, { t: "hashtag" }>) {
  return (
    <section className="px-6 py-24 text-center">
      <Icono id="camara" size={26} className="mx-auto text-[var(--acento)]" />
      <Titulo>Compartid el día</Titulo>
      <p className="mx-auto mt-7 max-w-[27rem] text-[1.02rem] leading-[1.75] opacity-75">
        {nota ??
          "Si subís algo a Instagram, ponedle esta etiqueta. Así lo encontramos todo junto y no se nos pierde nada."}
      </p>
      <p className="display mt-9 text-[clamp(1.8rem,8vw,2.8rem)] text-[var(--acento)]">
        #{etiqueta}
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
  const dia = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
    new Date(fecha),
  );
  return (
    <section className="px-6 pb-8 pt-24 text-center">
      <Rama
        forma="guirnalda"
        ancho={220}
        className="mx-auto text-[var(--acento)] opacity-45"
      />
      <p className="display mt-10 text-[clamp(2.2rem,11vw,3.4rem)] leading-[1.05]">
        {a}
        <span className="italic text-[var(--acento)]"> &amp; </span>
        {b}
      </p>
      <p className="mt-5 text-[0.78rem] uppercase tracking-[0.34em] opacity-50">
        {dia}
      </p>
      <a
        href="#confirmar"
        className="mt-10 inline-flex min-h-13 items-center rounded-full border border-current/25 px-8 text-[0.76rem] uppercase tracking-[0.2em] transition-colors duration-500 hover:border-current/60"
      >
        Confirmar asistencia
      </a>
      <Rama
        forma="guirnalda"
        ancho={220}
        espejo
        className="mx-auto mt-12 text-[var(--acento)] opacity-45"
      />
    </section>
  );
}
