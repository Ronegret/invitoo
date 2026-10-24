import Link from "next/link";
import MovilVivo from "@/components/sitio/MovilVivo";
import { PLANTILLAS } from "@/data/plantillas";
import { PLANES, PLANTILLA_PORTADA, enLetra } from "@/data/sitio";
import { enlaceReserva } from "@/lib/contacto";

/**
 * La portada de invitoo.es.
 *
 * Tiene un trabajo: que en ocho segundos se entienda qué recibe la pareja y
 * desde cuánto. Por eso no hay vídeo de marca ni fotografía de banco —la
 * versión anterior abría con metraje de tienda de novias—, sino lo que se
 * vende de verdad: una invitación real corriendo dentro de un móvil.
 *
 * Composición asimétrica: la letra a la izquierda, grande y alineada a su
 * margen; el móvil a la derecha, desplazado hacia abajo para que rompa la
 * línea de base. En móvil, primero la frase y los botones (lo que hay que
 * leer en el primer pantallazo) y después el teléfono.
 *
 * Es un componente de servidor. Nada aquí empieza en `opacity: 0` ni espera
 * a hidratar: sin JavaScript se lee igual. Lo único con cliente es el
 * iframe del móvil, y antes de que llegue ya se ve el póster.
 */
export default function PortadaSitio() {
  const demo =
    PLANTILLAS.find((p) => (p.id as string) === PLANTILLA_PORTADA) ?? PLANTILLAS[0];
  const desde = Math.min(...PLANES.map((p) => p.precio));
  const n = PLANTILLAS.length;

  return (
    <section className="grano relative overflow-hidden bg-[var(--papel)] px-4 pb-20 pt-28 sm:px-6 sm:pt-36 lg:pb-28">
      <div className="mx-auto grid max-w-[72rem] items-start gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7 lg:pt-6">
          <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
            <span aria-hidden className="h-px w-8 bg-current" />
            Invitaciones de boda digitales, a medida
          </p>

          <h1 className="display mt-6 text-[clamp(2.9rem,8.4vw,6.2rem)] leading-[0.96]">
            Vuestra boda empieza cuando abren la invitación.
          </h1>

          <p className="mt-8 max-w-[34rem] text-[1.12rem] leading-[1.75] opacity-80">
            Una apertura de cine con vuestros nombres, una canción compuesta
            para vosotros y las confirmaciones de cada invitado, con su menú y
            sus alergias. La montamos nosotros.{" "}
            <strong className="font-semibold">Desde {desde} €</strong>, IVA
            incluido.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/i/${demo.demo}`}
              className="boton-lleno inline-flex min-h-14 items-center justify-center rounded-full bg-[var(--tinta)] px-8 text-[1rem] text-[var(--papel)]"
            >
              Abrir una invitación de ejemplo
            </Link>
            <a
              href={enlaceReserva()}
              target="_blank"
              rel="noopener noreferrer"
              className="boton inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--tinta)]/30 px-8 text-[1rem]"
            >
              Hablamos 20 minutos
            </a>
          </div>

          <p className="mt-6 max-w-[34rem] text-[1rem] leading-[1.7] opacity-65">
            Pago único. Lista en cinco días laborables. Cambios ilimitados
            hasta que la publiquéis.{" "}
            <Link href="/plantillas" className="enlace-sub underline decoration-[var(--tinta)]/30 underline-offset-4">
              {enLetra(n, true)} aperturas para elegir
            </Link>
            .
          </p>
        </div>

        <div className="relative flex justify-center lg:col-span-5 lg:justify-end lg:pt-16">
          {/* El nombre de la plantilla, en vertical junto al móvil: dice qué
              se está viendo sin poner un rótulo encima de la invitación. */}
          <p
            aria-hidden
            className="display absolute -left-1 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[1.1rem] opacity-45 lg:block"
          >
            Plantilla {demo.nombre}
          </p>
          <MovilVivo
            slug={demo.demo}
            poster={demo.poster}
            titulo={`Invitación de ejemplo, plantilla ${demo.nombre}`}
          />
        </div>
      </div>
    </section>
  );
}
