"use server";

import { redirect } from "next/navigation";
import { darDeBaja, GRUPOS, guardarPreferencias, verificar } from "@/lib/correos/preferencias";
import type { PreferenciasCorreo } from "@/lib/correos/tipos";

/**
 * La acción de /baja. No hay sesión: la llave es la firma del enlace
 * (`e` + `t`), que se vuelve a comprobar aquí porque una server action se
 * puede llamar por POST desde cualquier sitio.
 */
export async function guardarBaja(datos: FormData) {
  const e = String(datos.get("e") ?? "");
  const t = String(datos.get("t") ?? "");
  const email = verificar(e, t);
  const volver = (hecho: string) => redirect(`/baja?e=${encodeURIComponent(e)}&t=${encodeURIComponent(t)}&hecho=${hecho}`);
  if (!email) redirect("/baja");

  const accion = String(datos.get("accion") ?? "guardar");
  if (accion === "baja") {
    volver((await darDeBaja(email!)) ? "baja" : "error");
  }
  const grupos = Object.fromEntries(
    GRUPOS.map((g) => [g, accion === "alta" ? true : datos.get(`g-${g}`) === "on"]),
  ) as PreferenciasCorreo;
  const ok = await guardarPreferencias(email!, { grupos, bajaTotal: false });
  volver(ok ? (accion === "alta" ? "alta" : "guardado") : "error");
}
