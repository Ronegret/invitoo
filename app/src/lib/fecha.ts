/**
 * Fechas y horas, siempre en hora de Madrid.
 *
 * El servidor corre en UTC (Vercel) y el navegador del estudio puede estar en
 * cualquier sitio. Si se formatea o se compone una hora sin decir la zona, la
 * misa de las 12:30 sale a las 10:30 en el .ics o a las 11:30 en el editor.
 * Por eso aquí NADA usa la zona del proceso: todo pasa por `Europe/Madrid`.
 *
 * Sirve en servidor y en cliente (no importa nada de Node).
 *
 * Conceptos:
 *  · «instante»: un ISO con zona (`2027-03-30T10:30:00.000Z` o `…+02:00`).
 *    Es lo que se guarda en la columna `fecha` (timestamptz).
 *  · «hora local»: lo que se ve en Madrid, `2027-03-30T12:30`. Es lo que
 *    enseña y devuelve un `<input type="datetime-local">`.
 */

export const ZONA = "Europe/Madrid";

type Partes = {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
};

const partesFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONA,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function aDate(fecha: string | Date) {
  return fecha instanceof Date ? fecha : new Date(fecha);
}

/** Año, mes, día, hora… tal como se ven en Madrid en ese instante. */
export function partesMadrid(fecha: string | Date): Partes {
  const p: Record<string, number> = {};
  for (const { type, value } of partesFmt.formatToParts(aDate(fecha))) {
    if (type !== "literal") p[type] = Number(value);
  }
  return {
    anio: p.year,
    mes: p.month,
    dia: p.day,
    hora: p.hour === 24 ? 0 : p.hour,
    minuto: p.minute,
    segundo: p.second,
  };
}

/** Minutos que Madrid va por delante de UTC en ese instante (60 o 120). */
export function desfaseMadrid(fecha: string | Date): number {
  const d = aDate(fecha);
  const p = partesMadrid(d);
  const comoUtc = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
  return Math.round((comoUtc - Math.floor(d.getTime() / 1000) * 1000) / 60000);
}

const dos = (n: number) => String(n).padStart(2, "0");

function desfaseTexto(min: number) {
  const signo = min >= 0 ? "+" : "-";
  const a = Math.abs(min);
  return `${signo}${dos(Math.floor(a / 60))}:${dos(a % 60)}`;
}

/**
 * Hora local de Madrid → instante.
 * Acepta `YYYY-MM-DDTHH:mm` (lo del datetime-local) o `YYYY-MM-DD HH:mm[:ss]`.
 * Devuelve `null` si no se entiende. Si llega un ISO con zona, se respeta.
 */
export function madridAInstante(local: string): Date | null {
  const texto = local.trim();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(texto)) {
    const d = new Date(texto);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = texto.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!m) return null;
  const [anio, mes, dia, hora, minuto, segundo] = m.slice(1).map((x) => Number(x ?? 0));
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || hora > 23 || minuto > 59) return null;

  // Se adivina con el desfase de ese momento y se corrige una vez: cubre los
  // dos cambios de hora del año.
  const comoUtc = Date.UTC(anio, mes - 1, dia, hora, minuto, segundo || 0);
  let t = comoUtc - desfaseMadrid(new Date(comoUtc)) * 60000;
  const corregido = comoUtc - desfaseMadrid(new Date(t)) * 60000;
  if (corregido !== t) t = corregido;
  return new Date(t);
}

/** Instante → `2027-03-30T12:30:00+02:00` (ISO con el desfase de Madrid). */
export function aMadridISO(fecha: string | Date): string {
  const d = aDate(fecha);
  const p = partesMadrid(d);
  return (
    `${p.anio}-${dos(p.mes)}-${dos(p.dia)}T${dos(p.hora)}:${dos(p.minuto)}:${dos(p.segundo)}` +
    desfaseTexto(desfaseMadrid(d))
  );
}

/** Instante → valor para `<input type="datetime-local">` en hora de Madrid. */
export function aEntradaLocal(fecha: string | Date): string {
  const p = partesMadrid(fecha);
  return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}T${dos(p.hora)}:${dos(p.minuto)}`;
}

/** Instante → `20270330T123000` (hora local de Madrid, para .ics con TZID). */
export function aIcsLocal(fecha: string | Date): string {
  const p = partesMadrid(fecha);
  return `${p.anio}${dos(p.mes)}${dos(p.dia)}T${dos(p.hora)}${dos(p.minuto)}${dos(p.segundo)}`;
}

/** Instante → `20270330T103000Z` (UTC, para DTSTAMP). */
export function aIcsUtc(fecha: string | Date): string {
  return aDate(fecha).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** «30 de marzo de 2027». Admite otras opciones de `Intl`; la zona no se toca. */
export function formatearFecha(
  fecha: string | Date,
  opciones: Intl.DateTimeFormatOptions = { dateStyle: "long" },
  idioma = "es-ES",
): string {
  return new Intl.DateTimeFormat(idioma, { ...opciones, timeZone: ZONA }).format(
    aDate(fecha),
  );
}

/** «12:30». */
export function formatearHora(fecha: string | Date, idioma = "es-ES"): string {
  return new Intl.DateTimeFormat(idioma, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: ZONA,
  }).format(aDate(fecha));
}

/**
 * Cada parada del itinerario guarda solo la hora («12:30»); el día lo pone la
 * boda. Esto junta las dos cosas EN HORA DE MADRID y devuelve el instante
 * como ISO con desfase (`2027-03-30T12:30:00+02:00`).
 *
 * Si `hora` no se entiende («por la tarde»), devuelve la fecha de la boda.
 */
export function horaDelDia(fechaBoda: string, hora: string): string {
  const p = partesMadrid(fechaBoda);
  const m = hora.trim().match(/^(\d{1,2})[:.h](\d{2})?/i) ?? hora.trim().match(/^(\d{1,2})$/);
  if (!m) return aMadridISO(fechaBoda);
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (!(h >= 0 && h <= 23 && min >= 0 && min <= 59)) return aMadridISO(fechaBoda);
  const d = madridAInstante(`${p.anio}-${dos(p.mes)}-${dos(p.dia)}T${dos(h)}:${dos(min)}`);
  return d ? aMadridISO(d) : aMadridISO(fechaBoda);
}

/** Días naturales (en Madrid) que faltan hasta la fecha. 0 si ya pasó. */
export function diasHasta(fecha: string | Date, ahora: Date = new Date()): number {
  const a = partesMadrid(ahora);
  const b = partesMadrid(fecha);
  const dif = Date.UTC(b.anio, b.mes - 1, b.dia) - Date.UTC(a.anio, a.mes - 1, a.dia);
  return Math.max(0, Math.round(dif / 86_400_000));
}
