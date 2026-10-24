"use server";

import { revalidatePath } from "next/cache";
import { leerLista, CUPO_MAX } from "@/components/panel/importar";
import { obtenerPlantilla } from "@/data/plantillas";
import { exigirAccesoBoda, puedeAdministrar, type Acceso } from "@/lib/auth/acceso";
import {
  actualizarContenido,
  anadirMiembro,
  archivarInvitacion,
  borrarDatosDeInvitados,
  borrarInvitado,
  borrarMesa,
  guardarCronograma,
  guardarInvitado,
  guardarMesa,
  importarInvitados,
  invitacionPorSlug,
  listarMiembros,
  marcarEnvio,
  quitarMiembro,
  revisarMensajes,
  sentarPersonas,
  TRATOS,
  type Escritura,
  type Momento,
  type Rol,
  type Trato,
} from "@/lib/datos";
import type { Bloque, Tema } from "@/lib/tipos";
import type { Resultado } from "./tipos";

/**
 * Acciones del panel de los novios.
 *
 * TODAS empiezan igual: `exigirAccesoBoda(slug)`. Una server action se puede
 * llamar por POST desde cualquier sitio con su id, así que nada de lo que
 * llega en el formulario (ids de invitados, de mesas…) se cree sin más: las
 * funciones de `lib/datos.ts` operan SOLO dentro de la invitación autorizada.
 */

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function texto(datos: FormData, campo: string, max = 200) {
  return String(datos.get(campo) ?? "").trim().slice(0, max);
}

function res(ok: boolean, mensaje: string): Resultado {
  return { ok, mensaje, t: Date.now() };
}

const deEscritura = (r: Escritura, bien: string) => (r.ok ? res(true, bien) : res(false, r.error));

async function acceso(datos: FormData | string): Promise<Acceso | null> {
  const slug = typeof datos === "string" ? datos : texto(datos, "slug", 120);
  if (!SLUG.test(slug)) return null;
  try {
    return await exigirAccesoBoda(slug);
  } catch {
    return null;
  }
}

const SIN_ACCESO = res(false, "Se ha cerrado vuestra sesión. Volved a entrar y repetidlo.");

function refrescar(slug: string, tambienInvitacion = false) {
  revalidatePath(`/panel/${slug}`, "layout");
  if (tambienInvitacion) revalidatePath(`/i/${slug}`);
}

// ──────────────────────────────────────────────────────────────── invitados

export async function guardarInvitadoAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  const nombre = texto(datos, "nombre", 120);
  if (nombre.length < 2) return res(false, "Falta el nombre (al menos dos letras).");
  const cupo = Number(texto(datos, "cupo", 3) || 1);
  if (!Number.isInteger(cupo) || cupo < 1 || cupo > CUPO_MAX) {
    return res(false, `Las plazas van de 1 a ${CUPO_MAX}.`);
  }
  const trato = texto(datos, "trato", 10) as Trato;
  const id = texto(datos, "id", 64) || null;
  const r = await guardarInvitado(a.invitacionId, id, {
    nombre,
    cupo,
    grupo: texto(datos, "grupo", 60) || null,
    telefono: texto(datos, "telefono", 30) || null,
    trato: TRATOS.includes(trato) ? trato : null,
  });
  refrescar(a.slug);
  return deEscritura(r, id ? "Cambios guardados." : `${nombre} ya está en la lista.`);
}

export async function borrarInvitadoAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  const id = texto(datos, "id", 64);
  if (!id) return res(false, "No sabemos a quién quitar.");
  const r = await borrarInvitado(a.invitacionId, id);
  refrescar(a.slug);
  return deEscritura(r, "Quitado de la lista.");
}

export async function importarAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  let lista = String(datos.get("lista") ?? "");
  const archivo = datos.get("archivo");
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > 1_000_000) return res(false, "El archivo pesa demasiado. Exportadlo como CSV, sin fotos ni formatos.");
    lista = await archivo.text();
  }
  if (!lista.trim()) return res(false, "Pegad la lista o elegid un archivo CSV.");
  const { filas, malas } = leerLista(lista, texto(datos, "grupo", 60) || null);
  if (malas.length) {
    return res(
      false,
      `Revisad ${malas.length === 1 ? "la línea" : "las líneas"} ${malas.slice(0, 8).join(", ")}: cada una lleva un nombre y, si queréis, plazas (1 a ${CUPO_MAX}) y teléfono. No se ha importado nada todavía.`,
    );
  }
  if (filas.length === 0) return res(false, "No hemos encontrado a nadie en la lista.");
  const r = await importarInvitados(a.invitacionId, filas);
  refrescar(a.slug);
  return deEscritura(r, `${filas.length === 1 ? "Un invitado añadido" : `${filas.length} invitados añadidos`}. Ya podéis mandarles su enlace.`);
}

