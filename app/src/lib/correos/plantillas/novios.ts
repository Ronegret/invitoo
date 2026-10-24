/**
 * Correos a los novios: el ciclo de vida de una boda con Invitoo.
 * Voz de Invitoo (doc 19): vosotros, frases cortas, cálido, nunca insistente.
 * No somos wedding planner: solo hablamos de lo que hace Invitoo.
 *
 * Cada plantilla es pura: `(d: DatosCorreo) => Correo`. El asunto B de cada
 * una está en `ASUNTOS_B_NOVIOS` (para pruebas A/B del motor).
 */
import type { Correo, DatosCorreo, IdNovios } from "../tipos.ts";
import { componer, euros, fechaLarga, num, origenDe, pareja, plural, sumarDias, type Bloque, type Pie } from "./base.ts";

/** Programa «¿También os casáis?» (P2, `DESCUENTO_INVITADO`). */
const DESCUENTO_AMIGOS = 20;
/** «Conservar 1 año más» (`AMPLIACIONES_MOMENTOS.conservar.precio`). */
const PRECIO_CONSERVAR = 19;

const origen = (d: DatosCorreo) => origenDe(d.enlaces.panel, d.enlaces.invitacion);

function pieServicio(d: DatosCorreo): Pie {
  const cuando = d.fecha ? ` para el ${fechaLarga(d.fecha)}` : "";
  // E3: después de la boda ya no «estáis preparando» nada.
  const despues = d.diasParaBoda != null && d.diasParaBoda < 0;
  return {
    tipo: "servicio",
    preferencias: d.enlaces.preferencias,
    motivo: despues
      ? `Os escribimos porque vuestra invitación${d.fecha ? ` del ${fechaLarga(d.fecha)}` : ""} se hizo con Invitoo. Son avisos del servicio que contratasteis.`
      : `Os escribimos porque estáis preparando vuestra invitación con Invitoo${cuando}. Son avisos del servicio que habéis contratado.`,
  };
}

function pieFidelizacion(d: DatosCorreo): Pie {
  return {
    tipo: "fidelizacion",
    preferencias: d.enlaces.preferencias,
    baja: d.enlaces.baja,
    motivo: "Os escribimos porque sois clientes de Invitoo. Solo os mandamos algo así de vez en cuando, y podéis dejar de recibirlo con un clic.",
  };
}

const nombres = (d: DatosCorreo) => pareja(d.pareja) || "vosotros";
/** «, Ana y Pablo» o nada: para los asuntos que nombran a la pareja (sin «Felicidades, vosotros»). */
const conNombres = (d: DatosCorreo, sep = ", ") => (pareja(d.pareja) ? `${sep}${pareja(d.pareja)}` : "");

/* ───────────────────────── 1 · Bienvenida ───────────────────────── */

/**
 * E3: la bienvenida es también la confirmación de la reserva cuando llega
 * tras pagar (`d.reserva`). Sustituye al antiguo «Vuestra invitación está
 * reservada» de `pagos/cobrar.ts`, con la misma información: plan e importe,
 * IVA y factura de Stripe (o «modo demo»), contacto en menos de un día
 * laborable para la videollamada, plazo desde la videollamada, cambios
 * ilimitados, condiciones y devolución. Lo que promete coincide con
 * /condiciones (no hay «borrador en 24 horas»).
 */
