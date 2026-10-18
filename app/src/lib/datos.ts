import "server-only";

import { DEMO } from "@/data/demo";
import { anonimo, haySupabase, servicio } from "@/lib/supabase/clientes";
import type { Apertura, Bloque, Invitacion, PlantillaId, Tema } from "@/lib/tipos";

/**
 * La capa de datos.
 *
 * Todo lo que toca la base de datos pasa por aquí, y todo tiene una salida
 * sin Supabase: si no hay variables de entorno se usan los datos de ejemplo.
 * No es un apaño — es lo que permite que el prototipo arranque en cualquier
 * máquina sin credenciales, y que un fallo del proveedor no deje la web muerta.
 */

// ─────────────────────────────────────────────────────────────── traducción

type Fila = {
  id: string;
  slug: string;
  plantilla: PlantillaId;
  estado: Invitacion["estado"];
  nombre_a: string;
  nombre_b: string;
  fecha: string;
  tema: Tema;
  apertura: Apertura | null;
  musica: Invitacion["musica"] | null;
  bloques: Bloque[];
};

function aInvitacion(f: Fila): Invitacion {
  return {
    slug: f.slug,
    plantilla: f.plantilla,
    estado: f.estado,
    pareja: { a: f.nombre_a, b: f.nombre_b, fecha: f.fecha },
    tema: f.tema,
    apertura: f.apertura ?? undefined,
    musica: f.musica ?? undefined,
    bloques: f.bloques ?? [],
  };
}

const CAMPOS =
  "id, slug, plantilla, estado, nombre_a, nombre_b, fecha, tema, apertura, musica, bloques";

// ──────────────────────────────────────────────────────────────────── lectura

export async function obtenerInvitacion(
  slug: string,
): Promise<Invitacion | null> {
  const db = anonimo();
  if (!db) return DEMO[slug] ?? null;

  const { data, error } = await db
    .from("invitaciones")
    .select(CAMPOS)
    .eq("slug", slug)
    .eq("estado", "publicada")
    .maybeSingle();

  if (error) {
    // Una boda es el sábado y nadie va a mirar los logs: si la base falla, se
    // sirve lo que haya en ejemplo antes que un 500.
    console.error("[obtenerInvitacion]", error.message);
    return DEMO[slug] ?? null;
  }
  return data ? aInvitacion(data as Fila) : null;
}

/** Para `generateStaticParams`: qué invitaciones se pre-renderizan. */
export async function listarSlugsPublicados(): Promise<string[]> {
  const db = anonimo();
  if (!db) return Object.keys(DEMO);

  const { data, error } = await db
    .from("invitaciones")
    .select("slug")
    .eq("estado", "publicada");

  if (error || !data) return Object.keys(DEMO);
  return data.map((f) => f.slug as string);
}

/** Todas, incluidas las que están en borrador. Solo para el estudio. */
export async function listarTodas(): Promise<
  (Invitacion & { id?: string })[]
> {
  const db = servicio();
  if (!db) return Object.values(DEMO);

  const { data, error } = await db
    .from("invitaciones")
    .select(CAMPOS)
    .order("fecha", { ascending: true });

  if (error || !data) return Object.values(DEMO);
  return data.map((f) => ({ ...aInvitacion(f as Fila), id: (f as Fila).id }));
}

export async function obtenerPorId(id: string) {
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("invitaciones")
    .select(CAMPOS)
    .eq("id", id)
    .maybeSingle();
  return data ? { ...aInvitacion(data as Fila), id } : null;
}

// ─────────────────────────────────────────────────────── panel de los novios

export type FilaRsvp = {
  id: string;
  nombre: string;
  asiste: boolean;
  acompanantes: number;
  menu: string | null;
  alergias: string | null;
  bus: boolean;
  creado_en: string;
};

export async function obtenerRsvps(invitacionId: string): Promise<FilaRsvp[]> {
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("rsvp")
    .select("id, nombre, asiste, acompanantes, menu, alergias, bus, creado_en")
    .eq("invitacion_id", invitacionId)
    .order("creado_en", { ascending: false });
  if (error) {
    console.error("[obtenerRsvps]", error.message);
    return [];
  }
  return (data ?? []) as FilaRsvp[];
}

