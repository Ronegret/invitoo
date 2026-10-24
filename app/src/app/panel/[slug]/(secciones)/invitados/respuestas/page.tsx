import Cabecera, { Vacio } from "@/components/panel/Cabecera";
import IconoPanel from "@/components/panel/IconosPanel";
import { exigirPanel } from "@/components/panel/cargar";
import { ui } from "@/components/panel/estilos";
import { listarInvitados, obtenerRsvps, type FilaRsvp } from "@/lib/datos";
import { formatearFecha, formatearHora } from "@/lib/fecha";
import { resumir } from "@/lib/resumen";
import { alergiasCompartibles, nombreBus, nombreMenu, saludSinPermiso } from "@/lib/rsvp";

export const dynamic = "force-dynamic";

const cuando = (iso: string) => `${formatearFecha(iso, { day: "numeric", month: "short" })}, ${formatearHora(iso)}`;

/**
 * Lo que piden el catering y el transportista, y quién ha contestado qué.
 * Los Excel son los de siempre (`/exportar`).
 */
export default async function Confirmaciones({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const acceso = await exigirPanel(slug);
  const [rsvps, invitados] = await Promise.all([obtenerRsvps(acceso.invitacionId), listarInvitados(acceso.invitacionId)]);
  const r = resumir(rsvps, invitados);
  const base = `/panel/${slug}`;

  return (
    <>
      <Cabecera
        eyebrow="Confirmaciones"
        titulo="Quién viene y qué come"
        acciones={
          <>
            <a href={`${base}/exportar?tipo=personas`} className={ui.botonLleno}>
              <IconoPanel id="descargar" size={20} /> Excel del catering
            </a>
            {r.bus.length > 0 && (
              <a href={`${base}/exportar?tipo=bus`} className={ui.boton}>
                <IconoPanel id="descargar" size={20} /> Excel del autobús
              </a>
            )}
          </>
        }
      >
        Una fila por persona, con su menú y sus alergias. El Excel se abre a la primera en cualquier ordenador.
      </Cabecera>

      {rsvps.length === 0 ? (
        <Vacio titulo="Todavía no ha contestado nadie">
          En cuanto alguien confirme desde la invitación, aquí veréis los menús, las alergias y quién va en autobús.
        </Vacio>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {[
              ["Vienen", r.confirmados],
              ["No vienen", r.noVienen],
              ["Sin respuesta", r.sinRespuesta.length],
            ].map(([t, v]) => (
              <div key={t} className={ui.tarjeta}>
                <dt className={`text-[0.85rem] ${ui.suave}`}>{t}</dt>
                <dd className="display mt-1 text-[2rem] leading-none tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section aria-labelledby="t-menus" className={ui.tarjeta}>
              <h2 id="t-menus" className={ui.h2}>Menús</h2>
              {r.menus.length === 0 ? (
                <p className={`mt-3 ${ui.suave}`}>Nadie ha elegido menú todavía.</p>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--linea)]">
                  {r.menus.map((m) => (
                    <li key={m.id} className="flex items-baseline justify-between py-3">
                      <span>{m.nombre}</span>
                      <span className="display text-[1.5rem] tabular-nums">{m.n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section id="alergias" aria-labelledby="t-alergias" className={`${ui.tarjeta} scroll-mt-6`}>
              <p className={ui.eyebrow}>Para el catering</p>
              <h2 id="t-alergias" className={`${ui.h2} mt-1`}>Alergias e intolerancias</h2>
              {r.sinPermiso.length > 0 && (
                <div role="note" className="mt-4 rounded-xl border-l-4 border-l-[var(--acento)] bg-[var(--acento-claro)] px-4 py-3 text-[0.95rem] text-[var(--acento)]">
                  <p className="font-medium">
                    {r.sinPermiso.length === 1
                      ? "1 persona ha indicado alergias sin dar permiso para compartirlas"
                      : `${r.sinPermiso.length} personas han indicado alergias sin dar permiso para compartirlas`}
                  </p>
                  <p className="mt-1">
                    Es un dato de salud: sin su permiso no lo enseñamos ni va en el Excel (pone «Alergia: consultar con el invitado»).
                    Preguntadle directamente o pedidle que corrija su respuesta y marque la casilla.
                  </p>
                </div>
              )}
              {r.conAlergias.length === 0 ? (
                <p className={`mt-3 ${ui.suave}`}>Nadie ha indicado alergias. Si alguien lo hace, aparecerá aquí con su nombre.</p>
              ) : (
                <>
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Recuento por alérgeno">
                    {r.alergenos.map((a) => (
                      <li key={a.id} className={`${ui.chip} bg-[var(--acento-claro)] text-[var(--acento)]`}>
                        {a.nombre} · {a.n}
                      </li>
                    ))}
                  </ul>
                  <ul className="mt-4 divide-y divide-[var(--linea)]">
                    {r.conAlergias.map(({ persona, de }, i) => (
                      <li key={`${de.id}-${i}`} className="py-3">
                        <p className="font-medium">
                          {persona.nombre}
                          {saludSinPermiso(persona) && (
                            <span className={`${ui.chip} ml-2 bg-[var(--acento-claro)] text-[var(--acento)]`}>Sin permiso</span>
                          )}
                        </p>
                        <p className={`text-[0.95rem] ${ui.suave}`}>
                          {alergiasCompartibles(persona)}
                          {de.personas.length > 1 ? ` · con ${de.nombre}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>

          {r.bus.length > 0 && (
            <section aria-labelledby="t-bus" className={`${ui.tarjeta} mt-5`}>
              <h2 id="t-bus" className={ui.h2}>Autobús por parada</h2>
              <table className="mt-4 w-full text-left text-[0.98rem]">
                <thead>
                  <tr className={`border-b border-[var(--linea)] text-[0.85rem] ${ui.suave}`}>
                    <th scope="col" className="py-2 font-medium">Parada</th>
                    <th scope="col" className="py-2 text-right font-medium">Ida</th>
                    <th scope="col" className="py-2 text-right font-medium">Vuelta</th>
                  </tr>
                </thead>
                <tbody>
                  {r.bus.map((b) => (
                    <tr key={b.parada} className="border-b border-[var(--linea)] last:border-0">
                      <th scope="row" className="py-3 font-normal">{b.parada}</th>
                      <td className="py-3 text-right tabular-nums">{b.ida}</td>
                      <td className="py-3 text-right tabular-nums">{b.vuelta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section aria-labelledby="t-respuestas" className="mt-10">
            <h2 id="t-respuestas" className={ui.h2}>Todas las respuestas</h2>
            <ul className="mt-4 flex flex-col gap-2 md:hidden">
              {rsvps.map((x) => (
                <Tarjeta key={x.id} r={x} />
              ))}
            </ul>
            <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-[var(--linea)] bg-[var(--tarjeta)] md:block">
              <table className="w-full text-left text-[0.95rem]">
                <thead>
                  <tr className={`border-b border-[var(--linea)] text-[0.85rem] ${ui.suave}`}>
                    {["Persona", "Viene", "Menú", "Alergias", "Autobús", "Cuándo"].map((t) => (
                      <th key={t} scope="col" className="px-4 py-3 font-medium">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rsvps.flatMap((x) =>
                    (x.personas.length ? x.personas : [null]).map((p, j) => (
                      <tr key={`${x.id}-${j}`} className="border-b border-[var(--linea)] last:border-0">
                        <td className="px-4 py-3">{p?.nombre ?? x.nombre}</td>
                        <td className={`px-4 py-3 ${x.asiste ? "text-[var(--verde)]" : ui.suave}`}>{x.asiste ? "Sí" : "No"}</td>
                        <td className="px-4 py-3">{x.asiste && p ? nombreMenu(p.menu) : "—"}</td>
                        <td className="px-4 py-3">
                          {x.asiste && p ? alergiasCompartibles(p) || "—" : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {x.asiste && x.bus !== "no" ? `${nombreBus(x.bus)}${x.parada ? ` · ${x.parada}` : ""}` : "—"}
                        </td>
                        <td className={`px-4 py-3 ${ui.suave}`}>{j === 0 ? cuando(x.actualizado_en) : ""}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Tarjeta({ r }: { r: FilaRsvp }) {
  return (
    <li className={ui.tarjeta}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">{r.nombre}</p>
        <p className={r.asiste ? "text-[var(--verde)]" : ui.suave}>
          {r.asiste ? (r.personas.length > 1 ? `Vienen ${r.personas.length}` : "Viene") : "No viene"}
        </p>
      </div>
      {r.asiste && (
        <ul className="mt-2 flex flex-col gap-1 text-[0.95rem]">
          {r.personas.map((p, j) => (
            <li key={j}>
              {p.nombre}
              <span className={ui.suave}>
                {" "}· {nombreMenu(p.menu)}
                {alergiasCompartibles(p) ? ` · ${alergiasCompartibles(p)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      {r.asiste && r.bus !== "no" && (
        <p className={`mt-2 text-[0.92rem] ${ui.suave}`}>
          Autobús: {nombreBus(r.bus)}
          {r.parada ? ` · ${r.parada}` : ""}
        </p>
      )}
      {r.mensaje && <p className="mt-2 text-[0.95rem] italic">«{r.mensaje}»</p>}
      <p className={`mt-2 text-[0.85rem] ${ui.suave}`}>{cuando(r.actualizado_en)}</p>
    </li>
  );
}
