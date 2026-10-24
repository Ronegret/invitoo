/**
 * Contrato E1 (motor) ↔ E2 (contenido) de los correos automáticos.
 * Solo tipos y constantes: sin lógica de servidor, se puede importar en
 * cualquier sitio (plantillas puras, galería del estudio, motor).
 *
 * E2 exporta:
 *   - `SECUENCIA: Paso[]` en `src/lib/correos/secuencia.ts`
 *   - `PLANTILLAS: Record<IdCorreo, (d: DatosCorreo) => Correo>` en
 *     `src/lib/correos/plantillas/index.ts`
 * Si E2 necesita un campo nuevo en `DatosCorreo`, lo añade aquí con un Edit
 * mínimo (opcional, con `?`) y lo anota en `docs/24a-secuencia-correos.md`.
 */

/* ───────────────────────── Identificadores ───────────────────────── */

/** Correos a los novios (ciclo de vida). */
export const IDS_NOVIOS = [
  "bienvenida", // tras pagar o al vincular la cuenta
  "completar-datos", // recordatorio: completar datos y aprobar diseño
  "publicada", // invitación publicada: cómo enviarla por WhatsApp
  "rsvp-resumen", // semanal mientras haya RSVP abiertos
  "rsvp-fecha-limite", // aviso de la fecha límite de confirmación
  "faltan-30", // checklist suave: 30 días antes
  "faltan-7", // 7 días antes (QR de «En directo», Libro de deseos)
  "faltan-1", // 1 día antes
  "gracias", // día después: gracias, álbum y Libro de deseos en PDF
  "resena", // 1 mes después: reseña + programa de recomendación
  "aniversario", // 1 año después: felicitación + conservar el álbum
  "album-caduca", // antes de que caduque el álbum: descargarlo
] as const;

/** Correos internos al estudio (Rodrigo). */
export const IDS_ESTUDIO = [
  "estudio-diario",
  "estudio-semanal",
  "alerta-reserva", // reserva pagada
  "alerta-cobro", // cobro pagado
  "alerta-cambio", // solicitud de cambio
  "alerta-pico", // pico de visitas
] as const;

export type IdNovios = (typeof IDS_NOVIOS)[number];
export type IdEstudio = (typeof IDS_ESTUDIO)[number];
export type IdCorreo = IdNovios | IdEstudio;

export const IDS_CORREO: IdCorreo[] = [...IDS_NOVIOS, ...IDS_ESTUDIO];

export function esIdCorreo(x: unknown): x is IdCorreo {
  return typeof x === "string" && (IDS_CORREO as string[]).includes(x);
}

/* ───────────────────────── Lo que devuelve una plantilla ───────────────────────── */

export type Correo = {
  asunto: string;
  /** Texto de vista previa en la bandeja (≈ 90 caracteres). */
  preheader: string;
  html: string;
  /** Versión en texto plano: siempre. */
  texto: string;
};

export type Plantilla = (d: DatosCorreo) => Correo;

/* ───────────────────────── Datos de entrada ───────────────────────── */

/** Cifras de una boda que el motor rellena cuando el paso las necesita. */
export type CifrasBoda = {
  aperturas: number;
  aperturasSemana?: number;
  /** Respuestas totales y desglose. */
  respuestas: number;
  vienen: number;
  noVienen: number;
  /** Personas (adultos + niños) que vienen. */
  personas?: number;
  /** Respuestas nuevas desde el último resumen. */
  nuevas?: number;
  fotos?: number;
  deseos?: number;
  /** Fecha límite de RSVP (ISO yyyy-mm-dd) si la hay. */
  fechaLimite?: string | null;
  /** Días que faltan para la fecha límite. */
  diasHastaLimite?: number | null;
  /** Fecha (ISO) en la que caduca el álbum. */
  albumCaduca?: string | null;
};

/** Una fila «antes / ahora» para los resúmenes del estudio. */
export type Tendencia = { actual: number; anterior: number };

/** Datos del estudio: resúmenes y alertas a Rodrigo. */
export type DatosEstudio = {
  /** Periodo cubierto (ISO yyyy-mm-dd, ambos incluidos). */
  desde: string;
  hasta: string;
  web: {
    paginas: Tendencia; // páginas vistas
    visitantes: Tendencia; // únicos aproximados
    reservarClics: Tendencia;
    whatsappClics: Tendencia;
    checkoutsIniciados: Tendencia;
    checkoutsPagados: Tendencia;
    /** Top 5: [ruta o plantilla, vistas]. */
    paginasTop: { clave: string; vistas: number }[];
    plantillasTop: { clave: string; vistas: number }[];
    origenes: { clave: string; vistas: number }[];
    /** Serie diaria para gráficas sencillas. */
    porDia?: { dia: string; paginas: number; visitantes: number }[];
  };
  invitaciones: {
    aperturas: Tendencia;
    rsvp: Tendencia;
    fotos: Tendencia;
    /** Top bodas por aperturas. */
    bodas: { slug: string; pareja: string; aperturas: number; rsvp: number; fotos: number }[];
  };
  /** Solo en alertas: qué ha pasado. */
  alerta?: {
    titulo: string;
    detalle?: string | null;
    /** Importe en céntimos (reserva o cobro). */
    importe?: number | null;
    boda?: { slug: string; pareja: string } | null;
    /** Pico: vistas en la última hora / media. */
    pico?: { vistas: number; media: number; ruta?: string | null } | null;
  };
  /** Enlace a /estudio/visitas. */
  enlaceVisitas: string;
  /** Enlace a la ficha o lista del estudio relacionada. */
  enlaceEstudio: string;
};

