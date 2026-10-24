/**
 * «En directo»: precios, límites y compresión. UNA sola constante.
 *
 * La web comercial (W) lee de aquí los precios y lo que incluye cada cosa;
 * el servidor lee los límites y la subida del invitado lee la compresión.
 * Si mañana cambia un precio o un límite, se cambia aquí y en ningún otro
 * sitio. Los precios llevan el IVA incluido.
 *
 * Este archivo es DATO: sin `server-only` ni dependencias, para que lo pueda
 * importar cualquiera (servidor, cliente, la web).
 */

export type PlanMomentos = "album" | "directo" | "gestionado" | "estudio";

export type LimitesPlan = {
  id: PlanMomentos;
  nombre: string;
  /** Precio del añadido (0 = incluido). IVA incluido. */
  precio: number;
  /** Si viene incluido en otra cosa: «la invitación» o el plan Estudio. */
  incluidoEn?: "invitacion" | "estudio";
  /**
   * Tope técnico de fotos. En la web, En directo se vende como «ilimitadas
   * con uso razonable»: `ilimitado` dice cómo contarlo.
   */
  fotos: number;
  ilimitado: boolean;
  videos: number;
  /** Segundos de vídeo como máximo. */
  duracionVideo: number;
  /** Espacio total (fotos + vídeos + miniaturas), en bytes. */
  bytes: number;
  /** Meses que sigue online después de la boda. */
  mesesOnline: number;
  pantallaTv: boolean;
  moderacion: boolean;
  zip: boolean;
  /** Guardar el original además de la versión comprimida. */
  original: boolean;
  /** Lo que se cuenta en la web, en el orden en que se cuenta. */
  incluye: string[];
  /** Una nota en letra pequeña para la web. */
  nota?: string;
};

const MB = 1024 * 1024;
const GB = 1024 * MB;

const INCLUYE_DIRECTO = [
  "Página de subida por QR, sin apps ni registro",
  "Pantalla en directo para la TV o el proyector",
  "Muro de mensajes en directo",
  "Moderación: vosotros decidís qué sale",
  "Fotos ilimitadas (uso razonable) y hasta 100 vídeos de 30 s",
  "QR y tarjetas de mesa para imprimir",
  "Descarga completa en ZIP",
  "Online 12 meses después de la boda",
];

export const PLANES_MOMENTOS: Record<PlanMomentos, LimitesPlan> = {
  album: {
    id: "album",
    nombre: "Álbum de la invitación",
    precio: 0,
    incluidoEn: "invitacion",
    fotos: 150,
    ilimitado: false,
    videos: 0,
    duracionVideo: 0,
    bytes: 250 * MB,
    mesesOnline: 12,
    pantallaTv: false,
    moderacion: true,
    zip: true,
    original: false,
    incluye: [
      "Los invitados suben sus fotos desde la invitación",
      "Hasta 150 fotos",
      "Descarga completa en ZIP",
      "Online 12 meses, igual que la invitación",
    ],
  },
  directo: {
    id: "directo",
    nombre: "En directo",
    precio: 89,
    fotos: 3000,
    ilimitado: true,
    videos: 100,
    duracionVideo: 30,
    bytes: 10 * GB,
    mesesOnline: 12,
    pantallaTv: true,
    moderacion: true,
    zip: true,
    original: false,
    incluye: INCLUYE_DIRECTO,
    nota: "Uso razonable: hasta 3.000 fotos por boda.",
  },
  gestionado: {
    id: "gestionado",
    nombre: "En directo Gestionado",
    precio: 179,
    fotos: 3000,
    ilimitado: true,
    videos: 100,
    duracionVideo: 30,
    bytes: 10 * GB,
    mesesOnline: 12,
    pantallaTv: true,
    moderacion: true,
    zip: true,
    original: false,
    incluye: [
      "Todo lo de En directo",
      "Lo dejamos configurado y lo probamos con el local",
      "20 tarjetas QR de mesa impresas",
      "Modo carrete",
      "Vídeo resumen al día siguiente",
    ],
    nota: "El alquiler de la TV o el proyector se presupuesta aparte.",
  },
  estudio: {
    id: "estudio",
    nombre: "En directo (incluido en Estudio)",
    precio: 0,
    incluidoEn: "estudio",
    fotos: 3000,
    ilimitado: true,
    videos: 100,
    duracionVideo: 30,
    bytes: 12 * GB,
    mesesOnline: 12,
    pantallaTv: true,
    moderacion: true,
    zip: true,
    original: true,
    incluye: [...INCLUYE_DIRECTO, "Guardamos también el original de cada foto"],
  },
};

