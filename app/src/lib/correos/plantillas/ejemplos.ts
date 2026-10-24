/**
 * Datos de ejemplo para la galería /estudio/correos y las capturas de QA.
 * Pareja ficticia. Nada de aquí se envía.
 */
import type { DatosCorreo, DatosEstudio, IdCorreo } from "../tipos.ts";

export function datosEjemplo(id: IdCorreo, origen = "https://invitoo.es"): DatosCorreo {
  const o = origen.replace(/\/$/, "");
  const base: DatosCorreo = {
    pareja: { a: "Lucía", b: "Ignacio" },
    fecha: "2027-06-12",
    slug: "lucia-e-ignacio",
    enlaces: {
      panel: `${o}/novios/demo-lucia-e-ignacio`,
      invitacion: `${o}/i/lucia-e-ignacio`,
      album: `${o}/novios/demo-lucia-e-ignacio?tab=directo`,
      deseos: `${o}/novios/demo-lucia-e-ignacio?tab=deseos`,
      baja: `${o}/baja?t=ejemplo`,
      preferencias: `${o}/baja?t=ejemplo&ver=preferencias`,
      directo: `${o}/novios/demo-lucia-e-ignacio?tab=directo`,
      resena: "https://g.page/r/invitoo/review",
    },
    diasParaBoda: 30,
    codigoAmigos: "LUCIA-E-IGNACIO",
    plan: "Invitación Estudio · con En directo y Libro de buenos deseos",
    pendientes: { datos: true, diseno: true },
    cifras: {
      aperturas: 214,
      aperturasSemana: 41,
      respuestas: 96,
      vienen: 81,
      noVienen: 15,
      personas: 132,
      nuevas: 12,
      fotos: 1248,
      deseos: 87,
      fechaLimite: "2027-05-15",
      diasHastaLimite: 5,
      albumCaduca: "2028-06-12",
    },
    recuerdo: { texto: "Que vuestra casa tenga siempre la puerta abierta y la nevera llena. Os queremos.", autor: "Tía Carmen" },
  };
  // E3: la bienvenida tras pagar hace también de confirmación de la reserva.
  if (id === "bienvenida") base.reserva = { importe: 14900, demo: false, plazo: "Cinco días laborables", whatsapp: "https://wa.me/34600000000", condiciones: `${o}/condiciones` };
  if (id === "gracias") base.diasParaBoda = -1;
  if (id === "resena") base.diasParaBoda = -30;
  if (id === "aniversario" || id === "album-caduca") base.diasParaBoda = -335;
  if (id === "aniversario") base.cifras = { ...base.cifras!, albumCaduca: "2028-07-12" };
  if (id === "album-caduca") base.cifras = { ...base.cifras!, albumCaduca: "2028-06-12" };
  if (id.startsWith("estudio-") || id.startsWith("alerta-")) {
    return { ...base, pareja: { a: "", b: "" }, fecha: null, estudio: estudioEjemplo(id, o) };
  }
  return base;
}

function estudioEjemplo(id: IdCorreo, o: string): DatosEstudio {
  const semanal = id === "estudio-semanal";
  const k = semanal ? 7 : 1;
  const e: DatosEstudio = {
    desde: semanal ? "2026-10-19" : "2026-10-23",
    hasta: semanal ? "2026-10-25" : "2026-10-23",
    web: {
      paginas: { actual: 412 * k, anterior: 356 * k },
      visitantes: { actual: 168 * k, anterior: 171 * k },
      reservarClics: { actual: 14 * k, anterior: 9 * k },
      whatsappClics: { actual: 6 * k, anterior: 6 * k },
      checkoutsIniciados: { actual: 4 * k, anterior: 3 * k },
      checkoutsPagados: { actual: semanal ? 6 : 1, anterior: semanal ? 4 : 0 },
      paginasTop: [
        { clave: "/", vistas: 141 * k },
        { clave: "/plantillas", vistas: 96 * k },
        { clave: "/precios", vistas: 58 * k },
        { clave: "/invitaciones-de-boda-digitales/barcelona", vistas: 31 * k },
        { clave: "/preguntas", vistas: 22 * k },
      ],
      plantillasTop: [
        { clave: "Carta", vistas: 44 * k },
        { clave: "Olivar", vistas: 31 * k },
        { clave: "Constelación", vistas: 27 * k },
        { clave: "Azulejo", vistas: 19 * k },
        { clave: "Mar", vistas: 12 * k },
      ],
      origenes: [
        { clave: "instagram.com", vistas: 128 * k },
        { clave: "google", vistas: 97 * k },
        { clave: "utm: meta-relanzamiento", vistas: 61 * k },
        { clave: "bodas.net", vistas: 18 * k },
      ],
      porDia: semanal
        ? [
            { dia: "2026-10-19", paginas: 380, visitantes: 150 },
            { dia: "2026-10-20", paginas: 402, visitantes: 162 },
            { dia: "2026-10-21", paginas: 455, visitantes: 181 },
            { dia: "2026-10-22", paginas: 390, visitantes: 158 },
            { dia: "2026-10-23", paginas: 412, visitantes: 168 },
            { dia: "2026-10-24", paginas: 520, visitantes: 214 },
            { dia: "2026-10-25", paginas: 325, visitantes: 143 },
          ]
        : undefined,
    },
    invitaciones: {
      aperturas: { actual: 230 * k, anterior: 190 * k },
      rsvp: { actual: 19 * k, anterior: 22 * k },
      fotos: { actual: semanal ? 1310 : 0, anterior: semanal ? 640 : 0 },
      bodas: [
        { slug: "lucia-e-ignacio", pareja: "Lucía e Ignacio", aperturas: 41 * k, rsvp: 12 * k, fotos: 0 },
        { slug: "marta-y-joan", pareja: "Marta y Joan", aperturas: 33 * k, rsvp: 5 * k, fotos: semanal ? 1310 : 0 },
        { slug: "nerea-y-adrian", pareja: "Nerea y Adrián", aperturas: 18 * k, rsvp: 2 * k, fotos: 0 },
      ],
    },
    enlaceVisitas: `${o}/estudio/visitas`,
    enlaceEstudio: `${o}/estudio`,
  };
  if (id === "alerta-reserva") {
    e.alerta = { titulo: "Reserva pagada: Invitoo Estudio", detalle: "Plan Estudio con En directo. Boda el 12 de junio de 2027 en Sant Cugat.", importe: 14900, boda: { slug: "lucia-e-ignacio", pareja: "Lucía e Ignacio" } };
    e.enlaceEstudio = `${o}/estudio/solicitudes`;
  }
  if (id === "alerta-cobro") {
    e.alerta = { titulo: "Cobro pagado: Segundo pago (50 %)", detalle: "Cierra el pago de la invitación tras aprobar el diseño.", importe: 7450, boda: { slug: "marta-y-joan", pareja: "Marta y Joan" } };
    e.enlaceEstudio = `${o}/estudio/cobros`;
  }
  if (id === "alerta-cambio") {
    e.alerta = { titulo: "Marta y Joan piden un cambio", detalle: "¿Podéis cambiar la hora del autobús de vuelta a las 2:30? Y poner el menú infantil.", boda: { slug: "marta-y-joan", pareja: "Marta y Joan" } };
    e.enlaceEstudio = `${o}/estudio/solicitudes`;
  }
  if (id === "alerta-pico") {
    e.alerta = { titulo: "Hay más gente de lo normal", pico: { vistas: 186, media: 24, ruta: "/plantillas/carta" } };
  }
  return e;
}
