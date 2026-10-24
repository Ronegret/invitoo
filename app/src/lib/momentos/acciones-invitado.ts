"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { avisarDeseo, avisarRetirada } from "@/lib/avisos/avisar";
import { contar } from "@/lib/visitas/registrar";
import { borrarArchivos, modoAlmacen, rutaValida, tamano, urlSubida, type DestinoSubida } from "./almacen";
import {
  cambiarMomento,
  existeRuta,
  insertarMomento,
  obtenerConfig,
  obtenerMomento,
  pieRepetido,
  recientesDeDispositivo,
  resolverBoda,
  usoDe,
  type Boda,
} from "./datos";
import { COMPRESION, limitesDe, MAX_PIE, RITMO } from "./planes";
import { avisar, iguales, ritmoIp, vigente } from "./servidor";
import type { ConfigDirecto, EstadoMomento } from "./tipos";

/**
 * Acciones PÚBLICAS de «En directo»: las que usa el invitado desde el QR.
 *
 * Son la frontera de confianza: no hay cuenta, así que cada una comprueba el
 * token de la boda (el del QR), el id del dispositivo, el ritmo y las cuotas
 * del plan, y escribe con service role. Las cuotas se comprueban ANTES de
 * emitir la URL firmada (no se regala espacio) y otra vez al confirmar, con
 * el tamaño REAL del archivo en el almacén (no el que dice el navegador).
 */

export type Fallo = { ok: false; error: string };

const DISPOSITIVO = /^[a-z0-9]{16,40}$/;
/** El id que pone el navegador a cada archivo (16–40 caracteres hex). */
const CLAVE_CLIENTE = /^[a-f0-9]{16,40}$/;
const MIME_FOTO: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg" };
const MIME_VIDEO: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

const CERRADO: Fallo = { ok: false, error: "El álbum está cerrado ahora mismo. Los novios lo abrirán enseguida." };
const SIN_ALMACEN: Fallo = { ok: false, error: "Ahora mismo no podemos guardar fotos. Inténtalo dentro de un rato." };

type Entrada = { slug: string; token: string; dispositivo: string };

type Puerta =
  | { ok: true; boda: Boda & { id: string }; config: ConfigDirecto }
  | Fallo;

/** La comprobación común: boda, token del QR, dispositivo y que esté abierto. */
async function abrir(e: Entrada, paraSubir = true): Promise<Puerta> {
  if (!modoAlmacen()) return SIN_ALMACEN;
  const slug = String(e.slug ?? "");
  const token = String(e.token ?? "");
  if (!DISPOSITIVO.test(String(e.dispositivo ?? ""))) {
    return { ok: false, error: "Algo ha fallado. Prueba a recargar la página." };
  }
  const boda = await resolverBoda(slug);
  if (!boda) return { ok: false, error: "No encontramos esta boda." };
  if (!boda.id) {
    return { ok: false, error: "Esta es una boda de muestra: aquí no se guardan fotos." };
  }
  const config = await obtenerConfig({ ...boda, id: boda.id });
  if (!config) return SIN_ALMACEN;
  if (!token || !iguales(token, config.token_subida)) {
    return { ok: false, error: "Este enlace no es válido. Escanead otra vez el código QR de la mesa." };
  }
  if (!config.activo || !vigente(config)) return CERRADO;
  if (paraSubir && !config.subidas_abiertas) {
    return { ok: false, error: "Los novios ya han cerrado las subidas. ¡Gracias por compartir!" };
  }
  if (!(await ritmoIp(`momentos:${slug}`, RITMO.porIpPorMinuto))) {
    return { ok: false, error: "Hay mucha gente subiendo a la vez. Espera un minuto y vuelve a probar." };
  }
  return { ok: true, boda: { ...boda, id: boda.id }, config };
}

