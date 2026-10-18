import type { Apertura, PlantillaId, Tema } from "@/lib/tipos";

/**
 * El catálogo de las seis plantillas.
 *
 * Cada una es un máster de vídeo + una paleta por defecto. La pareja elige
 * plantilla; los colores se ajustan después en la videollamada, así que el
 * `tema` de aquí es un punto de partida, no una jaula.
 *
 * Las DOCE tienen máster: 9 segundos, montaje vertical y horizontal, y solo
 * se descarga uno. Cada una lleva además su propia gradación de color —frío,
 * cálido, blanco y negro, verde empujado—, que es lo que hace que cortes del
 * mismo rodaje se vean como diez bodas distintas. Todos están cortados del metraje propio de Invitoo — son
 * provisionales hasta que se rueden los definitivos, pero funcionan y se ven.
 * Ver docs/04-diseno.md §3.
 */

/**
 * Una variante de color. Es el multiplicador del catálogo: chungdoi.com
 * tiene ocho familias de diseño y las ofrece en varios colores —«Baroque II
 * — Dark Green», «Minimalism — Brown»—, y así presenta veintidós opciones
 * con ocho diseños. Aquí sale gratis: la paleta de cada boda ya son tres
 * variables CSS, así que una variante es una línea, no un rediseño.
 */
export type Variante = {
  id: string;
  nombre: string;
  tinta: string;
  papel: string;
  acento: string;
};

export type Plantilla = {
  id: PlantillaId;
  nombre: string;
  /** La invitación de muestra de esta plantilla, completa y publicada. */
  demo: string;
  /** La pareja de la muestra, para el rótulo de la ficha. */
  pareja: [string, string, string];
  /** Una línea. Lo que ve el invitado, no adjetivos. */
  gesto: string;
  /** Para qué boda es. Esto es lo que ayuda a elegir. */
  para: string;
  /**
   * La insignia de la ficha: dos palabras, el tipo de boda.
   *
   * La Qualité pone ahí «MÁS VENDIDA EN ESPAÑA» o «NOVEDAD». Nosotros no:
   * no hay datos de ventas que lo respalden y no se inventan. Lo que sí es
   * cierto, y además ayuda más a elegir, es para qué boda es cada una.
   */
  etiqueta: string;
  tema: Tema;
  /** La primera es la de catálogo; el resto se eligen con ?c=<id>. */
  variantes: Variante[];
  apertura: Apertura | null;
  poster: string;
};

