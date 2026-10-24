"use server";

import { revalidatePath } from "next/cache";
import type { Resultado } from "@/app/panel/tipos";
import { exigirAccesoBoda, type Acceso } from "@/lib/auth/acceso";
import { cambiarDeseo, esOrigen, marcarDeseosLeidos } from "./datos";

/**
 * Moderación del Libro de buenos deseos, desde el panel. Primera línea de
 * cada acción: `exigirAccesoBoda`; los ids que llegan se buscan SOLO dentro
 * de la boda autorizada.
 */

const res = (ok: boolean, mensaje: string): Resultado => ({ ok, mensaje, t: Date.now() });
const SIN_ACCESO = res(false, "Se ha cerrado vuestra sesión. Volved a entrar y repetidlo.");

async function acceso(datos: FormData): Promise<Acceso | null> {
  const slug = String(datos.get("slug") ?? "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    return await exigirAccesoBoda(slug);
  } catch {
    return null;
  }
}

function refrescar(slug: string) {
  revalidatePath(`/panel/${slug}`, "layout");
  revalidatePath(`/i/${slug}`);
}

export async function moderarDeseoAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  const [origen, ref] = String(datos.get("clave") ?? "").split(":");
  if (!esOrigen(origen) || !ref) return res(false, "No encontramos ese deseo. Recargad la página.");
  const que = String(datos.get("que") ?? "");

  let r;
  let bien: string;
  switch (que) {
    case "favorito":
    case "quitar-favorito":
      r = await cambiarDeseo(a.invitacionId, origen, ref, { que: "favorito", valor: que === "favorito" });
      bien = que === "favorito" ? "Guardado entre vuestros favoritos." : "Ya no está entre los favoritos.";
      break;
    case "ocultar":
    case "mostrar":
      r = await cambiarDeseo(a.invitacionId, origen, ref, { que: "ocultar", valor: que === "ocultar" });
      bien =
        que === "ocultar"
          ? origen === "qr"
            ? "Oculto. No saldrá en el libro."
            : "Oculto. Ya no se ve en la invitación ni sale en el libro."
          : "Visible otra vez.";
      break;
    case "leido":
      r = await cambiarDeseo(a.invitacionId, origen, ref, { que: "leido" });
      bien = "Marcado como leído.";
      break;
    case "corregir": {
      const texto = String(datos.get("texto") ?? "").trim().slice(0, 1200);
      const original = datos.get("restaurar") === "si";
      if (!original) {
        if (datos.get("permiso") !== "si") {
          return res(false, "Marcad la casilla: solo se corrige una errata con permiso de quien lo escribió.");
        }
        if (texto.length < 2) return res(false, "El texto no puede quedarse vacío.");
      }
      r = await cambiarDeseo(a.invitacionId, origen, ref, { que: "corregir", texto: original ? null : texto });
      bien = original ? "Vuelve a estar como lo escribió." : "Corregido. El libro usará este texto; el original se guarda.";
      break;
    }
    default:
      return res(false, "No sabemos qué hacer con eso.");
  }
  refrescar(a.slug);
  return r.ok ? res(true, bien) : res(false, r.error);
}

export async function leerTodosDeseosAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  const claves = String(datos.get("claves") ?? "").split(",").filter(Boolean);
  const r = await marcarDeseosLeidos(a.invitacionId, claves);
  refrescar(a.slug);
  return r.ok ? res(true, "Todo leído.") : res(false, r.error);
}
