import type { Plantilla } from "../../data/plantillas.ts";

/**
 * LAS PLANTILLAS TEMÁTICAS (K1) — las tres primeras del encargo de estilos
 * (docs/16-encargo-estilos-tematicos.txt), con los ids y nombres de la
 * ficha de dirección de arte (docs/16a): Alta Sociedad (`regencia`,
 * Bridgerton), Aire (`aire`, elegancia pura) y Érase una vez (`cuento`,
 * cuentos de hadas).
 *
 * Es DATO, como `src/data/plantillas.ts`, que lo importa y lo añade a su
 * catálogo: solo tipos, nada en tiempo de ejecución, para que
 * `herramientas/revisar.mjs` lo lea con Node sin compilar.
 *
 * Lo que comparten las tres y las separa de las nueve de la casa:
 *  · la cabecera es un VÍDEO a pantalla completa (el de los novios, en
 *    `tema.heroVideo`, o el temático de la plantilla) con su gradación;
 *  · una cuenta atrás con objeto propio (reloj de bolsillo, cifras que se
 *    enfocan, reloj de arena);
 *  · el dónde, el cuándo, el dress code y los regalos se cuentan con el
 *    scroll (`animation-timeline: view()` con IntersectionObserver de
 *    reserva).
 */
type BaseTematica = Omit<Plantilla, "tema" | "fuente">;

// El póster de la apertura es un fotograma limpio (los de public/aperturas
// llevan rotulada otra pareja).
const video = (id: string, rotuloEn: number, tema: string) => ({
  vertical: `/aperturas/${id}/vertical.mp4`,
  horizontal: `/aperturas/${id}/horizontal.mp4`,
  poster: `/tematicas/${tema}/apertura.avif`,
  rotuloEn,
  rotuloClaro: true,
});

