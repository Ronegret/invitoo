import type { Metadata } from "next";
import Link from "next/link";
import Cancion from "@/components/sitio/Cancion";
import Encabezado from "@/components/sitio/Encabezado";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import Preguntas from "@/components/sitio/Preguntas";
import Revelar from "@/components/Revelar";
import Rotulo from "@/components/sitio/Rotulo";
import { ListaPanel } from "@/components/sitio/VuestroPanel";
import { DENTRO, DIRECTO, DIRECTO_PASOS, DIRECTO_PRIVACIDAD, ENTRADA_PANEL, PROCESO, enLetra } from "@/data/sitio";

export const metadata: Metadata = {
  title: "Qué hacemos y cómo trabajamos",
  description: `Qué lleva una invitación de Invitoo y cómo se hace: nos contáis vuestra boda una vez, por vídeo, y en cinco días laborables tenéis el enlace. ${enLetra(DENTRO.length, true)} cosas resueltas, sin tocar un editor. Y el día de la boda, las fotos de los invitados en directo en la TV del salón.`,
  alternates: { canonical: "/servicios" },
};

/**
 * Los servicios: qué lleva dentro, cómo se hace y qué tenéis que hacer
 * vosotros (contarlo una vez). Lo tercero es lo que vende: la competencia
 * entera vende editores, y si no se dice claro parece lo mismo pero más
 * caro.
 */
