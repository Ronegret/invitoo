import Link from "next/link";
import Rama from "@/components/Botanica";
import Revelar from "@/components/Revelar";
import BodasReales from "@/components/sitio/BodasReales";
import Corte from "@/components/sitio/Corte";
import GaleriaPlantillas from "@/components/sitio/GaleriaPlantillas";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import MomentoWhatsApp from "@/components/sitio/MomentoWhatsApp";
import PortadaSitio from "@/components/sitio/PortadaSitio";
import Rotulo from "@/components/sitio/Rotulo";
import { PLANES } from "@/data/plantillas";
import { DENTRO } from "@/data/sitio";

/**
 * invitoo.es — la portada.
 *
 * El concepto sigue siendo el mismo: **la home ES una invitación**. Mismo
 * vocabulario que las que hacemos —portada a sangre, sello, versalitas
 * espaciadas, hilos, ramas, cortes de fotografía a página completa— porque
 * si Invitoo vende invitaciones, la primera que tiene que enamorar es la
 * suya.
 *
 * Lo que ha cambiado es el tamaño. Antes esto era una sola página de doce
 * mil píxeles con todo dentro: las doce plantillas, las quince cosas que
 * lleva, el proceso, los cuatro planes y siete preguntas. Leerla entera era
 * un trabajo, y quien solo quería saber el precio tenía que atravesar la
 * historia de la marca para llegar.
 *
 * Ahora la portada cuenta y reparte: enseña seis diseños y lleva a
 * /plantillas, resume lo que va dentro y lleva a /servicios, da el precio de
 * entrada y lleva a /precios. Cada una de esas páginas es una URL que se
 * puede mandar sola por WhatsApp, que es como se comparte esto de verdad.
 */

const DESDE = Math.min(...PLANES.map((p) => p.precio));

export default function Home() {
  return (
    <>
      <PortadaSitio />

      {/* ---------------- Seis de las doce ---------------- */}
      <section
        id="plantillas"
        className="grano relative scroll-mt-24 bg-[var(--papel)] px-5 py-28 sm:py-36"
      >
        <div className="mx-auto max-w-[72rem]">
          <Revelar>
            <Rotulo
              sobre="El catálogo"
              titulo="Doce aperturas"
              bajo="Cada una es un gesto distinto, y el gesto importa más que el color: no se abre igual una boda de campo que una de noche. Elegís la vuestra y después ajustamos paleta y tipografía a lo vuestro."
            />
            <p className="mt-5 text-center text-[0.86rem] opacity-45">
              Doce diseños en tres colores cada uno: treinta y seis. Pulsa
              cualquiera y se abre entera, como la verá un invitado.
            </p>
          </Revelar>

          <div className="mt-20">
            <GaleriaPlantillas limite={6} />
          </div>

          <Revelar>
            <p className="mt-20 text-center">
              <Link
                href="/plantillas"
                className="boton inline-flex min-h-13 items-center justify-center rounded-full border border-[var(--tinta)]/25 px-9 text-[0.78rem] uppercase tracking-[0.18em]"
              >
                Ver las doce
              </Link>
            </p>
          </Revelar>
        </div>
      </section>

      {/* ---------------- Nos presentamos ---------------- */}
      <section className="grano relative bg-[var(--papel)] px-6 py-28 sm:py-36">
        <div className="mx-auto max-w-[38rem]">
          <Revelar>
            <Rotulo sobre="Quiénes somos" titulo="Un encargo, no una plantilla" />
          </Revelar>

          <Revelar retraso={140}>
            <div className="mt-12 flex flex-col gap-7 text-center text-[1.06rem] leading-[1.9] opacity-80">
              <p>
                Hay plataformas donde elegís una plantilla, rellenáis vuestros
                datos a las once de la noche y os cobran veintinueve euros.
                Están bien. No es lo que hacemos.
              </p>
              <p>
                Aquí nos contáis vuestra boda una vez, por vídeo, durante
                veinte minutos: quiénes sois, quién viene, qué os hace ilusión
                y qué os da pereza. Y unos días después os llega un enlace
                terminado.
              </p>
              <p className="display text-[clamp(1.5rem,4.4vw,2.1rem)] leading-[1.4] opacity-100">
                Lo que reciben vuestros invitados no es una tarjeta: es un
                vídeo que se abre con vuestros nombres dentro.
              </p>
            </div>
          </Revelar>
        </div>
      </section>

      <MomentoWhatsApp />

      <BodasReales />

      <Corte
        foto="/fotos/sitio/corte-1.avif"
        frase="Una invitación se abre una vez, y esa vez hay ciento veinte personas mirando el móvil."
        pie="Ese es el momento que diseñamos"
      />

      {/* ---------------- Lo que lleva dentro, en corto ---------------- */}
      <section className="grano relative bg-[var(--bruma)]/55 px-5 py-28 sm:py-36">
        <div className="mx-auto max-w-[62rem]">
          <Revelar>
            <Rotulo
              sobre="Por dentro"
              titulo="Quince cosas resueltas"
              bajo="Todo lo que, si no está aquí, acaba en un grupo de WhatsApp de ochenta personas preguntando a qué hora es la misa. Éstas son ocho."
            />
          </Revelar>

          <dl className="mt-16 grid gap-x-14 gap-y-10 sm:grid-cols-2">
            {DENTRO.filter((d) => d.destacada).map((d, i) => (
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
            <p className="mt-16 text-center">
              <Link
                href="/servicios"
                className="boton inline-flex min-h-13 items-center justify-center rounded-full border border-[var(--tinta)]/25 px-9 text-[0.78rem] uppercase tracking-[0.18em]"
              >
                Todo lo que lleva
              </Link>
            </p>
          </Revelar>
        </div>
      </section>

      <Corte
        foto="/fotos/sitio/corte-2.avif"
        frase="Vosotros no tocáis ningún editor. Contádnoslo una vez y ya está."
        pie="Cómo trabajamos"
        alto="58svh"
      />

      {/* ---------------- El precio, dicho pronto ---------------- */}
      <section className="grano relative bg-[var(--papel)] px-5 py-28 sm:py-36">
        <div className="mx-auto max-w-[40rem] text-center">
          <Revelar>
            <Rotulo
              sobre="Lo que cuesta"
              titulo={`Desde ${DESDE} €`}
              bajo="Pago único: ni suscripción, ni comisión por invitado, ni coste por confirmación. Hay plataformas a veintinueve euros donde la montáis vosotros y estudios a seiscientos; estamos en medio a propósito, con una persona montándola de principio a fin."
            />
          </Revelar>
          <Revelar retraso={120}>
            <p className="mt-12">
              <Link
                href="/precios"
                className="boton-lleno inline-flex min-h-14 items-center justify-center rounded-full px-10 text-[0.78rem] uppercase tracking-[0.18em]"
                style={{ background: "var(--tinta)", color: "var(--papel)" }}
              >
                Ver los cuatro planes
              </Link>
            </p>
          </Revelar>
        </div>
      </section>

      <Corte
        foto="/fotos/sitio/corte-3.avif"
        frase="Sin compromiso y sin presupuesto por delante. Primero os escuchamos."
        pie="Veinte minutos por Meet"
        alto="56svh"
      />

      <LlamadaFinal />
    </>
  );
}
