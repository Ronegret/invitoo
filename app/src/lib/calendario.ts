import { aIcsLocal, aIcsUtc, aMadridISO, horaDelDia, ZONA } from "@/lib/fecha";
import type { Invitacion } from "@/lib/tipos";

/**
 * «Añadir al calendario».
 *
 * Dos salidas:
 *  · `generarIcs(inv)` → el .ics que sirve `/i/[slug]/calendario`
 *    (RFC 5545, horas locales con `TZID=Europe/Madrid` + VTIMEZONE, y un
 *    aviso el día antes). Vale para iPhone, Android y Outlook de escritorio.
 *  · `enlacesCalendario(inv)` → Google Calendar y Outlook web, para quien no
 *    sabe qué hacer con un archivo descargado.
 *
 * Sin dependencias de servidor: también se puede usar en un componente.
 */

export type Evento = {
  titulo: string;
  inicio: string; // ISO con zona
  fin: string; // ISO con zona
  lugar: string;
  descripcion: string;
};

const HORA = 3_600_000;

/** Un evento por parada del itinerario (o uno solo si no hay itinerario). */
export function eventosDeLaBoda(inv: Invitacion): Evento[] {
  const pareja = `${inv.pareja.a} y ${inv.pareja.b}`;
  const itinerario = inv.bloques.find((b) => b.t === "itinerario");
  const paradas = itinerario && itinerario.t === "itinerario" ? itinerario.paradas : [];

  if (paradas.length === 0) {
    const ini = new Date(inv.pareja.fecha);
    return [
      {
        titulo: `Boda de ${pareja}`,
        inicio: aMadridISO(ini),
        fin: aMadridISO(new Date(ini.getTime() + 6 * HORA)),
        lugar: "",
        descripcion: `La boda de ${pareja}.`,
      },
    ];
  }

  const inicios = paradas.map((p) => new Date(horaDelDia(inv.pareja.fecha, p.hora)));
  return paradas.map((p, i) => {
    const ini = inicios[i];
    const siguiente = inicios[i + 1];
    // Hasta la siguiente parada; la última, cinco horas (la fiesta).
    const fin =
      siguiente && siguiente.getTime() > ini.getTime()
        ? siguiente
        : new Date(ini.getTime() + (i === paradas.length - 1 && i > 0 ? 5 : 1.5) * HORA);
    return {
      titulo: `${p.titulo} · Boda de ${pareja}`,
      inicio: aMadridISO(ini),
      fin: aMadridISO(fin),
      lugar: [p.lugar, p.direccion].filter(Boolean).join(", "),
      descripcion: [p.titulo, p.lugar, p.direccion, p.mapa].filter(Boolean).join("\n"),
    };
  });
}

// ───────────────────────────────────────────────────────────────────── .ics

const esc = (t: string) =>
  t.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");

/** Pliega líneas a 75 octetos, como pide RFC 5545 §3.1, sin partir un carácter. */
function plegar(linea: string): string {
  const cod = new TextEncoder();
  const trozos: string[] = [];
  let actual = "";
  let bytes = 0;
  for (const ch of linea) {
    const n = cod.encode(ch).length;
    const limite = trozos.length === 0 ? 75 : 74; // el espacio inicial cuenta
    if (bytes + n > limite) {
      trozos.push(actual);
      actual = "";
      bytes = 0;
    }
    actual += ch;
    bytes += n;
  }
  trozos.push(actual);
  return trozos.join("\r\n ");
}

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${ZONA}`,
  "X-LIC-LOCATION:Europe/Madrid",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function generarIcs(inv: Invitacion, url?: string): string {
  const ahora = aIcsUtc(new Date());
  const eventos = eventosDeLaBoda(inv);
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Invitoo//Invitaciones//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`Boda de ${inv.pareja.a} y ${inv.pareja.b}`)}`,
    `X-WR-TIMEZONE:${ZONA}`,
    ...VTIMEZONE,
  ];
  eventos.forEach((e, i) => {
    lineas.push(
      "BEGIN:VEVENT",
      `UID:${inv.slug}-${i}@invitoo.es`,
      `DTSTAMP:${ahora}`,
      `DTSTART;TZID=${ZONA}:${aIcsLocal(e.inicio)}`,
      `DTEND;TZID=${ZONA}:${aIcsLocal(e.fin)}`,
      `SUMMARY:${esc(e.titulo)}`,
    );
    if (e.lugar) lineas.push(`LOCATION:${esc(e.lugar)}`);
    lineas.push(`DESCRIPTION:${esc(e.descripcion + (url ? `\n${url}` : ""))}`);
    if (url) lineas.push(`URL:${url}`);
    // Un solo aviso, en el primer evento: tres alarmas para una boda molestan.
    if (i === 0) {
      lineas.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "TRIGGER:-P1D",
        `DESCRIPTION:${esc(`Mañana es la boda de ${inv.pareja.a} y ${inv.pareja.b}`)}`,
        "END:VALARM",
      );
    }
    lineas.push("END:VEVENT");
  });
  lineas.push("END:VCALENDAR");
  return lineas.map(plegar).join("\r\n") + "\r\n";
}

// ──────────────────────────────────────────────────────── Google y Outlook

/**
 * Enlaces para la boda entera (de la primera parada al final de la última).
 * `ics` es la ruta relativa del .ics propio.
 */
export function enlacesCalendario(inv: Invitacion): {
  google: string;
  outlook: string;
  ics: string;
} {
  const eventos = eventosDeLaBoda(inv);
  const ini = eventos[0].inicio;
  const fin = eventos[eventos.length - 1].fin;
  const titulo = `Boda de ${inv.pareja.a} y ${inv.pareja.b}`;
  const lugar = eventos[0].lugar;
  const detalle = eventos.map((e) => e.descripcion.split("\n").slice(0, 2).join(" · ")).join("\n");

  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", titulo);
  google.searchParams.set("dates", `${aIcsLocal(ini)}/${aIcsLocal(fin)}`);
  google.searchParams.set("ctz", ZONA);
  if (lugar) google.searchParams.set("location", lugar);
  google.searchParams.set("details", detalle);

  const outlook = new URL("https://outlook.live.com/calendar/0/action/compose");
  outlook.searchParams.set("path", "/calendar/action/compose");
  outlook.searchParams.set("rru", "addevent");
  outlook.searchParams.set("subject", titulo);
  outlook.searchParams.set("startdt", ini);
  outlook.searchParams.set("enddt", fin);
  if (lugar) outlook.searchParams.set("location", lugar);
  outlook.searchParams.set("body", detalle);

  return { google: google.toString(), outlook: outlook.toString(), ics: `/i/${inv.slug}/calendario` };
}
