import Cabecera from "@/components/panel/Cabecera";
import PedirCambio from "@/components/panel/PedirCambio";
import { contratoDelPanel, exigirPanel, invitacionDelPanel } from "@/components/panel/cargar";
import { ui } from "@/components/panel/estilos";
import { NOMBRES } from "@/lib/bloques";
import { formatearFecha, formatearHora } from "@/lib/fecha";
import { esAnadidoBoda, INFO_ANADIDO, INFO_PLAN, PLAZOS_CAMBIO, RONDAS_TRAS_PUBLICAR } from "@/lib/planes-boda";
import { ESTADOS_SOLICITUD, solicitudesDeBoda, TEXTO_ESTADO, type EstadoSolicitud } from "@/lib/solicitudes/datos";

export const dynamic = "force-dynamic";

const PASO: Record<EstadoSolicitud, number> = { recibida: 0, en_curso: 1, hecha: 2 };

/**
 * «Pedir un cambio»: la manera de pedirnos algo sin perderse en WhatsApp.
 * Cada solicitud tiene su estado (recibida → en curso → hecha) y os avisamos
 * cuando está hecha. También llegan aquí los «Contratar» de lo que va con
 * candado (`?quiero=<añadido>`).
 */
export default async function Cambios({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ quiero?: string; seccion?: string }>;
}) {
  const { slug } = await params;
  const q = await searchParams;
  const acceso = await exigirPanel(slug);
  const [inv, solicitudes, contrato] = await Promise.all([
    invitacionDelPanel(slug),
    solicitudesDeBoda(acceso.invitacionId),
    contratoDelPanel(slug, acceso.invitacionId),
  ]);
  const rondas = RONDAS_TRAS_PUBLICAR[contrato.plan];
  const publicada = inv.estado === "publicada";

  const secciones = [
    ...new Map(inv.bloques.map((b) => [b.t, { id: b.t, nombre: NOMBRES[b.t] ?? b.t }])).values(),
    { id: "colores", nombre: "Colores y tipografía" },
    { id: "musica", nombre: "Música" },
    { id: "plan", nombre: "Plan o añadidos" },
  ];
  const quiero = esAnadidoBoda(q.quiero) ? INFO_ANADIDO[q.quiero] : null;
  const inicial = quiero ? `Queremos contratar «${quiero.nombre}» (${quiero.precio} €).` : undefined;
  const abiertas = solicitudes.filter((s) => s.estado !== "hecha");
  const hechas = solicitudes.filter((s) => s.estado === "hecha");

  return (
    <>
      <Cabecera eyebrow="Pedir un cambio" titulo="¿Qué cambiamos?">
        Una hora, una foto, una frase, un color… Escribidlo aquí y lo hacemos nosotros. Os avisamos en cuanto esté.
      </Cabecera>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="t-pedir" className={ui.tarjeta}>
          <h2 id="t-pedir" className="sr-only">Nueva solicitud</h2>
          <PedirCambio
            slug={slug}
            secciones={secciones}
            inicial={inicial}
            seccionInicial={quiero ? "Plan o añadidos" : secciones.find((s) => s.id === q.seccion)?.nombre}
          />
          <dl className="mt-6 grid gap-3 border-t border-[var(--linea)] pt-5 text-[0.92rem] sm:grid-cols-3">
            <div>
              <dt className={ui.suave}>Os contestamos</dt>
              <dd className="mt-0.5 font-medium">En menos de {PLAZOS_CAMBIO.respuestaHoras} h</dd>
            </div>
            <div>
              <dt className={ui.suave}>Hecho</dt>
              <dd className="mt-0.5 font-medium">En {PLAZOS_CAMBIO.hechoHoras} h como mucho</dd>
            </div>
            <div>
              <dt className={ui.suave}>{publicada ? "Rondas tras publicar" : "Hasta publicar"}</dt>
              <dd className="mt-0.5 font-medium">
                {!publicada || rondas === null ? "Ilimitados" : `${rondas} incluidas en ${INFO_PLAN[contrato.plan].nombre}`}
              </dd>
            </div>
            <p className={`text-[0.85rem] sm:col-span-3 ${ui.suave}`}>
              Días laborables. Truco: juntad varias cosas en una sola solicitud y lo hacemos todo de una vez.
            </p>
          </dl>
        </section>

        <section aria-labelledby="t-mias">
          <h2 id="t-mias" className={ui.h2}>Vuestras solicitudes</h2>
          {solicitudes.length === 0 ? (
            <p className={`mt-3 ${ui.texto} ${ui.suave}`}>
              Aquí veréis cada cosa que nos pidáis y en qué punto está. Solemos responder en el día (laborables).
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-3">
              {[...abiertas, ...hechas].map((s) => (
                <li key={s.id} className={`${ui.tarjeta} ${s.estado === "hecha" ? "bg-[#F7F6F3]" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`${ui.chip} ${
                        s.estado === "hecha"
                          ? "bg-[var(--verde-claro)] text-[var(--verde)]"
                          : s.estado === "en_curso"
                            ? "bg-[#F6EEDC] text-[#6E5326]"
                            : "bg-[var(--acento-claro)] text-[var(--acento)]"
                      }`}
                    >
                      {TEXTO_ESTADO[s.estado]}
                    </span>
                    <span className={`text-[0.85rem] ${ui.suave}`}>
                      {formatearFecha(s.creado, { day: "numeric", month: "short" })}, {formatearHora(s.creado)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-line">{s.texto}</p>
                  {s.seccion && <p className={`mt-1 text-[0.88rem] ${ui.suave}`}>Sección: {s.seccion}</p>}
                  {s.foto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.foto} alt="Imagen que adjuntasteis" loading="lazy" className="mt-3 h-24 w-24 rounded-xl object-cover" />
                  )}
                  {s.respuesta && (
                    <p className="mt-3 rounded-xl bg-[var(--papel)] p-3 text-[0.95rem]">
                      <span className="font-medium">Invitoo: </span>
                      {s.respuesta}
                    </p>
                  )}
                  <ol aria-label="Estado" className="mt-4 grid grid-cols-3 gap-1.5">
                    {ESTADOS_SOLICITUD.map((e) => (
                      <li key={e} className="flex flex-col gap-1.5" aria-current={e === s.estado ? "step" : undefined}>
                        <span
                          aria-hidden="true"
                          className={`h-1 rounded-full ${PASO[e] <= PASO[s.estado] ? (s.estado === "hecha" ? "bg-[var(--verde)]" : "bg-[var(--acento)]") : "bg-[var(--linea)]"}`}
                        />
                        <span className={`text-[0.78rem] ${e === s.estado ? "font-medium" : ui.suave}`}>{TEXTO_ESTADO[e]}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
