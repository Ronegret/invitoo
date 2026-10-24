import type { Bloque, Invitacion, Parada, PlantillaId, Tema } from "@/lib/tipos";
import { DEMOS_TEMATICAS } from "../plantillas/tematicas/demos.ts";

/**
 * Las invitaciones de muestra: UNA BODA POR PLANTILLA, completa.
 *
 * Es exactamente la forma de la fila de `invitaciones` en Supabase, y es lo
 * que se sirve en local sin base de datos. Las nueve cubren los nueve
 * criterios del catálogo, así que cada una pinta todos los bloques posibles:
 * lo que su plantilla no destaca aparece en «Y además», que también hay que
 * poder ver.
 *
 * Las bodas y las parejas son de ejemplo. Las fotos son propias de
 * Invitoo, generadas con IA y con personas ficticias (public/generadas). Registro y Azulejo no
 * llevan foto de portada a propósito: su portada es tipográfica.
 */

type Datos = {
  slug: string;
  plantilla: PlantillaId;
  a: string;
  b: string;
  fecha: string;
  tema: Tema;
  apertura?: Invitacion["apertura"];
  frase: string;
  foto?: string;
  album: string[];
  historia: { cuando: string; titulo: string; texto: string }[];
  paradas: Parada[];
  dress: string;
  paleta: string[];
  hoteles: { nombre: string; nota?: string; enlace?: string }[];
  iban: string;
  hashtag: string;
  notas: { titulo: string; texto: string }[];
  titulos: { dia?: string; historia?: string; galeria?: string; playlist?: string; regalos?: string; album?: string };
};

function video(id: string, rotuloEn: number): Invitacion["apertura"] {
  return {
    vertical: `/aperturas/${id}/vertical.mp4`,
    horizontal: `/aperturas/${id}/horizontal.mp4`,
    poster: `/aperturas/${id}/poster.avif`,
    rotuloEn,
    rotuloClaro: true,
  };
}

