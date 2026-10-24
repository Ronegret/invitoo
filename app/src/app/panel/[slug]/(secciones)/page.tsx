import Link from "next/link";
import IconoPanel, { type IconoPanelId } from "@/components/panel/IconosPanel";
import Progreso from "@/components/panel/Progreso";
import { exigirPanel, invitacionDelPanel } from "@/components/panel/cargar";
import { avisosDirecto } from "@/components/panel/directo";
import { ui } from "@/components/panel/estilos";
import { cuandoRelativo, diasEsperando, haceDias, plural, ahoraMs } from "@/components/panel/util";
import { contarDeseosNuevos } from "@/lib/deseos/datos";
import { listarInvitadosPanel, obtenerRsvps } from "@/lib/datos";
import { solicitudesDeBoda } from "@/lib/solicitudes/datos";
import { diasHasta, formatearFecha, formatearHora, partesMadrid } from "@/lib/fecha";
import { resumir } from "@/lib/resumen";

export const dynamic = "force-dynamic";

type Aviso = { nivel: "alta" | "media"; texto: string; detalle?: string; href: string; accion: string };

/**
 * «Hoy»: lo que necesita vuestra atención, cuánto falta y cómo van las
 * respuestas. Es la pantalla que se abre en la cola del súper: lo urgente
 * arriba, cada aviso con su botón para resolverlo.
 */
