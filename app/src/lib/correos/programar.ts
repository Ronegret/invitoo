import "server-only";

import { enlaceWhatsApp } from "@/lib/contacto";
import { invitacionPorSlug, listarMiembros, obtenerPorId } from "@/lib/datos";
import { SITIO_URL } from "@/lib/enlaces";
import { contar, diaMadrid, diasEntre } from "@/lib/visitas/registrar";
import { aMadridISO } from "@/lib/fecha";
import { leerEnvio } from "./enviar";
import { claveDe, datosParaEstudio, emailsEstudio, enlacesBoda, enviarPaso, pasoDe } from "./motor";
import { fechaLarga } from "./plantillas/base";
import { ESTUDIO_VACIO } from "./plantillas/estudio";
import { SECUENCIA } from "./secuencia";
import type { DatosCorreo, DatosEstudio, Evento, IdCorreo, Paso } from "./tipos";

/**
 * Los disparos AL MOMENTO. Se llama desde el evento (webhook de pagos,
 * solicitud de cambio, pico de visitas, publicación…), siempre dentro de
 * `after()` o con `void`: nunca lanza y nunca retrasa la respuesta.
 *
 *   void programar({ evento: "pago", ... })
 *
 * Por cada disparo se envían los pasos de `SECUENCIA` con ese evento (a los
 * novios o al estudio según su categoría) y, si E2 no la ha declarado, la
 * alerta del estudio que le corresponde. La idempotencia es la de siempre:
 * un webhook repetido no manda nada dos veces.
 */

export type Disparo =
  | {
      evento: "pago";
      /** Id del pedido (clave de la alerta). */
      pedidoId: string;
      email: string | null;
      pareja?: string | null;
      nombres?: { a: string | null; b: string | null };
      fecha?: string | null;
      plan?: string | null;
      /** «Cinco días laborables» (del plan): va en la confirmación. */
      plazo?: string | null;
      importe: number;
      demo?: boolean;
    }
  | { evento: "vinculo"; invitacionId: string; email: string }
  | { evento: "publicada"; invitacionId: string }
  | { evento: "cobro"; pedidoId: string; importe: number; concepto: string; pareja?: string | null; slug?: string | null; demo?: boolean }
  | { evento: "solicitud"; solicitudId: string; slug: string; texto: string; seccion?: string | null }
  | { evento: "pico"; vistas: number; media: number; ruta?: string | null }
  | { evento: "rsvp"; slug: string };

const ALERTA: Partial<Record<Evento, IdCorreo>> = {
  pago: "alerta-reserva",
  cobro: "alerta-cobro",
  solicitud: "alerta-cambio",
  pico: "alerta-pico",
};

function pasosDe(evento: Evento): Paso[] {
  const xs = SECUENCIA.filter((p) => p.disparador.tipo === "evento" && p.disparador.evento === evento);
  const alerta = ALERTA[evento];
  if (alerta && !xs.some((p) => p.id === alerta)) xs.push(pasoDe(alerta));
  return xs;
}

const diaDe = (iso: string | null | undefined) => (iso ? aMadridISO(iso).slice(0, 10) : null);

function estudioCon(alerta: NonNullable<DatosEstudio["alerta"]>, enlace: string): DatosEstudio {
  const hoy = diaMadrid();
  return { ...ESTUDIO_VACIO, desde: hoy, hasta: hoy, alerta, enlaceVisitas: `${SITIO_URL}/estudio/visitas`, enlaceEstudio: `${SITIO_URL}${enlace}` };
}

async function alEstudio(paso: Paso, e: DatosEstudio, clave: string) {
  for (const email of emailsEstudio()) await enviarPaso(paso, email, datosParaEstudio(e), `${clave}:${email}`, { id: null, slug: e.alerta?.boda?.slug ?? null });
}

export async function programar(d: Disparo): Promise<void> {
  try {
    if (d.evento === "rsvp") {
      await contar("rsvp", d.slug);
      return;
    }
    if (d.evento === "pago") await contar("checkout", "pagado");

    for (const paso of pasosDe(d.evento)) {
      if (paso.categoria === "estudio") {
        await alertar(paso, d);
        continue;
      }
      await aLosNovios(paso, d);
    }
  } catch (e) {
    console.error("[correos.programar]", d.evento, e);
  }
}

