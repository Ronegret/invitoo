import "server-only";

import { randomBytes } from "node:crypto";
import { modoDemo, obtenerMuroPanel, revisarMensajes, type Escritura } from "@/lib/datos";
import { urlsLectura } from "@/lib/momentos/almacen";
import { cambiarMomento, listarMomentos } from "@/lib/momentos/datos";
import { servicio } from "@/lib/supabase/clientes";

/**
 * El Libro de buenos deseos: los datos.
 *
 * Un deseo puede venir de tres sitios y aquí se ven todos juntos:
 *   · `muro`    — el muro de la invitación (tabla `muro`),
 *   · `directo` — los mensajes de «En directo» (tabla `momentos`, tipo mensaje),
 *   · `qr`      — el QR propio de deseos, /i/<slug>/deseos (tabla `deseos`).
 *
 * Lo que la pareja decide (favorito, leído, corrección, ocultar en el libro)
 * vive en `deseos_marcas`, para cualquier origen: la fila original nunca se
 * reescribe. Ocultar un deseo del muro o de En directo lo oculta TAMBIÉN en
 * su sitio (la invitación o la pantalla), con las funciones de siempre.
 *
 * En local (sin Supabase) todo vive en memoria del proceso, como el resto de
 * la demo.
 */

export type OrigenDeseo = "muro" | "directo" | "qr";
export const ORIGENES: OrigenDeseo[] = ["muro", "directo", "qr"];
export const NOMBRE_ORIGEN: Record<OrigenDeseo, string> = {
  muro: "Invitación",
  directo: "En directo",
  qr: "QR de deseos",
};

export type Deseo = {
  /** `<origen>:<ref>`: único en la boda. */
  clave: string;
  origen: OrigenDeseo;
  ref: string;
  nombre: string;
  /** El que sale en el libro: la corrección si la hay. */
  texto: string;
  original: string;
  corregido: boolean;
  /** URL firmada de lectura (corta duración) o null. */
  foto: string | null;
  /** Ruta del bucket (solo servidor: el PDF la lee directamente). */
  fotoRuta: string | null;
  oculto: boolean;
  favorito: boolean;
  leido: boolean;
  creado: string;
};

type Marca = {
  favorito: boolean;
  oculto: boolean;
  leido: boolean;
  correccion: string | null;
};

type FilaQr = {
  id: string;
  invitacion_id: string;
  nombre: string;
  texto: string;
  foto_ruta: string | null;
  dispositivo: string | null;
  ip_huella: string | null;
  creado_en: string;
};

type Memoria = { qr: FilaQr[]; marcas: Map<string, Marca> };

function memoria(): Memoria {
  const g = globalThis as { __invitooDeseos?: Memoria };
  g.__invitooDeseos ??= { qr: [], marcas: new Map() };
  return g.__invitooDeseos;
}

const claveMarca = (inv: string, origen: OrigenDeseo, ref: string) => `${inv}|${origen}|${ref}`;
const SIN_MARCA: Marca = { favorito: false, oculto: false, leido: false, correccion: null };
const REF = /^[A-Za-z0-9-]{1,64}$/;

export function esOrigen(x: unknown): x is OrigenDeseo {
  return typeof x === "string" && (ORIGENES as string[]).includes(x);
}

// ──────────────────────────────────────────────────────────────── lectura

async function leerMarcas(invitacionId: string): Promise<Map<string, Marca>> {
  if (modoDemo()) {
    const m = memoria().marcas;
    const propias = new Map<string, Marca>();
    for (const [k, v] of m) if (k.startsWith(`${invitacionId}|`)) propias.set(k, v);
    return propias;
  }
  const db = servicio();
  const mapa = new Map<string, Marca>();
  if (!db) return mapa;
  const { data, error } = await db
    .from("deseos_marcas")
    .select("origen, ref, favorito, oculto, leido, correccion")
    .eq("invitacion_id", invitacionId);
  if (error) {
    // Migración 2026-11-deseos.sql sin aplicar: sin marcas, pero sin caerse.
    console.error("[deseos.marcas]", error.message);
    return mapa;
  }
  for (const r of data ?? []) {
    mapa.set(claveMarca(invitacionId, r.origen as OrigenDeseo, String(r.ref)), {
      favorito: Boolean(r.favorito),
      oculto: Boolean(r.oculto),
      leido: Boolean(r.leido),
      correccion: (r.correccion as string | null) ?? null,
    });
  }
  return mapa;
}

async function leerQr(invitacionId: string): Promise<FilaQr[]> {
  if (modoDemo()) {
    return memoria()
      .qr.filter((x) => x.invitacion_id === invitacionId)
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en));
  }
  const db = servicio();
  if (!db) return [];
  const { data, error } = await db
    .from("deseos")
    .select("id, invitacion_id, nombre, texto, foto_ruta, dispositivo, ip_huella, creado_en")
    .eq("invitacion_id", invitacionId)
    .order("creado_en", { ascending: false })
    .limit(3000);
  if (error) {
    console.error("[deseos.qr]", error.message);
    return [];
  }
  return (data ?? []) as FilaQr[];
}