function bienvenida(d: DatosCorreo): Correo {
  const quien = pareja(d.pareja);
  const r = d.reserva ?? null;
  const bloques: Bloque[] = [
    { tipo: "p", destacado: true, texto: "Gracias por confiarnos algo tan vuestro. A partir de aquí, el diseño corre de nuestra cuenta." },
  ];
  if (r) {
    bloques.push({
      tipo: "nota",
      titulo: `Reserva confirmada${d.plan ? `: ${d.plan}` : ""} · ${euros(r.importe)}`,
      texto: r.demo ? "Modo demo: no se ha cobrado nada." : "IVA incluido. La factura os llega de Stripe en otro correo.",
    });
  } else if (d.plan) {
    bloques.push({ tipo: "nota", titulo: "Lo que habéis contratado", texto: d.plan });
  }
  bloques.push(
    { tipo: "p", texto: "Vosotros solo tenéis que contarnos cómo es vuestra boda. Así seguimos:" },
    {
      tipo: "pasos",
      items: [
        { titulo: "Os escribimos en menos de un día laborable", texto: "Por WhatsApp o por email, para fijar la videollamada de diseño. Son unos veinte minutos." },
        { titulo: "Nos contáis vuestra boda", texto: "Fecha, lugares, horarios y lo que queráis que sepan los invitados. También podéis ir rellenándolo desde el panel." },
        {
          titulo: r?.plazo ? `${r.plazo} desde la videollamada` : "Os enviamos el borrador",
          texto: "Con vuestros nombres y vuestra apertura. Cambios ilimitados hasta que la publiquéis.",
        },
      ],
    },
  );
  const condiciones = r?.condiciones
    ? `Condiciones: ${r.condiciones.replace(/^https?:\/\//, "")}. Hasta que empecemos el diseño, si cambiáis de idea, os devolvemos el importe entero.`
    : null;
  return componer({
    asunto: `${r?.demo ? "[Demo] " : ""}${quien ? `Bienvenidos, ${quien}: ` : "Bienvenidos: "}${r ? "vuestra invitación está reservada" : "empezamos vuestra invitación"}`,
    preheader: r ? "Os escribimos en menos de un día laborable para fijar la videollamada de diseño." : "Así seguimos: una videollamada corta y, después, vuestro primer borrador.",
    antetitulo: r ? "Reserva confirmada" : "Bienvenidos",
    titulo: quien ? `${quien}, empezamos` : "Empezamos",
    bloques,
    // Recién pagado todavía no hay panel con vuestra boda: el botón lleva a hablar con nosotros.
    cta: r?.whatsapp && !d.slug ? { texto: "Escribirnos por WhatsApp", url: r.whatsapp } : { texto: "Entrar en vuestro panel", url: d.enlaces.panel },
    posdata: [condiciones, "¿Alguna duda? Responded a este correo: lo leemos nosotros."].filter(Boolean).join(" "),
    firma: true,
    pie: pieServicio(d),
    origen: origen(d),
  });
}

/* ───────────────────────── 2 · Completar datos ───────────────────────── */

function completarDatos(d: DatosCorreo): Correo {
  const faltanDatos = d.pendientes ? d.pendientes.datos : true;
  const soloDiseno = d.pendientes ? !d.pendientes.datos && d.pendientes.diseno : false;
  const bloques: Bloque[] = soloDiseno
    ? [
        { tipo: "p", destacado: true, texto: "Vuestro borrador ya está listo y os está esperando." },
        { tipo: "p", texto: "Echadle un vistazo con calma. Si algo no os convence, pedid el cambio desde el panel; si os encanta, aprobadlo y la publicamos." },
      ]
    : [
        { tipo: "p", destacado: true, texto: "Os falta muy poco para ver vuestra invitación con vuestros nombres." },
        { tipo: "p", texto: "En cuanto tengamos estos datos nos ponemos con el diseño:" },
        { tipo: "lista", items: ["La fecha y la hora de la ceremonia.", "Los lugares (ceremonia y celebración).", "La fecha límite para confirmar, si ya la tenéis."] },
        { tipo: "p", texto: "Lo demás (autobús, alojamiento, regalo…) lo podéis añadir cuando queráis." },
      ];
  return componer({
    asunto: soloDiseno ? "Vuestro borrador os espera" : "Vuestra invitación os espera (os falta muy poco)",
    preheader: soloDiseno ? "Miradlo con calma y decidnos si lo publicamos o lo retocamos." : "Diez minutos desde el móvil y nos ponemos con el diseño.",
    antetitulo: faltanDatos ? "Un paso más" : "Vuestro borrador",
    titulo: soloDiseno ? "¿Lo publicamos?" : "Contadnos lo esencial",
    bloques,
    cta: { texto: soloDiseno ? "Ver el borrador" : "Completar los datos", url: d.enlaces.panel },
    posdata: "Si ya lo habéis hecho, no hagáis caso a este correo: a veces nos cruzamos.",
    firma: true,
    pie: pieServicio(d),
    origen: origen(d),
  });
}

/* ───────────────────────── 3 · Publicada ───────────────────────── */

