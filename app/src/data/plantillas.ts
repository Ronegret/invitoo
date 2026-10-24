import type {
  Apertura,
  Bloque,
  Ornamento,
  PlantillaAntigua,
  PlantillaGuardada,
  PlantillaId,
  Tema,
} from "@/lib/tipos";
import { BASE_TEMATICAS } from "../plantillas/tematicas/catalogo.ts";

/**
 * El catálogo: NUEVE plantillas que se distinguen a primera vista. La
 * primera, Carta, es la insignia de la casa (nace de Nico & Gaby).
 *
 * La regla (docs/06-plan-de-mejora.md §5): dos plantillas tienen que
 * diferenciarse en cinco cosas —tipografía, fondo, portada, ornamento y
 * apertura—, no solo en el orden de las secciones. Antes había doce que
 * eran la misma página repintada: mismo papel claro, mismas fuentes, tres
 * portadas para doce.
 *
 * Este archivo es DATO. No importa nada en tiempo de ejecución (solo tipos)
 * para que `herramientas/revisar.mjs` lo pueda leer con Node sin compilar.
 * Las fuentes de verdad se cargan en cada `src/plantillas/<id>.tsx`; aquí
 * solo va el nombre de la familia, que es lo que se compara.
 *
 * Quien lo lee: la web (D) para la galería, la invitación (A/B) para la
 * apertura y las variantes, el estudio para el desplegable. Nadie cuenta las
 * plantillas a mano: `PLANTILLAS.length`.
 */

/**
 * Una variante de color. Tres por plantilla: «Sobre — Verde oscuro»,
 * «Registro — Naranja». `acentoTexto`/`sobreAcento` no se escriben aquí: se
 * calculan (src/plantillas/color.ts) para que ninguna pueda colarse sin AA.
 */
export type Variante = {
  id: string;
  nombre: string;
  tinta: string;
  papel: string;
  acento: string;
};

/**
 * Lo que una plantilla destaca, EN ORDEN. Es dato, no JSX: cada maqueta
 * recorre esta lista. Lo que la pareja haya rellenado y no esté aquí NO se
 * pierde: va a una sección compacta al final («Y además»).
 * `respiro` es el corte de foto a sangre entre secciones.
 */
export type Seccion = Exclude<Bloque["t"], "portada"> | "respiro";

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
  /** La insignia de la ficha: el tipo de boda (no «más vendida»: no hay datos). */
  etiqueta: string;
  /** Familias de Google Fonts. Se cargan con next/font en `plantillas/<id>.tsx`. */
  tipografia: { display: string; texto: string };
  /** Nombre legible de la display, para las fichas («Cormorant Garamond»). */
  fuente: string;
  ornamento: Ornamento;
  /** Radio de esquinas de la plantilla. */
  radio: string;
  /** `oscuro` = fondo oscuro de verdad (Constelación). */
  modo: "claro" | "oscuro";
  grano: number;
  /** El tema por defecto: el de la primera variante. */
  tema: Tema;
  /** La primera es la de catálogo; el resto se eligen con ?c=<id>. */
  variantes: Variante[];
  /** Las secciones destacadas, en orden. */
  orden: Seccion[];
  /** Máster de vídeo, o null si la apertura es un componente. */
  apertura: Apertura | null;
  /**
   * Apertura sin vídeo: clave de `APERTURAS_SIN_VIDEO` en
   * `src/plantillas/aperturas/index.ts`. Solo cuando `apertura` es null.
   */
  aperturaComponente: "registro" | "azulejo" | null;
  /** Imagen fija de la ficha: retrato propio de la demo (public/generadas) o el SVG de la animación. */
  poster: string;
  /** Ids antiguos que ahora pinta esta plantilla. */
  absorbe: PlantillaAntigua[];
};

function video(id: string, rotuloEn: number): Apertura {
  return {
    vertical: `/aperturas/${id}/vertical.mp4`,
    horizontal: `/aperturas/${id}/horizontal.mp4`,
    poster: `/aperturas/${id}/poster.avif`,
    rotuloEn,
    rotuloClaro: true,
  };
}

function tema(v: Variante, grano: number, radio: string, ornamento: Ornamento): Tema {
  return { tinta: v.tinta, papel: v.papel, acento: v.acento, grano, radio, ornamento };
}

type Base = Omit<Plantilla, "tema" | "fuente">;

