/**
 * Correos internos al estudio (Rodrigo): directos y escaneables.
 * Cifras primero, tendencias con flecha y texto (nunca solo color) y un único
 * botón a /estudio/visitas o a la ficha relacionada.
 */
import type { Correo, DatosCorreo, DatosEstudio, IdEstudio, Tendencia } from "../tipos.ts";
import { componer, euros, fechaLarga, num, origenDe, plural, tendencia, type Bloque, type Composicion } from "./base.ts";

const T0: Tendencia = { actual: 0, anterior: 0 };

export const ESTUDIO_VACIO: DatosEstudio = {
  desde: "",
  hasta: "",
  web: {
    paginas: T0,
    visitantes: T0,
    reservarClics: T0,
    whatsappClics: T0,
    checkoutsIniciados: T0,
    checkoutsPagados: T0,
    paginasTop: [],
    plantillasTop: [],
    origenes: [],
  },
  invitaciones: { aperturas: T0, rsvp: T0, fotos: T0, bodas: [] },
  enlaceVisitas: "https://invitoo.es/estudio/visitas",
  enlaceEstudio: "https://invitoo.es/estudio",
};

const est = (d: DatosCorreo) => d.estudio ?? ESTUDIO_VACIO;
const origen = (e: DatosEstudio) => origenDe(e.enlaceVisitas, e.enlaceEstudio);
const ajustes = (e: DatosEstudio) => `${origen(e)}/estudio/correos`;