function publicada(d: DatosCorreo): Correo {
  return componer({
    asunto: "Ya está publicada: así la enviáis por WhatsApp",
    preheader: "Cada invitado tiene su enlace, con su nombre en el sobre.",
    antetitulo: "Publicada",
    titulo: "Vuestra invitación ya se puede abrir",
    bloques: [
      { tipo: "p", destacado: true, texto: "En el panel, en Invitados, cada persona tiene su enlace personal: al abrirlo verá su nombre en el sobre y podrá confirmar en dos toques." },
      { tipo: "seccion", texto: "Algunos consejos" },
      {
        tipo: "lista",
        items: [
          "Enviadla desde el panel: el mensaje de WhatsApp ya va escrito, solo tenéis que pulsar enviar.",
          "Mejor por familias o de una en una que en un grupo: se siente más vuestra y nadie se pierde en el chat.",
          "Entre semana, por la tarde, es cuando más se abre y se responde.",
          "Si aún no tenéis fecha límite para confirmar, unas tres o cuatro semanas antes de la boda es lo habitual. Os avisaremos cuando se acerque.",
          "No hace falta instalar nada: la abuela la abre sola.",
        ],
      },
    ],
    cta: { texto: "Enviar desde el panel", url: d.enlaces.panel },
    posdata: `Vuestra invitación: ${d.enlaces.invitacion.replace(/^https?:\/\//, "")}`,
    firma: true,
    pie: pieServicio(d),
    origen: origen(d),
  });
}

/* ───────────────────────── 4 · Resumen de confirmaciones ───────────────────────── */

function rsvpResumen(d: DatosCorreo): Correo {
  const c = d.cifras ?? { aperturas: 0, respuestas: 0, vienen: 0, noVienen: 0 };
  const nuevas = c.nuevas ?? 0;
  const bloques: Bloque[] = [
    {
      tipo: "p",
      destacado: true,
      texto: nuevas > 0 ? `Esta semana han llegado ${plural(nuevas, "respuesta nueva", "respuestas nuevas")}.` : "Así van vuestras confirmaciones.",
    },
    {
      tipo: "cifras",
      items: [
        { valor: num(c.vienen), etiqueta: "vienen", nota: c.personas ? plural(c.personas, "persona", "personas") : undefined },
        { valor: num(c.noVienen), etiqueta: "no pueden" },
        { valor: num(c.aperturas), etiqueta: "aperturas" },
      ],
    },
  ];
  if (c.fechaLimite) {
    bloques.push({
      tipo: "nota",
      titulo: `Fecha límite: ${fechaLarga(c.fechaLimite, true)}`,
      texto:
        c.diasHastaLimite != null && c.diasHastaLimite > 0
          ? `Faltan ${plural(c.diasHastaLimite, "día", "días")}. Unos días antes os avisamos de quién falta por responder.`
          : "Unos días antes os avisamos de quién falta por responder.",
    });
  }
  return componer({
    asunto: nuevas > 0 ? `${plural(nuevas, "confirmación nueva", "confirmaciones nuevas")} esta semana` : "Así van vuestras confirmaciones",
    preheader: `${num(c.vienen)} ${c.vienen === 1 ? "invitado dice" : "invitados dicen"} que sí, ${plural(c.respuestas, "respuesta", "respuestas")} en total.`,
    antetitulo: "Confirmaciones",
    titulo: "Vuestra semana en Invitoo",
    bloques,
    cta: { texto: "Ver quién ha respondido", url: d.enlaces.panel },
    posdata: "Os escribimos una vez por semana mientras la confirmación esté abierta.",
    pie: pieServicio(d),
    origen: origen(d),
  });
}

/* ───────────────────────── 5 · Fecha límite ───────────────────────── */