const BASE: Base[] = [
  {
    id: "carta",
    demo: "ines-y-gonzalo",
    pareja: ["Inés", "Gonzalo", "18 de septiembre"],
    nombre: "Carta",
    gesto: "Un sobre crema con lacre dorado. Dentro, vuestra historia contada por capítulos.",
    para: "Boda de finca, de sierra o de jardín, elegante y sin rigidez. La invitación de la casa.",
    etiqueta: "Insignia",
    tipografia: { display: "Cormorant Garamond", texto: "Instrument Sans" },
    ornamento: "filete",
    radio: "2px",
    modo: "claro",
    grano: 0.035,
    variantes: [
      { id: "bosque", nombre: "Verde bosque", tinta: "#1d2620", papel: "#f6f0e4", acento: "#1f3a2e" },
      { id: "granate", nombre: "Granate", tinta: "#2a1b1c", papel: "#f6efe6", acento: "#6e1f2b" },
      { id: "noche", nombre: "Azul noche", tinta: "#171c29", papel: "#faf6ee", acento: "#1c2840" },
    ],
    // Una carta: primero la historia (quiénes somos), luego el día, la
    // cuenta atrás y el dress code en negativo, y confirmar.
    orden: [
      "capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "rsvp",
      "regalos", "playlist", "alojamiento", "notas", "respiro", "galeria",
      "album", "hashtag", "muro",
    ],
    // La apertura es el sobre CSS/SVG de E1 (`usaSobre`): ni vídeo ni mp4.
    apertura: null,
    aperturaComponente: null,
    poster: "/aperturas/carta/poster.svg",
    absorbe: [],
  },
  {
    id: "sobre",
    demo: "laura-y-ruben",
    pareja: ["Laura", "Rubén", "30 de marzo"],
    nombre: "Sobre",
    gesto: "Se rompe el lacre, gira la solapa y sale la cartulina.",
    para: "Boda clásica, ceremonia religiosa, invitados de todas las edades.",
    etiqueta: "Clásica",
    tipografia: { display: "Playfair Display", texto: "EB Garamond" },
    ornamento: "lacre",
    radio: "2px",
    modo: "claro",
    grano: 0.05,
    variantes: [
      { id: "granate", nombre: "Granate", tinta: "#241a16", papel: "#f6f1e9", acento: "#8c1d2c" },
      { id: "verdeoscuro", nombre: "Verde oscuro", tinta: "#1b241d", papel: "#f4f1e6", acento: "#33503a" },
      { id: "azulnoche", nombre: "Azul noche", tinta: "#161c2b", papel: "#f3f0ea", acento: "#2f4470" },
    ],
    orden: [
      "itinerario", "cuentaAtras", "dressCode", "alojamiento", "notas", "rsvp",
      "respiro", "capitulos", "historia", "galeria", "playlist", "regalos",
      "album", "hashtag", "muro",
    ],
    apertura: video("sobre", 3.0),
    aperturaComponente: null,
    poster: "/generadas/sobre-portada-768.avif",
    absorbe: [],
  },
  {
    id: "floracion",
    demo: "nora-y-sebas",
    pareja: ["Nora", "Sebas", "12 de mayo"],
    nombre: "Floración",
    gesto: "Un capullo se abre y las ramas se dibujan solas alrededor de vuestros nombres.",
    para: "Boda de campo o de jardín. Primavera entre olivos, o un atardecer de barro y cobre.",
    etiqueta: "De campo",
    tipografia: { display: "Fraunces", texto: "Figtree" },
    ornamento: "rama",
    radio: "20px",
    modo: "claro",
    grano: 0.06,
    variantes: [
      { id: "olivo", nombre: "Olivo", tinta: "#24301f", papel: "#f1f2e6", acento: "#5e6f45" },
      // La variante cálida recoge Terracota y Brasa: barro, cobre y sombra.
      { id: "brasa", nombre: "Brasa", tinta: "#3a2418", papel: "#f8ede1", acento: "#a6532f" },
      { id: "malva", nombre: "Malva", tinta: "#2b2130", papel: "#f5f0f2", acento: "#7b5b7e" },
    ],
    orden: [
      "capitulos", "historia", "itinerario", "galeria", "dressCode", "notas",
      "rsvp", "alojamiento", "playlist", "regalos", "album", "hashtag", "muro",
    ],
    apertura: video("floracion", 3.2),
    aperturaComponente: null,
    poster: "/generadas/floracion-portada-768.avif",
    absorbe: ["jardin", "terracota", "brasa"],
  },
  {
    id: "mar",
    demo: "sara-y-marcos",
    pareja: ["Sara", "Marcos", "4 de junio"],
    nombre: "Mar",
    gesto: "Se sube entre nubes hasta que aparece el mar. El horizonte parte la portada en dos.",
    para: "Boda de playa o de destino. Gente que coge un avión y necesita saber dónde dormir.",
    etiqueta: "De destino",
    tipografia: { display: "Italiana", texto: "Jost" },
    ornamento: "ola",
    radio: "0px",
    modo: "claro",
    grano: 0.03,
    variantes: [
      { id: "indigo", nombre: "Índigo", tinta: "#14283a", papel: "#edf3f4", acento: "#2f6a8a" },
      { id: "turquesa", nombre: "Turquesa", tinta: "#10302e", papel: "#edf5f2", acento: "#2c7a70" },
      { id: "arena", nombre: "Arena", tinta: "#2a241c", papel: "#f5eee2", acento: "#8f7046" },
    ],
    // Alojamiento en SEGUNDO lugar: quien viaja necesita saber dónde duerme.
    orden: [
      "itinerario", "alojamiento", "notas", "cuentaAtras", "galeria", "dressCode",
      "rsvp", "capitulos", "historia", "playlist", "regalos", "album", "hashtag", "muro",
    ],
    apertura: video("mar", 4.0),
    aperturaComponente: null,
    poster: "/generadas/mar-portada-768.avif",
    absorbe: ["cielo", "marea"],
  },
  {
    id: "velo",
    demo: "claudia-y-jorge",
    pareja: ["Claudia", "Jorge", "21 de septiembre"],
    nombre: "Velo",
    gesto: "Un tejido se levanta a cámara lenta y descubre lo que hay detrás.",
    para: "Boda de etiqueta, urbana o de palacio. Paleta neutra, nada que sobre.",
    etiqueta: "De etiqueta",
    tipografia: { display: "Cinzel", texto: "Manrope" },
    ornamento: "filete",
    radio: "0px",
    modo: "claro",
    grano: 0.04,
    variantes: [
      { id: "piedra", nombre: "Piedra", tinta: "#1e1c1a", papel: "#eeeae3", acento: "#76664f" },
      { id: "perla", nombre: "Perla", tinta: "#1c1e21", papel: "#f1f1ee", acento: "#69727c" },
      { id: "champan", nombre: "Champán", tinta: "#231e17", papel: "#f3ede0", acento: "#836a3c" },
    ],
    // Sin hashtag, sin álbum, sin playlist: una boda de etiqueta no los
    // lleva. Si la pareja los rellena, van a «Y además», no se pierden.
    orden: [
      "itinerario", "dressCode", "rsvp", "capitulos", "historia", "galeria",
      "notas", "alojamiento", "regalos", "muro",
    ],
    apertura: video("velo", 2.8),
    aperturaComponente: null,
    poster: "/generadas/velo-portada-768.avif",
    absorbe: ["lino", "bruma"],
  },
  {
    id: "constelacion",
    demo: "yone-y-noe",
    pareja: ["Yone", "Noe", "18 de octubre"],
    nombre: "Constelación",
    gesto: "Puntos de luz que se conectan hasta formar las dos alianzas. Toda la invitación es de noche.",
    para: "Boda de noche, moderna. Azul noche y oro.",
    etiqueta: "De noche",
    tipografia: { display: "Marcellus", texto: "Outfit" },
    ornamento: "estrella",
    radio: "999px",
    modo: "oscuro",
    grano: 0.05,
    variantes: [
      { id: "medianoche", nombre: "Medianoche", tinta: "#ece7da", papel: "#0e1428", acento: "#c9a55c" },
      { id: "plata", nombre: "Plata", tinta: "#e7eaf0", papel: "#13161d", acento: "#b9c1cf" },
      { id: "vino", nombre: "Vino", tinta: "#f2e8e9", papel: "#1d1017", acento: "#d9a08c" },
    ],
    // Empieza por la fiesta; la historia, de madrugada.
    orden: [
      "itinerario", "cuentaAtras", "galeria", "respiro", "dressCode", "playlist",
      "hashtag", "notas", "rsvp", "alojamiento", "regalos", "album", "capitulos",
      "historia", "muro",
    ],
    apertura: video("constelacion", 3.5),
    aperturaComponente: null,
    poster: "/generadas/constelacion-portada-768.avif",
    absorbe: [],
  },
  {
    id: "tinta",
    demo: "marta-y-alvaro",
    pareja: ["Marta", "Álvaro", "8 de noviembre"],
    nombre: "Tinta",
    gesto: "Una gota cae sobre el papel y la mancha se abre en los nombres.",
    para: "Boda mínima, en blanco y negro. Seis secciones y nada más.",
    etiqueta: "Mínima",
    tipografia: { display: "Instrument Serif", texto: "Geist" },
    ornamento: "punto",
    radio: "0px",
    modo: "claro",
    grano: 0.07,
    variantes: [
      { id: "negro", nombre: "Negro", tinta: "#141414", papel: "#f7f7f4", acento: "#55534e" },
      { id: "sepia", nombre: "Sepia", tinta: "#221c16", papel: "#f6f1e8", acento: "#6f5e48" },
      { id: "azulacero", nombre: "Azul acero", tinta: "#14181d", papel: "#f2f4f6", acento: "#465563" },
    ],
    // Quitar es una posición. Lo demás, si existe, va compacto al final.
    orden: ["itinerario", "cuentaAtras", "capitulos", "notas", "rsvp", "muro"],
    apertura: video("tinta", 3.0),
    aperturaComponente: null,
    poster: "/generadas/tinta-portada-768.avif",
    absorbe: [],
  },
  {
    id: "registro",
    demo: "alex-y-bruno",
    pareja: ["Àlex", "Bruno", "19 de junio"],
    nombre: "Registro",
    gesto: "Un sello de registro civil cae sobre la página y deja estampadas la fecha y la hora.",
    para: "Boda civil en la ciudad. Juzgado o ayuntamiento, y luego a comer.",
    etiqueta: "Civil urbana",
    tipografia: { display: "Inter Tight", texto: "Inter Tight" },
    ornamento: "regla",
    radio: "0px",
    modo: "claro",
    grano: 0,
    variantes: [
      { id: "lima", nombre: "Lima", tinta: "#1f2124", papel: "#ffffff", acento: "#c6f432" },
      { id: "naranja", nombre: "Naranja", tinta: "#1f2124", papel: "#ffffff", acento: "#ff5b1f" },
      { id: "cobalto", nombre: "Azul eléctrico", tinta: "#1f2124", papel: "#ffffff", acento: "#2f4bff" },
    ],
    orden: ["itinerario", "rsvp", "notas", "dressCode", "alojamiento", "regalos", "galeria", "muro"],
    apertura: null,
    aperturaComponente: "registro",
    poster: "/aperturas/registro/poster.svg",
    absorbe: [],
  },
  {
    id: "azulejo",
    demo: "rocio-y-javier",
    pareja: ["Rocío", "Javier", "26 de junio"],
    nombre: "Azulejo",
    gesto: "Una pieza de azulejo se repite hasta formar una puerta, y la puerta se abre.",
    para: "Boda mediterránea de verano: patio andaluz, masía o casa encalada.",
    etiqueta: "Mediterránea",
    tipografia: { display: "Cormorant Garamond", texto: "DM Sans" },
    ornamento: "cenefa",
    radio: "10px",
    modo: "claro",
    grano: 0.04,
    variantes: [
      { id: "cobalto", nombre: "Cobalto", tinta: "#1a2236", papel: "#fbf8f2", acento: "#1f4e9c" },
      { id: "buganvilla", nombre: "Buganvilla", tinta: "#2a1a24", papel: "#fbf8f2", acento: "#b23a6e" },
      { id: "ocre", nombre: "Ocre", tinta: "#2a2216", papel: "#fbf8f2", acento: "#d9a441" },
    ],
    orden: [
      "itinerario", "cuentaAtras", "capitulos", "historia", "galeria", "dressCode",
      "notas", "alojamiento", "rsvp", "playlist", "regalos", "album", "hashtag", "muro",
    ],
    apertura: null,
    aperturaComponente: "azulejo",
    poster: "/aperturas/azulejo/poster.svg",
    absorbe: [],
  },
];

