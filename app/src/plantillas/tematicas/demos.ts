import type { Bloque, Invitacion, Parada, Tema } from "../../lib/tipos.ts";

/**
 * Las bodas de muestra de las plantillas temáticas (K1). Solo datos: las
 * añade `src/data/demo.ts` a su lista. Bodas y parejas de ejemplo, con el
 * protocolo de una boda española (ceremonia, cóctel, banquete, baile y
 * recena; padrinos; autobús) y fotos propias de Invitoo (IA, personas ficticias).
 */
type Datos = {
  slug: string;
  plantilla: Invitacion["plantilla"];
  a: string;
  b: string;
  fecha: string;
  tema: Tema;
  apertura?: Invitacion["apertura"];
  frase: string;
  foto?: string;
  album: string[];
  capitulos: { cuando: string; titulo: string; texto: string; foto?: string }[];
  paradas: Parada[];
  dress: string;
  paleta: string[];
  hoteles: { nombre: string; nota?: string; enlace?: string }[];
  iban: string;
  bizum: string;
  titular: string;
  hashtag: string;
  notas: { titulo: string; texto: string }[];
  titulos: { dia?: string; historia?: string; galeria?: string; playlist?: string; regalos?: string; album?: string };
  notaRegalo: string;
};

function boda(d: Datos): Invitacion {
  const bloques: Bloque[] = [
    { t: "portada", frase: d.frase, foto: d.foto },
    { t: "cuentaAtras" },
    { t: "itinerario", paradas: d.paradas, titulo: d.titulos.dia },
    { t: "capitulos", titulo: d.titulos.historia, capitulos: d.capitulos },
    { t: "galeria", fotos: d.album, titulo: d.titulos.galeria },
    { t: "dressCode", nota: d.dress, paleta: d.paleta },
    { t: "alojamiento", opciones: d.hoteles },
    { t: "playlist", spotify: "https://open.spotify.com/", titulo: d.titulos.playlist },
    { t: "notas", items: d.notas },
    { t: "hashtag", etiqueta: d.hashtag },
    { t: "regalos", iban: d.iban, bizum: d.bizum, titular: d.titular, titulo: d.titulos.regalos, nota: d.notaRegalo },
    { t: "album", subidaInvitados: true, titulo: d.titulos.album },
    { t: "muro" },
    { t: "rsvp", pideMenu: true, pideAlergias: true, pideBus: true },
  ];
  return {
    slug: d.slug,
    plantilla: d.plantilla,
    estado: "publicada",
    pareja: { a: d.a, b: d.b, fecha: d.fecha, hashtag: d.hashtag },
    tema: d.tema,
    apertura: d.apertura,
    musica: { url: "/musica/demo.m4a", titulo: `La canción de ${d.a} y ${d.b}`, deDedicalo: true },
    bloques,
  };
}

const video = (id: string, rotuloEn: number, tema: string): Invitacion["apertura"] => ({
  vertical: `/aperturas/${id}/vertical.mp4`,
  horizontal: `/aperturas/${id}/horizontal.mp4`,
  poster: `/tematicas/${tema}/apertura.avif`,
  rotuloEn,
  rotuloClaro: true,
});

/** Fotos propias de Invitoo (FLUX.2 klein, personas ficticias): `public/generadas`. */
const f = (n: string) => `/generadas/${n}-1080.avif`;