/**
 * Todos los deseos de una boda, de los tres orígenes, más recientes primero.
 * `invitacionId` YA autorizado (lo da `exigirPanel`).
 */
export async function listarDeseos(invitacionId: string): Promise<Deseo[]> {
  const [marcas, muro, directo, qr] = await Promise.all([
    leerMarcas(invitacionId),
    obtenerMuroPanel(invitacionId),
    // Mensajes de En directo y pies de foto (fotos y vídeos con `mensaje`).
    listarMomentos(invitacionId, { limite: 3000 }).catch(() => []),
    leerQr(invitacionId),
  ]);
  const conTexto = directo.filter((x) => x.mensaje && x.mensaje.trim());
  const fotos = await urlsLectura(
    [...qr.map((x) => x.foto_ruta), ...conTexto.map((x) => (x.tipo === "mensaje" ? null : x.ruta_miniatura))].filter(
      (r): r is string => Boolean(r),
    ),
    60 * 60,
  );
  const marca = (o: OrigenDeseo, ref: string) => marcas.get(claveMarca(invitacionId, o, ref)) ?? SIN_MARCA;
  const montar = (
    origen: OrigenDeseo,
    ref: string,
    nombre: string,
    texto: string,
    creado: string,
    extra: { oculto?: boolean; leido?: boolean; foto?: string | null; fotoRuta?: string | null },
  ): Deseo => {
    const m = marca(origen, ref);
    return {
      clave: `${origen}:${ref}`,
      origen,
      ref,
      nombre: nombre.trim(),
      texto: (m.correccion ?? texto).trim(),
      original: texto.trim(),
      corregido: m.correccion !== null && m.correccion !== texto,
      foto: extra.foto ?? null,
      fotoRuta: extra.fotoRuta ?? null,
      oculto: Boolean(extra.oculto) || m.oculto,
      favorito: m.favorito,
      leido: Boolean(extra.leido) || m.leido,
      creado,
    };
  };

  const todos: Deseo[] = [
    ...muro.map((x) => montar("muro", x.id, x.nombre, x.mensaje, x.creado_en, { oculto: !x.aprobado, leido: x.revisado })),
    ...conTexto.map((x) => {
      const ruta = x.tipo === "mensaje" ? null : x.ruta_miniatura;
      return montar("directo", x.id, x.autor, x.mensaje ?? "", x.creado, {
        oculto: x.estado !== "visible",
        foto: ruta ? (fotos.get(ruta) ?? null) : null,
        fotoRuta: ruta,
      });
    }),
    ...qr.map((x) =>
      montar("qr", x.id, x.nombre, x.texto, x.creado_en, { foto: x.foto_ruta ? (fotos.get(x.foto_ruta) ?? null) : null, fotoRuta: x.foto_ruta }),
    ),
  ];
  return todos.sort((a, b) => b.creado.localeCompare(a.creado));
}

/** Cuántos sin leer (para la insignia y «Hoy»). */
export async function contarDeseosNuevos(invitacionId: string): Promise<number> {
  return (await listarDeseos(invitacionId)).filter((d) => !d.leido && !d.oculto).length;
}

// ──────────────────────────────────────────────────────────────── escritura

async function escribirMarca(
  invitacionId: string,
  origen: OrigenDeseo,
  ref: string,
  cambios: Partial<Marca>,
): Promise<Escritura> {
  if (modoDemo()) {
    const m = memoria().marcas;
    const k = claveMarca(invitacionId, origen, ref);
    m.set(k, { ...(m.get(k) ?? SIN_MARCA), ...cambios });
    return { ok: true };
  }
  const db = servicio();
  if (!db) return { ok: false, error: "Ahora mismo no podemos guardarlo. Probad dentro de un rato." };
  const { data: previa } = await db
    .from("deseos_marcas")
    .select("favorito, oculto, leido, correccion")
    .eq("invitacion_id", invitacionId)
    .eq("origen", origen)
    .eq("ref", ref)
    .maybeSingle();
  const { error } = await db.from("deseos_marcas").upsert(
    {
      invitacion_id: invitacionId,
      origen,
      ref,
      ...SIN_MARCA,
      ...(previa ?? {}),
      ...cambios,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "invitacion_id,origen,ref" },
  );
  if (error) {
    console.error("[deseos.marca]", error.message);
    return { ok: false, error: "No hemos podido guardarlo." };
  }
  return { ok: true };
}

export type CambioDeseo =
  | { que: "favorito"; valor: boolean }
  | { que: "ocultar"; valor: boolean }
  | { que: "leido" }
  | { que: "corregir"; texto: string | null };