function base(e: DatosEstudio, c: Omit<Composicion, "pie" | "origen" | "interno">): Correo {
  return componer({ ...c, pie: { tipo: "estudio", ajustes: ajustes(e) }, origen: origen(e), interno: true });
}

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)} %` : "—");
const filas = (xs: { clave: string; vistas: number }[], n = 5): [string, string][] => xs.slice(0, n).map((x) => [x.clave, num(x.vistas)]);

/** «12 → 15 (▲ 25 %)». */
const conTendencia = (t: Tendencia, frente: string) => `${tendencia(t)} ${frente}`;

/* ───────────────────────── Diario ───────────────────────── */

function diario(d: DatosCorreo): Correo {
  const e = est(d);
  const w = e.web;
  const i = e.invitaciones;
  const dia = fechaLarga(e.hasta || e.desde, true);
  const bloques: Bloque[] = [
    {
      tipo: "cifras",
      items: [
        { valor: num(w.paginas.actual), etiqueta: "páginas vistas", nota: conTendencia(w.paginas, "vs. anteayer") },
        { valor: num(w.visitantes.actual), etiqueta: "visitantes", nota: conTendencia(w.visitantes, "vs. anteayer") },
        { valor: num(w.checkoutsPagados.actual), etiqueta: "pagos", nota: `de ${num(w.checkoutsIniciados.actual)} iniciados` },
      ],
    },
    {
      tipo: "tabla",
      titulo: "Intención",
      filas: [
        ["Clics en «Reservar»", num(w.reservarClics.actual)],
        ["Clics en WhatsApp", num(w.whatsappClics.actual)],
        ["Checkouts iniciados", num(w.checkoutsIniciados.actual)],
      ],
    },
    {
      tipo: "tabla",
      titulo: "Invitaciones",
      filas: [
        ["Aperturas", num(i.aperturas.actual)],
        ["Confirmaciones nuevas", num(i.rsvp.actual)],
        ["Fotos subidas", num(i.fotos.actual)],
      ],
    },
    { tipo: "tabla", titulo: "Páginas más vistas", filas: filas(w.paginasTop, 3), vacio: "Sin visitas" },
    { tipo: "tabla", titulo: "De dónde vienen", filas: filas(w.origenes, 3), vacio: "Directo o sin referer" },
  ];
  if (i.bodas.length) {
    bloques.push({
      tipo: "tabla",
      titulo: "Bodas con movimiento",
      filas: i.bodas.slice(0, 3).map((b) => [b.pareja || b.slug, `${num(b.aperturas)} ap. · ${num(b.rsvp)} RSVP`]),
    });
  }
  return base(e, {
    asunto: `Ayer en Invitoo: ${plural(w.paginas.actual, "visita", "visitas")} · ${plural(w.checkoutsPagados.actual, "pago", "pagos")} · ${num(i.rsvp.actual)} RSVP`,
    preheader: `${num(w.visitantes.actual)} visitantes (${tendencia(w.visitantes)}), ${num(w.reservarClics.actual)} clics en Reservar y ${num(w.whatsappClics.actual)} en WhatsApp.`,
    antetitulo: dia ? `Resumen del ${dia}` : "Resumen diario",
    titulo: "Así fue ayer",
    bloques,
    cta: { texto: "Ver visitas", url: e.enlaceVisitas },
  });
}

/* ───────────────────────── Semanal ───────────────────────── */

function semanal(d: DatosCorreo): Correo {
  const e = est(d);
  const w = e.web;
  const i = e.invitaciones;
  const vs = "vs. semana anterior";
  const bloques: Bloque[] = [
    {
      tipo: "cifras",
      items: [
        { valor: num(w.paginas.actual), etiqueta: "páginas vistas", nota: conTendencia(w.paginas, vs) },
        { valor: num(w.visitantes.actual), etiqueta: "visitantes", nota: conTendencia(w.visitantes, vs) },
        { valor: num(w.checkoutsPagados.actual), etiqueta: "pagos", nota: conTendencia(w.checkoutsPagados, vs) },
      ],
    },
    {
      tipo: "tabla",
      titulo: "Embudo de la semana",
      filas: [
        ["Visitantes", num(w.visitantes.actual)],
        ["Clics en «Reservar»", `${num(w.reservarClics.actual)} · ${pct(w.reservarClics.actual, w.visitantes.actual)}`],
        ["Clics en WhatsApp", `${num(w.whatsappClics.actual)} · ${pct(w.whatsappClics.actual, w.visitantes.actual)}`],
        ["Checkouts iniciados", `${num(w.checkoutsIniciados.actual)} · ${pct(w.checkoutsIniciados.actual, w.reservarClics.actual)}`],
        ["Pagados", `${num(w.checkoutsPagados.actual)} · ${pct(w.checkoutsPagados.actual, w.checkoutsIniciados.actual)}`],
      ],
    },
  ];
  if (w.porDia?.length) {
    bloques.push({
      tipo: "barras",
      titulo: "Visitantes por día",
      filas: w.porDia.map((p) => {
        const dt = new Date(`${p.dia}T12:00:00Z`);
        const nombre = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][dt.getUTCDay()] ?? p.dia;
        return { etiqueta: `${nombre} ${dt.getUTCDate()}`, valor: p.visitantes };
      }),
    });
  }
  bloques.push(
    {
      tipo: "tabla",
      titulo: "Invitaciones",
      filas: [
        ["Aperturas", `${num(i.aperturas.actual)} · ${tendencia(i.aperturas)}`],
        ["Confirmaciones", `${num(i.rsvp.actual)} · ${tendencia(i.rsvp)}`],
        ["Fotos subidas", `${num(i.fotos.actual)} · ${tendencia(i.fotos)}`],
      ],
    },
    { tipo: "tabla", titulo: "Plantillas más vistas", filas: filas(w.plantillasTop), vacio: "Sin datos" },
    { tipo: "tabla", titulo: "Páginas más vistas", filas: filas(w.paginasTop), vacio: "Sin visitas" },
    { tipo: "tabla", titulo: "De dónde vienen", filas: filas(w.origenes), vacio: "Directo o sin referer" },
  );
  if (i.bodas.length) {
    bloques.push({
      tipo: "tabla",
      titulo: "Bodas con más movimiento",
      filas: i.bodas.slice(0, 5).map((b) => [b.pareja || b.slug, `${num(b.aperturas)} ap. · ${num(b.rsvp)} RSVP · ${num(b.fotos)} fotos`]),
    });
  }
  const rango = e.desde && e.hasta ? `${fechaLarga(e.desde, true)} – ${fechaLarga(e.hasta, true)}` : "";
  return base(e, {
    asunto: `Semana en Invitoo: ${plural(w.visitantes.actual, "visitante", "visitantes")} (${tendencia(w.visitantes)}) · ${plural(w.checkoutsPagados.actual, "pago", "pagos")}`,
    preheader: `Páginas ${tendencia(w.paginas)}, Reservar ${tendencia(w.reservarClics)}, aperturas de invitaciones ${tendencia(i.aperturas)}.`,
    antetitulo: rango ? `Semana del ${rango}` : "Resumen semanal",
    titulo: "Tu semana, Rodrigo",
    bloques,
    cta: { texto: "Ver visitas", url: e.enlaceVisitas },
  });
}

/* ───────────────────────── Alertas ───────────────────────── */

function filasAlerta(e: DatosEstudio): [string, string][] {
  const a = e.alerta;
  const f: [string, string][] = [];
  if (a?.boda) f.push(["Pareja", a.boda.pareja || a.boda.slug]);
  if (a?.importe != null) f.push(["Importe", euros(a.importe)]);
  if (a?.boda?.slug) f.push(["Invitación", `/i/${a.boda.slug}`]);
  return f;
}

function alertaReserva(d: DatosCorreo): Correo {
  const e = est(d);
  const a = e.alerta;
  const quien = a?.boda?.pareja || "Nueva pareja";
  const bloques: Bloque[] = [{ tipo: "tabla", filas: filasAlerta(e) }];
  if (a?.detalle) bloques.push({ tipo: "p", texto: a.detalle });
  bloques.push({ tipo: "p", texto: "Les hemos dicho que les escribís en menos de un día laborable para fijar la videollamada de diseño." });
  // E3: el asunto sale de `alerta.titulo` («Reserva pagada: …» o «Reserva demo: …»): una demo no puede parecer dinero de verdad.
  return base(e, {
    asunto: `${a?.titulo ?? "Reserva pagada"} · ${quien}${a?.importe != null ? ` · ${euros(a.importe)}` : ""}`,
    preheader: a?.detalle ? a.detalle.slice(0, 90) : "Una pareja acaba de reservar su invitación.",
    antetitulo: "Alerta · Reserva",
    titulo: a?.titulo ?? "Nueva reserva pagada",
    bloques,
    cta: { texto: "Abrir en el estudio", url: e.enlaceEstudio },
  });
}

function alertaCobro(d: DatosCorreo): Correo {
  const e = est(d);
  const a = e.alerta;
  const quien = a?.boda?.pareja || "una boda";
  const bloques: Bloque[] = [{ tipo: "tabla", filas: filasAlerta(e) }];
  if (a?.detalle) bloques.push({ tipo: "p", texto: a.detalle });
  return base(e, {
    asunto: `${a?.titulo ?? "Cobro pagado"} · ${quien}${a?.importe != null ? ` · ${euros(a.importe)}` : ""}`,
    preheader: a?.detalle ? a.detalle.slice(0, 90) : "Ha entrado un cobro.",
    antetitulo: "Alerta · Cobro",
    titulo: a?.titulo ?? "Cobro pagado",
    bloques,
    cta: { texto: "Ver cobros", url: e.enlaceEstudio },
  });
}

function alertaCambio(d: DatosCorreo): Correo {
  const e = est(d);
  const a = e.alerta;
  const quien = a?.boda?.pareja || "Una pareja";
  const bloques: Bloque[] = [];
  if (a?.detalle) bloques.push({ tipo: "cita", texto: a.detalle, autor: a?.boda?.pareja ?? null });
  const f = filasAlerta(e);
  if (f.length) bloques.push({ tipo: "tabla", filas: f });
  return base(e, {
    asunto: `Solicitud de cambio · ${quien}`,
    preheader: a?.detalle ? a.detalle.slice(0, 90) : "Una pareja ha pedido un cambio en su invitación.",
    antetitulo: "Alerta · Solicitud",
    titulo: a?.titulo ?? `${quien} pide un cambio`,
    bloques,
    cta: { texto: "Ver la solicitud", url: e.enlaceEstudio },
  });
}

function alertaPico(d: DatosCorreo): Correo {
  const e = est(d);
  const p = e.alerta?.pico;
  const veces = p && p.media > 0 ? Math.round((p.vistas / p.media) * 10) / 10 : null;
  const bloques: Bloque[] = [
    {
      tipo: "cifras",
      items: [
        { valor: num(p?.vistas ?? 0), etiqueta: "vistas en la última hora" },
        { valor: veces != null ? `${num(veces)} veces` : "—", etiqueta: "la media por hora", nota: p ? `(media: ${num(p.media)})` : undefined },
      ],
    },
  ];
  const f: [string, string][] = [];
  if (p?.ruta) f.push(["Página", p.ruta]);
  if (e.web.origenes[0]) f.push(["Origen principal", `${e.web.origenes[0].clave} · ${num(e.web.origenes[0].vistas)}`]);
  if (f.length) bloques.push({ tipo: "tabla", filas: f });
  if (e.alerta?.detalle) bloques.push({ tipo: "p", texto: e.alerta.detalle });
  bloques.push({ tipo: "p", texto: "Buen momento para contestar rápido los WhatsApp y revisar que la web carga bien." });
  return base(e, {
    asunto: `Pico de visitas: ${num(p?.vistas ?? 0)} en la última hora${veces != null ? ` (${num(veces)} veces la media)` : ""}`,
    preheader: p?.ruta ? `Sobre todo en ${p.ruta}.` : "Más tráfico de lo normal ahora mismo.",
    antetitulo: "Alerta · Visitas",
    titulo: e.alerta?.titulo ?? "Hay más gente de lo normal",
    bloques,
    cta: { texto: "Ver visitas en directo", url: e.enlaceVisitas },
  });
}

export const PLANTILLAS_ESTUDIO: Record<IdEstudio, (d: DatosCorreo) => Correo> = {
  "estudio-diario": diario,
  "estudio-semanal": semanal,
  "alerta-reserva": alertaReserva,
  "alerta-cobro": alertaCobro,
  "alerta-cambio": alertaCambio,
  "alerta-pico": alertaPico,
};

export const ASUNTOS_B_ESTUDIO: Record<IdEstudio, (d: DatosCorreo) => string> = {
  "estudio-diario": (d) => `Ayer: ${num(est(d).web.visitantes.actual)} visitantes, ${num(est(d).web.reservarClics.actual)} clics en Reservar`,
  "estudio-semanal": (d) => `Tu lunes en cifras: ${tendencia(est(d).web.visitantes)} visitantes`,
  "alerta-reserva": (d) => `Nueva boda: ${est(d).alerta?.boda?.pareja ?? "reserva pagada"}`,
  "alerta-cobro": (d) => `Ha entrado un cobro${est(d).alerta?.importe != null ? ` de ${euros(est(d).alerta?.importe)}` : ""}`,
  "alerta-cambio": (d) => `${est(d).alerta?.boda?.pareja ?? "Una pareja"} pide un cambio`,
  "alerta-pico": () => "Ahora mismo hay más visitas de lo normal",
};