export default function Servicios() {
  return (
    <>
      <Encabezado
        sobre="Qué hacemos"
        titulo="Vosotros lo contáis, nosotros lo montamos"
        bajo="No os damos un editor: os damos una invitación terminada. Nos contáis vuestra boda una vez, por vídeo, y unos días después os llega el enlace."
      />

      {/* ───────────── Lo que lleva ───────────── */}
      <section className="bg-[var(--papel)] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-[72rem]">
          <Rotulo
            sobre="Por dentro"
            titulo={`${enLetra(DENTRO.length, true)} cosas resueltas`}
            bajo="Todo lo que, si no está en la invitación, acaba en un grupo de WhatsApp de ochenta personas preguntando a qué hora es la ceremonia."
          />
          <dl className="mt-14 grid border-t border-[var(--tinta)]/15 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
            {DENTRO.map((d) => (
              <div key={d.titulo} className="border-b border-[var(--tinta)]/15 py-6">
                <dt className="display text-[1.5rem] leading-tight">{d.titulo}</dt>
                {d.plan && (
                  <dd className="mt-1 text-[1rem] text-[var(--acento)]">Plan {d.plan}</dd>
                )}
                <dd className="mt-2 text-[1rem] leading-[1.65] opacity-75">{d.texto}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 max-w-[40rem] text-[1rem] leading-[1.7] opacity-70">
            No todas las bodas necesitan todo: una de treinta personas no
            necesita autobús.{" "}
            <Link href="/plantillas" className="underline decoration-[var(--tinta)]/30 underline-offset-4">
              Cada plantilla ordena las secciones a su manera
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ───────────── El proceso ───────────── */}
      <section
        id="proceso"
        className="scroll-mt-24 border-t border-[var(--tinta)]/10 bg-[var(--bruma)]/45 px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto grid max-w-[72rem] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Rotulo
                sobre="El proceso"
                titulo="Cómo va"
              />
              <p className="mt-6 max-w-[28rem] text-[1.06rem] leading-[1.8] opacity-75">
                De la videollamada al enlace terminado, cinco días laborables.
                Cambios ilimitados hasta que la publiquéis.
              </p>
            </div>
          </div>
          <ol className="lg:col-span-7">
            {PROCESO.map((p, i) => (
              <li
                key={p.titulo}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[var(--tinta)]/15 py-8 first:pt-0"
              >
                <span className="display text-[2rem] leading-none text-[var(--acento)] tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <h3 className="display text-[1.9rem] leading-tight">{p.titulo}</h3>
                  <p className="mt-2 max-w-[32rem] text-[1.04rem] leading-[1.7] opacity-75">
                    {p.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── Vuestro panel ───────────── */}
      <section
        id="panel"
        className="scroll-mt-24 border-t border-[var(--tinta)]/10 bg-[var(--papel)] px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-[72rem]">
          <Rotulo
            sobre="Después de publicarla"
            titulo="Vuestro panel"
            bajo="Lo que necesitáis mientras llegan las respuestas, y nada más: no os pedimos que hagáis de wedding planner, así que no hay mesas ni horarios que mantener."
          />
          <p className="mt-6 max-w-[38rem] text-[1rem] leading-[1.7] opacity-70">{ENTRADA_PANEL}</p>
          <ListaPanel className="mt-12" />
        </div>
      </section>

      {/* ───────────── El día de la boda, en directo ───────────── */}
      <section
        id="en-directo"
        className="scroll-mt-24 border-t border-[var(--tinta)]/10 bg-[var(--papel)] px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto grid max-w-[72rem] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Rotulo sobre="El día de la boda" titulo="En directo" />
              <p className="mt-6 max-w-[28rem] text-[1.06rem] leading-[1.8] opacity-75">
                Un QR en cada mesa. Los invitados suben fotos, vídeos y
                mensajes desde su móvil, sin app ni registro, y todo va
                saliendo en la TV del salón con fundidos lentos. Al día
                siguiente os lo descargáis entero.
              </p>
              <p className="mt-6 text-[1rem] opacity-60">
                {DIRECTO.precio} € · {DIRECTO.precioGestionado} € gestionado · incluido en Estudio
              </p>
              <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
                <Link
                  href="/precios#en-directo"
                  className="enlace-sub inline-flex min-h-12 items-center text-[1rem] underline decoration-[var(--tinta)]/30 underline-offset-4"
                >
                  Qué incluye cada opción
                </Link>
                <Link
                  href="/preguntas#el-dia-de-la-boda"
                  className="enlace-sub inline-flex min-h-12 items-center text-[1rem] underline decoration-[var(--tinta)]/30 underline-offset-4"
                >
                  Privacidad, wifi y menores
                </Link>
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ol>
              {DIRECTO_PASOS.map((p, i) => (
                <Revelar
                  as="li"
                  key={p.titulo}
                  retraso={i * 80}
                  className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[var(--tinta)]/15 py-8 first:pt-0"
                >
                  <span className="display text-[2rem] leading-none text-[var(--acento)] tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="display text-[1.9rem] leading-tight">{p.titulo}</h3>
                    <p className="mt-2 max-w-[32rem] text-[1.04rem] leading-[1.7] opacity-75">
                      {p.texto}
                    </p>
                  </div>
                </Revelar>
              ))}
            </ol>

            {/* Lo que hace falta en el local: la pregunta del maître. */}
            <div className="mt-12 bg-[var(--bruma)]/45 p-7 sm:p-9">
              <h3 className="display text-[1.7rem] leading-tight">Qué hace falta en el salón</h3>
              <p className="mt-3 text-[1.1rem] leading-[1.6]">{DIRECTO.local}.</p>
              <p className="mt-3 max-w-[34rem] text-[1rem] leading-[1.7] opacity-70">
                La pantalla es una página web a pantalla completa con su clave:
                se abre y empieza. Los invitados suben con sus propios datos,
                así que el wifi del salón ayuda pero no es imprescindible. Con
                el Gestionado lo configuramos y lo probamos antes con el local;
                si no hay TV, el alquiler se presupuesta aparte.
              </p>
            </div>

            <dl className="mt-12 grid gap-px border border-[var(--tinta)]/15 bg-[var(--tinta)]/15 sm:grid-cols-3">
              {DIRECTO_PRIVACIDAD.map((p) => (
                <div key={p.titulo} className="bg-[var(--papel)] p-6">
                  <dt className="display text-[1.4rem] leading-tight">{p.titulo}</dt>
                  <dd className="mt-2 text-[1rem] leading-[1.6] opacity-70">{p.texto}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <Cancion />

      {/* ───────────── Dudas ───────────── */}
      <section className="bg-[var(--papel)] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-[72rem] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="display text-[clamp(2.4rem,6vw,3.8rem)] leading-[1.02]">
              Lo que se pregunta siempre
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
            <Preguntas de={["producto", "invitados", "directo"]} />
          </div>
        </div>
      </section>

      <LlamadaFinal
        sobre="El primer paso"
        titulo="Contádnoslo"
        texto="Veinte minutos por vídeo, sin presupuesto por delante y sin compromiso. Nos contáis cómo es vuestra boda y os decimos qué haríamos con ella."
      />
    </>
  );
}
