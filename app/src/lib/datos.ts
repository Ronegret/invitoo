import "server-only";

import { randomBytes } from "node:crypto";
import { DEMO } from "@/data/demo";
import { resolverPlantillaId, VARIANTE_DE_ALIAS } from "@/data/plantillas";
import { anonimo, haySupabase, servicio } from "@/lib/supabase/clientes";
import {
  CUPO_SIN_TOKEN,
  normalizarNombre,
  type Bus,
  type PersonaRsvp,
} from "@/lib/rsvp";
import type {
  Apertura,
  Bloque,
  Invitacion,
  Parada,
  PlantillaAntigua,
  PlantillaGuardada,
  Tema,
} from "@/lib/tipos";

/**
 * La capa de datos.
 *
 * Todo lo que toca la base de datos pasa por aquí. Tres modos:
 *
 *  1. **Con Supabase** (producción normal): lecturas públicas con la anon key
 *     y todo lo privado con service role.
 *  2. **Sin Supabase en local** (`next dev` sin `.env.local`): un almacén EN
 *     MEMORIA del proceso, sembrado con `src/data/demo.ts`. Se puede confirmar,
 *     abrir el panel (`/novios/demo-<slug>`) y editar en el estudio; se pierde
 *     al reiniciar. Es lo que permite probarlo todo sin credenciales.
 *  3. **Sin Supabase en producción**: se leen las demos (la web comercial no se
 *     cae), pero **toda escritura falla con un error visible**. Antes se decía
 *     «confirmado» y la respuesta se perdía; eso no puede volver a pasar.
 */

const PRODUCCION = process.env.NODE_ENV === "production";

/**
 * `INVITOO_MEMORIA=1` fuerza el almacén en memoria también con `next start`
 * (pruebas de extremo a extremo sobre el build de producción). Es opt-in y
 * solo actúa si NO hay Supabase: en producción real nunca se activa solo.
 */
const MEMORIA_FORZADA = process.env.INVITOO_MEMORIA === "1";

/** ¿Estamos en el modo 2? */
function enMemoria() {
  return !servicio() && (!PRODUCCION || MEMORIA_FORZADA);
}

export type Escritura = { ok: true } | { ok: false; error: string };

const SIN_BASE: Escritura = {
  ok: false,
  error:
    "Ahora mismo no podemos guardarlo. Inténtalo dentro de un rato o avisa a los novios por WhatsApp.",
};

// ─────────────────────────────────────────────────────────────── traducción

type Fila = {
  id: string;
  slug: string;
  /** Puede traer un id antiguo («cielo», «brasa»…): se normaliza al leer. */
  plantilla: PlantillaGuardada;
  estado: Invitacion["estado"];
  nombre_a: string;
  nombre_b: string;
  fecha: string;
  tema: Tema;
  apertura: Apertura | null;
  musica: Invitacion["musica"] | null;
  bloques: Bloque[];
};

export type DatosInvitacion = Omit<Fila, "id" | "apertura" | "musica"> &
  Partial<Pick<Fila, "apertura" | "musica">>;

function aInvitacion(f: Fila): Invitacion {
  // Ids antiguos → id del catálogo. La variante que recordaba al id viejo
  // («brasa» → Floración Brasa) se guarda en el tema para no perderla.
  const plantilla = resolverPlantillaId(f.plantilla);
  const varianteAlias =
    f.plantilla !== plantilla ? VARIANTE_DE_ALIAS[f.plantilla as PlantillaAntigua] : undefined;
  return {
    slug: f.slug,
    plantilla,
    estado: f.estado,
    pareja: { a: f.nombre_a, b: f.nombre_b, fecha: f.fecha },
    tema: varianteAlias && !f.tema?.variante ? { ...f.tema, variante: varianteAlias } : f.tema,
    apertura: f.apertura ?? undefined,
    musica: f.musica ?? undefined,
    bloques: f.bloques ?? [],
  };
}

function aFila(id: string, inv: Invitacion): Fila {
  return {
    id,
    slug: inv.slug,
    plantilla: inv.plantilla,
    estado: inv.estado,
    nombre_a: inv.pareja.a,
    nombre_b: inv.pareja.b,
    fecha: inv.pareja.fecha,
    tema: inv.tema,
    apertura: inv.apertura ?? null,
    musica: inv.musica ?? null,
    bloques: inv.bloques,
  };
}

const CAMPOS =
  "id, slug, plantilla, estado, nombre_a, nombre_b, fecha, tema, apertura, musica, bloques";

// ─────────────────────────────────────────────────────── almacén en memoria

export type Invitado = {
  id: string;
  nombre: string;
  grupo: string | null;
  /** Plazas totales de este enlace, el invitado incluido (1 = va solo). */
  cupo: number;
  token: string;
  telefono: string | null;
  /** Cómo saluda la invitación: «Querida Carmen». Opcional. */
  trato: Trato | null;
  creado_en: string;
};

export type Trato = "querida" | "querido" | "queridos";
export const TRATOS: Trato[] = ["querida", "querido", "queridos"];