async function alertar(paso: Paso, d: Disparo) {
  switch (d.evento) {
    case "pago":
      return alEstudio(
        paso,
        estudioCon(
          {
            titulo: `${d.demo ? "Reserva demo" : "Reserva pagada"}${d.plan ? `: ${d.plan}` : ""}`,
            detalle: [d.fecha ? `Boda: ${fechaLarga(diaDe(d.fecha))}` : "Sin fecha todavía", d.email].filter(Boolean).join(" · "),
            importe: d.importe,
            boda: d.pareja ? { slug: "", pareja: d.pareja } : null,
          },
          "/estudio/solicitudes",
        ),
        `${paso.id}:${d.pedidoId}`,
      );
    case "cobro":
      return alEstudio(
        paso,
        estudioCon(
          {
            titulo: `${d.demo ? "Cobro demo" : "Cobro pagado"}: ${d.concepto}`,
            detalle: d.pareja ?? null,
            importe: d.importe,
            boda: d.slug ? { slug: d.slug, pareja: d.pareja ?? d.slug } : null,
          },
          "/estudio/cobros",
        ),
        `${paso.id}:${d.pedidoId}`,
      );
    case "solicitud": {
      const inv = await invitacionPorSlug(d.slug).catch(() => null);
      return alEstudio(
        paso,
        estudioCon(
          {
            titulo: "Nueva solicitud de cambio",
            detalle: `${d.seccion ? `${d.seccion}: ` : ""}${d.texto.slice(0, 300)}`,
            boda: { slug: d.slug, pareja: inv ? `${inv.pareja.a} y ${inv.pareja.b}` : d.slug },
          },
          "/estudio/solicitudes",
        ),
        `${paso.id}:${d.solicitudId}`,
      );
    }
    case "pico":
      return alEstudio(
        paso,
        estudioCon({ titulo: "Pico de visitas", detalle: d.ruta ?? null, pico: { vistas: d.vistas, media: d.media, ruta: d.ruta ?? null } }, "/estudio/visitas"),
        `${paso.id}:${diaMadrid()}`,
      );
    default:
      return;
  }
}

async function aLosNovios(paso: Paso, d: Disparo) {
  if (d.evento === "pago") {
    if (!d.email) return;
    const email = d.email.toLowerCase();
    const fecha = diaDe(d.fecha);
    const datos: DatosCorreo = {
      pareja: { a: d.nombres?.a ?? d.pareja ?? "", b: d.nombres?.b ?? "" },
      fecha,
      slug: "",
      enlaces: enlacesBoda("", email),
      diasParaBoda: fecha ? diasEntre(diaMadrid(), fecha) : null,
      plan: d.plan ?? null,
      // E3: esta bienvenida ES la confirmación de la reserva (el antiguo
      // «Vuestra invitación está reservada» de pagos/cobrar.ts ya no sale).
      reserva: {
        importe: d.importe,
        demo: Boolean(d.demo),
        plazo: d.plazo ?? null,
        whatsapp: enlaceWhatsApp(`Hola, acabamos de reservar${d.plan ? ` «${d.plan}»` : ""}${d.pareja ? `. Somos ${d.pareja}` : ""}.`),
        condiciones: `${SITIO_URL}/condiciones`,
      },
    };
    // La bienvenida es una por persona (`bienvenida:<email>`), pero un recibo
    // no se puede perder: si ese email ya la recibió (otra reserva, o vinculó
    // la cuenta antes de pagar), la confirmación sale con la clave del pedido.
    let clave = claveDe(paso, "reserva", email);
    const previa = await leerEnvio(clave).catch(() => null);
    if (previa && ["enviado", "buzon", "omitido"].includes(previa.estado)) clave = `bienvenida:${d.pedidoId}:${email}`;
    // Confirmación de compra: transaccional pura. Sin preferencias, sin límite diario y sin List-Unsubscribe.
    await enviarPaso(paso, email, datos, clave, { id: null, slug: null }, undefined, { prioritario: true });
    return;
  }
  if (d.evento === "vinculo" || d.evento === "publicada") {
    const inv = await obtenerPorId(d.invitacionId).catch(() => null);
    if (!inv) return;
    const fecha = diaDe(inv.pareja.fecha);
    if (d.evento === "publicada" && inv.estado !== "publicada") return;
    const para = d.evento === "vinculo" ? [d.email.toLowerCase()] : await emailsDe(d.invitacionId);
    for (const email of para) {
      const datos: DatosCorreo = {
        pareja: { a: inv.pareja.a, b: inv.pareja.b },
        fecha,
        slug: inv.slug,
        enlaces: enlacesBoda(inv.slug, email),
        diasParaBoda: fecha ? diasEntre(diaMadrid(), fecha) : null,
      };
      if (paso.condicion) {
        // Las condiciones miran el contexto completo; aquí solo hay lo básico.
        const ok = (() => {
          try {
            return paso.condicion!({
              hoy: diaMadrid(),
              fecha,
              diasParaBoda: datos.diasParaBoda ?? null,
              pagado: true,
              publicada: inv.estado === "publicada",
              datosCompletos: inv.estado === "publicada",
              disenoAprobado: inv.estado === "publicada",
              rsvpAbierto: inv.estado === "publicada",
              diasHastaLimite: null,
              albumCaduca: null,
            });
          } catch {
            return false;
          }
        })();
        if (!ok) continue;
      }
      await enviarPaso(paso, email, datos, claveDe(paso, d.invitacionId, email), { id: d.invitacionId, slug: inv.slug });
    }
  }
}

async function emailsDe(invitacionId: string): Promise<string[]> {
  const xs = await listarMiembros(invitacionId).catch(() => []);
  return [...new Set(xs.filter((m) => m.email && m.rol === "pareja").map((m) => m.email!.toLowerCase()))];
}
