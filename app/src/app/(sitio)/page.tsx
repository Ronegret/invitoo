import type { Metadata } from "next";
import Link from "next/link";
import BodasReales from "@/components/sitio/BodasReales";
import Cancion from "@/components/sitio/Cancion";
import DatosEstructurados from "@/components/sitio/DatosEstructurados";
import EnDirecto from "@/components/sitio/EnDirecto";
import AsiLoVive from "@/components/sitio/asi-lo-vive/AsiLoVive";
import CatalogoRejilla from "@/components/sitio/catalogo/CatalogoRejilla";
import { fichasCatalogo } from "@/components/sitio/catalogo/datos";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import Planes from "@/components/sitio/Planes";
import Preguntas from "@/components/sitio/Preguntas";
import PortadaTelefonos from "@/components/sitio/portada/PortadaTelefonos";
import Rotulo from "@/components/sitio/Rotulo";
import VuestroPanel from "@/components/sitio/VuestroPanel";
import { PLANTILLAS } from "@/data/plantillas";
import { ANADIDOS, DENTRO, DESCUENTO_INVITADO, FAMILIAS_PLANTILLA, PLANES, enLetra, euros } from "@/data/sitio";

const DESDE = Math.min(...PLANES.map((p) => p.precio));

export const metadata: Metadata = {
  title: { absolute: "Invitoo · Invitaciones de boda digitales a medida" },
  description: `Vuestra boda empieza cuando abren la invitación: apertura de cine con vuestros nombres, canción propia y confirmaciones por persona con menús y alergias. Desde ${DESDE} €, IVA incluido.`,
  alternates: { canonical: "/" },
};

/**
 * invitoo.es — la portada (v3, W2).
 *
 * El orden sigue las preguntas de una pareja, en el orden en que se las
 * hace: qué es y cuánto cuesta (portada con tres invitaciones de verdad en
 * tres teléfonos), cómo lo vive un invitado (un teléfono fijo y cuatro
 * escenas), cuál es la nuestra (el catálogo por estilos), qué tiene que no
 * tengan otros (la canción), qué trabajo nos quita (lo que lleva), cómo lo
 * seguimos (el panel), el día de la boda (En directo), la abuela, bodas
 * reales, cuánto exactamente (planes), las dudas de siempre y el cierre.
 *
 * RITMO. Ninguna sección repite la composición de la anterior: portada
 * partida; escenas con el teléfono pegado; rejilla de teléfonos; canción
 * en negativo; titular fijo y lista que corre; ventana ancha del panel;
 * noche con la TV; una frase enorme; lista de bodas; hoja de precios;
 * preguntas a dos columnas. Cambia la escala, el lado y el fondo.
 */
