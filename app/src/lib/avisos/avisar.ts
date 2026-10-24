import "server-only";

import { invitacionPorSlug, listarMiembros } from "@/lib/datos";
import { SITIO_URL } from "@/lib/enlaces";
import {
  bodasConPendientes,
  leerPreferencias,
  marcarEnviados,
  marcarResumen,
  pendientesDeEnviar,
  quitarSuscripcion,
  registrarAviso,
  suscripciones,
} from "./datos";
import { enviarEmail, plantillaCorreo } from "./email";
import { clavePublicaVapid, enviarPush } from "./push";
import { TEXTO_TIPO, type TipoAviso } from "./tipos";

/**
 * El punto de entrada de los avisos. Las acciones lo llaman dentro de
 * `after()` (no retrasan la respuesta al invitado) y nunca lanzan: un aviso
 * que falla no puede romper una confirmación.
 *
 * Qué pasa con cada aviso:
 *   1. Se guarda para la campana del panel.
 *   2. Según la preferencia de su tipo:
 *        «Al momento»   → email ahora mismo a la pareja (miembros con email).
 *        «Resumen diario» → queda pendiente; el cron lo junta por la mañana.
 *        «Nada»         → solo campana.
 *   3. Push del navegador, si hay suscripciones y el tipo no está en «Nada».
 */

type Entrada = { tipo: TipoAviso; titulo: string; detalle?: string | null; enlace?: string | null };

async function destinatarios(invitacionId: string) {
  try {
    return (await listarMiembros(invitacionId)).map((m) => m.email).filter((e): e is string => Boolean(e));
  } catch {
    return [];
  }
}

export async function avisar(invitacionId: string, slug: string, a: Entrada): Promise<void> {
  try {
    const fila = await registrarAviso(invitacionId, a);
    if (!fila) return;
    const prefs = await leerPreferencias(invitacionId);
    const frecuencia = prefs[a.tipo];

    if (frecuencia === "momento") {
      const para = await destinatarios(invitacionId);
      const { html, texto } = plantillaCorreo({
        saludo: a.titulo,
        lineas: a.detalle ? [{ titulo: a.detalle }] : [],
        boton: { texto: "Abrir el panel", url: `${SITIO_URL}${a.enlace ?? `/panel/${slug}`}` },
        pie: "Podéis cambiar qué avisos os llegan en el panel, en «Avisos».",
      });
      if (para.length) await enviarEmail({ para, asunto: a.titulo, html, texto });
    }
    // Lo que no va en el resumen ya está «enviado» (o no se envía nunca).
    if (frecuencia !== "diario") await marcarEnviados([fila.id]);

    if (frecuencia !== "nada" && clavePublicaVapid()) {
      for (const s of await suscripciones(invitacionId)) {
        if (!(await enviarPush(s.endpoint))) await quitarSuscripcion(s.endpoint);
      }
    }
  } catch (e) {
    console.error("[avisar]", e);
  }
}

/** Igual, desde las acciones públicas que solo conocen el slug. */
export async function avisarPorSlug(slug: string, a: Entrada): Promise<void> {
  try {
    const inv = await invitacionPorSlug(slug);
    if (inv) await avisar(inv.id, slug, a);
  } catch (e) {
    console.error("[avisarPorSlug]", e);
  }
}

// ────────────────────────────────────────────────────── avisos concretos

const corto = (s: string, n = 120) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export async function avisarRespuesta(
  slug: string,
  r: { nombre: string; asiste: boolean; personas: number; previo: boolean | null },
) {
  const base = `/panel/${slug}/invitados`;
  if (r.previo === null) {
    await avisarPorSlug(slug, {
      tipo: "confirmacion",
      titulo: r.asiste
        ? `${r.nombre} ${r.personas > 1 ? `confirma: vienen ${r.personas}` : "confirma que viene"}`
        : `${r.nombre} no podrá venir`,
      detalle: r.asiste ? "Ya tenéis sus menús y alergias en «Invitados»." : null,
      enlace: `${base}/respuestas`,
    });
    return;
  }
  await avisarPorSlug(slug, {
    tipo: "cambio",
    titulo:
      r.previo !== r.asiste
        ? r.asiste
          ? `${r.nombre} ha cambiado su respuesta: ahora sí viene`
          : `${r.nombre} ha cambiado su respuesta: ya no viene`
        : `${r.nombre} ha corregido su respuesta`,
    detalle: r.asiste ? `${r.personas === 1 ? "1 persona" : `${r.personas} personas`}. Revisad menús y alergias.` : null,
    enlace: `${base}/respuestas`,
  });
}