/** Lo llama el botón de WhatsApp al pulsarse (no bloquea la apertura). */
export async function marcarEnvioAccion(slug: string, ids: string[], tipo: "enviado" | "recordado") {
  const a = await acceso(slug);
  if (!a) return { ok: false };
  const r = await marcarEnvio(a.invitacionId, ids.slice(0, 600), tipo === "recordado" ? "recordado" : "enviado");
  refrescar(a.slug);
  return { ok: r.ok };
}

// ───────────────────────────────────────────────────────────────── mensajes

export async function moderarAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  const ids = texto(datos, "ids", 20_000).split(",").filter(Boolean);
  const que = texto(datos, "que", 12);
  const aprobado = que === "ocultar" ? false : que === "mostrar" ? true : undefined;
  const r = await revisarMensajes(a.invitacionId, ids, aprobado);
  refrescar(a.slug, aprobado !== undefined);
  return deEscritura(
    r,
    que === "ocultar" ? "Mensaje oculto. Ya no sale en la invitación." : que === "mostrar" ? "Mensaje visible otra vez." : "Marcado como leído.",
  );
}

// ──────────────────────────────────────────────────────────────────── mesas

export async function guardarMesaAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  const nombre = texto(datos, "nombre", 60);
  if (!nombre) return res(false, "Poned un nombre a la mesa (vale «Mesa 1»).");
  const capacidad = Number(texto(datos, "capacidad", 3));
  if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 60) {
    return res(false, "La capacidad va de 1 a 60 personas.");
  }
  const forma = texto(datos, "forma", 10) === "imperial" ? "imperial" : "redonda";
  const id = texto(datos, "id", 64) || null;
  const r = await guardarMesa(a.invitacionId, id, { nombre, capacidad, forma, nota: texto(datos, "nota", 200) || null });
  refrescar(a.slug);
  return deEscritura(r, id ? "Mesa guardada." : `«${nombre}» creada. Ya podéis sentar a gente.`);
}

export async function borrarMesaAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  const r = await borrarMesa(a.invitacionId, texto(datos, "id", 64));
  refrescar(a.slug);
  return deEscritura(r, "Mesa borrada. Quienes estaban en ella vuelven a «Sin mesa».");
}

/** Desde el plano (arrastrar o selector). `mesaId = null` levanta de la mesa. */
export async function sentarAccion(slug: string, personas: string[], mesaId: string | null) {
  const a = await acceso(slug);
  if (!a) return { ok: false, error: "Se ha cerrado vuestra sesión. Volved a entrar." };
  const r = await sentarPersonas(a.invitacionId, personas, mesaId);
  refrescar(a.slug);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

// ──────────────────────────────────────────────────────────── el gran día

export async function guardarCronogramaAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  let crudo: unknown;
  try {
    crudo = JSON.parse(String(datos.get("items") ?? "[]"));
  } catch {
    return res(false, "No hemos podido leer el cronograma. Recargad la página y probad otra vez.");
  }
  if (!Array.isArray(crudo)) return res(false, "No hemos podido leer el cronograma.");
  const items: Momento[] = [];
  for (const x of crudo.slice(0, 30)) {
    const hora = String(x?.hora ?? "").trim();
    const titulo = String(x?.titulo ?? "").trim().slice(0, 80);
    if (!hora && !titulo) continue;
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(hora)) return res(false, `Revisad la hora de «${titulo || "un momento"}»: va como 18:30.`);
    if (!titulo) return res(false, `Falta qué pasa a las ${hora}.`);
    const m: Momento = { hora: hora.padStart(5, "0"), titulo };
    for (const k of ["lugar", "direccion", "mapa", "icono"] as const) {
      const v = String(x?.[k] ?? "").trim().slice(0, k === "mapa" ? 500 : 160);
      if (v) m[k] = v;
    }
    items.push(m);
  }
  const publico = datos.get("publico") === "si";
  if (publico && items.length === 0) return res(false, "Añadid al menos un momento antes de enseñarlo en la invitación.");
  const r = await guardarCronograma(a.invitacionId, { items, publico });
  refrescar(a.slug, true);
  return deEscritura(r, publico ? "Guardado. Ya sale en vuestra invitación." : "Guardado. Solo lo veis vosotros.");
}

// ──────────────────────────────────────────────────────────────── diseño