export const BASE_TEMATICAS: BaseTematica[] = [
  {
    id: "regencia",
    demo: "olivia-y-edmundo",
    pareja: ["Olivia", "Edmundo", "19 de junio"],
    nombre: "Alta Sociedad",
    gesto: "Se rompe el lacre y, tras el sobre, caen glicinias como una cortina sobre vuestro vídeo.",
    para: "Boda de palacio o de jardín inglés: tonos pastel, caligrafía, guantes y vals. Muy de época.",
    etiqueta: "Romántica de época",
    tipografia: { display: "Cormorant", texto: "EB Garamond" },
    ornamento: "lacre",
    radio: "3px",
    modo: "claro",
    grano: 0.04,
    variantes: [
      { id: "wedgwood", nombre: "Azul Wedgwood", tinta: "#1e2a3a", papel: "#f2f4f6", acento: "#3e5f82" },
      { id: "glicinia", nombre: "Glicinia", tinta: "#2b2340", papel: "#f7f1ec", acento: "#8a4566" },
      { id: "melocoton", nombre: "Rosa té", tinta: "#3a2320", papel: "#fbf1ea", acento: "#a04a3a" },
    ],
    orden: [
      "cuentaAtras", "itinerario", "capitulos", "historia", "dressCode", "rsvp",
      "alojamiento", "regalos", "galeria", "playlist", "notas", "album", "hashtag", "muro",
    ],
    // El sobre de papel con lacre de E1 (sin vídeo de apertura): el vídeo
    // va después, en la cabecera.
    apertura: null,
    aperturaComponente: null,
    poster: "/tematicas/regencia/poster-v.avif",
    absorbe: [],
  },
  {
    id: "aire",
    demo: "blanca-y-alonso",
    pareja: ["Blanca", "Alonso", "2 de octubre"],
    nombre: "Aire",
    gesto: "Una línea de oro dibuja vuestro monograma y abre la pantalla en dos.",
    para: "Boda sobria y muy cuidada: un palacio, un museo, una casa blanca. Mucho blanco y nada que sobre.",
    etiqueta: "Elegante mínima",
    tipografia: { display: "Italiana", texto: "Cormorant Garamond" },
    ornamento: "filete",
    radio: "0px",
    modo: "claro",
    grano: 0,
    variantes: [
      { id: "oro", nombre: "Oro", tinta: "#1a1a1a", papel: "#faf9f6", acento: "#8a6d33" },
      { id: "plata", nombre: "Plata", tinta: "#18191b", papel: "#f6f7f7", acento: "#5a6068" },
      { id: "champan", nombre: "Champán", tinta: "#1f1b16", papel: "#f7f3ea", acento: "#7a6236" },
    ],
    orden: [
      "itinerario", "cuentaAtras", "dressCode", "rsvp", "capitulos", "historia",
      "alojamiento", "regalos", "notas", "galeria", "album", "muro",
    ],
    apertura: video("aire", 3.0, "aire"),
    aperturaComponente: null,
    poster: "/tematicas/aire/poster-v.avif",
    absorbe: [],
  },
  {
    id: "cuento",
    demo: "aurora-y-leo",
    pareja: ["Aurora", "Leo", "18 de diciembre"],
    nombre: "Érase una vez",
    gesto: "Un libro antiguo se abre página a página al bajar, y el polvo de hadas sigue a tu dedo.",
    para: "Boda de castillo, de bosque o de invierno. Para parejas que creen en los finales felices.",
    etiqueta: "De cuento",
    tipografia: { display: "Cinzel Decorative", texto: "Lora" },
    ornamento: "estrella",
    radio: "6px",
    modo: "oscuro",
    grano: 0.05,
    variantes: [
      { id: "amatista", nombre: "Amatista", tinta: "#f4ecdc", papel: "#1d1030", acento: "#d8b45e" },
      { id: "medianoche", nombre: "Medianoche", tinta: "#eef0f8", papel: "#101a33", acento: "#e2c47c" },
      { id: "rosa", nombre: "Rosa de hada", tinta: "#f7eaf0", papel: "#2a0f28", acento: "#e9a9c9" },
    ],
    // Érase una vez (la historia, el libro), y después el día.
    orden: [
      "capitulos", "historia", "cuentaAtras", "itinerario", "dressCode", "rsvp",
      "alojamiento", "regalos", "galeria", "playlist", "notas", "album", "hashtag", "muro",
    ],
    apertura: video("cuento", 3.5, "cuento"),
    aperturaComponente: null,
    poster: "/tematicas/cuento/poster-v.avif",
    absorbe: [],
  },
  // ── K4 (docs/16b §1–§5): música, baile y noche. Apertura con el vídeo de
  // la casa (fotograma limpio de póster); el bucle de la cabecera, `HERO` en
  // festival.tsx, vinilo.tsx, neon.tsx, fuego.tsx y bachata.tsx.
  {
    id: "festival",
    demo: "carla-y-dani",
    pareja: ["Carla", "Dani", "17 de julio"],
    nombre: "Pase VIP",
    gesto: "Una acreditación holográfica cuelga de su cordón. Para confirmar, se arranca el talón.",
    para: "Parejas que se conocieron en un festival, o boda de verano al aire libre con DJ. Euforia, pero de zona backstage.",
    etiqueta: "Festival",
    tipografia: { display: "Big Shoulders", texto: "Space Grotesk" },
    ornamento: "punto",
    radio: "14px",
    modo: "claro",
    grano: 0.04,
    variantes: [
      { id: "atardecer", nombre: "Atardecer", tinta: "#1c1a2b", papel: "#f4efe4", acento: "#c8324f" },
      { id: "brisa", nombre: "Brisa de costa", tinta: "#16202b", papel: "#f2efe8", acento: "#1f6f8b" },
      { id: "buganvilla", nombre: "Buganvilla", tinta: "#2a1820", papel: "#f6ede4", acento: "#9e3d8f" },
    ],
    orden: [
      "capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "alojamiento", "regalos",
      "rsvp", "playlist", "galeria", "album", "hashtag", "notas", "muro",
    ],
    apertura: video("festival", 2.6, "festival"),
    aperturaComponente: null,
    poster: "/tematicas/festival/poster-v.avif",
    absorbe: [],
  },
  {
    id: "vinilo",
    demo: "alba-y-marcos",
    pareja: ["Alba", "Marcos", "16 de octubre"],
    nombre: "Cara A",
    gesto: "Un LP sale de su funda y gira bajo vuestros nombres. Tocadlo y suena.",
    para: "Parejas rockeras, o una boda en sala o masía con banda en directo. Actitud, pero con traje.",
    etiqueta: "Rock & Roll",
    tipografia: { display: "DM Serif Display", texto: "Karla" },
    ornamento: "punto",
    radio: "0px",
    modo: "oscuro",
    grano: 0.06,
    variantes: [
      { id: "rojo", nombre: "Rojo directo", tinta: "#eee8df", papel: "#111011", acento: "#c42f27" },
      { id: "plata", nombre: "Plata y humo", tinta: "#ece9e4", papel: "#0f1012", acento: "#b9a37a" },
      { id: "whisky", nombre: "Whisky", tinta: "#efe7dc", papel: "#141110", acento: "#b07d45" },
    ],
    // La playlist pesa: va detrás de la historia.
    orden: [
      "capitulos", "historia", "playlist", "itinerario", "cuentaAtras", "dressCode", "alojamiento",
      "regalos", "rsvp", "galeria", "album", "hashtag", "notas", "muro",
    ],
    apertura: video("vinilo", 2.6, "vinilo"),
    aperturaComponente: null,
    poster: "/tematicas/vinilo/poster-v.avif",
    absorbe: [],
  },
  {
    id: "neon",
    demo: "nerea-y-adrian",
    pareja: ["Nerea", "Adrián", "4 de septiembre"],
    nombre: "Neón de Medianoche",
    gesto: "Vuestros nombres se encienden en neón, tubo a tubo, sobre negro profundo.",
    para: "Boda urbana, de azotea o hasta el amanecer. Reggaeton y fiesta, con la elegancia de un club privado.",
    etiqueta: "Reggaeton y fiesta",
    tipografia: { display: "Unbounded", texto: "Plus Jakarta Sans" },
    ornamento: "punto",
    radio: "18px",
    modo: "oscuro",
    grano: 0.03,
    variantes: [
      { id: "rosa", nombre: "Rosa neón", tinta: "#f1edf6", papel: "#0a0910", acento: "#ff5fa8" },
      { id: "hielo", nombre: "Hielo", tinta: "#eaf2f7", papel: "#07090f", acento: "#4fd1e8" },
      { id: "ambar", nombre: "Ámbar de madrugada", tinta: "#f6ece9", papel: "#0c080b", acento: "#ff7a59" },
    ],
    // Empieza por la fiesta.
    orden: [
      "itinerario", "cuentaAtras", "galeria", "capitulos", "historia", "dressCode", "playlist",
      "alojamiento", "regalos", "rsvp", "hashtag", "album", "notas", "muro",
    ],
    apertura: video("neon", 2.6, "neon"),
    aperturaComponente: null,
    poster: "/tematicas/neon/poster-v.avif",
    absorbe: [],
  },
  {
    id: "fuego",
    demo: "rocio-y-andres",
    pareja: ["Rocío", "Andrés", "22 de mayo"],
    nombre: "Son de Fuego",
    gesto: "Al bajar, un abanico de terciopelo se abre como una falda en pleno giro.",
    para: "Parejas salseras o con raíces caribeñas, en una boda con orquesta y mucho baile. Pasión, pero de gala.",
    etiqueta: "Salsa",
    tipografia: { display: "Yeseva One", texto: "Work Sans" },
    ornamento: "punto",
    radio: "6px",
    modo: "claro",
    grano: 0.05,
    variantes: [
      { id: "rojo", nombre: "Rojo son", tinta: "#2a1411", papel: "#f8eee3", acento: "#b3261e" },
      { id: "burdeos", nombre: "Burdeos de terciopelo", tinta: "#2b1218", papel: "#f6ece4", acento: "#8f1f3d" },
      { id: "caribe", nombre: "Rosa caribe", tinta: "#22181a", papel: "#f6f0e6", acento: "#a8326e" },
    ],
    orden: [
      "capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "playlist", "alojamiento",
      "regalos", "rsvp", "galeria", "album", "hashtag", "notas", "muro",
    ],
    apertura: video("fuego", 2.6, "fuego"),
    aperturaComponente: null,
    poster: "/tematicas/fuego/poster-v.avif",
    absorbe: [],
  },
  {
    id: "bachata",
    demo: "elena-y-samuel",
    pareja: ["Elena", "Samuel", "11 de septiembre"],
    nombre: "Luna de Bachata",
    gesto: "Cuatro cuerdas de guitarra vibran con cada segundo que falta. Tocadlas y suenan.",
    para: "Parejas bachateras, o una boda íntima de noche, a la luz de las velas. Lenta y muy romántica.",
    etiqueta: "Bachata",
    tipografia: { display: "Gilda Display", texto: "Mulish" },
    ornamento: "punto",
    radio: "24px",
    modo: "oscuro",
    grano: 0.05,
    variantes: [
      { id: "luna", nombre: "Luna violeta", tinta: "#f2eaf3", papel: "#1b1324", acento: "#c99ad8" },
      { id: "madrugada", nombre: "Azul madrugada", tinta: "#ecebf5", papel: "#141626", acento: "#9fb0e8" },
      { id: "vela", nombre: "Rosa vela", tinta: "#f4e8ec", papel: "#1f1218", acento: "#e09bb0" },
    ],
    orden: [
      "capitulos", "historia", "itinerario", "cuentaAtras", "galeria", "dressCode", "alojamiento",
      "regalos", "rsvp", "playlist", "album", "hashtag", "notas", "muro",
    ],
    apertura: video("bachata", 2.6, "bachata"),
    aperturaComponente: null,
    poster: "/tematicas/bachata/poster-v.avif",
    absorbe: [],
  },
  // ── K3 (docs/16a §8–§10): Bosque Encantado, Órbita, Brazada. Sin capa de
  // apertura: la cabecera con vídeo ES la apertura (el vídeo de la casa
  // está en cada maqueta, `HERO` en pinar.tsx, orbita.tsx y brazada.tsx).
  {
    id: "pinar",
    demo: "lucia-y-bruno",
    pareja: ["Lucía", "Bruno", "25 de septiembre"],
    nombre: "Bosque Encantado",
    gesto: "Al bajar, los helechos se apartan y entráis en el bosque; al llegar a la fecha anochece y se encienden las luciérnagas.",
    para: "Boda en una finca entre pinos o robles, en el Pirineo, en Asturias o en una masía con bosque. Rústica de verdad.",
    etiqueta: "De bosque",
    tipografia: { display: "Young Serif", texto: "Karla" },
    ornamento: "rama",
    radio: "3px",
    modo: "claro",
    grano: 0.07,
    variantes: [
      { id: "pino", nombre: "Pino", tinta: "#1f2a22", papel: "#ece4d3", acento: "#2f5d3a" },
      { id: "eucalipto", nombre: "Eucalipto", tinta: "#1d2725", papel: "#eef0ea", acento: "#3f6b63" },
      { id: "roble", nombre: "Roble", tinta: "#2a2118", papel: "#f0e6d6", acento: "#6b4a2b" },
    ],
    orden: [
      "capitulos", "historia", "respiro", "itinerario", "cuentaAtras", "dressCode", "alojamiento",
      "regalos", "rsvp", "galeria", "playlist", "notas", "album", "hashtag", "muro",
    ],
    apertura: null,
    aperturaComponente: null,
    poster: "/tematicas/pinar/poster-v.avif",
    absorbe: [],
  },
  {
    id: "orbita",
    demo: "vega-y-dario",
    pareja: ["Vega", "Darío", "14 de agosto"],
    nombre: "Órbita",
    gesto: "Dos órbitas, cada una con vuestro nombre, se acercan con el pulgar hasta compartir una sola.",
    para: "Boda de noche bajo un cielo Starlight, en un observatorio o en Canarias. Para parejas de ciencia y de estrellas.",
    etiqueta: "Cósmica",
    tipografia: { display: "Josefin Sans", texto: "Sora" },
    ornamento: "estrella",
    radio: "14px",
    modo: "oscuro",
    grano: 0.04,
    variantes: [
      { id: "nebulosa", nombre: "Nebulosa", tinta: "#eceaf6", papel: "#0b0f24", acento: "#b9a6f2" },
      { id: "aurora", nombre: "Aurora", tinta: "#e6f3f0", papel: "#071a1f", acento: "#7fd8c2" },
      { id: "marte", nombre: "Marte", tinta: "#f4e9e4", papel: "#1a0e10", acento: "#e3a08a" },
    ],
    orden: [
      "capitulos", "historia", "respiro", "itinerario", "cuentaAtras", "dressCode", "rsvp",
      "alojamiento", "regalos", "notas", "galeria", "playlist", "album", "hashtag", "muro",
    ],
    apertura: null,
    aperturaComponente: null,
    poster: "/tematicas/orbita/poster-v.avif",
    absorbe: [],
  },
  {
    id: "brazada",
    demo: "marina-y-hugo",
    pareja: ["Marina", "Hugo", "4 de junio"],
    nombre: "Brazada",
    gesto: "Al bajar, la superficie del agua sube y os zambullís: la historia se lee con la luz bailando en el fondo.",
    para: "Parejas nadadoras, triatletas o de waterpolo; bodas junto a la piscina de un hotel o en un club náutico.",
    etiqueta: "Deportiva acuática",
    tipografia: { display: "Archivo", texto: "Lexend" },
    ornamento: "ola",
    radio: "14px",
    modo: "claro",
    grano: 0,
    variantes: [
      { id: "cian", nombre: "Cian", tinta: "#06303a", papel: "#f2fafb", acento: "#00707f" },
      { id: "lago", nombre: "Lago", tinta: "#0f2a26", papel: "#f1f7f3", acento: "#2a6b5a" },
      { id: "mar-abierto", nombre: "Mar abierto", tinta: "#0a2240", papel: "#f1f6fb", acento: "#1d5fa8" },
    ],
    orden: [
      "capitulos", "historia", "respiro", "itinerario", "cuentaAtras", "dressCode", "regalos",
      "alojamiento", "rsvp", "notas", "galeria", "album", "playlist", "hashtag", "muro",
    ],
    apertura: null,
    aperturaComponente: null,
    poster: "/tematicas/brazada/poster-v.avif",
    absorbe: [],
  },
  // ── K5 (docs/16b §6–§9): Lúpulo y Cobre, Noche de Estadio, Línea de Meta, Riviera
  {
    id: "lupulo",
    demo: "irene-y-mateo",
    pareja: ["Irene", "Mateo", "11 de septiembre"],
    nombre: "Lúpulo y Cobre",
    gesto: "Una etiqueta de cerveza de abadía con vuestros nombres. Al confirmar, chocan las jarras.",
    para: "Parejas cerveceras, o una boda en una fábrica, una nave de ladrillo o una masía con barra de grifos.",
    etiqueta: "Artesana",
    tipografia: { display: "Zilla Slab", texto: "Libre Franklin" },
    ornamento: "punto",
    radio: "4px",
    modo: "claro",
    grano: 0.06,
    variantes: [
      { id: "ambar", nombre: "Ámbar", tinta: "#241a10", papel: "#f2e8d5", acento: "#a9640f" },
      { id: "lupulo", nombre: "Lúpulo verde", tinta: "#1e2119", papel: "#ece6d8", acento: "#4f6b2e" },
      { id: "tostada", nombre: "Tostada", tinta: "#211812", papel: "#efe5d3", acento: "#7a3e1d" },
    ],
    orden: [
      "capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "alojamiento",
      "regalos", "rsvp", "galeria", "playlist", "album", "hashtag", "notas", "muro",
    ],
    apertura: video("lupulo", 4.0, "lupulo"),
    aperturaComponente: null,
    poster: "/tematicas/lupulo/poster-v.avif",
    absorbe: [],
  },
  {
    id: "estadio",
    demo: "lucia-y-dani",
    pareja: ["Lucía", "Dani", "19 de junio"],
    nombre: "Noche de Estadio",
    gesto: "Una entrada de estadio en relieve, vuestra alineación y, al confirmar… ¡gol!",
    para: "Parejas futboleras de cualquier equipo: los colores los elegís vosotros, sin escudos ni nombres.",
    etiqueta: "Futbolera",
    tipografia: { display: "Barlow Condensed", texto: "Barlow" },
    ornamento: "regla",
    radio: "8px",
    modo: "claro",
    grano: 0.04,
    variantes: [
      { id: "cesped", nombre: "Césped", tinta: "#111d17", papel: "#f3f1e7", acento: "#1d6a3a" },
      { id: "rojo", nombre: "Rojo pasión", tinta: "#1f1514", papel: "#f5f1ea", acento: "#b3202a" },
      { id: "azulgrana", nombre: "Azul y grana", tinta: "#121a2b", papel: "#f1f2f4", acento: "#1e3f8f" },
    ],
    // En el fútbol, lo primero que se mira es el marcador.
    orden: [
      "cuentaAtras", "capitulos", "historia", "itinerario", "dressCode", "alojamiento",
      "regalos", "rsvp", "galeria", "playlist", "album", "hashtag", "notas", "muro",
    ],
    apertura: video("estadio", 3.0, "estadio"),
    aperturaComponente: null,
    poster: "/tematicas/estadio/poster-v.avif",
    absorbe: [],
  },
  {
    id: "meta",
    demo: "sara-y-hugo",
    pareja: ["Sara", "Hugo", "5 de junio"],
    nombre: "Línea de Meta",
    gesto: "Un dorsal con vuestros nombres y una cinta de meta que se rompe al confirmar.",
    para: "Parejas que corren juntas: maratón, trail o triatlón. Energía, y la calma de haber llegado.",
    etiqueta: "Runners",
    tipografia: { display: "Saira", texto: "Albert Sans" },
    ornamento: "filete",
    radio: "10px",
    modo: "claro",
    grano: 0.03,
    variantes: [
      { id: "naranja", nombre: "Naranja meta", tinta: "#14161a", papel: "#f5f5f1", acento: "#e3492b" },
      { id: "pista", nombre: "Verde pista", tinta: "#12191a", papel: "#f3f5f2", acento: "#0d7a5e" },
      { id: "sprint", nombre: "Violeta sprint", tinta: "#17142a", papel: "#f4f3f7", acento: "#5b3fd6" },
    ],
    orden: [
      "capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "alojamiento",
      "regalos", "rsvp", "galeria", "playlist", "album", "hashtag", "notas", "muro",
    ],
    apertura: video("meta", 3.5, "meta"),
    aperturaComponente: null,
    poster: "/tematicas/meta/poster-v.avif",
    absorbe: [],
  },
  {
    id: "riviera",
    demo: "elena-y-marco",
    pareja: ["Elena", "Marco", "25 de septiembre"],
    nombre: "Riviera",
    gesto: "Un cuadro de relojes cromado cuenta las horas. Girad la llave y las agujas barren hasta el final.",
    para: "Parejas de coches clásicos y de alta costura, o una boda de etiqueta en un hotel de costa.",
    etiqueta: "Lujo silencioso",
    tipografia: { display: "Bodoni Moda", texto: "Hanken Grotesk" },
    ornamento: "filete",
    radio: "2px",
    modo: "claro",
    grano: 0.03,
    variantes: [
      { id: "azul", nombre: "Azul Riviera", tinta: "#1b1815", papel: "#f3ece1", acento: "#1f3b5c" },
      { id: "ingles", nombre: "Verde inglés", tinta: "#161b17", papel: "#f1eee6", acento: "#1f4a3a" },
      { id: "burdeos", nombre: "Burdeos de piel", tinta: "#221517", papel: "#f5ede8", acento: "#7a2233" },
    ],
    // Como Velo: sin hashtag, álbum ni lista destacados (si están, van a «Y además»).
    orden: [
      "capitulos", "historia", "itinerario", "dressCode", "cuentaAtras", "alojamiento",
      "regalos", "rsvp", "galeria", "notas", "muro",
    ],
    apertura: video("riviera", 3.0, "riviera"),
    aperturaComponente: null,
    poster: "/tematicas/riviera/poster-v.avif",
    absorbe: [],
  },
  // ─────────────── K2 · Blasón, Memorias, Pasaporte, Orilla (docs/16a §4–§7)
  {
    id: "blason",
    demo: "leonor-y-alvaro",
    pareja: ["Leonor", "Álvaro", "25 de septiembre"],
    nombre: "Blasón",
    gesto: "Un estandarte con vuestro escudo, un rastrillo que se abre y vuestro castillo, que se pinta en acuarela al bajar.",
    para: "Boda en castillo, parador, monasterio o cortijo señorial. Heráldica con aire, sin pesadez gótica.",
    etiqueta: "De castillo",
    tipografia: { display: "Cinzel Decorative", texto: "Crimson Pro" },
    ornamento: "lacre",
    radio: "2px",
    modo: "claro",
    grano: 0.06,
    variantes: [
      { id: "borgona", nombre: "Borgoña", tinta: "#2a1712", papel: "#f2e8d5", acento: "#6b1e2a" },
      { id: "azur", nombre: "Azur", tinta: "#14182a", papel: "#efe9db", acento: "#23386b" },
      { id: "sinople", nombre: "Sinople", tinta: "#17221a", papel: "#f0ead9", acento: "#2e4a3a" },
    ],
    orden: [
      "capitulos", "historia", "respiro", "cuentaAtras", "itinerario", "dressCode", "alojamiento",
      "regalos", "rsvp", "galeria", "playlist", "notas", "album", "hashtag", "muro",
    ],
    // Sin capa de apertura: el vídeo de la cabecera ES la apertura.
    apertura: null,
    aperturaComponente: null,
    poster: "/tematicas/blason/poster-v.avif",
    absorbe: [],
  },
  {
    id: "memorias",
    demo: "julia-y-mateo",
    pareja: ["Julia", "Mateo", "15 de mayo"],
    nombre: "Memorias",
    gesto: "Vuestro vídeo como una película de Super 8, y vuestra historia escribiéndose a máquina mientras se lee.",
    para: "Parejas de muchos años (y muchas cartas), bodas en masía, casa de campo o casino antiguo, y segundas bodas.",
    etiqueta: "Vintage",
    tipografia: { display: "Libre Caslon Display", texto: "Courier Prime" },
    ornamento: "cenefa",
    radio: "3px",
    modo: "claro",
    grano: 0.07,
    variantes: [
      { id: "sepia", nombre: "Sepia", tinta: "#3b2a1e", papel: "#efe4cf", acento: "#8b3f31" },
      { id: "rosa-seca", nombre: "Rosa seca", tinta: "#3a2427", papel: "#f3e6e1", acento: "#8c4556" },
      { id: "tinta-azul", nombre: "Tinta azul", tinta: "#1f2633", papel: "#eee8da", acento: "#34507a" },
    ],
    orden: [
      "capitulos", "historia", "respiro", "cuentaAtras", "itinerario", "dressCode", "alojamiento",
      "regalos", "rsvp", "galeria", "playlist", "notas", "album", "hashtag", "muro",
    ],
    apertura: null,
    aperturaComponente: null,
    poster: "/tematicas/memorias/poster-v.avif",
    absorbe: [],
  },
  {
    id: "pasaporte",
    demo: "celia-y-tomas",
    pareja: ["Celia", "Tomás", "5 de junio"],
    nombre: "Pasaporte",
    gesto: "Vuestro vídeo tras la ventanilla de un avión y un mapa donde vuestra ruta se traza con el dedo.",
    para: "Parejas que se conocieron viajando o viven lejos, bodas de destino y bodas con invitados de fuera.",
    etiqueta: "Viajera",
    tipografia: { display: "DM Serif Display", texto: "IBM Plex Sans" },
    ornamento: "punto",
    radio: "10px",
    modo: "claro",
    grano: 0.04,
    variantes: [
      { id: "tierra", nombre: "Tierra", tinta: "#2b2620", papel: "#f3eadb", acento: "#9a4a22" },
      { id: "oceano", nombre: "Océano", tinta: "#1c2629", papel: "#eef0ea", acento: "#2f5d62" },
      { id: "sabana", nombre: "Sabana", tinta: "#2c2716", papel: "#f4edd8", acento: "#7a5f1e" },
    ],
    orden: [
      "capitulos", "historia", "respiro", "cuentaAtras", "itinerario", "dressCode", "alojamiento",
      "regalos", "rsvp", "galeria", "playlist", "notas", "album", "hashtag", "muro",
    ],
    apertura: null,
    aperturaComponente: null,
    poster: "/tematicas/pasaporte/poster-v.avif",
    absorbe: [],
  },
  {
    id: "orilla",
    demo: "paula-y-marc",
    pareja: ["Paula", "Marc", "10 de julio"],
    nombre: "Orilla",
    gesto: "Vuestro vídeo termina en una ola de acuarela que se retira con el dedo y deja la invitación en la arena.",
    para: "Boda en la playa, en una cala, en un chiringuito elegante o en una terraza frente al mar, de día.",
    etiqueta: "De playa",
    tipografia: { display: "Bellefair", texto: "Nunito Sans" },
    ornamento: "ola",
    radio: "18px",
    modo: "claro",
    grano: 0.05,
    variantes: [
      { id: "turquesa", nombre: "Turquesa", tinta: "#0f2f3a", papel: "#f7f4ee", acento: "#0e6973" },
      { id: "coral", nombre: "Coral", tinta: "#3a1f1a", papel: "#fbf3ee", acento: "#a6452e" },
      { id: "atardecer", nombre: "Atardecer", tinta: "#2e2140", papel: "#f8f1ee", acento: "#7a4a8a" },
    ],
    orden: [
      "capitulos", "historia", "respiro", "cuentaAtras", "itinerario", "dressCode", "alojamiento",
      "regalos", "rsvp", "galeria", "playlist", "notas", "album", "hashtag", "muro",
    ],
    apertura: null,
    aperturaComponente: null,
    poster: "/tematicas/orilla/poster-v.avif",
    absorbe: [],
  },
];