function rsvpFechaLimite(d: DatosCorreo): Correo {
  const c = d.cifras ?? { aperturas: 0, respuestas: 0, vienen: 0, noVienen: 0 };
  const dias = c.diasHastaLimite ?? 5;
  const cuando = c.fechaLimite ? `el ${fechaLarga(c.fechaLimite, true)}` : `en ${plural(dias, "día", "días")}`;
  return componer({
    asunto: `Faltan ${plural(dias, "día", "días")} para cerrar las confirmaciones`,
    preheader: "Desde el panel podéis recordárselo solo a quien aún no ha respondido.",
    antetitulo: `Faltan ${plural(dias, "día", "días")}`,
    titulo: "La confirmación cierra pronto",
    bloques: [
      { tipo: "p", destacado: true, texto: `La confirmación se cierra ${cuando}. Hasta ahora han respondido ${plural(c.respuestas, "invitado", "invitados")}.` },
      {
        tipo: "p",
        texto: "En Invitados podéis ver quién falta y mandarle un recordatorio con un toque. Un mensaje cariñoso y corto basta; nadie quiere sentirse perseguido.",
      },
      { tipo: "nota", titulo: "Una idea para el mensaje", texto: "«¡Hola! Estamos cerrando la lista para la boda. ¿Nos dices si te esperamos? Te dejamos aquí tu invitación.»" },
    ],
    cta: { texto: "Ver quién falta", url: d.enlaces.panel },
    pie: pieServicio(d),
    origen: origen(d),
  });
}

/* ───────────────────────── 6–8 · Cuenta atrás ───────────────────────── */

const NO_PLANNER = "Del resto ya os ocupáis vosotros (y quien os ayude). Nosotros, de que la invitación funcione.";

function faltan30(d: DatosCorreo): Correo {
  return componer({
    asunto: "Queda un mes: tres detalles de Invitoo para el gran día",
    preheader: "El QR de En directo, el Libro de buenos deseos y vuestra lista, en diez minutos.",
    antetitulo: "Faltan 30 días",
    titulo: "Un mes. Qué bonito suena",
    bloques: [
      { tipo: "p", destacado: true, texto: "Solo tres cosas de Invitoo, para que el día llegue todo a punto:" },
      {
        tipo: "pasos",
        items: [
          { titulo: "Repasad la invitación", texto: "Horarios, ubicaciones y autobús: si algo ha cambiado, se actualiza para todos al momento." },
          { titulo: "Preparad el QR de En directo", texto: "Para que vuestros invitados suban sus fotos a la pantalla y al álbum." },
          { titulo: "Activad el Libro de buenos deseos", texto: "Con su propio QR, para que nadie se quede sin dejar el suyo." },
        ],
      },
      { tipo: "p", texto: NO_PLANNER },
    ],
    cta: { texto: "Repasar en el panel", url: d.enlaces.panel },
    pie: pieServicio(d),
    origen: origen(d),
  });
}

function faltan7(d: DatosCorreo): Correo {
  return componer({
    asunto: "Una semana: las tarjetas QR, listas para imprimir",
    preheader: "Imprimidlas con calma y probad la pantalla del salón antes del día.",
    antetitulo: "Faltan 7 días",
    titulo: "Siete días y contando",
    bloques: [
      { tipo: "p", destacado: true, texto: "Esta semana, lo de Invitoo cabe en un café:" },
      {
        tipo: "lista",
        items: [
          "Descargad las tarjetas QR (En directo y Libro de buenos deseos) y dádselas a quien monte las mesas.",
          "Si tenéis pantalla En directo, probadla en la TV o el proyector del lugar: basta con abrir el enlace.",
          "Mirad la lista final de confirmados y alergias; se imprime desde Invitados.",
        ],
      },
      { tipo: "p", texto: NO_PLANNER },
    ],
    cta: { texto: "Descargar las tarjetas QR", url: d.enlaces.directo ?? d.enlaces.panel },
    pie: pieServicio(d),
    origen: origen(d),
  });
}

function faltan1(d: DatosCorreo): Correo {
  return componer({
    asunto: `Mañana es el día${conNombres(d)}. Solo disfrutad`,
    preheader: "Las fotos y los deseos de vuestros invitados se guardarán solos.",
    antetitulo: "Mañana",
    titulo: "Solo disfrutad",
    bloques: [
      { tipo: "p", destacado: true, texto: "Mañana no tenéis que hacer nada con Invitoo." },
      { tipo: "p", texto: "Las fotos irán llegando a En directo, los deseos al Libro y todo quedará guardado para después. Si algo falla con la pantalla, responded a este correo." },
      { tipo: "p", texto: "Un abrazo enorme. Que sea precioso." },
    ],
    cta: { texto: "Abrir En directo", url: d.enlaces.directo ?? d.enlaces.invitacion },
    firma: true,
    pie: pieServicio(d),
    origen: origen(d),
  });
}

