import Link from "next/link";
import { PLANTILLAS } from "@/data/plantillas";
import { listarTodas } from "@/lib/datos";
import { ultimosEnvios } from "@/lib/correos/enviar";
import { cifrasPeriodo, type Cifras } from "@/lib/correos/metricas";
import { leerContadores } from "@/lib/visitas/datos";
import { modoDatos } from "@/lib/visitas/local";
import { diaMadrid, sumarDias, umbralPico } from "@/lib/visitas/registrar";

export const dynamic = "force-dynamic";

/**
 * /estudio/visitas — las mismas cifras que los resúmenes por correo.
 * Sin cookies ni datos personales: contadores por día (ver lib/visitas).
 * El layout de /estudio ya exige la sesión.
 */

const PERIODOS = [7, 30, 90] as const;
const NUM = new Intl.NumberFormat("es-ES");
const n = (x: number) => NUM.format(x);
const FECHA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
const fechaCorta = (dia: string) => FECHA.format(new Date(`${dia}T12:00:00Z`));
const DIA_SEMANA = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", timeZone: "UTC" });

function variacion(actual: number, anterior: number) {
  if (actual === anterior) return { texto: "igual que antes", signo: 0 };
  if (anterior === 0) return { texto: `+${n(actual)} (antes, 0)`, signo: 1 };
  const p = Math.round(((actual - anterior) / anterior) * 100);
  return { texto: `${p > 0 ? "+" : ""}${p} % frente a ${n(anterior)}`, signo: Math.sign(p) };
}

const ESTADO_ENVIO: Record<string, string> = {
  enviado: "Enviado",
  buzon: "En el buzón local",
  fallido: "Falló",
  aplazado: "Aplazado (límite del día)",
  pendiente: "Pendiente",
  omitido: "Omitido",
};

