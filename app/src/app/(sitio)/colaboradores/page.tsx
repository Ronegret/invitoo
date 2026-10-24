import type { Metadata } from "next";
import Encabezado from "@/components/sitio/Encabezado";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import Rotulo from "@/components/sitio/Rotulo";
import { COLABORADORES } from "@/data/sitio";
import { MENSAJE_COLABORADOR, enlaceReserva, enlaceWhatsApp } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "Para wedding planners, fincas y hoteles",
  description:
    "Invitaciones de boda digitales para vuestras parejas: panel multiboda, exportación para catering y transporte, marca blanca o sello discreto y condiciones de colaborador bajo petición.",
  alternates: { canonical: "/colaboradores" },
};

/**
 * Colaboradores: wedding planners, fincas y hoteles.
 *
 * Al planner no le importa la estética, le importan los datos: listas
 * limpias y a tiempo, que la invitación no le haga sombra, margen y
 * respuesta rápida (docs/06-plan-de-mejora.md §8.4). La página habla de eso
 * y en ese orden. Las condiciones económicas no se publican: se piden.
 */
export default function Colaboradores() {
  const whatsapp = enlaceWhatsApp(MENSAJE_COLABORADOR);

  return (
    <>
      <Encabezado
        sobre="Colaboradores"
        titulo="Vuestras bodas, con la lista resuelta"
        bajo="Para wedding planners, fincas y hoteles. Vuestras parejas reciben una invitación que emociona; vosotros, los datos limpios y a tiempo, sin perseguir a nadie por WhatsApp."
        aparte={
          <div className="flex flex-col gap-3">
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-lleno inline-flex min-h-14 items-center justify-center rounded-full bg-[var(--tinta)] px-8 text-[1rem] text-[var(--papel)]"
            >
              Escribidnos por WhatsApp
            </a>
            <a
              href={enlaceReserva(MENSAJE_COLABORADOR)}
              target="_blank"
              rel="noopener noreferrer"
              className="boton inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--tinta)]/30 px-8 text-[1rem]"
            >
              Hablamos 20 minutos
            </a>
          </div>
        }
      />

      {/* ───────────── Para quién ───────────── */}
      <section className="bg-[var(--papel)] px-4 py-20 sm:px-6 sm:py-28">
        <ul className="mx-auto grid max-w-[72rem] gap-px border border-[var(--tinta)]/15 bg-[var(--tinta)]/15 lg:grid-cols-3">
          {COLABORADORES.quien.map((q) => (
            <li key={q.titulo} className="bg-[var(--papel)] p-7 sm:p-10">
              <h2 className="display text-[clamp(1.9rem,3.6vw,2.6rem)] leading-[1.05]">
                {q.titulo}
              </h2>
              <p className="mt-4 text-[1.04rem] leading-[1.75] opacity-75">{q.texto}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── Qué os damos ───────────── */}
      <section className="border-t border-[var(--tinta)]/10 bg-[var(--bruma)]/45 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-[72rem]">
          <Rotulo
            sobre="Lo que os damos"
            titulo="Menos llamadas, más tiempo para la boda"
            bajo="Lo que pide quien organiza bodas: datos limpios y exportables, una invitación que no le haga sombra, margen y respuesta rápida."
          />
          <dl className="mt-14 grid border-t border-[var(--tinta)]/15 sm:grid-cols-2 sm:gap-x-12">
            {COLABORADORES.que.map((c) => (
              <div key={c.titulo} className="border-b border-[var(--tinta)]/15 py-8">
                <dt className="display text-[1.7rem] leading-tight">{c.titulo}</dt>
                <dd className="mt-3 max-w-[30rem] text-[1.04rem] leading-[1.7] opacity-75">
                  {c.texto}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <LlamadaFinal
        sobre="Condiciones bajo petición"
        titulo="¿Hablamos de vuestras bodas?"
        texto="Contadnos cuántas bodas lleváis al año y cómo trabajáis, y os pasamos las condiciones de colaborador: comisión o precio especial, marca blanca o sello discreto."
        boton="Escribidnos por WhatsApp"
        href={whatsapp}
      />
    </>
  );
}
