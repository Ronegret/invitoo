import type { Metadata } from "next";
import Link from "next/link";
import Pie from "@/components/sitio/Pie";
import SelloAlianzas from "@/components/SelloAlianzas";

export const metadata: Metadata = {
  title: "¿Te ha gustado la invitación? · Invitoo",
  description:
    "Has recibido una invitación hecha por nosotros. Si te casas tú, te hacemos la tuya.",
};

/**
 * La landing de invitados.
 *
 * Es el motor de crecimiento de Invitoo, no una página más: cada invitación
 * la abren ~120 personas en edad exacta de casarse, y la firma del pie las
 * trae aquí. Por eso no se les manda a la home comercial — se les habla de lo
 * que acaban de ver. Ver docs/02-estrategia.md §5.2.
 */
export default function ParaInvitados() {
  return (
    <>
      <main className="grano relative">
        <section className="mx-auto flex min-h-[86dvh] max-w-[46rem] flex-col justify-center px-6 py-20 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG */}
          <img
            src="/marca/palabra.svg"
            alt="Invitoo"
            width={120}
            height={30}
            className="mx-auto h-[30px] w-auto"
          />
          <h1 className="display mt-12 text-[clamp(2.6rem,11vw,5rem)]">
            La invitación que acabas de abrir la hicimos nosotros.
          </h1>
          <p className="mx-auto mt-9 max-w-[32rem] text-[1.1rem] leading-relaxed opacity-75">
            Si estás pensando en la tuya, esto es lo que hacemos: elegís cómo se
            abre, nos contáis vuestra historia en una videollamada de veinte
            minutos, y os mandamos un enlace terminado. No tenéis que montar
            nada.
          </p>

          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/34653567610?text=Hola%2C%20he%20recibido%20una%20invitaci%C3%B3n%20vuestra%20y%20quiero%20una%20para%20mi%20boda"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[var(--tinta)] px-8 text-[0.85rem] uppercase tracking-[0.16em] text-[var(--papel)] sm:w-auto"
            >
              Quiero una para mi boda
            </a>
            <Link
              href="/plantillas"
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full border border-[var(--tinta)]/25 px-8 text-[0.85rem] uppercase tracking-[0.16em] sm:w-auto"
            >
              Ver las seis aperturas
            </Link>
          </div>

          <div className="mx-auto mt-16 max-w-[26rem] border-t border-[var(--tinta)]/12 pt-9">
            <SelloAlianzas size={30} className="mx-auto opacity-60" />
            <p className="mt-5 text-[0.95rem] leading-relaxed opacity-65">
              Y porque vienes de una boda nuestra:{" "}
              <strong className="font-normal text-[var(--acento)]">
                30 € de descuento
              </strong>{" "}
              en la tuya. Dinos de qué boda vienes y ya está.
            </p>
          </div>
        </section>
      </main>
      <Pie />
    </>
  );
}