export default async function Visitas({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const pedido = Number(typeof sp.dias === "string" ? sp.dias : 30);
  const dias = (PERIODOS as readonly number[]).includes(pedido) ? pedido : 30;
  const hoy = diaMadrid();
  const desde = sumarDias(hoy, -(dias - 1));
  const antesDesde = sumarDias(desde, -dias);
  const antesHasta = sumarDias(desde, -1);

  const [filas, bodas, envios] = await Promise.all([leerContadores(antesDesde, hoy), listarTodas().catch(() => []), ultimosEnvios(20)]);
  const [actual, anterior] = await Promise.all([cifrasPeriodo(desde, hoy, filas), cifrasPeriodo(antesDesde, antesHasta, filas)]);
  const nombres = new Map(bodas.map((b) => [b.slug, `${b.pareja.a} y ${b.pareja.b}`]));
  const nombrePlantilla = new Map(PLANTILLAS.map((p) => [p.id as string, p.nombre]));
  const modo = modoDatos();

  const tarjetas: { titulo: string; clave: keyof Cifras["total"]; ayuda?: string }[] = [
    { titulo: "Páginas vistas", clave: "paginas" },
    { titulo: "Visitantes (aprox.)", clave: "visitantes", ayuda: "Únicos por día, sumados." },
    { titulo: "Clics en «Reservar»", clave: "reservar" },
    { titulo: "Clics en WhatsApp", clave: "whatsapp" },
    { titulo: "Pagos empezados", clave: "iniciados", ayuda: "Abren Stripe Checkout." },
    { titulo: "Pagos hechos", clave: "pagados" },
    { titulo: "Aperturas de invitaciones", clave: "aperturas" },
    { titulo: "Confirmaciones nuevas", clave: "rsvp" },
    { titulo: "Fotos subidas", clave: "fotos" },
  ];
  const t = actual.total;
  const conversion = t.iniciados > 0 ? Math.round((t.pagados / t.iniciados) * 100) : null;

  return (
    <main className="mx-auto max-w-[64rem] px-5 py-12">
      <p className="text-[0.78rem] uppercase tracking-[0.28em] opacity-60">
        <Link href="/estudio" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Bodas</Link> · Visitas
      </p>
      <h1 className="display mt-2 text-[clamp(2.2rem,8vw,3.2rem)]">Visitas</h1>
      <p className="mt-2 max-w-[44rem] opacity-70">
        Medición propia, sin cookies ni datos personales. Los visitantes son aproximados: un hash del día que no se puede
        volver a unir a nadie. Del {fechaCorta(desde)} al {fechaCorta(hoy)}, comparado con los {dias} días anteriores.
        {modo === "local" && " Modo local: las cifras están en .visitas-local/ y los correos en el buzón de /estudio/correos."}
      </p>

      <nav aria-label="Periodo" className="mt-6 flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <Link
            key={p}
            href={`/estudio/visitas?dias=${p}`}
            aria-current={p === dias ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[0.95rem] ${p === dias ? "border-[var(--tinta)] bg-[var(--tinta)] text-[var(--papel)]" : "border-[var(--tinta)]/25"}`}
          >
            {p} días
          </Link>
        ))}
      </nav>

      <section aria-labelledby="t-cifras" className="mt-10">
        <h2 id="t-cifras" className="sr-only">Cifras del periodo</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tarjetas.map((c) => {
            const v = variacion(t[c.clave], anterior.total[c.clave]);
            return (
              <li key={c.clave} className="rounded-2xl border border-[var(--tinta)]/12 px-5 py-4">
                <p className="text-[0.95rem] opacity-70">{c.titulo}</p>
                <p className="display mt-1 text-[2.2rem] leading-none tabular-nums">{n(t[c.clave])}</p>
                <p className="mt-2 text-[0.95rem] tabular-nums">
                  <span aria-hidden="true">{v.signo > 0 ? "▲ " : v.signo < 0 ? "▼ " : "· "}</span>
                  {v.texto}
                </p>
                {c.ayuda && <p className="mt-1 text-[0.875rem] opacity-60">{c.ayuda}</p>}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[1rem] opacity-80">
          Embudo: {n(t.reservar)} clics en «Reservar» → {n(t.iniciados)} pagos empezados → {n(t.pagados)} pagados
          {conversion !== null && ` (${conversion} % de los empezados)`}.
        </p>
      </section>

      <Grafica cifras={actual} />

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <Top titulo="Páginas más vistas" filas={actual.paginasTop.map((x) => [x.clave, x.vistas])} vacio="Sin visitas todavía." />
        <Top titulo="Plantillas más vistas" filas={actual.plantillasTop.map((x) => [nombrePlantilla.get(x.clave) ?? x.clave, x.vistas])} vacio="Nadie ha abierto una demo todavía." />
        <Top titulo="De dónde vienen" filas={actual.origenes.map((x) => [origenLegible(x.clave), x.vistas])} vacio="Sin entradas todavía." unidad="entradas" />
        <section aria-labelledby="t-bodas">
          <h2 id="t-bodas" className="display text-[1.6rem]">Invitaciones</h2>
          {actual.bodas.length === 0 ? (
            <p className="mt-3 opacity-60">Ninguna apertura en el periodo.</p>
          ) : (
            <table className="mt-3 w-full text-left text-[1rem]">
              <caption className="sr-only">Aperturas, confirmaciones y fotos por boda</caption>
              <thead>
                <tr className="border-b border-[var(--tinta)]/15 text-[0.9rem] opacity-70">
                  <th scope="col" className="py-2 font-normal">Boda</th>
                  <th scope="col" className="py-2 text-right font-normal">Aperturas</th>
                  <th scope="col" className="py-2 text-right font-normal">RSVP</th>
                  <th scope="col" className="py-2 text-right font-normal">Fotos</th>
                </tr>
              </thead>
              <tbody>
                {actual.bodas.map((b) => (
                  <tr key={b.slug} className="border-b border-[var(--tinta)]/8">
                    <th scope="row" className="py-2 pr-2 font-normal">{nombres.get(b.slug) ?? b.slug}</th>
                    <td className="py-2 text-right tabular-nums">{n(b.aperturas)}</td>
                    <td className="py-2 text-right tabular-nums">{n(b.rsvp)}</td>
                    <td className="py-2 text-right tabular-nums">{n(b.fotos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section aria-labelledby="t-correos" className="mt-16">
        <h2 id="t-correos" className="display text-[1.6rem]">Últimos correos automáticos</h2>
        <p className="mt-2 text-[1rem] opacity-70">
          Resumen diario a primera hora (si hubo actividad), semanal los lunes y alertas al momento. Aviso de pico al pasar de{" "}
          {n(umbralPico())} vistas en una hora. <Link href="/estudio/correos" className="underline underline-offset-4">Ver las plantillas y el buzón</Link>.
        </p>
        {envios.length === 0 ? (
          <p className="mt-4 opacity-60">Todavía no ha salido ninguno.</p>
        ) : (
          <ul className="mt-4 flex flex-col">
            {envios.map((e) => (
              <li key={e.clave} className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-[var(--tinta)]/10 py-3 text-[1rem]">
                <span>
                  <span className="font-medium">{e.asunto ?? e.correo}</span>
                  <span className="opacity-65"> · {e.categoria === "estudio" ? "al estudio" : e.slug ?? "reserva"}</span>
                </span>
                <span className={`text-[0.95rem] ${e.estado === "fallido" ? "text-[var(--acento)]" : "opacity-70"}`}>
                  {ESTADO_ENVIO[e.estado] ?? e.estado} · {fechaCorta(e.dia)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function origenLegible(clave: string) {
  if (clave === "directo") return "Directo (sin referencia)";
  if (clave === "interno") return "Desde la propia web";
  if (clave.startsWith("utm:")) return `Campaña: ${clave.slice(4)}`;
  return clave.charAt(0).toUpperCase() + clave.slice(1);
}

function Top({ titulo, filas, vacio, unidad = "vistas" }: { titulo: string; filas: [string, number][]; vacio: string; unidad?: string }) {
  const max = Math.max(1, ...filas.map((f) => f[1]));
  const id = `t-${titulo.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="display text-[1.6rem]">{titulo}</h2>
      {filas.length === 0 ? (
        <p className="mt-3 opacity-60">{vacio}</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {filas.map(([clave, v]) => (
            <li key={clave} className="text-[1rem]">
              <div className="flex justify-between gap-3">
                <span className="min-w-0 truncate" title={clave}>{clave}</span>
                <span className="tabular-nums opacity-80">
                  {n(v)} <span className="sr-only">{unidad}</span>
                </span>
              </div>
              <div aria-hidden="true" className="mt-1 h-1.5 rounded-full bg-[var(--tinta)]/8">
                <div className="h-full rounded-full bg-[var(--acento)]" style={{ width: `${Math.max(3, (v / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Barras por día (páginas vistas) con la línea de visitantes. La tabla de debajo lleva los mismos datos. */
function Grafica({ cifras }: { cifras: Cifras }) {
  const datos = cifras.porDia;
  const max = Math.max(1, ...datos.map((d) => Math.max(d.paginas, d.visitantes)));
  const ancho = 720;
  const alto = 200;
  const paso = ancho / datos.length;
  const barra = Math.max(2, paso * 0.68);
  const y = (v: number) => alto - (v / max) * (alto - 10);
  const linea = datos.map((d, i) => `${i === 0 ? "M" : "L"}${(i * paso + paso / 2).toFixed(1)},${y(d.visitantes).toFixed(1)}`).join(" ");
  const pico = datos.reduce((a, b) => (b.paginas > a.paginas ? b : a), datos[0]);
  const resumen = `Del ${fechaCorta(cifras.desde)} al ${fechaCorta(cifras.hasta)}: ${n(cifras.total.paginas)} páginas vistas y ${n(cifras.total.visitantes)} visitantes aproximados. El día con más vistas fue el ${fechaCorta(pico.dia)}, con ${n(pico.paginas)}.`;
  const cadaEtiqueta = Math.ceil(datos.length / 8);

  return (
    <section aria-labelledby="t-grafica" className="mt-14">
      <h2 id="t-grafica" className="display text-[1.6rem]">Por día</h2>
      <p className="mt-2 text-[1rem] opacity-75">{resumen}</p>
      <div className="mt-4 flex flex-wrap gap-5 text-[0.95rem]">
        <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-block size-3 rounded-sm bg-[var(--acento)]" /> Páginas vistas</span>
        <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-block h-0.5 w-5 bg-[var(--tinta)]" /> Visitantes</span>
      </div>
      <svg viewBox={`0 0 ${ancho} ${alto + 24}`} className="mt-3 h-auto w-full" role="img" aria-label={resumen}>
        <line x1="0" x2={ancho} y1={alto} y2={alto} stroke="currentColor" strokeOpacity="0.2" />
        {datos.map((d, i) => (
          <g key={d.dia}>
            <rect x={i * paso + (paso - barra) / 2} y={y(d.paginas)} width={barra} height={alto - y(d.paginas)} rx="2" fill="var(--acento)" fillOpacity="0.85">
              <title>{`${fechaCorta(d.dia)}: ${n(d.paginas)} vistas, ${n(d.visitantes)} visitantes`}</title>
            </rect>
            {i % cadaEtiqueta === 0 && (
              <text x={i * paso + paso / 2} y={alto + 18} textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity="0.65">
                {fechaCorta(d.dia)}
              </text>
            )}
          </g>
        ))}
        <path d={linea} fill="none" stroke="var(--tinta)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <details className="mt-4">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-[1rem] underline underline-offset-4">Ver los datos por día</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-[0.95rem]">
            <caption className="sr-only">Cifras por día</caption>
            <thead>
              <tr className="border-b border-[var(--tinta)]/15 opacity-70">
                <th scope="col" className="py-2 font-normal">Día</th>
                <th scope="col" className="py-2 text-right font-normal">Vistas</th>
                <th scope="col" className="py-2 text-right font-normal">Visitantes</th>
                <th scope="col" className="py-2 text-right font-normal">Reservar</th>
                <th scope="col" className="py-2 text-right font-normal">WhatsApp</th>
                <th scope="col" className="py-2 text-right font-normal">Pagos</th>
                <th scope="col" className="py-2 text-right font-normal">Aperturas</th>
              </tr>
            </thead>
            <tbody>
              {[...datos].reverse().map((d) => (
                <tr key={d.dia} className="border-b border-[var(--tinta)]/8 tabular-nums">
                  <th scope="row" className="py-1.5 font-normal">{DIA_SEMANA.format(new Date(`${d.dia}T12:00:00Z`))}</th>
                  <td className="py-1.5 text-right">{n(d.paginas)}</td>
                  <td className="py-1.5 text-right">{n(d.visitantes)}</td>
                  <td className="py-1.5 text-right">{n(d.reservar)}</td>
                  <td className="py-1.5 text-right">{n(d.whatsapp)}</td>
                  <td className="py-1.5 text-right">{n(d.pagados)} / {n(d.iniciados)}</td>
                  <td className="py-1.5 text-right">{n(d.aperturas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
