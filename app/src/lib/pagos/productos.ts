import { PLANES } from "@/data/sitio";
import { AMPLIACIONES_MOMENTOS, PLANES_MOMENTOS } from "@/lib/momentos/planes";
import { INFO_PLAN, type PlanBoda } from "@/lib/planes-boda";

/**
 * Lo que se puede comprar, con los precios que dictan `lib/planes-boda.ts`
 * (los planes) y `lib/momentos/planes.ts` (En directo). No se copian aquí:
 * si cambian allí, cambian aquí. DATO puro: lo importan el panel, la web,
 * el servidor y el webhook.
 *
 * Importes en céntimos, IVA (21 %) incluido. El servidor es el único que
 * decide el importe de un Checkout: el navegador solo dice QUÉ plan quiere.
 */

export type ProductoDirecto = "directo" | "gestionado" | "conservar";

export type Producto = {
  id: ProductoDirecto;
  nombre: string;
  /** Céntimos, IVA incluido. */
  importe: number;
  resumen: string;
};

export const PRODUCTOS: Record<ProductoDirecto, Producto> = {
  directo: {
    id: "directo",
    nombre: PLANES_MOMENTOS.directo.nombre,
    importe: Math.round(PLANES_MOMENTOS.directo.precio * 100),
    resumen: "Subida por QR, pantalla para la TV, muro en directo y ZIP.",
  },
  gestionado: {
    id: "gestionado",
    nombre: PLANES_MOMENTOS.gestionado.nombre,
    importe: Math.round(PLANES_MOMENTOS.gestionado.precio * 100),
    resumen: "Todo En directo, configurado y probado con el local por nosotros.",
  },
  conservar: {
    id: "conservar",
    nombre: AMPLIACIONES_MOMENTOS.conservar.nombre,
    importe: Math.round(AMPLIACIONES_MOMENTOS.conservar.precio * 100),
    resumen: "El álbum sigue online y descargable doce meses más.",
  },
};

export function esProducto(x: unknown): x is ProductoDirecto {
  return x === "directo" || x === "gestionado" || x === "conservar";
}

// ───────────────────────────────────────────── los planes de la invitación

/** Los planes con precio cerrado, que se reservan pagando en /precios. */
export type PlanCerrado = Exclude<PlanBoda, "estudio">;
export const PLANES_CERRADOS: PlanCerrado[] = ["invitoo", "cancion"];

export function esPlanCerrado(x: unknown): x is PlanCerrado {
  return x === "invitoo" || x === "cancion";
}

export type ProductoPlan = {
  id: PlanCerrado;
  nombre: string;
  /** Céntimos, IVA incluido. */
  importe: number;
  resumen: string;
  plazo: string;
};

const delSitio = (id: PlanBoda) => PLANES.find((p) => p.id === id);

export const PLANES_PAGO: Record<PlanCerrado, ProductoPlan> = {
  invitoo: {
    id: "invitoo",
    nombre: INFO_PLAN.invitoo.nombre,
    importe: Math.round(INFO_PLAN.invitoo.precio * 100),
    resumen: delSitio("invitoo")?.resumen ?? "",
    plazo: delSitio("invitoo")?.plazo ?? "",
  },
  cancion: {
    id: "cancion",
    nombre: INFO_PLAN.cancion.nombre,
    importe: Math.round(INFO_PLAN.cancion.precio * 100),
    resumen: delSitio("cancion")?.resumen ?? "",
    plazo: delSitio("cancion")?.plazo ?? "",
  },
};

/** El nombre de cualquier plan, Estudio incluido (para recibos y avisos). */
export function nombrePlan(id: PlanBoda) {
  return INFO_PLAN[id].nombre;
}

/** 8900 → «89 €»; 1950 → «19,50 €». */
export function euros(centimos: number) {
  const n = centimos / 100;
  return `${n.toLocaleString("es-ES", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })} €`;
}

/** La base y el IVA de un importe con el 21 % incluido (para el recibo). */
export function desglose(centimos: number) {
  const base = Math.round(centimos / 1.21);
  return { base, iva: centimos - base };
}
