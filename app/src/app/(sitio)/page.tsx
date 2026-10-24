import type { Metadata } from "next";
import Link from "next/link";
import BodasReales from "@/components/sitio/BodasReales";
import Cancion from "@/components/sitio/Cancion";
import DatosEstructurados from "@/components/sitio/DatosEstructurados";
import EnDirecto from "@/components/sitio/EnDirecto";
import CatalogoVivo from "@/components/sitio/catalogo/CatalogoVivo";
import { fichasCatalogo } from "@/components/sitio/catalogo/datos";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import MomentoWhatsApp from "@/components/sitio/MomentoWhatsApp";
import Planes from "@/components/sitio/Planes";
import PortadaSobre from "@/components/sitio/portada/PortadaSobre";
import Rotulo from "@/components/sitio/Rotulo";
import VuestroPanel from "@/components/sitio/VuestroPanel";
import { PLANTILLAS } from "@/data/plantillas";
import { ANADIDOS, DENTRO, PLANES, enLetra, euros } from "@/data/sitio";

const DESDE = Math.min(...PLANES.map((p) => p.precio));

export const metadata: Metadata = {
  title: { absolute: "Invitoo · Invitaciones de boda digitales a medida" },
  description: `Vuestra boda empieza cuando abren la invitación: apertura de cine con vuestros nombres, canción propia y confirmaciones por persona con menús y alergias. Desde ${DESDE} €, IVA incluido.`,
  alternates: { canonical: "/" },
};

/**
 * invitoo.es — la portada.
 *
 * El orden responde a las cuatro preguntas de una pareja, en el orden en
 * que se las hace: qué es y cuánto cuesta (portada), cómo son (catálogo),
 * qué tiene que no tengan otros (canción), qué trabajo me quita (lo que
 * lleva), funciona de verdad (bodas reales) y cuánto exactamente (planes).
 *
 * RITMO. Ninguna sección repite la composición de la anterior: portada
 * partida con el móvil a la derecha; catálogo en rejilla a contratiempo;
 * canción en negativo a sangre; lo que lleva con el titular fijo a la
 * izquierda y la lista corriendo a la derecha; el chat con el móvil a la
 * izquierda; el panel de los novios como una ventana ancha; el día de la
 * boda en negativo, de noche, con la TV en medio; una frase enorme
 * desplazada a la derecha; bodas reales como
 * lista; precios como una hoja de tres columnas. Cambia la escala, cambia
 * el lado, cambia el fondo.
 *
 * Fuera las fotografías de banco que separaban secciones: no eran nuestras
 * y se notaba.
 */
export default function Home() {
  const n = PLANTILLAS.length;
  const tarjetas = ANADIDOS.find((a) => a.nombre.startsWith("Tarjetas"));

  return (
    <>
      <DatosEstructurados tipo="negocio" />
      <PortadaSobre />

      {/* ───────────── El catálogo ───────────── */}
      <section
        id="plantillas"
        className="relative scroll-mt-24 border-t border-[var(--tinta)]/10 bg-[var(--papel)] px-4 py-24 sm:px-6 sm:py-32"
      >
        <div className="mx-auto max-w-[72rem]">
          <Rotulo
            sobre="El catálogo"
            titulo={`${enLetra(n, true)} maneras de abrirse`}
            bajo="Cada plantilla es un gesto distinto: no se abre igual una boda de campo que una de noche. Ya llevan los nombres que escribisteis arriba. Pasadlas con el dedo y tocad una para abrirla entera."
          />
          <div className="mt-10">
            <CatalogoVivo fichas={fichasCatalogo()} titulo={`Las ${n} plantillas`} />
          </div>
          <p className="mt-10 text-center">
            <Link
              href="/plantillas"
              className="boton inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--tinta)]/30 px-8 text-[1rem]"
            >
              Ver las {n} con sus colores
            </Link>
          </p>
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

      <MomentoWhatsApp />

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

      <LlamadaFinal />
    </>
  );
}