export type FilaRsvp = {
  id: string;
  invitado_id: string | null;
  /** Nombre de quien responde (la primera persona). */
  nombre: string;
  asiste: boolean;
  personas: PersonaRsvp[];
  bus: Bus;
  parada: string | null;
  mensaje: string | null;
  telefono: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type FilaMuro = {
  id: string;
  nombre: string;
  mensaje: string;
  aprobado: boolean;
  creado_en: string;
};

type Memoria = {
  invitaciones: Map<string, Fila>;
  invitados: (Invitado & { invitacion_id: string })[];
  rsvp: (FilaRsvp & { invitacion_id: string; clave: string })[];
  muro: (FilaMuro & { invitacion_id: string })[];
};

const PREFIJO_PANEL_DEMO = "demo-";

function memoria(): Memoria {
  const g = globalThis as { __invitooMemoria?: Memoria };
  if (!g.__invitooMemoria) {
    const ahora = new Date().toISOString();
    const invitaciones = new Map<string, Fila>();
    // En memoria el id de la invitación es su slug: así el panel de prueba
    // es /novios/demo-<slug> y no hay que buscar nada.
    for (const inv of Object.values(DEMO)) invitaciones.set(inv.slug, aFila(inv.slug, inv));
    const primera = Object.keys(DEMO)[0];
    const invitados: Memoria["invitados"] = primera
      ? [
          // Invitados de prueba con tokens fijos, para poder abrir
          // /i/<slug>?n=demo-carmen sin montar nada.
          { id: "m1", invitacion_id: primera, nombre: "Carmen", grupo: "Familia", cupo: 2, token: "demo-carmen", telefono: null, trato: "querida", creado_en: ahora },
          { id: "m2", invitacion_id: primera, nombre: "Familia Fernández", grupo: "Familia", cupo: 4, token: "demo-fernandez", telefono: null, trato: null, creado_en: ahora },
          { id: "m3", invitacion_id: primera, nombre: "Íñigo", grupo: "Amigos", cupo: 1, token: "demo-inigo", telefono: null, trato: null, creado_en: ahora },
        ]
      : [];
    g.__invitooMemoria = { invitaciones, invitados, rsvp: [], muro: [] };
  }
  return g.__invitooMemoria;
}

/** Copia sin las claves internas del almacén. */
function sin<T extends object, K extends keyof T>(o: T, ...claves: K[]): Omit<T, K> {
  const copia = { ...o };
  for (const k of claves) delete copia[k];
  return copia;
}

const nuevoId = () => randomBytes(8).toString("hex");
const nuevoToken = () => randomBytes(8).toString("hex");

// ──────────────────────────────────────────────────────────────────── lectura

export async function obtenerInvitacion(slug: string): Promise<Invitacion | null> {
  if (enMemoria()) {
    const f = [...memoria().invitaciones.values()].find(
      (x) => x.slug === slug && x.estado === "publicada",
    );
    return f ? aInvitacion(f) : null;
  }
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
  if (!data) return DEMO[slug] ?? null;
  return aInvitacion(data as Fila);
}

/** Para `generateStaticParams`: qué invitaciones se pre-renderizan. */
export async function listarSlugsPublicados(): Promise<string[]> {
  if (enMemoria()) {
    return [...memoria().invitaciones.values()]
      .filter((f) => f.estado === "publicada")
      .map((f) => f.slug);
  }
  const db = anonimo();
  if (!db) return Object.keys(DEMO);

  const { data, error } = await db
    .from("invitaciones")
    .select("slug")
    .eq("estado", "publicada");

  if (error || !data) return Object.keys(DEMO);
  // Las demos también: son las muestras del catálogo.
  return [...new Set([...data.map((f) => f.slug as string), ...Object.keys(DEMO)])];
}

/** Todas, incluidas las que están en borrador. Solo para el estudio. */
export async function listarTodas(): Promise<(Invitacion & { id?: string })[]> {
  if (enMemoria()) {
    return [...memoria().invitaciones.values()]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((f) => ({ ...aInvitacion(f), id: f.id }));
  }
  const db = servicio();
  if (!db) return Object.values(DEMO);

  const { data, error } = await db
    .from("invitaciones")
    .select(CAMPOS)
    .order("fecha", { ascending: true });

  if (error || !data) return Object.values(DEMO);
  return data.map((f) => ({ ...aInvitacion(f as Fila), id: (f as Fila).id }));
}

/** Una boda por id, publicada o no. Solo para el estudio. */
export async function obtenerPorId(id: string) {
  if (enMemoria()) {
    const f = memoria().invitaciones.get(id);
    return f ? { ...aInvitacion(f), id } : null;
  }
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("invitaciones")
    .select(CAMPOS)
    .eq("id", id)
    .maybeSingle();
  return data ? { ...aInvitacion(data as Fila), id } : null;
}

async function idDeSlug(slug: string): Promise<string | null> {
  if (enMemoria()) {
    const f = [...memoria().invitaciones.values()].find((x) => x.slug === slug);
    return f?.id ?? null;
  }
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("invitaciones")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

// ─────────────────────────────────────────────────────── panel de los novios

/** Resuelve el token privado del panel a la invitación que le corresponde. */
export async function invitacionPorToken(token: string) {
  if (!/^[A-Za-z0-9-]{6,80}$/.test(token)) return null;
  if (enMemoria()) {
    if (!token.startsWith(PREFIJO_PANEL_DEMO)) return null;
    const f = memoria().invitaciones.get(token.slice(PREFIJO_PANEL_DEMO.length));
    return f ? { ...aInvitacion(f), id: f.id } : null;
  }
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
  if (enMemoria()) return `${PREFIJO_PANEL_DEMO}${invitacionId}`;
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("paneles")
    .select("token")
    .eq("invitacion_id", invitacionId)
    .maybeSingle();
  return (data?.token as string) ?? null;
}

// ──────────────────────────────────────────────────────────────── invitados

const CAMPOS_INVITADO = "id, nombre, grupo, cupo, token, telefono, trato, creado_en";

export async function listarInvitados(invitacionId: string): Promise<Invitado[]> {
  if (enMemoria()) {
    return memoria()
      .invitados.filter((i) => i.invitacion_id === invitacionId)
      .map((i) => sin(i, "invitacion_id"));
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("invitados")
    .select(CAMPOS_INVITADO)
    .eq("invitacion_id", invitacionId)
    .order("grupo", { ascending: true, nullsFirst: false })
    .order("creado_en", { ascending: true });
  if (error) {
    console.error("[listarInvitados]", error.message);
    return [];
  }
  return (data ?? []) as Invitado[];
}

export type EntradaInvitado = {
  nombre: string;
  grupo: string | null;
  cupo: number;
  telefono: string | null;
  trato?: Trato | null;
};

/** Alta (sin `id`) o edición (con `id`). Siempre acotado a SU invitación. */
export async function guardarInvitado(
  invitacionId: string,
  id: string | null,
  datos: EntradaInvitado,
): Promise<Escritura> {
  if (enMemoria()) {
    const m = memoria();
    if (id) {
      const i = m.invitados.find((x) => x.id === id && x.invitacion_id === invitacionId);
      if (!i) return { ok: false, error: "Ese invitado ya no existe." };
      Object.assign(i, datos);
    } else {
      m.invitados.push({
        trato: null,
        ...datos,
        id: nuevoId(),
        invitacion_id: invitacionId,
        token: nuevoToken(),
        creado_en: new Date().toISOString(),
      });
    }
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = id
    ? await db
        .from("invitados")
        .update(datos)
        .eq("id", id)
        .eq("invitacion_id", invitacionId)
    : await db.from("invitados").insert({ ...datos, invitacion_id: invitacionId });
  if (error) {
    console.error("[guardarInvitado]", error.message);
    return { ok: false, error: "No se ha podido guardar el invitado." };
  }
  return { ok: true };
}

export async function borrarInvitado(invitacionId: string, id: string): Promise<Escritura> {
  if (enMemoria()) {
    const m = memoria();
    m.invitados = m.invitados.filter(
      (x) => !(x.id === id && x.invitacion_id === invitacionId),
    );
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db
    .from("invitados")
    .delete()
    .eq("id", id)
    .eq("invitacion_id", invitacionId);
  if (error) return { ok: false, error: "No se ha podido borrar." };
  return { ok: true };
}

export async function importarInvitados(
  invitacionId: string,
  filas: EntradaInvitado[],
): Promise<Escritura> {
  if (filas.length === 0) return { ok: true };
  if (enMemoria()) {
    for (const f of filas) {
      const r = await guardarInvitado(invitacionId, null, f);
      if (!r.ok) return r;
    }
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db
    .from("invitados")
    .insert(filas.map((f) => ({ ...f, invitacion_id: invitacionId })));
  if (error) {
    console.error("[importarInvitados]", error.message);
    return { ok: false, error: "No se ha podido importar la lista." };
  }
  return { ok: true };
}

const TOKEN_INVITADO = /^[A-Za-z0-9-]{4,64}$/;

/**
 * El invitado detrás de un enlace personal (`/i/slug?n=<token>`). Es lo que
 * expone `GET /api/invitado`: solo el nombre y el cupo, nada más.
 */
export async function obtenerInvitado(
  slug: string,
  token: string,
): Promise<{ id: string; nombre: string; cupo: number; trato: Trato | null } | null> {
  if (!TOKEN_INVITADO.test(token)) return null;
  const invitacionId = await idDeSlug(slug);
  if (!invitacionId) return null;
  if (enMemoria()) {
    const i = memoria().invitados.find(
      (x) => x.invitacion_id === invitacionId && x.token === token,
    );
    return i ? { id: i.id, nombre: i.nombre, cupo: i.cupo, trato: i.trato ?? null } : null;
  }
  const db = servicio();
  if (!db) return null;
  const { data } = await db
    .from("invitados")
    .select("id, nombre, cupo, trato")
    .eq("invitacion_id", invitacionId)
    .eq("token", token)
    .maybeSingle();
  return data
    ? {
        id: data.id as string,
        nombre: data.nombre as string,
        cupo: Number(data.cupo) || 1,
        trato: TRATOS.includes(data.trato as Trato) ? (data.trato as Trato) : null,
      }
    : null;
}

// ──────────────────────────────────────────────────────────────────── rsvp

export async function obtenerRsvps(invitacionId: string): Promise<FilaRsvp[]> {
  if (enMemoria()) {
    return memoria()
      .rsvp.filter((r) => r.invitacion_id === invitacionId)
      .sort((a, b) => b.actualizado_en.localeCompare(a.actualizado_en))
      .map((r) => sin(r, "invitacion_id", "clave"));
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("rsvp")
    .select(
      "id, invitado_id, nombre, asiste, personas, bus, parada, mensaje, telefono, creado_en, actualizado_en",
    )
    .eq("invitacion_id", invitacionId)
    .order("actualizado_en", { ascending: false });
  if (error) {
    console.error("[obtenerRsvps]", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    ...(r as FilaRsvp),
    personas: Array.isArray(r.personas) ? (r.personas as PersonaRsvp[]) : [],
  }));
}

export type EntradaRsvp = {
  slug: string;
  /** Token del invitado (`?n=`). Si no hay, se deduplica por nombre. */
  token: string | null;
  asiste: boolean;
  personas: PersonaRsvp[];
  bus: Bus;
  parada: string | null;
  mensaje: string | null;
  telefono: string | null;
  /**
   * Sin token: el nombre con el que se guardó la respuesta que se corrige
   * (el formulario lo manda como `nombre_previo`). Si el invitado cambia su
   * nombre al corregir, se mueve esa fila en vez de crear otra.
   */
  nombrePrevio?: string | null;
};

/**
 * Guarda o corrige una respuesta (upsert).
 *
 * La clave de deduplicación es `invitado:<id>` si llega un token válido, o
 * `nombre:<nombre normalizado>` si no. El invitado puede volver y cambiar lo
 * que dijo sin que salgan filas repetidas.
 */
export async function guardarRsvp(
  e: EntradaRsvp,
): Promise<Escritura & { demo?: boolean; previo?: boolean | null }> {
  if (!enMemoria() && !servicio()) return SIN_BASE;

  const invitacionId = await idDeSlug(e.slug);
  if (!invitacionId) {
    // Las muestras del catálogo sin fila en la base: se dice la verdad.
    if (DEMO[e.slug]) return { ok: true, demo: true };
    return { ok: false, error: "No encontramos esta invitación. Prueba a recargar." };
  }

  const invitado = e.token ? await obtenerInvitado(e.slug, e.token) : null;
  const cupo = invitado?.cupo ?? CUPO_SIN_TOKEN;
  if (e.personas.length === 0) return { ok: false, error: "Nos falta tu nombre." };
  if (e.personas.length > cupo) {
    return {
      ok: false,
      error:
        cupo === 1
          ? "Esta invitación es para una persona."
          : `Esta invitación es para ${cupo} personas como mucho.`,
    };
  }

  const nombre = e.personas[0].nombre;
  const clave = invitado ? `invitado:${invitado.id}` : `nombre:${normalizarNombre(nombre)}`;
  const clavePrevia =
    !invitado && e.nombrePrevio ? `nombre:${normalizarNombre(e.nombrePrevio)}` : null;
  const renombrar = clavePrevia && clavePrevia !== clave ? clavePrevia : null;
  const ahora = new Date().toISOString();
  const fila = {
    invitado_id: invitado?.id ?? null,
    clave,
    nombre,
    asiste: e.asiste,
    personas: e.personas,
    acompanantes: Math.max(0, e.personas.length - 1),
    bus: e.asiste ? e.bus : "no",
    parada: e.asiste && e.bus !== "no" ? e.parada : null,
    mensaje: e.mensaje,
    telefono: e.telefono,
    actualizado_en: ahora,
  } as const;

  if (enMemoria()) {
    const m = memoria();
    if (renombrar) {
      const vieja = m.rsvp.find((r) => r.invitacion_id === invitacionId && r.clave === renombrar);
      if (vieja) {
        if (m.rsvp.some((r) => r.invitacion_id === invitacionId && r.clave === clave)) {
          m.rsvp = m.rsvp.filter((r) => r !== vieja);
        } else vieja.clave = clave;
      }
    }
    const previa = m.rsvp.find((r) => r.invitacion_id === invitacionId && r.clave === clave);
    // `previo` (para Avisos): null si es la primera respuesta; si no, si venía.
    const previo = previa ? previa.asiste : null;
    if (previa) Object.assign(previa, fila);
    else m.rsvp.push({ ...fila, id: nuevoId(), invitacion_id: invitacionId, creado_en: ahora });
    return { ok: true, previo };
  }

  const db = servicio()!;
  // Para Avisos: ¿había ya respuesta con esta clave (o la que se renombra)?
  const { data: antes } = await db
    .from("rsvp")
    .select("asiste")
    .eq("invitacion_id", invitacionId)
    .in("clave", renombrar ? [clave, renombrar] : [clave])
    .limit(1)
    .maybeSingle();
  const previo = antes ? Boolean(antes.asiste) : null;
  if (renombrar) {
    // La respuesta antigua pasa a llamarse como la nueva. Si ya hay una con
    // el nombre nuevo, la antigua sobra: se borra y gana el upsert.
    const { error: errMover } = await db
      .from("rsvp")
      .update({ clave })
      .eq("invitacion_id", invitacionId)
      .eq("clave", renombrar);
    if (errMover) {
      await db.from("rsvp").delete().eq("invitacion_id", invitacionId).eq("clave", renombrar);
    }
  }
  const { error } = await db
    .from("rsvp")
    .upsert({ ...fila, invitacion_id: invitacionId }, { onConflict: "invitacion_id,clave" });
  if (error) {
    console.error("[guardarRsvp]", error.message);
    return {
      ok: false,
      error: "No hemos podido guardarlo. Inténtalo otra vez o avisa a los novios por WhatsApp.",
    };
  }
  return { ok: true, previo };
}

// ─────────────────────────────────────────────────────────────────── muro

/** Todos los mensajes, aprobados o no. Para el panel de los novios. */
export async function obtenerMuro(invitacionId: string): Promise<FilaMuro[]> {
  if (enMemoria()) {
    return memoria()
      .muro.filter((x) => x.invitacion_id === invitacionId)
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
      .map((x) => sin(x, "invitacion_id"));
  }
  const db = servicio();
  if (!db) return [];
  const { data } = await db
    .from("muro")
    .select("id, nombre, mensaje, aprobado, creado_en")
    .eq("invitacion_id", invitacionId)
    .order("creado_en", { ascending: false });
  return (data ?? []) as FilaMuro[];
}

/** Solo los aprobados, para enseñarlos en la invitación si algún día se quiere. */
export async function obtenerMuroAprobado(slug: string): Promise<FilaMuro[]> {
  const id = await idDeSlug(slug);
  if (!id) return [];
  return (await obtenerMuro(id)).filter((m) => m.aprobado);
}

export async function guardarMensaje(entrada: {
  slug: string;
  nombre: string;
  mensaje: string;
}): Promise<Escritura & { demo?: boolean }> {
  if (!enMemoria() && !servicio()) return SIN_BASE;
  const invitacionId = await idDeSlug(entrada.slug);
  if (!invitacionId) {
    if (DEMO[entrada.slug]) return { ok: true, demo: true };
    return { ok: false, error: "No encontramos esta invitación. Prueba a recargar." };
  }

  if (enMemoria()) {
    memoria().muro.push({
      id: nuevoId(),
      invitacion_id: invitacionId,
      nombre: entrada.nombre,
      mensaje: entrada.mensaje,
      aprobado: true,
      creado_en: new Date().toISOString(),
    });
    return { ok: true };
  }

  const { error } = await servicio()!.from("muro").insert({
    invitacion_id: invitacionId,
    nombre: entrada.nombre,
    mensaje: entrada.mensaje,
  });
  if (error) {
    console.error("[guardarMensaje]", error.message);
    return { ok: false, error: "No hemos podido guardarlo. Inténtalo otra vez." };
  }
  return { ok: true };
}

/** Ocultar o volver a mostrar un mensaje. Acotado a SU invitación. */
export async function moderarMensaje(
  invitacionId: string,
  id: string,
  aprobado: boolean,
): Promise<Escritura> {
  if (enMemoria()) {
    const x = memoria().muro.find((m) => m.id === id && m.invitacion_id === invitacionId);
    if (x) x.aprobado = aprobado;
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db
    .from("muro")
    .update({ aprobado })
    .eq("id", id)
    .eq("invitacion_id", invitacionId);
  if (error) return { ok: false, error: "No se ha podido cambiar." };
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────── leads

export async function guardarLead(entrada: {
  email?: string;
  telefono?: string;
  origenSlug?: string;
  codigo?: string;
}): Promise<boolean> {
  const db = servicio();
  if (!db) {
    if (PRODUCCION) return false;
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

// ─────────────────────────────────────────────────────────────── el estudio

/** Alta y edición desde el estudio. Devuelve el id (nuevo o el mismo). */
export async function guardarInvitacion(
  id: string | null,
  datos: DatosInvitacion,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (enMemoria()) {
    const m = memoria();
    const repetido = [...m.invitaciones.values()].find(
      (f) => f.slug === datos.slug && f.id !== id,
    );
    if (repetido) return { ok: false, error: "Ya hay otra boda con ese slug." };
    const nuevo = id ?? datos.slug;
    const previa = id ? m.invitaciones.get(id) : undefined;
    m.invitaciones.set(nuevo, {
      apertura: null,
      musica: null,
      ...previa,
      ...datos,
      id: nuevo,
    });
    return { ok: true, id: nuevo };
  }
  const db = servicio();
  if (!db) return { ok: false, error: "Falta configurar Supabase." };

  const { data, error } = id
    ? await db.from("invitaciones").update(datos).eq("id", id).select("id").maybeSingle()
    : await db.from("invitaciones").insert(datos).select("id").maybeSingle();

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya hay otra boda con ese slug." };
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "Esa boda ya no existe." };
  return { ok: true, id: data.id as string };
}

/** El slug que tenía una boda antes de guardarla (para revalidar el viejo). */
export async function slugDe(id: string): Promise<string | null> {
  return (await obtenerPorId(id))?.slug ?? null;
}

/** ¿Se puede escribir? (Supabase o memoria local.) */
export function hayAlmacen() {
  return enMemoria() || Boolean(servicio());
}

export { haySupabase };

// ════════════════════════════════════════════════════════════════════════════
// Panel de los novios y cuentas (fase 2)
// ----------------------------------------------------------------------------
// Todo lo de aquí abajo lo usa `/panel/<slug>`. La regla es la de siempre:
// cada función recibe el `invitacionId` YA AUTORIZADO (lo resuelve
// `exigirAccesoBoda` en `lib/auth/acceso.ts`) y opera solo dentro de él.
//
// Las lecturas de tablas con columnas nuevas usan `select("*")`: si la
// migración 2026-11-cuentas.sql aún no está aplicada, el panel sigue
// funcionando con lo que haya en vez de caerse por una columna que no existe.
// ════════════════════════════════════════════════════════════════════════════

export type Rol = "pareja" | "planner" | "estudio";
export const ROLES: Rol[] = ["pareja", "planner", "estudio"];

export type Miembro = {
  id: string;
  email: string | null;
  user_id: string | null;
  rol: Rol;
  nombre: string | null;
  creado_en: string;
};

export type InvitadoPanel = Invitado & {
  enviado_en: string | null;
  recordado_en: string | null;
};

export type FilaMuroPanel = FilaMuro & { revisado: boolean };

export type FormaMesa = "redonda" | "imperial";

export type Mesa = {
  id: string;
  nombre: string;
  forma: FormaMesa;
  capacidad: number;
  orden: number;
  nota: string | null;
};

/** `persona` = `<rsvp_id>:<nombre normalizado>` (ver components/panel/util.ts). */
export type Asiento = { persona: string; mesa_id: string };

/** Un momento del día. Mismo dibujo que una `Parada`, con el lugar opcional. */
export type Momento = {
  hora: string;
  titulo: string;
  lugar?: string;
  direccion?: string;
  mapa?: string;
  icono?: string;
};

export type Cronograma = {
  items: Momento[];
  /** ¿Sale en la invitación (como «El gran día»)? */
  publico: boolean;
  /** Las paradas que tenía la invitación antes de publicar el cronograma. */
  original?: Parada[] | null;
};

export type ExtrasPanel = {
  cronograma: Cronograma | null;
  /** `YYYY-MM-DD` o null (= doce meses después de la boda). */
  online_hasta: string | null;
};

type MemoriaPanel = {
  miembros: (Miembro & { invitacion_id: string })[];
  mesas: (Mesa & { invitacion_id: string })[];
  asientos: (Asiento & { invitacion_id: string })[];
  extras: Map<string, ExtrasPanel>;
  envios: Map<string, { enviado_en: string | null; recordado_en: string | null }>;
  revisados: Set<string>;
  sembradas: Set<string>;
};

/** Almacén en memoria del panel, aparte del principal para no tocar su forma. */
function memoriaPanel(): MemoriaPanel {
  const g = globalThis as { __invitooPanel?: MemoriaPanel };
  g.__invitooPanel ??= {
    miembros: [],
    mesas: [],
    asientos: [],
    extras: new Map(),
    envios: new Map(),
    revisados: new Set(),
    sembradas: new Set(),
  };
  return g.__invitooPanel;
}

const ID_VALIDO = /^[A-Za-z0-9-]{1,64}$/;
const normalizarEmail = (e: string) => e.trim().toLowerCase();

/** ¿Estamos en el almacén en memoria (demo local, sin Supabase)? */
export function modoDemo() {
  return enMemoria();
}

/** Una boda por slug, publicada o no. Solo tras comprobar el acceso. */
export async function invitacionPorSlug(slug: string) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  if (enMemoria()) {
    const f = [...memoria().invitaciones.values()].find((x) => x.slug === slug);
    return f ? { ...aInvitacion(f), id: f.id } : null;
  }
  const db = servicio();
  if (!db) return null;
  const { data } = await db.from("invitaciones").select(CAMPOS).eq("slug", slug).maybeSingle();
  return data ? { ...aInvitacion(data as Fila), id: (data as Fila).id } : null;
}

/** El token del panel a partir del slug (para el acceso por enlace). */
export async function tokenDelPanelPorSlug(slug: string) {
  const id = await idDeSlug(slug);
  return id ? tokenDelPanel(id) : null;
}

// ──────────────────────────────────────────────────────────────── miembros

export async function listarMiembros(invitacionId: string): Promise<Miembro[]> {
  if (enMemoria()) {
    return memoriaPanel()
      .miembros.filter((m) => m.invitacion_id === invitacionId)
      .map((m) => sin(m, "invitacion_id"));
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("miembros")
    .select("id, email, user_id, rol, nombre, creado_en")
    .eq("invitacion_id", invitacionId)
    .order("creado_en", { ascending: true });
  if (error) {
    console.error("[listarMiembros]", error.message);
    return [];
  }
  return (data ?? []) as Miembro[];
}

export async function anadirMiembro(
  invitacionId: string,
  entrada: { email: string; rol: Rol; nombre?: string | null; invitadoPor?: string | null },
): Promise<Escritura> {
  const email = normalizarEmail(entrada.email);
  if (enMemoria()) {
    const m = memoriaPanel();
    if (m.miembros.some((x) => x.invitacion_id === invitacionId && x.email === email)) {
      return { ok: false, error: "Esa persona ya está en vuestra boda." };
    }
    m.miembros.push({
      id: nuevoId(),
      invitacion_id: invitacionId,
      email,
      user_id: null,
      rol: entrada.rol,
      nombre: entrada.nombre ?? null,
      creado_en: new Date().toISOString(),
    });
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db.from("miembros").insert({
    invitacion_id: invitacionId,
    email,
    rol: entrada.rol,
    nombre: entrada.nombre ?? null,
    invitado_por: entrada.invitadoPor ?? null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esa persona ya está en vuestra boda." };
    console.error("[anadirMiembro]", error.message);
    return { ok: false, error: "No hemos podido añadirla. Probad otra vez." };
  }
  return { ok: true };
}

export async function quitarMiembro(invitacionId: string, id: string): Promise<Escritura> {
  if (!ID_VALIDO.test(id)) return { ok: false, error: "No sabemos a quién quitar." };
  if (enMemoria()) {
    const m = memoriaPanel();
    m.miembros = m.miembros.filter((x) => !(x.id === id && x.invitacion_id === invitacionId));
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db.from("miembros").delete().eq("id", id).eq("invitacion_id", invitacionId);
  return error ? { ok: false, error: "No hemos podido quitarla." } : { ok: true };
}

/**
 * El rol de una cuenta en una boda, o null. Busca por `user_id` y, si aún no
 * está vinculada, por email (la primera vez que entra alguien invitado).
 */
export async function rolEnBoda(
  invitacionId: string,
  userId: string,
  email: string | null,
): Promise<Rol | null> {
  const correo = email ? normalizarEmail(email) : null;
  if (enMemoria()) {
    const x = memoriaPanel().miembros.find(
      (m) =>
        m.invitacion_id === invitacionId &&
        (m.user_id === userId || (!m.user_id && correo && m.email === correo)),
    );
    return x?.rol ?? null;
  }
  const db = servicio();
  if (!db) return null;
  const filtro = correo
    ? `user_id.eq.${userId},and(user_id.is.null,email.eq."${correo.replace(/"/g, "")}")`
    : `user_id.eq.${userId}`;
  const { data } = await db
    .from("miembros")
    .select("rol")
    .eq("invitacion_id", invitacionId)
    .or(filtro)
    .limit(1)
    .maybeSingle();
  return (data?.rol as Rol) ?? null;
}

/** Vincula las invitaciones por email a la cuenta. Se llama al entrar. */
export async function vincularMiembro(userId: string, email: string): Promise<void> {
  const correo = normalizarEmail(email);
  if (enMemoria()) {
    for (const m of memoriaPanel().miembros) {
      if (!m.user_id && m.email === correo) m.user_id = userId;
    }
    return;
  }
  const db = servicio();
  if (!db) return;
  const { error } = await db
    .from("miembros")
    .update({ user_id: userId })
    .is("user_id", null)
    .eq("email", correo);
  if (error) console.error("[vincularMiembro]", error.message);
}

/** ¿Tiene este email alguna boda? Decide si se manda el código o no. */
export async function emailTieneBoda(email: string): Promise<boolean> {
  const correo = normalizarEmail(email);
  if (enMemoria()) return memoriaPanel().miembros.some((m) => m.email === correo);
  const db = servicio();
  if (!db) return false;
  const { count } = await db
    .from("miembros")
    .select("id", { count: "exact", head: true })
    .eq("email", correo);
  return (count ?? 0) > 0;
}

export type BodaDeCuenta = {
  invitacion_id: string;
  slug: string;
  pareja: string;
  fecha: string;
  rol: Rol;
};

/** Las bodas de una cuenta, para `/panel` cuando hay más de una. */
export async function bodasDeCuenta(userId: string, email: string | null): Promise<BodaDeCuenta[]> {
  const correo = email ? normalizarEmail(email) : null;
  if (enMemoria()) {
    const mios = memoriaPanel().miembros.filter(
      (m) => m.user_id === userId || (correo && m.email === correo),
    );
    return mios.flatMap((m) => {
      const f = memoria().invitaciones.get(m.invitacion_id);
      return f
        ? [{ invitacion_id: f.id, slug: f.slug, pareja: `${f.nombre_a} y ${f.nombre_b}`, fecha: f.fecha, rol: m.rol }]
        : [];
    });
  }
  const db = servicio();
  if (!db) return [];
  const filtro = correo ? `user_id.eq.${userId},email.eq."${correo.replace(/"/g, "")}"` : `user_id.eq.${userId}`;
  const { data, error } = await db
    .from("miembros")
    .select("rol, invitaciones ( id, slug, nombre_a, nombre_b, fecha )")
    .or(filtro);
  if (error) {
    console.error("[bodasDeCuenta]", error.message);
    return [];
  }
  const vistas = new Set<string>();
  const salida: BodaDeCuenta[] = [];
  for (const fila of data ?? []) {
    const i = fila.invitaciones as unknown as Pick<Fila, "id" | "slug" | "nombre_a" | "nombre_b" | "fecha"> | null;
    if (!i || vistas.has(i.id)) continue;
    vistas.add(i.id);
    salida.push({ invitacion_id: i.id, slug: i.slug, pareja: `${i.nombre_a} y ${i.nombre_b}`, fecha: i.fecha, rol: fila.rol as Rol });
  }
  return salida.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ───────────────────────────────────────────────────── invitados (panel)

export async function listarInvitadosPanel(invitacionId: string): Promise<InvitadoPanel[]> {
  if (enMemoria()) {
    const envios = memoriaPanel().envios;
    return (await listarInvitados(invitacionId)).map((i) => ({
      ...i,
      enviado_en: envios.get(i.id)?.enviado_en ?? null,
      recordado_en: envios.get(i.id)?.recordado_en ?? null,
    }));
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("invitados")
    .select("*")
    .eq("invitacion_id", invitacionId)
    .order("grupo", { ascending: true, nullsFirst: false })
    .order("creado_en", { ascending: true });
  if (error) {
    console.error("[listarInvitadosPanel]", error.message);
    return [];
  }
  return (data ?? []).map((i) => ({
    id: i.id,
    nombre: i.nombre,
    grupo: i.grupo ?? null,
    cupo: Number(i.cupo) || 1,
    token: i.token,
    telefono: i.telefono ?? null,
    trato: TRATOS.includes(i.trato) ? i.trato : null,
    creado_en: i.creado_en,
    enviado_en: i.enviado_en ?? null,
    recordado_en: i.recordado_en ?? null,
  }));
}

/** Apunta que se le ha mandado el enlace (o un recordatorio) por WhatsApp. */
export async function marcarEnvio(
  invitacionId: string,
  ids: string[],
  tipo: "enviado" | "recordado",
): Promise<Escritura> {
  const validos = ids.filter((x) => ID_VALIDO.test(x)).slice(0, 600);
  if (validos.length === 0) return { ok: true };
  const ahora = new Date().toISOString();
  if (enMemoria()) {
    const propios = new Set(
      memoria().invitados.filter((i) => i.invitacion_id === invitacionId).map((i) => i.id),
    );
    const envios = memoriaPanel().envios;
    for (const id of validos) {
      if (!propios.has(id)) continue;
      const e = envios.get(id) ?? { enviado_en: null, recordado_en: null };
      if (tipo === "enviado") e.enviado_en = ahora;
      else e.recordado_en = ahora;
      envios.set(id, e);
    }
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db
    .from("invitados")
    .update(tipo === "enviado" ? { enviado_en: ahora } : { recordado_en: ahora })
    .eq("invitacion_id", invitacionId)
    .in("id", validos);
  if (error) {
    console.error("[marcarEnvio]", error.message);
    return { ok: false, error: "No hemos podido apuntarlo." };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────── muro (panel)

export async function obtenerMuroPanel(invitacionId: string): Promise<FilaMuroPanel[]> {
  if (enMemoria()) {
    const revisados = memoriaPanel().revisados;
    return (await obtenerMuro(invitacionId)).map((m) => ({ ...m, revisado: revisados.has(m.id) }));
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("muro")
    .select("*")
    .eq("invitacion_id", invitacionId)
    .order("creado_en", { ascending: false });
  if (error) {
    console.error("[obtenerMuroPanel]", error.message);
    return [];
  }
  return (data ?? []).map((m) => ({
    id: m.id,
    nombre: m.nombre,
    mensaje: m.mensaje,
    aprobado: m.aprobado !== false,
    creado_en: m.creado_en,
    // Sin la columna (migración pendiente) todo cuenta como visto.
    revisado: m.revisado ?? true,
  }));
}

/** Marca mensajes como vistos y, si se indica, los oculta o los enseña. */
export async function revisarMensajes(
  invitacionId: string,
  ids: string[],
  aprobado?: boolean,
): Promise<Escritura> {
  const validos = ids.filter((x) => ID_VALIDO.test(x)).slice(0, 500);
  if (validos.length === 0) return { ok: true };
  if (enMemoria()) {
    const p = memoriaPanel();
    for (const m of memoria().muro) {
      if (m.invitacion_id !== invitacionId || !validos.includes(m.id)) continue;
      p.revisados.add(m.id);
      if (aprobado !== undefined) m.aprobado = aprobado;
    }
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const cambios: Record<string, boolean> = { revisado: true };
  if (aprobado !== undefined) cambios.aprobado = aprobado;
  const { error } = await db
    .from("muro")
    .update(cambios)
    .eq("invitacion_id", invitacionId)
    .in("id", validos);
  if (error) {
    // Sin la columna `revisado` todavía: al menos que funcione ocultar.
    if (aprobado !== undefined) {
      for (const id of validos) {
        const r = await moderarMensaje(invitacionId, id, aprobado);
        if (!r.ok) return r;
      }
      return { ok: true };
    }
    console.error("[revisarMensajes]", error.message);
    return { ok: false, error: "No hemos podido guardarlo." };
  }
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────  mesas

export async function listarMesas(invitacionId: string): Promise<Mesa[]> {
  if (enMemoria()) {
    return memoriaPanel()
      .mesas.filter((m) => m.invitacion_id === invitacionId)
      .sort((a, b) => a.orden - b.orden)
      .map((m) => sin(m, "invitacion_id"));
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("mesas")
    .select("id, nombre, forma, capacidad, orden, nota")
    .eq("invitacion_id", invitacionId)
    .order("orden", { ascending: true })
    .order("creado_en", { ascending: true });
  if (error) {
    console.error("[listarMesas]", error.message);
    return [];
  }
  return (data ?? []) as Mesa[];
}

export type EntradaMesa = {
  nombre: string;
  forma: FormaMesa;
  capacidad: number;
  nota: string | null;
};

export async function guardarMesa(
  invitacionId: string,
  id: string | null,
  datos: EntradaMesa,
): Promise<Escritura> {
  if (enMemoria()) {
    const p = memoriaPanel();
    if (id) {
      const m = p.mesas.find((x) => x.id === id && x.invitacion_id === invitacionId);
      if (!m) return { ok: false, error: "Esa mesa ya no existe." };
      Object.assign(m, datos);
    } else {
      const orden = p.mesas.filter((x) => x.invitacion_id === invitacionId).length;
      p.mesas.push({ ...datos, id: nuevoId(), invitacion_id: invitacionId, orden });
    }
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  if (id) {
    const { error } = await db.from("mesas").update(datos).eq("id", id).eq("invitacion_id", invitacionId);
    return error ? { ok: false, error: "No hemos podido guardar la mesa." } : { ok: true };
  }
  const { count } = await db
    .from("mesas")
    .select("id", { count: "exact", head: true })
    .eq("invitacion_id", invitacionId);
  const { error } = await db
    .from("mesas")
    .insert({ ...datos, invitacion_id: invitacionId, orden: count ?? 0 });
  if (error) {
    console.error("[guardarMesa]", error.message);
    return { ok: false, error: "No hemos podido crear la mesa." };
  }
  return { ok: true };
}

export async function borrarMesa(invitacionId: string, id: string): Promise<Escritura> {
  if (!ID_VALIDO.test(id)) return { ok: false, error: "No sabemos qué mesa borrar." };
  if (enMemoria()) {
    const p = memoriaPanel();
    p.mesas = p.mesas.filter((x) => !(x.id === id && x.invitacion_id === invitacionId));
    p.asientos = p.asientos.filter((x) => !(x.mesa_id === id && x.invitacion_id === invitacionId));
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db.from("mesas").delete().eq("id", id).eq("invitacion_id", invitacionId);
  return error ? { ok: false, error: "No hemos podido borrar la mesa." } : { ok: true };
}

export async function listarAsientos(invitacionId: string): Promise<Asiento[]> {
  if (enMemoria()) {
    return memoriaPanel()
      .asientos.filter((a) => a.invitacion_id === invitacionId)
      .map((a) => sin(a, "invitacion_id"));
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("mesa_asientos")
    .select("persona, mesa_id")
    .eq("invitacion_id", invitacionId);
  if (error) {
    console.error("[listarAsientos]", error.message);
    return [];
  }
  return (data ?? []) as Asiento[];
}

/** Sienta a unas personas en una mesa (o las levanta con `mesaId = null`). */
export async function sentarPersonas(
  invitacionId: string,
  personas: string[],
  mesaId: string | null,
): Promise<Escritura> {
  const lista = personas.filter((p) => p.length > 0 && p.length <= 200).slice(0, 60);
  if (lista.length === 0) return { ok: true };
  if (mesaId && !ID_VALIDO.test(mesaId)) return { ok: false, error: "Esa mesa no existe." };
  if (enMemoria()) {
    const p = memoriaPanel();
    if (mesaId && !p.mesas.some((m) => m.id === mesaId && m.invitacion_id === invitacionId)) {
      return { ok: false, error: "Esa mesa ya no existe." };
    }
    p.asientos = p.asientos.filter(
      (a) => !(a.invitacion_id === invitacionId && lista.includes(a.persona)),
    );
    if (mesaId) {
      for (const persona of lista) p.asientos.push({ invitacion_id: invitacionId, persona, mesa_id: mesaId });
    }
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  if (!mesaId) {
    const { error } = await db
      .from("mesa_asientos")
      .delete()
      .eq("invitacion_id", invitacionId)
      .in("persona", lista);
    return error ? { ok: false, error: "No hemos podido levantarla de la mesa." } : { ok: true };
  }
  // La mesa tiene que ser de ESTA boda: un id ajeno no sirve aunque exista.
  const { data: mesa } = await db
    .from("mesas")
    .select("id")
    .eq("id", mesaId)
    .eq("invitacion_id", invitacionId)
    .maybeSingle();
  if (!mesa) return { ok: false, error: "Esa mesa ya no existe." };
  const { error } = await db.from("mesa_asientos").upsert(
    lista.map((persona) => ({ invitacion_id: invitacionId, persona, mesa_id: mesaId })),
    { onConflict: "invitacion_id,persona" },
  );
  if (error) {
    console.error("[sentarPersonas]", error.message);
    return { ok: false, error: "No hemos podido sentarla." };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────── cronograma y caducidad

function leerCronograma(x: unknown): Cronograma | null {
  if (!x || typeof x !== "object") return null;
  const c = x as Partial<Cronograma>;
  if (!Array.isArray(c.items)) return null;
  return {
    items: c.items.filter((i) => i && typeof i.hora === "string" && typeof i.titulo === "string"),
    publico: Boolean(c.publico),
    original: Array.isArray(c.original) ? c.original : null,
  };
}

export async function obtenerExtras(invitacionId: string): Promise<ExtrasPanel> {
  if (enMemoria()) {
    return memoriaPanel().extras.get(invitacionId) ?? { cronograma: null, online_hasta: null };
  }
  const db = servicio();
  if (!db) return { cronograma: null, online_hasta: null };
  const { data, error } = await db.from("invitaciones").select("*").eq("id", invitacionId).maybeSingle();
  if (error || !data) return { cronograma: null, online_hasta: null };
  return {
    cronograma: leerCronograma(data.cronograma),
    online_hasta: typeof data.online_hasta === "string" ? data.online_hasta : null,
  };
}

/**
 * Hasta cuándo sigue en línea la invitación (`YYYY-MM-DD`). `null` vuelve a
 * lo que incluye el plan: doce meses después de la boda. Solo el estudio.
 */
export async function guardarOnlineHasta(invitacionId: string, fecha: string | null): Promise<Escritura> {
  if (fecha !== null && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "Fecha no válida." };
  if (enMemoria()) {
    const p = memoriaPanel();
    const e = p.extras.get(invitacionId) ?? { cronograma: null, online_hasta: null };
    p.extras.set(invitacionId, { ...e, online_hasta: fecha });
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db.from("invitaciones").update({ online_hasta: fecha }).eq("id", invitacionId);
  if (error) {
    console.error("[guardarOnlineHasta]", error.message);
    return { ok: false, error: "No hemos podido guardar la fecha." };
  }
  return { ok: true };
}

/**
 * Guarda el cronograma. Si es público, pasa a ser el itinerario de la
 * invitación (las paradas que había se guardan en `original` para poder
 * volver a ellas al desmarcarlo).
 */
export async function guardarCronograma(
  invitacionId: string,
  c: { items: Momento[]; publico: boolean },
): Promise<Escritura> {
  const actual = await obtenerPorId(invitacionId);
  if (!actual) return { ok: false, error: "No encontramos vuestra boda." };
  const previo = (await obtenerExtras(invitacionId)).cronograma;

  const itinerario = actual.bloques.find((b) => b.t === "itinerario") as
    | Extract<Bloque, { t: "itinerario" }>
    | undefined;
  const ordenados = [...c.items].sort((a, b) => a.hora.localeCompare(b.hora));
  let original = previo?.original ?? null;
  let bloques: Bloque[] | null = null;

  const comoParadas: Parada[] = ordenados.map((m) => ({
    titulo: m.titulo,
    hora: m.hora,
    lugar: m.lugar ?? "",
    direccion: m.direccion ?? "",
    ...(m.mapa ? { mapa: m.mapa } : {}),
    ...(m.icono ? { icono: m.icono } : {}),
  }));

  if (c.publico) {
    if (!previo?.publico) original = itinerario?.paradas ?? [];
    bloques = itinerario
      ? actual.bloques.map((b) => (b.t === "itinerario" ? { ...b, paradas: comoParadas } : b))
      : [...actual.bloques, { t: "itinerario", paradas: comoParadas }];
  } else if (previo?.publico) {
    // Se deja de publicar: vuelve lo que había.
    bloques =
      original && original.length
        ? actual.bloques.map((b) => (b.t === "itinerario" ? { ...b, paradas: original! } : b))
        : actual.bloques.filter((b) => b.t !== "itinerario");
    original = null;
  }

  const cronograma: Cronograma = { items: ordenados, publico: c.publico, original };

  if (enMemoria()) {
    const p = memoriaPanel();
    const e = p.extras.get(invitacionId) ?? { cronograma: null, online_hasta: null };
    p.extras.set(invitacionId, { ...e, cronograma });
    if (bloques) {
      const f = memoria().invitaciones.get(invitacionId);
      if (f) f.bloques = bloques;
    }
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db
    .from("invitaciones")
    .update(bloques ? { cronograma, bloques } : { cronograma })
    .eq("id", invitacionId);
  if (error) {
    console.error("[guardarCronograma]", error.message);
    return { ok: false, error: "No hemos podido guardar el cronograma." };
  }
  return { ok: true };
}

/**
 * Cambios sencillos que la pareja hace desde el panel: color y textos.
 *
 * `tema` es un PARCHE que se funde con el tema guardado (así no se pierden
 * `movimiento` ni lo demás). Una clave con valor `undefined` se borra: sirve
 * para que `acentoTexto`/`sobreAcento` se recalculen al cambiar de color.
 */
export async function actualizarContenido(
  invitacionId: string,
  cambios: { tema?: Partial<Tema>; bloques?: Bloque[] },
): Promise<Escritura> {
  if (!cambios.tema && !cambios.bloques) return { ok: true };
  const fundir = (previo: Tema): Tema => {
    const t = { ...previo, ...cambios.tema } as Record<string, unknown>;
    for (const [k, v] of Object.entries(cambios.tema ?? {})) if (v === undefined) delete t[k];
    return t as Tema;
  };
  if (enMemoria()) {
    const f = memoria().invitaciones.get(invitacionId);
    if (!f) return { ok: false, error: "No encontramos vuestra boda." };
    if (cambios.tema) f.tema = fundir(f.tema);
    if (cambios.bloques) f.bloques = cambios.bloques;
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const fila: { tema?: Tema; bloques?: Bloque[] } = {};
  if (cambios.tema) {
    const { data, error } = await db.from("invitaciones").select("tema").eq("id", invitacionId).maybeSingle();
    if (error || !data) return { ok: false, error: "No encontramos vuestra boda." };
    fila.tema = fundir((data.tema ?? {}) as Tema);
  }
  if (cambios.bloques) fila.bloques = cambios.bloques;
  const { error } = await db.from("invitaciones").update(fila).eq("id", invitacionId);
  if (error) {
    console.error("[actualizarContenido]", error.message);
    return { ok: false, error: "No hemos podido guardar los cambios." };
  }
  return { ok: true };
}

/**
 * Guarda `tema.movimiento` (agente M) fundiéndolo con el tema guardado.
 * `null` o `{}` lo borra y la boda vuelve a lo recomendado por la plantilla.
 */
export async function guardarMovimientoDeBoda(
  invitacionId: string,
  movimiento: Tema["movimiento"] | null,
): Promise<Escritura> {
  const fundir = (tema: Tema): Tema => {
    const copia: Tema = { ...tema };
    if (movimiento && Object.keys(movimiento).length) copia.movimiento = movimiento;
    else delete copia.movimiento;
    return copia;
  };
  if (enMemoria()) {
    const f = memoria().invitaciones.get(invitacionId);
    if (!f) return { ok: false, error: "No encontramos esa boda." };
    f.tema = fundir(f.tema);
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { data, error: errorLectura } = await db
    .from("invitaciones")
    .select("tema")
    .eq("id", invitacionId)
    .maybeSingle();
  if (errorLectura || !data) {
    if (errorLectura) console.error("[guardarMovimientoDeBoda]", errorLectura.message);
    return { ok: false, error: "No encontramos esa boda." };
  }
  const { error } = await db
    .from("invitaciones")
    .update({ tema: fundir(data.tema as Tema) })
    .eq("id", invitacionId);
  if (error) {
    console.error("[guardarMovimientoDeBoda]", error.message);
    return { ok: false, error: "No hemos podido guardar el movimiento." };
  }
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────── RGPD

/** Todo lo de una boda, para la descarga de datos (art. 20 RGPD). */
export async function exportarDatosBoda(invitacionId: string) {
  const [invitacion, invitados, rsvp, muro, mesas, asientos, miembros, extras] = await Promise.all([
    obtenerPorId(invitacionId),
    listarInvitadosPanel(invitacionId),
    obtenerRsvps(invitacionId),
    obtenerMuroPanel(invitacionId),
    listarMesas(invitacionId),
    listarAsientos(invitacionId),
    listarMiembros(invitacionId),
    obtenerExtras(invitacionId),
  ]);
  return {
    exportado_en: new Date().toISOString(),
    invitacion,
    extras,
    miembros: miembros.map((m) => ({ email: m.email, rol: m.rol, nombre: m.nombre, desde: m.creado_en })),
    invitados,
    respuestas: rsvp,
    mensajes: muro,
    mesas,
    asientos,
  };
}

/**
 * Borra los datos de los invitados (lista, respuestas, mensajes y mesas).
 * La invitación se queda. Es irreversible: la acción pide confirmación.
 */
export async function borrarDatosDeInvitados(invitacionId: string): Promise<Escritura> {
  if (enMemoria()) {
    const m = memoria();
    const p = memoriaPanel();
    m.invitados = m.invitados.filter((x) => x.invitacion_id !== invitacionId);
    m.rsvp = m.rsvp.filter((x) => x.invitacion_id !== invitacionId);
    m.muro = m.muro.filter((x) => x.invitacion_id !== invitacionId);
    p.mesas = p.mesas.filter((x) => x.invitacion_id !== invitacionId);
    p.asientos = p.asientos.filter((x) => x.invitacion_id !== invitacionId);
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  // Orden: lo que depende primero. Las mesas arrastran sus asientos.
  for (const tabla of ["rsvp", "muro", "mesas", "invitados"]) {
    const { error } = await db.from(tabla).delete().eq("invitacion_id", invitacionId);
    if (error && tabla !== "mesas") {
      console.error("[borrarDatosDeInvitados]", tabla, error.message);
      return { ok: false, error: "No hemos podido borrarlo todo. Escribidnos y lo hacemos nosotros." };
    }
  }
  return { ok: true };
}

/** Retira la invitación de internet (deja de verse; los datos se pueden borrar aparte). */
export async function archivarInvitacion(invitacionId: string): Promise<Escritura> {
  if (enMemoria()) {
    const f = memoria().invitaciones.get(invitacionId);
    if (f) f.estado = "archivada";
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db.from("invitaciones").update({ estado: "archivada" }).eq("id", invitacionId);
  return error ? { ok: false, error: "No hemos podido retirarla." } : { ok: true };
}

// ──────────────────────────────────────────────────────────── demo local

/**
 * Siembra la boda de ejemplo con respuestas, mensajes y una mesa para que el
 * panel de la demo no se vea vacío. Solo en memoria y solo una vez.
 */
export async function sembrarDemo(slug: string): Promise<void> {
  if (!enMemoria()) return;
  const p = memoriaPanel();
  if (p.sembradas.has(slug)) return;
  p.sembradas.add(slug);
  const m = memoria();
  const f = [...m.invitaciones.values()].find((x) => x.slug === slug);
  if (!f) return;
  const dias = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

  const extra: (Invitado & { invitacion_id: string })[] = [
    { id: "m4", invitacion_id: f.id, nombre: "Lucía y Pablo", grupo: "Amigos", cupo: 2, token: "demo-lucia", telefono: "600 111 222", trato: "queridos", creado_en: dias(20) },
    { id: "m5", invitacion_id: f.id, nombre: "Abuela Pilar", grupo: "Familia", cupo: 1, token: "demo-pilar", telefono: null, trato: "querida", creado_en: dias(20) },
    { id: "m6", invitacion_id: f.id, nombre: "Equipo de la oficina", grupo: "Trabajo", cupo: 3, token: "demo-oficina", telefono: null, trato: null, creado_en: dias(12) },
  ];
  for (const i of extra) if (!m.invitados.some((x) => x.id === i.id)) m.invitados.push(i);
  p.envios.set("m3", { enviado_en: dias(10), recordado_en: null });
  p.envios.set("m5", { enviado_en: dias(9), recordado_en: null });

  if (!m.rsvp.some((r) => r.invitacion_id === f.id)) {
    const rsvp = (
      id: string,
      invitado: string,
      asiste: boolean,
      personas: PersonaRsvp[],
      bus: Bus,
      parada: string | null,
      hace: number,
    ) => ({
      id,
      invitacion_id: f.id,
      invitado_id: invitado,
      clave: `invitado:${invitado}`,
      nombre: personas[0]?.nombre ?? "",
      asiste,
      personas,
      bus,
      parada,
      mensaje: null,
      telefono: null,
      creado_en: dias(hace),
      actualizado_en: dias(hace),
    });
    m.rsvp.push(
      rsvp("r1", "m1", true, [
        { nombre: "Carmen", menu: "adulto", alergenos: [], alergias_texto: null },
        { nombre: "Andrés", menu: "vegetariano", alergenos: ["frutos_cascara"], alergias_texto: null, consentimiento_salud: true },
      ], "ida_vuelta", "Plaza de España", 2),
      rsvp("r2", "m2", true, [
        { nombre: "Marisa Fernández", menu: "adulto", alergenos: [], alergias_texto: null },
        // Sin permiso: el panel avisa y el Excel no lleva el detalle.
        { nombre: "Luis Fernández", menu: "adulto", alergenos: ["gluten"], alergias_texto: "Celíaco", consentimiento_salud: false },
        { nombre: "Sofía Fernández", menu: "infantil", alergenos: [], alergias_texto: null },
      ], "ida", "Plaza de España", 5),
      rsvp("r3", "m4", false, [{ nombre: "Lucía", menu: "adulto", alergenos: [], alergias_texto: null }], "no", null, 8),
    );
  }
  if (!m.muro.some((x) => x.invitacion_id === f.id)) {
    m.muro.push(
      { id: "w1", invitacion_id: f.id, nombre: "Carmen", mensaje: "¡Qué ganas de veros! Allí estaremos con el pañuelo preparado.", aprobado: true, creado_en: dias(1) },
      { id: "w2", invitacion_id: f.id, nombre: "Íñigo", mensaje: "Os quiero mucho, pareja. Prometo no cantar en el autobús.", aprobado: true, creado_en: dias(6) },
    );
    p.revisados.add("w2");
  }
  if (!p.mesas.some((x) => x.invitacion_id === f.id)) {
    p.mesas.push(
      { id: "t1", invitacion_id: f.id, nombre: "Mesa presidencial", forma: "imperial", capacidad: 8, orden: 0, nota: null },
      { id: "t2", invitacion_id: f.id, nombre: "Familia", forma: "redonda", capacidad: 10, orden: 1, nota: null },
    );
  }
  // El panel de prueba también tiene a alguien en «Cuenta».
  if (!p.miembros.some((x) => x.invitacion_id === f.id)) {
    p.miembros.push({
      id: "u1",
      invitacion_id: f.id,
      email: "pareja@ejemplo.es",
      user_id: null,
      rol: "pareja",
      nombre: `${f.nombre_a} y ${f.nombre_b}`,
      creado_en: dias(30),
    });
  }
}

// ─────────────────────────────────────────────────── contrato (planes-boda)

/**
 * El plan y los añadidos contratados de una boda (ver `lib/planes-boda.ts`).
 * Columnas `invitaciones.plan` y `invitaciones.anadidos` (migración
 * 2026-11-deseos.sql). Sin migrar o sin dato: plan «invitoo», sin añadidos.
 * El plan de En directo NO va aquí: vive en su configuración (H1).
 */
export async function obtenerContrato(invitacionId: string): Promise<{ plan: string; anadidos: string[] }> {
  const porDefecto = { plan: "invitoo", anadidos: [] as string[] };
  if (enMemoria()) {
    const g = globalThis as { __invitooContratos?: Map<string, { plan: string; anadidos: string[] }> };
    return g.__invitooContratos?.get(invitacionId) ?? porDefecto;
  }
  const db = servicio();
  if (!db) return porDefecto;
  const { data, error } = await db.from("invitaciones").select("*").eq("id", invitacionId).maybeSingle();
  if (error || !data) return porDefecto;
  return {
    plan: typeof data.plan === "string" ? data.plan : "invitoo",
    anadidos: Array.isArray(data.anadidos) ? data.anadidos.map(String) : [],
  };
}

/** Lo fija el estudio (o el pago). En local, en memoria. */
export async function guardarContrato(invitacionId: string, c: { plan: string; anadidos: string[] }): Promise<Escritura> {
  if (enMemoria()) {
    const g = globalThis as { __invitooContratos?: Map<string, { plan: string; anadidos: string[] }> };
    (g.__invitooContratos ??= new Map()).set(invitacionId, c);
    return { ok: true };
  }
  const db = servicio();
  if (!db) return SIN_BASE;
  const { error } = await db.from("invitaciones").update({ plan: c.plan, anadidos: c.anadidos }).eq("id", invitacionId);
  return error ? { ok: false, error: "No se ha podido guardar el plan." } : { ok: true };
}
