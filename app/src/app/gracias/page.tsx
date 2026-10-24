import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import MarcoPago, { AvisoDemo, BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/components/pagos/MarcoPago";
import Icono from "@/components/Iconos";
import SelloAlianzas from "@/components/SelloAlianzas";
import { enlaceWhatsApp } from "@/lib/contacto";
import { pedidoPorId, pedidoPorToken, type Pedido } from "@/lib/pagos/pedidos";
import { esPlanCerrado, euros, PLANES_PAGO } from "@/lib/pagos/productos";
import { campoDe, ID_SESION, leerSesionCheckout } from "@/lib/pagos/stripe";

export const metadata: Metadata = {
  title: "Gracias · Invitoo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Después de pagar. Llega de tres sitios:
 *   · ?sesion=cs_…  — vuelta de Stripe Checkout (plan o cobro). Se lee la
 *     sesión en Stripe para saber qué y a quién; el pedido lo crea el
 *     webhook, no esta página (una página que alguien recarga no cobra ni
 *     crea nada).
 *   · ?pedido=<token> — modo demo, o un cobro ya pagado.
 *   · ?error=checkout — no se pudo abrir Stripe.
 */

type Vista = {
  demo: boolean;
  confirmado: boolean;
  tipo: "plan" | "cobro" | "otro";
  titulo: string;
  linea: string | null;
  email: string | null;
  plazo: string | null;
  resto: number | null;
  mensaje: string;
};

/** «ana@gmail.com» → «a••@gmail.com»: se reconoce, no se expone. */
function velado(email: string | null) {
  if (!email) return null;
  const [u, d] = email.split("@");
  return d ? `${u.slice(0, 1)}••@${d}` : null;
}

function desdePedido(p: Pedido): Vista {
  const demo = p.estado_pago === "demo";
  const plan = p.tipo === "plan" && esPlanCerrado(p.plan) ? PLANES_PAGO[p.plan] : null;
  return {
    demo,
    confirmado: true,
    tipo: p.tipo,
    titulo: p.tipo === "plan" ? (p.pareja ? `¡Ya está reservado, ${p.pareja}!` : "¡Ya está reservado!") : p.pareja ? `Gracias, ${p.pareja}` : "Gracias: pago recibido",
    linea: `${plan?.nombre ?? p.concepto} · ${euros(p.pagado ?? p.importe)}`,
    email: p.email,
    plazo: plan?.plazo ?? null,
    resto: p.parte === "senal" && p.total ? p.total - p.importe : null,
    mensaje: p.tipo === "plan" ? `Hola, acabamos de reservar «${plan?.nombre ?? p.concepto}»${p.pareja ? `. Somos ${p.pareja}` : ""}.` : `Hola, acabamos de pagar «${p.concepto}».`,
  };
}

async function vista(sp: Record<string, string | string[] | undefined>): Promise<Vista | "error" | null> {
  const uno = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  if (uno("error")) return "error";

  const token = uno("pedido");
  if (token) {
    const p = await pedidoPorToken(token);
    if (!p) return null;
    if (p.estado_pago === "pendiente") redirect(`/pagar/${token}`);
    return desdePedido(p);
  }

  const id = uno("sesion");
  if (!ID_SESION.test(id)) return null;
  const s = await leerSesionCheckout(id);
  if (!s) return null;
  const confirmado = s.payment_status === "paid";
  const email = s.customer_details?.email ?? null;
  if (s.metadata?.tipo === "cobro" && s.metadata.pedido) {
    const p = await pedidoPorId(s.metadata.pedido);
    if (p) return { ...desdePedido(p), confirmado, email: email ?? p.email, demo: false };
  }
  if (s.metadata?.tipo === "plan" && esPlanCerrado(s.metadata.plan)) {
    const plan = PLANES_PAGO[s.metadata.plan];
    const a = campoDe(s, "novioa", 60);
    const b = campoDe(s, "noviob", 60);
    const pareja = a && b ? `${a} y ${b}` : (a ?? b);
    return {
      demo: false,
      confirmado,
      tipo: "plan",
      titulo: pareja ? `¡Ya está reservado, ${pareja}!` : "¡Ya está reservado!",
      linea: `${plan.nombre} · ${euros(s.amount_total ?? plan.importe)}`,
      email,
      plazo: plan.plazo,
      resto: null,
      mensaje: `Hola, acabamos de reservar «${plan.nombre}»${pareja ? `. Somos ${pareja}` : ""}.`,
    };
  }
  return null;
}

export default async function Gracias({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const v = await vista(await searchParams);

  if (v === "error") {
    return (
      <MarcoPago>
        <h1 className="display text-center text-[clamp(2.3rem,9vw,3.2rem)] leading-[1.05]">No hemos podido abrir el pago</h1>
        <p className="mx-auto mt-5 max-w-[28rem] text-center text-[1.0625rem] leading-[1.7] opacity-75">
          No se ha cobrado nada. Probad otra vez en un momento o escribidnos y lo cerramos por WhatsApp.
        </p>
        <div className="mt-10 flex flex-col gap-3">
          <a href={enlaceWhatsApp("Hola, queríamos reservar y el pago no se ha abierto.")} target="_blank" rel="noopener noreferrer" className={BOTON_PRINCIPAL}>
            Escribirnos por WhatsApp
          </a>
          <Link href="/precios" className={BOTON_SECUNDARIO}>
            Volver a los precios
          </Link>
        </div>
      </MarcoPago>
    );
  }

  // Sin datos (enlace viejo, sin claves…): un gracias igual de cálido.
  const x: Vista = v ?? {
    demo: false,
    confirmado: true,
    tipo: "otro",
    titulo: "Gracias",
    linea: null,
    email: null,
    plazo: null,
    resto: null,
    mensaje: "Hola, acabamos de hacer un pago en Invitoo.",
  };
  const correo = velado(x.email);

  const pasos =
    x.tipo === "plan"
      ? [
          {
            titulo: "La confirmación, en vuestro correo",
            texto: correo ? `Os la hemos mandado a ${correo}. La factura os llega de Stripe en otro correo.` : "La factura os llega de Stripe por correo.",
          },
          {
            titulo: "Os escribimos en menos de un día laborable",
            texto: "Para fijar la videollamada de diseño: unos veinte minutos para que nos contéis vuestra boda.",
          },
          {
            titulo: x.plazo ? `${x.plazo} desde la videollamada` : "Lista en pocos días",
            texto: "Y cambios ilimitados hasta que la publiquéis. Si cambiáis de idea antes de empezar el diseño, os lo devolvemos entero.",
          },
        ]
      : [
          {
            titulo: "El recibo, en vuestro correo",
            texto: correo ? `Os lo hemos mandado a ${correo}, con la factura de Stripe aparte.` : "La factura os llega de Stripe por correo.",
          },
          ...(x.resto
            ? [{ titulo: `Queda el resto: ${euros(x.resto)}`, texto: "Os mandaremos el enlace cuando toque. Ahora no tenéis que hacer nada más." }]
            : [{ titulo: "Seguimos con lo vuestro", texto: "Si hay cualquier cosa, estamos a un mensaje." }]),
        ];

  return (
    <MarcoPago aviso={x.demo ? <AvisoDemo /> : undefined}>
      <div className="text-center">
        <SelloAlianzas size={56} className="mx-auto text-[var(--acento)]" />
        <p className="mt-6 text-[1rem] uppercase tracking-[0.24em] text-[var(--acento)]">
          {x.confirmado ? (x.tipo === "plan" ? "Reserva confirmada" : "Pago recibido") : "Confirmando el pago"}
        </p>
        <h1 className="display mt-3 text-[clamp(2.3rem,9vw,3.4rem)] leading-[1.05] [text-wrap:balance]">{x.titulo}</h1>
        {x.linea && <p className="mt-4 text-[1.125rem] tabular-nums opacity-80">{x.linea}</p>}
        {!x.confirmado && (
          <p className="mx-auto mt-4 max-w-[28rem] text-[1.0625rem] leading-[1.7] opacity-75">
            Vuestro banco aún lo está confirmando. En cuanto llegue, os escribimos; no hace falta pagar otra vez.
          </p>
        )}
      </div>

      <ol className="mt-12 flex flex-col">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="flex gap-5 border-t border-[var(--tinta)]/12 py-6">
            <span aria-hidden className="display w-6 shrink-0 text-[1.5rem] leading-none text-[var(--acento)] tabular-nums">
              {i + 1}
            </span>
            <div>
              <h2 className="text-[1.125rem] font-medium leading-snug">{p.titulo}</h2>
              <p className="mt-1.5 text-[1.0625rem] leading-[1.65] opacity-75">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-col gap-3">
        <a href={enlaceWhatsApp(x.mensaje)} target="_blank" rel="noopener noreferrer" className={BOTON_PRINCIPAL}>
          <Icono id="mensaje" size={20} />
          Escribirnos ya por WhatsApp
        </a>
        <Link href="/plantillas" className={BOTON_SECUNDARIO}>
          Mirar las plantillas mientras tanto
        </Link>
      </div>
    </MarcoPago>
  );
}
