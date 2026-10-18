/**
 * Siembra UNA INVITACIÓN DE VERDAD por cada plantilla.
 *
 * Por qué: una ficha con un vídeo que hay que pulsar para que arranque es
 * frágil —si el navegador no deja reproducir, si la red va lenta, si el
 * autoplay se bloquea, el visitante no ve nada y se va—. Seis invitaciones
 * completas en su propia URL no tienen ese problema: se abren, se recorren y
 * se enseñan a alguien.
 *
 *   node herramientas/sembrar-demos.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");
const { Client } = createRequire(pathToFileURL(join(RAIZ, "app/package.json")).href)("pg");

for (const linea of readFileSync(join(RAIZ, "app/.env.local"), "utf8").split("\n")) {
  const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const cli = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await cli.connect();

/** Bloques comunes, con los textos adaptados a cada boda. */
function bloques({ frase, historia, paradas, dress, paleta, iban, foto, album, notas, hashtag, maqueta }) {
  return [
    { t: "portada", frase, foto, variante: maqueta.portada },
    { t: "cuentaAtras" },
    { t: "itinerario", paradas, titulo: maqueta.dia },
    // Capítulos con nombre y fecha, no un bloque de tres párrafos. Un
    // bloque se salta; una línea de tiempo se lee.
    {
      t: "capitulos",
      titulo: maqueta.historia,
      capitulos: historia.map((c, i) => ({ ...c, foto: i % 2 === 0 ? album[i] : undefined })),
    },
    { t: "galeria", fotos: album, titulo: maqueta.titulo, variante: maqueta.galeria },
    { t: "dressCode", nota: dress, paleta },
    {
      t: "alojamiento",
      opciones: [
        { nombre: "Hotel a 10 minutos", nota: "Desde 95 € · con desayuno" },
        { nombre: "Casa rural del valle", nota: "Desde 78 € · para grupos" },
      ],
    },
    { t: "playlist", spotify: "https://open.spotify.com/", titulo: maqueta.playlist },
    { t: "notas", items: notas },
    { t: "hashtag", etiqueta: hashtag },
    { t: "regalos", iban, titulo: maqueta.regalos },
    { t: "album", subidaInvitados: true, titulo: maqueta.album },
    { t: "muro" },
    { t: "rsvp", pideMenu: true, pideAlergias: true, pideBus: true },
  ];
}

/**
 * La maqueta de cada plantilla. Sin esto, diez bodas son la misma página
 * repintada: lo que las distingue de verdad no es el color, es dónde cae la
 * fotografía y cuánto ocupa.
 */
const MAQUETAS = {
  sobre:        { portada: "bajo",    galeria: "sangre", titulo: "Nosotros",        historia: "Nuestra historia",       dia: "El gran día",       playlist: "El soundtrack",      regalos: "Un detalle especial", album: "Comparte tus fotos" },
  floracion:    { portada: "centro",  galeria: "sangre", titulo: "Antes del día",   historia: "Cómo llegamos aquí",     dia: "El día",            playlist: "La banda sonora",    regalos: "Si os apetece",       album: "Vuestras fotos" },
  cielo:        { portada: "centro",  galeria: "tira",   titulo: "Aquel verano",    historia: "Nuestra travesía",       dia: "El itinerario",     playlist: "Lo que sonará",      regalos: "Un detalle",          album: "El álbum de todos" },
  velo:         { portada: "partida", galeria: "sangre", titulo: "Retratos",        historia: "Nuestra historia",              dia: "El gran día",       playlist: "El soundtrack",      regalos: "Un detalle especial", album: "Comparte tus fotos" },
  constelacion: { portada: "centro",  galeria: "tira",   titulo: "De noche",        historia: "Cómo empezó todo",       dia: "La noche",          playlist: "La lista",           regalos: "Un detalle",          album: "Subid vuestras fotos" },
  bruma:        { portada: "bajo",    galeria: "sangre", titulo: "Nosotros dos",    historia: "Cómo nos conocimos",       dia: "El día",            playlist: "Lo que suena",       regalos: "Si insistís",         album: "Las fotos del día" },
  marea:        { portada: "centro",  galeria: "tira",   titulo: "Cerca del agua",  historia: "Nuestra historia", dia: "El itinerario",    playlist: "La banda sonora",    regalos: "Un detalle",          album: "El álbum de la cala" },
  terracota:    { portada: "partida", galeria: "sangre", titulo: "En el campo",     historia: "Nueve años",    dia: "El gran día",       playlist: "El soundtrack",      regalos: "Un detalle especial", album: "Comparte tus fotos" },
  tinta:        { portada: "bajo",    galeria: "sangre", titulo: "Sin más",         historia: "Nosotros dos",             dia: "El día",            playlist: "La lista",           regalos: "Nada, en serio",      album: "Las fotos" },
  lino:         { portada: "bajo",    galeria: "sangre", titulo: "Aquel verano",   historia: "Nuestra historia",  dia: "El día",        playlist: "La lista",        regalos: "Un detalle",          album: "Comparte tus fotos" },
  brasa:        { portada: "partida", galeria: "tira",   titulo: "A contraluz",    historia: "Cómo empezó",       dia: "El gran día",   playlist: "El soundtrack",   regalos: "Un detalle especial", album: "Las fotos del día" },
  jardin:       { portada: "centro",  galeria: "tira",   titulo: "Entre plantas",   historia: "Cómo llegamos aquí", dia: "El gran día", playlist: "El soundtrack",     regalos: "Un detalle especial", album: "Comparte tus fotos" },
};