function nombre(x: unknown) {
  return String(x ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
}

// ────────────────────────────────────────────────────────────── preparar

export type ArchivoPedido = {
  /** Id del navegador para casar la respuesta con su archivo. */
  clave: string;
  tipo: "foto" | "video";
  mime: string;
  /** Bytes de cada versión ya comprimida. */
  bytes: { grande: number; pantalla?: number; miniatura?: number };
  duracion?: number;
};

export type Preparado = {
  clave: string;
  /** Ese archivo ya estaba subido y confirmado: no hay que hacer nada. */
  yaSubida?: boolean;
  grande: { ruta: string } & DestinoSubida;
  pantalla?: { ruta: string } & DestinoSubida;
  miniatura?: { ruta: string } & DestinoSubida;
};

export async function prepararSubida(
  e: Entrada & { archivos: ArchivoPedido[] },
): Promise<{ ok: true; archivos: Preparado[] } | Fallo> {
  const puerta = await abrir(e);
  if (!puerta.ok) return puerta;
  const { boda, config } = puerta;
  const archivos = Array.isArray(e.archivos) ? e.archivos.slice(0, 30) : [];
  if (!archivos.length) return { ok: false, error: "No hay nada que subir." };
  const plan = limitesDe(config.plan, config.anos_extra);

  let bytesPedidos = 0;
  let fotos = 0;
  let videos = 0;
  for (const a of archivos) {
    const b = a.bytes ?? { grande: 0 };
    const total = (Number(b.grande) || 0) + (Number(b.pantalla) || 0) + (Number(b.miniatura) || 0);
    bytesPedidos += total;
    if (a.tipo === "foto") {
      fotos++;
      if (!MIME_FOTO[a.mime]) return { ok: false, error: "Ese formato de foto no lo podemos guardar." };
      if (b.grande > COMPRESION.maxBytesFoto || (b.pantalla ?? 0) > COMPRESION.maxBytesPantalla) {
        return { ok: false, error: "Una de las fotos pesa demasiado." };
      }
    } else if (a.tipo === "video") {
      videos++;
      if (!plan.videos) return { ok: false, error: "En este álbum solo se pueden subir fotos." };
      if (!MIME_VIDEO[a.mime]) return { ok: false, error: "Ese formato de vídeo no lo podemos guardar." };
      if (b.grande > COMPRESION.maxBytesVideo) {
        return { ok: false, error: `Los vídeos pueden pesar ${Math.round(COMPRESION.maxBytesVideo / 1048576)} MB como mucho.` };
      }
      if (!(Number(a.duracion) > 0) || Number(a.duracion) > plan.duracionVideo + 0.75) {
        return { ok: false, error: `Los vídeos pueden durar ${plan.duracionVideo} segundos como mucho.` };
      }
    } else {
      return { ok: false, error: "Solo se pueden subir fotos y vídeos." };
    }
    if ((b.miniatura ?? 0) > COMPRESION.maxBytesMiniatura) return { ok: false, error: "Una miniatura pesa demasiado." };
  }

  // Cuotas de la boda, ANTES de emitir nada.
  const uso = await usoDe(boda.id);
  if (uso.fotos + fotos > config.limite_fotos) {
    const quedan = Math.max(0, config.limite_fotos - uso.fotos);
    return {
      ok: false,
      error: quedan
        ? `Solo caben ${quedan} fotos más en el álbum. Elige menos.`
        : "El álbum está completo. ¡Gracias por compartir!",
    };
  }
  if (uso.videos + videos > config.limite_videos) {
    return { ok: false, error: "Ya no caben más vídeos en el álbum. Las fotos sí." };
  }
  if (uso.bytes + bytesPedidos > config.limite_bytes) {
    return { ok: false, error: "El álbum se ha quedado sin espacio. Avisa a los novios." };
  }

  // Ritmo por dispositivo y hora.
  if (fotos) {
    const hechas = await recientesDeDispositivo(boda.id, e.dispositivo, 3600, "foto");
    if (hechas + fotos > RITMO.fotosPorHora) {
      return { ok: false, error: `Puedes subir ${RITMO.fotosPorHora} fotos por hora. Prueba un poco más tarde.` };
    }
  }
  if (videos) {
    const hechos = await recientesDeDispositivo(boda.id, e.dispositivo, 3600, "video");
    if (hechos + videos > RITMO.videosPorHora) {
      return { ok: false, error: `Puedes subir ${RITMO.videosPorHora} vídeos por hora. Prueba un poco más tarde.` };
    }
  }

  const salida: Preparado[] = [];
  for (const a of archivos) {
    // Idempotencia: el id del archivo es el que pone el navegador (y guarda
    // en su cola). Un reintento escribe en las MISMAS rutas (upsert) y la
    // confirmación no duplica: `existeRuta`.
    const id = CLAVE_CLIENTE.test(String(a.clave)) ? String(a.clave) : randomBytes(10).toString("hex");
    const ext = a.tipo === "foto" ? MIME_FOTO[a.mime] : MIME_VIDEO[a.mime];
    const grandeRuta = `${boda.id}/${a.tipo === "foto" ? "f" : "v"}/${id}.${ext}`;
    if (await existeRuta(grandeRuta)) {
      // Ya se subió y se confirmó (se perdió la respuesta): no se repite.
      salida.push({ clave: id, yaSubida: true, grande: { ruta: grandeRuta, url: "", cabeceras: {} } });
      continue;
    }
    const grande = await urlSubida(grandeRuta, a.mime);
    if (!grande) return SIN_ALMACEN;
    const p: Preparado = { clave: id, grande: { ruta: grandeRuta, ...grande } };
    if (a.tipo === "foto" && a.bytes.pantalla) {
      const ruta = `${boda.id}/p/${id}.${ext}`;
      const d = await urlSubida(ruta, a.mime);
      if (d) p.pantalla = { ruta, ...d };
    }
    if (a.bytes.miniatura) {
      const ruta = `${boda.id}/m/${id}.${ext === "jpg" ? "jpg" : "webp"}`;
      const d = await urlSubida(ruta, ext === "jpg" ? "image/jpeg" : "image/webp");
      if (d) p.miniatura = { ruta, ...d };
    }
    salida.push(p);
  }
  return { ok: true, archivos: salida };
}

// ────────────────────────────────────────────────────────────── confirmar

export type Confirmacion = {
  tipo: "foto" | "video";
  rutas: { grande: string; pantalla?: string | null; miniatura?: string | null };
  ancho?: number | null;
  alto?: number | null;
  duracion?: number | null;
  autor: string;
  /** El pie de foto opcional (por foto o por lote). */
  mensaje?: string | null;
};

/** Un pie limpio: una línea de espacios, sin controles; vacío → null. */
function pie(x: unknown): string | null {
  const t = String(x ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PIE);
  return t.length ? t : null;
}

export async function confirmarSubida(
  e: Entrada & Confirmacion,
): Promise<{ ok: true; id: string; estado: EstadoMomento } | Fallo> {
  const puerta = await abrir(e);
  if (!puerta.ok) return puerta;
  const { boda, config } = puerta;
  const autor = nombre(e.autor);
  if (autor.length < 2) return { ok: false, error: "Nos falta tu nombre." };
  const mensaje = pie(e.mensaje);

  const { grande } = e.rutas ?? {};
  const pantalla = e.rutas?.pantalla || null;
  const miniatura = e.rutas?.miniatura || null;
  const carpeta = e.tipo === "foto" ? "f" : "v";
  const prefijo = `${boda.id}/`;
  const base = (r: string) => r.split("/").pop()!.split(".")[0];
  const valida = (r: string | null, c: string) =>
    !r || (rutaValida(r) && r.startsWith(prefijo) && r.split("/")[1] === c && base(r) === base(grande));
  if (!grande || !valida(grande, carpeta) || !valida(pantalla, "p") || !valida(miniatura, "m")) {
    return { ok: false, error: "Algo ha fallado con esa foto. Vuelve a elegirla." };
  }

  // Reintento tras un corte: ya estaba confirmada.
  if (await existeRuta(grande)) return { ok: true, id: base(grande), estado: "visible" };

  // El tamaño de verdad, del almacén.
  const tams = await Promise.all([grande, pantalla, miniatura].map((r) => (r ? tamano(r) : Promise.resolve(0))));
  if (tams[0] === null) return { ok: false, error: "La foto no ha llegado entera. Vuelve a intentarlo." };
  const bytes = tams.reduce<number>((s, t) => s + (t ?? 0), 0);
  const tope = e.tipo === "foto" ? COMPRESION.maxBytesFoto + COMPRESION.maxBytesPantalla : COMPRESION.maxBytesVideo;
  const uso = await usoDe(boda.id);
  const lleno =
    (e.tipo === "foto" ? uso.fotos >= config.limite_fotos : uso.videos >= config.limite_videos) ||
    uso.bytes + bytes > config.limite_bytes;
  if (lleno || (tams[0] ?? 0) > tope) {
    await borrarArchivos([grande, pantalla, miniatura].filter((r): r is string => Boolean(r)));
    return { ok: false, error: lleno ? "El álbum está completo. ¡Gracias por compartir!" : "Ese archivo pesa demasiado." };
  }

  const n = (x: unknown) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Math.round(Number(x)) : null);
  const estado: EstadoMomento = config.moderacion === "manual" ? "pendiente" : "visible";
  const repetido = mensaje ? await pieRepetido(boda.id, e.dispositivo, mensaje) : true;
  const fila = await insertarMomento({
    invitacion_id: boda.id,
    tipo: e.tipo,
    ruta: grande,
    ruta_pantalla: tams[1] ? pantalla : null,
    ruta_miniatura: tams[2] ? miniatura : null,
    ancho: n(e.ancho),
    alto: n(e.alto),
    duracion: e.tipo === "video" ? Math.min(Number(e.duracion) || 0, 60) : null,
    bytes,
    autor,
    mensaje,
    estado,
    dispositivo: e.dispositivo,
    capitulo: config.capitulo,
  });
  if (!fila) return { ok: false, error: "No hemos podido guardarla. Vuelve a intentarlo." };
  void avisar(config, "nuevo");
  void contar("foto", boda.inv.slug); // métricas del estudio (lib/visitas)
  // El pie va al Libro de buenos deseos (F4 lo lee de `momentos.mensaje`);
  // la campana suena una vez por tanda, no por foto.
  if (mensaje && !repetido) {
    after(() => avisarDeseo(boda.inv.slug, { nombre: autor, texto: mensaje, donde: "en directo, con una foto" }));
  }
  return { ok: true, id: fila.id, estado: fila.estado };
}

