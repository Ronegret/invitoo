import Icono from "@/components/Iconos";

/**
 * «Añadir al calendario» para la boda entera.
 *
 * Dos caminos, los dos enlaces de verdad (funcionan sin JavaScript):
 *  · el .ics de Invitoo (`/i/<slug>/calendario`), con zona Europe/Madrid y
 *    aviso el día antes: vale para iPhone, Android, Outlook…;
 *  · Google Calendar directo, para quien vive en Gmail.
 */
function utc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function enlaceGoogleCalendar({
  titulo,
  inicio,
  fin,
  lugar,
  detalles,
}: {
  titulo: string;
  inicio: string;
  fin?: string;
  lugar?: string;
  detalles?: string;
}) {
  const ini = new Date(inicio);
  const hasta = fin ? new Date(fin) : new Date(ini.getTime() + 8 * 3_600_000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    dates: `${utc(ini)}/${utc(hasta)}`,
    ctz: "Europe/Madrid",
  });
  if (lugar) q.set("location", lugar);
  if (detalles) q.set("details", detalles);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export default function Calendario({
  slug,
  a,
  b,
  inicio,
  fin,
  lugar,
  titulo = "Que no se os pase",
  compacto = false,
}: {
  slug: string;
  a: string;
  b: string;
  /** ISO con la hora de la ceremonia (o la fecha de la boda). */
  inicio: string;
  fin?: string;
  /** «Finca X, Calle Y, Ciudad». */
  lugar?: string;
  titulo?: string;
  /** Solo los botones, sin título ni texto: para meterlo en otra sección. */
  compacto?: boolean;
}) {
  const google = enlaceGoogleCalendar({
    titulo: `Boda de ${a} y ${b}`,
    inicio,
    fin,
    lugar,
    detalles: `La invitación: https://invitoo.es/i/${slug}`,
  });
  const boton =
    "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full border border-current/30 px-7 text-[1.0625rem] transition-colors duration-150 hover:border-current/60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))]";

  const botones = (
    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <a href={`/i/${encodeURIComponent(slug)}/calendario`} download className={boton}>
        <Icono id="reloj" size={18} />
        Añadir al calendario
      </a>
      <a href={google} target="_blank" rel="noopener noreferrer" className={boton}>
        Google Calendar
      </a>
    </div>
  );

  if (compacto) return botones;

  return (
    <section className="px-6 py-20 text-center">
      <h2 className="display text-[clamp(1.9rem,8vw,2.6rem)]">{titulo}</h2>
      <p className="mx-auto mt-5 max-w-[26rem] text-[1.0625rem] leading-relaxed">
        Guardadlo en el móvil y os avisará el día antes.
      </p>
      {botones}
    </section>
  );
}
