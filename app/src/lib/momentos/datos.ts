import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { invitacionPorSlug, listarTodas, obtenerInvitacion } from "@/lib/datos";
import { servicio } from "@/lib/supabase/clientes";
import type { Invitacion } from "@/lib/tipos";
import { borrarArchivos, DIR_LOCAL, modoAlmacen } from "./almacen";
import { normalizarDiseno, type DisenoDirecto } from "./diseno";
import { limitesDe, type PlanMomentos } from "./planes";
import type { ConfigDirecto, EstadoMomento, FilaMomento, Uso } from "./tipos";

/**
 * Los datos de «En directo»: la configuración de cada boda (`directo`) y lo
 * que suben los invitados (`momentos`).
 *
 * Con Supabase, tablas con RLS cerrada y service role desde el servidor.
 * En local, un almacén del proceso que además se guarda en
 * `.momentos-local/indice.json` (los archivos ya están en disco: así la
 * demo sobrevive a reiniciar `next dev`).
 *
 * En local cada boda arranca con «En directo» activo y con la clave de la
 * pantalla y el token del QR a `demo`, para poder probar sin panel:
 *   /i/<slug>/momentos?t=demo   ·   /directo/<slug>?k=demo
 */

export type Boda = { id: string | null; inv: Invitacion };

const nuevoId = () => randomBytes(12).toString("hex");
export const nuevaClave = () => randomBytes(12).toString("hex");
export const nuevoToken = () => randomBytes(6).toString("hex");

const CAMPOS_CONFIG =
  "invitacion_id, activo, subidas_abiertas, moderacion, clave_pantalla, token_subida, plan, anos_extra, limite_fotos, limite_videos, limite_bytes, retencion_hasta, mensaje_fijado, capitulo, capitulo_desde, aviso_borrado";
const CAMPOS_MOMENTO =
  "id, invitacion_id, tipo, ruta, ruta_pantalla, ruta_miniatura, ancho, alto, duracion, bytes, autor, mensaje, estado, destacado, dispositivo, capitulo, retirada_pedida, creado";

// ──────────────────────────────────────────────────────────── almacén local

type Local = { config: Record<string, ConfigDirecto>; momentos: FilaMomento[]; disenos?: Record<string, unknown> };
const INDICE = path.join(DIR_LOCAL, "indice.json");

async function local(): Promise<Local> {
  const g = globalThis as { __invitooMomentos?: Promise<Local> };
  g.__invitooMomentos ??= readFile(INDICE, "utf8")
    .then((t) => JSON.parse(t) as Local)
    .catch(() => ({ config: {}, momentos: [] }));
  return g.__invitooMomentos;
}

async function guardarLocal() {
  const datos = await local();
  try {
    await mkdir(DIR_LOCAL, { recursive: true });
    await writeFile(INDICE, JSON.stringify(datos));
  } catch (e) {
    console.error("[momentos.guardarLocal]", e);
  }
}

const esLocal = () => modoAlmacen() === "local";

// ─────────────────────────────────────────────────────────────────── bodas

/** La boda publicada detrás de un slug, con su id (null si es una muestra sin fila). */
export async function resolverBoda(slug: string): Promise<Boda | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return null;
  const inv = await obtenerInvitacion(slug);
  if (!inv) return null;
  if (esLocal()) {
    const todas = await listarTodas();
    return { inv, id: todas.find((x) => x.slug === slug)?.id ?? null };
  }
  const db = servicio();
  if (!db) return { inv, id: null };
  const { data } = await db.from("invitaciones").select("id").eq("slug", slug).maybeSingle();
  return { inv, id: (data?.id as string) ?? null };
}

/** Igual, pero también borradores: para el panel y el estudio. */
export async function resolverBodaPrivada(slug: string): Promise<Boda | null> {
  const x = await invitacionPorSlug(slug);
  return x ? { inv: x, id: x.id } : null;
}

function retencionPara(inv: Invitacion, plan: PlanMomentos, anosExtra = 0) {
  const d = new Date(inv.pareja.fecha);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + limitesDe(plan, anosExtra).mesesOnline);
  return d.toISOString();
}

function configInicial(invitacionId: string, inv: Invitacion): ConfigDirecto {
  // En local, todo abierto para la demo; en producción, cerrado hasta que
  // los novios lo activen y con el plan básico hasta que se pague.
  const plan: PlanMomentos = esLocal() ? "directo" : "album";
  const l = limitesDe(plan);
  return {
    invitacion_id: invitacionId,
    activo: esLocal(),
    subidas_abiertas: true,
    moderacion: "auto",
    clave_pantalla: esLocal() ? "demo" : nuevaClave(),
    token_subida: esLocal() ? "demo" : nuevoToken(),
    plan,
    anos_extra: 0,
    limite_fotos: l.fotos,
    limite_videos: l.videos,
    limite_bytes: l.bytes,
    retencion_hasta: retencionPara(inv, plan),
    mensaje_fijado: null,
    capitulo: null,
    capitulo_desde: null,
    aviso_borrado: null,
  };
}