export default function Home() {
  const n = PLANTILLAS.length;
  const tarjetas = ANADIDOS.find((a) => a.nombre.startsWith("Tarjetas"));

  return (
    <>
      <DatosEstructurados tipo="negocio" />
      <PortadaTelefonos />

      <AsiLoVive descuento={DESCUENTO_INVITADO} />

      {/* ───────────── El catálogo ───────────── */}
      <section
        id="plantillas"
        className="relative scroll-mt-24 bg-[var(--papel)] px-4 py-24 sm:px-6 sm:py-32"
      >
        <div className="mx-auto max-w-[72rem]">
          <Rotulo
            sobre="El catálogo"
            titulo={`${enLetra(n, true)} maneras de abrirse`}
            bajo="Cada plantilla es un gesto distinto: no se abre igual una boda de campo que una de noche. Elegid por estilo, pasad el ratón para ver la apertura y tocad una para verla entera."
          />
          <div className="mt-12">
            <CatalogoRejilla fichas={fichasCatalogo()} familias={FAMILIAS_PLANTILLA} limite={8} />
          </div>
        </div>
      </section>

      <Cancion />

      {/* ───────────── Lo que lleva: titular fijo, lista que corre ───────────── */}
      <section className="grano relative bg-[var(--papel)] px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto grid max-w-[72rem] gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
                <span aria-hidden className="h-px w-8 bg-current" />
                Os quitamos el trabajo
              </p>
              <h2 className="display mt-4 text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.02]">
                Vosotros lo contáis una vez. Lo demás llega solo.
              </h2>
              <p className="mt-8 max-w-[30rem] text-[1.06rem] leading-[1.8] opacity-75">
                {enLetra(DENTRO.length, true)} cosas que, si no están en la
                invitación, acaban en un grupo de ochenta personas preguntando a
                qué hora es la ceremonia. Las confirmaciones, los menús y los
                autobuses os llegan en un Excel listo para el catering.
              </p>
              <p className="mt-8">
                <Link
                  href="/servicios"
                  className="enlace-sub inline-flex min-h-12 items-center text-[1rem] underline decoration-[var(--tinta)]/30 underline-offset-4"
                >
                  Cómo trabajamos, paso a paso
                </Link>
              </p>
            </div>
          </div>

          <dl className="grid border-t border-[var(--tinta)]/15 sm:grid-cols-2 sm:gap-x-10 lg:col-span-7">
            {DENTRO.map((d) => (
              <div key={d.titulo} className="border-b border-[var(--tinta)]/15 py-6">
                <dt className="display text-[1.5rem] leading-tight">
                  {d.titulo}
                  {d.plan && (
                    <span className="ml-2 align-middle font-[family-name:var(--texto)] text-[0.95rem] text-[var(--acento)]">
                      {d.plan}
                    </span>
                  )}
                </dt>
                <dd className="mt-2 text-[1rem] leading-[1.65] opacity-75">{d.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <VuestroPanel />

      <EnDirecto />

      {/* ───────────── Nadie se queda fuera: una frase, a escala ───────────── */}
      <section className="relative overflow-hidden bg-[var(--papel)] px-4 py-28 sm:px-6 sm:py-40">
        <div className="mx-auto max-w-[72rem]">
          <div className="lg:ml-[25%]">
            <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
              <span aria-hidden className="h-px w-8 bg-current" />
              Nadie se queda fuera
            </p>
            <h2 className="display mt-5 text-[clamp(3rem,10vw,7.4rem)] leading-[0.94]">
              La abuela la abre sin ayuda.
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-12">
              <p className="text-[1.06rem] leading-[1.8] opacity-75">
                Un enlace que se toca y se abre. Sin instalar nada ni
                registrarse. Letra grande, botones grandes y la dirección
                copiable para el GPS.
              </p>
              {tarjetas && (
                <p className="text-[1.06rem] leading-[1.8] opacity-75">
                  Y para quien prefiere papel, tarjetas impresas con un QR que
                  abre la misma invitación, desde {euros(tarjetas.precio)} € la
                  unidad.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <BodasReales />

      {/* ───────────── Precios ───────────── */}
      <section
        id="precios"
        className="relative scroll-mt-24 border-t border-[var(--tinta)]/10 bg-[var(--bruma)]/45 px-4 py-24 sm:px-6 sm:py-32"
      >
        <div className="mx-auto max-w-[72rem]">
          <Rotulo
            sobre="Lo que cuesta"
            titulo={`${enLetra(PLANES.length, true)} planes. Un solo pago.`}
            bajo="Sin suscripción, sin comisión por invitado y sin coste por confirmación. Lo que pone es lo que se paga, con el IVA dentro."
          />
          <div className="mt-14">
            <Planes />
          </div>
          <p className="mt-12">
            <Link
              href="/precios"
              className="enlace-sub inline-flex min-h-12 items-center text-[1rem] underline decoration-[var(--tinta)]/30 underline-offset-4"
            >
              Los añadidos, los plazos y la letra pequeña
            </Link>
          </p>
        </div>
      </section>

      {/* ───────────── Las dudas de siempre ───────────── */}
      <section className="relative bg-[var(--papel)] px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto grid max-w-[72rem] gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
              <span aria-hidden className="h-px w-8 bg-current" />
              Antes de decidir
            </p>
            <h2 className="display mt-4 text-[clamp(2.2rem,5.4vw,3.6rem)] leading-[1.04]">
              Lo que nos preguntan siempre
            </h2>
            <p className="mt-6">
              <Link href="/preguntas" className="enlace-sub inline-flex min-h-12 items-center text-[1rem] underline decoration-[var(--tinta)]/30 underline-offset-4">
                Todas las preguntas
              </Link>
            </p>
          </div>
          <div className="lg:col-span-8">
            <Preguntas de={["invitados", "producto", "precio"]} max={6} />
          </div>
        </div>
      </section>

      <LlamadaFinal />
    </>
  );
}
