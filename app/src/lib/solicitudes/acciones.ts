"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import type { Resultado } from "@/app/panel/tipos";
import { exigirSesion } from "@/app/estudio/sesion";
import { exigirAccesoBoda, type Acceso } from "@/lib/auth/acceso";
import { avisar } from "@/lib/avisos/avisar";
import { programar } from "@/lib/correos/programar";
import { slugDe } from "@/lib/datos";
import { tamano, urlSubida, type DestinoSubida } from "@/lib/momentos/almacen";
import { cambiarSolicitud, crearSolicitud, ESTADOS_SOLICITUD, TEXTO_ESTADO, type EstadoSolicitud } from "./datos";

/**
 * «Pedir un cambio». La pareja (panel, `exigirAccesoBoda`) crea la
 * solicitud; el estudio (`exigirSesion`) la mueve de estado. Cada paso
 * avisa al otro lado: a Rodrigo por email (`ESTUDIO_EMAIL`) y a la pareja
 * por la campana y según sus preferencias.
 */

const res = (ok: boolean, mensaje: string): Resultado => ({ ok, mensaje, t: Date.now() });

async function acceso(slug: unknown): Promise<Acceso | null> {
  const s = String(slug ?? "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) return null;
  try {
    return await exigirAccesoBoda(s);
  } catch {
    return null;
  }
}

export async function prepararFotoSolicitud(
  slug: string,
  mime: string,
): Promise<{ ok: true; ruta: string; destino: DestinoSubida } | { ok: false; error: string }> {
  const a = await acceso(slug);
  if (!a) return { ok: false, error: "Se ha cerrado vuestra sesión." };
  if (mime !== "image/webp" && mime !== "image/jpeg") return { ok: false, error: "Esa imagen no se puede usar." };
  const ruta = `${a.invitacionId}/p/${randomBytes(10).toString("hex")}.${mime === "image/webp" ? "webp" : "jpg"}`;
  const destino = await urlSubida(ruta, mime);
  return destino ? { ok: true, ruta, destino } : { ok: false, error: "Ahora mismo no se pueden adjuntar fotos." };
}

export async function pedirCambioAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos.get("slug"));
  if (!a) return res(false, "Se ha cerrado vuestra sesión. Volved a entrar y repetidlo.");
  const texto = String(datos.get("texto") ?? "").trim().slice(0, 2000);
  if (texto.length < 4) return res(false, "Contadnos qué queréis cambiar: con una frase basta.");
  const seccion = String(datos.get("seccion") ?? "").trim().slice(0, 40) || null;
  let fotoRuta: string | null = null;
  const foto = String(datos.get("foto_ruta") ?? "");
  if (foto && new RegExp(`^${a.invitacionId.replace(/[^A-Za-z0-9-]/g, "")}/p/[a-f0-9]{20}\\.(webp|jpg)$`).test(foto)) {
    const b = await tamano(foto);
    if (b && b <= 8 * 1024 * 1024) fotoRuta = foto;
  }
  const s = await crearSolicitud({
    invitacionId: a.invitacionId,
    texto,
    seccion,
    fotoRuta,
    autor: a.usuario?.email ?? (a.via === "estudio" ? "Estudio" : "La pareja"),
  });
  if (!s) return res(false, "No hemos podido enviarla. Probad otra vez o escribidnos por WhatsApp.");
  // Alerta al estudio (lib/correos, plantilla «alerta-cambio»).
  after(() => programar({ evento: "solicitud", solicitudId: s.id, slug: a.slug, texto, seccion }));
  revalidatePath(`/panel/${a.slug}`, "layout");
  return res(true, "Recibida. Os avisamos en cuanto esté hecha; podéis seguir su estado aquí debajo.");
}

export async function cambiarSolicitudAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  if (!(await exigirSesion())) return res(false, "La sesión del estudio ha caducado. Vuelve a entrar.");
  const id = String(datos.get("id") ?? "");
  const estado = String(datos.get("estado") ?? "") as EstadoSolicitud;
  if (!ESTADOS_SOLICITUD.includes(estado)) return res(false, "Estado no válido.");
  const respuesta = datos.has("respuesta") ? String(datos.get("respuesta") ?? "").trim().slice(0, 1000) || null : undefined;
  const s = await cambiarSolicitud(id, { estado, ...(respuesta !== undefined ? { respuesta } : {}) });
  if (!s) return res(false, "Esa solicitud ya no está.");
  const slug = await slugDe(s.invitacionId);
  if (slug && estado !== "recibida") {
    after(() =>
      avisar(s.invitacionId, slug, {
        tipo: "solicitud",
        titulo: estado === "hecha" ? "Hecho: vuestro cambio ya está en la invitación" : "Estamos con vuestro cambio",
        detalle: s.respuesta ?? `«${s.texto.slice(0, 120)}»`,
        enlace: `/panel/${slug}/cambios`,
      }),
    );
    revalidatePath(`/panel/${slug}`, "layout");
  }
  revalidatePath("/estudio/solicitudes");
  return res(true, `Marcada como «${TEXTO_ESTADO[estado]}».${estado === "hecha" ? " La pareja recibe el aviso." : ""}`);
}
