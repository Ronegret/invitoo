import type { Metadata } from "next";
import Link from "next/link";
import Rama from "@/components/Botanica";
import Revelar from "@/components/Revelar";
import Corte from "@/components/sitio/Corte";
import Encabezado from "@/components/sitio/Encabezado";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import Preguntas from "@/components/sitio/Preguntas";
import Rotulo from "@/components/sitio/Rotulo";
import { PROCESO } from "@/data/plantillas";
import { DENTRO } from "@/data/sitio";

export const metadata: Metadata = {
  title: "Qué hacemos · Invitoo",
  description:
    "Qué lleva dentro una invitación de Invitoo, cómo trabajamos y qué tenéis que hacer vosotros: contárnoslo una vez. Quince cosas resueltas y un enlace terminado en cinco días.",
};

/**
 * Los servicios.
 *
 * Responde a una sola pregunta —«¿qué me estáis vendiendo exactamente?»— y
 * la responde en tres tramos: qué lleva dentro, cómo se hace, y qué tenéis
 * que hacer vosotros (nada).
 *
 * El tercero es el que vende. La competencia entera vende editores: te dan
 * una herramienta y el trabajo es tuyo. Esto es lo contrario, y si no se
 * dice claro parece lo mismo pero más caro.
 */
export default function Servicios() {
  return (
    <>
      <Encabezado
        sobre="Qué hacemos"
        titulo="Vosotros lo contáis, nosotros lo montamos"
        bajo="No os damos un editor: os damos una invitación terminada. Nos contáis vuestra boda una vez, por vídeo, y unos días después os llega el enlace."
        foto="/fotos/sitio/corte-2.avif"
      />

      {/* ---------------- Las quince cosas ---------------- */}
      <section className="grano relative bg-[var(--papel)] px-5 py-28 sm:py-32">
        <div className="mx-auto max-w-[62rem]">
          <Revelar>
            <Rotulo
              sobre="Por dentro"
              titulo="Quince cosas resueltas"
              bajo="Todo lo que, si no está en la invitación, acaba en un grupo de WhatsApp de ochenta personas preguntando a qué hora es la misa."
            />
          </Revelar>

          <dl className="mt-16 grid gap-x-14 gap-y-10 sm:grid-cols-2">
            {DENTRO.map((d, i) => (
              <Revelar key={d.titulo} retraso={(i % 2) * 90}>
                <div className="flex gap-5">
                  <span className="mt-1 shrink-0 text-[var(--verde)]">
                    <Rama forma="brote" ancho={22} retraso={i * 40} />
                  </span>
                  <div>
                    <dt className="display text-[1.35rem]">{d.titulo}</dt>
                    <dd className="mt-2 text-[0.96rem] leading-[1.7] opacity-65">
                      {d.texto}
                    </dd>
                  </div>
                </div>
              </Revelar>
            ))}
          </dl>

          <Revelar>
            <p className="mt-16 text-center text-[0.9rem] opacity-55">
              No todas las plantillas llevan las quince: una boda de treinta
              personas no necesita hashtag.{" "}
              <Link href="/plantillas" className="enlace-sub">
                Cada plantilla decide cuáles
              </Link>
              .
            </p>
          </Revelar>
        </div>
      </section>

      <Corte
        foto="/fotos/sitio/corte-3.avif"
        frase="Vosotros no tocáis ningún editor. Contádnoslo una vez y ya está."
        pie="Cómo trabajamos"
        alto="58svh"
      />

      {/* ---------------- El proceso ---------------- */}
      <section
        id="proceso"
        className="grano relative scroll-mt-24 bg-[var(--bruma)]/55 px-5 py-28 sm:py-32"
      >
        <div className="mx-auto max-w-[44rem]">
          <Revelar>
            <Rotulo
              sobre="El proceso"
              titulo="Cómo va"
              bajo="De la videollamada al enlace terminado, entre cinco y siete días."
            />
          </Revelar>

          <ol className="mt-16 flex flex-col gap-14">
            {PROCESO.map((p, i) => (
              <Revelar as="li" key={p.n} retraso={i * 90}>
                <div className="text-center">
                  <span className="display block text-[2.6rem] leading-none text-[var(--acento)] opacity-80">
                    {String(p.n).padStart(2, "0")}
                  </span>
                  <h3 className="display mt-4 text-[1.9rem]">{p.titulo}</h3>
                  <p className="mx-auto mt-3 max-w-[30rem] text-[1rem] leading-[1.8] opacity-70">
                    {p.texto}
                  </p>
                  {i < PROCESO.length - 1 && (
                    <Rama
                      forma="espiga"
                      ancho={20}
                      retraso={i * 90 + 200}
                      className="mx-auto mt-10 text-[var(--verde)] opacity-60"
                    />
                  )}
                </div>
              </Revelar>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- La canción ---------------- */}
      <section className="grano relative bg-[var(--papel)] px-5 py-28 sm:py-32">
        <div className="mx-auto max-w-[40rem] text-center">
          <Revelar>
            <Rotulo
              sobre="Lo que no tiene nadie más"
              titulo="Una canción vuestra"
            />
          </Revelar>
          <Revelar retraso={120}>
            <div className="mt-12 flex flex-col gap-6 text-[1.04rem] leading-[1.88] opacity-78">
              <p>
                Una canción original, compuesta para vuestra boda y con
                vuestra historia dentro, por Dedícalo. Suena cuando alguien
                abre la invitación —si quiere: siempre se pregunta antes— y os
                la lleváis en archivo para ponerla el día de la ceremonia.
              </p>
              <p className="display text-[clamp(1.4rem,4.2vw,1.9rem)] leading-[1.45] opacity-100">
                No la tiene ninguna otra plataforma de invitaciones en España.
              </p>
              <p>
                Va incluida desde el plan Esencial. En Premium son dos: una
                para la invitación y otra para el día.
              </p>
            </div>
          </Revelar>
          <Revelar retraso={200}>
            <p className="mt-12">
              <Link
                href="/precios"
                className="boton-lleno inline-flex min-h-14 items-center justify-center rounded-full px-10 text-[0.78rem] uppercase tracking-[0.18em]"
                style={{ background: "var(--tinta)", color: "var(--papel)" }}
              >
                Ver los precios
              </Link>
            </p>
          </Revelar>
        </div>
      </section>

      {/* ---------------- Dudas de producto ---------------- */}
      <section className="grano relative bg-[var(--bruma)]/55 px-5 py-28 sm:py-32">
        <div className="mx-auto max-w-[46rem]">
          <Revelar>
            <Rotulo sobre="Lo que se pregunta siempre" titulo="Dudas" />
          </Revelar>
          <div className="mt-14">
            <Preguntas de="producto" />
          </div>
          <Revelar>
            <p className="mt-12 text-center text-[0.9rem] opacity-55">
              <Link href="/preguntas" className="enlace-sub">
                Todas las preguntas
              </Link>
            </p>
          </Revelar>
        </div>
      </section>

      <LlamadaFinal
        sobre="El primer paso"
        titulo="Contádnoslo"
        texto="Veinte minutos por Meet, sin presupuesto por delante y sin compromiso. Nos contáis cómo es vuestra boda y os decimos qué haríamos con ella."
      />
    </>
  );
}
