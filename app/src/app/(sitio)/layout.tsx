import BarraFija from "@/components/sitio/BarraFija";
import Cabecera from "@/components/sitio/Cabecera";
import Pie from "@/components/sitio/Pie";
import { ChispaClic } from "@/components/Gestos";

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
    <>
      <ChispaClic />
      <Cabecera />
      <BarraFija />
      <main className="relative">{children}</main>
      <Pie />
    </>
  );
}
