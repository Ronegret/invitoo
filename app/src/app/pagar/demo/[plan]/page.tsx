import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FormDemo from "@/components/pagos/FormDemo";
import MarcoPago, { AvisoDemo } from "@/components/pagos/MarcoPago";
import { modoCobro } from "@/lib/pagos/modo";
import { esPlanCerrado, euros, PLANES_PAGO } from "@/lib/pagos/productos";

export const metadata: Metadata = {
  title: "Reserva de prueba · Invitoo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * El sitio de Stripe Checkout cuando no hay claves (modo demo, solo fuera de
 * producción o con PAGOS_DEMO=1). En producción con claves, no existe.
 */
export default async function PagoDemo({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = await params;
  if (modoCobro() !== "demo" || !esPlanCerrado(plan)) notFound();
  const p = PLANES_PAGO[plan];
  return (
    <MarcoPago aviso={<AvisoDemo>Modo demo: aquí iría Stripe. No se cobra nada.</AvisoDemo>}>
      <p className="text-center text-[1rem] uppercase tracking-[0.24em] text-[var(--acento)]">Reservar</p>
      <h1 className="display mt-3 text-center text-[clamp(2.2rem,9vw,3.2rem)] leading-[1.05]">{p.nombre}</h1>
      <p className="mt-3 text-center text-[1.125rem] tabular-nums opacity-80">{euros(p.importe)} · IVA incluido</p>
      <div className="mt-10">
        <FormDemo plan={p.id} importe={euros(p.importe)} />
      </div>
    </MarcoPago>
  );
}
