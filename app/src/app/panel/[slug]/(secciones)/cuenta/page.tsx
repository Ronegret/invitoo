import Cabecera from "@/components/panel/Cabecera";
import Formulario, { Enviar } from "@/components/panel/Formulario";
import IconoPanel from "@/components/panel/IconosPanel";
import Bloqueado from "@/components/panel/Bloqueado";
import { contratoDelPanel, exigirPanel, invitacionDelPanel, origen } from "@/components/panel/cargar";
import { ANADIDOS_BODA, INFO_ANADIDO, INFO_PLAN, funcionesDe } from "@/lib/planes-boda";
import { ui } from "@/components/panel/estilos";
import { onlineHasta } from "@/components/panel/util";
import {
  archivarAccion,
  borrarDatosAccion,
  crearCuentaAccion,
  invitarMiembroAccion,
  quitarMiembroAccion,
} from "@/app/panel/acciones";
import { puedeAdministrar } from "@/lib/auth/acceso";
import { salir } from "@/lib/auth/acciones";
import { hayAuth } from "@/lib/auth/supabase";
import { EMAIL } from "@/lib/contacto";
import { listarMiembros, obtenerExtras, type Rol } from "@/lib/datos";
import { enlaceWhatsApp } from "@/lib/enlaces";
import { formatearFecha } from "@/lib/fecha";

export const dynamic = "force-dynamic";

const NOMBRE_ROL: Record<Rol, string> = { pareja: "Pareja", planner: "Planner", estudio: "Estudio Invitoo" };

