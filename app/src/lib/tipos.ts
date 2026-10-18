/**
 * El modelo de datos de una invitación.
 * Una invitación = este objeto + un `plantilla`. El código es el mismo para todas.
 * Ver docs/03-arquitectura.md §3.
 */

export type PlantillaId =
  | "sobre"
  | "floracion"
  | "cielo"
  | "velo"
  | "constelacion"
  | "bruma"
  | "marea"
  | "terracota"
  | "tinta"
  | "jardin"
  | "lino"
  | "brasa";

export type Tema = {
  tinta: string;
  papel: string;
  acento: string;
  /** Textura de papel, 0–1. */
  grano?: number;
};

export type Parada = {
  /**
   * El nombre del momento, no su función. En nico-y-gaby.invitoo.es las
   * paradas se llaman «Brindis por el Amor» o «Bajo las Estrellas», no
   * «Cóctel» y «Baile». Ahí está la mitad de la elegancia y no cuesta nada.
   */
  titulo: string;
  hora: string;
  lugar: string;
  direccion: string;
  mapa?: string;
  /** Icono del set propio: iglesia, copas, plato, nota, coche… */
  icono?: string;
};

export type Hotel = {
  nombre: string;
  nota?: string;
  enlace?: string;
};

export type Bloque =
  | {
      t: "portada";
      frase: string;
      foto?: string;
      /** Composición: foto a sangre, editorial o partida. */
      variante?: "centro" | "bajo" | "partida";
    }
  | { t: "cuentaAtras" }
  | { t: "historia"; parrafos: string[]; fotos?: string[] }
  | {
      t: "capitulos";
      titulo?: string;
      capitulos: { cuando?: string; titulo: string; texto: string; foto?: string }[];
    }
  | { t: "itinerario"; paradas: Parada[]; titulo?: string }
  | { t: "rsvp"; pideMenu?: boolean; pideAlergias?: boolean; pideBus?: boolean }
  | { t: "album"; subidaInvitados: boolean; titulo?: string }
  | { t: "muro" }
  | { t: "playlist"; spotify: string; titulo?: string; nota?: string }
  | { t: "regalos"; iban?: string; enlacePago?: string; titulo?: string; nota?: string }
  | { t: "dressCode"; nota: string; paleta: string[] }
  | { t: "alojamiento"; opciones: Hotel[] }
  | {
      t: "galeria";
      fotos: string[];
      titulo?: string;
      variante?: "sangre" | "tira";
    }
  | { t: "notas"; items: { titulo: string; texto: string }[] }
  | { t: "hashtag"; etiqueta: string; nota?: string };

/**
 * La apertura en vídeo. Dos montajes del mismo máster (uno por forma de
 * pantalla) más un póster, igual que en aem.rodd.es. El máster es de la
 * plantilla, no de la pareja: lo que personaliza es el rótulo que va encima.
 */
export type Apertura = {
  /** 1080×1920, para móvil. */
  vertical: string;
  /** 1920×1080, para tablet y escritorio. */
  horizontal: string;
  /** Primer fotograma en AVIF. Es el LCP: la pantalla nunca está negra. */
  poster: string;
  /** Segundo en que entra el rótulo con los nombres. */
  rotuloEn: number;
  /** Rótulo en blanco (fondo con imagen) o en la tinta de la boda. */
  rotuloClaro: boolean;
};

export type Invitacion = {
  slug: string;
  plantilla: PlantillaId;
  estado: "borrador" | "publicada" | "archivada";
  pareja: { a: string; b: string; fecha: string; hashtag?: string };
  tema: Tema;
  apertura?: Apertura;
  musica?: { url: string; titulo: string; deDedicalo: boolean };
  bloques: Bloque[];
};