/**
 * Lo que la pareja hace con un deseo. Ocultar uno del muro o de En directo
 * lo oculta también en la invitación o en la pantalla.
 */
export async function cambiarDeseo(
  invitacionId: string,
  origen: OrigenDeseo,
  ref: string,
  c: CambioDeseo,
): Promise<Escritura> {
  if (!REF.test(ref)) return { ok: false, error: "Ese deseo ya no está." };
  switch (c.que) {
    case "favorito":
      return escribirMarca(invitacionId, origen, ref, { favorito: c.valor, leido: true });
    case "leido":
      if (origen === "muro") await revisarMensajes(invitacionId, [ref]);
      return escribirMarca(invitacionId, origen, ref, { leido: true });
    case "corregir":
      return escribirMarca(invitacionId, origen, ref, { correccion: c.texto, leido: true });
    case "ocultar":
      if (origen === "muro") {
        const r = await revisarMensajes(invitacionId, [ref], !c.valor);
        if (!r.ok) return r;
        return escribirMarca(invitacionId, origen, ref, { oculto: false, leido: true });
      }
      if (origen === "directo") {
        const ok = await cambiarMomento(invitacionId, ref, { estado: c.valor ? "oculto" : "visible" });
        if (!ok) return { ok: false, error: "Ese mensaje ya no está." };
        return escribirMarca(invitacionId, origen, ref, { oculto: false, leido: true });
      }
      return escribirMarca(invitacionId, origen, ref, { oculto: c.valor, leido: true });
  }
}

/** Marca como leídos todos los que se pasan (el botón «Marcar todo como leído»). */
export async function marcarDeseosLeidos(invitacionId: string, claves: string[]): Promise<Escritura> {
  const muro: string[] = [];
  for (const k of claves.slice(0, 600)) {
    const [origen, ref] = k.split(":");
    if (!esOrigen(origen) || !REF.test(ref ?? "")) continue;
    if (origen === "muro") muro.push(ref);
    const r = await escribirMarca(invitacionId, origen, ref, { leido: true });
    if (!r.ok) return r;
  }
  if (muro.length) await revisarMensajes(invitacionId, muro);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────── QR (público)

/** Cuántos deseos ha dejado este dispositivo (o esta IP) en la ventana dada. */
export async function deseosRecientes(
  invitacionId: string,
  quien: { dispositivo: string; ip: string },
  segundos: number,
): Promise<{ dispositivo: number; ip: number; textos: string[] }> {
  const desde = new Date(Date.now() - segundos * 1000).toISOString();
  if (modoDemo()) {
    const filas = memoria().qr.filter((x) => x.invitacion_id === invitacionId && x.creado_en >= desde);
    const propios = filas.filter((x) => x.dispositivo === quien.dispositivo);
    return {
      dispositivo: propios.length,
      ip: filas.filter((x) => x.ip_huella === quien.ip).length,
      textos: propios.map((x) => x.texto),
    };
  }
  const db = servicio();
  if (!db) return { dispositivo: 0, ip: 0, textos: [] };
  const { data } = await db
    .from("deseos")
    .select("dispositivo, ip_huella, texto")
    .eq("invitacion_id", invitacionId)
    .gte("creado_en", desde)
    .limit(500);
  const filas = data ?? [];
  const propios = filas.filter((x) => x.dispositivo === quien.dispositivo);
  return {
    dispositivo: propios.length,
    ip: filas.filter((x) => x.ip_huella === quien.ip).length,
    textos: propios.map((x) => String(x.texto)),
  };
}

export async function insertarDeseo(fila: {
  invitacionId: string;
  nombre: string;
  texto: string;
  fotoRuta: string | null;
  dispositivo: string;
  ip: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (modoDemo()) {
    const id = randomBytes(10).toString("hex");
    memoria().qr.push({
      id,
      invitacion_id: fila.invitacionId,
      nombre: fila.nombre,
      texto: fila.texto,
      foto_ruta: fila.fotoRuta,
      dispositivo: fila.dispositivo,
      ip_huella: fila.ip,
      creado_en: new Date().toISOString(),
    });
    return { ok: true, id };
  }
  const db = servicio();
  if (!db) return { ok: false, error: "Ahora mismo no podemos guardarlo. Inténtalo dentro de un rato." };
  const { data, error } = await db
    .from("deseos")
    .insert({
      invitacion_id: fila.invitacionId,
      nombre: fila.nombre,
      texto: fila.texto,
      foto_ruta: fila.fotoRuta,
      dispositivo: fila.dispositivo,
      ip_huella: fila.ip,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("[deseos.insertar]", error?.message);
    return { ok: false, error: "No hemos podido guardarlo. Inténtalo otra vez." };
  }
  return { ok: true, id: String(data.id) };
}
