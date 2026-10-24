"use server";

import { exigirAccesoBoda, puedeAdministrar, type Acceso } from "@/lib/auth/acceso";
import { borrarArchivos, urlsLectura } from "./almacen";
import {
  actualizarConfig,
  cambiarMomento,
  fijarPlan,
  guardarDiseno,
  leerDiseno,
  listarMomentos,
  nuevaClave,
  obtenerConfig,
  obtenerMomento,
  quitarMomento,
  resolverBodaPrivada,
  usoDe,
  type Boda,
} from "./datos";
import { normalizarDiseno, type DisenoDirecto } from "./diseno";
import { esPlanMomentos, limitesDe, MOMENTOS_PROGRAMADOS, type LimitesPlan, type PlanMomentos } from "./planes";
import { qrSvg } from "./qr";
import { aModeracion, avisar, canalPanel, enlacesDe, realtimePublico } from "./servidor";
import type { ConfigDirecto, EstadoMomento, MomentoModeracion, Moderacion, Uso } from "./tipos";

/**
 * Acciones del panel de los novios (y del estudio) para «En directo».
 * La primera línea de cada una es `exigirAccesoBoda(slug)`: una server
 * action se puede invocar por POST desde cualquier sitio.
 */

type Fallo = { ok: false; error: string };
const SIN_ACCESO: Fallo = { ok: false, error: "No tenéis acceso a esta boda. Volved a entrar." };
const SIN_BASE: Fallo = { ok: false, error: "Ahora mismo no podemos guardarlo. Probad dentro de un rato." };

type Contexto = { acceso: Acceso; boda: Boda & { id: string }; config: ConfigDirecto };

async function contexto(slug: string): Promise<Contexto | Fallo> {
  let acceso: Acceso;
  try {
    acceso = await exigirAccesoBoda(String(slug ?? ""));
  } catch {
    return SIN_ACCESO;
  }
  const boda = await resolverBodaPrivada(acceso.slug);
  if (!boda?.id) return SIN_ACCESO;
  const conId = { ...boda, id: boda.id };
  const config = await obtenerConfig(conId);
  if (!config) return SIN_BASE;
  return { acceso, boda: conId, config };
}

// ─────────────────────────────────────────────────────────────── estado

export type EstadoDirecto = {
  ok: true;
  pareja: { a: string; b: string; fecha: string };
  plantilla: string;
  diseno: DisenoDirecto;
  activo: boolean;
  subidasAbiertas: boolean;
  moderacion: Moderacion;
  plan: PlanMomentos;
  nombrePlan: string;
  limites: Pick<LimitesPlan, "fotos" | "videos" | "bytes" | "ilimitado" | "pantallaTv" | "duracionVideo">;
  retencionHasta: string | null;
  /** El cron de limpieza ya avisó: quedan 30 días o menos. */
  avisoBorrado: boolean;
  uso: Uso;
  pendientes: number;
  retiradas: number;
  enlaces: { subida: string; pantalla: string; tv: string; codigoTv: string; tarjetas: string; qrSvg: string; qrPng: string };
  clave: string;
  qr: string;
  capitulo: { titulo: string; desde: string } | null;
  momentosProgramados: readonly string[];
  mensajeFijado: string | null;
  realtime: { url: string; anon: string; canal: string } | null;
  puedeAdministrar: boolean;
  esEstudio: boolean;
};