export const PLANTILLAS: Plantilla[] = [
  {
    id: "sobre",
    demo: "laura-y-ruben",
    pareja: ["Laura", "Rubén", "30 de marzo"],
    nombre: "Sobre",
    gesto: "Se rompe el lacre, gira la solapa y sale la cartulina.",
    para: "Boda clásica, ceremonia religiosa, invitados de todas las edades.",
    etiqueta: "Clásica",
    tema: { tinta: "#241a16", papel: "#f6f1e9", acento: "#8c1d2c", grano: 0.05 },
    variantes: [
      { id: "granate", nombre: "Granate", tinta: "#241a16", papel: "#f6f1e9", acento: "#8c1d2c" },
      { id: "verdeoscuro", nombre: "Verde oscuro", tinta: "#1b241d", papel: "#f4f3ec", acento: "#33503a" },
      { id: "azulnoche", nombre: "Azul noche", tinta: "#161c2b", papel: "#f2f3f7", acento: "#2f4470" },
    ],
    apertura: {
      vertical: "/aperturas/sobre/vertical.mp4",
      horizontal: "/aperturas/sobre/horizontal.mp4",
      poster: "/aperturas/sobre/poster.avif",
      rotuloEn: 3.0,
      rotuloClaro: true,
    },
    poster: "/aperturas/sobre/poster.avif",
  },
  {
    id: "floracion",
    demo: "nora-y-sebas",
    pareja: ["Nora", "Sebas", "12 de mayo"],
    nombre: "Floración",
    gesto: "Un capullo se abre y la cámara entra entre los pétalos.",
    para: "Boda de campo, primavera, verdes y terracota.",
    etiqueta: "De campo",
    tema: { tinta: "#2a1a18", papel: "#f7f1ea", acento: "#7c6a3f", grano: 0.05 },
    variantes: [
      { id: "olivo", nombre: "Olivo", tinta: "#24301f", papel: "#f5f6ef", acento: "#6c7d4f" },
      { id: "terracota", nombre: "Terracota", tinta: "#33241c", papel: "#f8f2ea", acento: "#a6613c" },
      { id: "malva", nombre: "Malva", tinta: "#2b2130", papel: "#f6f2f6", acento: "#7b5b7e" },
    ],
    apertura: {
      vertical: "/aperturas/floracion/vertical.mp4",
      horizontal: "/aperturas/floracion/horizontal.mp4",
      poster: "/aperturas/floracion/poster.avif",
      rotuloEn: 3.2,
      rotuloClaro: true,
    },
    poster: "/aperturas/floracion/poster.avif",
  },
  {
    id: "cielo",
    demo: "sara-y-marcos",
    pareja: ["Sara", "Marcos", "4 de junio"],
    nombre: "Cielo",
    gesto: "La bruma se abre en capas y sales por encima, al amanecer.",
    para: "Boda de playa o de destino. La que mejor combina con la canción.",
    etiqueta: "De destino",
    tema: { tinta: "#1d2530", papel: "#f4f6f8", acento: "#b0875a", grano: 0.03 },
    variantes: [
      { id: "dorado", nombre: "Dorado", tinta: "#1b2836", papel: "#f3f6f8", acento: "#b0875a" },
      { id: "agua", nombre: "Agua", tinta: "#162a33", papel: "#f0f6f7", acento: "#3f7f89" },
      { id: "coral", nombre: "Coral", tinta: "#2c1f22", papel: "#faf3f1", acento: "#c2604f" },
    ],
    apertura: {
      vertical: "/aperturas/cielo/vertical.mp4",
      horizontal: "/aperturas/cielo/horizontal.mp4",
      poster: "/aperturas/cielo/poster.avif",
      rotuloEn: 4.0,
      rotuloClaro: true,
    },
    poster: "/aperturas/cielo/poster.avif",
  },
  {
    id: "velo",
    demo: "claudia-y-jorge",
    pareja: ["Claudia", "Jorge", "21 de septiembre"],
    nombre: "Velo",
    gesto: "Un tejido se levanta a cámara lenta y descubre lo que hay detrás.",
    para: "Boda elegante, urbana, paleta neutra.",
    etiqueta: "De etiqueta",
    tema: { tinta: "#211f1d", papel: "#faf7f3", acento: "#9a8c7a", grano: 0.04 },
    variantes: [
      { id: "arena", nombre: "Arena", tinta: "#1f1d1b", papel: "#faf8f4", acento: "#9a7f63" },
      { id: "perla", nombre: "Perla", tinta: "#1d1f22", papel: "#f7f8f9", acento: "#7e8790" },
      { id: "champan", nombre: "Champán", tinta: "#241f18", papel: "#faf6ec", acento: "#b39256" },
    ],
    apertura: {
      vertical: "/aperturas/velo/vertical.mp4",
      horizontal: "/aperturas/velo/horizontal.mp4",
      poster: "/aperturas/velo/poster.avif",
      rotuloEn: 2.8,
      rotuloClaro: true,
    },
    poster: "/aperturas/velo/poster.avif",
  },
  {
    id: "constelacion",
    demo: "yone-y-noe",
    pareja: ["Yone", "Noe", "18 de octubre"],
    nombre: "Constelación",
    gesto: "Puntos de luz que se conectan hasta formar las dos alianzas.",
    para: "Boda de noche, moderna, azul y oro. La más memorable.",
    etiqueta: "De noche",
    tema: { tinta: "#0e1526", papel: "#f2f3f7", acento: "#c2a15c", grano: 0.03 },
    variantes: [
      { id: "oro", nombre: "Oro", tinta: "#14182a", papel: "#f3f2f7", acento: "#b08d57" },
      { id: "plata", nombre: "Plata", tinta: "#171a21", papel: "#f4f5f7", acento: "#8b93a3" },
      { id: "vinotinto", nombre: "Vino tinto", tinta: "#1d1418", papel: "#f6f1f2", acento: "#8e2f43" },
    ],
    apertura: {
      vertical: "/aperturas/constelacion/vertical.mp4",
      horizontal: "/aperturas/constelacion/horizontal.mp4",
      poster: "/aperturas/constelacion/poster.avif",
      rotuloEn: 3.5,
      rotuloClaro: true,
    },
    poster: "/aperturas/constelacion/poster.avif",
  },
  {
    id: "bruma",
    demo: "frank-y-nico",
    pareja: ["Frank", "Nico", "7 de febrero"],
    nombre: "Bruma",
    gesto: "Alguien retira el vaho de un cristal empañado.",
    para: "Boda de invierno, íntima, minimalista.",
    etiqueta: "Íntima",
    tema: { tinta: "#262422", papel: "#f5f4f1", acento: "#6e7d70", grano: 0.04 },
    variantes: [
      { id: "piedra", nombre: "Piedra", tinta: "#242220", papel: "#f5f3ef", acento: "#8a7250" },
      { id: "salvia", nombre: "Salvia", tinta: "#22261f", papel: "#f3f5f0", acento: "#6b7d63" },
      { id: "carbon", nombre: "Carbón", tinta: "#1b1b1b", papel: "#f4f4f3", acento: "#565656" },
    ],
    apertura: {
      vertical: "/aperturas/bruma/vertical.mp4",
      horizontal: "/aperturas/bruma/horizontal.mp4",
      poster: "/aperturas/bruma/poster.avif",
      rotuloEn: 2.6,
      rotuloClaro: true,
    },
    poster: "/aperturas/bruma/poster.avif",
  },
  {
    id: "marea",
    demo: "elena-y-pau",
    pareja: ["Elena", "Pau", "6 de julio"],
    nombre: "Marea",
    gesto: "El agua se retira y descubre los nombres escritos en la arena.",
    para: "Boda junto al mar. Azules fríos, blanco y lino.",
    etiqueta: "Junto al mar",
    tema: { tinta: "#17293a", papel: "#f2f6f8", acento: "#3d6b86", grano: 0.03 },
    variantes: [
      { id: "indigo", nombre: "Índigo", tinta: "#17293a", papel: "#f2f6f8", acento: "#3d6b86" },
      { id: "turquesa", nombre: "Turquesa", tinta: "#132b2b", papel: "#eff7f5", acento: "#3d8378" },
      { id: "arenablanca", nombre: "Arena", tinta: "#241f1a", papel: "#faf6ee", acento: "#a08a63" },
    ],
    apertura: {
      vertical: "/aperturas/marea/vertical.mp4",
      horizontal: "/aperturas/marea/horizontal.mp4",
      poster: "/aperturas/marea/poster.avif",
      rotuloEn: 3.4,
      rotuloClaro: true,
    },
    poster: "/aperturas/marea/poster.avif",
  },
  {
    id: "terracota",
    demo: "irene-y-dani",
    pareja: ["Irene", "Dani", "13 de septiembre"],
    nombre: "Terracota",
    gesto: "La arcilla se agrieta y por las grietas entra la luz.",
    para: "Boda boho, finca de secano, barro y naranja quemado.",
    etiqueta: "Boho",
    tema: { tinta: "#3a2418", papel: "#faf3ea", acento: "#b5623a", grano: 0.06 },
    variantes: [
      { id: "barro", nombre: "Barro", tinta: "#3a2418", papel: "#faf3ea", acento: "#b5623a" },
      { id: "mostaza", nombre: "Mostaza", tinta: "#2e2716", papel: "#faf6e8", acento: "#a8863a" },
      { id: "oliva", nombre: "Oliva", tinta: "#262b1c", papel: "#f6f6ec", acento: "#6d7a42" },
    ],
    apertura: {
      vertical: "/aperturas/terracota/vertical.mp4",
      horizontal: "/aperturas/terracota/horizontal.mp4",
      poster: "/aperturas/terracota/poster.avif",
      rotuloEn: 3.1,
      rotuloClaro: true,
    },
    poster: "/aperturas/terracota/poster.avif",
  },
  {
    id: "tinta",
    demo: "marta-y-alvaro",
    pareja: ["Marta", "Álvaro", "8 de noviembre"],
    nombre: "Tinta",
    gesto: "Una gota cae sobre el papel y la mancha se abre en los nombres.",
    para: "Boda mínima, en blanco y negro. Para quien no quiere nada de color.",
    etiqueta: "Mínima",
    tema: { tinta: "#131313", papel: "#f7f7f5", acento: "#55534e", grano: 0.07 },
    variantes: [
      { id: "negro", nombre: "Negro", tinta: "#131313", papel: "#f7f7f5", acento: "#55534e" },
      { id: "sepia", nombre: "Sepia", tinta: "#221c16", papel: "#f8f4ee", acento: "#7a6852" },
      { id: "azulacero", nombre: "Azul acero", tinta: "#14181d", papel: "#f4f6f8", acento: "#4b5a68" },
    ],
    apertura: {
      vertical: "/aperturas/tinta/vertical.mp4",
      horizontal: "/aperturas/tinta/horizontal.mp4",
      poster: "/aperturas/tinta/poster.avif",
      rotuloEn: 3.0,
      rotuloClaro: true,
    },
    poster: "/aperturas/tinta/poster.avif",
  },
  {
    id: "jardin",
    demo: "lucia-y-tomas",
    pareja: ["Lucía", "Tomás", "24 de abril"],
    nombre: "Jardín",
    gesto: "La maleza se aparta y deja ver el claro donde se celebra.",
    para: "Boda de invernadero o jardín cerrado. Verde profundo y helechos.",
    etiqueta: "De jardín",
    tema: { tinta: "#1b2a1c", papel: "#f4f7f0", acento: "#456b3f", grano: 0.05 },
    variantes: [
      { id: "helecho", nombre: "Helecho", tinta: "#1b2a1c", papel: "#f4f7f0", acento: "#456b3f" },
      { id: "eucalipto", nombre: "Eucalipto", tinta: "#1e2723", papel: "#f2f6f3", acento: "#5b7d70" },
      { id: "rosaviejo", nombre: "Rosa viejo", tinta: "#2a2022", papel: "#f9f3f3", acento: "#a06670" },
    ],
    apertura: {
      vertical: "/aperturas/jardin/vertical.mp4",
      horizontal: "/aperturas/jardin/horizontal.mp4",
      poster: "/aperturas/jardin/poster.avif",
      rotuloEn: 3.3,
      rotuloClaro: true,
    },
    poster: "/aperturas/jardin/poster.avif",
  },
  {
    id: "lino",
    demo: "julia-y-hector",
    pareja: ["Julia", "Héctor", "2 de agosto"],
    nombre: "Lino",
    gesto: "Una tela se despliega y el nombre queda impreso en el tejido.",
    para: "Boda de mediodía, sencilla y luminosa. Crudo, hueso y hierba seca.",
    etiqueta: "De mediodía",
    tema: { tinta: "#2c2822", papel: "#faf7f1", acento: "#9c8e74", grano: 0.06 },
    variantes: [
      { id: "crudo", nombre: "Crudo", tinta: "#2c2822", papel: "#faf7f1", acento: "#9c8e74" },
      { id: "hueso", nombre: "Hueso", tinta: "#26241f", papel: "#fbf9f4", acento: "#b0a389" },
      { id: "hierba", nombre: "Hierba seca", tinta: "#272a1e", papel: "#f7f7ef", acento: "#8a8c55" },
    ],
    apertura: {
      vertical: "/aperturas/lino/vertical.mp4",
      horizontal: "/aperturas/lino/horizontal.mp4",
      poster: "/aperturas/lino/poster.avif",
      rotuloEn: 2.9,
      rotuloClaro: true,
    },
    poster: "/aperturas/lino/poster.avif",
  },
  {
    id: "brasa",
    demo: "carmen-y-ivan",
    pareja: ["Carmen", "Iván", "11 de octubre"],
    nombre: "Brasa",
    gesto: "El último sol se apaga y las letras quedan al rojo.",
    para: "Boda de atardecer largo. Rojos, cobre y sombra.",
    etiqueta: "Al atardecer",
    tema: { tinta: "#2a1712", papel: "#faf2ec", acento: "#a8432a", grano: 0.05 },
    variantes: [
      { id: "cobre", nombre: "Cobre", tinta: "#2a1712", papel: "#faf2ec", acento: "#a8432a" },
      { id: "ambar", nombre: "Ámbar", tinta: "#2b2014", papel: "#faf5ea", acento: "#b8792a" },
      { id: "ciruela", nombre: "Ciruela", tinta: "#241419", papel: "#f8f1f3", acento: "#7d2f44" },
    ],
    apertura: {
      vertical: "/aperturas/brasa/vertical.mp4",
      horizontal: "/aperturas/brasa/horizontal.mp4",
      poster: "/aperturas/brasa/poster.avif",
      rotuloEn: 3.6,
      rotuloClaro: true,
    },
    poster: "/aperturas/brasa/poster.avif",
  },
];

