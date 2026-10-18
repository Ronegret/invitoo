import type { Metadata } from "next";
import Link from "next/link";
import Revelar from "@/components/Revelar";
import Corte from "@/components/sitio/Corte";
import Encabezado from "@/components/sitio/Encabezado";
import GaleriaPlantillas from "@/components/sitio/GaleriaPlantillas";
import LlamadaFinal from "@/components/sitio/LlamadaFinal";
import Rotulo from "@/components/sitio/Rotulo";
import { PLANTILLAS } from "@/data/plantillas";

export const metadata: Metadata = {
  title: "Las doce plantillas · Invitoo",
  description:
    "Doce diseños de invitación de boda, cada uno con su propia apertura en vídeo y en tres paletas. Se abren enteras, como las verá un invitado.",
};

/**
 * El catálogo entero.
 *
 * Existe como página propia por un motivo comercial, no de arquitectura: es
 * el enlace que se manda. Cuando alguien pregunta «¿y cómo son?», lo que se
 * envía por WhatsApp es invitoo.es/plantillas, no la home con la instrucción
 * de bajar cuatro pantallas.
 */
export default function Plantillas() {
  const colores = PLANTILLAS.reduce((n, p) => n + p.variantes.length, 0);

  return (
    <>
      <Encabezado
        sobre="El catálogo"
        titulo="Las doce aperturas"
        bajo="Cada plantilla es un gesto distinto, y el gesto importa más que el color: no se abre igual una boda de campo que una de noche. Pulsad cualquiera y se abre entera, con su vídeo, como la verá un invitado."
        foto="/fotos/sitio/corte-1.avif"
      />

      <section className="grano relative bg-[var(--papel)] px-5 py-24 sm:py-28">
        <div className="mx-auto max-w-[72rem]">
          <Revelar>
            <p className="mx-auto max-w-[44rem] text-center text-[1.02rem] leading-[1.85] opacity-72">
              Doce diseños en tres paletas cada uno:{" "}
              <strong className="font-normal opacity-100">
                {colores} combinaciones
              </strong>
              . Y ninguna se queda como está: la que elijáis se ajusta a
              vuestros colores, vuestra tipografía y el orden que tenga
              sentido para vuestra boda.
            </p>
          </Revelar>

          <div className="mt-20">
            <GaleriaPlantillas />
          </div>
        </div>
      </section>

      <Corte
        foto="/fotos/sitio/corte-2.avif"
        frase="Ninguna de las doce se parece a otra: cambia el orden, no solo el color."
        pie="Cada una monta su página a su manera"
        alto="56svh"
      />

      {/* Por qué son de verdad distintas. Es la objeción número uno cuando
          alguien viene de mirar plataformas de plantillas. */}
      <section className="grano relative bg-[var(--bruma)]/55 px-5 py-28 sm:py-32">
        <div className="mx-auto max-w-[46rem]">
          <Revelar>
            <Rotulo
              sobre="La diferencia"
              titulo="No es la misma página repintada"
            />
          </Revelar>
          <Revelar retraso={120}>
            <div className="mt-12 flex flex-col gap-6 text-[1.02rem] leading-[1.85] opacity-78">
              <p>
                En la mayoría de plataformas, las «plantillas» son la misma
                estructura con otra tipografía y otro color de fondo: primero
                la portada, luego la historia, luego el itinerario, siempre en
                el mismo orden. Cambia el envoltorio.
              </p>
              <p>
                Aquí cada plantilla decide su propio orden.{" "}
                <em>Sobre</em> pone el itinerario nada más abrir, porque quien
                recibe una invitación de misa quiere la hora, no una historia
                de amor. <em>Constelación</em> empieza por la fiesta.{" "}
                <em>Cielo</em>, que es de boda de destino, sube el alojamiento
                al segundo puesto porque quien coge un avión necesita saber
                dónde duerme. Y <em>Tinta</em> tiene seis secciones en total,
                a propósito.
              </p>
              <p>
                Por eso al elegir plantilla no estáis eligiendo un color:
                estáis eligiendo cómo se lee vuestra boda.
              </p>
            </div>
          </Revelar>

          <Revelar retraso={200}>
            <p className="mt-12 text-center">
              <Link
                href="/servicios"
                className="boton inline-flex min-h-13 items-center justify-center rounded-full border border-[var(--tinta)]/25 px-9 text-[0.78rem] uppercase tracking-[0.18em]"
              >
                Qué lleva dentro cada una
              </Link>
            </p>
          </Revelar>
        </div>
      </section>

      <LlamadaFinal
        sobre="¿Ya tenéis una favorita?"
        titulo="Contadnos cuál"
        texto="Veinte minutos por Meet. Nos decís qué plantilla os ha gustado y cómo es vuestra boda, y os enseñamos cómo quedaría con vuestros nombres y vuestras fotos."
      />
    </>
  );
}
