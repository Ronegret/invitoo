import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { servicio } from "@/lib/supabase/clientes";
import { archivoLocal, modoDatos } from "./local";
import type { FilaContador, TipoContador } from "./tipos";

/**
 * Los contadores de visitas (migración `2026-11-correos.sql`):
 *   · `visitas_dia`    (dia, tipo, clave, n) — se suma con la RPC `visitas_sumar`.
 *   · `visitas_unicos` (dia, visitante)       — hashes del día, para no contar dos veces.
 *   · `visitas_sal`    (dia, sal)             — la sal aleatoria de cada día.
 * Las dos últimas se vacían cada mañana: el cron `/api/correos/estudio` borra
 * todo lo anterior a hoy. `visitas_dia` se conserva 25 meses (guía AEPD de
 * medición de audiencia, 2024) y se purga en el mismo cron.
 *
 * En local, lo mismo en `.visitas-local/visitas.json`.
 */

type Local = {
  dia: Record<string, number>; // «dia|tipo|clave» → n
  unicos: Record<string, string[]>; // dia → hashes
  sal: Record<string, string>; // dia → sal
};
const local = archivoLocal<Local>(".visitas-local", "visitas", () => ({ dia: {}, unicos: {}, sal: {} }));

const MAX_CLAVE = 120;
const limpiarClave = (c: string) => c.slice(0, MAX_CLAVE) || "*";

/** Suma `n` al contador y devuelve el total nuevo (0 si no hay almacén). */
export async function sumar(dia: string, tipo: TipoContador, clave = "*", n = 1): Promise<number> {
  clave = limpiarClave(clave);
  const modo = modoDatos();
  if (modo === "local") {
    const l = await local.leer();
    const k = `${dia}|${tipo}|${clave}`;
    l.dia[k] = (l.dia[k] ?? 0) + n;
    local.guardar();
    return l.dia[k];
  }
  if (modo !== "supabase") return 0;
  const db = servicio()!;
  const { data, error } = await db.rpc("visitas_sumar", { p_dia: dia, p_tipo: tipo, p_clave: clave, p_n: n });
  if (error) {
    console.error("[visitas.sumar]", error.message);
    return 0;
  }
  return Number(data) || 0;
}

/** La sal aleatoria del día (se crea la primera vez que se pide). */
async function salDelDia(dia: string): Promise<string | null> {
  const g = globalThis as { __invitooSal?: { dia: string; sal: string } };
  if (g.__invitooSal?.dia === dia) return g.__invitooSal.sal;
  const nueva = randomBytes(24).toString("base64url");
  let sal: string | null = null;
  const modo = modoDatos();
  if (modo === "local") {
    const l = await local.leer();
    l.sal[dia] ??= nueva;
    sal = l.sal[dia];
    local.guardar();
  } else if (modo === "supabase") {
    const db = servicio()!;
    await db.from("visitas_sal").upsert({ dia, sal: nueva }, { onConflict: "dia", ignoreDuplicates: true });
    const { data } = await db.from("visitas_sal").select("sal").eq("dia", dia).maybeSingle();
    sal = (data?.sal as string) ?? null;
  }
  if (sal) g.__invitooSal = { dia, sal };
  return sal;
}

/**
 * ¿Es la primera vez hoy que vemos a este visitante? El hash se hace aquí y
 * la IP no sale de esta función.
 */
export async function esNuevoHoy(dia: string, ip: string, navegador: string): Promise<boolean> {
  const sal = await salDelDia(dia);
  if (!sal) return false;
  const visitante = createHash("sha256").update(`${sal}|${ip}|${navegador}`).digest("base64url").slice(0, 22);
  const modo = modoDatos();
  if (modo === "local") {
    const l = await local.leer();
    const lista = (l.unicos[dia] ??= []);
    if (lista.includes(visitante)) return false;
    lista.push(visitante);
    local.guardar();
    return true;
  }
  if (modo !== "supabase") return false;
  const { data, error } = await servicio()!
    .from("visitas_unicos")
    .upsert({ dia, visitante }, { onConflict: "dia,visitante", ignoreDuplicates: true })
    .select("dia");
  if (error) {
    console.error("[visitas.unico]", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

/** Todas las filas de un periodo (ambos días incluidos), opcionalmente de unos tipos. */
export async function leerContadores(desde: string, hasta: string, tipos?: TipoContador[]): Promise<FilaContador[]> {
  const modo = modoDatos();
  if (modo === "local") {
    const l = await local.leer();
    return Object.entries(l.dia).flatMap(([k, n]) => {
      const [dia, tipo, ...resto] = k.split("|");
      if (dia < desde || dia > hasta) return [];
      if (tipos && !tipos.includes(tipo as TipoContador)) return [];
      return [{ dia, tipo: tipo as TipoContador, clave: resto.join("|"), n }];
    });
  }
  if (modo !== "supabase") return [];
  const filas: FilaContador[] = [];
  // Paginado: un periodo largo puede pasar de las 1000 filas por defecto.
  for (let desdeFila = 0; desdeFila < 50_000; desdeFila += 1000) {
    let q = servicio()!
      .from("visitas_dia")
      .select("dia, tipo, clave, n")
      .gte("dia", desde)
      .lte("dia", hasta)
      .order("dia")
      .range(desdeFila, desdeFila + 999);
    if (tipos) q = q.in("tipo", tipos);
    const { data, error } = await q;
    if (error) {
      console.error("[visitas.leer]", error.message);
      break;
    }
    filas.push(...((data ?? []) as FilaContador[]));
    if (!data || data.length < 1000) break;
  }
  return filas;
}

/** Borra los contadores anteriores a `antesDe` (plazo de conservación). */
export async function purgarContadores(antesDe: string): Promise<void> {
  const modo = modoDatos();
  if (modo === "local") {
    const l = await local.leer();
    for (const k of Object.keys(l.dia)) if (k.slice(0, 10) < antesDe) delete l.dia[k];
    local.guardar();
    return;
  }
  if (modo !== "supabase") return;
  const { error } = await servicio()!.from("visitas_dia").delete().lt("dia", antesDe);
  if (error) console.error("[visitas.purgar]", error.message);
}

/** Borra hashes y sales anteriores a `antesDe` (yyyy-mm-dd). */
export async function limpiarHuellas(antesDe: string): Promise<void> {
  const modo = modoDatos();
  if (modo === "local") {
    const l = await local.leer();
    for (const d of Object.keys(l.unicos)) if (d < antesDe) delete l.unicos[d];
    for (const d of Object.keys(l.sal)) if (d < antesDe) delete l.sal[d];
    local.guardar();
    return;
  }
  if (modo !== "supabase") return;
  const db = servicio()!;
  await db.from("visitas_unicos").delete().lt("dia", antesDe);
  await db.from("visitas_sal").delete().lt("dia", antesDe);
}
