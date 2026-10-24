/**
 * Los textos de la web pública.
 *
 * Están aquí y no dentro de cada página por una razón práctica: la misma
 * lista aparece en varios sitios —lo que lleva dentro se resume en la home y
 * se cuenta entero en /servicios; los precios salen en la home, en /precios
 * y en los datos estructurados— y si el texto vive en un solo lugar no hay
 * manera de que dos versiones acaben diciendo cosas distintas.
 *
 * UNA SOLA VERDAD. Ningún número de la web se escribe a mano: el número de
 * plantillas sale de `PLANTILLAS.length`, el de cosas que lleva dentro de
 * `DENTRO.length`, y los precios de `PLANES` y `ANADIDOS`. `enLetra()` los
 * pasa a palabras cuando la frase lo pide.
 *
 * «En directo» es la excepción que confirma la regla: sus precios y límites
 * no viven aquí sino en `lib/momentos/planes.ts`, que es lo que lee también
 * el servidor. Aquí solo se cuentan.
 */

import { AMPLIACIONES_MOMENTOS, PLANES_MOMENTOS } from "@/lib/momentos/planes";

/* ───────────────────────────── Números ───────────────────────────── */

const LETRAS = [
  "cero", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho",
  "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis",
  "diecisiete", "dieciocho", "diecinueve", "veinte",
];

/**
 * Un número en letra, en femenino («ocho plantillas», «una apertura»). Por
 * encima de veinte se queda en cifra, que es como se escribe en español.
 */
