"use client";

/**
 * «Añadir al calendario».
 *
 * Fixdate lo tiene y es de lo más útil de una invitación: el invitado la
 * abre una vez, se le olvida, y la boda llega. Con esto se le queda en el
 * móvil con recordatorio.
 *
 * Se genera un .ics en el propio navegador — sin servidor, sin servicios de
 * terceros y sin que nadie sepa quién lo ha descargado. Funciona en iPhone,
 * Android, Google Calendar y Outlook.
 */
export default function Agendar({
  titulo,
  inicio,
  lugar,
  direccion,
  duracionHoras = 3,
}: {
  titulo: string;
  inicio: string;
  lugar: string;
  direccion: string;
  duracionHoras?: number;
}) {
  function descargar() {
    const ini = new Date(inicio);
    const fin = new Date(ini.getTime() + duracionHoras * 3_600_000);
    // El formato del .ics quiere UTC y sin guiones: 20270330T103000Z
    const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    // Las comas y los puntos y coma se escapan, o el archivo se rompe.
    const esc = (t: string) =>
      t.replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Invitoo//ES",
      "BEGIN:VEVENT",
      `UID:${ini.getTime()}@invitoo.es`,
      `DTSTAMP:${utc(new Date())}`,
      `DTSTART:${utc(ini)}`,
      `DTEND:${utc(fin)}`,
      `SUMMARY:${esc(titulo)}`,
      `LOCATION:${esc(`${lugar}, ${direccion}`)}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(titulo)} es mañana`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob([ics], { type: "text/calendar;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titulo.toLowerCase().replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={descargar}
      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-current/25 px-6 text-[0.78rem] uppercase tracking-[0.18em] transition-colors duration-500 hover:border-current/60"
    >
      Agendar
    </button>
  );
}
