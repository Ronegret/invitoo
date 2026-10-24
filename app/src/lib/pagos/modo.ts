import "server-only";

import { stripeConfigurado } from "./stripe";

/**
 * Cómo se cobra ahora mismo. Lo usan En directo, los planes y los cobros.
 *
 *   · "stripe" — hay STRIPE_SECRET_KEY: Checkout y, al volver, SOLO el
 *     webhook firmado da el pago por bueno.
 *   · "demo"   — no hay clave y estamos en desarrollo, con INVITOO_MEMORIA=1
 *     o con PAGOS_DEMO=1: no se cobra nada y se dice «Modo demo: no se ha
 *     cobrado nada».
 *   · "no"     — producción sin clave: no se vende (nunca se regala).
 */
export type ModoCobro = "stripe" | "demo" | "no";

export function modoCobro(): ModoCobro {
  if (stripeConfigurado()) return "stripe";
  if (process.env.NODE_ENV !== "production" || process.env.INVITOO_MEMORIA === "1" || process.env.PAGOS_DEMO === "1") {
    return "demo";
  }
  return "no";
}