export const DEMOS_TEMATICAS: Invitacion[] = [
  // ───────────────────────────────────────────── Alta sociedad (Regencia)
  boda({
    slug: "olivia-y-edmundo",
    plantilla: "regencia",
    a: "Olivia",
    b: "Edmundo",
    fecha: "2027-06-19T18:00:00+02:00",
    tema: {
      tinta: "#1e2a3a",
      papel: "#f2f4f6",
      acento: "#3e5f82",
      grano: 0.04,
      // El sobre con lacre de oro sobre papel marfil y forro de damasco azul.
      sobre: { activo: true, forro: "damasco", forroColor: "#8fa7c4", papel: "#f6efe2", lacre: "iniciales", lacreColor: "oro", matasellos: true, ciudad: "Aranjuez" },
      movimiento: { estilo: "romantico", entrada: "fundido-desenfoque", flores: "ninguna", particulas: "ninguna", petalosAlTocar: true, colorVivo: false },
    },
    frase: "Tenemos el honor de pediros el placer de vuestra compañía en el día más feliz de nuestra temporada.",
    album: [f("regencia-album-1"), f("regencia-album-2"), f("regencia-album-3"), f("regencia-album-4")],
    capitulos: [
      { cuando: "Primavera de 2019 · Real Jardín Botánico", titulo: "Un baile sin carné", texto: "Ella había venido a dibujar glicinias; él, a buscar a un amigo que nunca llegó. Compartieron banco, lápiz y una tormenta.", foto: f("regencia-portada") },
      { cuando: "2021 · Lisboa", titulo: "La carta", texto: "Edmundo escribió una carta a mano, con sello y todo. Olivia aún la guarda en la caja de los guantes." },
      { cuando: "Otoño de 2025 · Aranjuez", titulo: "La pregunta", texto: "En el Jardín del Príncipe, al caer la tarde. Él se arrodilló sobre la grava y a ella se le olvidó contestar.", foto: f("regencia-poster-h") },
      { cuando: "19 de junio de 2027", titulo: "Nuestra gran temporada", texto: "Queremos celebrarlo con vals, con guantes y, sobre todo, con vosotros." },
    ],
    paradas: [
      { titulo: "La ceremonia", hora: "18:00", icono: "iglesia", lugar: "Capilla del Real Palacio", direccion: "Plaza de Parejas, s/n, 28300 Aranjuez, Madrid", mapa: "https://maps.google.com/?q=Palacio+Real+de+Aranjuez" },
      { titulo: "Té y champán en los jardines", hora: "19:30", icono: "copas", lugar: "Jardín del Parterre", direccion: "Calle de la Reina, 28300 Aranjuez, Madrid" },
      { titulo: "La cena de gala", hora: "21:00", icono: "plato", lugar: "Palacio de Silvela", direccion: "Calle del Capitán, 59, 28300 Aranjuez, Madrid" },
      { titulo: "El primer vals", hora: "23:30", icono: "nota", lugar: "Salón de baile del Palacio de Silvela", direccion: "Calle del Capitán, 59, 28300 Aranjuez, Madrid" },
    ],
    dress: "Etiqueta de tarde. Ellas, vestido largo o de cóctel en tonos pastel; guantes y tocado, si os apetece. Ellos, chaqué o traje oscuro. Que nadie venga de blanco, que ese día ya está cogido.",
    paleta: ["#a9bcd6", "#e9c8c3", "#c9b8dc", "#f1e6cf"],
    hoteles: [
      { nombre: "Hotel NH Collection Palacio de Aranjuez", nota: "A 5 minutos andando del palacio, desde 120 €. Código OLIVIAYEDMUNDO", enlace: "https://maps.google.com/?q=NH+Collection+Palacio+de+Aranjuez" },
      { nombre: "Hotel Jardín de Aranjuez", nota: "Junto al Jardín del Príncipe, desde 85 €", enlace: "https://maps.google.com/?q=Hotel+Jardin+Aranjuez" },
    ],
    iban: "ES12 2100 0418 4502 0005 1332",
    bizum: "634 21 08 77",
    titular: "Olivia Mendoza y Edmundo Álvarez",
    hashtag: "OliviayEdmundo",
    notas: [
      { titulo: "Nuestros padrinos", texto: "Nos acompañan al altar Carmen, la madre de Edmundo, y Javier, el padre de Olivia." },
      { titulo: "Hay autobús desde Madrid", texto: "Sale de Atocha a las 16:45 y vuelve a la 1:30 y a las 4:00. Marcadlo al confirmar." },
      { titulo: "Los niños son bienvenidos", texto: "Habrá un salón de juegos con cuidadoras durante la cena." },
    ],
    titulos: { dia: "El orden del día", historia: "Crónica de un cortejo", galeria: "Retratos", playlist: "La música del baile", regalos: "Un obsequio", album: "Vuestras fotos" },
    notaRegalo: "Vuestra presencia es el mejor regalo. Si además deseáis tener un detalle, nos ayudará con el viaje de novios.",
  }),

  // ───────────────────────────────────────────────────── Elegancia pura
  boda({
    slug: "blanca-y-alonso",
    plantilla: "aire",
    a: "Blanca",
    b: "Alonso",
    fecha: "2027-10-02T12:30:00+02:00",
    tema: {
      tinta: "#1a1a1a",
      papel: "#faf9f6",
      acento: "#8a6d33",
      grano: 0,
      movimiento: { estilo: "sereno", entrada: "fundido", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false, ornamentos: true },
    },
    apertura: video("tinta", 3.0, "aire"),
    frase: "Sin prisa y con lo esencial: vosotros.",
    album: [f("aire-album-1"), f("aire-album-2"), f("aire-album-3"), f("aire-album-4")],
    capitulos: [
      { cuando: "2018 · Madrid", titulo: "Una exposición", texto: "Coincidimos delante del mismo cuadro durante veinte minutos. Ninguno de los dos lo miraba ya.", foto: f("aire-portada") },
      { cuando: "2022 · Nuestra casa", titulo: "Una mesa larga", texto: "Compramos una mesa para doce y una vajilla blanca. Desde entonces, los domingos son vuestros." },
      { cuando: "2 de octubre de 2027", titulo: "Lo esencial", texto: "Una ceremonia breve, una comida larga y la gente que queremos." },
    ],
    paradas: [
      { titulo: "La ceremonia civil", hora: "12:30", icono: "anillos", lugar: "Palacio de Fernán Núñez", direccion: "Calle de Santa Isabel, 44, 28012 Madrid", mapa: "https://maps.google.com/?q=Palacio+de+Fernan+Nunez+Madrid" },
      { titulo: "El aperitivo", hora: "13:30", icono: "copas", lugar: "Patio del palacio", direccion: "Calle de Santa Isabel, 44, 28012 Madrid" },
      { titulo: "La comida", hora: "15:00", icono: "plato", lugar: "Salón de los Espejos", direccion: "Calle de Santa Isabel, 44, 28012 Madrid" },
      { titulo: "La sobremesa y el baile", hora: "18:30", icono: "nota", lugar: "Salón de los Espejos", direccion: "Calle de Santa Isabel, 44, 28012 Madrid" },
    ],
    dress: "Formal de día. Colores neutros, tejidos nobles y nada de estampados grandes. Si dudáis, el negro y el camel siempre funcionan.",
    paleta: ["#1b1a18", "#c9b48a", "#e9e4da", "#8c8a85"],
    hoteles: [
      { nombre: "Only YOU Boutique Hotel", nota: "A 7 minutos andando, desde 160 €", enlace: "https://maps.google.com/?q=Only+YOU+Boutique+Hotel+Madrid" },
      { nombre: "Hotel Lope de Vega", nota: "Barrio de las Letras, desde 110 €", enlace: "https://maps.google.com/?q=Hotel+Lope+de+Vega+Madrid" },
    ],
    iban: "ES76 0182 2370 4102 0161 6273",
    bizum: "655 90 12 48",
    titular: "Blanca Ortega y Alonso Ibarra",
    hashtag: "BlancaYAlonso",
    notas: [
      { titulo: "Puntualidad", texto: "La ceremonia es breve y empieza a su hora. Las puertas se cierran a las 12:25." },
      { titulo: "Padrinos", texto: "Nos acompañan nuestras madres, Pilar y Mercedes." },
      { titulo: "Aparcamiento", texto: "El más cercano es el de la plaza de Santa Ana. Mejor en metro: Antón Martín, a dos minutos." },
    ],
    titulos: { dia: "El día", historia: "Nosotros", galeria: "Instantes", regalos: "Un detalle", album: "Vuestras fotos" },
    notaRegalo: "Lo único imprescindible es que vengáis. Si queréis tener un detalle, aquí están los datos.",
  }),

  // ───────────────────────────────────────────────────── Cuento de hadas
  boda({
    slug: "aurora-y-leo",
    plantilla: "cuento",
    a: "Aurora",
    b: "Leo",
    fecha: "2027-12-18T17:00:00+01:00",
    tema: {
      tinta: "#f4ecdc",
      papel: "#1d1030",
      acento: "#d8b45e",
      grano: 0.05,
      movimiento: { estilo: "cinematografico", entrada: "fundido-desenfoque", flores: "ninguna", particulas: "destellos", petalosAlTocar: false, colorVivo: false },
    },
    apertura: video("constelacion", 3.5, "cuento"),
    frase: "Érase una vez dos personas que se encontraron en la página más inesperada.",
    album: [f("cuento-album-1"), f("cuento-album-2"), f("cuento-album-3"), f("cuento-album-4")],
    capitulos: [
      { cuando: "Capítulo I · 2017", titulo: "La biblioteca", texto: "Ella buscaba un libro de hadas para su sobrina; él, uno de mapas. Era el mismo estante y solo quedaba un ejemplar de cada.", foto: f("cuento-portada") },
      { cuando: "Capítulo II · 2020", titulo: "El bosque", texto: "Una excursión a la Fageda d'en Jordà, un camino equivocado y una tarde entera perdidos sin ninguna prisa por volver." },
      { cuando: "Capítulo III · 2025", titulo: "El anillo", texto: "Leo lo escondió en un libro antiguo, en un hueco recortado entre las páginas. Aurora tardó tres capítulos en encontrarlo.", foto: f("cuento-apertura") },
      { cuando: "Capítulo IV · 18 de diciembre de 2027", titulo: "Y fueron felices", texto: "Falta escribir el final, y queremos que estéis en él." },
    ],
    paradas: [
      { titulo: "La ceremonia en el castillo", hora: "17:00", icono: "iglesia", lugar: "Castillo de Santa Florentina", direccion: "Carrer Dr. Arnau, s/n, 08370 Canet de Mar, Barcelona", mapa: "https://maps.google.com/?q=Castell+de+Santa+Florentina" },
      { titulo: "El cóctel de las luces", hora: "18:30", icono: "copas", lugar: "Los jardines del castillo", direccion: "Carrer Dr. Arnau, s/n, 08370 Canet de Mar, Barcelona" },
      { titulo: "El banquete", hora: "20:30", icono: "plato", lugar: "Gran salón", direccion: "Carrer Dr. Arnau, s/n, 08370 Canet de Mar, Barcelona" },
      { titulo: "El baile hasta medianoche (y más)", hora: "23:30", icono: "nota", lugar: "La sala de los tapices", direccion: "Carrer Dr. Arnau, s/n, 08370 Canet de Mar, Barcelona" },
    ],
    dress: "Etiqueta de invierno. Terciopelo, brillo y colores de joya: púrpura, esmeralda, azul noche y oro. Una capa o un abrigo, que los jardines son de cuento pero en diciembre refresca.",
    paleta: ["#4b2a6b", "#1f4d3f", "#1b2a52", "#d8b45e"],
    hoteles: [
      { nombre: "Hotel Carlemany Canet", nota: "A 4 minutos del castillo, desde 90 €", enlace: "https://maps.google.com/?q=Canet+de+Mar+hotel" },
      { nombre: "Hotel Colon Caldes d'Estrac", nota: "Frente al mar, a 10 minutos, desde 110 €", enlace: "https://maps.google.com/?q=Hotel+Colon+Caldes+d+Estrac" },
    ],
    iban: "ES91 2100 3333 1122 0045 9876",
    bizum: "622 47 81 09",
    titular: "Aurora Puig y Leo Marín",
    hashtag: "AuroraYLeo",
    notas: [
      { titulo: "Hay autobús desde Barcelona", texto: "Sale de plaza de Catalunya a las 15:45 y vuelve a la 1:00 y a las 3:30." },
      { titulo: "Nuestros padrinos", texto: "Montse, la abuela de Aurora, y Andrés, el hermano de Leo." },
      { titulo: "Para los pequeños", texto: "Habrá un rincón de cuentos con cuentacuentos durante el banquete." },
    ],
    titulos: { dia: "El día del cuento", historia: "Érase una vez", galeria: "Ilustraciones", playlist: "La música del baile", regalos: "Un deseo", album: "Vuestras fotos" },
    notaRegalo: "Que vengáis ya es magia. Si además queréis cumplir un deseo, nos ayudará con nuestro viaje.",
  }),
  // ───────────────────────────────────────────── K4 · Pase VIP (festival)
  boda({
    slug: "carla-y-dani",
    plantilla: "festival",
    a: "Carla",
    b: "Dani",
    fecha: "2027-07-17T19:00:00+02:00",
    tema: {
      tinta: "#1c1a2b",
      papel: "#f4efe4",
      acento: "#c8324f",
      grano: 0.04,
      movimiento: { estilo: "sereno", entrada: "ascenso", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: true },
    },
    apertura: video("constelacion", 2.6, "festival"),
    frase: "Nos conocimos delante de un escenario. Ahora queremos que el escenario seáis vosotros.",
    album: [f("festival-album-1"), f("festival-album-2"), f("festival-album-3"), f("festival-album-4")],
    capitulos: [
      { cuando: "Verano de 2016 · Primera fila", titulo: "El primer concierto", texto: "Ella perdió una pulsera, él la encontró en el césped. Tardó tres canciones en atreverse a devolvérsela." },
      { cuando: "2019 · Lavapiés", titulo: "La mudanza", texto: "Un tercero sin ascensor, dos bicis y una colección de entradas que todavía no cabe en ningún cajón." },
      { cuando: "2022 · De ruta", titulo: "Doce festivales", texto: "Tiendas de campaña, autobuses nocturnos y la misma lista de canciones para volver a casa." },
      { cuando: "Agosto de 2025 · Al atardecer", titulo: "La pedida", texto: "Durante la última canción de la noche, Dani sacó un anillo de la riñonera. Carla dijo que sí antes de que acabara el estribillo." },
    ],
    paradas: [
      { titulo: "La ceremonia", hora: "19:00", icono: "anillos", lugar: "Finca El Olivar", direccion: "Camino de los Olivos, s/n, 46190 Riba-roja de Túria, Valencia", mapa: "https://maps.google.com/?q=Riba-roja+de+Turia" },
      { titulo: "El cóctel al atardecer", hora: "20:00", icono: "copas", lugar: "La pradera de la finca", direccion: "Camino de los Olivos, s/n, 46190 Riba-roja de Túria, Valencia" },
      { titulo: "La cena bajo las guirnaldas", hora: "21:30", icono: "plato", lugar: "El patio de los olivos", direccion: "Camino de los Olivos, s/n, 46190 Riba-roja de Túria, Valencia" },
      { titulo: "El escenario principal", hora: "00:00", icono: "nota", lugar: "La carpa", direccion: "Camino de los Olivos, s/n, 46190 Riba-roja de Túria, Valencia" },
    ],
    dress: "Verano y al aire libre. Colores vivos, lino, flores y zapato cómodo: hay césped y se baila hasta tarde. Una chaqueta fina para cuando refresque.",
    paleta: ["#c8324f", "#e9a23b", "#1f6f8b", "#f2d8c4"],
    hoteles: [
      { nombre: "Hotel Rural Riba-roja", nota: "A 10 minutos de la finca, desde 85 €. Decid que venís a la boda de Carla y Dani", enlace: "https://maps.google.com/?q=hotel+Riba-roja+de+Turia" },
      { nombre: "Hoteles en el centro de Valencia", nota: "A 25 minutos, con autobús de vuelta a las 2:00 y a las 5:00", enlace: "https://maps.google.com/?q=hoteles+Valencia+centro" },
    ],
    iban: "ES33 0081 0216 7300 0118 4422",
    bizum: "611 42 87 30",
    titular: "Carla Ferrer y Daniel Soler",
    hashtag: "CarlaYDaniEnDirecto",
    notas: [
      { titulo: "Hay autobús desde Valencia", texto: "Sale de la plaza de España a las 18:00 y vuelve a las 2:00 y a las 5:00. Marcadlo al confirmar." },
      { titulo: "Los niños son bienvenidos", texto: "Habrá zona de juegos con monitores y cascos para sus oídos cuando suba la música." },
      { titulo: "Nuestros padrinos", texto: "Nos acompañan Lola, la hermana de Carla, y Paco, el padre de Dani." },
    ],
    titulos: { dia: "Horarios por escenario", historia: "El line-up de nuestra historia", galeria: "Desde la primera fila", playlist: "Pedid vuestra canción", regalos: "Un detalle", album: "Vuestras fotos" },
    notaRegalo: "Lo mejor que nos podéis regalar es veros bailar. Si además queréis tener un detalle, nos ayudará con el viaje.",
  }),

  // ───────────────────────────────────────────── K4 · Cara A (rock & roll)
  boda({
    slug: "alba-y-marcos",
    plantilla: "vinilo",
    a: "Alba",
    b: "Marcos",
    fecha: "2027-10-16T18:30:00+02:00",
    tema: {
      tinta: "#eee8df",
      papel: "#111011",
      acento: "#c42f27",
      grano: 0.06,
      movimiento: { estilo: "cinematografico", entrada: "fundido-desenfoque", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    apertura: video("velo", 2.6, "vinilo"),
    frase: "Hay canciones que se ponen una vez y no se quitan nunca. Nosotros somos una de esas.",
    album: [f("vinilo-album-1"), f("vinilo-album-2"), f("vinilo-album-3"), f("vinilo-album-4")],
    capitulos: [
      { cuando: "2015 · Una sala pequeña", titulo: "Intro", texto: "Él tocaba la batería en un grupo que nunca grabó nada. Ella estaba en primera fila y se sabía todas las canciones." },
      { cuando: "2018 · El local de ensayo", titulo: "Ensayo general", texto: "Alba empezó a cantar los coros. Marcos empezó a componer canciones que no eran para el grupo." },
      { cuando: "2021 · Nuestro piso", titulo: "Cara B", texto: "Un tocadiscos heredado, trescientos vinilos y un gato que se llama Lemmy." },
      { cuando: "Primavera de 2026", titulo: "El bis", texto: "Marcos se lo pidió al terminar un concierto, desde el escenario, con el micro apagado. Solo lo oyó ella." },
    ],
    paradas: [
      { titulo: "La ceremonia", hora: "18:30", icono: "anillos", lugar: "Masía Can Roure", direccion: "Camí de Can Roure, s/n, 08188 Vallromanes, Barcelona", mapa: "https://maps.google.com/?q=Vallromanes" },
      { titulo: "El vermú con banda", hora: "19:30", icono: "copas", lugar: "El patio de la masía", direccion: "Camí de Can Roure, s/n, 08188 Vallromanes, Barcelona" },
      { titulo: "La cena", hora: "21:00", icono: "plato", lugar: "La bodega", direccion: "Camí de Can Roure, s/n, 08188 Vallromanes, Barcelona" },
      { titulo: "En directo, hasta que nos echen", hora: "23:30", icono: "nota", lugar: "La nave", direccion: "Camí de Can Roure, s/n, 08188 Vallromanes, Barcelona" },
    ],
    dress: "Rock elegante. Negro, cuero, terciopelo y algo rojo si os apetece. Traje sí, corbata opcional. Las botas son bienvenidas.",
    paleta: ["#141414", "#6b4a35", "#b32a22"],
    hoteles: [
      { nombre: "Hotel en Vallromanes", nota: "A 5 minutos de la masía, desde 95 €. Código ALBAYMARCOS", enlace: "https://maps.google.com/?q=hotel+Vallromanes" },
      { nombre: "Hoteles en Granollers", nota: "A 15 minutos, con autobús de vuelta a las 3:00", enlace: "https://maps.google.com/?q=hoteles+Granollers" },
    ],
    iban: "ES21 2100 0813 6102 0045 7789",
    bizum: "655 18 24 90",
    titular: "Alba Roig y Marcos Castells",
    hashtag: "AlbaYMarcosEnDirecto",
    notas: [
      { titulo: "Hay autobús desde Barcelona", texto: "Sale de plaza de Catalunya a las 17:15 y vuelve a la 1:30 y a las 4:00." },
      { titulo: "Tocan amigos", texto: "La banda del vermú son los compañeros de grupo de Marcos. Si traéis vuestro instrumento, quizá os toque subir." },
      { titulo: "Nuestros padrinos", texto: "Nos acompañan Mercè, la abuela de Alba, y Toni, el hermano de Marcos." },
    ],
    titulos: { dia: "Setlist", historia: "Tracklist de nuestra historia", galeria: "Libreto", playlist: "Las canciones de la noche", regalos: "Créditos", album: "Vuestras fotos" },
    notaRegalo: "Que vengáis a cantar con nosotros es el mejor regalo. Si queréis tener un detalle, nos ayudará con el viaje.",
  }),

  // ───────────────────────────────────── K4 · Neón de Medianoche (fiesta)
  boda({
    slug: "nerea-y-adrian",
    plantilla: "neon",
    a: "Nerea",
    b: "Adrián",
    fecha: "2027-09-04T21:00:00+02:00",
    tema: {
      tinta: "#f1edf6",
      papel: "#0a0910",
      acento: "#ff5fa8",
      grano: 0.03,
      movimiento: { estilo: "cinematografico", entrada: "fundido-desenfoque", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    apertura: video("bruma", 2.6, "neon"),
    frase: "Nos conocimos a las dos de la mañana y desde entonces la noche es nuestra. Esta vez, también vuestra.",
    album: [f("neon-album-1"), f("neon-album-2"), f("neon-album-3"), f("neon-album-4")],
    capitulos: [
      { cuando: "2019 · Una azotea en Madrid", titulo: "La primera canción", texto: "Sonó la misma canción dos veces seguidas. A la segunda, ya estábamos bailando.", foto: f("neon-detalle") },
      { cuando: "2022 · Nuestro barrio", titulo: "Las llaves", texto: "Una copia de las llaves, una planta en el balcón y un altavoz que nunca se apaga." },
      { cuando: "Fin de año de 2025", titulo: "Las doce", texto: "Con la última campanada, Adrián se arrodilló entre confeti. Nerea se comió las uvas después de decir que sí.", foto: f("neon-poster") },
    ],
    paradas: [
      { titulo: "La ceremonia", hora: "21:00", icono: "anillos", lugar: "Azotea del Hotel Alcalá", direccion: "Calle de Alcalá, 66, 28009 Madrid", mapa: "https://maps.google.com/?q=Calle+de+Alcala+66+Madrid" },
      { titulo: "El cóctel con vistas", hora: "21:45", icono: "copas", lugar: "La terraza", direccion: "Calle de Alcalá, 66, 28009 Madrid" },
      { titulo: "La cena", hora: "22:30", icono: "plato", lugar: "El salón de cristal", direccion: "Calle de Alcalá, 66, 28009 Madrid" },
      { titulo: "La pista, hasta que salga el sol", hora: "00:30", icono: "nota", lugar: "La sala de abajo", direccion: "Calle de Alcalá, 66, 28009 Madrid" },
    ],
    dress: "Noche y brillo. Negro, metalizados y algún toque de color. Tacón o zapatilla, pero que se pueda bailar muchas horas.",
    paleta: ["#0d0c12", "#c9c9d6", "#ff5fa8", "#9b7bff"],
    hoteles: [
      { nombre: "Hotel Alcalá", nota: "El mismo de la boda: bajáis en ascensor. Desde 140 €. Código NEREAYADRIAN", enlace: "https://maps.google.com/?q=Calle+de+Alcala+66+Madrid" },
      { nombre: "Hoteles en el barrio de Salamanca", nota: "A 5–10 minutos andando, desde 110 €", enlace: "https://maps.google.com/?q=hoteles+barrio+de+Salamanca+Madrid" },
    ],
    iban: "ES60 0049 1500 0512 3456 7892",
    bizum: "622 90 13 57",
    titular: "Nerea Gil y Adrián Montero",
    hashtag: "NereaYAdrianHastaElAmanecer",
    notas: [
      { titulo: "Cómo llegar", texto: "En metro, Retiro o Príncipe de Vergara, a dos minutos. No hay aparcamiento: mejor taxi o transporte público." },
      { titulo: "Recena", texto: "A las 3:00 hay recena para recargar fuerzas. Nadie se va a casa con hambre." },
      { titulo: "Nuestros padrinos", texto: "Nos acompañan Rosa, la madre de Nerea, y Javi, el mejor amigo de Adrián." },
    ],
    titulos: { dia: "El set de la noche", historia: "Así empezó", galeria: "Con flash", playlist: "Pedid vuestro tema", regalos: "Un detalle", album: "Vuestras fotos" },
    notaRegalo: "Que vengáis a bailar ya es el regalo. Si además queréis tener un detalle, nos ayudará con la luna de miel.",
  }),

  // ───────────────────────────────────────────── K4 · Son de Fuego (salsa)
  boda({
    slug: "rocio-y-andres",
    plantilla: "fuego",
    a: "Rocío",
    b: "Andrés",
    fecha: "2027-05-22T19:30:00+02:00",
    tema: {
      tinta: "#2a1411",
      papel: "#f8eee3",
      acento: "#b3261e",
      grano: 0.05,
      movimiento: { estilo: "romantico", entrada: "ascenso", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: true },
    },
    apertura: video("terracota", 2.6, "fuego"),
    frase: "Aprendimos a bailar juntos sin pisarnos. Ahora queremos bailar con vosotros toda la noche.",
    album: [f("fuego-album-1"), f("fuego-album-2"), f("fuego-album-3"), f("fuego-album-4")],
    capitulos: [
      { cuando: "2017 · Una escuela de baile", titulo: "El primer paso", texto: "Rocío necesitaba pareja para la clase de los jueves. Andrés llegó tarde, con dos pies izquierdos y una sonrisa." },
      { cuando: "2019 · Sevilla", titulo: "El primer congreso", texto: "Tres días bailando sin dormir. Volvimos sin voz y con una certeza." },
      { cuando: "2021 · Nuestra casa", titulo: "La cocina", texto: "Desde entonces se baila mientras se cocina. Y se cocina poco." },
      { cuando: "Navidad de 2025", titulo: "La vuelta", texto: "En mitad de una vuelta, Andrés se quedó de rodillas. Rocío creyó que se había caído." },
    ],
    paradas: [
      { titulo: "La ceremonia", hora: "19:30", icono: "anillos", lugar: "Hacienda Los Naranjos", direccion: "Carretera de Utrera, km 4, 41500 Alcalá de Guadaíra, Sevilla", mapa: "https://maps.google.com/?q=Alcala+de+Guadaira" },
      { titulo: "El cóctel con orquesta", hora: "20:30", icono: "copas", lugar: "El patio de los naranjos", direccion: "Carretera de Utrera, km 4, 41500 Alcalá de Guadaíra, Sevilla" },
      { titulo: "La cena", hora: "22:00", icono: "plato", lugar: "El salón de los arcos", direccion: "Carretera de Utrera, km 4, 41500 Alcalá de Guadaíra, Sevilla" },
      { titulo: "La salsa, con orquesta en directo", hora: "00:00", icono: "nota", lugar: "La pista del patio", direccion: "Carretera de Utrera, km 4, 41500 Alcalá de Guadaíra, Sevilla" },
    ],
    dress: "Elegante y para bailar. Rojos, tostados y dorados, telas con caída y ningún tacón que no aguante una vuelta.",
    paleta: ["#b3261e", "#e07a2c", "#b8913f", "#2a1411"],
    hoteles: [
      { nombre: "Hotel en Alcalá de Guadaíra", nota: "A 10 minutos de la hacienda, desde 80 €", enlace: "https://maps.google.com/?q=hotel+Alcala+de+Guadaira" },
      { nombre: "Hoteles en Sevilla", nota: "A 20 minutos, con autobús de vuelta a las 2:30 y a las 5:00", enlace: "https://maps.google.com/?q=hoteles+Sevilla+centro" },
    ],
    iban: "ES44 2100 2345 6701 0012 3488",
    bizum: "644 75 20 13",
    titular: "Rocío Medina y Andrés Paredes",
    hashtag: "RocioYAndresBailan",
    notas: [
      { titulo: "Hay autobús desde Sevilla", texto: "Sale de la Puerta de Jerez a las 18:30 y vuelve a las 2:30 y a las 5:00." },
      { titulo: "Clase exprés", texto: "Antes de la cena, diez minutos de clase de salsa para quien quiera. Nadie se queda sentado." },
      { titulo: "Nuestros padrinos", texto: "Nos acompañan Amparo, la madre de Andrés, y Luis, el padre de Rocío." },
    ],
    titulos: { dia: "El repertorio de la noche", historia: "Nuestros pasos", galeria: "Bailando", playlist: "Las salsas de la noche", regalos: "Un detalle", album: "Vuestras fotos" },
    notaRegalo: "Lo que más ilusión nos hace es veros en la pista. Si queréis tener un detalle, nos ayudará con el viaje a Cuba.",
  }),

  // ───────────────────────────────────────────── K4 · Luna de Bachata
  boda({
    slug: "elena-y-samuel",
    plantilla: "bachata",
    a: "Elena",
    b: "Samuel",
    fecha: "2027-09-11T20:00:00+02:00",
    tema: {
      tinta: "#f2eaf3",
      papel: "#1b1324",
      acento: "#c99ad8",
      grano: 0.05,
      movimiento: { estilo: "romantico", entrada: "fundido-desenfoque", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: true },
    },
    apertura: video("lino", 2.6, "bachata"),
    frase: "Una canción lenta, una vela y vosotros cerca. No necesitamos nada más.",
    album: [f("bachata-album-1"), f("bachata-album-2"), f("bachata-album-3"), f("bachata-album-4")],
    capitulos: [
      { cuando: "2018 · Un congreso en Málaga", titulo: "La primera bachata", texto: "Una canción que duró cuatro minutos y que todavía no ha terminado." },
      { cuando: "2020 · A distancia", titulo: "Las videollamadas", texto: "Meses separados, bailando cada uno en su salón con el portátil en una silla." },
      { cuando: "2023 · Valencia", titulo: "La terraza", texto: "Por fin la misma casa, con una terraza donde caben justo dos personas bailando." },
      { cuando: "Junio de 2026", titulo: "La pregunta", texto: "Samuel paró la música a mitad de canción. Elena pensó que se había roto el altavoz." },
    ],
    paradas: [
      { titulo: "La ceremonia al atardecer", hora: "20:00", icono: "anillos", lugar: "Alquería del Mar", direccion: "Camí de la Mar, s/n, 46012 El Saler, Valencia", mapa: "https://maps.google.com/?q=El+Saler+Valencia" },
      { titulo: "El cóctel a la luz de las velas", hora: "21:00", icono: "copas", lugar: "El jardín", direccion: "Camí de la Mar, s/n, 46012 El Saler, Valencia" },
      { titulo: "La cena", hora: "22:15", icono: "plato", lugar: "La terraza", direccion: "Camí de la Mar, s/n, 46012 El Saler, Valencia" },
      { titulo: "Nuestro baile, y después el vuestro", hora: "00:00", icono: "nota", lugar: "La pista junto al mar", direccion: "Camí de la Mar, s/n, 46012 El Saler, Valencia" },
    ],
    dress: "Noche de verano junto al mar. Morados, empolvados, tonos piel y tejidos ligeros. Zapato cómodo: la pista está sobre madera.",
    paleta: ["#6b4a8a", "#c99ad8", "#e6b0a1", "#d9c3b0"],
    hoteles: [
      { nombre: "Hotel en El Saler", nota: "A 3 minutos de la alquería, desde 110 €. Código ELENAYSAMUEL", enlace: "https://maps.google.com/?q=hotel+El+Saler" },
      { nombre: "Hoteles en Valencia", nota: "A 15 minutos, con autobús de vuelta a las 2:00 y a las 4:30", enlace: "https://maps.google.com/?q=hoteles+Valencia" },
    ],
    iban: "ES82 0182 5500 1102 0198 6654",
    bizum: "633 48 11 72",
    titular: "Elena Navarro y Samuel Ortiz",
    hashtag: "ElenaYSamuelDespacio",
    notas: [
      { titulo: "Hay autobús desde Valencia", texto: "Sale de la plaza del Ayuntamiento a las 19:00 y vuelve a las 2:00 y a las 4:30." },
      { titulo: "Junto al mar refresca", texto: "Por la noche sopla la brisa: un chal o una chaqueta fina os vendrán bien." },
      { titulo: "Nuestros padrinos", texto: "Nos acompañan Carmen, la abuela de Elena, y Rafa, el hermano de Samuel." },
    ],
    titulos: { dia: "El ritmo de la noche", historia: "Nuestra canción", galeria: "Muy cerca", playlist: "Las bachatas de la noche", regalos: "Un detalle", album: "Vuestras fotos" },
    notaRegalo: "Que estéis es lo que importa. Si queréis tener un detalle, nos ayudará con el viaje a la República Dominicana.",
  }),


  // ───────────────────────────────── K3 · Bosque Encantado (pinar)
  boda({
    slug: "lucia-y-bruno",
    plantilla: "pinar",
    a: "Lucía",
    b: "Bruno",
    fecha: "2027-09-25T17:30:00+02:00",
    tema: {
      tinta: "#1f2a22",
      papel: "#ece4d3",
      acento: "#2f5d3a",
      grano: 0.07,
      movimiento: { estilo: "romantico", entrada: "fundido-desenfoque", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    frase: "Entre pinos, con olor a resina y luciérnagas al anochecer: así queremos decirnos que sí.",
    album: [f("pinar-1"), f("pinar-2"), f("pinar-3"), f("pinar-4")],
    capitulos: [
      { cuando: "Otoño de 2018 · Montseny", titulo: "Un sendero equivocado", texto: "Los dos íbamos al mismo refugio y los dos nos perdimos en el mismo cruce. Él llevaba el mapa al revés; ella, castañas para compartir.", foto: f("pinar-detalle-rodaja") },
      { cuando: "2021 · Una cabaña en el Pirineo", titulo: "El primer invierno", texto: "Una semana sin cobertura, una estufa de leña y la certeza de que no nos aburríamos ni a oscuras." },
      { cuando: "Primavera de 2026 · Arbúcies", titulo: "Bajo el pino grande", texto: "Bruno grabó dos iniciales en una rodaja de tronco y la escondió en la mochila. Lucía dijo que sí antes de que terminara la frase.", foto: f("pinar-poster") },
      { cuando: "25 de septiembre de 2027", titulo: "Al caer la tarde", texto: "Queremos celebrarlo donde empezó todo: en el bosque, y con vosotros." },
    ],
    paradas: [
      { titulo: "La ceremonia en el claro", hora: "17:30", icono: "anillos", lugar: "El claro de los pinos · Finca Bosc de Can Pla", direccion: "Camí de Can Pla, s/n, 17401 Arbúcies, Girona", mapa: "https://maps.google.com/?q=Arbucies+Girona" },
      { titulo: "El vermut entre los árboles", hora: "18:45", icono: "copas", lugar: "La pineda de la finca", direccion: "Camí de Can Pla, s/n, 17401 Arbúcies, Girona" },
      { titulo: "La cena bajo las guirnaldas", hora: "20:30", icono: "plato", lugar: "La era de Can Pla", direccion: "Camí de Can Pla, s/n, 17401 Arbúcies, Girona" },
      { titulo: "Baile con luciérnagas", hora: "23:00", icono: "nota", lugar: "El granero", direccion: "Camí de Can Pla, s/n, 17401 Arbúcies, Girona" },
    ],
    dress: "Elegante de campo. Tonos de bosque: verdes, tierra, mostaza y cobre. Calzado cómodo, que la ceremonia es sobre hierba, y una chaqueta para cuando refresque.",
    paleta: ["#2f5d3a", "#8aa39d", "#a07d4a", "#6b4a2b", "#c9a64a"],
    hoteles: [
      { nombre: "Hotel Torres de Arbúcies", nota: "En el pueblo, a 6 minutos en coche, desde 85 €", enlace: "https://maps.google.com/?q=Hotel+Arbucies" },
      { nombre: "Casas rurales del Montseny", nota: "Hemos reservado tres masías para grupos: escribidnos y os ponemos en contacto", enlace: "https://maps.google.com/?q=casa+rural+Montseny" },
    ],
    iban: "ES44 2100 0721 3302 0011 5478",
    bizum: "611 38 42 90",
    titular: "Lucía Ferrer y Bruno Casals",
    hashtag: "LuciayBrunoEnElBosque",
    notas: [
      { titulo: "Hay autobús desde Girona y Barcelona", texto: "Sale a las 15:45 de la estación de Girona y a las 15:00 de plaza de Espanya; vuelve a la 1:30 y a las 4:00." },
      { titulo: "Nuestros padrinos", texto: "Nuria, la hermana de Lucía, y Pere, el abuelo de Bruno." },
      { titulo: "Llevad repelente", texto: "Es septiembre y estamos en el bosque: habrá un cesto con repelente y mantas junto al granero." },
    ],
    titulos: { dia: "El sendero del día", historia: "Cómo empezó todo", galeria: "Del bosque", playlist: "La música del granero", regalos: "Un detalle", album: "Vuestras fotos" },
    notaRegalo: "Lo mejor que nos podéis traer es vuestra compañía. Si queréis tener un detalle, nos ayudará a construir nuestra cabaña.",
  }),

  // ──────────────────────────────────────────── K3 · Órbita (espacio)
  boda({
    slug: "vega-y-dario",
    plantilla: "orbita",
    a: "Vega",
    b: "Darío",
    fecha: "2027-08-14T20:30:00+01:00",
    tema: {
      tinta: "#eceaf6",
      papel: "#0b0f24",
      acento: "#b9a6f2",
      grano: 0.04,
      movimiento: { estilo: "cinematografico", entrada: "fundido-desenfoque", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    frase: "Dos órbitas que llevaban años girando cerca, y por fin se alinean.",
    album: [f("orbita-1"), f("orbita-2"), f("orbita-3"), f("orbita-4")],
    capitulos: [
      { cuando: "Agosto de 2016 · Perseidas", titulo: "La noche de las estrellas fugaces", texto: "Un mirador lleno de gente tumbada en el suelo. Ella contaba estrellas fugaces; él se equivocó de manta.", foto: f("orbita-poster") },
      { cuando: "2019 · Un planetario", titulo: "Trabajos con vistas", texto: "Él explica constelaciones a los colegios; ella calcula órbitas de satélites. Las cenas en casa son muy largas." },
      { cuando: "2025 · Roque de los Muchachos", titulo: "Bajo la Vía Láctea", texto: "A 2.400 metros, con el telescopio apuntando a Saturno y un anillo que no era el del planeta.", foto: f("orbita-2") },
      { cuando: "14 de agosto de 2027", titulo: "Misión: para siempre", texto: "Despegamos en La Palma, con el cielo más limpio del mundo. Nos falta la tripulación: vosotros." },
    ],
    paradas: [
      { titulo: "La ceremonia al atardecer", hora: "20:30", icono: "anillos", lugar: "Mirador de los Andenes", direccion: "Carretera LP-4, km 33, 38787 Garafía, La Palma", mapa: "https://maps.google.com/?q=Mirador+de+los+Andenes" },
      { titulo: "Cóctel con telescopios", hora: "21:30", icono: "copas", lugar: "Jardines de la Hacienda de Abajo", direccion: "Calle Miguel de Unamuno, 11, 38770 Tazacorte, La Palma" },
      { titulo: "La cena bajo las estrellas", hora: "22:30", icono: "plato", lugar: "Hacienda de Abajo", direccion: "Calle Miguel de Unamuno, 11, 38770 Tazacorte, La Palma" },
      { titulo: "Baile hasta que salga Venus", hora: "00:30", icono: "nota", lugar: "La terraza de la hacienda", direccion: "Calle Miguel de Unamuno, 11, 38770 Tazacorte, La Palma" },
    ],
    dress: "Etiqueta de noche. Azul noche, violeta, plata y negro; un brillo, si os apetece. En la cumbre refresca mucho al anochecer: traed un abrigo para la ceremonia.",
    paleta: ["#1b2a52", "#5b3fa8", "#c7ccd6", "#2b2d3a", "#b9a6f2"],
    hoteles: [
      { nombre: "Hacienda de Abajo", nota: "Donde es la cena: desde 190 €. Código VEGAYDARIO", enlace: "https://maps.google.com/?q=Hacienda+de+Abajo+Tazacorte" },
      { nombre: "Hotel Hacienda San Jorge", nota: "Frente al mar en Los Cancajos, desde 95 €", enlace: "https://maps.google.com/?q=Hacienda+San+Jorge+La+Palma" },
    ],
    iban: "ES07 0049 1500 0512 3456 7892",
    bizum: "655 92 13 48",
    titular: "Vega Hernández y Darío Rivas",
    hashtag: "VegaYDarioEnOrbita",
    notas: [
      { titulo: "Hay autobús desde Santa Cruz de La Palma", texto: "Sale del puerto a las 18:30 y sube a la cumbre; vuelve a la 1:30 y a las 3:30." },
      { titulo: "Cielo Starlight", texto: "En la cumbre no hay luces: los móviles, en modo nocturno. Habrá linternas rojas para todos." },
      { titulo: "Nuestros padrinos", texto: "Elena, la madre de Vega, y Tomás, el hermano de Darío." },
    ],
    titulos: { dia: "El plan de vuelo", historia: "Dos órbitas", galeria: "Desde la Tierra", playlist: "Música para gravedad cero", regalos: "Un detalle", album: "Vuestras fotos" },
    notaRegalo: "Que crucéis medio planeta para estar es el mejor regalo. Si además queréis un detalle, irá al combustible de nuestra luna de miel.",
  }),

  // ───────────────────────────────────── K3 · Brazada (natación y agua)
  boda({
    slug: "marina-y-hugo",
    plantilla: "brazada",
    a: "Marina",
    b: "Hugo",
    fecha: "2027-06-04T12:30:00+02:00",
    tema: {
      tinta: "#06303a",
      papel: "#f2fafb",
      acento: "#00707f",
      grano: 0,
      movimiento: { estilo: "sereno", entrada: "ascenso", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    frase: "Después de tantos largos uno al lado del otro, nos tiramos juntos al agua.",
    album: [f("brazada-1"), f("brazada-2"), f("brazada-3"), f("brazada-4")],
    capitulos: [
      { cuando: "2015 · Piscina municipal de Palma", titulo: "Calle 4 y calle 5", texto: "Entrenábamos a la misma hora, en calles vecinas. Durante un año solo nos dijimos «¿te queda mucho?»", foto: f("brazada-detalle-gotas") },
      { cuando: "2019 · Travesía a nado", titulo: "Mar abierto", texto: "La primera travesía de Hugo y la décima de Marina. Ella esperó en la meta con una toalla y una sonrisa de suficiencia." },
      { cuando: "2025 · Cala Mondragó", titulo: "La pregunta, bajo el agua", texto: "Una pizarra de buceo y un rotulador: «¿Te casas conmigo?». La respuesta salió en burbujas.", foto: f("brazada-poster") },
      { cuando: "4 de junio de 2027", titulo: "Salida", texto: "A mediodía, junto al mar. Os queremos en el agua con nosotros." },
    ],
    paradas: [
      { titulo: "La ceremonia frente al mar", hora: "12:30", icono: "anillos", lugar: "Real Club Náutico de Palma", direccion: "Muelle de San Pedro, 1, 07012 Palma, Illes Balears", mapa: "https://maps.google.com/?q=Real+Club+Nautico+de+Palma" },
      { titulo: "Aperitivo en la terraza de la piscina", hora: "13:30", icono: "copas", lugar: "Terraza del club", direccion: "Muelle de San Pedro, 1, 07012 Palma, Illes Balears" },
      { titulo: "La comida", hora: "15:00", icono: "plato", lugar: "Salón del muelle", direccion: "Muelle de San Pedro, 1, 07012 Palma, Illes Balears" },
      { titulo: "Fiesta y baño (opcional)", hora: "18:30", icono: "nota", lugar: "La piscina del club", direccion: "Muelle de San Pedro, 1, 07012 Palma, Illes Balears" },
    ],
    dress: "Cóctel de verano. Colores de agua: cian, azul, blanco y algún coral. Traed bañador si os animáis al chapuzón de la tarde: habrá toallas para todos.",
    paleta: ["#00707f", "#6fd3e0", "#1d5fa8", "#f2fafb", "#e8826b"],
    hoteles: [
      { nombre: "Hotel Saratoga", nota: "A 10 minutos andando del club, con piscina en la azotea, desde 130 €", enlace: "https://maps.google.com/?q=Hotel+Saratoga+Palma" },
      { nombre: "Hotel Mirador", nota: "En el paseo marítimo, desde 110 €", enlace: "https://maps.google.com/?q=Hotel+Mirador+Palma" },
    ],
    iban: "ES36 2100 0965 1102 0077 4410",
    bizum: "628 50 77 13",
    titular: "Marina Pons y Hugo Seguí",
    hashtag: "MarinayHugoAlAgua",
    notas: [
      { titulo: "Nuestros padrinos", texto: "Aina, la entrenadora de los dos, y Joan, el padre de Hugo." },
      { titulo: "El chapuzón es opcional", texto: "Habrá vestuarios, toallas y crema solar. Nadie os va a tirar al agua (bueno, casi nadie)." },
      { titulo: "Los niños son bienvenidos", texto: "Tendrán monitores y una zona de piscina solo para ellos durante la comida." },
    ],
    titulos: { dia: "El programa", historia: "Nuestra historia", galeria: "Al sol", playlist: "Música para nadar", regalos: "Para el próximo viaje", album: "Vuestras fotos" },
    notaRegalo: "Vuestra presencia es el mejor regalo. Si además queréis tener un detalle, irá a nuestro próximo viaje: una travesía por las islas griegas.",
  }),

  // ───────────────────────────────────── K5 · Lúpulo y Cobre (cerveza)
  boda({
    slug: "irene-y-mateo",
    plantilla: "lupulo",
    a: "Irene",
    b: "Mateo",
    fecha: "2027-09-11T18:00:00+02:00",
    tema: {
      tinta: "#241a10",
      papel: "#f2e8d5",
      acento: "#a9640f",
      grano: 0.06,
      movimiento: { estilo: "sereno", velocidad: 1, intensidad: 0.5, entrada: "ascenso", particulas: "ninguna", flores: "ninguna", petalosAlTocar: false, colorVivo: true },
    },
    apertura: video("constelacion", 4.0, "lupulo"),
    frase: "Nos conocimos esperando turno en una barra. Ahora queremos que la ronda sea para todos.",
    album: [f("lupulo-album-1"), f("lupulo-album-2"), f("lupulo-album-3"), f("lupulo-album-4")],
    capitulos: [
      { cuando: "2016 · Una feria de cerveza artesana en Girona", titulo: "La primera ronda", texto: "Irene pidió la más amarga de la carta; Mateo, la misma, por no quedar mal. Ninguno se la terminó, pero nos quedamos hasta el cierre.", foto: f("lupulo-detalle-lupulo") },
      { cuando: "2019 · Nuestro primer piso", titulo: "Una olla de veinte litros", texto: "La primera cocción salió turbia y con demasiado lúpulo. La segunda, mejor. Ya vamos por el lote treinta y dos." },
      { cuando: "Primavera de 2026 · El Empordà", titulo: "La pregunta", texto: "Entre tanques de cobre, con una botella sin etiqueta. Dentro, en vez de cerveza, un anillo y una nota: «¿Brindamos para siempre?»", foto: f("lupulo-album-3") },
    ],
    paradas: [
      { titulo: "La ceremonia entre tanques", hora: "18:00", icono: "anillos", lugar: "La Nave de Ladrillo", direccion: "Carrer de Pujades, 120, 08005 Barcelona", mapa: "https://maps.google.com/?q=Poblenou+Barcelona" },
      { titulo: "Primera ronda y vermut", hora: "19:00", icono: "copas", lugar: "El patio de la nave", direccion: "Carrer de Pujades, 120, 08005 Barcelona" },
      { titulo: "La cena de maridaje", hora: "20:30", icono: "plato", lugar: "La sala de cocción", direccion: "Carrer de Pujades, 120, 08005 Barcelona" },
      { titulo: "Barra libre y baile", hora: "23:00", icono: "nota", lugar: "La sala de barricas", direccion: "Carrer de Pujades, 120, 08005 Barcelona" },
    ],
    dress: "Elegante sin corbata. Tonos tierra, ámbar y verde botella; lino, punto o lana fina. El suelo de la nave es de hormigón: mejor tacón ancho que de aguja.",
    paleta: ["#e9c77b", "#c98f2e", "#8a4b1c", "#556b2f", "#3a2617"],
    hoteles: [
      { nombre: "Hotel junto a la Rambla del Poblenou", nota: "A 6 minutos andando, desde 95 €. Decid que venís a la boda de Irene y Mateo", enlace: "https://maps.google.com/?q=Rambla+del+Poblenou+hotel" },
      { nombre: "Apartamentos en la playa del Bogatell", nota: "A 10 minutos, desde 80 €", enlace: "https://maps.google.com/?q=Bogatell+Barcelona" },
    ],
    iban: "ES30 2100 0813 6102 0047 2219",
    bizum: "611 48 20 93",
    titular: "Irene Soler y Mateo Rius",
    hashtag: "IreneYMateo",
    notas: [
      { titulo: "Habrá opciones sin alcohol", texto: "Cervezas sin, kombucha casera y refrescos. Y agua, mucha agua." },
      { titulo: "Volved en metro o en taxi", texto: "Llull (L4) está a cinco minutos. Os pediremos taxis a la salida: nadie conduce esta noche." },
      { titulo: "Nuestros padrinos", texto: "Montse, la madre de Irene, y Jordi, el hermano de Mateo." },
    ],
    titulos: { dia: "Carta de grifos", historia: "Notas de cata", galeria: "Entre tanques", playlist: "Lo que sonará en la barra", regalos: "El barril de los deseos", album: "Vuestras fotos" },
    notaRegalo: "Vuestra compañía es la mejor ronda. Si además queréis tener un detalle, irá al viaje de novios (con alguna fábrica de por medio).",
  }),

  // ───────────────────────────────────── K5 · Noche de Estadio (fútbol)
  boda({
    slug: "lucia-y-dani",
    plantilla: "estadio",
    a: "Lucía",
    b: "Dani",
    fecha: "2027-06-19T19:00:00+02:00",
    tema: {
      tinta: "#111d17",
      papel: "#f3f1e7",
      acento: "#1d6a3a",
      grano: 0.04,
      movimiento: { estilo: "sereno", velocidad: 1.1, intensidad: 0.6, entrada: "ascenso", particulas: "ninguna", flores: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    apertura: video("marea", 3.0, "estadio"),
    frase: "Llevamos años compartiendo grada. Ahora jugamos la final, y os queremos en el campo.",
    album: [f("estadio-album-1"), f("estadio-album-2"), f("estadio-album-3"), f("estadio-album-4")],
    capitulos: [
      { cuando: "2015 · Un campo de barrio en Valencia", titulo: "El primer partido", texto: "Un torneo de verano, equipos mixtos y una portera que no dejaba pasar ni una. Dani se pasó la tarde intentando marcarle. Lo consiguió en la cena.", foto: f("estadio-poster") },
      { cuando: "2019 · Fuera de casa", titulo: "El desplazamiento", texto: "Ocho horas de autobús para ver un partido que perdimos. Volvimos cantando igual." },
      { cuando: "Navidad de 2025 · La grada de siempre", titulo: "La pregunta", texto: "En el descanso, en el videomarcador de nuestro campo de toda la vida: «Lucía, ¿te casas conmigo?». La grada entera contestó antes que ella.", foto: f("estadio-album-1") },
    ],
    paradas: [
      { titulo: "La ceremonia en el jardín", hora: "19:00", icono: "anillos", lugar: "Masía El Olivar", direccion: "Camí de la Lloma, 14, 46117 Bétera, Valencia", mapa: "https://maps.google.com/?q=Betera+Valencia" },
      { titulo: "El cóctel junto al césped", hora: "20:00", icono: "copas", lugar: "La pradera de la masía", direccion: "Camí de la Lloma, 14, 46117 Bétera, Valencia" },
      { titulo: "La cena", hora: "21:30", icono: "plato", lugar: "El salón de los arcos", direccion: "Camí de la Lloma, 14, 46117 Bétera, Valencia" },
      { titulo: "La fiesta hasta el pitido final", hora: "00:00", icono: "nota", lugar: "La carpa", direccion: "Camí de la Lloma, 14, 46117 Bétera, Valencia" },
    ],
    dress: "Etiqueta de verano: traje claro o de lino y vestido largo o midi. Sí, podéis traer un detalle con los colores de vuestro equipo (un pañuelo, unos gemelos); la camiseta, mejor para la fiesta.",
    paleta: ["#1d6a3a", "#f3f1e7", "#c9b48a", "#1b2a3a"],
    hoteles: [
      { nombre: "Hotel rural en Bétera", nota: "A 5 minutos en coche, desde 85 €. Decid que venís a la boda de Lucía y Dani", enlace: "https://maps.google.com/?q=hotel+Betera" },
      { nombre: "Hoteles en el centro de Valencia", nota: "A 25 minutos; habrá autobús de vuelta", enlace: "https://maps.google.com/?q=hotel+centro+Valencia" },
    ],
    iban: "ES44 2100 4567 8100 2233 4455",
    bizum: "644 12 90 37",
    titular: "Lucía Ferrer y Daniel Gil",
    hashtag: "LuciayDani",
    notas: [
      { titulo: "Hay autobús desde Valencia", texto: "Sale de la plaza del Ayuntamiento a las 18:00 y vuelve a la 1:30 y a las 4:00. Marcadlo al confirmar." },
      { titulo: "El partido se ve", texto: "Si ese sábado juega alguno de nuestros equipos, habrá una pantalla discreta en el cóctel. Nada de discusiones." },
      { titulo: "Nuestros padrinos", texto: "Amparo, la madre de Dani, y Vicent, el padre de Lucía." },
    ],
    titulos: { dia: "Puerta 7", historia: "Historial de partidos", galeria: "La afición", playlist: "Los cánticos de la fiesta", regalos: "Fichajes", album: "Vuestras fotos" },
    notaRegalo: "Que vengáis ya es ganar la final. Si queréis tener un detalle, irá a la luna de miel.",
  }),

  // ───────────────────────────────────── K5 · Línea de Meta (runners)
  boda({
    slug: "sara-y-hugo",
    plantilla: "meta",
    a: "Sara",
    b: "Hugo",
    fecha: "2027-06-05T18:00:00+02:00",
    tema: {
      tinta: "#14161a",
      papel: "#f5f5f1",
      acento: "#e3492b",
      grano: 0.03,
      movimiento: { estilo: "minimo", velocidad: 1.2, intensidad: 0.55, entrada: "ascenso", particulas: "ninguna", flores: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    apertura: video("cielo", 3.5, "meta"),
    frase: "Hemos corrido muchos kilómetros juntos. Los últimos metros queremos hacerlos con vosotros.",
    album: [f("meta-album-1"), f("meta-album-2"), f("meta-album-3"), f("meta-album-4")],
    capitulos: [
      { cuando: "2017 · Una carrera popular en Donostia", titulo: "Nos conocimos", texto: "Kilómetro 8, cuesta arriba. Hugo se quedó sin aire y Sara le prestó su ritmo. Llegamos juntos, con el mismo tiempo oficial.", foto: f("meta-detalle-medalla") },
      { cuando: "2021 · El primer maratón", titulo: "La mudanza", texto: "Entrenamos de noche, nos lesionamos por turnos y acabamos viviendo a medio camino entre su pista y la mía." },
      { cuando: "Octubre de 2025 · Al amanecer", titulo: "La pregunta", texto: "En el último kilómetro de nuestra carrera favorita, Hugo se paró antes de la meta. Sara pensó que era un calambre. Era un anillo.", foto: f("meta-album-3") },
    ],
    paradas: [
      { titulo: "La ceremonia frente al mar", hora: "18:00", icono: "anillos", lugar: "Los jardines del faro", direccion: "Paseo del Faro, 3, 20008 Donostia-San Sebastián, Gipuzkoa", mapa: "https://maps.google.com/?q=Donostia" },
      { titulo: "El cóctel de recuperación", hora: "19:15", icono: "copas", lugar: "La terraza del faro", direccion: "Paseo del Faro, 3, 20008 Donostia-San Sebastián, Gipuzkoa" },
      { titulo: "La cena", hora: "21:00", icono: "plato", lugar: "El comedor de la casa del faro", direccion: "Paseo del Faro, 3, 20008 Donostia-San Sebastián, Gipuzkoa" },
      { titulo: "La fiesta", hora: "23:30", icono: "nota", lugar: "La carpa del jardín", direccion: "Paseo del Faro, 3, 20008 Donostia-San Sebastián, Gipuzkoa" },
    ],
    dress: "Etiqueta de tarde junto al mar: traje y vestido, en colores claros o vivos. Y sí, podéis traer zapatillas para la fiesta: os dejaremos una cesta en la entrada.",
    paleta: ["#e3492b", "#2550c0", "#f2e6cf", "#14161a"],
    hoteles: [
      { nombre: "Hotel en el paseo de la Concha", nota: "A 10 minutos andando, desde 130 €", enlace: "https://maps.google.com/?q=Paseo+de+la+Concha" },
      { nombre: "Pensiones en la Parte Vieja", nota: "A 15 minutos, desde 80 €", enlace: "https://maps.google.com/?q=Parte+Vieja+Donostia" },
    ],
    iban: "ES61 2095 5034 1291 0055 7788",
    bizum: "688 31 47 02",
    titular: "Sara Etxeberria y Hugo Martín",
    hashtag: "SarayHugo",
    notas: [
      { titulo: "Carrera de calentamiento", texto: "El sábado a las 9:00, 5 km suaves por la playa para quien quiera. Sin cronómetro y con chocolate al final." },
      { titulo: "Calzado", texto: "La ceremonia es sobre césped: mejor tacón ancho." },
      { titulo: "Nuestros padrinos", texto: "Miren, la hermana de Sara, y Álvaro, el compañero de entrenos de Hugo." },
    ],
    titulos: { dia: "Avituallamientos", historia: "Nuestros parciales", galeria: "En carrera", playlist: "La lista para correr (y bailar)", regalos: "Nuestro avituallamiento de luna de miel", album: "Vuestras fotos" },
    notaRegalo: "Que vengáis a animarnos es el mejor regalo. Si queréis tener un detalle, nos ayudará con la luna de miel.",
  }),

  // ───────────────────────────────────── K5 · Riviera (coches y lujo)
  boda({
    slug: "elena-y-marco",
    plantilla: "riviera",
    a: "Elena",
    b: "Marco",
    fecha: "2027-09-25T18:30:00+02:00",
    tema: {
      tinta: "#1b1815",
      papel: "#f3ece1",
      acento: "#1f3b5c",
      grano: 0.03,
      movimiento: { estilo: "cinematografico", velocidad: 0.9, intensidad: 0.5, entrada: "fundido-desenfoque", particulas: "ninguna", flores: "ninguna", petalosAlTocar: false, colorVivo: true },
    },
    apertura: video("bruma", 3.0, "riviera"),
    frase: "Una carretera de costa, un coche con más años que nosotros y toda la vida por delante.",
    album: [f("riviera-album-1"), f("riviera-album-2"), f("riviera-album-3"), f("riviera-album-4")],
    capitulos: [
      { cuando: "2018 · Un concurso de elegancia en la Costa Brava", titulo: "Salida", texto: "Él restauraba un descapotable de 1963; ella cosía los asientos de piel. Dos meses de pespuntes después, el coche estaba listo y nosotros también.", foto: f("riviera-detalle-guantera") },
      { cuando: "2022 · La carretera de la costa", titulo: "La ruta", texto: "De Cadaqués a Menton, sin prisa y con las ventanillas bajadas. Nos perdimos tres veces y no nos importó ninguna." },
      { cuando: "Verano de 2026 · Al atardecer", titulo: "La guantera", texto: "Marco le pidió a Elena el mapa. En la guantera, junto al mapa, había una caja pequeña de terciopelo azul.", foto: f("riviera-poster") },
    ],
    paradas: [
      { titulo: "La ceremonia sobre el acantilado", hora: "18:30", icono: "anillos", lugar: "Hotel del Cabo", direccion: "Carretera del Faro, km 2, 17488 Cadaqués, Girona", mapa: "https://maps.google.com/?q=Cadaques" },
      { titulo: "El cóctel al atardecer", hora: "19:30", icono: "copas", lugar: "La terraza del Hotel del Cabo", direccion: "Carretera del Faro, km 2, 17488 Cadaqués, Girona" },
      { titulo: "La cena de gala", hora: "21:00", icono: "plato", lugar: "El salón de los espejos", direccion: "Carretera del Faro, km 2, 17488 Cadaqués, Girona" },
      { titulo: "El baile", hora: "23:30", icono: "nota", lugar: "El jardín de los olivos", direccion: "Carretera del Faro, km 2, 17488 Cadaqués, Girona" },
    ],
    dress: "Etiqueta: traje oscuro o esmoquin, y vestido largo. Tejidos nobles, seda o lino, y un pañuelo para la brisa del mar. Nada de blanco, que ese ya está cogido.",
    paleta: ["#1f3b5c", "#cbb487", "#7a2233", "#e9e2d4", "#1b1815"],
    hoteles: [
      { nombre: "Hotel del Cabo", nota: "Habitaciones reservadas para invitados hasta el 1 de julio, desde 190 €. Decid «Elena y Marco»", enlace: "https://maps.google.com/?q=Cadaques" },
      { nombre: "Casas de pueblo en Cadaqués", nota: "A 8 minutos en coche, desde 110 €", enlace: "https://maps.google.com/?q=Cadaques+casa" },
    ],
    iban: "ES18 0081 0200 6100 0123 4567",
    bizum: "699 20 51 84",
    titular: "Elena Vidal y Marco Ferrán",
    hashtag: "ElenaYMarco",
    notas: [
      { titulo: "La carretera", texto: "Es estrecha y con curvas. Habrá minibuses desde Roses a las 17:30; aparcar en el hotel es difícil." },
      { titulo: "Coches clásicos", texto: "Si venís en uno, avisadnos: os guardamos sitio a la entrada para la foto." },
      { titulo: "Nuestros padrinos", texto: "Carmen, la madre de Marco, y Pere, el padre de Elena." },
    ],
    titulos: { dia: "Itinerario de gala", historia: "Nuestra ruta", galeria: "Atelier", playlist: "La música del baile", regalos: "La caja", album: "Vuestras fotos" },
    notaRegalo: "Que vengáis es el mejor regalo. Si además queréis tener un detalle, dentro de la caja están los datos.",
  }),
  // ─────────────────────────────── K2 · Blasón (castillos y nobleza)
  boda({
    slug: "leonor-y-alvaro",
    plantilla: "blason",
    a: "Leonor",
    b: "Álvaro",
    fecha: "2027-09-25T17:30:00+02:00",
    tema: {
      tinta: "#2a1712",
      papel: "#f2e8d5",
      acento: "#6b1e2a",
      grano: 0.06,
      movimiento: { estilo: "cinematografico", entrada: "fundido-desenfoque", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    frase: "Nuestras dos casas se juntan en una, y queremos que lo veáis con vuestros propios ojos.",
    album: [f("blason-album-1"), f("blason-album-2"), f("blason-album-3"), f("blason-lamina")],
    capitulos: [
      { cuando: "Otoño de 2017 · Sigüenza", titulo: "El encuentro en la muralla", texto: "Una visita guiada, una lluvia de las que no avisan y un solo paraguas para dos. El guía siguió; nosotros nos quedamos bajo el arco.", foto: f("blason-detalle-1") },
      { cuando: "2020 · Toledo", titulo: "La casa con dos escudos", texto: "Juntamos libros, plantas y dos familias que hablan a la vez. Desde entonces, los domingos se come en una mesa muy larga." },
      { cuando: "Primavera de 2026 · Alcázar de Segovia", titulo: "La pregunta en la torre", texto: "Álvaro subió los ciento cincuenta y dos escalones con el anillo en el bolsillo y sin aliento. Leonor dijo que sí antes de que pudiera preguntar.", foto: f("blason-poster-hero") },
      { cuando: "25 de septiembre de 2027", titulo: "El enlace", texto: "Lo celebraremos en el castillo donde empezó todo, con vosotros como testigos." },
    ],
    paradas: [
      { titulo: "La ceremonia", hora: "17:30", icono: "iglesia", lugar: "Capilla del Parador de Sigüenza", direccion: "Plaza del Castillo, s/n, 19250 Sigüenza, Guadalajara", mapa: "https://maps.google.com/?q=Parador+de+Siguenza" },
      { titulo: "Vino de honor en el patio de armas", hora: "18:45", icono: "copas", lugar: "Patio de armas", direccion: "Plaza del Castillo, s/n, 19250 Sigüenza, Guadalajara" },
      { titulo: "El banquete", hora: "20:30", icono: "plato", lugar: "Salón de los Obispos", direccion: "Plaza del Castillo, s/n, 19250 Sigüenza, Guadalajara" },
      { titulo: "El baile", hora: "23:30", icono: "nota", lugar: "Salón del Doncel", direccion: "Plaza del Castillo, s/n, 19250 Sigüenza, Guadalajara" },
    ],
    dress: "Etiqueta de tarde. Ellas, vestido largo o de cóctel en tonos de otoño; ellos, traje oscuro. El suelo es de piedra: mejor tacón ancho que de aguja.",
    paleta: ["#6b1e2a", "#2e4a3a", "#a8823a", "#23386b"],
    hoteles: [
      { nombre: "Parador de Sigüenza", nota: "Dentro del castillo. Habitaciones reservadas hasta el 1 de agosto, código LEONORYALVARO", enlace: "https://maps.google.com/?q=Parador+de+Siguenza" },
      { nombre: "Hotel El Doncel", nota: "En el centro, a 6 minutos andando, desde 80 €", enlace: "https://maps.google.com/?q=Hotel+El+Doncel+Siguenza" },
    ],
    iban: "ES76 2100 0418 4502 0007 9911",
    bizum: "611 42 87 30",
    titular: "Leonor Ruiz y Álvaro Castilla",
    hashtag: "LeonoryAlvaro",
    notas: [
      { titulo: "Nuestros padrinos", texto: "Nos acompañan al altar Mercedes, la madre de Álvaro, y Ramón, el padre de Leonor." },
      { titulo: "Hay autobús desde Madrid", texto: "Sale de Avenida de América a las 15:15 y vuelve a la 1:30 y a las 4:00. Marcadlo al confirmar." },
      { titulo: "Sube una cuesta", texto: "Del aparcamiento al castillo hay una cuesta empedrada de cinco minutos. Si os cuesta, avisadnos y os subimos en coche." },
    ],
    titulos: { dia: "Orden de la jornada", historia: "Nuestro cantar", galeria: "Retratos de la casa", playlist: "La música del baile", regalos: "Un presente", album: "Vuestras fotos" },
    notaRegalo: "Que vengáis es el mejor presente. Si además queréis tener un detalle, lo guardaremos en este cofre para el viaje.",
  }),

  // ───────────────────────────────────────── K2 · Memorias (vintage)
  boda({
    slug: "julia-y-mateo",
    plantilla: "memorias",
    a: "Julia",
    b: "Mateo",
    fecha: "2027-05-15T12:30:00+02:00",
    tema: {
      tinta: "#3b2a1e",
      papel: "#efe4cf",
      acento: "#8b3f31",
      grano: 0.07,
      movimiento: { estilo: "sereno", entrada: "fundido", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    frase: "Hace doce años nos escribimos la primera carta. Esta es la que más ilusión nos hace mandaros.",
    album: [f("memorias-album-1"), f("memorias-album-2"), f("memorias-album-3"), f("memorias-detalle-2")],
    capitulos: [
      { cuando: "Verano de 2015 · Cadaqués", titulo: "La primera", texto: "Ella dejó un libro olvidado en una terraza; él lo devolvió por correo con una nota dentro. Ella contestó. Y él volvió a contestar." },
      { cuando: "2016 · Barcelona y Salamanca", titulo: "Ciento doce cartas", texto: "Dos ciudades, un buzón cada una y una caja de lata que todavía guardamos. Algunas se cruzaban por el camino." },
      { cuando: "2021 · Girona", titulo: "La misma dirección", texto: "Por fin, un solo buzón. Lo primero que colgamos en casa fue la primera carta, enmarcada." },
      { cuando: "15 de mayo de 2027", titulo: "La que faltaba", texto: "Nos casamos en la masía de los abuelos de Julia, bajo la higuera donde ellos se casaron." },
    ],
    paradas: [
      { titulo: "La ceremonia, bajo la higuera", hora: "12:30", icono: "anillos", lugar: "Mas Les Oliveres", direccion: "Camí de Pals, s/n, 17256 Pals, Girona", mapa: "https://maps.google.com/?q=Pals+Girona" },
      { titulo: "El vermut en el porche", hora: "13:30", icono: "copas", lugar: "Porche de la masía", direccion: "Camí de Pals, s/n, 17256 Pals, Girona" },
      { titulo: "La comida", hora: "15:00", icono: "plato", lugar: "El pajar", direccion: "Camí de Pals, s/n, 17256 Pals, Girona" },
      { titulo: "Baile y sobremesa", hora: "18:30", icono: "nota", lugar: "La era", direccion: "Camí de Pals, s/n, 17256 Pals, Girona" },
    ],
    dress: "De primavera y sin agobios: lino, algodón, flores pequeñas. Hay césped y gravilla, así que mejor cuña o zapato plano.",
    paleta: ["#c8b79a", "#8b3f31", "#9c7a4b", "#6f7d5c"],
    hoteles: [
      { nombre: "Hotel Mas Lazuli", nota: "A 8 minutos en coche, desde 110 €", enlace: "https://maps.google.com/?q=Mas+Lazuli+Pals" },
      { nombre: "Casa rural Can Pou", nota: "En el pueblo de Pals, ideal para familias, desde 70 €", enlace: "https://maps.google.com/?q=Pals+Girona" },
    ],
    iban: "ES21 0081 0216 7300 0118 4407",
    bizum: "622 15 40 98",
    titular: "Julia Ferrer y Mateo Ortega",
    hashtag: "JuliayMateo",
    notas: [
      { titulo: "Quién nos acompaña", texto: "Nos llevan al altar Montse, la abuela de Julia, y Pedro, el hermano de Mateo." },
      { titulo: "Hay autobús desde Girona", texto: "Sale de la estación a las 11:15 y vuelve a las 21:00 y a la 1:00. Marcadlo al confirmar." },
      { titulo: "Traed una carta, si queréis", texto: "Habrá un buzón antiguo en la entrada. Lo abriremos en nuestro primer aniversario." },
    ],
    titulos: { dia: "El programa", historia: "Nuestra historia", galeria: "Fotos de siempre", playlist: "Las canciones de entonces", regalos: "Un sobre", album: "Vuestras fotos" },
    notaRegalo: "Que vengáis ya es el mejor regalo. Si además queréis tener un detalle, lo guardaremos en un sobre para el viaje.",
  }),

  // ─────────────────────────────── K2 · Pasaporte (viajeros enamorados)
  boda({
    slug: "celia-y-tomas",
    plantilla: "pasaporte",
    a: "Celia",
    b: "Tomás",
    fecha: "2027-06-05T18:30:00+01:00",
    tema: {
      tinta: "#2b2620",
      papel: "#f3eadb",
      acento: "#9a4a22",
      grano: 0.04,
      movimiento: { estilo: "sereno", entrada: "fundido", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    frase: "Hemos cruzado medio mundo para encontrarnos. Ahora os pedimos que crucéis un poco para celebrarlo.",
    album: [f("pasaporte-album-1"), f("pasaporte-album-2"), f("pasaporte-album-3"), f("pasaporte-detalle-1"), f("pasaporte-poster-hero")],
    capitulos: [
      { cuando: "1994 · Sevilla", titulo: "Celia", texto: "Nació en Triana con la maleta hecha: Erasmus, voluntariado y un trabajo que la lleva de aeropuerto en aeropuerto." },
      { cuando: "1992 · Bilbao", titulo: "Tomás", texto: "Ingeniero, del Athletic y de mapas de papel. Dice que no se pierde nunca. Se pierde siempre." },
      { cuando: "2019 · Lisboa", titulo: "Aquí empezó todo", texto: "Un tranvía averiado, el 28, y cuarenta minutos de conversación en una cuesta de la Alfama. Perdimos los dos vuelos de vuelta." },
      { cuando: "2027 · Santa Cruz de Tenerife", titulo: "Destino final", texto: "Elegimos una isla a medio camino de todo. Allí nos casamos, y allí os esperamos." },
    ],
    paradas: [
      { titulo: "La ceremonia", hora: "18:30", icono: "anillos", lugar: "Hacienda San Andrés", direccion: "Camino de las Teresitas, 12, 38120 Santa Cruz de Tenerife", mapa: "https://maps.google.com/?q=San+Andres+Santa+Cruz+de+Tenerife" },
      { titulo: "Cóctel al atardecer", hora: "19:30", icono: "copas", lugar: "Terraza del mirador", direccion: "Camino de las Teresitas, 12, 38120 Santa Cruz de Tenerife" },
      { titulo: "La cena", hora: "21:00", icono: "plato", lugar: "El jardín de los dragos", direccion: "Camino de las Teresitas, 12, 38120 Santa Cruz de Tenerife" },
      { titulo: "La fiesta", hora: "23:30", icono: "nota", lugar: "La bodega", direccion: "Camino de las Teresitas, 12, 38120 Santa Cruz de Tenerife" },
    ],
    dress: "Elegante de verano. Tonos tierra, lino y algodón; ellos, sin corbata si queréis. Por la noche refresca: traed algo de abrigo ligero.",
    paleta: ["#9a4a22", "#2f5d62", "#d8c3a0", "#b08d57"],
    hoteles: [
      { nombre: "Hotel Taburiente", nota: "En el centro de Santa Cruz, a 12 minutos en coche, desde 95 €. Código CELIAYTOMAS", enlace: "https://maps.google.com/?q=Hotel+Taburiente+Santa+Cruz" },
      { nombre: "Apartamentos Las Teresitas", nota: "Frente a la playa, a 5 minutos andando, desde 80 €", enlace: "https://maps.google.com/?q=Playa+de+Las+Teresitas" },
    ],
    iban: "ES05 0182 1234 5602 0098 7711",
    bizum: "655 30 21 84",
    titular: "Celia Morales y Tomás Etxeberria",
    hashtag: "CeliayTomas",
    notas: [
      { titulo: "Si venís de la península", texto: "Hay vuelos directos a Tenerife Norte y Tenerife Sur. Desde Tenerife Norte la hacienda está a 20 minutos." },
      { titulo: "Hay traslado", texto: "Un autobús sale del hotel Taburiente a las 17:45 y vuelve a la 1:00 y a las 3:30. Marcadlo al confirmar." },
      { titulo: "Nuestros padrinos", texto: "Nos acompañan al altar Rocío, la madre de Celia, e Iñaki, el hermano de Tomás." },
    ],
    titulos: { dia: "Itinerario de vuelo", historia: "Nuestra ruta", galeria: "Diario de viaje", playlist: "La música del vuelo", regalos: "Fondo para la luna de miel", album: "Vuestras fotos" },
    notaRegalo: "Vuestra compañía es el mejor regalo. Si además queréis tener un detalle, irá a nuestra luna de miel (todavía estamos decidiendo el destino).",
  }),

  // ───────────────────────────────────────── K2 · Orilla (playa y mar)
  boda({
    slug: "paula-y-marc",
    plantilla: "orilla",
    a: "Paula",
    b: "Marc",
    fecha: "2027-07-10T19:00:00+02:00",
    tema: {
      tinta: "#0f2f3a",
      papel: "#f7f4ee",
      acento: "#0e6973",
      grano: 0.05,
      movimiento: { estilo: "sereno", entrada: "fundido", flores: "ninguna", particulas: "ninguna", petalosAlTocar: false, colorVivo: false },
    },
    frase: "Descalzos, con el mar delante y vosotros al lado. No se nos ocurre mejor plan.",
    album: [f("orilla-album-1"), f("orilla-album-2"), f("orilla-album-3"), f("orilla-detalle-1")],
    capitulos: [
      { cuando: "Agosto de 2018 · Cala Macarella", titulo: "La toalla de al lado", texto: "Un viento de tramontana se llevó la sombrilla de Paula hasta la toalla de Marc. Él la devolvió; ella le invitó a una horchata.", foto: f("orilla-detalle-2") },
      { cuando: "2020 · Barcelona", titulo: "Un piso con terraza", texto: "Pequeño, con vistas a una antena y a un trozo de mar si te asomas mucho. Nos asomamos todos los días." },
      { cuando: "Septiembre de 2025 · Cala Galdana", titulo: "La pregunta", texto: "Al atardecer, con los pies en el agua. Marc escribió la pregunta en la arena y una ola se la llevó antes de que Paula la leyera. Lo repitió en voz alta.", foto: f("orilla-poster-hero") },
    ],
    paradas: [
      { titulo: "La ceremonia en la arena", hora: "19:00", icono: "anillos", lugar: "Cala Galdana", direccion: "Passeig del Riu, 07750 Ferreries, Menorca", mapa: "https://maps.google.com/?q=Cala+Galdana+Menorca" },
      { titulo: "Cóctel con los pies en el agua", hora: "20:00", icono: "copas", lugar: "Terraza Es Barranc", direccion: "Passeig del Riu, 07750 Ferreries, Menorca" },
      { titulo: "La cena", hora: "21:30", icono: "plato", lugar: "Jardín del faro", direccion: "Passeig del Riu, 07750 Ferreries, Menorca" },
      { titulo: "Baile bajo las estrellas", hora: "23:30", icono: "nota", lugar: "Jardín del faro", direccion: "Passeig del Riu, 07750 Ferreries, Menorca" },
    ],
    dress: "Descalzos y de lino. Blanco roto, arena y azules; ellos, guayabera o camisa de lino. Habrá cestas para dejar los zapatos.",
    paleta: ["#f3ece0", "#7fcfcb", "#0e6973", "#d9c3a0"],
    hoteles: [
      { nombre: "Hotel Audax", nota: "Sobre la cala, a 3 minutos andando, desde 140 €. Código PAULAYMARC", enlace: "https://maps.google.com/?q=Cala+Galdana+Menorca" },
      { nombre: "Apartamentos Galdana Palms", nota: "Para grupos y familias, desde 90 €", enlace: "https://maps.google.com/?q=Cala+Galdana+Menorca" },
    ],
    iban: "ES44 2100 3001 2202 0055 4419",
    bizum: "677 08 54 12",
    titular: "Paula Serra y Marc Pons",
    hashtag: "PaulayMarc",
    notas: [
      { titulo: "Cómo llegar a Menorca", texto: "Hay ferris desde Barcelona y Alcúdia, y vuelos a Maó. Desde el aeropuerto, la cala está a 40 minutos." },
      { titulo: "Hay traslado", texto: "Un autobús sale de Ciutadella a las 18:00 y de Maó a las 18:05, y vuelve a la 1:30 y a las 4:00. Marcadlo al confirmar." },
      { titulo: "Protección solar", texto: "La ceremonia es a las siete, pero el sol de julio pica: habrá abanicos, agua y crema en la entrada." },
    ],
    titulos: { dia: "El día", historia: "Nuestra historia", galeria: "Sal y arena", playlist: "La música de la orilla", regalos: "Una caja de conchas", album: "Vuestras fotos" },
    notaRegalo: "Que vengáis ya es el regalo. Si además queréis tener un detalle, nos ayudará con el viaje de novios.",
  }),
];