/** Ampliaciones que se compran aparte. */
/** Días antes del borrado en que se avisa a la pareja (cron de limpieza). */
export const AVISO_BORRADO_DIAS = 30;

export const AMPLIACIONES_MOMENTOS = {
  conservar: { nombre: "Conservar 1 año más", meses: 12, precio: 19 },
} as const;

/**
 * Cómo se prepara cada archivo en el navegador antes de subirlo. Tres
 * versiones de cada foto, todas hechas en el móvil del invitado (nunca con
 * las transformaciones de imagen de Supabase, que se cobran aparte):
 *   · grande   2048 px — la que se descarga en el ZIP
 *   · pantalla 1280 px — la que pinta la TV
 *   · miniatura 480 px — el muro y la moderación
 */
export const COMPRESION = {
  ladoLargo: 2048,
  ladoPantalla: 1280,
  miniatura: 480,
  calidad: 0.82,
  calidadPantalla: 0.8,
  calidadMiniatura: 0.74,
  /** Topes de cada versión ya comprimida: si pasa, se rechaza. */
  maxBytesFoto: 8 * MB,
  maxBytesPantalla: 3 * MB,
  maxBytesMiniatura: 600 * 1024,
  /** Vídeo: sin recomprimir (el navegador no puede hacerlo bien). */
  maxBytesVideo: 40 * MB,
} as const;

/** Máximo de un pie de foto: cabe en dos líneas de la TV. */
export const MAX_PIE = 200;

/** Antispam por dispositivo (y una red más gruesa por IP: el salón comparte wifi). */
export const RITMO = {
  fotosPorHora: 60,
  videosPorHora: 5,
  mensajesPorMinuto: 5,
  retiradasPorHora: 10,
  porIpPorMinuto: 600,
} as const;

/** Los límites efectivos de una boda: plan + años extra comprados. */
export function limitesDe(plan: PlanMomentos, anosExtra = 0) {
  const base = PLANES_MOMENTOS[plan] ?? PLANES_MOMENTOS.album;
  const extra = Math.max(0, Math.floor(anosExtra));
  return { ...base, mesesOnline: base.mesesOnline + extra * AMPLIACIONES_MOMENTOS.conservar.meses };
}

export function esPlanMomentos(x: unknown): x is PlanMomentos {
  return x === "album" || x === "directo" || x === "gestionado" || x === "estudio";
}

/** «1,2 GB», «340 MB». Para el panel. */
export function formatearBytes(n: number) {
  if (n >= GB) return `${(n / GB).toLocaleString("es-ES", { maximumFractionDigits: 1 })} GB`;
  if (n >= MB) return `${Math.round(n / MB).toLocaleString("es-ES")} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

/** Retos que se proponen en la página de subida. */
export const RETOS_FOTO = [
  "Un brindis",
  "La abuela bailando",
  "Vuestra mesa al completo",
  "Los novios sin que se den cuenta",
  "Un selfi con alguien que acabas de conocer",
  "Los zapatos de la pista",
  "La mejor carcajada",
  "Un detalle de la decoración",
] as const;

/** Momentos que los novios pueden lanzar desde el control. */
export const MOMENTOS_PROGRAMADOS = [
  "Llegada de los novios",
  "Primer baile",
  "La tarta",
  "Los discursos",
  "El ramo",
  "Barra libre",
] as const;
