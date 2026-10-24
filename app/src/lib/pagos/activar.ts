import "server-only";

import { revalidatePath } from "next/cache";
import { avisarEstudio, avisarPorSlug } from "@/lib/avisos/avisar";
import { actualizarConfig, fijarPlan, obtenerConfig, resolverBodaPrivada } from "@/lib/momentos/datos";
import type { PlanMomentos } from "@/lib/momentos/planes";
import { euros, PRODUCTOS, type ProductoDirecto } from "./productos";

/**
 * Lo que pasa cuando se paga (o se «paga» en modo demo): la misma lógica que
 * `fijarPlanDirecto` del estudio (plan → límites → retención con
 * `fijarPlan`), sin pedir sesión de estudio, porque lo llama el webhook ya
 * verificado o la acción demo ya autorizada con `exigirAccesoBoda`.
 *
 *  · directo     → plan «directo» (si ya tenía Gestionado o Estudio, se queda)
 *  · gestionado  → plan «gestionado» (si tenía Estudio, se queda)
 *  · conservar   → un año más online, con el plan que tenga
 *
 * Además enciende «En directo» y avisa a la pareja y al estudio.
 */

const RANGO: Record<PlanMomentos, number> = { album: 0, directo: 1, gestionado: 2, estudio: 3 };

export async function activarProducto(
  slug: string,
  producto: ProductoDirecto,
  o: { demo?: boolean; importe?: number } = {},
): Promise<{ ok: true; plan: PlanMomentos; anosExtra: number } | { ok: false; error: string }> {
  const boda = await resolverBodaPrivada(slug);
  if (!boda?.id) return { ok: false, error: "No encontramos esa boda." };
  const conId = { ...boda, id: boda.id };
  const config = await obtenerConfig(conId);
  if (!config) return { ok: false, error: "Ahora mismo no podemos guardarlo." };

  let plan = config.plan;
  let anos = config.anos_extra;
  if (producto === "conservar") anos = Math.min(anos + 1, 10);
  else if (RANGO[producto] > RANGO[plan]) plan = producto;

  if (!(await fijarPlan(conId, plan, anos))) return { ok: false, error: "Ahora mismo no podemos guardarlo." };
  if (producto !== "conservar" && !config.activo) await actualizarConfig(conId.id, { activo: true });

  try {
    revalidatePath(`/panel/${slug}`, "layout");
  } catch {}

  const p = PRODUCTOS[producto];
  const titulo =
    producto === "conservar" ? "Vuestro álbum sigue online un año más" : `${p.nombre} ya está activado`;
  void avisarPorSlug(slug, {
    tipo: "solicitud",
    titulo,
    detalle: o.demo ? "Modo demo: no se ha cobrado nada." : `Pago recibido: ${euros(o.importe ?? p.importe)}.`,
    enlace: `/panel/${slug}/directo`,
  });
  void avisarEstudio(
    o.demo ? `Compra demo: ${p.nombre}` : `Venta: ${p.nombre}`,
    [{ titulo: `${boda.inv.pareja.a} y ${boda.inv.pareja.b}`, detalle: `${slug} · ${euros(o.importe ?? p.importe)}${o.demo ? " (demo)" : ""}` }],
    `/estudio`,
  );
  console.info("[pagos.activar]", JSON.stringify({ slug, producto, plan, anos, demo: Boolean(o.demo) }));
  return { ok: true, plan, anosExtra: anos };
}