function boda(d: Datos): Invitacion {
  const bloques: Bloque[] = [
    { t: "portada", frase: d.frase, foto: d.foto },
    { t: "cuentaAtras" },
    { t: "itinerario", paradas: d.paradas, titulo: d.titulos.dia },
    {
      t: "capitulos",
      titulo: d.titulos.historia,
      capitulos: d.historia.map((c, i) => ({ ...c, foto: i % 2 === 0 ? d.album[i] : undefined })),
    },
    { t: "galeria", fotos: d.album, titulo: d.titulos.galeria },
    { t: "dressCode", nota: d.dress, paleta: d.paleta },
    { t: "alojamiento", opciones: d.hoteles },
    { t: "playlist", spotify: "https://open.spotify.com/", titulo: d.titulos.playlist },
    { t: "notas", items: d.notas },
    { t: "hashtag", etiqueta: d.hashtag },
    { t: "regalos", iban: d.iban, titulo: d.titulos.regalos },
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

/** Fotos propias de Invitoo (FLUX.2 klein, personas ficticias): `public/generadas`. */
const ia = (id: string) => `/generadas/${id}-1080.avif`;
const fotos = (id: string) => [1, 2, 3, 4].map((n) => ia(`${id}-album-${n}`));

/**
 * Carta, la insignia: la boda más completa del catálogo. Fotos de las
 * series que no usa ninguna otra demo (brasa, jardín y terracota), y cada
 * capítulo con la suya.
 */
function cartaDemo(): Invitacion {
  const b = boda({
    slug: "ines-y-gonzalo",
    plantilla: "carta",
    a: "Inés",
    b: "Gonzalo",
    fecha: "2027-09-18T17:30:00+02:00",
    tema: { tinta: "#1d2620", papel: "#f6f0e4", acento: "#1f3a2e", grano: 0.035 },
    frase: "Después de tantos domingos de sierra, queremos celebrar el más importante con vosotros.",
    foto: ia("carta-portada"),
    album: fotos("carta"),
    historia: [
      { cuando: "Otoño de 2016 · Valsaín", titulo: "El autobús de las siete", texto: "Ella subía a la sierra a dibujar pinos; él, a correr. Coincidimos tres domingos seguidos antes de atrevernos a decir hola." },
      { cuando: "2018 · Nuestras aventuras", titulo: "Cuarenta mapas y un coche viejo", texto: "Del Cabo de Gata a los Picos de Europa. Discutimos en todas las rotondas y no cambiaríamos ni una." },
      { cuando: "Verano de 2025 · El Mirador de la Reina", titulo: "La pregunta", texto: "Al atardecer, en el banco donde Inés dibujaba. Gonzalo llevaba el anillo en el bolsillo y la voz temblando." },
      { cuando: "18 de septiembre de 2027 · La Granja", titulo: "Nos casamos entre pinos", texto: "Y queremos que estéis vosotros, que habéis estado siempre." },
    ],
    paradas: [
      { titulo: "El sí, quiero", hora: "17:30", icono: "iglesia", lugar: "Iglesia de Nuestra Señora del Rosario", direccion: "Plaza de los Dolores, 40100 Real Sitio de San Ildefonso, Segovia" },
      { titulo: "Brindis bajo los pinos", hora: "19:00", icono: "copas", lugar: "Casa de los Pinos", direccion: "Carretera de Valsaín, km 3, 40109 Valsaín, Segovia" },
      { titulo: "La cena", hora: "21:00", icono: "plato", lugar: "Casa de los Pinos", direccion: "Carretera de Valsaín, km 3, 40109 Valsaín, Segovia" },
      { titulo: "Bajo las estrellas", hora: "23:30", icono: "nota", lugar: "Casa de los Pinos", direccion: "Carretera de Valsaín, km 3, 40109 Valsaín, Segovia" },
    ],
    dress: "Etiqueta de tarde. En septiembre la sierra refresca al caer el sol: traed algo para los hombros. Y tacón ancho, que la cena es sobre césped.",
    paleta: ["#1f3a2e", "#b08d57", "#e9dfcc", "#6e1f2b"],
    hoteles: [
      { nombre: "Parador de La Granja", nota: "A 6 minutos de la iglesia, desde 110 €", enlace: "https://maps.google.com/?q=Parador+de+La+Granja" },
      { nombre: "Casas rurales en Valsaín", nota: "A 4 minutos de la cena; os pasamos una lista", enlace: "https://maps.google.com/?q=casas+rurales+Valsain" },
    ],
    iban: "ES21 0049 1500 0512 3456 7892",
    hashtag: "InesYGonzaloEntrePinos",
    notas: [
      { titulo: "Hay autobús desde Madrid", texto: "Sale de Moncloa a las 15:45 y vuelve a la 1:30 y a las 4:00. Marcadlo al confirmar." },
      { titulo: "En la finca no hay cobertura", texto: "Os lo decimos ahora para que nadie se agobie. Hay wifi en la casa." },
      { titulo: "Por la noche, chaqueta", texto: "A las once puede hacer doce grados. Habrá mantas, pero no para todos." },
    ],
    titulos: { dia: "El gran día", historia: "Nuestra historia", galeria: "Aquel día", playlist: "La música de la noche", regalos: "Un detalle", album: "Vuestras fotos" },
  });
  const fotosCapitulos = [
    ia("carta-capitulo-1"),
    ia("carta-capitulo-2"),
    ia("carta-capitulo-3"),
    ia("carta-capitulo-4"),
  ];
  b.bloques = b.bloques.map((x) => {
    if (x.t === "capitulos") return { ...x, capitulos: x.capitulos.map((c, i) => ({ ...c, foto: fotosCapitulos[i] })) };
    if (x.t === "regalos") return { ...x, bizum: "612 48 39 07", titular: "Inés Barrios y Gonzalo Ruiz", nota: "Vuestra compañía es el mejor regalo. Si además queréis tener un detalle, nos ayudará con el viaje." };
    if (x.t === "playlist") return { ...x, nota: "Si hay una canción que te levanta de la silla, queremos oírla bajo los pinos." };
    return x;
  });
  return b;
}

const BODAS: Invitacion[] = [
  boda({
    slug: "laura-y-ruben",
    plantilla: "sobre",
    a: "Laura",
    b: "Rubén",
    fecha: "2027-03-30T12:30:00+02:00",
    tema: { tinta: "#241a16", papel: "#f6f1e9", acento: "#8c1d2c", grano: 0.05 },
    apertura: video("sobre", 3.0),
    frase: "Hay momentos que nos hacen infinitos. Queremos que estéis en el nuestro.",
    foto: ia("sobre-portada"),
    album: fotos("sobre"),
    historia: [
      { cuando: "2020", titulo: "Un mensaje sin sentido", texto: "Rubén escribió algo que todavía hoy no sabemos qué quería decir. Laura contestó por educación." },
      { cuando: "2022", titulo: "Los dos zapatos", texto: "Se presentó a una cita con dos zapatos distintos. Laura se rió tanto que decidió ahí mismo que a ése lo quería para siempre." },
      { cuando: "2024", titulo: "Un perro de «solo unos días»", texto: "Se llama Trufa, lleva dos años en casa y duerme en el lado bueno de la cama." },
      { cuando: "30 de marzo de 2027", titulo: "Nos casamos", texto: "Y nos haría muchísima ilusión que estuvierais." },
    ],
    paradas: [
      { titulo: "Ceremonia", hora: "12:30", icono: "iglesia", lugar: "Iglesia Nuestra Señora de la Visitación", direccion: "Calle Pico de los Artilleros, 82, 28030 Madrid", mapa: "https://maps.google.com/?q=Calle+Pico+de+los+Artilleros+82+Madrid" },
      { titulo: "Brindis en el jardín", hora: "14:00", icono: "copas", lugar: "La Masía de José Luis", direccion: "P.º de la Puerta del Ángel, 3, 28011 Madrid", mapa: "https://maps.google.com/?q=La+Masia+de+Jose+Luis+Madrid" },
      { titulo: "El banquete", hora: "15:00", icono: "plato", lugar: "La Masía de José Luis", direccion: "P.º de la Puerta del Ángel, 3, 28011 Madrid" },
      { titulo: "Baile hasta tarde", hora: "19:00", icono: "nota", lugar: "La Masía de José Luis", direccion: "P.º de la Puerta del Ángel, 3, 28011 Madrid" },
    ],
    dress: "Etiqueta de tarde. Nada de blanco, que ese día va cogido.",
    paleta: ["#8c1d2c", "#c9b8a3", "#3f4a3c", "#1d1a17"],
    hoteles: [
      { nombre: "Hotel Puerta de Madrid", nota: "A 8 minutos del convite, desde 95 €", enlace: "https://maps.google.com/?q=Hotel+Puerta+de+Madrid" },
      { nombre: "Ilunion Pío XII", nota: "A 15 minutos, desde 78 €", enlace: "https://maps.google.com/?q=Ilunion+Pio+XII" },
    ],
    iban: "ES04 5498 6179 4966 5153 1546",
    hashtag: "LauraYRubenSeCasan",
    notas: [
      { titulo: "El aparcamiento se llena", texto: "Hay sitio para cincuenta coches y somos ciento veinte. Si podéis, compartid coche." },
      { titulo: "La iglesia es fresca", texto: "Aunque sea marzo, dentro hace frío. Llevad algo por encima." },
      { titulo: "Hay barra libre hasta las tres", texto: "Y a las tres hay recena. Aguantad." },
    ],
    titulos: { dia: "El gran día", historia: "Nuestra historia", galeria: "Nosotros", playlist: "El soundtrack", regalos: "Un detalle especial", album: "Comparte tus fotos" },
  }),
  boda({
    slug: "nora-y-sebas",
    plantilla: "floracion",
    a: "Nora",
    b: "Sebas",
    fecha: "2027-05-12T18:00:00+02:00",
    tema: { tinta: "#24301f", papel: "#f1f2e6", acento: "#5e6f45", grano: 0.06 },
    apertura: video("floracion", 3.2),
    frase: "Nos casamos entre olivos, con los pies en la tierra y la gente que queremos.",
    foto: ia("floracion-portada"),
    album: fotos("floracion"),
    historia: [
      { cuando: "2019", titulo: "Un limonero", texto: "Ella entró en el vivero buscando uno. Él no sabía qué buscaba, pero se quedó a ayudar." },
      { cuando: "2021", titulo: "El limonero sigue vivo", texto: "Contra todo pronóstico. Viene a la boda." },
      { cuando: "2024", titulo: "La finca", texto: "Encontramos el sitio de casualidad, volviendo de comprar tomateras." },
      { cuando: "12 de mayo de 2027", titulo: "Nos casamos entre olivos", texto: "Con los pies en la tierra y sin ninguna prisa." },
    ],
    paradas: [
      { titulo: "Ceremonia bajo el olivo", hora: "18:00", icono: "anillos", lugar: "Finca El Olivar", direccion: "Ctra. de Chinchón, km 4, 28370 Chinchón, Madrid", mapa: "https://maps.google.com/?q=Chinchon+Madrid" },
      { titulo: "Aperitivo al fresco", hora: "19:30", icono: "copas", lugar: "Bajo la pérgola de la finca", direccion: "Misma dirección" },
      { titulo: "Cena en la pérgola", hora: "20:30", icono: "plato", lugar: "Bajo la pérgola de la finca", direccion: "Misma dirección" },
      { titulo: "Baile entre farolillos", hora: "23:00", icono: "nota", lugar: "Bajo la pérgola de la finca", direccion: "Misma dirección" },
    ],
    dress: "Vestid cómodos. Hay hierba, así que los tacones de aguja se hunden.",
    paleta: ["#6c7d4f", "#c8bfa6", "#d6a77a", "#2a3322"],
    hoteles: [
      { nombre: "Parador de Chinchón", nota: "A 6 minutos, desde 110 €" },
      { nombre: "Casa rural La Vega", nota: "Para grupos, desde 70 €" },
    ],
    iban: "ES91 2100 0418 4502 0005 1332",
    hashtag: "NoraYSebasEntreOlivos",
    notas: [
      { titulo: "Hay hierba y hay grava", texto: "Los tacones de aguja se hunden. Está avisado." },
      { titulo: "Se pone el sol a las nueve y media", texto: "La ceremonia es a las seis para que dé la luz buena en las fotos." },
      { titulo: "Traed una chaqueta", texto: "En mayo, en el campo y de noche, refresca más de lo que parece." },
    ],
    titulos: { dia: "El día", historia: "Cómo llegamos aquí", galeria: "Antes del día", playlist: "La banda sonora", regalos: "Si os apetece", album: "Vuestras fotos" },
  }),
  boda({
    slug: "sara-y-marcos",
    plantilla: "mar",
    a: "Sara",
    b: "Marcos",
    fecha: "2027-06-04T19:00:00+02:00",
    tema: { tinta: "#14283a", papel: "#edf3f4", acento: "#2f6a8a", grano: 0.03 },
    apertura: video("cielo", 4.0),
    frase: "Nos casamos mirando al mar. Venid con tiempo y quedaos a dormir.",
    foto: ia("mar-portada"),
    album: fotos("mar"),
    historia: [
      { cuando: "2018", titulo: "Dos meses y un billete", texto: "Nos fuimos de viaje a los dos meses de conocernos. Todo el mundo dijo que era pronto." },
      { cuando: "2018–2026", titulo: "Once países", texto: "Y seguimos discutiendo por quién hace la maleta." },
      { cuando: "2026", titulo: "La cala", texto: "La encontramos sin buscarla, un día que nos perdimos. Supimos que era ahí." },
      { cuando: "4 de junio de 2027", titulo: "Nos casamos mirando al mar", texto: "Venid con tiempo y quedaos a dormir." },
    ],
    paradas: [
      { titulo: "Ceremonia en la cala", hora: "19:00", icono: "anillos", lugar: "Cala del Faro", direccion: "Camí del Far, 07820 Sant Antoni de Portmany, Ibiza", mapa: "https://maps.google.com/?q=Sant+Antoni+de+Portmany+Ibiza" },
      { titulo: "Brindis al atardecer", hora: "19:45", icono: "copas", lugar: "Es Torrent", direccion: "Playa Es Torrent, 07830 Sant Josep, Ibiza", mapa: "https://maps.google.com/?q=Es+Torrent+Ibiza" },
      { titulo: "Cena junto al agua", hora: "21:00", icono: "plato", lugar: "Es Torrent", direccion: "Playa Es Torrent, 07830 Sant Josep, Ibiza" },
      { titulo: "Fiesta descalzos", hora: "00:00", icono: "nota", lugar: "Es Torrent", direccion: "Playa Es Torrent, 07830 Sant Josep, Ibiza" },
    ],
    dress: "Lino, color y nada de corbata. Se va a la playa, no a un banco.",
    paleta: ["#b0875a", "#e3ddd2", "#7fa0b5", "#1b2836"],
    hoteles: [
      { nombre: "Hostal en Sant Antoni", nota: "A 10 minutos de la cala, desde 95 €", enlace: "https://maps.google.com/?q=Sant+Antoni+de+Portmany" },
      { nombre: "Agroturismo en Sant Josep", nota: "Para quien venga con niños, desde 140 €", enlace: "https://maps.google.com/?q=Sant+Josep+Ibiza" },
      { nombre: "Ferry desde Dénia", nota: "Si venís en coche: dos horas de barco", enlace: "https://maps.google.com/?q=Puerto+de+Denia" },
    ],
    iban: "ES68 0049 1500 0526 1010 2345",
    hashtag: "SaraYMarcosEnIbiza",
    notas: [
      { titulo: "Venid con tiempo", texto: "La cala tiene un camino de tierra de diez minutos. No se llega en tacón." },
      { titulo: "Quedaos a dormir", texto: "Es en la otra punta de la isla y la vuelta de noche es larga." },
      { titulo: "Habrá viento", texto: "Siempre lo hay. Los peinados sencillos aguantan mejor." },
    ],
    titulos: { dia: "El itinerario", historia: "Nuestra travesía", galeria: "Aquel verano", playlist: "Lo que sonará", regalos: "Un detalle", album: "El álbum de todos" },
  }),
  boda({
    slug: "claudia-y-jorge",
    plantilla: "velo",
    a: "Claudia",
    b: "Jorge",
    fecha: "2027-09-21T13:00:00+02:00",
    tema: { tinta: "#1e1c1a", papel: "#eeeae3", acento: "#76664f", grano: 0.04 },
    apertura: video("velo", 2.8),
    frase: "Después de doce años, por fin encontramos una excusa para reunir a todo el mundo.",
    foto: ia("velo-portada"),
    album: fotos("velo"),
    historia: [
      { cuando: "2015", titulo: "En una boda ajena", texto: "Nos presentaron en el banquete. Nos pasamos la tarde diciendo que nosotros nunca nos casaríamos." },
      { cuando: "2018", titulo: "Dos mudanzas", texto: "Y un gato que no quería ninguno de los dos." },
      { cuando: "2026", titulo: "La pedida", texto: "Sin rodilla, sin restaurante y sin avisar a nadie. En el sofá, un martes." },
      { cuando: "21 de septiembre de 2027", titulo: "Doce años después", texto: "Por fin encontramos una excusa para reunir a todo el mundo." },
    ],
    paradas: [
      { titulo: "Ceremonia", hora: "13:00", icono: "anillos", lugar: "Casino de Madrid", direccion: "Calle de Alcalá, 15, 28014 Madrid", mapa: "https://maps.google.com/?q=Casino+de+Madrid" },
      { titulo: "Cóctel en el patio", hora: "13:45", icono: "copas", lugar: "Salón Real", direccion: "Mismo edificio, planta principal" },
      { titulo: "Banquete", hora: "15:00", icono: "plato", lugar: "Salón Real", direccion: "Mismo edificio, planta principal" },
      { titulo: "Barra y baile", hora: "19:00", icono: "nota", lugar: "Salón Real", direccion: "Mismo edificio, planta principal" },
    ],
    dress: "Etiqueta. Es de las pocas veces que tendréis excusa, aprovechadla.",
    paleta: ["#9a7f63", "#d8d2c8", "#4a4640", "#1f1d1b"],
    hoteles: [
      { nombre: "Hotel en la calle Alcalá", nota: "A 3 minutos andando, desde 160 €" },
      { nombre: "Apartamentos en Sol", nota: "A 6 minutos, desde 110 €" },
    ],
    iban: "ES23 0182 2370 4402 0154 8871",
    hashtag: "ClaudiaYJorgeAlFin",
    notas: [
      { titulo: "Es en pleno centro", texto: "No vengáis en coche: el aparcamiento más cercano está a diez minutos andando." },
      { titulo: "Etiqueta de verdad", texto: "Es de las pocas veces que tendréis excusa. Aprovechadla." },
      { titulo: "Se come a las tres", texto: "Desayunad bien, que la ceremonia es larga." },
    ],
    titulos: { dia: "El gran día", historia: "Nuestra historia", galeria: "Retratos", playlist: "El soundtrack", regalos: "Un detalle especial", album: "Comparte tus fotos" },
  }),
  boda({
    slug: "yone-y-noe",
    plantilla: "constelacion",
    a: "Yone",
    b: "Noe",
    fecha: "2027-10-18T20:00:00+02:00",
    tema: { tinta: "#ece7da", papel: "#0e1428", acento: "#c9a55c", grano: 0.05 },
    apertura: video("constelacion", 3.5),
    frase: "De noche, con guirnaldas, con la música alta y con vosotros.",
    foto: ia("constelacion-portada"),
    album: fotos("constelacion"),
    historia: [
      { cuando: "2021", titulo: "Las cuatro de la mañana", texto: "En una fiesta a la que ninguna de las dos quería ir." },
      { cuando: "2023", titulo: "Seguimos yendo", texto: "A fiestas a las que no queremos ir. Pero ahora vamos juntas." },
      { cuando: "2026", titulo: "La azotea", texto: "La vimos desde la calle y subimos a preguntar. Nos dijeron que sí." },
      { cuando: "18 de octubre de 2027", titulo: "De noche", texto: "Con guirnaldas, con la música alta y con vosotros." },
    ],
    paradas: [
      { titulo: "Ceremonia en la azotea", hora: "20:00", icono: "anillos", lugar: "Azotea del Círculo", direccion: "Calle de Alcalá, 42, 28014 Madrid", mapa: "https://maps.google.com/?q=Circulo+de+Bellas+Artes+Madrid" },
      { titulo: "Brindis con la ciudad abajo", hora: "20:45", icono: "copas", lugar: "Patio de la Corredera", direccion: "Plaza de la Corredera, 4, 28012 Madrid", mapa: "https://maps.google.com/?q=Plaza+Corredera+Madrid" },
      { titulo: "Cena", hora: "21:30", icono: "plato", lugar: "Patio de la Corredera", direccion: "Plaza de la Corredera, 4, 28012 Madrid" },
      { titulo: "Bengalas a medianoche", hora: "00:00", icono: "nota", lugar: "Patio de la Corredera", direccion: "Plaza de la Corredera, 4, 28012 Madrid" },
    ],
    dress: "Negro, dorado o lo que os apetezca. Pero zapatos de bailar.",
    paleta: ["#b08d57", "#2b3550", "#8e93a6", "#14182a"],
    hoteles: [{ nombre: "Hotel junto a Gran Vía", nota: "A 5 minutos andando, desde 120 €" }],
    iban: "ES77 1465 0100 9017 2942 1130",
    hashtag: "YoneYNoeDeNoche",
    notas: [
      { titulo: "Se sube en ascensor", texto: "La azotea está en la séptima planta. Hay ascensor y sitio de sobra." },
      { titulo: "Refresca a partir de las once", texto: "Estamos al aire libre. Traed algo de abrigo aunque sea octubre." },
      { titulo: "Las bengalas las ponemos nosotras", texto: "A medianoche. No hace falta que traigáis nada." },
    ],
    titulos: { dia: "La noche", historia: "Cómo empezó todo", galeria: "De noche", playlist: "La lista", regalos: "Un detalle", album: "Subid vuestras fotos" },
  }),
  boda({
    slug: "marta-y-alvaro",
    plantilla: "tinta",
    a: "Marta",
    b: "Álvaro",
    fecha: "2027-11-08T12:00:00+01:00",
    tema: { tinta: "#141414", papel: "#f7f7f4", acento: "#55534e", grano: 0.07 },
    apertura: video("tinta", 3.0),
    frase: "Sin flores, sin discursos y sin protocolo. Solo nosotros y vosotros.",
    foto: ia("tinta-portada"),
    album: [ia("tinta-album-1"), ia("tinta-album-2"), ia("tinta-album-3"), ia("tinta-detalle")],
    historia: [
      { cuando: "2019", titulo: "Poco ruido", texto: "Nos gusta poco el ruido, poca gente y mucho estar callados juntos." },
      { cuando: "2023", titulo: "Sin planes", texto: "Nunca hemos hecho un plan a más de una semana vista. Éste es el primero." },
      { cuando: "8 de noviembre de 2027", titulo: "Pequeña y corta", texto: "Y a mediodía. Si estás invitado es porque sabes estar callado con nosotros." },
    ],
    paradas: [
      { titulo: "Ceremonia", hora: "12:00", icono: "anillos", lugar: "Registro Civil de Madrid", direccion: "Calle Pradillo, 66, 28002 Madrid", mapa: "https://maps.google.com/?q=Registro+Civil+Madrid+Pradillo" },
      { titulo: "Comida", hora: "14:00", icono: "plato", lugar: "Casa Salvador", direccion: "Calle de Barbieri, 12, 28004 Madrid", mapa: "https://maps.google.com/?q=Casa+Salvador+Madrid" },
      { titulo: "Café y hasta luego", hora: "17:00", icono: "copas", lugar: "Casa Salvador", direccion: "Calle de Barbieri, 12, 28004 Madrid" },
    ],
    dress: "Lo que os pongáis para una comida buena. Nada más.",
    paleta: ["#131313", "#8d8b85", "#d8d6d0", "#f7f7f5"],
    hoteles: [{ nombre: "Hotel en Chueca", nota: "Para quien venga de fuera, desde 90 €" }],
    iban: "ES12 0049 0001 5021 0033 1199",
    hashtag: "MartaYAlvaroSinRuido",
    notas: [
      { titulo: "Somos veinticinco", texto: "No hay más sitio. Si no podéis venir, avisadnos pronto." },
      { titulo: "Empieza puntual", texto: "El registro va con reloj. A las doce y cinco ya no se entra." },
      { titulo: "No hace falta regalo", texto: "Lo decimos en serio. Venid y ya está." },
    ],
    titulos: { dia: "El día", historia: "Nosotros dos", galeria: "Sin más", playlist: "La lista", regalos: "Nada, en serio", album: "Las fotos" },
  }),
  boda({
    slug: "alex-y-bruno",
    plantilla: "registro",
    a: "Àlex",
    b: "Bruno",
    fecha: "2027-06-19T12:00:00+02:00",
    tema: { tinta: "#1f2124", papel: "#ffffff", acento: "#ff5b1f", grano: 0 },
    frase: "Firmamos a las doce y a la una ya estamos comiendo. Venid a las dos cosas.",
    album: fotos("registro"),
    historia: [
      { cuando: "2019", titulo: "El mismo andén", texto: "Tres años cogiendo el mismo tren de las 7:42 sin decirnos nada. Un día se averió." },
      { cuando: "2022", titulo: "Un piso en Gràcia", texto: "Cuarto sin ascensor. Lo elegimos por la terraza y lo seguimos pagando por la terraza." },
      { cuando: "19 de junio de 2027", titulo: "Firmamos", texto: "En el juzgado, con prisa por ir a comer." },
    ],
    paradas: [
      { titulo: "Firma en el registro", hora: "12:00", icono: "anillos", lugar: "Ajuntament de Barcelona", direccion: "Plaça de Sant Jaume, 1, 08002 Barcelona", mapa: "https://maps.google.com/?q=Placa+de+Sant+Jaume+1+Barcelona" },
      { titulo: "Vermut en la plaza", hora: "13:00", icono: "copas", lugar: "Plaça del Rei", direccion: "Plaça del Rei, 08002 Barcelona", mapa: "https://maps.google.com/?q=Placa+del+Rei+Barcelona" },
      { titulo: "Comida larga", hora: "14:00", icono: "plato", lugar: "Una terraza en el Born", direccion: "Passeig del Born, 08003 Barcelona", mapa: "https://maps.google.com/?q=Passeig+del+Born+Barcelona" },
    ],
    dress: "Ropa de ciudad. Si dudáis entre corbata o no, no.",
    paleta: ["#ff5b1f", "#1f2124", "#d6d7d9", "#ffffff"],
    hoteles: [{ nombre: "Hotel en el Gòtic", nota: "A 4 minutos del Ajuntament, desde 120 €" }],
    iban: "ES36 2100 0813 6101 2345 6789",
    hashtag: "AlexYBrunoFirman",
    notas: [
      { titulo: "La sala es pequeña", texto: "Caben cuarenta personas. Si llegáis tarde, os esperamos fuera con el vermut." },
      { titulo: "Id en metro", texto: "L4 hasta Jaume I. Aparcar en el Gòtic un sábado es una mala idea." },
      { titulo: "Traed DNI", texto: "Los dos testigos, sobre todo. Sin DNI no hay firma." },
    ],
    titulos: { dia: "Horario", historia: "Antes de firmar", galeria: "Nosotros", playlist: "Para la comida", regalos: "Si queréis", album: "Fotos" },
  }),
  boda({
    slug: "rocio-y-javier",
    plantilla: "azulejo",
    a: "Rocío",
    b: "Javier",
    fecha: "2027-06-26T20:30:00+02:00",
    tema: { tinta: "#1a2236", papel: "#fbf8f2", acento: "#1f4e9c", grano: 0.04 },
    frase: "En el patio de la casa de la abuela, con naranjos, buganvillas y toda la familia.",
    album: fotos("azulejo"),
    historia: [
      { cuando: "2016", titulo: "La Feria", texto: "Nos conocimos en una caseta a la que ninguno de los dos estaba invitado." },
      { cuando: "2020", titulo: "El patio", texto: "Pasamos el confinamiento en la casa de la abuela. Ahí se decidió todo, aunque tardamos en decirlo." },
      { cuando: "2026", titulo: "La pregunta", texto: "Debajo del naranjo, con la abuela mirando desde la ventana. Lo sabía antes que nosotros." },
      { cuando: "26 de junio de 2027", titulo: "En el patio", texto: "Donde empezó todo, cuando baja el calor." },
    ],
    paradas: [
      { titulo: "Ceremonia en el patio", hora: "20:30", icono: "anillos", lugar: "Casa de la Calle Feria", direccion: "Calle Feria, 41003 Sevilla", mapa: "https://maps.google.com/?q=Calle+Feria+Sevilla" },
      { titulo: "Copa bajo los naranjos", hora: "21:15", icono: "copas", lugar: "El mismo patio", direccion: "Misma dirección" },
      { titulo: "Cena", hora: "22:00", icono: "plato", lugar: "La galería de arriba", direccion: "Misma dirección" },
      { titulo: "Sevillanas y lo que surja", hora: "00:30", icono: "nota", lugar: "El patio", direccion: "Misma dirección" },
    ],
    dress: "De verano y con color. Abanico si tenéis: a las nueve todavía hace 30 grados.",
    paleta: ["#1f4e9c", "#d9a441", "#b23a6e", "#fbf8f2"],
    hoteles: [
      { nombre: "Hotel en la Alameda", nota: "A 5 minutos andando, desde 85 €", enlace: "https://maps.google.com/?q=Alameda+de+Hercules+Sevilla" },
      { nombre: "Pensión en San Lorenzo", nota: "A 8 minutos, desde 60 €" },
    ],
    iban: "ES52 0075 3120 4106 0022 3344",
    hashtag: "RocioYJavierEnElPatio",
    notas: [
      { titulo: "Hace calor", texto: "Mucho. Hay agua fresca en la entrada y abanicos para quien no traiga." },
      { titulo: "No hay aparcamiento", texto: "Es el centro de Sevilla. Taxi o andando desde la Alameda." },
      { titulo: "La abuela tiene 91 años", texto: "Y va a bailar. Nadie se va antes que ella." },
    ],
    titulos: { dia: "La noche", historia: "Cómo llegamos al patio", galeria: "Nosotros", playlist: "Lo que va a sonar", regalos: "Un detalle", album: "Vuestras fotos" },
  }),
  // Las temáticas de K1 (src/plantillas/tematicas/demos.ts).
  ...DEMOS_TEMATICAS,
  // Carta va al final: lib/datos.ts siembra los invitados de prueba en la PRIMERA demo.
  cartaDemo(),
];

/**
 * Slugs de demo antiguos → la demo que ahora enseña su plantilla, y la
 * variante que mejor la recuerda. Para que los enlaces viejos sigan vivos:
 * A puede redirigir con `redireccionDemo(slug)`, y mientras tanto
 * `DEMO[slugAntiguo]` devuelve la boda nueva (no enumerable: no duplica
 * páginas estáticas ni filas en el estudio).
 */
export const ALIAS_DEMOS: Record<string, { slug: string; variante?: string }> = {
  "lucia-y-tomas": { slug: "nora-y-sebas" },
  "irene-y-dani": { slug: "nora-y-sebas", variante: "brasa" },
  "carmen-y-ivan": { slug: "nora-y-sebas", variante: "brasa" },
  "elena-y-pau": { slug: "sara-y-marcos", variante: "turquesa" },
  "julia-y-hector": { slug: "claudia-y-jorge", variante: "champan" },
  "frank-y-nico": { slug: "claudia-y-jorge", variante: "perla" },
};

/** `/i/<slug viejo>` → `/i/<slug nuevo>?c=<variante>`, o null si no es alias. */
export function redireccionDemo(slug: string): string | null {
  const a = ALIAS_DEMOS[slug];
  if (!a) return null;
  return `/i/${a.slug}${a.variante ? `?c=${a.variante}` : ""}`;
}

/**
 * El protocolo de una boda española (docs/12 §3), con los textos modelo:
 * quién invita, fecha límite, niños, autobús, preguntas, invitados de
 * fuera y preboda. Cada demo lleva lo que tendría una boda así: la clásica
 * de iglesia, el texto de los padres; la de Ibiza, la nota en inglés; la
 * de azotea, una noche de adultos.
 */
const PROTOCOLO: Record<string, { bloques: Bloque[]; limite?: string; motivo?: string; sinNotas?: string[] }> = {
  "ines-y-gonzalo": {
    limite: "2027-08-01T12:00:00+02:00",
    motivo: "el catering nos pide el número cerrado",
    sinNotas: ["Hay autobús desde Madrid"],
    bloques: [
      {
        t: "anuncio",
        estilo: "clasico",
        texto:
          "D. Antonio Barrios Medina y D.ª Carmen Soler Vidal, D. Luis Ruiz Gil y D.ª Elena Martín Sanz tienen el placer de invitarle al enlace de sus hijos Inés y Gonzalo, que se celebrará el sábado 18 de septiembre de 2027, a las cinco y media de la tarde, en la iglesia de Nuestra Señora del Rosario (La Granja).",
        padrinos: "D.ª Carmen Soler y D. Luis Ruiz",
      },
      {
        t: "autobus",
        ida: [{ hora: "15:45", desde: "Intercambiador de Moncloa, Madrid" }],
        vueltas: ["01:30", "04:00"],
        nota: "Marca en la confirmación cuál cogerás, para que nadie se quede sin sitio.",
      },
      {
        t: "preboda",
        cuando: "Viernes 17, a partir de las 20:00",
        lugar: "La Taberna del Real Sitio",
        texto: "Cerveza y tapas para quien llegue antes. Sin protocolo.",
        direccion: "Plaza de los Dolores, 40100 Real Sitio de San Ildefonso, Segovia",
      },
      {
        t: "ninos",
        admitidos: "si",
        menuInfantil: true,
        nota: "Los peques son bienvenidos: habrá menú infantil y monitores durante la cena. Dinos sus nombres y edades al confirmar.",
      },
      {
        t: "preguntas",
        items: [
          { p: "¿Hay parking?", r: "Sí, en la finca hay sitio para todos. En la iglesia, mejor el aparcamiento de la Plaza de los Dolores." },
          { p: "¿Puedo llevar acompañante?", r: "Las plazas van a vuestro nombre en el enlace. Si necesitáis hablarlo, escribidnos." },
          { p: "¿Hay autobús de vuelta?", r: "Sí: a la 1:30 y a las 4:00, hasta Moncloa." },
          { p: "Tengo una alergia, ¿qué hago?", r: "Márcala al confirmar. Solo la verá el catering para preparar tu plato." },
          { p: "¿A quién llamo el día de la boda?", r: "A Marta, la hermana de Inés: 600 000 000. Los novios estarán ocupados siendo felices." },
        ],
      },
    ],
  },
  "laura-y-ruben": {
    limite: "2027-02-28T12:00:00+01:00",
    bloques: [
      { t: "anuncio", estilo: "moderno", texto: "Con la alegría de nuestras familias, Laura y Rubén nos casamos. Y no sería lo mismo sin ti." },
    ],
  },
  "sara-y-marcos": {
    bloques: [
      {
        t: "extranjeros",
        titulo: "Welcome!",
        idioma: "en",
        texto: "Ibiza airport is 25 minutes from the beach. We'll have a shuttle from Sant Antoni at 6 pm, and the ceremony starts at 7 pm, Spanish time.",
      },
    ],
  },
  "yone-y-noe": {
    bloques: [
      { t: "ninos", admitidos: "no", nota: "Queremos que esta noche sea solo para adultos y que la disfrutéis sin prisa. Os entendemos si no podéis venir." },
    ],
  },
  "marta-y-alvaro": {
    bloques: [
      {
        t: "notas",
        items: [{ titulo: "En el Registro, puntualidad", texto: "La ceremonia dura 20 minutos: llegad 15 antes, que el salón tiene aforo y no se puede entrar una vez empezada." }],
      },
    ],
  },
};

for (const boda of BODAS) {
  const x = PROTOCOLO[boda.slug];
  if (!x) continue;
  boda.bloques = boda.bloques
    .map((b): Bloque => {
      if (b.t === "rsvp" && x.limite) return { ...b, limite: x.limite, motivoLimite: x.motivo };
      if (b.t === "notas" && x.sinNotas) return { ...b, items: b.items.filter((n) => !x.sinNotas!.includes(n.titulo)) };
      if (b.t === "notas") {
        const extra = x.bloques.find((n) => n.t === "notas");
        if (extra && extra.t === "notas") return { ...b, items: [...extra.items, ...b.items] };
      }
      return b;
    })
    .concat(x.bloques.filter((n) => n.t !== "notas"));
}

export const DEMO: Record<string, Invitacion> = Object.fromEntries(
  BODAS.map((x) => [x.slug, x]),
);

for (const [viejo, { slug }] of Object.entries(ALIAS_DEMOS)) {
  Object.defineProperty(DEMO, viejo, { value: DEMO[slug], enumerable: false });
}