/**
 * Poner (o cambiar, o quitar con "") el pie de una foto ya subida. Solo
 * desde el móvil que la subió y durante las 24 h siguientes.
 */
export async function ponerPie(
  e: Entrada & { id: string; mensaje: string },
): Promise<{ ok: true; mensaje: string | null } | Fallo> {
  const puerta = await abrir(e, false);
  if (!puerta.ok) return puerta;
  const { boda, config } = puerta;
  const m = await obtenerMomento(boda.id, String(e.id ?? ""));
  if (!m || m.tipo === "mensaje") return { ok: false, error: "Esa foto ya no está." };
  if (m.dispositivo !== e.dispositivo || Date.now() - Date.parse(m.creado) > 86_400_000) {
    return { ok: false, error: "Solo puedes escribir en las fotos que has subido tú." };
  }
  if (!(await ritmoIp(`pie:${boda.id}:${e.dispositivo}`, 30, 600_000))) {
    return { ok: false, error: "Has cambiado muchos pies seguidos. Espera un poco." };
  }
  const mensaje = pie(e.mensaje);
  if (!(await cambiarMomento(boda.id, m.id, { mensaje }))) return { ok: false, error: "No hemos podido guardarlo." };
  void avisar(config, "cambio");
  if (mensaje && mensaje !== m.mensaje) {
    after(() => avisarDeseo(boda.inv.slug, { nombre: m.autor, texto: mensaje, donde: "en directo, con una foto" }));
  }
  return { ok: true, mensaje };
}

