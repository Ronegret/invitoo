import "server-only";

import { randomBytes } from "node:crypto";
import { listarTodas, modoDemo } from "@/lib/datos";
import { urlsLectura } from "@/lib/momentos/almacen";
import { servicio } from "@/lib/supabase/clientes";

/**
 * «Pedir un cambio»: la pareja escribe qué quiere cambiar (con foto o la
 * sección señalada si quiere) y el estudio lo lleva de «recibida» a «en
 * curso» y a «hecha». Tabla `solicitudes` (RLS cerrada); en local, memoria.
 */

export type EstadoSolicitud = "recibida" | "en_curso" | "hecha";
export const ESTADOS_SOLICITUD: EstadoSolicitud[] = ["recibida", "en_curso", "hecha"];
export const TEXTO_ESTADO: Record<EstadoSolicitud, string> = {
  recibida: "Recibida",
  en_curso: "En curso",
  hecha: "Hecha",
};

export type Solicitud = {
  id: string;
  invitacionId: string;
  texto: string;
  seccion: string | null;
  foto: string | null;
  fotoRuta: string | null;
  estado: EstadoSolicitud;
  respuesta: string | null;
  autor: string | null;
  creado: string;
  actualizado: string;
};

type Fila = Omit<Solicitud, "foto">;

function memoria(): Fila[] {
  const g = globalThis as { __invitooSolicitudes?: Fila[] };
  g.__invitooSolicitudes ??= [];
  return g.__invitooSolicitudes;
}

const deFila = (x: Record<string, unknown>): Fila => ({
  id: String(x.id),
  invitacionId: String(x.invitacion_id),
  texto: String(x.texto),
  seccion: (x.seccion as string) ?? null,
  fotoRuta: (x.foto_ruta as string) ?? null,
  estado: (x.estado as EstadoSolicitud) ?? "recibida",
  respuesta: (x.respuesta as string) ?? null,
  autor: (x.autor as string) ?? null,
  creado: String(x.creado_en),
  actualizado: String(x.actualizado_en ?? x.creado_en),
});

async function conFotos(filas: Fila[]): Promise<Solicitud[]> {
  const urls = await urlsLectura(filas.map((x) => x.fotoRuta).filter((r): r is string => Boolean(r)), 3600);
  return filas.map((x) => ({ ...x, foto: x.fotoRuta ? (urls.get(x.fotoRuta) ?? null) : null }));
}

export async function crearSolicitud(e: {
  invitacionId: string;
  texto: string;
  seccion: string | null;
  fotoRuta: string | null;
  autor: string | null;
}): Promise<Fila | null> {
  const ahora = new Date().toISOString();
  if (modoDemo()) {
    const fila: Fila = { id: randomBytes(10).toString("hex"), ...e, estado: "recibida", respuesta: null, creado: ahora, actualizado: ahora };
    memoria().unshift(fila);
    return fila;
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db
    .from("solicitudes")
    .insert({ invitacion_id: e.invitacionId, texto: e.texto, seccion: e.seccion, foto_ruta: e.fotoRuta, autor: e.autor })
    .select("*")
    .maybeSingle();
  if (error || !data) {
    console.error("[solicitudes.crear]", error?.message);
    return null;
  }
  return deFila(data);
}

export async function solicitudesDeBoda(invitacionId: string): Promise<Solicitud[]> {
  if (modoDemo()) return conFotos(memoria().filter((x) => x.invitacionId === invitacionId));
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("solicitudes")
    .select("*")
    .eq("invitacion_id", invitacionId)
    .order("creado_en", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[solicitudes.boda]", error.message);
    return [];
  }
  return conFotos((data ?? []).map(deFila));
}

/** La bandeja del estudio: todas, abiertas primero. Solo tras `exigirSesion`. */
export async function bandejaSolicitudes(): Promise<(Solicitud & { slug: string | null; pareja: string })[]> {
  let filas: Fila[];
  if (modoDemo()) filas = [...memoria()];
  else {
    const db = servicio();
    if (!db) return [];
    const { data } = await db.from("solicitudes").select("*").order("creado_en", { ascending: false }).limit(300);
    filas = (data ?? []).map(deFila);
  }
  const bodas = new Map((await listarTodas()).map((x) => [x.id ?? x.slug, x]));
  const orden: Record<EstadoSolicitud, number> = { recibida: 0, en_curso: 1, hecha: 2 };
  return (await conFotos(filas))
    .map((s) => {
      const b = bodas.get(s.invitacionId);
      return { ...s, slug: b?.slug ?? null, pareja: b ? `${b.pareja.a} & ${b.pareja.b}` : "Boda sin nombre" };
    })
    .sort((x, y) => orden[x.estado] - orden[y.estado] || y.creado.localeCompare(x.creado));
}

export async function contarAbiertas(): Promise<number> {
  if (modoDemo()) return memoria().filter((x) => x.estado !== "hecha").length;
  const db = servicio();
  if (!db) return 0;
  const { count } = await db.from("solicitudes").select("id", { count: "exact", head: true }).neq("estado", "hecha");
  return count ?? 0;
}

export async function cambiarSolicitud(
  id: string,
  cambios: { estado?: EstadoSolicitud; respuesta?: string | null },
): Promise<Fila | null> {
  if (!/^[A-Za-z0-9-]{1,64}$/.test(id)) return null;
  const ahora = new Date().toISOString();
  if (modoDemo()) {
    const x = memoria().find((s) => s.id === id);
    if (!x) return null;
    Object.assign(x, cambios, { actualizado: ahora });
    return x;
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db
    .from("solicitudes")
    .update({ ...cambios, actualizado_en: ahora })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return deFila(data);
}
