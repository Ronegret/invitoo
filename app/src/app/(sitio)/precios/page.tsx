import type { Metadata } from "next";
import Link from "next/link";
import Rama from "@/components/Botanica";
import Revelar from "@/components/Revelar";
import Encabezado from "@/components/sitio/Encabezado";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import Planes from "@/components/sitio/Planes";
import Preguntas from "@/components/sitio/Preguntas";
import Rotulo from "@/components/sitio/Rotulo";
import { PLANES } from "@/data/plantillas";
import { ANADIDOS } from "@/data/sitio";

const DESDE = Math.min(...PLANES.map((p) => p.precio));

export const metadata: Metadata = {
  title: `Precios · Invitaciones de boda desde ${DESDE} € · Invitoo`,
  description:
    "Cuatro planes, pago único. Sin suscripción, sin comisión por invitado y sin coste por confirmación. Alojamiento del primer año incluido.",
};

/**
 * Los precios.
 *
 * Es la página que más se busca y la que antes estaba más escondida: en la
 * home había que bajar nueve pantallas para llegar. Ahora tiene su URL, su
 * título y su descripción, que es lo que se lee en Google antes de entrar.
 *
 * El bloque de «lo que no cobramos» no es relleno. Quien llega aquí viene de
 * comparar con plataformas que anuncian 29 € y luego cobran por invitado o
 * por año; decir en voz alta qué NO hay es más convincente que repetir qué
 * sí, porque es lo que el otro no puede decir.
 */
export default function Precios() {
  return (
    <>
      <Encabezado
        sobre="Lo que cuesta"
        titulo={`Desde ${DESDE} €, pago único`}
        bajo="Hay plataformas a veintinueve euros donde la montáis vosotros, y estudios a seiscientos. Estamos en medio y a propósito: con una persona montándola de principio a fin y sin que vosotros toquéis un editor."
        foto="/fotos/sitio/corte-3.avif"
      />

      <section className="grano relative bg-[var(--papel)] px-5 py-24 sm:py-28">
        <div className="mx-auto max-w-[72rem]">
          <Planes />

          <Revelar>
            <p className="mx-auto mt-12 max-w-[40rem] text-center text-[0.88rem] leading-relaxed opacity-55">
              Los pagos van por Stripe; también aceptamos PayPal y Klarna.
              Antes de cobrar hablamos: si lo que queréis no encaja con lo que
              hacemos, os lo decimos.
            </p>
          </Revelar>
        </div>
      </section>

      {/* ---------------- Lo que no cobramos ---------------- */}
      <section className="grano relative bg-[var(--bruma)]/55 px-5 py-28 sm:py-32">
        <div className="mx-auto max-w-[46rem]">
          <Revelar>
            <Rotulo
              sobre="Letra pequeña"
              titulo="Lo que no se paga"
              bajo="Porque es justo lo que en otras se paga después."
            />
          </Revelar>

          <ul className="mt-14 flex flex-col gap-6">
            {[
              [
                "Ninguna cuota mensual",
                "Se paga una vez. No hay renovación, ni tarjeta guardada, ni cargo al año siguiente.",
              ],
              [
                "Ninguna comisión por invitado",
                "Da igual que seáis sesenta o trescientos: el precio es el mismo.",
              ],
              [
                "Ningún coste por confirmación",
                "Las confirmaciones son ilimitadas, con su panel para vosotros.",
              ],
              [
                "Ningún extra por cambiar cosas",
                "Cambios ilimitados hasta el día de la boda. Si llueve y movéis el cóctel dentro, lo tocamos esa misma mañana.",
              ],
              [
                "El primer año de alojamiento va dentro",
                "Un año desde la boda. Después decidís si la mantenéis o la convertís en Libro de la Boda.",
              ],
            ].map(([titulo, texto], i) => (
              <Revelar key={titulo} retraso={i * 70}>
                <div className="flex gap-5 border-b border-[var(--tinta)]/10 pb-6">
                  <span className="mt-1 shrink-0 text-[var(--verde)]">
                    <Rama forma="brote" ancho={22} retraso={i * 50} />
                  </span>
                  <div>
                    <h3 className="display text-[1.3rem]">{titulo}</h3>
                    <p className="mt-2 text-[0.96rem] leading-[1.7] opacity-68">
                      {texto}
                    </p>
                  </div>
                </div>
              </Revelar>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Añadidos ---------------- */}
      <section className="grano relative bg-[var(--papel)] px-5 py-28 sm:py-32">
        <div className="mx-auto max-w-[62rem]">
          <Revelar>
            <Rotulo
              sobre="Si hace falta"
              titulo="Añadidos"
              bajo="Se pueden pedir con cualquier plan, antes o después."
            />
          </Revelar>

          <ul className="mt-16 grid gap-5 sm:grid-cols-3">
            {ANADIDOS.map((a, i) => (
              <Revelar
                as="li"
                key={a.nombre}
                retraso={i * 90}
                className="flex flex-col border border-[var(--tinta)]/12 bg-[var(--bruma)]/35 p-8 text-center"
              >
                <h3 className="display text-[1.5rem]">{a.nombre}</h3>
                <p className="display mt-3 text-[2rem] leading-none text-[var(--acento)]">
                  {a.precio} €
                </p>
                <p className="mt-5 text-[0.94rem] leading-[1.7] opacity-68">
                  {a.nota}
                </p>
              </Revelar>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Dudas de dinero ---------------- */}
      <section className="grano relative bg-[var(--bruma)]/55 px-5 py-28 sm:py-32">
        <div className="mx-auto max-w-[46rem]">
          <Revelar>
            <Rotulo sobre="Antes de decidir" titulo="Preguntas" />
          </Revelar>
          <div className="mt-14">
            <Preguntas de="precio" />
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
        sobre="Sin compromiso"
        titulo="Hablamos antes"
        texto="No hace falta decidir el plan hoy. Reservad veinte minutos, contadnos vuestra boda y os decimos cuál encaja y cuál no. Si ninguno os sirve, os lo diremos también."
      />
    </>
  );
}
