"use server";

import { revalidatePath } from "next/cache";
import type { Resultado } from "@/app/panel/tipos";
import { exigirAccesoBoda, type Acceso } from "@/lib/auth/acceso";
import { avisar } from "./avisar";
import { guardarPreferencias, guardarSuscripcion, marcarLeidos, quitarSuscripcion } from "./datos";
import { clavePublicaVapid } from "./push";
import { esFrecuencia, PREFERENCIAS_INICIALES, TIPOS_AVISO, type Preferencias } from "./tipos";

/**
 * Acciones de Avisos. La primera línea de cada una: `exigirAccesoBoda`.
 */

const res = (ok: boolean, mensaje: string): Resultado => ({ ok, mensaje, t: Date.now() });
const SIN_ACCESO = res(false, "Se ha cerrado vuestra sesión. Volved a entrar y repetidlo.");

async function acceso(slug: unknown): Promise<Acceso | null> {
  const s = String(slug ?? "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) return null;
  try {
    return await exigirAccesoBoda(s);
  } catch {
    return null;
  }
}

/** La campana: «Marcar como leído». Sin ids, todos. */
export async function marcarAvisosLeidos(slug: string, ids: string[] = []): Promise<{ ok: boolean }> {
  const a = await acceso(slug);
  if (!a) return { ok: false };
  const ok = await marcarLeidos(a.invitacionId, ids.filter((x) => /^[A-Za-z0-9-]{1,64}$/.test(x)));
  revalidatePath(`/panel/${a.slug}`, "layout");
  return { ok };
}

/** Lo mismo desde un `<form>` (funciona sin JS). */
export async function marcarAvisosLeidosForm(datos: FormData): Promise<void> {
  await marcarAvisosLeidos(String(datos.get("slug") ?? ""));
}

export async function guardarPreferenciasAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos.get("slug"));
  if (!a) return SIN_ACCESO;
  const p: Preferencias = { ...PREFERENCIAS_INICIALES };
  for (const t of TIPOS_AVISO) {
    const v = datos.get(t);
    if (esFrecuencia(v)) p[t] = v;
  }
  const ok = await guardarPreferencias(a.invitacionId, p);
  revalidatePath(`/panel/${a.slug}/avisos`);
  return ok ? res(true, "Guardado. Desde ahora os avisamos así.") : res(false, "No hemos podido guardarlo. Probad otra vez.");
}

export async function suscribirPush(
  slug: string,
  s: { endpoint: string; p256dh?: string | null; auth?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  const a = await acceso(slug);
  if (!a) return { ok: false, error: "Se ha cerrado vuestra sesión." };
  if (!clavePublicaVapid()) return { ok: false, error: "Las notificaciones del navegador no están activadas." };
  const endpoint = String(s?.endpoint ?? "");
  if (!/^https:\/\/[^\s]{10,800}$/.test(endpoint)) return { ok: false, error: "El navegador no ha dado una suscripción válida." };
  const ok = await guardarSuscripcion(a.invitacionId, {
    endpoint,
    p256dh: s.p256dh ? String(s.p256dh).slice(0, 200) : null,
    auth: s.auth ? String(s.auth).slice(0, 100) : null,
  });
  return ok ? { ok } : { ok, error: "No hemos podido guardarla." };
}

export async function quitarPush(slug: string, endpoint: string): Promise<{ ok: boolean }> {
  const a = await acceso(slug);
  if (!a) return { ok: false };
  await quitarSuscripcion(String(endpoint ?? "").slice(0, 900), a.invitacionId);
  return { ok: true };
}

/** «Mandarme uno de prueba»: comprueba email y push de una vez. */
export async function probarAvisoAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos.get("slug"));
  if (!a) return SIN_ACCESO;
  await avisar(a.invitacionId, a.slug, {
    tipo: "confirmacion",
    titulo: "Aviso de prueba: así os llegará cada novedad",
    detalle: "Si lo veis en la campana (y en el correo o el móvil, según lo que tengáis activado), está todo bien.",
    enlace: `/panel/${a.slug}/avisos`,
  });
  revalidatePath(`/panel/${a.slug}`, "layout");
  return res(true, "Enviado. Miradlo en la campana de arriba.");
}