// ──────────────────────────────────────────────────────────────── mensaje

export async function enviarMensajeDirecto(
  e: Entrada & { autor: string; mensaje: string },
): Promise<{ ok: true; estado: EstadoMomento } | Fallo> {
  const puerta = await abrir(e);
  if (!puerta.ok) return puerta;
  const { boda, config } = puerta;
  const autor = nombre(e.autor);
  const mensaje = String(e.mensaje ?? "").trim().slice(0, 280);
  if (autor.length < 2) return { ok: false, error: "Nos falta tu nombre." };
  if (mensaje.length < 2) return { ok: false, error: "Escribe algo más." };
  const recientes = await recientesDeDispositivo(boda.id, e.dispositivo, 60, "mensaje");
  if (recientes >= RITMO.mensajesPorMinuto) {
    return { ok: false, error: "Has escrito muchos seguidos. Espera un minuto." };
  }
  const fila = await insertarMomento({
    invitacion_id: boda.id,
    tipo: "mensaje",
    ruta: null,
    ruta_pantalla: null,
    ruta_miniatura: null,
    ancho: null,
    alto: null,
    duracion: null,
    bytes: 0,
    autor,
    mensaje,
    estado: config.moderacion === "manual" ? "pendiente" : "visible",
    dispositivo: e.dispositivo,
    capitulo: config.capitulo,
  });
  if (!fila) return { ok: false, error: "No hemos podido guardarlo. Vuelve a intentarlo." };
  void avisar(config, "nuevo");
  // Al Libro de buenos deseos y a la campana de la pareja (lib/avisos).
  after(() => avisarDeseo(boda.inv.slug, { nombre: autor, texto: mensaje, donde: "en directo" }));
  return { ok: true, estado: fila.estado };
}

// ─────────────────────────────────────────────────────── pedir que se retire

/**
 * «Pedir que se retire»: cualquier invitado puede quitar una foto de la
 * pantalla y del muro al instante (RGPD: quien sale en ella no tiene que
 * convencer a nadie). Queda oculta y marcada para que la pareja la revise.
 */
export async function pedirRetirada(e: Entrada & { id: string }): Promise<{ ok: true } | Fallo> {
  const puerta = await abrir(e, false);
  if (!puerta.ok) return puerta;
  const { boda, config } = puerta;
  if (!(await ritmoIp(`retirar:${boda.id}:${e.dispositivo}`, RITMO.retiradasPorHora, 3_600_000))) {
    return { ok: false, error: "Has pedido retirar muchas seguidas. Habla con los novios." };
  }
  const m = await obtenerMomento(boda.id, String(e.id ?? ""));
  if (!m) return { ok: false, error: "Esa foto ya no está." };
  await cambiarMomento(boda.id, m.id, { estado: "oculto", retirada_pedida: new Date().toISOString() });
  void avisar(config, "cambio");
  after(() => avisarRetirada(boda.id, boda.inv.slug));
  return { ok: true };
}