export async function estadoDirecto(slug: string): Promise<EstadoDirecto | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  const { acceso, boda, config } = c;
  const [uso, pendientes, retiradas, diseno] = await Promise.all([
    usoDe(boda.id),
    listarMomentos(boda.id, { estados: ["pendiente"], limite: 1000 }).then((x) => x.length),
    listarMomentos(boda.id, { estados: ["oculto"], limite: 1000 }).then(
      (x) => x.filter((m) => m.retirada_pedida).length,
    ),
    leerDiseno(boda.id),
  ]);
  const enlaces = await enlacesDe(acceso.slug, config);
  const plan = limitesDe(config.plan, config.anos_extra);
  const rt = realtimePublico();
  const base = `/api/momentos/${acceso.slug}/qr`;
  return {
    ok: true,
    pareja: boda.inv.pareja,
    plantilla: boda.inv.plantilla,
    diseno,
    activo: config.activo,
    subidasAbiertas: config.subidas_abiertas,
    moderacion: config.moderacion,
    plan: config.plan,
    nombrePlan: plan.nombre,
    limites: {
      fotos: config.limite_fotos,
      videos: config.limite_videos,
      bytes: config.limite_bytes,
      ilimitado: plan.ilimitado,
      pantallaTv: plan.pantallaTv,
      duracionVideo: plan.duracionVideo,
    },
    retencionHasta: config.retencion_hasta,
    avisoBorrado: Boolean(config.aviso_borrado),
    uso,
    pendientes,
    retiradas,
    enlaces: {
      ...enlaces,
      tarjetas: `/directo/${acceso.slug}/tarjetas`,
      qrSvg: `${base}?formato=svg`,
      qrPng: `${base}?formato=png`,
    },
    clave: config.clave_pantalla,
    qr: await qrSvg(enlaces.subida),
    capitulo:
      config.capitulo && config.capitulo_desde ? { titulo: config.capitulo, desde: config.capitulo_desde } : null,
    momentosProgramados: MOMENTOS_PROGRAMADOS,
    mensajeFijado: config.mensaje_fijado,
    realtime: rt ? { ...rt, canal: canalPanel(config) } : null,
    puedeAdministrar: puedeAdministrar(acceso),
    esEstudio: acceso.via === "estudio",
  };
}

// ──────────────────────────────────────────────────────────── ajustes

export async function ajustarDirecto(
  slug: string,
  cambios: { activo?: boolean; subidasAbiertas?: boolean; moderacion?: Moderacion },
): Promise<{ ok: true } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  const p: Partial<ConfigDirecto> = {};
  if (typeof cambios.activo === "boolean") p.activo = cambios.activo;
  if (typeof cambios.subidasAbiertas === "boolean") p.subidas_abiertas = cambios.subidasAbiertas;
  if (cambios.moderacion === "auto" || cambios.moderacion === "manual") p.moderacion = cambios.moderacion;
  if (!Object.keys(p).length) return { ok: true };
  if (!(await actualizarConfig(c.boda.id, p))) return SIN_BASE;
  void avisar({ ...c.config, ...p }, "cambio");
  return { ok: true };
}

/** El diseño de la pantalla y de la subida (estilo del pase, marco, frase…). */
export async function guardarDisenoDirecto(slug: string, d: DisenoDirecto): Promise<{ ok: true; diseno: DisenoDirecto } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  const limpio = normalizarDiseno(d);
  if (!(await guardarDiseno(c.boda.id, limpio))) return SIN_BASE;
  // La pantalla relee el feed completo con «cambio» y recoge el diseño.
  void avisar(c.config, "cambio");
  return { ok: true, diseno: limpio };
}

/** Clave nueva para la pantalla: la TV con la clave vieja deja de ver nada. */
export async function regenerarClavePantalla(slug: string): Promise<{ ok: true; pantalla: string } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  const clave = nuevaClave();
  if (!(await actualizarConfig(c.boda.id, { clave_pantalla: clave }))) return SIN_BASE;
  const enlaces = await enlacesDe(c.acceso.slug, { ...c.config, clave_pantalla: clave });
  return { ok: true, pantalla: enlaces.pantalla };
}

/** Lanza (o termina, con `null`) un momento programado: «Primer baile». */
export async function lanzarMomento(slug: string, titulo: string | null): Promise<{ ok: true } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  const limpio = titulo ? String(titulo).replace(/\s+/g, " ").trim().slice(0, 48) : "";
  const p = limpio
    ? { capitulo: limpio, capitulo_desde: new Date().toISOString() }
    : { capitulo: null, capitulo_desde: null };
  if (!(await actualizarConfig(c.boda.id, p))) return SIN_BASE;
  void avisar(c.config, "cambio");
  return { ok: true };
}

/** Fija un mensaje en la pantalla (o lo suelta, con `null`). */
export async function fijarMensaje(slug: string, id: string | null): Promise<{ ok: true } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  if (id) {
    const m = await obtenerMomento(c.boda.id, id);
    if (!m || m.tipo !== "mensaje") return { ok: false, error: "Ese mensaje ya no está." };
  }
  if (!(await actualizarConfig(c.boda.id, { mensaje_fijado: id || null }))) return SIN_BASE;
  void avisar(c.config, "cambio");
  return { ok: true };
}

