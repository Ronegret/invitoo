import Link from "next/link";
import NuevoCobro, { AccionesCobro, Compartir } from "@/components/estudio/Cobrar";
import { listarTodas } from "@/lib/datos";
import { formatearFecha } from "@/lib/fecha";
import { baseUrl } from "@/lib/momentos/servidor";
import { modoCobro } from "@/lib/pagos/modo";
import { listarPedidos, type EstadoPagoPedido } from "@/lib/pagos/pedidos";
import { euros } from "@/lib/pagos/productos";

export const dynamic = "force-dynamic";

const ESTADO: Record<EstadoPagoPedido, string> = {
  pendiente: "Sin pagar",
  pagado: "Pagado",
  demo: "Pagado (demo)",
  reembolsado: "Reembolsado",
  disputado: "En disputa",
  fallido: "Fallido",
  anulado: "Anulado",
};

/**
 * Cobros a medida (Estudio y presupuestos) y el historial de lo cobrado.
 * El layout de /estudio ya exige la sesión; las acciones la vuelven a pedir.
 */
export default async function Cobros({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [cobros, reservas, bodas, base] = await Promise.all([listarPedidos("cobro"), listarPedidos("plan"), listarTodas(), baseUrl()]);
  const opciones = bodas.flatMap((b) => (b.id ? [{ id: b.id, nombre: `${b.pareja.a} & ${b.pareja.b} · ${b.slug}` }] : []));
  const modo = modoCobro();
  const conResto = new Set(cobros.filter((c) => c.parte === "resto" && c.estado_pago !== "anulado").map((c) => c.grupo));
  const cobrado = [...cobros, ...reservas]
    .filter((p) => p.estado_pago === "pagado")
    .reduce((s, p) => s + (p.pagado ?? p.importe), 0);

  return (
    <main className="mx-auto max-w-[60rem] px-5 py-12">
      <p className="text-[0.78rem] uppercase tracking-[0.28em] opacity-60">
        <Link href="/estudio" className="underline-offset-4 hover:underline">Bodas</Link> · Cobros
      </p>
      <h1 className="display mt-2 text-[clamp(2.2rem,8vw,3.2rem)]">Cobros</h1>
      <p className="mt-2 opacity-70">
        {modo === "stripe" ? `Cobrado con Stripe: ${euros(cobrado)}.` : modo === "demo" ? "Modo demo: sin claves de Stripe, no se cobra nada de verdad." : "Falta STRIPE_SECRET_KEY: los enlaces no pueden cobrar."}
      </p>

      <div className="mt-10">
        <NuevoCobro bodas={opciones} boda={typeof sp.boda === "string" ? sp.boda : undefined} />
      </div>

      <h2 className="display mt-16 text-[1.8rem]">Enlaces creados</h2>
      {cobros.length === 0 ? (
        <p className="mt-4 opacity-60">Ninguno todavía.</p>
      ) : (
        <ul className="mt-6 flex flex-col">
          {cobros.map((c) => {
            const sinPagar = c.estado_pago === "pendiente";
            const pagado = c.estado_pago === "pagado" || c.estado_pago === "demo";
            const resto = c.parte === "senal" && pagado && c.total && !conResto.has(c.id) ? euros(c.total - c.importe) : null;
            return (
              <li key={c.id} className={`border-t border-[var(--tinta)]/12 py-6 ${c.estado_pago === "anulado" ? "opacity-55" : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="display text-[1.35rem]">{c.concepto}</p>
                  <p className="text-[1.05rem] tabular-nums">{euros(c.importe)}</p>
                </div>
                <p className="mt-1 text-[0.88rem] opacity-65">
                  <span className={sinPagar ? "font-semibold text-[var(--acento)]" : ""}>{ESTADO[c.estado_pago]}</span>
                  {" · "}
                  {c.pareja ?? "Sin pareja"}
                  {c.slug ? ` · ${c.slug}` : ""}
                  {" · "}
                  {formatearFecha(c.creado, { day: "numeric", month: "short" })}
                  {c.parte === "senal" && c.total ? ` · señal de ${euros(c.total)}` : ""}
                  {c.parte === "resto" ? " · resto" : ""}
                </p>
                {sinPagar && (
                  <Compartir
                    enlace={`${base}/pagar/${c.token}`}
                    concepto={c.concepto}
                    importe={euros(c.importe)}
                    telefono={c.telefono}
                    email={c.email}
                    pareja={c.pareja}
                  />
                )}
                <AccionesCobro id={c.id} pendiente={sinPagar} resto={resto} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
