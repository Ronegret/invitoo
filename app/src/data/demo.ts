import type { Invitacion } from "@/lib/tipos";

/**
 * Datos de prueba mientras no está Supabase conectado.
 * Es exactamente la forma que tendrá la fila de la tabla `invitaciones`.
 */
export const DEMO: Record<string, Invitacion> = {
  "laura-y-ruben": {
    slug: "laura-y-ruben",
    plantilla: "floracion",
    estado: "publicada",
    pareja: { a: "Laura", b: "Rubén", fecha: "2027-03-30T12:30:00+02:00" },
    tema: { tinta: "#2a1a18", papel: "#f7f1ea", acento: "#8c1d2c", grano: 0.05 },
    apertura: {
      vertical: "/aperturas/floracion/vertical.mp4",
      horizontal: "/aperturas/floracion/horizontal.mp4",
      poster: "/aperturas/floracion/poster.avif",
      rotuloEn: 3.2,
      rotuloClaro: true,
    },
    bloques: [
      {
        t: "portada",
        frase:
          "Hay momentos que nos hacen infinitos. Queremos que estéis en el nuestro.",
      },
      { t: "cuentaAtras" },
      {
        t: "itinerario",
        paradas: [
          {
            titulo: "Ceremonia",
            hora: "12:30",
            lugar: "Iglesia Nuestra Señora de la Visitación",
            direccion: "Calle Pico de los Artilleros, 82, 28030 Madrid",
            mapa: "https://maps.google.com/?q=Calle+Pico+de+los+Artilleros+82+Madrid",
          },
          {
            titulo: "Celebración",
            hora: "14:30",
            lugar: "La Masía de José Luis",
            direccion: "P.º de la Puerta del Ángel, 3, 28011 Madrid",
            mapa: "https://maps.google.com/?q=La+Masia+de+Jose+Luis+Madrid",
          },
        ],
      },
      {
        t: "historia",
        parrafos: [
          "Empezó con un mensaje que no tenía ningún sentido. Siete años después seguimos sin saber muy bien qué quería decir, pero aquí estamos.",
          "Por el camino ha habido cafés malísimos, una cita a la que Rubén llegó con dos zapatos distintos, y un perro que iba a ser «solo unos días».",
          "El 30 de marzo nos casamos. Nos haría mucha ilusión que estuvierais.",
        ],
      },
      {
        t: "dressCode",
        nota: "Etiqueta de tarde. Nada de blanco, que ese día va cogido.",
        paleta: ["#8c1d2c", "#c9b8a3", "#3f4a3c", "#1d1a17"],
      },
      {
        t: "alojamiento",
        opciones: [
          {
            nombre: "Hotel Puerta de Madrid",
            nota: "A 8 minutos del convite · desde 95 €",
            enlace: "https://maps.google.com/?q=Hotel+Puerta+de+Madrid",
          },
          {
            nombre: "Ilunion Pío XII",
            nota: "A 15 minutos · desde 78 €",
            enlace: "https://maps.google.com/?q=Ilunion+Pio+XII",
          },
        ],
      },
      { t: "playlist", spotify: "https://open.spotify.com/" },
      { t: "regalos", iban: "ES04 5498 6179 4966 5153 1546" },
      { t: "album", subidaInvitados: true },
      { t: "muro" },
      { t: "rsvp", pideMenu: true, pideAlergias: true, pideBus: true },
    ],
  },
};