/** Solo el estudio: el plan contratado y los años extra. */
export async function fijarPlanDirecto(
  slug: string,
  plan: PlanMomentos,
  anosExtra = 0,
): Promise<{ ok: true } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  if (c.acceso.via !== "estudio") return { ok: false, error: "El plan lo cambia el estudio." };
  if (!esPlanMomentos(plan)) return { ok: false, error: "Ese plan no existe." };
  const anos = Math.min(Math.max(Math.floor(Number(anosExtra) || 0), 0), 10);
  if (!(await fijarPlan(c.boda, plan, anos))) return SIN_BASE;
  return { ok: true };
}

// ─────────────────────────────────────────────────────────── moderación

export type FiltroModeracion = "todas" | "pendientes" | "ocultas" | "destacadas" | "mensajes" | "retiradas";

export async function listarModeracion(
  slug: string,
  filtro: FiltroModeracion = "todas",
  antes: string | null = null,
): Promise<{ ok: true; momentos: MomentoModeracion[]; hayMas: boolean } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  const estados: EstadoMomento[] | undefined =
    filtro === "pendientes" ? ["pendiente"] : filtro === "ocultas" || filtro === "retiradas" ? ["oculto"] : undefined;
  const POR_PAGINA = 60;
  let filas = await listarMomentos(c.boda.id, {
    estados,
    antes,
    tipos: filtro === "mensajes" ? ["mensaje"] : undefined,
    limite: filtro === "destacadas" || filtro === "retiradas" ? 2000 : POR_PAGINA + 1,
  });
  if (filtro === "destacadas") filas = filas.filter((f) => f.destacado);
  if (filtro === "retiradas") filas = filas.filter((f) => f.retirada_pedida);
  const hayMas = filas.length > POR_PAGINA;
  return { ok: true, momentos: await aModeracion(filas.slice(0, POR_PAGINA)), hayMas };
}

export async function moderarMomento(
  slug: string,
  id: string,
  cambio: { estado?: EstadoMomento; destacado?: boolean; revisada?: boolean },
): Promise<{ ok: true } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  const p: { estado?: EstadoMomento; destacado?: boolean; retirada_pedida?: null } = {};
  // «Dejarla retirada»: la pareja ya la ha revisado; sigue oculta.
  if (cambio.revisada === true) p.retirada_pedida = null;
  if (cambio.estado === "visible" || cambio.estado === "oculto" || cambio.estado === "pendiente") {
    p.estado = cambio.estado;
    // Volver a enseñarla es la respuesta de la pareja a la petición.
    if (cambio.estado === "visible") p.retirada_pedida = null;
  }
  if (typeof cambio.destacado === "boolean") p.destacado = cambio.destacado;
  if (!(await cambiarMomento(c.boda.id, String(id), p))) return { ok: false, error: "Ya no está." };
  void avisar(c.config, "cambio");
  return { ok: true };
}

export async function borrarMomento(slug: string, id: string): Promise<{ ok: true } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  if (!puedeAdministrar(c.acceso)) return { ok: false, error: "Borrar solo pueden los novios." };
  const rutas = await quitarMomento(c.boda.id, String(id));
  if (!rutas) return { ok: false, error: "Ya no está." };
  await borrarArchivos(rutas);
  if (c.config.mensaje_fijado === id) await actualizarConfig(c.boda.id, { mensaje_fijado: null });
  void avisar(c.config, "cambio");
  return { ok: true };
}

// ──────────────────────────────────────────────────────────── descarga

export type ArchivoZip = { nombre: string; url: string; bytes: number };

/**
 * La lista para el ZIP. El ZIP se hace EN EL NAVEGADOR (client-zip): los
 * gigas no pasan por Vercel. URLs firmadas de 6 horas: da tiempo a bajarlo
 * todo aunque la wifi de casa sea mala.
 */