export default async function Cuenta({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const acceso = await exigirPanel(slug);
  const [inv, miembros, extras, base, contrato] = await Promise.all([
    invitacionDelPanel(slug),
    listarMiembros(acceso.invitacionId),
    obtenerExtras(acceso.invitacionId),
    origen(),
    contratoDelPanel(slug, acceso.invitacionId),
  ]);
  const tiene = funcionesDe(contrato);
  const contratados = ANADIDOS_BODA.filter((a) => contrato.anadidos.includes(a) || INFO_ANADIDO[a].abre.every((f) => tiene.has(f)));
  const pendientes = ANADIDOS_BODA.filter((a) => !contratados.includes(a));
  const admin = puedeAdministrar(acceso);
  const hasta = onlineHasta(inv.pareja.fecha, extras.online_hasta);
  const yo = acceso.usuario;
  const llave =
    acceso.llave === "cuenta"
      ? `Habéis entrado con ${yo?.email ?? "vuestro email"}.`
      : acceso.llave === "enlace"
        ? "Habéis entrado con el enlace privado. Funciona en este navegador; para entrar desde cualquier sitio, cread vuestro acceso con email aquí abajo."
        : "Estás dentro como estudio.";

  return (
    <>
      <Cabecera eyebrow="Cuenta" titulo="Vuestra cuenta">
        {llave}
      </Cabecera>

      <div className="flex flex-col gap-5">
        {/* ── el plan: lo contratado, normal; lo demás, en gris con candado */}
        <section aria-labelledby="t-plan" className={ui.tarjeta}>
          <p className={ui.eyebrow}>Vuestro plan</p>
          <h2 id="t-plan" className={`${ui.h2} mt-1`}>{INFO_PLAN[contrato.plan].nombre}</h2>
          {contratados.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Añadidos incluidos">
              {contratados.map((a) => (
                <li key={a} className={`${ui.chip} gap-1.5 bg-[var(--verde-claro)] text-[var(--verde)]`}>
                  <IconoPanel id="check" size={14} /> {INFO_ANADIDO[a].nombre}
                </li>
              ))}
            </ul>
          )}
          {pendientes.length > 0 && (
            <>
              <p className={`mt-5 text-[0.95rem] ${ui.suave}`}>Podéis añadir:</p>
              <ul className="mt-2 flex flex-col gap-2">
                {pendientes.map((a) => {
                  const x = INFO_ANADIDO[a];
                  return (
                    <li key={a}>
                      <Bloqueado
                        compacto
                        titulo={x.nombre}
                        precio={x.precio}
                        unidad={x.unidad}
                        resumen={x.resumen}
                        incluye={x.incluye}
                        hrefContratar={a === "directo" || a === "gestionado" ? `/panel/${slug}/directo` : `/panel/${slug}/cambios?quiero=${a}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        {/* ── acceso con email para quien entró por enlace */}
        {acceso.llave === "enlace" && hayAuth() && (
          <section aria-labelledby="t-crear" className={ui.tarjeta}>
            <h2 id="t-crear" className={ui.h2}>Entrar con vuestro Gmail o email</h2>
            <p className={`mt-1 ${ui.suave}`}>Sin contraseña: con ese Gmail entraréis con «Continuar con Google» en un toque, o con un código por email.</p>
            <Formulario accion={crearCuentaAccion} limpiar className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <input type="hidden" name="slug" value={slug} />
              <div className="flex-1">
                <label htmlFor="c-email" className={ui.etiqueta}>Vuestro email</label>
                <input id="c-email" name="email" type="email" inputMode="email" autoComplete="email" required className={ui.campo} />
              </div>
              <Enviar>Crear mi acceso</Enviar>
            </Formulario>
          </section>
        )}

        {/* ── miembros */}
        <section aria-labelledby="t-miembros" className={ui.tarjeta}>
          <h2 id="t-miembros" className={ui.h2}>Quién lleva la boda</h2>
          <p className={`mt-1 ${ui.suave}`}>Invitad a la otra persona de la pareja o a vuestro planner con su email. Cada uno entra con su propia cuenta de Google o con un código.</p>
          {miembros.length === 0 ? (
            <p className={`mt-4 ${ui.suave}`}>Todavía no hay nadie con acceso por email.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--linea)] border-y border-[var(--linea)]">
              {miembros.map((m) => {
                const pendiente = !m.user_id;
                const soyYo = yo && m.user_id === yo.id;
                const aviso = `Hola. Te he dado acceso a nuestra boda en Invitoo. Entra en ${base}/cuenta/entrar y pulsa «Continuar con Google» con ${m.email} (o pide un código a ese email).`;
                return (
                  <li key={m.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {m.nombre || m.email}
                        {soyYo && <span className={`font-normal ${ui.suave}`}> (vosotros)</span>}
                      </p>
                      <p className={`text-[0.9rem] ${ui.suave}`}>
                        {NOMBRE_ROL[m.rol]}
                        {m.nombre && m.email ? ` · ${m.email}` : ""}
                        {pendiente ? " · aún no ha entrado" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pendiente && (
                        <a href={enlaceWhatsApp(aviso)} target="_blank" rel="noopener" className={ui.boton}>
                          <IconoPanel id="whatsapp" size={20} /> Avisar
                          <span className="sr-only"> a {m.email} por WhatsApp</span>
                        </a>
                      )}
                      {(admin || soyYo) && (
                        <Formulario
                          accion={quitarMiembroAccion}
                          confirmar={soyYo ? "¿Dejar de tener acceso a esta boda? Para volver, alguien de la pareja tendrá que invitaros." : `¿Quitar el acceso a ${m.email}?`}
                        >
                          <input type="hidden" name="slug" value={slug} />
                          <input type="hidden" name="id" value={m.id} />
                          <Enviar variante="peligro" pendiente="Quitando…">
                            {soyYo ? "Salir de la boda" : "Quitar"}
                            <span className="sr-only"> a {m.email}</span>
                          </Enviar>
                        </Formulario>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {admin && (
            <Formulario accion={invitarMiembroAccion} limpiar className="mt-6 grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
              <input type="hidden" name="slug" value={slug} />
              <div>
                <label htmlFor="m-email" className={ui.etiqueta}>Email</label>
                <input id="m-email" name="email" type="email" inputMode="email" autoComplete="off" required placeholder="ruben@ejemplo.es" className={ui.campo} />
              </div>
              <div>
                <label htmlFor="m-rol" className={ui.etiqueta}>Es…</label>
                <select id="m-rol" name="rol" defaultValue="pareja" className={ui.campo}>
                  <option value="pareja">De la pareja</option>
                  <option value="planner">Nuestro planner</option>
                </select>
              </div>
              <Enviar pendiente="Invitando…">Dar acceso</Enviar>
            </Formulario>
          )}
          {!hayAuth() && (
            <p className={`mt-4 text-[0.9rem] ${ui.suave}`}>
              El acceso con email se activa muy pronto; las personas que añadáis podrán entrar en cuanto esté.
            </p>
          )}
        </section>

        {/* ── online */}
        <section aria-labelledby="t-online" className={ui.tarjeta}>
          <h2 id="t-online" className={ui.h2}>Hasta cuándo sigue en línea</h2>
          <p className="mt-3 text-[1.05rem]">
            Vuestra invitación y vuestro panel siguen abiertos hasta el{" "}
            <strong className="font-medium">{formatearFecha(hasta)}</strong>.
          </p>
          <p className={`mt-2 text-[0.95rem] ${ui.suave}`}>
            Si queréis guardarla más tiempo (por ejemplo, para el primer aniversario), escribidnos a{" "}
            <a href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Ampliar la invitación ${slug}`)}`} className={ui.enlace}>
              {EMAIL}
            </a>
            .
          </p>
        </section>

        {/* ── datos */}
        <section aria-labelledby="t-datos" className={ui.tarjeta}>
          <h2 id="t-datos" className={ui.h2}>Vuestros datos</h2>
          <p className={`mt-1 ${ui.suave}`}>
            Son vuestros y de vuestros invitados. Podéis llevároslos cuando queráis y pedir que los borremos.
          </p>
          <a href={`/panel/${slug}/datos`} className={`${ui.boton} mt-4`}>
            <IconoPanel id="descargar" size={20} /> Descargar todos los datos
          </a>
          <p className={`mt-2 text-[0.85rem] ${ui.suave}`}>
            Un archivo con la invitación, la lista, las respuestas, los mensajes y las mesas. Las fotos de «En directo»
            se descargan aparte, en su ZIP.
          </p>

          {admin && (
            <div className="mt-8 flex flex-col gap-6 border-t border-[var(--linea)] pt-6">
              <Formulario accion={borrarDatosAccion} className="flex flex-col gap-3">
                <input type="hidden" name="slug" value={slug} />
                <h3 className="font-medium text-[var(--acento)]">Borrar los datos de los invitados</h3>
                <p className={`text-[0.95rem] ${ui.suave}`}>
                  Borra la lista, las respuestas (con menús y alergias), los mensajes y las mesas. La invitación sigue
                  igual. <strong className="font-medium text-[var(--tinta)]">No se puede deshacer:</strong> descargad antes vuestros datos si los queréis.
                </p>
                <div className="sm:max-w-[18rem]">
                  <label htmlFor="b-conf" className={ui.etiqueta}>Para confirmar, escribid BORRAR</label>
                  <input id="b-conf" name="confirmacion" autoComplete="off" required className={ui.campo} />
                </div>
                <div>
                  <Enviar variante="peligro" pendiente="Borrando…">Borrar los datos</Enviar>
                </div>
              </Formulario>

              {inv.estado === "publicada" && (
                <Formulario accion={archivarAccion} className="flex flex-col gap-3">
                  <input type="hidden" name="slug" value={slug} />
                  <h3 className="font-medium text-[var(--acento)]">Retirar la invitación de internet</h3>
                  <p className={`text-[0.95rem] ${ui.suave}`}>
                    El enlace dejará de abrirse para todo el mundo. Vuestro panel sigue aquí.
                  </p>
                  <div className="sm:max-w-[18rem]">
                    <label htmlFor="a-conf" className={ui.etiqueta}>Para confirmar, escribid RETIRAR</label>
                    <input id="a-conf" name="confirmacion" autoComplete="off" required className={ui.campo} />
                  </div>
                  <div>
                    <Enviar variante="peligro" pendiente="Retirando…">Retirar la invitación</Enviar>
                  </div>
                </Formulario>
              )}
            </div>
          )}
        </section>

        <form action={salir}>
          <button type="submit" className={ui.boton}>
            <IconoPanel id="salir" size={20} /> Salir
          </button>
        </form>
      </div>
    </>
  );
}
