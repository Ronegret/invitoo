import type { Metadata } from "next";
import Link from "next/link";
import BotonImprimir from "@/components/panel/BotonImprimir";
import { exigirPanel, invitacionDelPanel } from "@/components/panel/cargar";
import { TOKENS_PANEL, ui } from "@/components/panel/estilos";
import SelloAlianzas from "@/components/SelloAlianzas";
import { listarInvitadosPanel, obtenerRsvps, type FilaRsvp } from "@/lib/datos";
import { formatearFecha } from "@/lib/fecha";
import { nombreMenu } from "@/lib/rsvp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lista de invitados · Invitoo", robots: { index: false, follow: false } };

type Filtro = "todos" | "confirmados";
type Fila = { clave: string; nombre: string; detalle: string[]; plazas: number; estado: string; menus: string };

/**
 * «Imprimir lista»: A4 vertical, por grupos, con una casilla por invitación
 * (para tachar en la puerta, en la iglesia o con el catering). Filtros:
 * todos, solo confirmados y un grupo. Arriba, una barra que no se imprime.
 * Las alergias NO salen: son datos de salud y van solo en el Excel, con permiso.
 */
export default async function ImprimirInvitados({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filtro?: string; grupo?: string }>;
}) {
  const { slug } = await params;
  const q = await searchParams;
  const acceso = await exigirPanel(slug);
  const [inv, invitados, rsvps] = await Promise.all([
    invitacionDelPanel(slug),
    listarInvitadosPanel(acceso.invitacionId),
    obtenerRsvps(acceso.invitacionId),
  ]);
  const filtro: Filtro = q.filtro === "confirmados" ? "confirmados" : "todos";
  const respuestaDe = new Map(rsvps.filter((r) => r.invitado_id).map((r) => [r.invitado_id!, r]));
  const grupos = [...new Set(invitados.map((i) => i.grupo || "Sin grupo"))].sort((a, b) => a.localeCompare(b, "es"));
  const grupo = q.grupo && grupos.includes(q.grupo) ? q.grupo : "";

  const deRespuesta = (r: FilaRsvp | undefined, cupo: number): Omit<Fila, "clave" | "nombre"> => {
    if (!r) return { detalle: [], plazas: cupo, estado: "Sin respuesta", menus: "" };
    if (!r.asiste) return { detalle: [], plazas: 0, estado: "No viene", menus: "" };
    const nombres = r.personas.map((p) => p.nombre).filter(Boolean);
    const cuenta = new Map<string, number>();
    for (const p of r.personas) cuenta.set(nombreMenu(p.menu), (cuenta.get(nombreMenu(p.menu)) ?? 0) + 1);
    return {
      detalle: nombres.length > 1 ? nombres : [],
      plazas: r.personas.length,
      estado: r.personas.length > 1 ? `Vienen ${r.personas.length}` : "Viene",
      menus: [...cuenta].map(([m, n]) => (n > 1 ? `${n} ${m.toLowerCase()}` : m)).join(", "),
    };
  };

  const porGrupo = new Map<string, Fila[]>();
  for (const i of invitados) {
    const g = i.grupo || "Sin grupo";
    if (grupo && g !== grupo) continue;
    const r = respuestaDe.get(i.id);
    if (filtro === "confirmados" && !r?.asiste) continue;
    const lista = porGrupo.get(g) ?? [];
    lista.push({ clave: i.id, nombre: i.nombre, ...deRespuesta(r, i.cupo) });
    porGrupo.set(g, lista);
  }
  // Quien confirmó escribiendo su nombre (sin enlace personal).
  if (!grupo) {
    const sueltos = rsvps.filter((r) => !r.invitado_id && (filtro === "todos" || r.asiste));
    if (sueltos.length) {
      porGrupo.set(
        "Confirmaron sin enlace personal",
        sueltos.map((r) => ({ clave: r.id, nombre: r.nombre, ...deRespuesta(r, r.personas.length) })),
      );
    }
  }
  const secciones = [...porGrupo].sort(([a], [b]) =>
    a.startsWith("Confirmaron") ? 1 : b.startsWith("Confirmaron") ? -1 : a === "Sin grupo" ? 1 : b === "Sin grupo" ? -1 : a.localeCompare(b, "es"),
  );
  for (const [, filas] of secciones) filas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const total = secciones.reduce((s, [, f]) => s + f.length, 0);
  const plazas = secciones.reduce((s, [, f]) => s + f.reduce((x, y) => x + y.plazas, 0), 0);

  const titulo = filtro === "confirmados" ? "Confirmados" : "Lista de invitados";
  const enlace = (f: Filtro, g = grupo) => `?${new URLSearchParams({ ...(f === "confirmados" ? { filtro: f } : {}), ...(g ? { grupo: g } : {}) })}`;

  return (
    <div style={TOKENS_PANEL} className="min-h-dvh bg-[#EDEAE5] text-[var(--tinta)] print:bg-white">
      <style>{`
        @page { size: A4 portrait; margin: 16mm 15mm 18mm; }
        @media print {
          html, body { background: #fff !important; }
          .no-imprimir { display: none !important; }
          .hoja { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: none !important; width: auto !important; }
          .grupo { break-inside: auto; }
          .grupo h2 { break-after: avoid; }
          tr { break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>

      {/* ── barra (no se imprime) */}
      <div className="no-imprimir sticky top-0 z-10 border-b border-[var(--linea)] bg-[var(--papel)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[52rem] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/panel/${slug}/invitados`} className={`inline-flex min-h-12 items-center ${ui.enlace}`}>
            ← Volver a invitados
          </Link>
          <BotonImprimir>Imprimir o guardar PDF</BotonImprimir>
        </div>
        <nav aria-label="Qué imprimir" className="mx-auto flex max-w-[52rem] flex-wrap items-center gap-2 px-4 pb-3">
          {(["todos", "confirmados"] as const).map((f) => (
            <Link
              key={f}
              href={enlace(f)}
              aria-current={filtro === f ? "true" : undefined}
              className={`inline-flex min-h-12 items-center rounded-full border px-4 text-[0.92rem] ${filtro === f ? "border-[var(--acento)] bg-[var(--acento-claro)] font-medium text-[var(--acento)]" : "border-[var(--linea)] bg-white"} ${ui.foco}`}
            >
              {f === "todos" ? "Todos" : "Solo confirmados"}
            </Link>
          ))}
          <form className="flex items-center gap-2" action="">
            {filtro === "confirmados" && <input type="hidden" name="filtro" value="confirmados" />}
            <label htmlFor="grupo" className="sr-only">Grupo</label>
            <select id="grupo" name="grupo" defaultValue={grupo} className={`${ui.campo} mt-0 min-w-[11rem] pr-8`}>
              <option value="">Todos los grupos</option>
              {grupos.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <button type="submit" className={ui.boton}>Ver</button>
          </form>
        </nav>
      </div>

      {/* ── la hoja */}
      <main className="hoja mx-auto my-6 max-w-[52rem] bg-white px-5 py-8 shadow-[var(--sombra-3,0_10px_30px_rgba(0,0,0,.08))] sm:my-10 sm:px-12 sm:py-12">
        <header className="flex flex-col items-center border-b border-[#1F1A17]/15 pb-6 text-center">
          <SelloAlianzas size={34} className="text-[var(--acento)]" />
          <p className="mt-3 text-[0.68rem] uppercase tracking-[0.32em] text-[var(--suave)]">{titulo}{grupo ? ` · ${grupo}` : ""}</p>
          <h1 className="display mt-2 text-[clamp(1.7rem,6vw,2.4rem)] leading-tight">
            {inv.pareja.a} &amp; {inv.pareja.b}
          </h1>
          <p className="mt-1 text-[0.9rem] text-[var(--suave)]">
            {formatearFecha(inv.pareja.fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="mt-3 text-[0.85rem] tabular-nums text-[var(--suave)]">
            {total} {total === 1 ? "invitación" : "invitaciones"} · {plazas} {plazas === 1 ? "persona" : "personas"}
          </p>
        </header>

        {secciones.length === 0 ? (
          <p className="py-16 text-center text-[var(--suave)]">
            {filtro === "confirmados" ? "Todavía no ha confirmado nadie con este filtro." : "No hay invitados en la lista con este filtro."}
          </p>
        ) : (
          secciones.map(([g, filas]) => (
            <section key={g} className="grupo mt-8" aria-labelledby={`g-${g}`}>
              <h2 id={`g-${g}`} className="flex items-baseline justify-between gap-3 border-b border-[var(--acento)]/40 pb-1.5">
                <span className="display text-[1.2rem]">{g}</span>
                <span className="text-[0.75rem] uppercase tracking-[0.16em] text-[var(--suave)] tabular-nums">
                  {filas.reduce((s, f) => s + f.plazas, 0)} pers.
                </span>
              </h2>
              <table className="w-full border-collapse text-[0.86rem]">
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Marcar</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Plazas</th>
                    <th scope="col">Respuesta</th>
                    <th scope="col">Menú</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.clave} className="border-b border-[#1F1A17]/10 align-top">
                      <td className="w-8 py-2.5 pr-2">
                        <span aria-hidden="true" className="mt-0.5 block h-4 w-4 rounded-[3px] border-[1.5px] border-[#1F1A17]/55" />
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="font-medium">{f.nombre}</span>
                        {f.detalle.length > 0 && <span className="mt-0.5 block text-[0.78rem] text-[var(--suave)]">{f.detalle.join(" · ")}</span>}
                      </td>
                      <td className="w-14 py-2.5 pr-3 text-right tabular-nums">{f.plazas || "—"}</td>
                      <td className="hidden w-28 py-2.5 pr-3 text-[var(--suave)] min-[420px]:table-cell print:table-cell">{f.estado}</td>
                      <td className="hidden w-36 py-2.5 text-[var(--suave)] sm:table-cell print:table-cell">{f.menus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}

        <footer className="mt-10 flex items-center justify-between border-t border-[#1F1A17]/15 pt-3 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--suave)]">
          <span>Invitoo</span>
          <span>Impreso el {formatearFecha(new Date().toISOString(), { day: "numeric", month: "long", year: "numeric" })}</span>
        </footer>
      </main>
    </div>
  );
}
