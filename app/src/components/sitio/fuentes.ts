import { Bodoni_Moda, Mrs_Saint_Delafield } from "next/font/google";

/**
 * Las dos voces que la web v2 añade a Bodoni redonda y a Instrument Sans.
 *
 * · Bodoni Moda Italic, para los nombres y las dedicatorias. Variable (sin
 *   `weight`) y con el eje `opsz`: a 28 px o más, la cursiva de óptico alto
 *   es la del logotipo, con el contraste de una invitación grabada.
 * · Una letra a mano, una sola vez por pantalla: «Para vosotros» en el
 *   sobre. Mrs Saint Delafield es caligrafía de pluma de verdad, no la
 *   script de tienda de novias del WordPress antiguo.
 *
 * Solo las carga el grupo `(sitio)`: las invitaciones no las pagan.
 */
export const bodoniItalica = Bodoni_Moda({
  subsets: ["latin"],
  style: ["italic"],
  axes: ["opsz"],
  variable: "--font-italica",
  display: "swap",
});

export const aMano = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mano",
  display: "swap",
});
