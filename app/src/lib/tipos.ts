/**
 * El modelo de datos de una invitación.
 * Una invitación = este objeto + un `plantilla`. El código es el mismo para todas.
 * Ver docs/03-arquitectura.md §3.
 */

/** Las nueve plantillas del catálogo. Ver `src/data/plantillas.ts`. */
export type PlantillaId =
  | "carta"
  | "sobre"
  | "floracion"
  | "mar"
  | "velo"
  | "constelacion"
  | "tinta"
  | "registro"
  | "azulejo"
  // Temáticas (K1): src/plantillas/tematicas/**
  | "regencia"
  | "aire"
  | "cuento"
  // Temáticas (K4): Pase VIP, Cara A, Neón de Medianoche, Son de Fuego, Luna de Bachata
  | "festival"
  | "vinilo"
  | "neon"
  | "fuego"
  | "bachata"
  // Temáticas (K3): Bosque Encantado, Órbita, Brazada
  | "pinar"
  | "orbita"
  | "brazada"
  // Temáticas (K5): Lúpulo y Cobre, Noche de Estadio, Línea de Meta, Riviera
  | "lupulo"
  | "estadio"
  | "meta"
  | "riviera"
  // Temáticas (K2): Blasón, Memorias, Pasaporte, Orilla
  | "blason"
  | "memorias"
  | "pasaporte"
  | "orilla";

/**
 * Ids de las plantillas fusionadas. Siguen existiendo en bodas guardadas y en
 * enlaces compartidos: se resuelven con `resolverPlantillaId()` (alias).
 */
export type PlantillaAntigua =
  | "jardin"
  | "cielo"
  | "marea"
  | "lino"
  | "bruma"
  | "terracota"
  | "brasa";

/** Lo que puede venir en la columna `plantilla` de una boda. */
export type PlantillaGuardada = PlantillaId | PlantillaAntigua;

/** El adorno que separa secciones. Cada plantilla tiene el suyo. */
export type Ornamento =
  | "lacre"
  | "rama"
  | "ola"
  | "filete"
  | "estrella"
  | "punto"
  | "regla"
  | "cenefa";

/**
 * El tema de una boda. Lo obligatorio son los tres colores de siempre (así
 * las bodas ya guardadas siguen valiendo); el resto, si falta, lo pone la
 * plantilla. `acentoTexto` y `sobreAcento` se CALCULAN si no vienen: ver
 * `src/plantillas/color.ts`.
 */
export type Tema = {
  tinta: string;
  papel: string;
  acento: string;
  /** El acento oscurecido/aclarado hasta pasar AA como texto sobre el papel. */
  acentoTexto?: string;
  /** Texto sobre un botón de acento: negro o blanco, según luminancia. */
  sobreAcento?: string;
  /** Textura de papel, 0–1. */
  grano?: number;
  /** Radio de esquinas (CSS), p. ej. "0px" o "18px". */
  radio?: string;
  ornamento?: Ornamento;
  /** Familia de titulares (CSS font-family). Si falta, la de la plantilla. */
  display?: string;
  /** Familia de cuerpo (CSS font-family). Si falta, la de la plantilla. */
  texto?: string;
  /**
   * Variante de catálogo de reserva si los colores guardados no valen para la
   * plantilla. La pone `lib/datos.ts` al normalizar un id antiguo («brasa»).
   */
  variante?: string;
  /**
   * Cómo se mueve la invitación. Lo que falte lo pone la plantilla
   * (`movimientoPorDefecto` en `src/lib/movimiento.ts`). Va en el jsonb del
   * tema: no hace falta migración.
   */
  movimiento?: Partial<Movimiento>;
  /**
   * El sobre de papel de la apertura (forro, lacre, matasellos). Lo que
   * falte lo pone la plantilla: `resolverSobre()` en
   * `src/components/sobre/config.ts`. Va en el jsonb del tema.
   */
  sobre?: AjustesDelSobre;
  /**
   * El vídeo de los novios para la cabecera de las plantillas temáticas
   * (K1). `src` es el montaje vertical (móvil); `horizontal`, opcional, el
   * de tablet y escritorio. `poster` es el primer fotograma (LCP). Si falta,
   * la plantilla pone su vídeo temático. Va en el jsonb del tema.
   */
  heroVideo?: { src: string; poster: string; horizontal?: string; posterHorizontal?: string };
};

/** Los forros del sobre: SVG teñibles. Ver `src/components/sobre/Forro.tsx`. */
export type ForroSobre =
  | "olivo"
  | "azulejo"
  | "moare"
  | "rayas"
  | "constelacion"
  | "lino"
  | "liso"
  | "floral"
  | "damasco"
  | "cuadros";

/** Las ceras del lacre. */
export type ColorLacre = "granate" | "oro" | "verde" | "noche";

