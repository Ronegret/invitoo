import Link from "next/link";
import { Fragment } from "react";
import CampoNombres from "@/components/sitio/portada/CampoNombres";
import EscenaSobre from "@/components/sitio/portada/EscenaSobre";
import { DEMO } from "@/data/demo";
import { PLANTILLAS } from "@/data/plantillas";
import { PLANES, PLANTILLA_PORTADA, enLetra } from "@/data/sitio";
import { enlaceReserva } from "@/lib/contacto";
import { partesMadrid } from "@/lib/fecha";
import s from "./portada.module.css";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre",
];

/** «2027-03-30T12:30» → «30 · MARZO · 2027», el interletrado de Nico & Gaby. */
export function fechaEspaciada(iso: string | undefined) {
  if (!iso) return "";
  try {
    const p = partesMadrid(iso);
    return `${p.dia} · ${MESES[p.mes - 1]} · ${p.anio}`.toLocaleUpperCase("es-ES");
  } catch {
    return "";
  }
}

const TITULAR = "Vuestra boda empieza cuando abren la invitación.";

/**
 * La portada de invitoo.es, v2.
 *
 * En móvil, lo primero que se ve es un sobre de verdad sobre un lino, con
 * «Para vosotros» escrito a mano: el producto antes que la frase. El
 * titular entra debajo, línea a línea. Al tocar el sobre (o solo, a los
 * 4 s) se abre, sube la cartulina y la cartulina se hace móvil con la
 * invitación de ejemplo corriendo dentro.
 *
 * En escritorio, la composición es asimétrica: la letra a la izquierda,
 * grande y a su margen, y el sobre a la derecha, como una fotografía de
 * bodegón.
 *
 * Es un componente de servidor: el titular, el texto y los dos botones
 * salen en el HTML y se leen sin JavaScript. El sobre también, cerrado.
 */
/**
 * BlurText: el titular se enfoca letra a letra, como cuando se aclara la
 * vista al abrir un sobre. Solo CSS (sale en el HTML, se lee sin JS); el
 * lector de pantalla oye la frase entera, no letras sueltas. Las palabras
 * no se parten: cada una es un bloque que no se rompe.
 */
function TextoEnfoque({ texto }: { texto: string }) {
  let n = 0;
  return (
    <>
      <span className="sr-only">{texto}</span>
      <span aria-hidden className={s.enfoque}>
        {texto.split(" ").map((palabra, i) => (
          <Fragment key={i}>
            <span className={s.palabra}>
              {Array.from(palabra).map((letra, j) => (
                <span key={j} className={s.letra} style={{ "--l": n++ } as React.CSSProperties}>
                  {letra}
                </span>
              ))}
            </span>{" "}
          </Fragment>
        ))}
      </span>
    </>
  );
}

export default function PortadaSobre() {
  const demo =
    PLANTILLAS.find((p) => (p.id as string) === PLANTILLA_PORTADA) ?? PLANTILLAS[0];
  const desde = Math.min(...PLANES.map((p) => p.precio));
  const fecha = fechaEspaciada(DEMO[demo.demo]?.pareja.fecha);
  const [a, b] = demo.pareja;

  return (
    <section className="relative isolate overflow-hidden bg-[var(--papel)] pb-20 pt-[4.75rem] sm:pt-24 lg:pb-28 lg:pt-36">
      {/* Aurora: dos luces, granate y oro, muy lejos y muy lentas. */}
      <div aria-hidden className={s.aurora}>
        <i />
        <i />
        <i />
      </div>
      <div className="mx-auto grid max-w-[80rem] lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8">
        {/* El sobre: primero en móvil, a la derecha en escritorio. */}
        <div className="lg:order-2 lg:col-span-5">
          <EscenaSobre
            slug={demo.demo}
            ejemplo={demo.pareja}
            fechaLarga={fecha}
            fechaIso={(DEMO[demo.demo]?.pareja.fecha ?? "").slice(0, 10)}
            titulo={`Invitación de ejemplo de ${a} y ${b}, plantilla ${demo.nombre}`}
          />
        </div>

        <div className="px-4 pt-10 sm:px-6 lg:order-1 lg:col-span-7 lg:px-0 lg:pt-0">
          <h1 className={s.titular}>
            <TextoEnfoque texto={TITULAR} />
          </h1>

          <p className="mt-8 max-w-[34rem] text-[1.12rem] leading-[1.7] text-[var(--tinta)]/80 [text-wrap:pretty]">
            Una apertura con vuestros nombres, una canción compuesta para
            vosotros y la confirmación de cada invitado, con su menú y sus
            alergias. La montamos nosotros.
          </p>

          <p className={s.precio}>
            <span className={s.brilloOro}>Desde {desde} €</span>
            <span className={s.precioBajo}>IVA incluido. Pago único.</span>
          </p>

          <div className="mt-9 max-w-[34rem]">
            <CampoNombres slug={demo.demo} ejemplo={[a, b]} fechaMuestra={(DEMO[demo.demo]?.pareja.fecha ?? "").slice(0, 10)} reserva={enlaceReserva()} abreSobre />
          </div>

          <p className="mt-6 max-w-[34rem] text-[1rem] leading-[1.7] text-[var(--tinta)]/65">
            Lista en cinco días laborables.{" "}
            <Link href="/plantillas" className="enlace-sub underline decoration-[var(--tinta)]/30 underline-offset-4">
              {enLetra(PLANTILLAS.length, true)} plantillas para elegir
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
