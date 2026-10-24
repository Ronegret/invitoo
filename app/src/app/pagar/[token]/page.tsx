import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BotonEnviar from "@/components/pagos/BotonEnviar";
import MarcoPago, { AvisoDemo, BOTON_PRINCIPAL } from "@/components/pagos/MarcoPago";
import { enlaceWhatsApp } from "@/lib/contacto";
import { pagarPedido } from "@/lib/pagos/acciones-planes";
import { modoCobro } from "@/lib/pagos/modo";
import { pedidoPorToken, TOKEN } from "@/lib/pagos/pedidos";
import { desglose, euros } from "@/lib/pagos/productos";

export const metadata: Metadata = {
  title: "Pago · Invitoo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * El enlace de un cobro del Estudio (lo crea Rodrigo en /estudio/cobros y lo
 * manda por WhatsApp o email). No abre Stripe al cargar: WhatsApp y Gmail
 * abren los enlaces para hacer la vista previa, y eso crearía sesiones de
 * pago sueltas. Se abre al pulsar «Pagar», que crea una sesión nueva cada
 * vez (las de Checkout caducan a las 24 h; este enlace no caduca).
 */
export default async function Pagar({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  if (!TOKEN.test(token)) notFound();
  const p = await pedidoPorToken(token);
  if (!p || p.tipo !== "cobro") notFound();
  const error = Boolean((await searchParams).error);
  const modo = modoCobro();
  const { base, iva } = desglose(p.importe);
  const parte = p.parte === "senal" ? "Señal" : p.parte === "resto" ? "El resto" : null;

  if (p.estado_pago !== "pendiente") {
    const pagado = p.estado_pago === "pagado" || p.estado_pago === "demo";
    return (
      <MarcoPago>
        <h1 className="display text-center text-[clamp(2.2rem,9vw,3.2rem)] leading-[1.05]">
          {pagado ? "Ya está pagado" : "Este enlace ya no está activo"}
        </h1>
        <p className="mx-auto mt-5 max-w-[28rem] text-center text-[1.0625rem] leading-[1.7] opacity-75">
          {pagado
            ? `«${p.concepto}» consta como pagado. Gracias de nuevo.`
            : "Si os ha llegado por error o necesitáis uno nuevo, escribidnos y os lo mandamos."}
        </p>
        <div className="mt-10">
          <a href={enlaceWhatsApp(`Hola, os escribo por el pago «${p.concepto}».`)} target="_blank" rel="noopener noreferrer" className={BOTON_PRINCIPAL}>
            Escribirnos por WhatsApp
          </a>
        </div>
      </MarcoPago>
    );
  }

  return (
    <MarcoPago aviso={modo === "demo" ? <AvisoDemo>Modo demo: al pulsar «Pagar» no se cobra nada.</AvisoDemo> : undefined}>
      <p className="text-center text-[1rem] uppercase tracking-[0.24em] text-[var(--acento)]">{p.pareja ? `Para ${p.pareja}` : "Vuestro pago"}</p>
      <h1 className="display mt-3 text-center text-[clamp(2.2rem,9vw,3.2rem)] leading-[1.05] [text-wrap:balance]">{p.concepto}</h1>

      <div className="mt-10 rounded-[1.5rem] border border-[var(--tinta)]/12 bg-white/60 p-6 sm:p-8">
        {parte && (
          <p className="text-[1.0625rem] opacity-75">
            {parte}
            {p.total ? ` de un total de ${euros(p.total)}` : ""}
          </p>
        )}
        <p className="display mt-1 text-[clamp(3rem,14vw,4.2rem)] leading-none tabular-nums">{euros(p.importe)}</p>
        <p className="mt-3 text-[1rem] tabular-nums opacity-65">
          IVA (21 %) incluido: {euros(base)} + {euros(iva)} de IVA
        </p>

        {error && (
          <p role="alert" className="mt-6 text-[1.0625rem] text-[var(--acento)]">
            No hemos podido abrir el pago. Probad otra vez en un momento; no se ha cobrado nada.
          </p>
        )}

        {modo === "no" ? (
          <a href={enlaceWhatsApp(`Hola, quiero pagar «${p.concepto}».`)} target="_blank" rel="noopener noreferrer" className={`${BOTON_PRINCIPAL} mt-8`}>
            Pagar por WhatsApp
          </a>
        ) : (
          <form action={pagarPedido} className="mt-8">
            <input type="hidden" name="token" value={p.token} />
            <BotonEnviar className={BOTON_PRINCIPAL}>Pagar {euros(p.importe)}</BotonEnviar>
          </form>
        )}
        <p className="mt-4 text-center text-[1rem] leading-[1.55] opacity-65">
          Pago seguro con Stripe. Al pagar aceptáis las{" "}
          <Link href="/condiciones" className="underline underline-offset-4">
            condiciones de contratación
          </Link>
          .
        </p>
      </div>
    </MarcoPago>
  );
}
