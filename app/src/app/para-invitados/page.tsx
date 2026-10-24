import type { Metadata } from "next";
import Link from "next/link";
import Pie from "@/components/sitio/Pie";
import SelloAlianzas from "@/components/SelloAlianzas";
import { ANADIDOS, DESCUENTO_INVITADO, PLANES, PLANTILLA_PORTADA, euros } from "@/data/sitio";
import { PLANTILLAS } from "@/data/plantillas";
import { MENSAJE_INVITADO, enlaceWhatsApp } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "¿Os casáis vosotros? · Invitoo",
  description: `Habéis recibido una invitación hecha por Invitoo. Si os casáis, os hacemos la vuestra con ${DESCUENTO_INVITADO} € de descuento.`,
  alternates: { canonical: "/para-invitados" },
};

/**
 * La landing de invitados.
 *
 * Es el motor de crecimiento, no una página más: cada invitación la abren
 * ~120 personas, muchas en edad de casarse, y la firma del pie («Diseñado
 * por Invitoo») las trae aquí. No se les manda a la home comercial: se les
 * habla de lo que acaban de ver, se les da su descuento y se les ofrece el
 * primer paso pequeño, que es el save the date.
 *
 * El descuento es el del brief: 20 € con el código de la invitación de la
 * que vienen, que es el nombre que aparece en su enlace.
 */
export default function ParaInvitados() {
  const desde = Math.min(...PLANES.map((p) => p.precio));
  const std = ANADIDOS.find((a) => a.nombre.startsWith("Save the date"));
  const demo =
    PLANTILLAS.find((p) => (p.id as string) === PLANTILLA_PORTADA) ?? PLANTILLAS[0];

  return (
    <>
      <main className="grano relative bg-[var(--papel)]">
        <section className="mx-auto max-w-[72rem] px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
          <Link href="/" aria-label="Invitoo, ir a la portada" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG */}
            <img
              src="/marca/palabra.svg"
              alt="Invitoo"
              width={120}
              height={30}
              className="h-[30px] w-auto"
            />
          </Link>

          <div className="mt-16 grid gap-12 sm:mt-24 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
                <span aria-hidden className="h-px w-8 bg-current" />
                Para quien viene de una boda nuestra
              </p>
              <h1 className="display mt-5 text-[clamp(2.8rem,9vw,6rem)] leading-[0.98]">
                La invitación que acabáis de abrir la hicimos nosotros.
              </h1>
              <p className="mt-8 max-w-[36rem] text-[1.12rem] leading-[1.75] opacity-80">
                Si os casáis vosotros, os hacemos la vuestra: con su apertura,
                vuestros nombres y las confirmaciones de cada invitado. Nos lo
                contáis en una videollamada de veinte minutos y os mandamos el
                enlace terminado. Desde {desde} €.
              </p>
            </div>
          </div>
        </section>

        {/* ───────────── El descuento ───────────── */}
        <section className="bg-[var(--tinta)] px-4 py-20 text-[var(--papel)] sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-[72rem] gap-10 lg:grid-cols-12 lg:items-center">
            <div className="flex items-baseline gap-3 lg:col-span-5">
              <span className="display text-[clamp(5rem,16vw,9rem)] leading-none tabular-nums">
                {DESCUENTO_INVITADO}
              </span>
              <span className="display text-[2.4rem]">€ menos</span>
            </div>
            <div className="lg:col-span-7">
              <p className="text-[1.12rem] leading-[1.75] opacity-85">
                En vuestra invitación, por venir de una boda nuestra. El código
                es el nombre de la boda que aparece en su enlace: si os llegó{" "}
                <span className="whitespace-nowrap">invitoo.es/i/ana-y-luis</span>,
                el código es <strong className="font-semibold">ana-y-luis</strong>.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={enlaceWhatsApp(MENSAJE_INVITADO)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-[var(--papel)] px-8 text-[1rem] text-[var(--tinta)] transition-transform duration-200 ease-out hover:scale-[1.02]"
                >
                  Pedir el descuento por WhatsApp
                </a>
                <Link
                  href="/precios"
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--papel)]/35 px-8 text-[1rem] transition-colors duration-200 hover:border-[var(--papel)]"
                >
                  Ver los precios
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── El primer paso: el save the date ───────────── */}
        {std && (
          <section className="px-4 py-20 sm:px-6 sm:py-28">
            <div className="mx-auto grid max-w-[72rem] gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h2 className="display text-[clamp(2.4rem,6vw,4rem)] leading-[1.02]">
                  ¿Aún queda mucho? Empezad por el save the date.
                </h2>
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <p className="text-[1.08rem] leading-[1.8] opacity-80">
                  Un vídeo vertical con vuestros nombres y la fecha, para
                  mandarlo por WhatsApp o subirlo a Instagram entre seis y doce
                  meses antes. {euros(std.precio)} €, o {std.conInvitacion ?? std.precio} € si después hacéis
                  la invitación con nosotros. Va incluido en el plan con
                  canción.
                </p>
                <p className="mt-6 text-[1.08rem] leading-[1.8] opacity-80">
                  Y cuando llegue el momento, la invitación entera. Podéis
                  abrir una de ejemplo para verla con calma, o mirar el resto
                  de plantillas.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/i/${demo.demo}`}
                    className="boton-lleno inline-flex min-h-14 items-center justify-center rounded-full bg-[var(--tinta)] px-8 text-[1rem] text-[var(--papel)]"
                  >
                    Abrir una invitación de ejemplo
                  </Link>
                  <Link
                    href="/plantillas"
                    className="boton inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--tinta)]/30 px-8 text-[1rem]"
                  >
                    Ver las {PLANTILLAS.length} plantillas
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="flex justify-center pb-16">
          <SelloAlianzas size={40} className="text-[var(--oro)]" />
        </div>
      </main>
      <Pie />
    </>
  );
}