export async function avisarDeseo(slug: string, d: { nombre: string; texto: string; donde: string }) {
  await avisarPorSlug(slug, {
    tipo: "deseo",
    titulo: `${d.nombre} os ha dejado un buen deseo`,
    detalle: `«${corto(d.texto)}» · ${d.donde}`,
    enlace: `/panel/${slug}/deseos`,
  });
}

export async function avisarRetirada(invitacionId: string, slug: string) {
  await avisar(invitacionId, slug, {
    tipo: "retirada",
    titulo: "Un invitado ha pedido retirar una foto",
    detalle: "Ya no se ve en la pantalla ni en el álbum. Decidid si se queda fuera o la restauráis.",
    enlace: `/panel/${slug}/directo?fotos=retiradas#t-galeria`,
  });
}

// ───────────────────────────────────────────────────────── el estudio

/** Para Rodrigo: un email a `ESTUDIO_EMAIL` (si no está, al log). */
export async function avisarEstudio(asunto: string, lineas: { titulo: string; detalle?: string | null }[], enlace: string) {
  try {
    const para = (process.env.ESTUDIO_EMAIL ?? "").split(",").map((x) => x.trim()).filter(Boolean);
    const { html, texto } = plantillaCorreo({
      saludo: asunto,
      lineas,
      boton: { texto: "Abrir la bandeja", url: `${SITIO_URL}${enlace}` },
    });
    if (para.length) await enviarEmail({ para, asunto, html, texto });
    else console.info(`[avisos.estudio] (sin ESTUDIO_EMAIL) ${asunto}\n${texto}`);
  } catch (e) {
    console.error("[avisarEstudio]", e);
  }
}

// ──────────────────────────────────────────────────── el resumen diario

/**
 * Lo llama el cron (`/api/avisos/resumen`). Por cada boda con avisos
 * pendientes, junta los de tipo «Resumen diario» en un solo correo.
 * Idempotente: lo enviado se marca y no vuelve a salir.
 */
export async function resumenDiario(): Promise<{ bodas: number; correos: number }> {
  let correos = 0;
  const bodas = await bodasConPendientes();
  for (const id of bodas) {
    try {
      const [pendientes, prefs] = await Promise.all([pendientesDeEnviar(id), leerPreferencias(id)]);
      const van = pendientes.filter((p) => prefs[p.tipo] === "diario");
      if (van.length) {
        const para = await destinatarios(id);
        const enlace = van[0].enlace?.match(/^\/panel\/[a-z0-9-]+/)?.[0] ?? "/panel";
        const porTipo = new Map<TipoAviso, number>();
        for (const v of van) porTipo.set(v.tipo, (porTipo.get(v.tipo) ?? 0) + 1);
        const resumen = [...porTipo].map(([t, n]) => `${TEXTO_TIPO[t].nombre}: ${n}`).join(" · ");
        const { html, texto } = plantillaCorreo({
          saludo: "Lo nuevo de vuestra boda",
          lineas: [{ titulo: resumen }, ...van.slice(0, 25).map((v) => ({ titulo: v.titulo, detalle: v.detalle }))],
          boton: { texto: "Abrir el panel", url: `${SITIO_URL}${enlace}` },
          pie: van.length > 25 ? `Y ${van.length - 25} más en el panel.` : "Os lo mandamos una vez al día. Se cambia en «Avisos».",
        });
        if (para.length && (await enviarEmail({ para, asunto: `Invitoo · ${resumen}`, html, texto }))) correos++;
      }
      await marcarEnviados(pendientes.map((p) => p.id));
      await marcarResumen(id);
    } catch (e) {
      console.error("[resumenDiario]", id, e);
    }
  }
  return { bodas: bodas.length, correos };
}