export type FilaMuro = {
  id: string;
  nombre: string;
  mensaje: string;
  creado_en: string;
};

export async function obtenerMuro(invitacionId: string): Promise<FilaMuro[]> {
  const db = servicio();
  if (!db) return [];
  const { data } = await db
    .from("muro")
    .select("id, nombre, mensaje, creado_en")
    .eq("invitacion_id", invitacionId)
    .order("creado_en", { ascending: false });
  return (data ?? []) as FilaMuro[];
}

// ──────────────────────────────────────────────────────────────── escritura

/**
 * Las escrituras de invitados van con service role a propósito: el invitado
 * no tiene cuenta, así que no hay `auth.uid()` con el que dejarle escribir
 * bajo RLS. La validación la hace la acción de servidor antes de llamar aquí.
 */

async function idDeSlug(slug: string): Promise<string | null> {
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("invitaciones")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export async function guardarRsvp(entrada: {
  slug: string;
  nombre: string;
  asiste: boolean;
  acompanantes: number;
  menu?: string | null;
  alergias?: string | null;
  bus?: boolean;
}): Promise<boolean> {
  const db = servicio();
  if (!db) {
    console.info("[rsvp sin base de datos]", entrada);
    return true;
  }
  const invitacion_id = await idDeSlug(entrada.slug);
  if (!invitacion_id) return false;

  const { error } = await db.from("rsvp").insert({
    invitacion_id,
    nombre: entrada.nombre,
    asiste: entrada.asiste,
    acompanantes: entrada.acompanantes,
    menu: entrada.menu ?? null,
    alergias: entrada.alergias ?? null,
    bus: entrada.bus ?? false,
  });
  if (error) {
    console.error("[guardarRsvp]", error.message);
    return false;
  }
  return true;
}

export async function guardarMensaje(entrada: {
  slug: string;
  nombre: string;
  mensaje: string;
}): Promise<boolean> {
  const db = servicio();
  if (!db) {
    console.info("[muro sin base de datos]", entrada);
    return true;
  }
  const invitacion_id = await idDeSlug(entrada.slug);
  if (!invitacion_id) return false;

  const { error } = await db.from("muro").insert({
    invitacion_id,
    nombre: entrada.nombre,
    mensaje: entrada.mensaje,
  });
  if (error) {
    console.error("[guardarMensaje]", error.message);
    return false;
  }
  return true;
}

export async function guardarLead(entrada: {
  email?: string;
  telefono?: string;
  origenSlug?: string;
  codigo?: string;
}): Promise<boolean> {
  const db = servicio();
  if (!db) {
    console.info("[lead sin base de datos]", entrada);
    return true;
  }
  const origen = entrada.origenSlug ? await idDeSlug(entrada.origenSlug) : null;
  const { error } = await db.from("leads").insert({
    email: entrada.email ?? null,
    telefono: entrada.telefono ?? null,
    origen_invitacion_id: origen,
    codigo: entrada.codigo ?? null,
  });
  return !error;
}

/** Alta y edición desde el estudio. */
export async function guardarInvitacion(
  id: string | null,
  datos: Partial<Fila>,
): Promise<{ ok: boolean; error?: string }> {
  const db = servicio();
  if (!db) return { ok: false, error: "Falta configurar Supabase." };

  const consulta = id
    ? db.from("invitaciones").update(datos).eq("id", id)
    : db.from("invitaciones").insert(datos);

  const { error } = await consulta;
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export { haySupabase };

// ───────────────────────────────────────────────────── panel de los novios

/** Resuelve el token privado del panel a la invitación que le corresponde. */
export async function invitacionPorToken(token: string) {
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("paneles")
    .select(`invitacion_id, invitaciones ( ${CAMPOS} )`)
    .eq("token", token)
    .maybeSingle();
  if (!data?.invitaciones) return null;
  const fila = data.invitaciones as unknown as Fila;
  return { ...aInvitacion(fila), id: fila.id };
}

/** El enlace que se le pasa a la pareja. Solo desde el estudio. */
export async function tokenDelPanel(invitacionId: string) {
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("paneles")
    .select("token")
    .eq("invitacion_id", invitacionId)
    .maybeSingle();
  return (data?.token as string) ?? null;
}