/* ───────────────────────── 9 · Gracias ───────────────────────── */

function gracias(d: DatosCorreo): Correo {
  const c = d.cifras;
  const bloques: Bloque[] = [
    { tipo: "p", destacado: true, texto: "Gracias por dejarnos ser una parte pequeña de vuestro día. Esperamos que fuera tal y como lo soñabais." },
  ];
  if (c && ((c.fotos ?? 0) > 0 || (c.deseos ?? 0) > 0)) {
    bloques.push({
      tipo: "cifras",
      items: [
        { valor: num(c.fotos), etiqueta: "fotos de vuestros invitados" },
        { valor: num(c.deseos), etiqueta: "buenos deseos" },
      ],
    });
  }
  bloques.push({
    tipo: "lista",
    items: [
      c?.albumCaduca
        ? `El álbum estará online hasta el ${fechaLarga(c.albumCaduca)}. Podéis descargarlo entero cuando queráis.`
        : "El álbum ya está listo. Podéis descargarlo entero cuando queráis.",
      "Vuestro Libro de buenos deseos está en el panel, en PDF, para imprimirlo o regalarlo.",
    ],
  });
  return componer({
    asunto: "Gracias por dejarnos ser parte de vuestra boda",
    preheader: c?.fotos ? `${plural(c.fotos, "foto", "fotos")} y ${plural(c.deseos ?? 0, "deseo", "deseos")} de vuestros invitados, guardados para vosotros.` : "Vuestro álbum y vuestro Libro de buenos deseos ya os esperan.",
    antetitulo: "Gracias",
    titulo: "Qué día tan bonito",
    bloques,
    cta: { texto: "Ver vuestro álbum", url: d.enlaces.album },
    firma: true,
    pie: pieServicio(d),
    origen: origen(d),
  });
}

/* ───────────────────────── 10 · Reseña + recomendación ───────────────────────── */

function resena(d: DatosCorreo): Correo {
  const bloques: Bloque[] = [
    { tipo: "p", destacado: true, texto: "Ha pasado un mes. Esperamos que sigáis con la sonrisa puesta." },
    {
      tipo: "p",
      texto: "Si la invitación os hizo las cosas más fáciles, ¿nos dejáis una reseña? Son dos minutos y es como nos encuentran otras parejas. Si algo no fue bien, contádnoslo también: respondiendo a este correo nos llega a nosotros.",
    },
  ];
  if (d.codigoAmigos) {
    bloques.push({
      tipo: "nota",
      titulo: "¿Conocéis a alguien que se casa?",
      texto: `Con vuestro código tienen ${DESCUENTO_AMIGOS} € de descuento en su invitación.`,
      codigo: d.codigoAmigos,
    });
  }
  return componer({
    asunto: "¿Nos contáis qué tal fue? (dos minutos)",
    preheader: d.codigoAmigos ? `Y un regalo para vuestros amigos que se casan: ${DESCUENTO_AMIGOS} € con vuestro código.` : "Vuestra opinión ayuda a otras parejas a decidir.",
    antetitulo: "Un mes después",
    titulo: "¿Qué tal fue?",
    bloques,
    cta: { texto: "Dejar una reseña", url: d.enlaces.resena ?? d.enlaces.panel },
    firma: true,
    pie: pieFidelizacion(d),
    origen: origen(d),
  });
}

/* ───────────────────────── 11 · Aniversario ───────────────────────── */