/**
 * El vídeo temático de la cabecera de cada plantilla (cuando la pareja no
 * ha subido el suyo a `tema.heroVideo`). De momento reutiliza el metraje de
 * `public/aperturas/*`; la gradación de color de cada tema es CSS.
 */
export const HERO_TEMATICO: Record<"regencia" | "aire" | "cuento", {
  vertical: string;
  horizontal: string;
  poster: string;
  posterHorizontal: string;
  webm: string;
  webmHorizontal: string;
}> = {
  regencia: {
    vertical: "/tematicas/regencia/hero-v.mp4",
    horizontal: "/tematicas/regencia/hero-h.mp4",
    poster: "/tematicas/regencia/poster-v.avif",
    posterHorizontal: "/tematicas/regencia/poster-h.avif",
    webm: "/tematicas/regencia/hero-v.webm",
    webmHorizontal: "/tematicas/regencia/hero-h.webm",
  },
  aire: {
    vertical: "/tematicas/aire/hero-v.mp4",
    horizontal: "/tematicas/aire/hero-h.mp4",
    poster: "/tematicas/aire/poster-v.avif",
    posterHorizontal: "/tematicas/aire/poster-h.avif",
    webm: "/tematicas/aire/hero-v.webm",
    webmHorizontal: "/tematicas/aire/hero-h.webm",
  },
  cuento: {
    vertical: "/tematicas/cuento/hero-v.mp4",
    horizontal: "/tematicas/cuento/hero-h.mp4",
    poster: "/tematicas/cuento/poster-v.avif",
    posterHorizontal: "/tematicas/cuento/poster-h.avif",
    webm: "/tematicas/cuento/hero-v.webm",
    webmHorizontal: "/tematicas/cuento/hero-h.webm",
  },
};
