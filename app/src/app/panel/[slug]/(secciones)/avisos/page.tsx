import Link from "next/link";
import ActivarPush from "@/components/panel/ActivarPush";
import Cabecera, { Vacio } from "@/components/panel/Cabecera";
import { ahoraMs, hace } from "@/components/panel/util";
import Formulario, { Enviar } from "@/components/panel/Formulario";
import { exigirPanel } from "@/components/panel/cargar";
import { ui } from "@/components/panel/estilos";
import { guardarPreferenciasAccion, marcarAvisosLeidosForm, probarAvisoAccion } from "@/lib/avisos/acciones";
import { leerPreferencias, listarAvisos } from "@/lib/avisos/datos";
import { hayEmail } from "@/lib/avisos/email";
import { clavePublicaVapid } from "@/lib/avisos/push";
import { FRECUENCIAS, TEXTO_FRECUENCIA, TEXTO_TIPO, TIPOS_AVISO } from "@/lib/avisos/tipos";
import { listarMiembros } from "@/lib/datos";

export const dynamic = "force-dynamic";

/**
 * Avisos: lo nuevo (la campana, entera) y cómo queréis enteraros de cada
 * cosa: email al momento, un resumen por la mañana o nada. Y, si el
 * navegador lo permite, notificaciones en el móvil.
 */
export default async function Avisos({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const acceso = await exigirPanel(slug);
  const id = acceso.invitacionId;
  const [avisos, prefs, miembros] = await Promise.all([listarAvisos(id, 60), leerPreferencias(id), listarMiembros(id).catch(() => [])]);
  const correos = miembros.map((m) => m.email).filter(Boolean) as string[];
  const vapid = clavePublicaVapid();
  const ahora = ahoraMs();
  const sinLeer = avisos.filter((a) => !a.leido).length;

  return (
    <>
      <Cabecera eyebrow="Avisos" titulo="Lo nuevo de vuestra boda">
        Quién confirma, quién cambia su respuesta, los deseos que llegan y lo que hacemos por vosotros.
      </Cabecera>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* ── la lista */}
        <section aria-labelledby="t-lista">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="t-lista" className={ui.h2}>
              Últimos avisos {sinLeer > 0 && <span className={`text-[1rem] ${ui.suave}`}>· {sinLeer} sin leer</span>}
            </h2>
            {sinLeer > 0 && (
              <form action={marcarAvisosLeidosForm}>
                <input type="hidden" name="slug" value={slug} />
                <button type="submit" className={ui.boton}>Marcar todo como leído</button>
              </form>
            )}
          </div>
          <div className="mt-4">
            {avisos.length === 0 ? (
              <Vacio titulo="Todavía nada">
                En cuanto alguien confirme o deje un deseo, lo veréis aquí y en la campana de arriba.
              </Vacio>
            ) : (
              <ul className="divide-y divide-[var(--linea)] overflow-hidden rounded-2xl border border-[var(--linea)] bg-[var(--tarjeta)]">
                {avisos.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={a.enlace ?? `/panel/${slug}`}
                      className={`flex gap-3 px-4 py-3.5 hover:bg-black/[0.02] sm:px-5 ${ui.foco}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-2 h-2 w-2 shrink-0 rounded-full ${a.leido ? "bg-transparent" : "bg-[var(--acento)]"}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block ${a.leido ? "" : "font-medium"}`}>
                          {!a.leido && <span className="sr-only">Nuevo: </span>}
                          {a.titulo}
                        </span>
                        {a.detalle && <span className={`mt-0.5 block text-[0.92rem] ${ui.suave}`}>{a.detalle}</span>}
                        <span className={`mt-1 block text-[0.82rem] ${ui.suave}`}>
                          {TEXTO_TIPO[a.tipo].nombre} · {hace(a.creado, ahora)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── preferencias */}
        <div className="flex flex-col gap-6">
          <section aria-labelledby="t-prefs" className={ui.tarjeta}>
            <h2 id="t-prefs" className={ui.h2}>Cómo os avisamos</h2>
            <p className={`mt-1 text-[0.95rem] ${ui.suave}`}>
              {correos.length
                ? `Por email a ${correos.join(" y ")}. Todo sale siempre en la campana.`
                : "Todavía no hay ningún email en la cuenta: de momento, todo sale en la campana. Añadidlo en «Cuenta»."}
              {!hayEmail() && " (En esta instalación el correo aún no está conectado: se registra, pero no sale.)"}
            </p>
            <Formulario accion={guardarPreferenciasAccion} className="mt-5 flex flex-col gap-5">
              <input type="hidden" name="slug" value={slug} />
              {TIPOS_AVISO.map((t) => (
                <fieldset key={t} className="flex flex-col gap-2">
                  <legend className="font-medium">{TEXTO_TIPO[t].nombre}</legend>
                  <p className={`-mt-1 text-[0.88rem] ${ui.suave}`}>{TEXTO_TIPO[t].ayuda}</p>
                  <div className="grid grid-cols-3 gap-1 rounded-full border border-[var(--linea)] bg-[#F3F0EC] p-1">
                    {FRECUENCIAS.map((f) => (
                      <label
                        key={f}
                        className="flex min-h-11 cursor-pointer items-center justify-center rounded-full px-2 text-center text-[0.85rem] leading-tight text-[var(--suave)] transition-colors has-[:checked]:bg-white has-[:checked]:font-medium has-[:checked]:text-[var(--tinta)] has-[:checked]:shadow-[var(--sombra-1,0_1px_3px_rgba(0,0,0,.1))] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--acento)]"
                      >
                        <input type="radio" name={t} value={f} defaultChecked={prefs[t] === f} className="sr-only" />
                        {TEXTO_FRECUENCIA[f]}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div>
                <Enviar>Guardar</Enviar>
              </div>
            </Formulario>
          </section>

          {vapid && (
            <section aria-labelledby="t-push" className={ui.tarjeta}>
              <h2 id="t-push" className={ui.h2}>En el móvil</h2>
              <p className={`mt-1 mb-4 text-[0.95rem] ${ui.suave}`}>Notificaciones del navegador, además del correo. Opcional.</p>
              <ActivarPush slug={slug} clave={vapid} />
            </section>
          )}

          <section aria-labelledby="t-prueba" className={ui.tarjeta}>
            <h2 id="t-prueba" className="font-medium">¿Os llega bien?</h2>
            <Formulario accion={probarAvisoAccion} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="slug" value={slug} />
              <div>
                <Enviar variante="borde" pendiente="Enviando…">Mandarme un aviso de prueba</Enviar>
              </div>
            </Formulario>
          </section>
        </div>
      </div>
    </>
  );
}