export async function listaDescarga(
  slug: string,
): Promise<{ ok: true; archivos: ArchivoZip[]; mensajes: string; album: string; carpeta: string } | Fallo> {
  const c = await contexto(slug);
  if ("ok" in c) return c;
  const filas = (await listarMomentos(c.boda.id, { limite: 5000 })).reverse();
  const urls = await urlsLectura(
    filas.map((f) => f.ruta).filter((r): r is string => Boolean(r)),
    6 * 3600,
  );
  const limpio = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "invitado";
  const hora = (iso: string) => new Date(iso).toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "long", timeStyle: "short" });
  const archivos: ArchivoZip[] = [];
  const piezas: { nombre: string; f: (typeof filas)[number] }[] = [];
  let n = 0;
  for (const f of filas) {
    if (!f.ruta) continue;
    const url = urls.get(f.ruta);
    if (!url) continue;
    n++;
    const ext = f.ruta.split(".").pop();
    const carpeta = f.estado === "visible" ? "" : "ocultas/";
    const fecha = f.creado.slice(0, 16).replace(/[-:T]/g, "");
    const nombre = `${carpeta}${String(n).padStart(4, "0")}-${fecha}-${limpio(f.autor)}.${ext}`;
    archivos.push({ nombre, url, bytes: f.bytes });
    if (f.estado === "visible") piezas.push({ nombre, f });
  }
  // mensajes.txt: los mensajes sueltos y los pies de foto, en orden.
  const mensajes = filas
    .filter((f) => f.mensaje && f.estado === "visible")
    .map((f) => {
      const foto = f.tipo !== "mensaje" ? piezas.find((x) => x.f.id === f.id)?.nombre : null;
      return `${f.autor} · ${hora(f.creado)}${foto ? ` · con la foto ${foto}` : ""}\n${f.mensaje}\n`;
    })
    .join("\n");
  const { a, b, fecha } = c.boda.inv.pareja;
  return {
    ok: true,
    archivos,
    mensajes,
    album: albumHtml({ a, b, fecha }, piezas, filas.filter((f) => f.tipo === "mensaje" && f.mensaje && f.estado === "visible"), hora),
    carpeta: `${limpio(a)}-y-${limpio(b)}-fotos`,
  };
}

/**
 * `abrid-aqui.html` dentro del ZIP: el álbum para verlo sin conexión, con
 * cada foto y su pie, y los mensajes. Rutas relativas a los archivos del ZIP.
 */
function albumHtml(
  pareja: { a: string; b: string; fecha: string },
  piezas: { nombre: string; f: { tipo: string; autor: string; mensaje: string | null; creado: string } }[],
  sueltos: { autor: string; mensaje: string | null; creado: string }[],
  hora: (iso: string) => string,
) {
  const e = (t: string) => t.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
  const fotos = piezas
    .map(({ nombre, f }) => {
      const medio =
        f.tipo === "video"
          ? `<video src="${e(nombre)}" controls preload="none"></video>`
          : `<img src="${e(nombre)}" alt="Foto de ${e(f.autor)}" loading="lazy">`;
      return `<figure>${medio}<figcaption>${f.mensaje ? `<q>${e(f.mensaje)}</q>` : ""}<span>${e(f.autor)} · ${e(hora(f.creado))}</span></figcaption></figure>`;
    })
    .join("\n");
  const notas = sueltos
    .map((m) => `<blockquote><p>${e(m.mensaje ?? "")}</p><cite>${e(m.autor)}</cite></blockquote>`)
    .join("\n");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(pareja.a)} & ${e(pareja.b)} · Vuestro álbum</title>
<style>
body{margin:0;background:#faf7f2;color:#1f1a17;font:17px/1.6 Georgia,serif}
header{text-align:center;padding:12vh 20px 6vh}h1{font-weight:400;font-size:clamp(2.4rem,8vw,4.5rem);margin:0;line-height:1.05}
header p{color:#5e5650;margin:.6em 0 0}main{max-width:1200px;margin:0 auto;padding:0 16px 10vh}
.fotos{columns:3 300px;column-gap:16px}figure{break-inside:avoid;margin:0 0 16px;background:#fff;padding:10px 10px 14px;box-shadow:0 8px 24px -16px rgba(0,0,0,.4)}
img,video{display:block;width:100%;height:auto}figcaption{margin-top:10px}q{display:block;font-style:italic;font-size:1.05rem}
figcaption span{display:block;color:#5e5650;font-size:.9rem;margin-top:4px}h2{font-weight:400;font-size:2rem;text-align:center;margin:10vh 0 4vh}
.notas{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}blockquote{margin:0;background:#fff;padding:24px;border-left:3px solid #8c1d2c}
blockquote p{margin:0;font-size:1.15rem}cite{display:block;margin-top:12px;color:#5e5650;font-style:normal}
</style></head><body><header><h1>${e(pareja.a)} &amp; ${e(pareja.b)}</h1><p>${e(pareja.fecha)} · ${piezas.length} recuerdos de vuestros invitados</p></header>
<main><section class="fotos">${fotos}</section>${notas ? `<h2>Lo que os escribieron</h2><section class="notas">${notas}</section>` : ""}</main></body></html>`;
}
