import type { Metadata } from "next";
import { ViewTransition } from "react";
import { CursorInvitoo } from "@/components/sistema";
import BarraFija from "@/components/sitio/BarraFija";
import Cabecera from "@/components/sitio/Cabecera";
import Petalos from "@/components/sitio/Petalos";
import Pie from "@/components/sitio/Pie";
import RevelarSitio from "@/components/sitio/RevelarSitio";
import revelado from "@/components/sitio/revelado.module.css";
import { aMano, bodoniItalica } from "@/components/sitio/fuentes";
import { fechaEspaciada } from "@/components/sitio/portada/PortadaSobre";
import { DEMO } from "@/data/demo";
import { PLANTILLAS } from "@/data/plantillas";
import { PLANES, PLANTILLA_PORTADA } from "@/data/sitio";
import Medir from "@/lib/visitas/Medir";
import "./sitio.css";

const DESDE = Math.min(...PLANES.map((p) => p.precio));
const MUESTRA = PLANTILLAS.find((p) => (p.id as string) === PLANTILLA_PORTADA) ?? PLANTILLAS[0];
const MINI = {
  slug: MUESTRA.demo,
  ejemplo: MUESTRA.pareja,
  fecha: fechaEspaciada(DEMO[MUESTRA.demo]?.pareja.fecha),
  desde: DESDE,
};

/**
 * El título de cada página interior lleva « · Invitoo» detrás. Va aquí y
 * no en el layout raíz para no tocar el título de las invitaciones, que es
 * el de cada pareja.
 */
export const metadata: Metadata = {
  title: {
    template: "%s · Invitoo",
    default: "Invitoo · Invitaciones de boda digitales a medida",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Invitoo",
  },
};

/**
 * El marco de la web pública.
 *
 * Todo lo que va en `(sitio)` —portada, plantillas, servicios, precios,
 * preguntas— comparte cabecera, barra fija y pie.
 *
 * FUERA EL TELÓN. Había una cortina de marca que se abría al entrar: 3,4
 * segundos de pantalla crema con el logotipo dibujándose. Tenía sentido
 * cuando la portada era una fotografía; con el vídeo de marca puesto sobra,
 * y estorba de dos maneras medidas (_research/capturas/primera/):
 *
 *   · retrasa 3,4 s la película, que es justo lo que hay que ver primero, y
 *   · al abrirse, su «INVITOO» se cruzaba con el titular de la portada: dos
 *     veces el nombre, superpuestas, durante casi un segundo.
 *
 * Dos entradas de marca seguidas no son el doble de marca: son una espera.
 * El archivo sigue en el historial de git por si alguna vez vuelve.
 *
 * Las invitaciones (`/i/...`), el estudio y el panel de los novios quedan
 * fuera del grupo a propósito: una invitación no lleva el menú de Invitoo
 * encima, porque no es nuestra, es de ellos.
 *
 * El revelado de las secciones (`Revelar`) lo arranca `RevelarSitio`, con
 * el estilo de `revelado.module.css`: un fundido corto y sobrio.
 *
 * Antes esto vivía repetido dentro de `page.tsx`. Al partir la web en cuatro
 * páginas, repetirlo cuatro veces habría sido la forma más rápida de que una
 * se quedara con el menú antiguo.
 */
export default function SitioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`sitio-raiz ${bodoniItalica.variable} ${aMano.variable}`}>
      <CursorInvitoo />
      <Petalos />
      <Cabecera mini={MINI} />
      <BarraFija
        resumen={`${PLANTILLAS.length} plantillas · desde ${DESDE} € · lista en 5 días`}
        corto={`Desde ${DESDE} € · en 5 días`}
      />
      <ViewTransition default="pagina">
        <main id="contenido" tabIndex={-1} className={`relative outline-none ${revelado.sitio}`}>
          {children}
          <RevelarSitio />
        </main>
      </ViewTransition>
      <Pie />
      {/* Medición propia sin cookies (lib/visitas): vistas, origen y clics en Reservar/WhatsApp. */}
      <Medir />
    </div>
  );
}
