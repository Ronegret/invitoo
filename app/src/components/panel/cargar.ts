import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { accesoBoda, type Acceso } from "@/lib/auth/acceso";
import { invitacionPorSlug, obtenerContrato } from "@/lib/datos";
import { estadoDirecto } from "@/lib/momentos/acciones-control";
import { esAnadidoBoda, esPlanBoda, type Contrato } from "@/lib/planes-boda";
import { SITIO_URL } from "@/lib/enlaces";

/**
 * Lo primero de cada página del panel. El layout también lo llama, pero el
 * layout no protege a la página (en el App Router se renderizan a la vez),
 * así que CADA página vuelve a pedirlo. Con `cache` no cuesta nada.
 */
export async function exigirPanel(slug: string): Promise<Acceso> {
  const acceso = await accesoBoda(slug);
  if (!acceso) redirect(`/cuenta/entrar?error=acceso&volver=${encodeURIComponent(`/panel/${slug}`)}`);
  return acceso;
}

export const invitacionDelPanel = cache(async (slug: string) => {
  const inv = await invitacionPorSlug(slug);
  if (!inv) redirect("/panel");
  return inv;
});

/** El dominio desde el que se está viendo (para los enlaces personales). */
export const origen = cache(async () => {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return SITIO_URL;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
});

/**
 * Lo contratado (plan, añadidos y el plan de En directo) para decidir qué
 * sale con candado. Ver `lib/planes-boda.ts`.
 */
/** `estadoDirecto` una vez por petición (lo usan el contrato y los avisos). */
export const estadoDelPanel = cache((slug: string) => estadoDirecto(slug).catch(() => null));

export const contratoDelPanel = cache(async (slug: string, invitacionId: string): Promise<Contrato> => {
  const [c, e] = await Promise.all([obtenerContrato(invitacionId), estadoDelPanel(slug)]);
  return {
    plan: esPlanBoda(c.plan) ? c.plan : "invitoo",
    anadidos: c.anadidos.filter(esAnadidoBoda),
    momentos: e && e.ok ? e.plan : "album",
  };
});