export type DatosCorreo = {
  /** Nombres de la pareja. En correos del estudio puede ir vacío. */
  pareja: { a: string; b: string };
  /** Fecha de la boda (ISO yyyy-mm-dd) o null si no hay. */
  fecha: string | null;
  slug: string;
  enlaces: {
    panel: string;
    invitacion: string;
    album: string;
    deseos: string; // Libro de buenos deseos (PDF)
    baja: string; // un clic: se da de baja de la fidelización
    preferencias: string; // página de preferencias
    /** En directo (QR) — opcional. */
    directo?: string;
    /** Página de reseñas — opcional. */
    resena?: string;
  };
  /** Días que faltan para la boda (negativo si ya pasó). */
  diasParaBoda?: number | null;
  /** Código de recomendación para amigos (programa de P2). */
  codigoAmigos?: string | null;
  /** Plan contratado (texto legible), si se conoce. */
  plan?: string | null;
  cifras?: CifrasBoda;
  estudio?: DatosEstudio;
  /** E2 · «completar-datos»: qué falta (el motor lo copia de ContextoPaso). */
  pendientes?: { datos: boolean; diseno: boolean };
  /** E2 · «aniversario»: un deseo favorito del Libro, si lo hay. */
  recuerdo?: { texto: string; autor?: string | null } | null;
  /**
   * E3 · «bienvenida» tras pagar: es también la confirmación de la reserva
   * (sustituye al antiguo «Vuestra invitación está reservada» de pagos).
   */
  reserva?: {
    /** Céntimos cobrados. */
    importe: number;
    demo: boolean;
    /** «Cinco días laborables», del plan. */
    plazo?: string | null;
    /** Enlace de WhatsApp con el mensaje ya escrito. */
    whatsapp?: string | null;
    /** URL de /condiciones. */
    condiciones?: string | null;
  } | null;
};

/* ───────────────────────── Secuencia declarativa ───────────────────────── */

/**
 * - `servicio`: transaccional, se envía siempre (se puede silenciar en preferencias, salvo
 *   los imprescindibles que marque `imprescindible`).
 * - `fidelizacion`: necesita base legítima (cliente, LSSI 21.2) y lleva baja de un clic.
 * - `estudio`: interno, solo a Rodrigo.
 */
export type Categoria = "servicio" | "fidelizacion" | "estudio";

/** Eventos que disparan pasos al momento (llamando a `programar()`). */
export type Evento =
  | "pago" // reserva pagada
  | "vinculo" // la pareja vincula su cuenta
  | "publicada" // la invitación se publica
  | "rsvp" // llega una respuesta
  | "cobro" // un cobro pagado (estudio)
  | "solicitud" // solicitud de cambio (estudio)
  | "pico"; // pico de visitas (estudio)

/** Ancla para los pasos con desfase. */
export type Ancla = "boda" | "pago" | "publicada" | "caducidad-album" | "limite-rsvp"; // E2: «limite-rsvp» = fecha límite de confirmación (ContextoPaso.diasHastaLimite)

export type Disparador =
  | { tipo: "evento"; evento: Evento }
  /** `dias` relativo al ancla: -30 = 30 días antes; 1 = día después. */
  | { tipo: "desfase"; ancla: Ancla; dias: number }
  /** Recurrente: cada `cadaDias` días mientras se cumpla la condición. */
  | { tipo: "recurrente"; cadaDias: number }
  /** Programado por el cron del estudio. */
  | { tipo: "cron"; cuando: "diario" | "semanal" };

/** Lo que una condición puede mirar. El motor lo rellena. */
export type ContextoPaso = {
  hoy: string; // ISO yyyy-mm-dd (Europe/Madrid)
  fecha: string | null; // fecha de la boda
  diasParaBoda: number | null;
  pagado: boolean;
  publicada: boolean;
  /** Datos y diseño aprobados (no quedan pasos pendientes). */
  datosCompletos: boolean;
  disenoAprobado: boolean;
  /** RSVP abierto (fecha límite futura o sin límite y boda futura). */
  rsvpAbierto: boolean;
  diasHastaLimite: number | null;
  albumCaduca: string | null;
  cifras?: CifrasBoda;
};

export type Paso = {
  id: IdCorreo;
  categoria: Categoria;
  disparador: Disparador;
  /** Si devuelve false, el paso no sale (y se vuelve a mirar en el siguiente cron). */
  condicion?: (c: ContextoPaso) => boolean;
  /** Plantilla a usar (normalmente igual que `id`). */
  plantilla: IdCorreo;
  /** Margen en días para enviar si el cron no pasó el día justo (defecto 2). */
  ventanaDias?: number;
  /** No se puede apagar desde preferencias (p. ej. aviso de caducidad del álbum). */
  imprescindible?: boolean;
  /** Descripción corta para la galería y las preferencias. */
  nombre: string;
};

/* ───────────────────────── Preferencias ───────────────────────── */

/** Grupos que la pareja puede apagar en /baja (página de preferencias). */
export type GrupoPreferencia = "servicio" | "rsvp" | "cuenta-atras" | "fidelizacion";

export const GRUPO_DE: Record<IdNovios, GrupoPreferencia> = {
  bienvenida: "servicio",
  "completar-datos": "servicio",
  publicada: "servicio",
  "rsvp-resumen": "rsvp",
  "rsvp-fecha-limite": "rsvp",
  "faltan-30": "cuenta-atras",
  "faltan-7": "cuenta-atras",
  "faltan-1": "cuenta-atras",
  gracias: "servicio",
  resena: "fidelizacion",
  aniversario: "fidelizacion",
  "album-caduca": "servicio",
};

export type PreferenciasCorreo = Record<GrupoPreferencia, boolean>;

export const PREFERENCIAS_CORREO_INICIALES: PreferenciasCorreo = {
  servicio: true,
  rsvp: true,
  "cuenta-atras": true,
  fidelizacion: true,
};