/**
 * Los planes.
 *
 * Precios y enlaces son los que ya están cobrando en invitoo.es: cobrar 249 €
 * por un enlace de Stripe configurado a 89 € no es una opción. Lo que sí
 * cambia aquí es cómo se cuentan.
 *
 * La subida a 149/249/449 de docs/02-estrategia.md §5.1 necesita enlaces de
 * pago nuevos. Cuando existan, se cambian estas tres líneas y ya está.
 *
 * «Estudio» no lleva enlace a propósito: un encargo a medida no se cierra con
 * un botón de pago, se cierra hablando.
 */
/**
 * Lo que lleva CUALQUIER plan.
 *
 * Estaba repetido dentro de cada tarjeta como «Todo lo del Esencial», y eso
 * tiene dos costes: obliga a leer la tarjeta de al lado para entender la que
 * miras, y hace que el plan barato parezca incompleto cuando no lo es.
 *
 * La Qualité lo resuelve con una banda «INCLUIDO EN TODOS LOS PLANES» encima
 * de las tarjetas, y es de lo mejor que hacen: sacar lo común del comparador
 * deja en cada tarjeta solo lo que de verdad las diferencia.
 */
export const COMUNES = [
  "Apertura en vídeo, la plantilla que elijáis",
  "Canción compuesta para vosotros (Dedícalo)",
  "Vuestro enlace para compartir por WhatsApp",
  "Itinerario, mapas y botón de cómo llegar",
  "Cuenta atrás hasta el día",
  "Cambios ilimitados hasta la boda",
  "Un año de alojamiento incluido",
  "Videollamada de diseño de 20 minutos por Meet",
];