export async function guardarDisenoAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  const inv = await invitacionPorSlug(a.slug);
  if (!inv) return res(false, "No encontramos vuestra invitación.");

  const p = obtenerPlantilla(inv.plantilla);
  const varianteId = texto(datos, "variante", 40);
  const variante = p.variantes.find((v) => v.id === varianteId);
  let tema: Partial<Tema> | undefined;
  if (variante && variante.id !== (inv.tema.variante ?? p.variantes[0]?.id)) {
    // Parche: se funde con el tema guardado (movimiento incluido). Los colores
    // derivados se borran para que se recalculen con los nuevos.
    tema = {
      tinta: variante.tinta,
      papel: variante.papel,
      acento: variante.acento,
      variante: variante.id,
      acentoTexto: undefined,
      sobreAcento: undefined,
    };
  }

  const frase = datos.has("frase") ? texto(datos, "frase", 400) : null;
  const historia = datos.has("historia")
    ? String(datos.get("historia") ?? "")
        .split(/\n\s*\n/)
        .map((x) => x.trim().slice(0, 1500))
        .filter(Boolean)
        .slice(0, 8)
    : null;
  const dress = datos.has("dress") ? texto(datos, "dress", 400) : null;

  let cambiado = false;
  const bloques: Bloque[] = inv.bloques.map((b) => {
    if (b.t === "portada" && frase !== null && frase !== b.frase) {
      cambiado = true;
      return { ...b, frase };
    }
    if (b.t === "historia" && historia && historia.join("\n\n") !== b.parrafos.join("\n\n")) {
      cambiado = true;
      return { ...b, parrafos: historia };
    }
    if (b.t === "dressCode" && dress !== null && dress !== b.nota) {
      cambiado = true;
      return { ...b, nota: dress };
    }
    return b;
  });

  if (!tema && !cambiado) return res(true, "No había nada que cambiar.");
  const r = await actualizarContenido(a.invitacionId, { tema, bloques: cambiado ? bloques : undefined });
  refrescar(a.slug, true);
  return deEscritura(r, "Guardado. La invitación ya se ve así.");
}

// ──────────────────────────────────────────────────────────────── cuenta

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export async function invitarMiembroAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  if (!puedeAdministrar(a)) return res(false, "Solo la pareja puede invitar a más personas.");
  const email = texto(datos, "email", 254).toLowerCase();
  if (!EMAIL.test(email)) return res(false, "Revisad el email: parece que le falta algo.");
  const rol: Rol = texto(datos, "rol", 10) === "planner" ? "planner" : "pareja";
  if ((await listarMiembros(a.invitacionId)).length >= 8) {
    return res(false, "Ya hay ocho personas con acceso. Quitad a alguien antes de añadir a otra.");
  }
  const r = await anadirMiembro(a.invitacionId, {
    email,
    rol,
    nombre: texto(datos, "nombre", 80) || null,
    invitadoPor: a.usuario?.id ?? null,
  });
  refrescar(a.slug);
  return deEscritura(
    r,
    `Hecho. ${email} ya puede entrar en invitoo.es/cuenta/entrar con su email: le llegará un código. Avisadle con el botón de WhatsApp de la lista.`,
  );
}

/** Para quien entró por el enlace privado y quiere entrar con su email. */
export async function crearCuentaAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  datos.set("rol", "pareja");
  const r = await invitarMiembroAccion(null, datos);
  if (r?.ok) return res(true, "Listo. Desde ahora podéis entrar también con ese email, desde cualquier dispositivo.");
  return r;
}

export async function quitarMiembroAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  const id = texto(datos, "id", 64);
  const miembros = await listarMiembros(a.invitacionId);
  const quien = miembros.find((m) => m.id === id);
  if (!quien) return res(false, "Esa persona ya no está.");
  const esUnoMismo = a.usuario && quien.user_id === a.usuario.id;
  if (!puedeAdministrar(a) && !esUnoMismo) return res(false, "Solo la pareja puede quitar a alguien.");
  if (quien.rol === "pareja" && miembros.filter((m) => m.rol === "pareja").length === 1) {
    return res(false, "Sois la última persona de la pareja con acceso: no os podéis quitar.");
  }
  const r = await quitarMiembro(a.invitacionId, id);
  refrescar(a.slug);
  return deEscritura(r, "Ya no tiene acceso a vuestra boda.");
}

export async function borrarDatosAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  if (!puedeAdministrar(a)) return res(false, "Solo la pareja puede borrar los datos.");
  if (texto(datos, "confirmacion", 20).toUpperCase() !== "BORRAR") {
    return res(false, "Para borrar, escribid BORRAR en la casilla. Así no se hace sin querer.");
  }
  const r = await borrarDatosDeInvitados(a.invitacionId);
  refrescar(a.slug, true);
  return deEscritura(r, "Borrado. La lista, las respuestas, los mensajes y las mesas ya no existen.");
}

export async function archivarAccion(_: Resultado, datos: FormData): Promise<Resultado> {
  const a = await acceso(datos);
  if (!a) return SIN_ACCESO;
  if (!puedeAdministrar(a)) return res(false, "Solo la pareja puede retirar la invitación.");
  if (texto(datos, "confirmacion", 20).toUpperCase() !== "RETIRAR") {
    return res(false, "Para retirarla, escribid RETIRAR en la casilla.");
  }
  const r = await archivarInvitacion(a.invitacionId);
  refrescar(a.slug, true);
  return deEscritura(r, "Retirada. El enlace de la invitación ya no se abre. Escribidnos si queréis volver a publicarla.");
}