const BODAS = [
  {
    slug: "laura-y-ruben",
    plantilla: "sobre",
    a: "Laura", b: "Rubén",
    fecha: "2027-03-30T12:30:00+02:00",
    tema: { tinta: "#241a16", papel: "#f6f1e9", acento: "#8c1d2c", grano: 0.05 },
    frase: "Hay momentos que nos hacen infinitos. Queremos que estéis en el nuestro.",
    historia: [
      { cuando: "2020", titulo: "Un mensaje sin sentido", texto: "Rubén escribió algo que todavía hoy no sabemos qué quería decir. Laura contestó por educación." },
      { cuando: "2022", titulo: "Los dos zapatos", texto: "Se presentó a una cita con dos zapatos distintos. Laura se rió tanto que decidió ahí mismo que a ése lo quería para siempre." },
      { cuando: "2024", titulo: "Un perro de «solo unos días»", texto: "Se llama Trufa, lleva dos años en casa y duerme en el lado bueno de la cama." },
      { cuando: "30 de marzo de 2027", titulo: "Nos casamos", texto: "Y nos haría muchísima ilusión que estuvierais." },
    ],
    paradas: [
      { titulo: "Ceremonia", hora: "12:30", icono: "iglesia", lugar: "Iglesia Nuestra Señora de la Visitación", direccion: "Calle Pico de los Artilleros, 82, 28030 Madrid", mapa: "https://maps.google.com/?q=Calle+Pico+de+los+Artilleros+82+Madrid" },
      { titulo: "Brindis en el jardín", hora: "14:00", icono: "copas", lugar: "La Masía de José Luis", direccion: "P.º de la Puerta del Ángel, 3, 28011 Madrid", mapa: "https://maps.google.com/?q=La+Masia+de+Jose+Luis+Madrid" },
      { titulo: "El banquete", hora: "15:00", icono: "plato", lugar: "La Masía de José Luis", direccion: "P.º de la Puerta del Ángel, 3, 28011 Madrid", mapa: "https://maps.google.com/?q=La+Masia+de+Jose+Luis+Madrid" },
      { titulo: "Baile hasta tarde", hora: "19:00", icono: "nota", lugar: "La Masía de José Luis", direccion: "P.º de la Puerta del Ángel, 3, 28011 Madrid", mapa: "https://maps.google.com/?q=La+Masia+de+Jose+Luis+Madrid" },
    ],
    dress: "Etiqueta de tarde. Nada de blanco, que ese día va cogido.",
    paleta: ["#8c1d2c", "#c9b8a3", "#3f4a3c", "#1d1a17"],
    iban: "ES04 5498 6179 4966 5153 1546",
    hashtag: "LauraYRubenSeCasan",
    notas: [
      { titulo: "El aparcamiento se llena", texto: "Hay sitio para cincuenta coches y somos ciento veinte. Si podéis, compartid coche." },
      { titulo: "La iglesia es fresca", texto: "Aunque sea marzo, dentro hace frío. Llevad algo por encima." },
      { titulo: "Hay barra libre hasta las tres", texto: "Y a las tres hay recena. Aguantad." },
    ],
  },
  {
    slug: "nora-y-sebas",
    plantilla: "floracion",
    a: "Nora", b: "Sebas",
    fecha: "2027-05-12T18:00:00+02:00",
    tema: { tinta: "#24301f", papel: "#f5f6ef", acento: "#6c7d4f", grano: 0.06 },
    frase: "Nos casamos entre olivos, con los pies en la tierra y la gente que queremos.",
    historia: [
      { cuando: "2019", titulo: "Un limonero", texto: "Ella entró en el vivero buscando uno. Él no sabía qué buscaba, pero se quedó a ayudar." },
      { cuando: "2021", titulo: "El limonero sigue vivo", texto: "Contra todo pronóstico. Viene a la boda." },
      { cuando: "2024", titulo: "La finca", texto: "Encontramos el sitio de casualidad, volviendo de comprar tomateras." },
      { cuando: "12 de mayo de 2027", titulo: "Nos casamos entre olivos", texto: "Con los pies en la tierra y sin ninguna prisa." },
    ],
    paradas: [
      { titulo: "Ceremonia bajo el olivo", hora: "18:00", icono: "iglesia", lugar: "Finca El Olivar", direccion: "Ctra. de Chinchón, km 4, 28370 Chinchón, Madrid", mapa: "https://maps.google.com/?q=Chinchon+Madrid" },
      { titulo: "Aperitivo al fresco", hora: "19:30", icono: "copas", lugar: "Bajo la pérgola de la finca", direccion: "Misma dirección", mapa: "https://maps.google.com/?q=Chinchon+Madrid" },
      { titulo: "Cena en la pérgola", hora: "20:30", icono: "plato", lugar: "Bajo la pérgola de la finca", direccion: "Misma dirección", mapa: "https://maps.google.com/?q=Chinchon+Madrid" },
      { titulo: "Baile entre farolillos", hora: "23:00", icono: "nota", lugar: "Bajo la pérgola de la finca", direccion: "Misma dirección", mapa: "https://maps.google.com/?q=Chinchon+Madrid" },
    ],
    dress: "Vestid cómodos. Hay hierba, así que los tacones de aguja se hunden.",
    paleta: ["#6c7d4f", "#c8bfa6", "#d6a77a", "#2a3322"],
    iban: "ES91 2100 0418 4502 0005 1332",
    hashtag: "NoraYSebasEntreOlivos",
    notas: [
      { titulo: "Hay hierba y hay grava", texto: "Los tacones de aguja se hunden. Está avisado." },
      { titulo: "Se pone el sol a las nueve y media", texto: "La ceremonia es a las seis para que dé la luz buena en las fotos." },
      { titulo: "Traed una chaqueta", texto: "En mayo, en el campo y de noche, refresca más de lo que parece." },
    ],
  },
  {
    slug: "sara-y-marcos",
    plantilla: "cielo",
    a: "Sara", b: "Marcos",
    fecha: "2027-06-04T19:00:00+02:00",
    tema: { tinta: "#1b2836", papel: "#f3f6f8", acento: "#b0875a", grano: 0.03 },
    frase: "Nos casamos mirando al mar. Venid con tiempo y quedaos a dormir.",
    historia: [
      { cuando: "2018", titulo: "Dos meses y un billete", texto: "Nos fuimos de viaje a los dos meses de conocernos. Todo el mundo dijo que era pronto." },
      { cuando: "2018–2026", titulo: "Once países", texto: "Y seguimos discutiendo por quién hace la maleta." },
      { cuando: "2026", titulo: "La cala", texto: "La encontramos sin buscarla, un día que nos perdimos. Supimos que era ahí." },
      { cuando: "4 de junio de 2027", titulo: "Nos casamos mirando al mar", texto: "Venid con tiempo y quedaos a dormir." },
    ],
    paradas: [
      { titulo: "Ceremonia en la cala", hora: "19:00", icono: "iglesia", lugar: "Cala del Faro", direccion: "Camí del Far, 07820 Sant Antoni de Portmany, Ibiza", mapa: "https://maps.google.com/?q=Sant+Antoni+de+Portmany+Ibiza" },
      { titulo: "Brindis al atardecer", hora: "19:45", icono: "copas", lugar: "Es Torrent", direccion: "Playa Es Torrent, 07830 Sant Josep, Ibiza", mapa: "https://maps.google.com/?q=Es+Torrent+Ibiza" },
      { titulo: "Cena junto al agua", hora: "21:00", icono: "plato", lugar: "Es Torrent", direccion: "Playa Es Torrent, 07830 Sant Josep, Ibiza", mapa: "https://maps.google.com/?q=Es+Torrent+Ibiza" },
      { titulo: "Fiesta descalzos", hora: "00:00", icono: "nota", lugar: "Es Torrent", direccion: "Playa Es Torrent, 07830 Sant Josep, Ibiza", mapa: "https://maps.google.com/?q=Es+Torrent+Ibiza" },
    ],
    dress: "Lino, color y nada de corbata. Se va a la playa, no a un banco.",
    paleta: ["#b0875a", "#e3ddd2", "#7fa0b5", "#1b2836"],
    iban: "ES68 0049 1500 0526 1010 2345",
    hashtag: "SaraYMarcosEnIbiza",
    notas: [
      { titulo: "Venid con tiempo", texto: "La cala tiene un camino de tierra de diez minutos. No se llega en tacón." },
      { titulo: "Quedaos a dormir", texto: "Es en la otra punta de la isla y la vuelta de noche es larga." },
      { titulo: "Habrá viento", texto: "Siempre lo hay. Los peinados sencillos aguantan mejor." },
    ],
  },
  {
    slug: "claudia-y-jorge",
    plantilla: "velo",
    a: "Claudia", b: "Jorge",
    fecha: "2027-09-21T13:00:00+02:00",
    tema: { tinta: "#1f1d1b", papel: "#faf8f4", acento: "#9a7f63", grano: 0.04 },
    frase: "Después de doce años, por fin encontramos una excusa para reunir a todo el mundo.",
    historia: [
      { cuando: "2015", titulo: "En una boda ajena", texto: "Nos presentaron en el banquete. Nos pasamos la tarde diciendo que nosotros nunca nos casaríamos." },
      { cuando: "2018", titulo: "Dos mudanzas", texto: "Y un gato que no quería ninguno de los dos." },
      { cuando: "2026", titulo: "La pedida", texto: "Sin rodilla, sin restaurante y sin avisar a nadie. En el sofá, un martes." },
      { cuando: "21 de septiembre de 2027", titulo: "Doce años después", texto: "Por fin encontramos una excusa para reunir a todo el mundo." },
    ],
    paradas: [
      { titulo: "Ceremonia civil", hora: "13:00", icono: "iglesia", lugar: "Casino de Madrid", direccion: "Calle de Alcalá, 15, 28014 Madrid", mapa: "https://maps.google.com/?q=Casino+de+Madrid" },
      { titulo: "Cóctel en el patio", hora: "13:45", icono: "copas", lugar: "Salón Real", direccion: "Mismo edificio, planta principal" },
      { titulo: "Banquete", hora: "15:00", icono: "plato", lugar: "Salón Real", direccion: "Mismo edificio, planta principal" },
      { titulo: "Barra y baile", hora: "19:00", icono: "nota", lugar: "Salón Real", direccion: "Mismo edificio, planta principal" },
    ],
    dress: "Etiqueta. Es de las pocas veces que tendréis excusa, aprovechadla.",
    paleta: ["#9a7f63", "#d8d2c8", "#4a4640", "#1f1d1b"],
    iban: "ES23 0182 2370 4402 0154 8871",
    hashtag: "ClaudiaYJorgeAlFin",
    notas: [
      { titulo: "Es en pleno centro", texto: "No vengáis en coche: el aparcamiento más cercano está a diez minutos andando." },
      { titulo: "Etiqueta de verdad", texto: "Es de las pocas veces que tendréis excusa. Aprovechadla." },
      { titulo: "Se come a las tres", texto: "Desayunad bien, que la ceremonia es larga." },
    ],
  },
  {
    slug: "yone-y-noe",
    plantilla: "constelacion",
    a: "Yone", b: "Noe",
    fecha: "2027-10-18T20:00:00+02:00",
    tema: { tinta: "#14182a", papel: "#f3f2f7", acento: "#b08d57", grano: 0.03 },
    frase: "De noche, con guirnaldas, con la música alta y con vosotros.",
    historia: [
      { cuando: "2021", titulo: "Las cuatro de la mañana", texto: "En una fiesta a la que ninguna de las dos quería ir." },
      { cuando: "2023", titulo: "Seguimos yendo", texto: "A fiestas a las que no queremos ir. Pero ahora vamos juntas." },
      { cuando: "2026", titulo: "La azotea", texto: "La vimos desde la calle y subimos a preguntar. Nos dijeron que sí." },
      { cuando: "18 de octubre de 2027", titulo: "De noche", texto: "Con guirnaldas, con la música alta y con vosotros." },
    ],
    paradas: [
      { titulo: "Ceremonia en la azotea", hora: "20:00", icono: "iglesia", lugar: "Azotea del Círculo", direccion: "Calle de Alcalá, 42, 28014 Madrid", mapa: "https://maps.google.com/?q=Circulo+de+Bellas+Artes+Madrid" },
      { titulo: "Brindis con la ciudad abajo", hora: "20:45", icono: "copas", lugar: "Patio de la Corredera", direccion: "Plaza de la Corredera, 4, 28012 Madrid", mapa: "https://maps.google.com/?q=Plaza+Corredera+Madrid" },
      { titulo: "Cena", hora: "21:30", icono: "plato", lugar: "Patio de la Corredera", direccion: "Plaza de la Corredera, 4, 28012 Madrid", mapa: "https://maps.google.com/?q=Plaza+Corredera+Madrid" },
      { titulo: "Bengalas a medianoche", hora: "00:00", icono: "nota", lugar: "Patio de la Corredera", direccion: "Plaza de la Corredera, 4, 28012 Madrid", mapa: "https://maps.google.com/?q=Plaza+Corredera+Madrid" },
    ],
    dress: "Negro, dorado o lo que os apetezca. Pero zapatos de bailar.",
    paleta: ["#b08d57", "#2b3550", "#8e93a6", "#14182a"],
    iban: "ES77 1465 0100 9017 2942 1130",
    hashtag: "YoneYNoeDeNoche",
    notas: [
      { titulo: "Se sube en ascensor", texto: "La azotea está en la séptima planta. Hay ascensor y sitio de sobra, no hace falta subir andando." },
      { titulo: "Refresca a partir de las once", texto: "Estamos al aire libre. Traed algo de abrigo aunque sea octubre." },
      { titulo: "Las bengalas las ponemos nosotras", texto: "A medianoche. No hace falta que traigáis nada." },
    ],
  },
  {
    slug: "frank-y-nico",
    plantilla: "bruma",
    a: "Frank", b: "Nico",
    fecha: "2027-02-07T12:00:00+01:00",
    tema: { tinta: "#242220", papel: "#f5f3ef", acento: "#8a7250", grano: 0.04 },
    frase: "Una boda pequeña, en invierno, entre niebla y sin ninguna prisa.",
    historia: [
      { cuando: "2022", titulo: "Un año de cartas", texto: "Nos escribimos durante un año entero antes de vernos. Los dos pensábamos que el otro no era real." },
      { cuando: "2023", titulo: "Resultó que sí", texto: "Nos vimos en una estación, con niebla, y no hizo falta decir nada." },
      { cuando: "2026", titulo: "Sintra", texto: "Volvimos al sitio donde nos vimos por primera vez. Seguía habiendo niebla." },
      { cuando: "7 de febrero de 2027", titulo: "Somos pocos", texto: "A propósito. Si estás leyendo esto, eres de los pocos." },
    ],
    paradas: [
      { titulo: "Ceremonia entre la niebla", hora: "12:00", icono: "iglesia", lugar: "Palacio de Monserrate", direccion: "R. Barbosa du Bocage, 2710 Sintra, Portugal", mapa: "https://maps.google.com/?q=Palacio+de+Monserrate+Sintra" },
      { titulo: "Vermut junto al fuego", hora: "13:00", icono: "copas", lugar: "Quinta da Regaleira", direccion: "R. Barbosa du Bocage 5, 2710 Sintra" },
      { titulo: "Comida larga", hora: "14:00", icono: "plato", lugar: "Quinta da Regaleira", direccion: "R. Barbosa du Bocage 5, 2710 Sintra" },
      { titulo: "Sobremesa sin hora", hora: "17:00", icono: "nota", lugar: "Quinta da Regaleira", direccion: "R. Barbosa du Bocage 5, 2710 Sintra" },
    ],
    dress: "Abrigaos. Va en serio: en febrero, allí arriba, hay niebla y frío.",
    paleta: ["#8a7250", "#cfc9c0", "#6e6a63", "#242220"],
    iban: "ES15 3025 0008 2214 3340 9987",
    hashtag: "FrankYNicoEnSintra",
    notas: [
      { titulo: "Los escalones resbalan", texto: "Con la humedad, la piedra del palacio se pone traicionera. Calzado con suela, por favor." },
      { titulo: "No hay cobertura dentro", texto: "Si tenéis que llamar a alguien, hacedlo antes de entrar." },
      { titulo: "Somos cuarenta", texto: "Está todo el mundo invitado a todo. No hay lista de segunda vuelta." },
    ],
  },

  {
    slug: "elena-y-pau",
    plantilla: "marea",
    a: "Elena", b: "Pau",
    fecha: "2027-07-06T19:30:00+02:00",
    tema: { tinta: "#17293a", papel: "#f2f6f8", acento: "#3d6b86", grano: 0.03 },
    frase: "Nos casamos con los pies en la arena y el pelo hecho un desastre.",
    historia: [
      { cuando: "2020", titulo: "Un barco parado", texto: "Nos conocimos esperando a que arreglaran el motor, en mitad de la bahía." },
      { cuando: "2020", titulo: "Cuatro horas", texto: "Fueron las mejores cuatro horas de aquel verano." },
      { cuando: "2025", titulo: "Cerca del agua", texto: "Desde entonces todo lo importante nos pasa cerca del agua." },
      { cuando: "6 de julio de 2027", titulo: "Con los pies en la arena", texto: "Y el pelo hecho un desastre." },
    ],
    paradas: [
      { titulo: "Ceremonia en la arena", hora: "19:30", icono: "iglesia", lugar: "Cala Pregonda", direccion: "Camí de Pregonda, 07740 Es Mercadal, Menorca", mapa: "https://maps.google.com/?q=Cala+Pregonda+Menorca" },
      { titulo: "Brindis con el sol bajando", hora: "20:15", icono: "copas", lugar: "Club Náutico de Fornells", direccion: "Passeig Marítim, 07748 Fornells", mapa: "https://maps.google.com/?q=Fornells+Menorca" },
      { titulo: "Cena en el club", hora: "21:30", icono: "plato", lugar: "Club Náutico de Fornells", direccion: "Passeig Marítim, 07748 Fornells", mapa: "https://maps.google.com/?q=Fornells+Menorca" },
      { titulo: "Baile con los pies mojados", hora: "00:30", icono: "nota", lugar: "Club Náutico de Fornells", direccion: "Passeig Marítim, 07748 Fornells", mapa: "https://maps.google.com/?q=Fornells+Menorca" },
    ],
    dress: "Lino, colores claros y nada de tacón fino. Se pisa arena.",
    paleta: ["#3d6b86", "#e6e2d6", "#c9ad84", "#17293a"],
    iban: "ES60 2100 4423 1102 0034 5510",
    hashtag: "ElenaYPauEnLaCala",
    notas: [
      { titulo: "Se baja andando", texto: "Hay quince minutos de camino desde el aparcamiento. Llevad el calzado en la mano si hace falta." },
      { titulo: "No hay sombra", texto: "A las siete y media todavía pega. Gorra o sombrero, sin vergüenza." },
      { titulo: "La vuelta es de noche", texto: "El camino no tiene luz. Ponemos autobús a las dos." },
    ],
  },
  {
    slug: "irene-y-dani",
    plantilla: "terracota",
    a: "Irene", b: "Dani",
    fecha: "2027-09-13T18:00:00+02:00",
    tema: { tinta: "#3a2418", papel: "#faf3ea", acento: "#b5623a", grano: 0.06 },
    frase: "Una finca de secano, mesas largas y nadie sentado donde le tocaba.",
    historia: [
      { cuando: "2018", titulo: "Un pisto", texto: "Nos conocimos discutiendo por un pisto. Seguimos discutiendo por ese pisto." },
      { cuando: "2021", titulo: "El huerto", texto: "Dos gallinas, cuatro tomateras y ninguna intención de ponernos de acuerdo." },
      { cuando: "2026", titulo: "La era", texto: "Vimos la finca en septiembre, con la luz que hace a las siete, y ya no miramos más." },
      { cuando: "13 de septiembre de 2027", titulo: "Venid con hambre", texto: "Mesas largas y nadie sentado donde le tocaba." },
    ],
    paradas: [
      { titulo: "Ceremonia en la era", hora: "18:00", icono: "iglesia", lugar: "Finca La Alberca", direccion: "Camino de los Molinos s/n, 45200 Illescas, Toledo", mapa: "https://maps.google.com/?q=Illescas+Toledo" },
      { titulo: "Vermut con sombra", hora: "19:00", icono: "copas", lugar: "Era de la finca", direccion: "Misma dirección" },
      { titulo: "Cena en mesas largas", hora: "21:00", icono: "plato", lugar: "Era de la finca", direccion: "Misma dirección" },
      { titulo: "Verbena", hora: "23:30", icono: "nota", lugar: "Era de la finca", direccion: "Misma dirección" },
    ],
    dress: "Tonos tierra si os apetece. Y algo de manga: al caer el sol refresca.",
    paleta: ["#b5623a", "#d9c3a5", "#7a8b5f", "#3a2418"],
    iban: "ES47 0081 5522 3300 0142 7788",
    hashtag: "IreneYDaniEnLaEra",
    notas: [
      { titulo: "El camino es de tierra", texto: "Dos kilómetros. Se pasa bien con cualquier coche, pero despacio." },
      { titulo: "Hay mosquitos", texto: "Ponemos repelente en las mesas, pero avisamos." },
      { titulo: "Se come a las nueve", texto: "Y hay aperitivo desde las siete. No vengáis desayunados de más." },
    ],
  },
  {
    slug: "marta-y-alvaro",
    plantilla: "tinta",
    a: "Marta", b: "Álvaro",
    fecha: "2027-11-08T12:00:00+01:00",
    tema: { tinta: "#131313", papel: "#f7f7f5", acento: "#55534e", grano: 0.07 },
    frase: "Sin flores, sin discursos y sin protocolo. Solo nosotros y vosotros.",
    historia: [
      { cuando: "2019", titulo: "Poco ruido", texto: "Nos gusta poco el ruido, poca gente y mucho estar callados juntos." },
      { cuando: "2023", titulo: "Sin planes", texto: "Nunca hemos hecho un plan a más de una semana vista. Éste es el primero." },
      { cuando: "8 de noviembre de 2027", titulo: "Pequeña y corta", texto: "Y a mediodía. Si estás invitado es porque sabes estar callado con nosotros." },
    ],
    paradas: [
      { titulo: "Ceremonia", hora: "12:00", icono: "iglesia", lugar: "Registro Civil de Madrid", direccion: "Calle Pradillo, 66, 28002 Madrid", mapa: "https://maps.google.com/?q=Registro+Civil+Madrid+Pradillo" },
      { titulo: "Comida", hora: "14:00", icono: "plato", lugar: "Casa Salvador", direccion: "Calle de Barbieri, 12, 28004 Madrid", mapa: "https://maps.google.com/?q=Casa+Salvador+Madrid" },
      { titulo: "Café y hasta luego", hora: "17:00", icono: "copas", lugar: "Casa Salvador", direccion: "Calle de Barbieri, 12, 28004 Madrid", mapa: "https://maps.google.com/?q=Casa+Salvador+Madrid" },
    ],
    dress: "Lo que os pongáis para una comida buena. Nada más.",
    paleta: ["#131313", "#8d8b85", "#d8d6d0", "#f7f7f5"],
    iban: "ES12 0049 0001 5021 0033 1199",
    hashtag: "MartaYAlvaroSinRuido",
    notas: [
      { titulo: "Somos veinticinco", texto: "No hay más sitio. Si no podéis venir, avisadnos pronto." },
      { titulo: "Empieza puntual", texto: "El registro va con reloj. A las doce y cinco ya no se entra." },
      { titulo: "No hace falta regalo", texto: "Lo decimos en serio. Venid y ya está." },
    ],
  },
  {
    slug: "lucia-y-tomas",
    plantilla: "jardin",
    a: "Lucía", b: "Tomás",
    fecha: "2027-04-24T17:00:00+02:00",
    tema: { tinta: "#1b2a1c", papel: "#f4f7f0", acento: "#456b3f", grano: 0.05 },
    frase: "En un invernadero, rodeados de helechos y de la gente que queremos.",
    historia: [
      { cuando: "2020", titulo: "Las matábamos todas", texto: "Por separado, cada uno mataba todas las plantas que le regalaban." },
      { cuando: "2023", titulo: "Cuatro años sin matar ninguna", texto: "Juntos. Y eso nos pareció una señal." },
      { cuando: "2026", titulo: "El invernadero", texto: "Entramos a resguardarnos de la lluvia y salimos con fecha." },
      { cuando: "24 de abril de 2027", titulo: "Entre plantas", texto: "Que no se nos mueran." },
    ],
    paradas: [
      { titulo: "Ceremonia entre helechos", hora: "17:00", icono: "iglesia", lugar: "Invernadero de los Jardines", direccion: "Paseo de la Castellana, 28046 Madrid", mapa: "https://maps.google.com/?q=Invernadero+Madrid" },
      { titulo: "Cóctel acristalado", hora: "18:00", icono: "copas", lugar: "Patio acristalado", direccion: "Mismo recinto" },
      { titulo: "Cena", hora: "20:00", icono: "plato", lugar: "Patio acristalado", direccion: "Mismo recinto" },
      { titulo: "Baile bajo el cristal", hora: "23:00", icono: "nota", lugar: "Patio acristalado", direccion: "Mismo recinto" },
    ],
    dress: "Verde si os apetece. Y cuidado con los tacones: el suelo es de rejilla.",
    paleta: ["#456b3f", "#cdd8c2", "#a58b62", "#1b2a1c"],
    iban: "ES33 2038 1100 5060 0077 4411",
    hashtag: "LuciaYTomasEnElInvernadero",
    notas: [
      { titulo: "Dentro hace calor", texto: "Es un invernadero de verdad. Vestid en capas." },
      { titulo: "El suelo es de rejilla", texto: "Los tacones finos se quedan clavados. Está avisado." },
      { titulo: "Hay polen", texto: "Si alguien es muy alérgico, que nos lo diga y lo sentamos en el patio." },
    ],
  },
  {
    slug: "julia-y-hector",
    plantilla: "lino",
    a: "Julia", b: "Héctor",
    fecha: "2027-08-02T13:00:00+02:00",
    tema: { tinta: "#2c2822", papel: "#faf7f1", acento: "#9c8e74", grano: 0.06 },
    frase: "A mediodía, con la casa abierta y la puerta sin llave.",
    historia: [
      { cuando: "2017", titulo: "Vecinos de rellano", texto: "Vivíamos puerta con puerta y tardamos año y medio en decirnos algo más que «buenos días»." },
      { cuando: "2019", titulo: "Una llave de más", texto: "Él le dejó una copia por si se le olvidaba la suya. Ella nunca se la devolvió." },
      { cuando: "2026", titulo: "La casa del pueblo", texto: "Era de su abuela. Llevaba doce años cerrada y la hemos abierto entre los dos." },
      { cuando: "2 de agosto de 2027", titulo: "Nos casamos allí", texto: "En el patio, a mediodía, con toda la casa abierta." },
    ],
    paradas: [
      { titulo: "Ceremonia en el patio", hora: "13:00", icono: "iglesia", lugar: "Casa de la Calle Mayor", direccion: "Calle Mayor, 11, 44126 Terriente, Teruel", mapa: "https://maps.google.com/?q=Terriente+Teruel" },
      { titulo: "Vermut a la sombra", hora: "14:00", icono: "copas", lugar: "Bajo la parra", direccion: "Misma dirección" },
      { titulo: "Comida en el patio", hora: "15:00", icono: "plato", lugar: "Mesas largas", direccion: "Misma dirección" },
      { titulo: "Sobremesa hasta que caiga el sol", hora: "18:00", icono: "nota", lugar: "Donde os apetezca", direccion: "Misma dirección" },
    ],
    dress: "Lino, crudo, hueso. Y sombrero si sois de piel clara: no hay mucha sombra.",
    paleta: ["#9c8e74", "#e6e0d3", "#7d8a6b", "#2c2822"],
    iban: "ES88 2085 9010 1103 3012 4477",
    hashtag: "JuliaYHectorEnLaCasa",
    notas: [
      { titulo: "El pueblo tiene cuarenta habitantes", texto: "No hay hotel. Os buscamos sitio si nos avisáis con tiempo." },
      { titulo: "Se come a las tres", texto: "Y se cena lo que sobre, para quien se quede." },
      { titulo: "Hace calor de verdad", texto: "Estamos a 1.400 metros pero en agosto pega. Traed agua." },
    ],
  },
  {
    slug: "carmen-y-ivan",
    plantilla: "brasa",
    a: "Carmen", b: "Iván",
    fecha: "2027-10-11T18:30:00+02:00",
    tema: { tinta: "#2a1712", papel: "#faf2ec", acento: "#a8432a", grano: 0.05 },
    frase: "Con el último sol de octubre y las manos llenas de tierra.",
    historia: [
      { cuando: "2016", titulo: "Una hoguera", texto: "Nos conocimos en una hoguera de San Juan, discutiendo sobre si se salta con los pies juntos." },
      { cuando: "2020", titulo: "El fuego de casa", texto: "Nuestra primera casa tenía chimenea y no teníamos ni sofá. Dormimos en el suelo, delante." },
      { cuando: "2026", titulo: "El olivar", texto: "Compramos cuatro olivos viejos. Nos casamos entre ellos." },
      { cuando: "11 de octubre de 2027", titulo: "A contraluz", texto: "Con el último sol de octubre, que es el mejor del año." },
    ],
    paradas: [
      { titulo: "Ceremonia a contraluz", hora: "18:30", icono: "iglesia", lugar: "Olivar de los Cuatro", direccion: "Camino del Cerro, 23710 Bailén, Jaén", mapa: "https://maps.google.com/?q=Bailen+Jaen" },
      { titulo: "Brindis con el sol bajando", hora: "19:30", icono: "copas", lugar: "En el olivar", direccion: "Misma dirección" },
      { titulo: "Cena junto al fuego", hora: "21:00", icono: "plato", lugar: "Bajo la carpa", direccion: "Misma dirección" },
      { titulo: "Hoguera hasta las tantas", hora: "00:00", icono: "nota", lugar: "Donde acabemos", direccion: "Misma dirección" },
    ],
    dress: "Rojos, cobres, tierras. Y calzado cerrado: hay piedra suelta.",
    paleta: ["#a8432a", "#d9b48f", "#6d5c4a", "#2a1712"],
    iban: "ES29 0128 0301 2201 0044 5566",
    hashtag: "CarmenYIvanAContraluz",
    notas: [
      { titulo: "Se pone el sol a las siete y media", texto: "La ceremonia empieza a las seis y media para que dé la luz buena. Sed puntuales de verdad." },
      { titulo: "Refresca de golpe", texto: "En cuanto se va el sol, bajan diez grados. Chaqueta." },
      { titulo: "Hay hoguera", texto: "Si no os gusta el humo, la carpa está a veinte metros." },
    ],
  },
];