export function enLetra(n: number, mayuscula = false) {
  const t = LETRAS[n] ?? String(n);
  return mayuscula ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/** 2.5 → «2,50»; 149 → «149». */
export function euros(n: number) {
  return Number.isInteger(n)
    ? String(n)
    : n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ──────────────────────────── La demo ────────────────────────────── */

/**
 * La invitación que corre dentro del móvil de la portada y la que abre el
 * botón «Abrir una invitación de ejemplo». Se elige por plantilla, no por
 * slug, para que si el catálogo cambia de muestra la web la siga.
 */
export const PLANTILLA_PORTADA = "sobre";

/* ─────────────────────────── Lo que lleva ────────────────────────── */

export type Entrada = {
  titulo: string;
  texto: string;
  /** Si solo va en algunos planes, cuál. */
  plan?: string;
};

/** Lo que lleva dentro una invitación de Invitoo. */
export const DENTRO: Entrada[] = [
  {
    titulo: "La apertura",
    texto: "Un vídeo con vuestros nombres dentro, no encima. Es lo primero que ven.",
  },
  {
    titulo: "Un enlace para cada invitado",
    texto: "Cada uno recibe el suyo y la invitación le saluda por su nombre.",
  },
  {
    titulo: "Confirmación por persona",
    texto: "Quién viene, qué menú quiere y a qué es alérgico. Sin registrarse.",
  },
  {
    titulo: "El Excel para el catering",
    texto: "Las respuestas, en una hoja que se manda tal cual a la finca.",
  },
  {
    titulo: "El itinerario",
    texto: "Hora a hora, con la dirección copiable y el botón de cómo llegar.",
  },
  {
    titulo: "El autobús",
    texto: "Quién lo coge, a la ida, a la vuelta, y dónde se sube.",
  },
  {
    titulo: "Dónde dormir",
    texto: "Dos o tres opciones cerca, con precio y enlace.",
  },
  {
    titulo: "El dress code",
    texto: "Con los colores puestos, no con una palabra que cada uno entiende a su manera.",
  },
  {
    titulo: "Vuestra historia",
    texto: "Cómo empezó todo, con vuestras fotos entre los párrafos.",
  },
  {
    titulo: "Regalos",
    texto: "Vuestro número de cuenta, dicho de una forma que no incomoda a nadie.",
  },
  {
    titulo: "La playlist",
    texto: "Una lista de Spotify donde cada invitado mete su canción.",
  },
  {
    titulo: "Los buenos deseos",
    texto: "Lo que os escriben. No se publica: se recoge en vuestro Libro de buenos deseos, para imprimirlo después de la boda.",
  },
  {
    titulo: "El álbum",
    texto: "Si alguien hace una foto buena, la sube aquí. Todas en el mismo sitio.",
  },
  {
    titulo: "La canción",
    texto: "Compuesta para vosotros. Suena en la invitación y os la quedáis para la ceremonia.",
    plan: "Con canción",
  },
];

/* ──────────────────────────── Los planes ─────────────────────────── */

export type Plan = {
  id: "invitoo" | "cancion" | "estudio";
  nombre: string;
  precio: number;
  desde?: boolean;
  /** Una frase: para quién es. */
  resumen: string;
  /** Si no es el primero, con qué empieza («Todo lo de Invitoo»). */
  base?: string;
  incluye: string[];
  noIncluye: string[];
  plazo: string;
  destacado?: boolean;
};

/**
 * Los tres planes. IVA incluido y pago único. Decididos en
 * BRIEF-EQUIPO.md; si cambian, se cambian aquí y en ningún otro sitio.
 */
export const PLANES: Plan[] = [
  {
    id: "invitoo",
    nombre: "Invitoo",
    precio: 149,
    resumen: "La invitación entera, montada por nosotros.",
    incluye: [
      "Apertura cinematográfica con vuestros nombres",
      "Todas las secciones: itinerario, alojamiento, dress code, regalos, playlist, historia…",
      "Confirmación por persona, con menús y alergias",
      "Un enlace personal para cada invitado",
      "Panel con exportación a Excel para el catering",
      `Álbum de hasta ${PLANES_MOMENTOS.album.fotos} fotos de los invitados`,
      "Vuestro panel: invitados, confirmaciones y la lista para imprimir",
      "Libro de buenos deseos: un QR para recogerlos y un PDF para imprimir",
      "Videollamada de diseño",
    ],
    noIncluye: [
      "Canción original",
      "Save the date en vídeo",
      "Segundo idioma",
      `${PLANES_MOMENTOS.directo.nombre}, la pantalla del salón (${PLANES_MOMENTOS.directo.precio} €)`,
    ],
    plazo: "Lista en 5 días laborables",
  },
  {
    id: "cancion",
    nombre: "Invitoo con canción",
    precio: 249,
    resumen: "La misma invitación, con banda sonora propia.",
    base: "Todo lo de Invitoo, y además:",
    incluye: [
      "Una canción original compuesta para vosotros (Dedícalo)",
      "Suena en la invitación y os la quedáis en alta calidad para la ceremonia",
      "Save the date en vídeo vertical para WhatsApp e Instagram",
      "Dos idiomas",
    ],
    noIncluye: [
      "Diseño desde cero",
      "Libro de la Boda",
      `${PLANES_MOMENTOS.directo.nombre} (${PLANES_MOMENTOS.directo.precio} €)`,
    ],
    plazo: "Lista en 5 días laborables",
    destacado: true,
  },
  {
    id: "estudio",
    nombre: "Estudio",
    precio: 449,
    desde: true,
    resumen: "Un diseño que no existía. Ni plantilla ni apertura de catálogo.",
    base: "Todo lo de Invitoo, y además:",
    incluye: [
      "Diseño original desde cero",
      "Canción original compuesta para vosotros",
      "Apertura hecha a medida para vuestra boda",
      "Los idiomas que hagan falta",
      "Libro de la Boda incluido",
      `${PLANES_MOMENTOS.directo.nombre} el día de la boda, con la pantalla del salón`,
      "Entrega prioritaria en 48 horas",
    ],
    noIncluye: ["Tarjetas impresas con QR"],
    plazo: "Entrega prioritaria en 48 h",
  },
];

/** Lo que vale para los tres. Va una vez, no repetido en cada tarjeta. */
export const GARANTIA = {
  titulo: "Cambios ilimitados hasta que la publiquéis",
  texto:
    "Hasta que digáis «ésta», se cambia lo que haga falta, las veces que haga falta. Sin contar.",
};

export const CONDICIONES = [
  "IVA incluido",
  "Pago único, sin cuotas ni comisión por invitado",
  "Un año online desde la boda",
];

/** Los añadidos. Precios con IVA. */
export type Anadido = {
  nombre: string;
  precio: number;
  desde?: boolean;
  /** Lo que va detrás del precio: «/ud», «por idioma»… */
  unidad?: string;
  /** Precio si después contratan la invitación. */
  conInvitacion?: number;
  nota: string;
};

export const ANADIDOS: Anadido[] = [
  {
    nombre: "Save the date en vídeo",
    precio: 69,
    conInvitacion: 39,
    nota: "Vertical, para estados de WhatsApp e Instagram. 39 € si después hacéis la invitación con nosotros.",
  },
  {
    nombre: "Idioma extra",
    precio: 39,
    unidad: "por idioma",
    nota: "La invitación entera traducida, con su selector. Para bodas con familia fuera.",
  },
  {
    nombre: "Entrega en 48 horas",
    precio: 49,
    nota: "Cuando la boda es ya. Se monta antes que el resto.",
  },
  {
    nombre: "Libro de la Boda",
    precio: 79,
    nota: "Después de la boda: los buenos deseos, las fotos de los invitados y la canción, maquetados a mano en una pieza que os quedáis.",
  },
  {
    nombre: "Tarjetas impresas con QR",
    precio: 2.5,
    desde: true,
    unidad: "/ud, mínimo 30",
    nota: "Para quien prefiere papel. El QR abre la misma invitación.",
  },
  {
    nombre: "La apertura en MP4",
    precio: 49,
    nota: "Para proyectarla en el banquete, en grande.",
  },
];

/** El descuento de los invitados que se casan. */
export const DESCUENTO_INVITADO = 20;

/* ─────────────────────────── En directo ──────────────────────────── */

const AL = PLANES_MOMENTOS.album;
const ED = PLANES_MOMENTOS.directo;
const GE = PLANES_MOMENTOS.gestionado;
const CONSERVAR = AMPLIACIONES_MOMENTOS.conservar;

/** «12 meses» → «un año»; lo demás, en meses. */
function plazoOnline(meses: number) {
  if (meses === 12) return "un año";
  if (meses % 12 === 0) return `${enLetra(meses / 12)} años`;
  return `${meses} meses`;
}

/** Cómo se cuentan las fotos de un plan. */
export function fotosDe(p: { fotos: number; ilimitado: boolean }) {
  return p.ilimitado ? "Fotos sin límite, con uso razonable" : `Hasta ${p.fotos.toLocaleString("es-ES")} fotos`;
}

export type OpcionDirecto = {
  id: "album" | "directo" | "gestionado";
  nombre: string;
  /** 0 = incluido. */
  precio: number;
  /** Dónde va incluido, dicho para la web. */
  incluido?: string;
  resumen: string;
  base?: string;
  incluye: string[];
  nota?: string;
  destacado?: boolean;
};

/**
 * Las tres maneras de tener las fotos de los invitados. Precios, límites y
 * listas salen de `lib/momentos/planes.ts`; aquí solo se ponen en orden y
 * se les da una frase.
 */
export const OPCIONES_DIRECTO: OpcionDirecto[] = [
  {
    id: "album",
    nombre: "Álbum",
    precio: AL.precio,
    incluido: "En todas las invitaciones",
    resumen: "Las fotos de los invitados, en la invitación. Sin pantalla.",
    incluye: AL.incluye,
    nota: `Online ${plazoOnline(AL.mesesOnline)} después de la boda.`,
  },
  {
    id: "directo",
    nombre: ED.nombre,
    precio: ED.precio,
    incluido: "Incluido en Estudio",
    resumen: "Lo que suben vuestros invitados, en la TV del salón mientras pasa.",
    // Sin repetir: si `planes.ts` ya lo cuenta, no se añade otra vez.
    incluye: Array.from(
      new Set([...ED.incluye.slice(0, 4), "QR y tarjetas de mesa para imprimir", ...ED.incluye.slice(4)]),
    ),
    nota: ED.nota,
    destacado: true,
  },
  {
    id: "gestionado",
    nombre: GE.nombre,
    precio: GE.precio,
    resumen: "Lo mismo, y no os preocupáis de nada: lo dejamos funcionando en el local.",
    base: GE.incluye[0]?.startsWith("Todo lo de") ? `${GE.incluye[0]}, y además:` : undefined,
    incluye: GE.incluye[0]?.startsWith("Todo lo de") ? GE.incluye.slice(1) : GE.incluye,
    nota: GE.nota,
  },
];

export const DIRECTO = {
  precio: ED.precio,
  precioGestionado: GE.precio,
  videoSegundos: ED.duracionVideo,
  videos: ED.videos,
  fotos: fotosDe(ED),
  online: plazoOnline(ED.mesesOnline),
  onlineAlbum: plazoOnline(AL.mesesOnline),
  conservar: { nombre: "Un año más online", precio: CONSERVAR.precio, meses: CONSERVAR.meses },
  /** Lo que tiene que haber en el salón. */
  local: "Una TV con HDMI y un portátil, o un Chromecast",
};

/** Cómo funciona el día de la boda, en el orden en que ocurre. */
export const DIRECTO_PASOS: Entrada[] = [
  {
    titulo: "Un QR en cada mesa",
    texto: "Os damos las tarjetas listas para imprimir. Con el Gestionado, os llegan ya impresas.",
  },
  {
    titulo: "Lo escanean y suben",
    texto: `Fotos, vídeos de hasta ${ED.duracionVideo} segundos y mensajes. Sin app, sin registrarse, sin contraseñas: se abre en el navegador del móvil.`,
  },
  {
    titulo: "Aparece en la pantalla",
    texto: "En la TV o el proyector del salón, foto a foto con fundidos lentos. Los mensajes salen en tarjetas, con letra de invitación.",
  },
  {
    titulo: "Vosotros decidís qué sale",
    texto: "Podéis aprobar cada foto antes de que salga, o dejar que entren solas y ocultar la que no os guste con un toque. Desde el móvil, en plena fiesta.",
  },
  {
    titulo: "Al día siguiente, todo",
    texto: `Lo descargáis entero en un ZIP, ordenado. Sigue online ${plazoOnline(ED.mesesOnline)} después de la boda.`,
  },
];

/** Las promesas de privacidad, cortas. Cada una tiene su pregunta abajo. */
export const DIRECTO_PRIVACIDAD: Entrada[] = [
  {
    titulo: "Privado",
    texto: "No sale en Google. La pantalla se abre con una clave que solo tenéis vosotros.",
  },
  {
    titulo: "En la Unión Europea",
    texto: "Las fotos se guardan en servidores de la UE, en Irlanda, y viajan cifradas.",
  },
  {
    titulo: "Con fecha de borrado",
    texto: `Pasado el plazo se borran solas. Si queréis más, ${CONSERVAR.precio} € por cada año.`,
  },
];

/* ──────────────────────── Vuestro panel ──────────────────────────── */

/** Una cosa del panel. `aparte` = se contrata aparte (se ve con candado si no está). */
export type EntradaPanel = Entrada & { aparte?: string; corazon?: boolean };

/**
 * Lo que tienen los novios en su cuenta (contrato F4 → F3). Ni mesas ni
 * cronograma: no hacemos de wedding planner.
 */
export const PANEL: EntradaPanel[] = [
  { titulo: "Invitados", texto: "Toda la lista, cada uno con su enlace personal. Quién viene, quién no y quién falta, según llega, con su menú y sus alergias. Y la lista impresa en un clic, por grupos y con casillas." },
  { titulo: "Libro de buenos deseos", texto: "Un QR para que los invitados os dejen sus deseos. Elegís los favoritos y, después de la boda, os lo descargáis en PDF para imprimirlo como regalo.", corazon: true },
  { titulo: "Avisos", texto: "Cada confirmación, cada deseo y quien cambia su respuesta, al momento o en un resumen diario, por email o al móvil." },
  { titulo: "Pedir un cambio", texto: "Escribís qué queréis cambiar, con una foto o señalando la sección. Veis cuándo lo recibimos, cuándo está en curso y cuándo está hecho." },
  { titulo: "En directo", texto: "La pantalla del salón con las fotos y los mensajes de los invitados, el QR y la descarga de todo.", aparte: `Se contrata aparte, ${PLANES_MOMENTOS.directo.precio} €` },
  { titulo: "El diseño", texto: "Los colores y las animaciones, más serenas o más de cine. Lo veis en vivo mientras lo cambiáis, y siempre se lee bien." },
];

/** Las secciones del menú del panel, en su orden. */
export const MENU_PANEL = ["Hoy", "Invitados", "Libro de deseos", "En directo", "Diseño", "Avisos", "Cuenta"] as const;

/** Cómo se entra. Va escrito una vez para que diga lo mismo en toda la web. */
export const ENTRADA_PANEL = "Entráis con vuestro email: os llega un enlace y ya estáis dentro. Sin contraseñas.";

/* ──────────────────────────── El proceso ─────────────────────────── */

export const PROCESO = [
  {
    titulo: "Elegís",
    texto: "Miráis las aperturas y decís cuál os pega. Si ninguna, se hace otra.",
  },
  {
    titulo: "Hablamos",
    texto: "Videollamada de 20 minutos, gratis. Vuestra historia, vuestros colores, qué queréis contar.",
  },
  {
    titulo: "La montamos",
    texto: "Nosotros la construimos entera. Vosotros no tocáis ningún editor.",
  },
  {
    titulo: "La revisáis",
    texto: "Os mandamos un enlace privado. Se cambia lo que haga falta hasta que la publiquéis.",
  },
  {
    titulo: "La mandáis",
    texto: "Un enlace por WhatsApp, uno por invitado. Las confirmaciones os llegan solas.",
  },
];

/* ───────────────────────── Prueba social ─────────────────────────── */

export type BodaReal = {
  pareja: string;
  cuando: string;
  donde: string;
  enlace?: string;
  nota: string;
};

/**
 * Solo bodas que existen y están publicadas. Si una no tiene enlace
 * público, se queda sin enlace: no se inventa uno.
 */
export const BODAS_REALES: BodaReal[] = [
  {
    pareja: "Nico & Gaby",
    cuando: "Agosto de 2026",
    donde: "El Manzano",
    enlace: "https://nico-y-gaby.invitoo.es/",
    nota: "Sobre con lacre, el vídeo de la pedida dentro y la historia contada por capítulos.",
  },
  {
    pareja: "Consuelo & Marc",
    cuando: "Noviembre de 2025",
    donde: "Alella, Barcelona",
    enlace: "https://consueloymarc.invitoo.es/",
    nota: "Siete hoteles recomendados, banda sonora propia y libro de buenos deseos.",
  },
];

/**
 * Testimonios. VACÍO A PROPÓSITO: solo entran frases reales, con permiso
 * de la pareja, y la sección no se pinta mientras no haya ninguno.
 */
export type Testimonio = {
  texto: string;
  pareja: string;
  boda: string;
  enlace?: string;
};
export const TESTIMONIOS: Testimonio[] = [];

/**
 * Cifras. Igual: solo datos medidos («412 confirmaciones en la boda de…»),
 * nunca redondeados al alza. Sin contenido, la tira no existe.
 */
export type Cifra = { valor: string; texto: string };
export const CIFRAS: Cifra[] = [];

/* ─────────────────────────── Colaboradores ───────────────────────── */

export const COLABORADORES = {
  quien: [
    {
      titulo: "Wedding planners",
      texto: "Lleváis varias bodas a la vez y cada una con su lista. Las veis todas en un panel, cada pareja entra en la suya con su email, y el día de la boda podéis ofrecerles la pantalla «En directo» en el salón.",
    },
    {
      titulo: "Fincas",
      texto: "Mapa, parking, autobuses y horarios ya puestos en una plantilla con vuestra marca. Cada boda que se celebra en vuestra casa llega con la logística resuelta.",
    },
    {
      titulo: "Hoteles",
      texto: "Bodas de destino con invitados de fuera: invitación en varios idiomas y el bloque de habitaciones con su código y su fecha límite.",
    },
  ],
  que: [
    {
      titulo: "Panel multiboda",
      texto: "Todas vuestras bodas en una pantalla: quién ha confirmado, quién falta y qué ha cambiado desde ayer. Entráis con vuestro email, sin contraseñas.",
    },
    {
      titulo: "«En directo» para vuestras parejas",
      texto: `Las fotos y los mensajes de los invitados, en la TV del salón mientras pasa. Lo podéis ofrecer como parte de vuestro servicio y llevar la moderación por ellos. A la pareja le cuesta ${ED.precio} €, o ${GE.precio} € si lo dejamos nosotros funcionando en el local.`,
    },
    {
      titulo: "Exportación para catering y transporte",
      texto: "Menús, alergias por persona y plazas de autobús por parada, en Excel. Se manda tal cual.",
    },
    {
      titulo: "Vuestra marca o un sello discreto",
      texto: "Marca blanca con vuestro logotipo, o la firma de Invitoo tan pequeña que no hace sombra.",
    },
    {
      titulo: "Condiciones de colaborador",
      texto: "Comisión por boda o precio de colaborador, según volumen. Bajo petición: lo hablamos.",
    },
  ],
};

/* ──────────────────────────── Preguntas ──────────────────────────── */

export type Pregunta = {
  q: string;
  a: string;
  de: "precio" | "producto" | "invitados" | "directo" | "despues";
};

/**
 * Las preguntas, etiquetadas por dónde aparecen. Las de precio salen en
 * /precios, que es donde se dudan; las de producto en /servicios. Todas
 * juntas, en /preguntas (y en su FAQPage).
 */
export const PREGUNTAS: Pregunta[] = [
  {
    de: "invitados",
    q: "Mi abuela no se aclara con el móvil. ¿Va a poder abrirla?",
    a: "Sí. Es un enlace: se toca y se abre, como una foto de WhatsApp. No hay que instalar nada, ni registrarse, ni acordarse de ninguna contraseña. La letra es grande y los botones también, a propósito: en una boda española, uno de cada tres invitados pasa de sesenta y cinco años.",
  },
  {
    de: "invitados",
    q: "¿Y si mi abuela no tiene WhatsApp?",
    a: "Le llega en papel. Hacemos tarjetas impresas con un QR que abre la misma invitación, desde 2,50 € la unidad (mínimo 30). Y si no tiene móvil, cualquiera puede confirmar por ella desde la invitación: su nieta, vosotros o quien le lleve la tarjeta.",
  },
  {
    de: "invitados",
    q: "¿Quién ve la lista de invitados?",
    a: "Vosotros, desde vuestro panel. La invitación no aparece en Google y cada invitado solo ve su propio enlace, no los demás. Usamos los datos para la boda y para nada más, no se ceden a nadie, y cuando ya no los necesitéis los borramos si nos lo pedís.",
  },
  {
    de: "producto",
    q: "¿Tenemos que montarla nosotros?",
    a: "No, y ésa es toda la diferencia con las plataformas de veintinueve euros. Ahí os dan un editor y el trabajo es vuestro. Aquí nos contáis vuestra boda una vez, la montamos entera, y vosotros solo decís qué cambiar.",
  },
  {
    de: "producto",
    q: "¿Qué pasa si queremos cambiar algo?",
    a: "Hasta que la publiquéis, cambios ilimitados. Y si después cambia algo de la boda —una hora, un lugar, el cóctel que pasa dentro porque llueve— lo actualizamos y el enlace sigue siendo el mismo: todo el mundo ve lo nuevo sin reenviar nada.",
  },
  {
    de: "producto",
    q: "¿Qué es lo de la canción?",
    a: "Una canción original, compuesta para vuestra boda y con vuestra historia dentro, por Dedícalo. Suena en la invitación cuando el invitado le da al sonido, y os la quedáis en alta calidad para ponerla en la ceremonia. Va en el plan Invitoo con canción.",
  },
  {
    de: "producto",
    q: "¿Puede estar en varios idiomas?",
    a: "Sí, con un selector arriba. El plan con canción lleva dos idiomas, el Estudio los que hagan falta, y cada idioma extra son 39 €.",
  },
  {
    de: "precio",
    q: "¿Cuánto tarda?",
    a: "Cinco días laborables desde la videollamada. Si vais con prisa, la entrega en 48 horas son 49 € más; en el Estudio va incluida. Para el save the date, lo ideal es mandarlo entre seis y doce meses antes, y la invitación unos tres meses antes.",
  },
  {
    de: "precio",
    q: "¿Hay alguna cuota o comisión después?",
    a: "No. Es un pago único, con IVA incluido. Ni suscripción, ni comisión por invitado, ni coste por confirmación. Lo que pone en el precio es lo que se paga, y el primer año online va dentro.",
  },
  {
    de: "precio",
    q: "¿Podemos verla antes de decidir?",
    a: "Sí. Abrid cualquiera de las invitaciones de ejemplo, que funcionan enteras, y si queréis, reservad veinte minutos por vídeo: os contamos qué haríamos con vuestra boda. Sin presupuesto por delante y sin compromiso.",
  },
  {
    de: "directo",
    q: "¿Necesitan los invitados una app?",
    a: `No. Escanean el QR de su mesa con la cámara del móvil y se abre una página en el navegador. Ni app, ni registro, ni contraseña: eligen la foto, el vídeo (hasta ${ED.duracionVideo} segundos) o escriben un mensaje, y ya está. Funciona en iPhone y en Android.`,
  },
  {
    de: "directo",
    q: "¿Qué hace falta en el salón?",
    a: `${DIRECTO.local}. La pantalla es una página web a pantalla completa: se abre, se pone la clave y empieza. Con el Gestionado lo configuramos y lo probamos antes con el local; si el salón no tiene TV, el alquiler se presupuesta aparte.`,
  },
  {
    de: "directo",
    q: "¿Y si alguien sube algo inapropiado?",
    a: "Lo quitáis con un toque desde el móvil y desaparece de la pantalla al momento. Si preferís ir sobre seguro, activáis la moderación previa: nada sale en la TV hasta que alguien de confianza lo aprueba. Puede ser uno de vosotros, un amigo o vuestra wedding planner.",
  },
  {
    de: "directo",
    q: "¿Qué pasa si se cae el wifi del salón?",
    a: "La pantalla sigue pasando las fotos que ya tiene, y en cuanto vuelve la conexión recoge las nuevas. En el móvil, si una subida se corta, se puede volver a enviar sin que se duplique. Y como cada invitado sube con sus propios datos, el wifi del salón no es imprescindible.",
  },
  {
    de: "directo",
    q: "¿Dónde se guardan las fotos?",
    a: "En servidores de la Unión Europea, en Irlanda, cumpliendo el RGPD. No son públicas: cada foto se sirve con un enlace que caduca a los pocos minutos, la galería no aparece en Google y la pantalla se abre con una clave que solo tenéis vosotros. No las usamos para nada más que vuestra boda.",
  },
  {
    de: "directo",
    q: "¿Cuánto tiempo se guardan?",
    a: `Con ${ED.nombre}, ${DIRECTO.online} después de la boda; el álbum de la invitación, ${DIRECTO.onlineAlbum}. Antes de que pase el plazo, lo descargáis todo en un ZIP desde vuestro panel. Si queréis que siga online más tiempo, son ${CONSERVAR.precio} € por cada año más.`,
  },
  {
    de: "directo",
    q: "¿Y los niños que salen en las fotos?",
    a: "Las fotos son de la boda y se quedan en la boda: privadas, fuera de Google y borradas al terminar el plazo. Podéis activar la moderación previa para que nada salga en la pantalla sin pasar por vosotros, y cualquier familia puede pedir que se quite una foto en la que sale su hijo: se retira de la pantalla y de la galería. Lo que no podemos controlar es lo que cada invitado guarda en su propio móvil.",
  },
  {
    de: "despues",
    q: "¿Qué pasa después de la boda?",
    a: "La invitación sigue online un año. Los buenos deseos y el álbum siguen abiertos, que es cuando más fotos suben, y desde vuestro panel lo descargáis todo cuando queráis. Vuestro Libro de buenos deseos sale en PDF, listo para imprimir. Y si queréis quedaros con todo —deseos, fotos de los invitados y la canción— maquetado a mano, lo convertimos en el Libro de la Boda por 79 €.",
  },
  {
    de: "producto",
    q: "¿Qué es el Libro de buenos deseos?",
    a: "Un QR que ponéis en las mesas o en la entrada. Los invitados lo escanean, escriben su nombre y un deseo, y ya está: sin app y sin registrarse. Se juntan con lo que os escriben en la invitación y en En directo. Desde el panel elegís vuestros favoritos y, después de la boda, descargáis «Nuestro libro de buenos deseos» en PDF para imprimirlo como regalo. Va incluido en todos los planes.",
  },
  {
    de: "producto",
    q: "¿Qué hay en vuestro panel?",
    a: "Los invitados con sus confirmaciones, menús y alergias, la lista para imprimir en un clic y el Excel del catering; el Libro de buenos deseos; los avisos, al momento o en un resumen diario; «Pedir un cambio», para pedirnos lo que queráis cambiar y ver en qué estado está; En directo, y el diseño de la invitación, con los colores en vivo. Lo que no tengáis contratado no se esconde: se ve en gris, con un candado y una vista previa. No os pedimos que hagáis de wedding planner: nada de mesas ni de horarios que mantener.",
  },
  {
    de: "producto",
    q: "¿Y si queremos cambiar algo cuando ya está publicada?",
    a: "Desde el panel, en «Pedir un cambio»: escribís qué queréis cambiar y, si ayuda, adjuntáis una foto o señaláis la sección. Veis cuándo lo hemos recibido, cuándo está en curso y cuándo está hecho, y os avisamos al terminar.",
  },
];

/* ──────────────────────── Filtros del catálogo ───────────────────── */

/**
 * Los filtros de /plantillas. `data/plantillas.ts` trae una sola etiqueta
 * por plantilla («Clásica», «De campo»…) y no sirve para filtrar: una boda
 * civil en la ciudad es «Civil» y también «Ciudad». Así que el mapa va aquí,
 * por id. Una plantilla nueva que no esté en el mapa sale igual en «Todas»;
 * un filtro sin ninguna plantilla no se pinta.
 */
export type FiltroPlantilla = {
  id: "clasica" | "campo" | "mar" | "ciudad" | "noche" | "civil" | "mediterranea";
  nombre: string;
};

export const FILTROS_PLANTILLA: FiltroPlantilla[] = [
  { id: "clasica", nombre: "Clásica" },
  { id: "campo", nombre: "Campo" },
  { id: "mar", nombre: "Mar" },
  { id: "ciudad", nombre: "Ciudad" },
  { id: "noche", nombre: "Noche" },
  { id: "civil", nombre: "Civil" },
  { id: "mediterranea", nombre: "Mediterránea" },
];

export const ESTILO_PLANTILLA: Record<string, FiltroPlantilla["id"][]> = {
  sobre: ["clasica"],
  floracion: ["campo"],
  mar: ["mar"],
  velo: ["ciudad", "clasica"],
  constelacion: ["noche"],
  tinta: ["ciudad", "civil"],
  registro: ["civil", "ciudad"],
  azulejo: ["mediterranea", "mar"],
  carta: ["clasica"],
};

/* ─────────────────────────── Cómo se paga ────────────────────────── */

/**
 * La señal 50/50 (docs/09 §2, patrón 9).
 *
 * PENDIENTE DE CONFIRMAR POR RODRIGO: hoy los enlaces de Stripe cobran el
 * plan entero. Si se confirma, hay que partir los enlaces de pago en dos.
 * Mientras `confirmado` sea false, la web lo enseña igual (lo pidió el
 * brief v2), pero este es el único sitio donde se cambia.
 */
export const PAGO_EN_DOS = {
  confirmado: false,
  titulo: "La mitad al aprobar el diseño, la otra mitad al publicar",
  texto:
    "Pagáis la mitad al aprobar el diseño y la otra mitad al publicar. Hasta que no digáis «ésta es», no habéis pagado nada.",
  partes: [
    { cuando: "Al aprobar el diseño", cuanto: 50 },
    { cuando: "Al publicarla", cuanto: 50 },
  ],
};

/* ─────────────────────── La portada del sobre ────────────────────── */

/** Lo que va escrito a mano en el sobre de la portada. */
export const PARA_QUIEN = "Para vosotros";
