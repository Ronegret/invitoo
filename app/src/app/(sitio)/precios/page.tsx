import type { Metadata } from "next";
import Link from "next/link";
import Anadidos from "@/components/sitio/Anadidos";
import DatosEstructurados from "@/components/sitio/DatosEstructurados";
import Encabezado from "@/components/sitio/Encabezado";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import Planes from "@/components/sitio/Planes";
import Preguntas from "@/components/sitio/Preguntas";
import Rotulo from "@/components/sitio/Rotulo";
import TablaDirecto from "@/components/sitio/TablaDirecto";
import { DESCUENTO_INVITADO, DIRECTO, PLANES, PROCESO, enLetra } from "@/data/sitio";

const DESDE = Math.min(...PLANES.map((p) => p.precio));

export const metadata: Metadata = {
  title: `Precios: invitaciones de boda desde ${DESDE} €`,
  description: `${enLetra(PLANES.length, true)} planes con IVA incluido y pago único: Invitoo ${PLANES[0].precio} €, con canción ${PLANES[1].precio} € y Estudio desde ${PLANES[2].precio} €. Cambios ilimitados hasta publicarla y lista en 5 días laborables. Fotos de los invitados en directo en la TV del salón por ${DIRECTO.precio} €.`,
  alternates: { canonical: "/precios" },
};

/**
 * Los precios.
 *
 * Arriba, el número; luego los planes con lo que incluyen y lo que no; la
 * garantía; los plazos; los añadidos como una carta; y las dudas de dinero.
 * Todo sale de `data/sitio.ts`, igual que los datos estructurados.
 */
export default function Precios() {
  return (
    <>
      <DatosEstructurados tipo="negocio" />

      <Encabezado
        sobre="Lo que cuesta"
        titulo={`Desde ${DESDE} €, en un solo pago`}
        bajo="Hay plataformas a veintinueve euros donde la montáis vosotros, y estudios a seiscientos. Estamos en medio y a propósito: una persona la monta de principio a fin y vosotros no tocáis un editor."
        aparte={
          <p className="text-[1.04rem] leading-[1.7] opacity-75">
            IVA incluido. Sin suscripción, sin comisión por invitado y sin
            coste por confirmación.
          </p>
        }
      />

      <section className="bg-[var(--papel)] px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[72rem]">
          <Planes titulos="h2" />
        </div>
      </section>

      {/* ───────────── El día de la boda ───────────── */}
      <section
        id="en-directo"
        className="scroll-mt-24 border-t border-[var(--tinta)]/10 bg-[var(--papel)] px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-[72rem]">
          <Rotulo
            sobre="El día de la boda"
            titulo="Las fotos de vuestros invitados, en directo"
            bajo="Todas las invitaciones llevan su álbum. Si además queréis verlo pasar en la TV del salón mientras ocurre, es un añadido. En el Estudio va incluido."
          />
          <div className="mt-14">
            <TablaDirecto />
          </div>
          <p className="mt-10">
            <Link
              href="/en-directo"
              className="enlace-sub inline-flex min-h-12 items-center text-[1rem] underline decoration-[var(--tinta)]/30 underline-offset-4"
            >
              Cómo se ve En directo en el salón
            </Link>
          </p>
        </div>
      </section>

      {/* ───────────── Plazos ───────────── */}
      <section className="border-t border-[var(--tinta)]/10 bg-[var(--bruma)]/45 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-[72rem]">
          <Rotulo
            sobre="Plazos"
            titulo="Cinco días laborables desde la videollamada"
            bajo="Con prisa, 48 horas por 49 € más; en el Estudio va incluido. El save the date conviene mandarlo entre seis y doce meses antes, y la invitación unos tres meses antes."
          />
          <ol className="mt-14 grid gap-px border border-[var(--tinta)]/15 bg-[var(--tinta)]/15 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESO.map((p, i) => (
              <li key={p.titulo} className="bg-[var(--papel)] p-6">
                <span className="display text-[1.3rem] text-[var(--acento)] tabular-nums">
                  {i + 1}
                </span>
                <h3 className="display mt-2 text-[1.5rem] leading-tight">{p.titulo}</h3>
                <p className="mt-2 text-[1rem] leading-[1.6] opacity-75">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── Añadidos ───────────── */}
      <section className="bg-[var(--papel)] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-[72rem] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
              <span aria-hidden className="h-px w-8 bg-current" />
              Si hace falta
            </p>
            <h2 className="display mt-4 text-[clamp(2.4rem,6vw,3.8rem)] leading-[1.02]">
              Añadidos
            </h2>
            <p className="mt-6 max-w-[26rem] text-[1.04rem] leading-[1.75] opacity-75">
              Se piden con cualquier plan, antes o después. Precios con IVA.
            </p>
            <p className="mt-6 max-w-[26rem] text-[1.04rem] leading-[1.75] opacity-75">
              ¿Venís de una boda nuestra?{" "}
              <Link href="/para-invitados" className="underline decoration-[var(--tinta)]/30 underline-offset-4">
                {DESCUENTO_INVITADO} € menos en la vuestra
              </Link>
              . ¿Sois wedding planner, finca u hotel?{" "}
              <Link href="/colaboradores" className="underline decoration-[var(--tinta)]/30 underline-offset-4">
                Condiciones de colaborador
              </Link>
              .
            </p>
          </div>
          <div className="lg:col-span-8">
            <Anadidos />
          </div>
        </div>
      </section>

      {/* ───────────── Dudas de dinero ───────────── */}
      <section className="border-t border-[var(--tinta)]/10 bg-[var(--papel)] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-[72rem] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="display text-[clamp(2.4rem,6vw,3.8rem)] leading-[1.02]">
              Antes de decidir
            </h2>
            <p className="mt-6">
              <Link
                href="/preguntas"
                className="inline-flex min-h-12 items-center text-[1rem] underline decoration-[var(--tinta)]/30 underline-offset-4"
              >
                Todas las preguntas
              </Link>
            </p>
          </div>
          <div className="lg:col-span-8">
            <Preguntas de="precio" />
          </div>
        </div>
      </section>

      <LlamadaFinal
        sobre="Sin compromiso"
        titulo="Hablamos antes"
        texto="No hace falta decidir el plan hoy. Reservad veinte minutos, contadnos vuestra boda y os decimos cuál encaja. Si ninguno os sirve, os lo diremos también."
      />
    </>
  );
}