function aniversario(d: DatosCorreo): Correo {
  const caduca = d.cifras?.albumCaduca ?? null;
  const hoy = d.fecha ? sumarDias(d.fecha, 365) : null;
  const sigueOnline = Boolean(caduca && hoy && caduca > hoy);
  const bloques: Bloque[] = [
    { tipo: "p", destacado: true, texto: "Hoy hace un año que dijisteis «sí». Desde el estudio os mandamos un abrazo enorme." },
  ];
  if (d.recuerdo?.texto) bloques.push({ tipo: "cita", texto: d.recuerdo.texto, autor: d.recuerdo.autor ?? null });
  bloques.push({
    tipo: "p",
    texto: sigueOnline
      ? `Vuestro álbum sigue online hasta el ${fechaLarga(caduca)}. Si queréis conservarlo un año más, son ${PRECIO_CONSERVAR} € desde el panel; si no, acordaos de descargarlo antes.`
      : "Hoy es un buen día para volver a ver las fotos de aquel día.",
  });
  return componer({
    asunto: `Hoy hace un año. Felicidades${conNombres(d)}`,
    preheader: sigueOnline ? "Volved a ver las fotos de aquel día. Y, si queréis, las guardamos un año más." : "Volved a ver las fotos de aquel día.",
    antetitulo: "Un año",
    titulo: "Feliz aniversario",
    bloques,
    cta: { texto: "Volver a ver el álbum", url: d.enlaces.album },
    firma: true,
    pie: pieFidelizacion(d),
    origen: origen(d),
  });
}

/* ───────────────────────── 12 · El álbum caduca ───────────────────────── */

function albumCaduca(d: DatosCorreo): Correo {
  const caduca = d.cifras?.albumCaduca ?? null;
  const cuando = caduca ? `el ${fechaLarga(caduca)}` : "dentro de 30 días";
  return componer({
    asunto: caduca ? `Vuestro álbum se borra el ${fechaLarga(caduca, true)}: descargadlo` : "Quedan 30 días para descargar vuestro álbum",
    preheader: "Un ZIP con todas las fotos, los vídeos y el Libro de buenos deseos, desde el panel.",
    antetitulo: "Aviso importante",
    titulo: "Guardad vuestras fotos",
    bloques: [
      { tipo: "p", destacado: true, texto: `Vuestro álbum de la boda se borrará ${cuando}, como os contamos al contratar.` },
      {
        tipo: "lista",
        items: [
          "Descargadlo entero en un ZIP desde el panel: fotos, vídeos y el Libro de buenos deseos.",
          "Si necesitáis más tiempo, en el panel podéis ampliar el plazo antes de esa fecha.",
        ],
      },
      { tipo: "p", texto: "Después de esa fecha no podremos recuperarlo." },
    ],
    cta: { texto: "Descargar el álbum", url: d.enlaces.album },
    pie: pieServicio(d),
    origen: origen(d),
  });
}

export const PLANTILLAS_NOVIOS: Record<IdNovios, (d: DatosCorreo) => Correo> = {
  bienvenida,
  "completar-datos": completarDatos,
  publicada,
  "rsvp-resumen": rsvpResumen,
  "rsvp-fecha-limite": rsvpFechaLimite,
  "faltan-30": faltan30,
  "faltan-7": faltan7,
  "faltan-1": faltan1,
  gracias,
  resena,
  aniversario,
  "album-caduca": albumCaduca,
};

/** Asunto B para las pruebas A/B (mismo cuerpo y preheader). */
export const ASUNTOS_B_NOVIOS: Record<IdNovios, (d: DatosCorreo) => string> = {
  bienvenida: () => "Ya estáis dentro. Esto es lo que viene ahora",
  "completar-datos": () => "Un último empujón y la vemos con vuestros nombres",
  publicada: (d) => (pareja(d.pareja) ? `${nombres(d)}, vuestra invitación ya se puede abrir` : "Vuestra invitación ya se puede abrir"),
  "rsvp-resumen": (d) => `Ya son ${num(d.cifras?.vienen ?? 0)} los que vienen a vuestra boda`,
  "rsvp-fecha-limite": () => "¿Quién falta por responder? Un recordatorio amable",
  "faltan-30": () => "30 días. Lo de Invitoo, a punto en diez minutos",
  "faltan-7": (d) => (pareja(d.pareja) ? `${nombres(d)}: siete días y contando` : "Siete días y contando"),
  "faltan-1": () => "Todo listo para mañana",
  gracias: () => "Vuestro álbum y vuestro Libro de buenos deseos ya os esperan",
  resena: () => "Vuestra opinión ayuda a otras parejas a decidir",
  aniversario: () => "Un año de vuestro «sí»",
  "album-caduca": () => "Quedan 30 días para descargar las fotos de vuestra boda",
};