function normalizarConfig(c: ConfigDirecto): ConfigDirecto {
  return {
    ...c,
    subidas_abiertas: c.subidas_abiertas !== false,
    anos_extra: Number(c.anos_extra) || 0,
    limite_fotos: Number(c.limite_fotos) || 0,
    limite_videos: Number(c.limite_videos) || 0,
    limite_bytes: Number(c.limite_bytes) || 0,
  };
}

/** La configuración de una boda; si no existe, se crea con los valores de partida. */
export async function obtenerConfig(boda: Boda & { id: string }): Promise<ConfigDirecto | null> {
  if (esLocal()) {
    const l = await local();
    if (!l.config[boda.id]) {
      l.config[boda.id] = configInicial(boda.id, boda.inv);
      await guardarLocal();
    }
    return l.config[boda.id];
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db
    .from("directo")
    .select(CAMPOS_CONFIG)
    .eq("invitacion_id", boda.id)
    .maybeSingle();
  if (error) {
    console.error("[momentos.obtenerConfig]", error.message);
    return null;
  }
  if (data) return normalizarConfig(data as ConfigDirecto);
  const inicial = configInicial(boda.id, boda.inv);
  const { data: creada, error: e2 } = await db
    .from("directo")
    .upsert(inicial, { onConflict: "invitacion_id", ignoreDuplicates: true })
    .select(CAMPOS_CONFIG)
    .maybeSingle();
  if (e2) console.error("[momentos.crearConfig]", e2.message);
  if (creada) return normalizarConfig(creada as ConfigDirecto);
  // Otra petición la creó a la vez: se relee.
  const { data: otra } = await db
    .from("directo")
    .select(CAMPOS_CONFIG)
    .eq("invitacion_id", boda.id)
    .maybeSingle();
  return otra ? normalizarConfig(otra as ConfigDirecto) : null;
}

export async function actualizarConfig(
  invitacionId: string,
  cambios: Partial<Omit<ConfigDirecto, "invitacion_id">>,
): Promise<boolean> {
  if (esLocal()) {
    const l = await local();
    const c = l.config[invitacionId];
    if (!c) return false;
    Object.assign(c, cambios);
    await guardarLocal();
    return true;
  }
  const db = servicio();
  if (!db) return false;
  const { error } = await db.from("directo").update(cambios).eq("invitacion_id", invitacionId);
  if (error) console.error("[momentos.actualizarConfig]", error.message);
  return !error;
}

/** Cambia el plan (y los años extra) y rehace los límites y la retención. */
export async function fijarPlan(boda: Boda & { id: string }, plan: PlanMomentos, anosExtra: number) {
  const l = limitesDe(plan, anosExtra);
  return actualizarConfig(boda.id, {
    plan,
    anos_extra: anosExtra,
    limite_fotos: l.fotos,
    limite_videos: l.videos,
    limite_bytes: l.bytes,
    retencion_hasta: retencionPara(boda.inv, plan, anosExtra),
  });
}

// ───────────────────────────────────────────────────────────────── diseño

/**
 * El diseño de la pantalla va en su propia columna (`directo.diseno`) y se
 * lee APARTE de la configuración: si la migración aún no está aplicada, la
 * pantalla sigue funcionando con el diseño de partida.
 */
export async function leerDiseno(invitacionId: string): Promise<DisenoDirecto> {
  if (esLocal()) return normalizarDiseno((await local()).disenos?.[invitacionId]);
  const db = servicio();
  if (!db) return normalizarDiseno(null);
  const { data, error } = await db.from("directo").select("diseno").eq("invitacion_id", invitacionId).maybeSingle();
  if (error) console.warn("[momentos.leerDiseno]", error.message);
  return normalizarDiseno((data as { diseno?: unknown } | null)?.diseno);
}

export async function guardarDiseno(invitacionId: string, d: DisenoDirecto): Promise<boolean> {
  const limpio = normalizarDiseno(d);
  if (esLocal()) {
    const l = await local();
    l.disenos = { ...(l.disenos ?? {}), [invitacionId]: limpio };
    await guardarLocal();
    return true;
  }
  const db = servicio();
  if (!db) return false;
  const { error } = await db.from("directo").update({ diseno: limpio }).eq("invitacion_id", invitacionId);
  if (error) console.error("[momentos.guardarDiseno]", error.message);
  return !error;
}

// ──────────────────────────────────────────────────────────────── momentos

export async function usoDe(invitacionId: string): Promise<Uso> {
  if (esLocal()) {
    const ms = (await local()).momentos.filter((m) => m.invitacion_id === invitacionId);
    return {
      fotos: ms.filter((m) => m.tipo === "foto").length,
      videos: ms.filter((m) => m.tipo === "video").length,
      mensajes: ms.filter((m) => m.tipo === "mensaje").length,
      bytes: ms.reduce((s, m) => s + (m.bytes || 0), 0),
    };
  }
  const db = servicio();
  if (!db) return { fotos: 0, videos: 0, mensajes: 0, bytes: 0 };
  const { data, error } = await db.rpc("uso_momentos", { inv: invitacionId });
  if (error) console.error("[momentos.usoDe]", error.message);
  const f = (Array.isArray(data) ? data[0] : data) as Partial<Record<keyof Uso, number | string>> | null;
  return {
    fotos: Number(f?.fotos ?? 0),
    videos: Number(f?.videos ?? 0),
    mensajes: Number(f?.mensajes ?? 0),
    bytes: Number(f?.bytes ?? 0),
  };
}

export async function recientesDeDispositivo(
  invitacionId: string,
  dispositivo: string,
  segundos: number,
  tipo?: FilaMomento["tipo"],
  soloRetiradas = false,
): Promise<number> {
  const desde = new Date(Date.now() - segundos * 1000).toISOString();
  if (esLocal()) {
    return (await local()).momentos.filter(
      (m) =>
        m.invitacion_id === invitacionId &&
        m.dispositivo === dispositivo &&
        (soloRetiradas ? (m.retirada_pedida ?? "") >= desde : m.creado >= desde) &&
        (!tipo || m.tipo === tipo),
    ).length;
  }
  const db = servicio();
  if (!db) return 0;
  let q = db
    .from("momentos")
    .select("id", { count: "exact", head: true })
    .eq("invitacion_id", invitacionId)
    .eq("dispositivo", dispositivo)
    .gte(soloRetiradas ? "retirada_pedida" : "creado", desde);
  if (tipo) q = q.eq("tipo", tipo);
  const { count } = await q;
  return count ?? 0;
}

/**
 * ¿Este dispositivo ya dejó este mismo pie hace poco? Un pie «por lote» viaja
 * con cada foto de la tanda: se enseña con todas, pero al Libro de buenos
 * deseos y a la campana solo llega una vez.
 */
export async function pieRepetido(invitacionId: string, dispositivo: string, mensaje: string, segundos = 1800) {
  const desde = new Date(Date.now() - segundos * 1000).toISOString();
  if (esLocal()) {
    return (await local()).momentos.some(
      (m) =>
        m.invitacion_id === invitacionId &&
        m.dispositivo === dispositivo &&
        m.tipo !== "mensaje" &&
        m.mensaje === mensaje &&
        m.creado >= desde,
    );
  }
  const db = servicio();
  if (!db) return false;
  const { count } = await db
    .from("momentos")
    .select("id", { count: "exact", head: true })
    .eq("invitacion_id", invitacionId)
    .eq("dispositivo", dispositivo)
    .neq("tipo", "mensaje")
    .eq("mensaje", mensaje)
    .gte("creado", desde);
  return (count ?? 0) > 0;
}

export async function existeRuta(ruta: string): Promise<boolean> {
  if (esLocal()) return (await local()).momentos.some((m) => m.ruta === ruta);
  const db = servicio();
  if (!db) return false;
  const { count } = await db
    .from("momentos")
    .select("id", { count: "exact", head: true })
    .eq("ruta", ruta);
  return (count ?? 0) > 0;
}

export async function insertarMomento(
  fila: Omit<FilaMomento, "id" | "creado" | "destacado" | "retirada_pedida">,
): Promise<FilaMomento | null> {
  if (esLocal()) {
    const nueva: FilaMomento = {
      ...fila,
      id: nuevoId(),
      destacado: false,
      retirada_pedida: null,
      creado: new Date().toISOString(),
    };
    (await local()).momentos.push(nueva);
    await guardarLocal();
    return nueva;
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db.from("momentos").insert(fila).select(CAMPOS_MOMENTO).maybeSingle();
  if (error) {
    console.error("[momentos.insertar]", error.message);
    return null;
  }
  return data as FilaMomento;
}

export type Filtro = {
  estados?: EstadoMomento[];
  /** Solo los creados DESPUÉS de esta fecha (ISO). */
  desde?: string | null;
  /** Solo los creados ANTES de esta fecha (ISO): paginación hacia atrás. */
  antes?: string | null;
  tipos?: FilaMomento["tipo"][];
  limite?: number;
};

/** Más recientes primero. */
export async function listarMomentos(invitacionId: string, f: Filtro = {}): Promise<FilaMomento[]> {
  const limite = Math.min(Math.max(f.limite ?? 200, 1), 5000);
  if (esLocal()) {
    return (await local()).momentos
      .filter(
        (m) =>
          m.invitacion_id === invitacionId &&
          (!f.estados || f.estados.includes(m.estado)) &&
          (!f.tipos || f.tipos.includes(m.tipo)) &&
          (!f.desde || m.creado > f.desde) &&
          (!f.antes || m.creado < f.antes),
      )
      .sort((a, b) => b.creado.localeCompare(a.creado))
      .slice(0, limite);
  }
  const db = servicio();
  if (!db) return [];
  const todas: FilaMomento[] = [];
  // PostgREST corta en 1000 filas por petición: se pagina.
  for (let desplazamiento = 0; todas.length < limite; desplazamiento += 1000) {
    let q = db.from("momentos").select(CAMPOS_MOMENTO).eq("invitacion_id", invitacionId);
    if (f.estados) q = q.in("estado", f.estados);
    if (f.tipos) q = q.in("tipo", f.tipos);
    if (f.desde) q = q.gt("creado", f.desde);
    if (f.antes) q = q.lt("creado", f.antes);
    const tope = Math.min(1000, limite - todas.length);
    const { data, error } = await q
      .order("creado", { ascending: false })
      .range(desplazamiento, desplazamiento + tope - 1);
    if (error) {
      console.error("[momentos.listar]", error.message);
      break;
    }
    todas.push(...((data ?? []) as FilaMomento[]));
    if (!data || data.length < tope) break;
  }
  return todas.map((m) => ({ ...m, bytes: Number(m.bytes) || 0 }));
}

export async function cambiarMomento(
  invitacionId: string,
  id: string,
  cambios: Partial<Pick<FilaMomento, "estado" | "destacado" | "retirada_pedida" | "mensaje">>,
): Promise<boolean> {
  if (esLocal()) {
    const m = (await local()).momentos.find((x) => x.id === id && x.invitacion_id === invitacionId);
    if (!m) return false;
    Object.assign(m, cambios);
    await guardarLocal();
    return true;
  }
  const db = servicio();
  if (!db) return false;
  const { error } = await db
    .from("momentos")
    .update(cambios)
    .eq("id", id)
    .eq("invitacion_id", invitacionId);
  return !error;
}

/** Borra la fila y devuelve sus rutas, para borrar después los archivos. */
export async function quitarMomento(invitacionId: string, id: string): Promise<string[] | null> {
  if (esLocal()) {
    const l = await local();
    const m = l.momentos.find((x) => x.id === id && x.invitacion_id === invitacionId);
    if (!m) return null;
    l.momentos = l.momentos.filter((x) => x !== m);
    await guardarLocal();
    return [m.ruta, m.ruta_pantalla, m.ruta_miniatura].filter((r): r is string => Boolean(r));
  }
  const db = servicio();
  if (!db) return null;
  const { data, error } = await db
    .from("momentos")
    .delete()
    .eq("id", id)
    .eq("invitacion_id", invitacionId)
    .select("ruta, ruta_pantalla, ruta_miniatura")
    .maybeSingle();
  if (error || !data) return null;
  return [data.ruta, data.ruta_pantalla, data.ruta_miniatura].filter((r): r is string => Boolean(r));
}

/** Recuerdos visibles en total: el contador elegante de la pantalla. */
export async function totalVisibles(invitacionId: string): Promise<number> {
  if (esLocal()) {
    return (await local()).momentos.filter(
      (m) => m.invitacion_id === invitacionId && m.estado === "visible",
    ).length;
  }
  const db = servicio();
  if (!db) return 0;
  const { count } = await db
    .from("momentos")
    .select("id", { count: "exact", head: true })
    .eq("invitacion_id", invitacionId)
    .eq("estado", "visible");
  return count ?? 0;
}

export async function obtenerMomento(invitacionId: string, id: string): Promise<FilaMomento | null> {
  if (!/^[A-Za-z0-9-]{8,40}$/.test(id)) return null;
  if (esLocal()) {
    return (await local()).momentos.find((m) => m.id === id && m.invitacion_id === invitacionId) ?? null;
  }
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("momentos")
    .select(CAMPOS_MOMENTO)
    .eq("id", id)
    .eq("invitacion_id", invitacionId)
    .maybeSingle();
  return (data as FilaMomento) ?? null;
}

// ──────────────────────────────────────────────────────────────── limpieza

/** Configuraciones cuyo `retencion_hasta` cae antes de `hasta`. */
export async function configsHasta(hasta: Date): Promise<ConfigDirecto[]> {
  const limite = hasta.toISOString();
  if (esLocal()) {
    return Object.values((await local()).config).filter((c) => c.retencion_hasta && c.retencion_hasta < limite);
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("directo")
    .select(CAMPOS_CONFIG)
    .not("retencion_hasta", "is", null)
    .lt("retencion_hasta", limite)
    .limit(500);
  if (error) console.error("[momentos.configsHasta]", error.message);
  return ((data ?? []) as ConfigDirecto[]).map(normalizarConfig);
}

/**
 * Borra TODO lo de una boda caducada: archivos del almacén y filas. Devuelve
 * cuántos momentos se han ido. Por lotes, para no pasarse de tiempo.
 */
export async function borrarTodoDe(invitacionId: string, lote = 1000): Promise<number> {
  let borrados = 0;
  for (let vuelta = 0; vuelta < 20; vuelta++) {
    const filas = await listarMomentos(invitacionId, { limite: lote });
    if (!filas.length) break;
    await borrarArchivos(
      filas.flatMap((f) => [f.ruta, f.ruta_pantalla, f.ruta_miniatura]).filter((r): r is string => Boolean(r)),
    );
    const ids = filas.map((f) => f.id);
    if (esLocal()) {
      const l = await local();
      const fuera = new Set(ids);
      l.momentos = l.momentos.filter((m) => !fuera.has(m.id));
      await guardarLocal();
    } else {
      const db = servicio();
      if (!db) break;
      const { error } = await db.from("momentos").delete().eq("invitacion_id", invitacionId).in("id", ids);
      if (error) {
        console.error("[momentos.borrarTodoDe]", error.message);
        break;
      }
    }
    borrados += ids.length;
    if (filas.length < lote) break;
  }
  return borrados;
}

/**
 * La boda detrás del token del QR. Es lo que permite que el QR lleve un
 * enlace corto (`/m/<token>`): menos caracteres, menos puntos, un código
 * más limpio y que lee mejor impreso pequeño.
 */
export async function slugPorTokenSubida(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{8,32}$/.test(token)) return null;
  if (esLocal()) {
    const l = await local();
    const id = Object.values(l.config).find((c) => c.token_subida === token)?.invitacion_id;
    if (!id) return null;
    const todas = await listarTodas();
    return todas.find((x) => x.id === id)?.slug ?? null;
  }
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("directo")
    .select("invitaciones!inner(slug)")
    .eq("token_subida", token)
    .maybeSingle();
  const rel = (data as { invitaciones?: { slug?: string } | { slug?: string }[] } | null)?.invitaciones;
  const slug = Array.isArray(rel) ? rel[0]?.slug : rel?.slug;
  return slug ?? null;
}

// ──────────────────────────────────────────────────────────────── tele

/**
 * Las bodas con pantalla contratada, con su clave y su slug: para resolver
 * el código corto de `/tv`. Son pocas a la vez (las que tienen En directo
 * pagado y vigente), así que se recorren en el servidor.
 */
export async function pantallasActivas(): Promise<{ slug: string; config: ConfigDirecto }[]> {
  const conPantalla = (c: ConfigDirecto) => limitesDe(c.plan, c.anos_extra).pantallaTv && c.activo;
  if (esLocal()) {
    const todas = await listarTodas();
    return Object.values((await local()).config)
      .filter(conPantalla)
      .map((config) => ({ slug: todas.find((x) => x.id === config.invitacion_id)?.slug ?? "", config }))
      .filter((x) => x.slug);
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("directo")
    .select(`${CAMPOS_CONFIG}, invitaciones!inner(slug)`)
    .eq("activo", true)
    .neq("plan", "album")
    .limit(2000);
  if (error) console.error("[momentos.pantallasActivas]", error.message);
  return ((data ?? []) as (ConfigDirecto & { invitaciones?: { slug?: string } | { slug?: string }[] })[])
    .map((f) => {
      const rel = f.invitaciones;
      const slug = (Array.isArray(rel) ? rel[0]?.slug : rel?.slug) ?? "";
      const config = { ...f } as ConfigDirecto & { invitaciones?: unknown };
      delete config.invitaciones;
      return { slug, config: normalizarConfig(config) };
    })
    .filter((x) => x.slug && conPantalla(x.config));
}