/** `Tema.sobre`. Todo opcional: lo guardado solo difiere de lo recomendado. */
export type AjustesDelSobre = {
  /**
   * true: la boda abre con el sobre aunque su plantilla tenga vídeo.
   * false: nunca (vuelve a la apertura de la plantilla). Sin valor: lo que
   * diga la plantilla (Sobre y Carta, sí).
   */
  activo?: boolean;
  forro?: ForroSobre;
  /** Color que tiñe el dibujo del forro (hex). */
  forroColor?: string;
  /** Color del papel del sobre (hex). */
  papel?: string;
  /** Lo que lleva grabado el lacre. */
  lacre?: "iniciales" | "alianzas";
  lacreColor?: ColorLacre;
  matasellos?: boolean;
  /** Ciudad del matasellos. Si falta, la de la primera parada. */
  ciudad?: string;
  /**
   * «papel»: el sobre SVG/CSS. «3d»: el sobre en WebGL (`components/tresd`),
   * con el de papel como reserva (sin WebGL, gama baja o menos movimiento).
   */
  modo?: "papel" | "3d";
};

/**
 * El movimiento de una invitación: siempre suave, nunca elástico. Ver
 * `src/lib/movimiento.ts` (presets, tokens y variables CSS).
 */
export type Movimiento = {
  /** El carácter: de más quieto a más cinematográfico. */
  estilo: "minimo" | "sereno" | "romantico" | "cinematografico";
  /** Multiplicador de velocidad, 0.6–1.6 (1 = lo de la plantilla; >1 más ágil). */
  velocidad: number;
  /** 0–1: distancia y desenfoque de las entradas. 0 = solo fundido. */
  intensidad: number;
  /** Cómo aparece cada sección al llegar a ella. */
  entrada: "fundido" | "fundido-desenfoque" | "ascenso" | "velo";
  /** Ramas y ornamentos que se dibujan solos. */
  ornamentos: boolean;
  /** Partículas muy sutiles detrás del texto. */
  particulas: "ninguna" | "petalos" | "destellos" | "polvo-de-oro";
  /** Fotos con un desplazamiento leve al hacer scroll. */
  parallax: boolean;
  /** La canción entra subiendo poco a poco en vez de sonar de golpe. */
  musicaFundido: boolean;
  /** Flores SVG que florecen al llegar (`<Florecer />`): ninguna, unas pocas o todo el jardín. */
  flores: "ninguna" | "sutiles" | "jardin";
  /** Reflejo dorado en los nombres (puntero o inclinación del móvil) y brillo en los botones dorados. */
  interaccion: boolean;
  /** Fondo que cambia de color, muy despacio, entre secciones. */
  colorVivo: boolean;
  /** Al tocar la invitación caen unos pétalos desde el dedo. */
  petalosAlTocar: boolean;
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
  | {
      t: "rsvp";
      pideMenu?: boolean;
      pideAlergias?: boolean;
      pideBus?: boolean;
      /** Fecha límite para confirmar (ISO). Se enseña encima del formulario. */
      limite?: string;
      /** Por qué hace falta saberlo antes (el catering…). */
      motivoLimite?: string;
    }
  | { t: "album"; subidaInvitados: boolean; titulo?: string }
  | { t: "muro" }
  | { t: "playlist"; spotify: string; titulo?: string; nota?: string }
  | {
      t: "regalos";
      iban?: string;
      enlacePago?: string;
      titulo?: string;
      nota?: string;
      /** Teléfono para Bizum (solo cifras o con espacios). Si está, sale el botón. */
      bizum?: string;
      /** A nombre de quién está la cuenta, para el «Ver datos». */
      titular?: string;
    }
  | { t: "dressCode"; nota: string; paleta: string[] }
  | { t: "alojamiento"; opciones: Hotel[] }
  | {
      t: "galeria";
      fotos: string[];
      titulo?: string;
      variante?: "sangre" | "tira";
    }
  | { t: "notas"; items: { titulo: string; texto: string }[] }
  | { t: "hashtag"; etiqueta: string; nota?: string }
  // —— Protocolo de boda española (docs/12 §3). Todos opcionales. ——
  /** Quién invita: el texto de los padres (clásico) o de la pareja (moderno). */
  | { t: "anuncio"; estilo: "clasico" | "moderno"; texto: string; padrinos?: string }
  /** Niños: si son bienvenidos, solo los de la familia, o no. */
  | { t: "ninos"; admitidos: "si" | "no" | "solo-familia"; nota: string; menuInfantil?: boolean }
  /** Preguntas frecuentes de los invitados, en acordeón. */
  | { t: "preguntas"; titulo?: string; items: { p: string; r: string }[] }
  /** El autobús: salidas de ida y varias vueltas. */
  | { t: "autobus"; ida: { hora: string; desde: string; mapa?: string }[]; vueltas: string[]; nota?: string }
  /** Nota para invitados de fuera, en su idioma (`idioma`: código BCP 47). */
  | { t: "extranjeros"; titulo: string; texto: string; idioma?: string }
  /** La preboda: un plan informal la víspera. */
  | { t: "preboda"; cuando: string; lugar: string; texto: string; direccion?: string };

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
  /**
   * En BD puede quedar un id antiguo («cielo»): el registro de maquetas y
   * `resolverPlantillaId()` lo resuelven igual (mapa de alias).
   */
  plantilla: PlantillaId;
  estado: "borrador" | "publicada" | "archivada";
  pareja: { a: string; b: string; fecha: string; hashtag?: string };
  tema: Tema;
  apertura?: Apertura;
  musica?: { url: string; titulo: string; deDedicalo: boolean };
  bloques: Bloque[];
};