for (const b of BODAS) {
  const { rows } = await cli.query(
    `insert into invitaciones
       (slug, plantilla, estado, nombre_a, nombre_b, fecha, tema, apertura, musica, bloques, publicada_en)
     values ($1,$2,'publicada',$3,$4,$5,$6,$7,$8,$9, now())
     on conflict (slug) do update set
       plantilla=excluded.plantilla, estado=excluded.estado,
       nombre_a=excluded.nombre_a, nombre_b=excluded.nombre_b,
       fecha=excluded.fecha, tema=excluded.tema,
       apertura=excluded.apertura, musica=excluded.musica,
       bloques=excluded.bloques
     returning id`,
    [
      b.slug, b.plantilla, b.a, b.b, b.fecha,
      JSON.stringify(b.tema),
      JSON.stringify({
        vertical: `/aperturas/${b.plantilla}/vertical.mp4`,
        horizontal: `/aperturas/${b.plantilla}/horizontal.mp4`,
        poster: `/aperturas/${b.plantilla}/poster.avif`,
        rotuloEn: { sobre: 3.0, floracion: 3.2, cielo: 4.0, velo: 2.8, constelacion: 3.5, bruma: 2.6 }[b.plantilla],
        rotuloClaro: true,
      }),
      // La canción: es lo que hace que la puerta diga «entrar con su
      // canción» en vez de «entrar con música».
      JSON.stringify({
        url: "/musica/demo.m4a",
        titulo: `La canción de ${b.a} y ${b.b}`,
        deDedicalo: true,
      }),
      JSON.stringify(
        bloques({
          ...b,
          foto: `/fotos/p-${b.plantilla}.avif`,
          album: [1, 2, 3, 4].map((n) => `/fotos/bodas/${b.plantilla}-${n}.avif`),
          notas: b.notas,
          hashtag: b.hashtag,
          maqueta: MAQUETAS[b.plantilla],
        }),
      ),
    ],
  );
  await cli.query(
    `insert into paneles (invitacion_id) values ($1) on conflict do nothing`,
    [rows[0].id],
  );
  console.log(`${b.plantilla.padEnd(14)} /i/${b.slug}`);
}

await cli.end();
console.log("\ndoce invitaciones completas, una por plantilla");