/**
 * Los cuatro pasos entre pagar y tenerla. Van justo debajo del titular de
 * precios, que es donde aparece la duda de «¿y después qué pasa?».
 */
export const PASOS_COMPRA = [
  "Elegís plan",
  "Nos contáis vuestra boda",
  "La montamos",
  "La mandáis",
];

export const PLANES = [
  {
    id: "esencial",
    nombre: "Esencial",
    precio: 89,
    pago: "https://buy.stripe.com/cN26rD6mw721dG0288",
    resumen: "La invitación con su apertura y todo lo del día.",
    camino: "Elegís plantilla → la rellenamos con lo vuestro → la aprobáis",
    incluye: [
      "Una de las doce plantillas, en su paleta original",
      "Hasta ocho secciones",
      "Diseño en PDF con enlace, por si lo queréis imprimir",
    ],
    destacado: false,
  },
  {
    id: "personalizado",
    nombre: "Personalizado",
    precio: 129,
    pago: "https://buy.stripe.com/aEUaHTbGQ9a945qbIK",
    resumen: "Vuestros colores, vuestra tipografía y la gente confirmando sola.",
    camino: "Elegís plantilla → la rediseñamos con lo vuestro → la aprobáis",
    incluye: [
      "Vuestros colores y vuestra tipografía, no los de la plantilla",
      "Secciones ilimitadas, en el orden que tenga sentido",
      "Confirmación de asistencia, con menú, alergias y autobús",
      "Panel de control para vosotros, con las respuestas en directo",
    ],
    destacado: true,
  },
  {
    id: "premium",
    nombre: "Premium",
    precio: 169,
    pago: "https://buy.stripe.com/28o2bnbGQeutfO88wz",
    resumen: "Y lo que queda después: las fotos y los mensajes de todos.",
    camino: "Lo mismo que Personalizado → y lo que os queda cuando pasa la boda",
    incluye: [
      "Álbum donde los invitados suben sus fotos",
      "Muro de mensajes, que se os entrega al final",
      "Dos canciones: una para la invitación y otra para el día",
      "Dos idiomas incluidos",
    ],
    destacado: false,
  },
  {
    id: "estudio",
    nombre: "Estudio",
    precio: 449,
    desde: true,
    pago: null,
    resumen: "Diseño desde cero. Ni plantilla ni apertura de catálogo.",
    camino: "Nos contáis vuestra idea → la dibujamos desde cero",
    incluye: [
      "Diseño original: no parte de ninguna plantilla",
      "Apertura rodada para vuestra boda",
      "Los idiomas que hagan falta",
      "El Libro de la Boda incluido",
      "Acompañamiento hasta el día",
    ],
    destacado: false,
  },
] as const;

export const PROCESO = [
  {
    n: 1,
    titulo: "Elegís",
    texto: "Miráis las doce aperturas y decís cuál os pega. Si ninguna, se hace otra.",
  },
  {
    n: 2,
    titulo: "Hablamos",
    texto:
      "Videollamada de 20 minutos, gratis. Vuestra historia, vuestros colores, qué queréis contar.",
  },
  {
    n: 3,
    titulo: "La montamos",
    texto: "Nosotros la construimos entera. Vosotros no tocáis ningún editor.",
  },
  {
    n: 4,
    titulo: "La revisáis",
    texto: "Os mandamos un enlace privado. Se cambia lo que haga falta.",
  },
  {
    n: 5,
    titulo: "La mandáis",
    texto: "Un enlace por WhatsApp y ya está. Las confirmaciones os llegan solas.",
  },
];
