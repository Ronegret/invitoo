import Link from "next/link";
import Reserva from "@/components/estudio/Reserva";
import { listarTodas } from "@/lib/datos";
import { formatearFecha, formatearHora } from "@/lib/fecha";
import { listarPedidos, type EstadoPedido } from "@/lib/pagos/pedidos";
import { euros, nombrePlan } from "@/lib/pagos/productos";
import { bandejaSolicitudes, TEXTO_ESTADO } from "@/lib/solicitudes/datos";
import FormEstado from "./FormEstado";

const TEXTO_PEDIDO: Record<EstadoPedido, string> = { nueva: "Nueva", en_curso: "En curso", hecha: "Hecha" };

export const dynamic = "force-dynamic";

/**
 * La bandeja de solicitudes («Pedir un cambio») de todas las bodas.
 * Abiertas primero. Cada nueva llega también por email a `ESTUDIO_EMAIL`.
 *
 * Arriba, las RESERVAS pagadas en /precios (pedidos de plan del webhook de
 * Stripe): la pareja ya ha pagado y espera que le escribamos. Se vinculan a
 * su boda cuando se crea.
 */
export default async function Solicitudes() {
  const [todas, pedidos, bodas] = await Promise.all([bandejaSolicitudes(), listarPedidos("plan"), listarTodas()]);
  const abiertas = todas.filter((s) => s.estado !== "hecha").length;
  const orden: Record<EstadoPedido, number> = { nueva: 0, en_curso: 1, hecha: 2 };
  const reservas = pedidos
    .filter((p) => p.estado_pago !== "pendiente" && p.estado_pago !== "anulado")
    .sort((a, b) => orden[a.estado] - orden[b.estado] || b.creado.localeCompare(a.creado));
  const porAtender = reservas.filter((p) => p.estado !== "hecha" && (p.estado_pago === "pagado" || p.estado_pago === "demo")).length;
  const whatsapp = (tel: string) => {
    const d = tel.replace(/\D/g, "");
    return d.length === 9 ? `34${d}` : d;
  };
  const opciones = bodas.flatMap((b) => (b.id ? [{ id: b.id, nombre: `${b.pareja.a} & ${b.pareja.b} · ${b.slug}` }] : []));

  return (
    <main className="mx-auto max-w-[60rem] px-5 py-12">
      <p className="text-[0.78rem] uppercase tracking-[0.28em] opacity-60">
        <Link href="/estudio" className="underline-offset-4 hover:underline">Bodas</Link> · Solicitudes
      </p>
      <h1 className="display mt-2 text-[clamp(2.2rem,8vw,3.2rem)]">Bandeja</h1>
      <p className="mt-2 opacity-70">
        {porAtender > 0 ? `${porAtender === 1 ? "1 reserva" : `${porAtender} reservas`} por atender · ` : ""}
        {abiertas === 0 ? "Cambios: todo atendido." : abiertas === 1 ? "1 cambio abierto." : `${abiertas} cambios abiertos.`}
      </p>

      {reservas.length > 0 && (
        <section aria-labelledby="t-reservas" className="mt-10">
          <h2 id="t-reservas" className="display text-[1.8rem]">Reservas pagadas</h2>
          <ul className="mt-4 flex flex-col">
            {reservas.map((p) => (
              <li key={p.id} className={`border-t border-[var(--tinta)]/12 py-6 ${p.estado === "hecha" ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="display text-[1.4rem]">{p.pareja ?? "Pareja sin nombre"}</p>
                  <p className="text-[0.82rem] opacity-60">
                    <span className={p.estado === "nueva" ? "font-semibold text-[var(--acento)]" : ""}>{TEXTO_PEDIDO[p.estado]}</span>
                    {" · "}
                    {formatearFecha(p.creado, { day: "numeric", month: "short" })}, {formatearHora(p.creado)}
                  </p>
                </div>
                <p className="mt-2 text-[1.02rem]">
                  {p.plan ? nombrePlan(p.plan) : p.concepto} · {euros(p.pagado ?? p.importe)}
                  {p.descuento ? ` (con ${euros(p.descuento)} de descuento)` : ""}
                  {p.estado_pago === "demo" ? " · demo" : p.estado_pago !== "pagado" ? ` · ${p.estado_pago}` : ""}
                </p>
                <p className="mt-1 text-[0.95rem] opacity-75">
                  {p.fecha_boda ? `Boda: ${p.fecha_boda}` : "Sin fecha"}
                  {p.email ? ` · ${p.email}` : ""}
                  {p.telefono ? ` · ${p.telefono}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-[0.82rem] uppercase tracking-[0.14em]">
                  {p.telefono && (
                    <a
                      href={`https://wa.me/${whatsapp(p.telefono)}?text=${encodeURIComponent(`Hola${p.pareja ? `, ${p.pareja}` : ""}: soy Rodrigo, de Invitoo. ¡Gracias por la reserva! ¿Cuándo os va bien la videollamada de diseño?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                    >
                      Escribir por WhatsApp
                    </a>
                  )}
                  {p.invitacion_id ? (
                    <Link href={`/estudio/${p.invitacion_id}`} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Editar la boda</Link>
                  ) : (
                    <Link href="/estudio/nueva" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Crear la boda</Link>
                  )}
                </div>
                <Reserva id={p.id} estado={p.estado} vinculada={Boolean(p.invitacion_id)} bodas={opciones} />
              </li>
            ))}
          </ul>
          <h2 className="display mt-14 text-[1.8rem]">Solicitudes de cambio</h2>
        </section>
      )}

      {todas.length === 0 ? (
        <p className="mt-12 opacity-60">Ninguna por ahora. Cuando una pareja pida un cambio desde su panel, aparece aquí.</p>
      ) : (
        <ul className="mt-10 flex flex-col">
          {todas.map((s) => (
            <li key={s.id} className={`border-t border-[var(--tinta)]/12 py-6 ${s.estado === "hecha" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="display text-[1.4rem]">{s.pareja}</p>
                <p className="text-[0.82rem] opacity-60">
                  <span className={s.estado === "recibida" ? "font-semibold text-[var(--acento)]" : ""}>{TEXTO_ESTADO[s.estado]}</span>
                  {" · "}
                  {formatearFecha(s.creado, { day: "numeric", month: "short" })}, {formatearHora(s.creado)}
                  {s.autor ? ` · ${s.autor}` : ""}
                </p>
              </div>
              <p className="mt-3 max-w-[44rem] whitespace-pre-line text-[1.02rem] leading-relaxed">{s.texto}</p>
              {s.seccion && <p className="mt-1 text-[0.88rem] opacity-65">Sección: {s.seccion}</p>}
              {s.foto && (
                <a href={s.foto} target="_blank" rel="noopener" className="mt-3 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.foto} alt="Adjunto de la pareja" className="h-28 w-28 rounded-xl object-cover" />
                </a>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-[0.82rem] uppercase tracking-[0.14em]">
                {s.slug && (
                  <>
                    <Link href={`/estudio/${s.invitacionId}`} className="underline-offset-4 hover:underline">Editar la boda</Link>
                    <Link href={`/i/${s.slug}`} className="underline-offset-4 hover:underline">Ver invitación</Link>
                  </>
                )}
              </div>
              <FormEstado id={s.id} estado={s.estado} respuesta={s.respuesta} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