// Las temáticas de K1 (Alta Sociedad, Aire, Érase una vez): src/plantillas/tematicas/catalogo.ts
export const PLANTILLAS: Plantilla[] = [...BASE, ...BASE_TEMATICAS].map((p) => ({
  ...p,
  fuente: p.tipografia.display,
  tema: tema(p.variantes[0], p.grano, p.radio, p.ornamento),
}));

/**
 * Ids antiguos → id nuevo. Lo que hay guardado en Supabase y los enlaces que
 * ya circulan por WhatsApp siguen funcionando.
 */
export const ALIAS_PLANTILLAS: Record<PlantillaAntigua, PlantillaId> = {
  jardin: "floracion",
  terracota: "floracion",
  brasa: "floracion",
  cielo: "mar",
  marea: "mar",
  lino: "velo",
  bruma: "velo",
};

/**
 * La variante que le corresponde a un id antiguo, para que una boda guardada
 * como «brasa» se siga viendo cálida y no olivo. La usa `resolverTokens`.
 */
export const VARIANTE_DE_ALIAS: Partial<Record<PlantillaAntigua, string>> = {
  terracota: "brasa",
  brasa: "brasa",
  marea: "turquesa",
  lino: "champan",
  bruma: "perla",
};

const IDS = new Set<string>(PLANTILLAS.map((p) => p.id));

/** Cualquier id (nuevo, antiguo o basura) → id del catálogo. Por defecto, Sobre. */
export function resolverPlantillaId(id: string | null | undefined): PlantillaId {
  if (id && IDS.has(id)) return id as PlantillaId;
  if (id && id in ALIAS_PLANTILLAS) return ALIAS_PLANTILLAS[id as PlantillaAntigua];
  return "sobre";
}

export function obtenerPlantilla(id: PlantillaGuardada | string | null | undefined): Plantilla {
  const real = resolverPlantillaId(id);
  return PLANTILLAS.find((p) => p.id === real) ?? PLANTILLAS[0];
}