export default async function Hoy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const acceso = await exigirPanel(slug);
  const id = acceso.invitacionId;
  const [inv, invitados, rsvps, sinLeer, solicitudes, directo] = await Promise.all([
    invitacionDelPanel(slug),
    listarInvitadosPanel(id),
    obtenerRsvps(id),
    contarDeseosNuevos(id),
    solicitudesDeBoda(id),
    avisosDirecto(slug),
  ]);

  const base = `/panel/${slug}`;
  const r = resumir(rsvps, invitados);
  const ahora = ahoraMs();
  const dias = diasHasta(inv.pareja.fecha);
  const hoy = partesMadrid(new Date());
  const boda = partesMadrid(inv.pareja.fecha);
  const esHoy = hoy.anio === boda.anio && hoy.mes === boda.mes && hoy.dia === boda.dia;
  const celebrada = dias === 0 && !esHoy;

  const esperando = r.sinRespuesta.filter((i) => diasEsperando(i as (typeof invitados)[number], ahora) >= 7);
  const alergiasNuevas = rsvps.filter(
    (x) => x.asiste && haceDias(x.actualizado_en, ahora) < 7 && x.personas.some((p) => p.alergenos.length || p.alergias_texto),
  );

  const avisos: Aviso[] = [];
  if (inv.estado !== "publicada") {
    avisos.push({
      nivel: "media",
      texto: "Vuestra invitación aún no está publicada",
      detalle: "Los invitados no la pueden abrir todavía. Cuando la tengáis lista, avisadnos y la publicamos.",
      href: `${base}/diseno`,
      accion: "Revisar el diseño",
    });
  }
  if (invitados.length === 0) {
    avisos.push({
      nivel: "media",
      texto: "Todavía no habéis añadido a nadie",
      detalle: "Con la lista, cada invitado recibe su enlace personal y sabéis quién falta por contestar.",
      href: `${base}/invitados#anadir`,
      accion: "Añadir invitados",
    });
  }
  if (esperando.length > 0) {
    avisos.push({
      nivel: dias <= 30 ? "alta" : "media",
      texto: `${plural(esperando.length, "invitación lleva", "invitaciones llevan")} más de una semana sin respuesta`,
      detalle: esperando.slice(0, 3).map((i) => i.nombre).join(", ") + (esperando.length > 3 ? "…" : ""),
      href: `${base}/invitados?estado=pendiente&recordar=1`,
      accion: "Recordárselo",
    });
  }
  if (alergiasNuevas.length > 0) {
    const n = alergiasNuevas.reduce((s, x) => s + x.personas.filter((p) => p.alergenos.length || p.alergias_texto).length, 0);
    avisos.push({
      nivel: "alta",
      texto: `${plural(n, "persona ha indicado", "personas han indicado")} alergias esta semana`,
      detalle: "Que el catering lo tenga a tiempo.",
      href: `${base}/invitados/respuestas#alergias`,
      accion: "Ver alergias",
    });
  }
  if (r.sinPermiso.length > 0) {
    avisos.push({
      nivel: "alta",
      texto: `${plural(r.sinPermiso.length, "persona ha indicado", "personas han indicado")} alergias sin permiso para compartirlas`,
      detalle: "Para el catering: no van en el Excel. Preguntádselo directamente.",
      href: `${base}/invitados/respuestas#alergias`,
      accion: "Ver quién",
    });
  }
  if (directo.retiradas > 0) {
    avisos.push({
      nivel: "alta",
      texto: `${plural(directo.retiradas, "foto retirada", "fotos retiradas")} por un invitado: pendiente de revisar`,
      detalle: "Ya no se ven en la pantalla ni en el álbum. Decidid si se quedan fuera o las restauráis.",
      href: `${base}/directo?fotos=retiradas#t-galeria`,
      accion: "Revisarlas",
    });
  }
  if (directo.avisoBorrado && directo.borrado) {
    avisos.push({
      nivel: "alta",
      texto: `El álbum de fotos se borra el ${formatearFecha(directo.borrado, { day: "numeric", month: "long", year: "numeric" })}`,
      detalle: "Descargad el ZIP con todas las fotos y los mensajes antes de esa fecha.",
      href: `${base}/directo#t-galeria`,
      accion: "Descargar",
    });
  }
  if (sinLeer > 0) {
    avisos.push({
      nivel: "media",
      texto: `${plural(sinLeer, "buen deseo nuevo", "buenos deseos nuevos")} en vuestro libro`,
      detalle: "Los de la invitación ya se ven en ella. Echadles un vistazo y guardad vuestros favoritos.",
      href: `${base}/deseos?ver=nuevos#t-deseos`,
      accion: "Leerlos",
    });
  }
  const hecha = solicitudes.find((x) => x.estado === "hecha" && haceDias(x.actualizado, ahora) < 3);
  if (hecha) {
    avisos.push({
      nivel: "media",
      texto: "Hecho: vuestro cambio ya está en la invitación",
      detalle: `«${hecha.texto.slice(0, 90)}${hecha.texto.length > 90 ? "…" : ""}»`,
      href: `${base}/cambios`,
      accion: "Ver",
    });
  }
  avisos.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === "alta" ? -1 : 1));

  const ultimas = rsvps.slice(0, 5);
  const accesos: { href: string; texto: string; icono: IconoPanelId; externo?: boolean }[] = [
    { href: `${base}/invitados#anadir`, texto: "Añadir invitados", icono: "mas_simple" },
    { href: `${base}/invitados?estado=pendiente&recordar=1`, texto: "Recordar a quien falta", icono: "whatsapp" },
    { href: `${base}/imprimir/invitados`, texto: "Imprimir la lista", icono: "imprimir" },
    { href: `${base}/exportar?tipo=personas`, texto: "Excel para el catering", icono: "descargar" },
    { href: `${base}/cambios`, texto: "Pedir un cambio", icono: "cambio" },
    ...(inv.estado === "publicada" ? [{ href: `/i/${slug}`, texto: "Ver la invitación", icono: "ojo" as const, externo: true }] : []),
  ];

  return (
    <>
      <header className="mb-8">
        <p className={ui.eyebrow}>{formatearFecha(inv.pareja.fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className={`${ui.h1} mt-1.5`}>
          {inv.pareja.a} &amp; {inv.pareja.b}
        </h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* ── cuenta atrás */}
        <section aria-labelledby="t-cuenta" className={`${ui.tarjeta} grano relative overflow-hidden`}>
          <h2 id="t-cuenta" className="sr-only">Cuenta atrás</h2>
          {esHoy ? (
            <>
              <p className="display text-[clamp(2.2rem,8vw,3.2rem)] leading-none text-[var(--acento)]">¡Hoy es vuestro día!</p>
              <p className={`mt-3 ${ui.texto} ${ui.suave}`}>Disfrutadlo. Las fotos y los deseos de hoy los tenéis en «En directo» y en el libro.</p>
              <Link href={`${base}/directo`} className={`${ui.botonLleno} mt-5`}>Abrir En directo</Link>
            </>
          ) : celebrada ? (
            <>
              <p className="display text-[clamp(2rem,7vw,2.8rem)] leading-none">Vuestros recuerdos</p>
              <p className={`mt-3 ${ui.texto} ${ui.suave}`}>
                La boda ya se celebró. Vuestro libro de buenos deseos está listo para imprimirlo, y las fotos, para descargarlas.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`${base}/deseos#t-libro`} className={ui.botonLleno}>Descargar el libro</Link>
                <Link href={`${base}/directo#t-galeria`} className={ui.boton}>Ver las fotos</Link>
              </div>
            </>
          ) : (
            <>
              <p className="flex items-baseline gap-3">
                <span className="display text-[clamp(3.4rem,14vw,5rem)] leading-none tabular-nums text-[var(--acento)]">{dias}</span>
                <span className="text-[1.1rem]">{dias === 1 ? "día para la boda" : "días para la boda"}</span>
              </p>
              <p className={`mt-3 ${ui.texto} ${ui.suave}`}>
                {dias <= 7
                  ? "Es la semana. Imprimid la lista de invitados y las tarjetas del QR de deseos."
                  : dias <= 30
                    ? "Último mes: buen momento para cerrar números con el catering."
                    : "Hay tiempo de sobra. Id mandando las invitaciones con calma."}
              </p>
              {dias <= 7 && (
                <Link href={`${base}/imprimir/deseos-qr`} className={`${ui.botonLleno} mt-5`}>Imprimir las tarjetas del QR</Link>
              )}
            </>
          )}
        </section>

        {/* ── progreso */}
        <section aria-labelledby="t-progreso" className={ui.tarjeta}>
          <h2 id="t-progreso" className={`${ui.eyebrow} mb-4`}>Confirmaciones</h2>
          {invitados.length === 0 && rsvps.length === 0 ? (
            <p className={`${ui.texto} ${ui.suave}`}>
              Aquí veréis cómo van las respuestas en cuanto mandéis las primeras invitaciones.
            </p>
          ) : (
            <Progreso vienen={r.confirmados} noVienen={r.noVienen} pendientes={r.plazasSinRespuesta} />
          )}
        </section>
      </div>

      {/* ── atención */}
      <section aria-labelledby="t-atencion" className="mt-10">
        <h2 id="t-atencion" className={ui.h2}>Lo que necesita vuestra atención</h2>
        {avisos.length === 0 ? (
          <p className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--verde-claro)] p-5 text-[var(--verde)]">
            <IconoPanel id="check" />
            Todo al día. No hay nada pendiente ahora mismo.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {avisos.slice(0, 3).map((a) => (
              <li
                key={a.texto}
                className={`${ui.tarjeta} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${a.nivel === "alta" ? "border-l-4 border-l-[var(--acento)]" : ""}`}
              >
                <div className="flex min-w-0 gap-3">
                  <IconoPanel id={a.nivel === "alta" ? "alerta" : "campana"} className={`mt-0.5 shrink-0 ${a.nivel === "alta" ? "text-[var(--acento)]" : "text-[var(--suave)]"}`} />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {a.nivel === "alta" && <span className="sr-only">Importante: </span>}
                      {a.texto}
                    </p>
                    {a.detalle && <p className={`mt-1 text-[0.95rem] ${ui.suave}`}>{a.detalle}</p>}
                  </div>
                </div>
                <Link href={a.href} className={`${a.nivel === "alta" ? ui.botonLleno : ui.boton} shrink-0`}>
                  {a.accion}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {avisos.length > 3 && (
          <ul className={`mt-3 flex flex-col gap-1 text-[0.95rem] ${ui.suave}`} aria-label="Otros avisos">
            {avisos.slice(3).map((a) => (
              <li key={a.texto}>
                <Link href={a.href} className={`inline-flex min-h-12 items-center ${ui.enlace}`}>
                  {a.texto}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── cifras */}
      <section aria-labelledby="t-cifras" className="mt-10">
        <h2 id="t-cifras" className="sr-only">Cifras</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Vienen", r.confirmados, "personas"],
            ["No vienen", r.noVienen, "personas"],
            ["Sin respuesta", r.sinRespuesta.length, invitados.length ? `${r.plazasSinRespuesta} plazas` : "sin lista"],
            ["Deseos nuevos", sinLeer, "en vuestro libro"],
          ].map(([t, v, nota]) => (
            <div key={t} className={ui.tarjeta}>
              <dt className={`text-[0.85rem] ${ui.suave}`}>{t}</dt>
              <dd className="display mt-1 text-[2rem] leading-none tabular-nums">{v}</dd>
              <dd className={`mt-1 text-[0.85rem] ${ui.suave}`}>{nota}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* ── últimas respuestas */}
        <section aria-labelledby="t-ultimas">
          <h2 id="t-ultimas" className={ui.h2}>Últimas respuestas</h2>
          {ultimas.length === 0 ? (
            <p className={`mt-4 ${ui.texto} ${ui.suave}`}>Todavía nadie. En cuanto alguien conteste, lo veréis aquí.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--linea)] border-y border-[var(--linea)]">
              {ultimas.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block truncate">{x.nombre}</span>
                    <span className={`text-[0.88rem] ${ui.suave}`}>
                      {cuandoRelativo(x.actualizado_en, ahora)}, {formatearHora(x.actualizado_en)}
                    </span>
                  </span>
                  <span className={`shrink-0 text-[0.95rem] ${x.asiste ? "text-[var(--verde)]" : ui.suave}`}>
                    {x.asiste ? (x.personas.length > 1 ? `Vienen ${x.personas.length}` : "Viene") : "No viene"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {rsvps.length > 5 && (
            <Link href={`${base}/invitados/respuestas`} className={`mt-4 inline-flex min-h-12 items-center ${ui.enlace}`}>
              Ver todas las respuestas
            </Link>
          )}
        </section>

        {/* ── accesos */}
        <section aria-labelledby="t-accesos">
          <h2 id="t-accesos" className={ui.h2}>Accesos rápidos</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {accesos.map((x) => (
              <li key={x.texto}>
                <a
                  href={x.href}
                  {...(x.externo ? { target: "_blank", rel: "noopener" } : {})}
                  className={`${ui.tarjeta} flex min-h-24 flex-col justify-between gap-3 hover:border-[var(--acento)]/40 ${ui.foco}`}
                >
                  <IconoPanel id={x.icono} className="text-[var(--acento)]" />
                  <span className="text-[0.98rem] font-medium">
                    {x.texto}
                    {x.externo && <span className="sr-only"> (se abre en otra pestaña)</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
