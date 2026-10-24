import "server-only";

import { DEMO } from "@/data/demo";
import { listarMiembros, listarTodas, obtenerRsvps } from "@/lib/datos";
import { listarDeseos } from "@/lib/deseos/datos";
import { SITIO_URL } from "@/lib/enlaces";
import { aMadridISO } from "@/lib/fecha";
import { configsHasta, totalVisibles } from "@/lib/momentos/datos";
import { listarPedidos, type Pedido } from "@/lib/pagos/pedidos";
import { leerContadores, limpiarHuellas, purgarContadores } from "@/lib/visitas/datos";
import { modoDatos } from "@/lib/visitas/local";
import { diaMadrid, diasEntre, sumarDias } from "@/lib/visitas/registrar";
import type { Invitacion } from "@/lib/tipos";
import { enviarCorreo, enviosDeBoda, guardarEnvio, leerEnvio, leerEnvios, omitir, purgarEnvios, reintentarFallidos, type ResultadoEnvio } from "./enviar";
import { datosEstudio, huboActividad } from "./metricas";
import { PLANTILLAS } from "./plantillas";
import { enlaceBaja, enlaceBajaUnClic, enlacePreferencias, puedeRecibir } from "./preferencias";
import { SECUENCIA } from "./secuencia";
import { GRUPO_DE, type Ancla, type CifrasBoda, type ContextoPaso, type DatosCorreo, type DatosEstudio, type IdCorreo, type IdNovios, type Paso } from "./tipos";

/**
 * EL MOTOR. Recorre la secuencia declarativa de E2 (`SECUENCIA`) para cada
 * boda y decide qué correo toca hoy. Lo lanzan dos crons diarios (el plan
 * Hobby de Vercel no permite más de uno al día por ruta):
 *
 *   /api/correos/estudio  ~07:40 Madrid — resumen diario (si hubo actividad),
 *                                         semanal los lunes, limpieza de huellas.
 *   /api/correos/novios   ~09:15 Madrid — la secuencia de cada boda y los
 *                                         reintentos de lo que falló.
 *
 * Lo que tiene que salir AL MOMENTO (bienvenida tras pagar, alertas) no
 * espera al cron: lo dispara `programar()` desde el evento.
 *
 * Cómo se decide un paso:
 *   · `evento`     → en el cron solo se recuperan los que se ven en el estado
 *                    (publicada; bienvenida a un miembro nuevo). El resto los
 *                    manda `programar()`.
 *   · `desfase`    → ancla + días = día objetivo; sale si hoy está entre el
 *                    objetivo y objetivo + `ventanaDias` (2 por defecto), por
 *                    si un cron falla o el límite diario lo aplazó.
 *   · `recurrente` → uno por periodo de `cadaDias` (la clave lleva el periodo).
 *   · y siempre: `condicion(ctx)`, las preferencias del destinatario, la
 *                    idempotencia y los límites de `enviar.ts`.
 *
 * Arranque en producción: la primera vez que corre con Supabase, NO recupera
 * eventos pasados (no manda «vuestra invitación está publicada» a bodas que se
 * publicaron hace meses): los marca «omitido» y deja una fila `__inicio__`.
 */

// ─────────────────────────────────────────────────────────── fechas

/** El lunes 5 de enero de 2026: origen de los periodos recurrentes. */
const ORIGEN = "2026-01-05";
const diaDe = (iso: string | null | undefined) => (iso ? aMadridISO(iso).slice(0, 10) : null);
export function esLunes(dia: string) {
  const [y, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 1;
}

// ─────────────────────────────────────────────────────────── destinatarios

const SLUGS_DEMO = new Set(Object.keys(DEMO));
export const DEMO_ESTUDIO = "estudio@example.com";
export const demoNovios = (slug: string) => `novios.${slug || "reserva"}@example.com`;

/** Emails de los novios de una boda: miembros «pareja» y el email de la reserva. */
async function destinatarios(invitacionId: string, slug: string, pedidos: Pedido[]): Promise<string[]> {
  const emails = new Set<string>();
  try {
    for (const m of await listarMiembros(invitacionId)) if (m.email && m.rol === "pareja") emails.add(m.email.toLowerCase());
  } catch {
    /* sin miembros */
  }
  for (const p of pedidos) if (p.email) emails.add(p.email.toLowerCase());
  // En local no hay cuentas: un destinatario de ejemplo para ver la secuencia en el buzón.
  if (!emails.size && modoDatos() === "local") emails.add(demoNovios(slug));
  return [...emails];
}

export function emailsEstudio(): string[] {
  const xs = (process.env.ESTUDIO_EMAIL ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!xs.length && modoDatos() === "local") return [DEMO_ESTUDIO];
  return xs;
}

// ─────────────────────────────────────────────────────────── datos del correo

export function enlacesBoda(slug: string, email: string): DatosCorreo["enlaces"] {
  const panel = slug ? `${SITIO_URL}/panel/${slug}` : `${SITIO_URL}/panel`;
  return {
    panel,
    invitacion: slug ? `${SITIO_URL}/i/${slug}` : SITIO_URL,
    album: `${panel}/directo`,
    deseos: `${panel}/deseos`,
    directo: `${panel}/directo`,
    baja: enlaceBaja(email),
    preferencias: enlacePreferencias(email),
    // Google / Bodas.net. Vacía → la plantilla esconde el botón de reseña.
    resena: process.env.CORREOS_URL_RESENA?.trim() || undefined,
  };
}

export function datosParaEstudio(e: DatosEstudio): DatosCorreo {
  const estudio = `${SITIO_URL}/estudio`;
  return {
    pareja: { a: "", b: "" },
    fecha: null,
    slug: e.alerta?.boda?.slug ?? "",
    enlaces: { panel: estudio, invitacion: SITIO_URL, album: estudio, deseos: estudio, baja: estudio, preferencias: estudio },
    estudio: e,
  };
}

/** Los pasos de la secuencia y la plantilla de cada uno, con red: si falta algo de E2, no se cae. */
function plantillaDe(paso: Paso) {
  return PLANTILLAS[paso.plantilla] ?? PLANTILLAS[paso.id] ?? null;
}

/** Envía un paso a una persona. Comprueba preferencias y monta la baja. */
export async function enviarPaso(
  paso: Paso,
  email: string,
  datos: DatosCorreo,
  clave: string,
  boda: { id: string | null; slug: string | null },
  dia?: string,
  /** `prioritario`: confirmación de compra (sin preferencias, sin límite diario, sin List-Unsubscribe). */
  opciones: { prioritario?: boolean } = {},
): Promise<ResultadoEnvio | "preferencias" | "sin-plantilla"> {
  const plantilla = plantillaDe(paso);
  if (!plantilla) return "sin-plantilla";
  const estudio = paso.categoria === "estudio";
  const prioritario = Boolean(opciones.prioritario);
  if (!estudio && !prioritario && !(await puedeRecibir(email, paso.id, paso.imprescindible))) return "preferencias";
  let correo;
  try {
    correo = plantilla(datos);
  } catch (e) {
    console.error("[correos.plantilla]", paso.id, e);
    return "fallido";
  }
  return enviarCorreo({
    clave,
    para: email,
    idCorreo: paso.id,
    categoria: paso.categoria,
    correo,
    // E3 · List-Unsubscribe (RFC 8058) en todo correo a los novios que se pueda
    // apagar, y la baja de un clic apaga SOLO el grupo de ese correo (el de una
    // reseña apaga «fidelización»; el del resumen de RSVP, «confirmaciones»).
    // Nunca en el recibo de compra ni en el aviso imprescindible del álbum.
    baja: estudio || prioritario || paso.imprescindible ? null : enlaceBajaUnClic(email, GRUPO_DE[paso.id as IdNovios]),
    invitacionId: boda.id,
    slug: boda.slug,
    dia,
    prioritario,
  });
}

/** Paso por id, o uno de reserva si E2 no lo ha declarado (alertas). */
export function pasoDe(id: IdCorreo): Paso {
  return (
    SECUENCIA.find((p) => p.id === id) ?? {
      id,
      categoria: id.startsWith("estudio-") || id.startsWith("alerta-") ? "estudio" : "servicio",
      disparador: { tipo: "evento", evento: "pago" },
      plantilla: id,
      nombre: id,
    }
  );
}

/** Clave de idempotencia. La bienvenida es por persona (una sola vez, tenga las bodas que tenga). */
export function claveDe(paso: Paso, bodaId: string, email: string, periodo?: string) {
  if (paso.disparador.tipo === "evento" && (paso.disparador.evento === "pago" || paso.disparador.evento === "vinculo")) {
    return `${paso.id}:${email}`;
  }
  return [bodaId, paso.id, periodo, email].filter(Boolean).join(":");
}

// ─────────────────────────────────────────────────────────── contexto de una boda

type Boda = Invitacion & { id: string };

type Contexto = {
  ctx: ContextoPaso;
  /** Un deseo favorito del Libro (el aniversario lo cita). */
  recuerdo: DatosCorreo["recuerdo"];
  anclas: Record<Ancla, string | null>;
  cifras: CifrasBoda;
  pagado: boolean;
};

async function contextoDe(
  b: Boda,
  hoy: string,
  extra: { pedidos: Pedido[]; retencion: string | null; aperturas: { total: number; semana: number } },
): Promise<Contexto> {
  const fecha = diaDe(b.pareja.fecha);
  const diasParaBoda = fecha ? diasEntre(hoy, fecha) : null;
  const rsvpBloque = b.bloques.find((x) => x.t === "rsvp") as { limite?: string } | undefined;
  const limite = diaDe(rsvpBloque?.limite ?? null);
  const diasHastaLimite = limite ? diasEntre(hoy, limite) : null;
  const publicada = b.estado === "publicada";

  const [rsvps, fotos, deseos, envios] = await Promise.all([
    obtenerRsvps(b.id).catch(() => []),
    totalVisibles(b.id).catch(() => 0),
    listarDeseos(b.id).catch(() => []),
    enviosDeBoda(b.id).catch(() => []),
  ]);
  const haceSemana = sumarDias(hoy, -7);
  // «Nuevas» = desde el último resumen enviado (si salió esta semana) o de la
  // última semana: un resumen que sale un martes no repite las del lunes.
  const ultimoResumen = envios
    .filter((f) => f.correo === "rsvp-resumen" && (f.estado === "enviado" || f.estado === "buzon") && f.enviado_en && f.dia > haceSemana)
    .map((f) => f.enviado_en!)
    .sort()
    .pop();
  const esNueva = (creado: string) => {
    const t = Date.parse(creado);
    if (!Number.isFinite(t)) return false;
    return ultimoResumen ? t > Date.parse(ultimoResumen) : (diaDe(creado) ?? "") >= haceSemana;
  };
  const vienen = rsvps.filter((r) => r.asiste);
  const cifras: CifrasBoda = {
    aperturas: extra.aperturas.total,
    aperturasSemana: extra.aperturas.semana,
    respuestas: rsvps.length,
    vienen: vienen.length,
    noVienen: rsvps.length - vienen.length,
    personas: vienen.reduce((s, r) => s + Math.max(1, r.personas.length), 0),
    nuevas: rsvps.filter((r) => Boolean(r.creado_en) && esNueva(r.creado_en)).length,
    fotos,
    deseos: deseos.length,
    fechaLimite: limite,
    diasHastaLimite,
    albumCaduca: diaDe(extra.retencion),
  };

  const publicadaEnvio = envios.find((f) => f.correo === "publicada");
  const pagos = extra.pedidos
    .filter((p) => p.estado_pago === "pagado" || p.estado_pago === "demo")
    .map((p) => diaDe(p.pagado_en ?? p.creado))
    .filter((x): x is string => Boolean(x))
    .sort();
  // ¿Es cliente? Un pago enlazado a la boda; o, si la reserva no se enlazó,
  // que la boda esté publicada (el estudio solo publica las de clientes). En
  // la demo local, todas: así se ve la secuencia entera en el buzón.
  const pagado = pagos.length > 0 || publicada || modoDatos() === "local";
  const rsvpAbierto = publicada && Boolean(rsvpBloque) && (diasHastaLimite === null ? (diasParaBoda ?? -1) > 0 : diasHastaLimite >= 0);

  return {
    ctx: {
      hoy,
      fecha,
      diasParaBoda,
      pagado,
      publicada,
      // No hay todavía un «aprobado» explícito: publicar es aprobar.
      datosCompletos: publicada,
      disenoAprobado: publicada,
      rsvpAbierto,
      diasHastaLimite,
      albumCaduca: cifras.albumCaduca ?? null,
      cifras,
    },
    anclas: {
      boda: fecha,
      pago: pagos[0] ?? null,
      publicada: publicadaEnvio ? diaDe(publicadaEnvio.enviado_en ?? publicadaEnvio.creado) : null,
      "caducidad-album": cifras.albumCaduca ?? null,
      "limite-rsvp": limite,
    },
    cifras,
    pagado,
    recuerdo: (() => {
      const visibles = deseos.filter((x) => !x.oculto && x.texto.trim().length > 0);
      const d = visibles.find((x) => x.favorito) ?? null;
      return d ? { texto: d.texto.trim().slice(0, 280), autor: d.nombre || null } : null;
    })(),
  };
}

/** ¿Toca este paso hoy? Devuelve el periodo (para la clave) o null. */
function toca(paso: Paso, c: Contexto, hoy: string, hayMiembros: boolean): { periodo?: string; margen: number } | null {
  const d = paso.disparador;
  let sale = false;
  let periodo: string | undefined;
  /** Días que le quedan a la ventana: con el límite diario, sale antes lo que caduca antes. */
  let margen = 0;
  if (d.tipo === "evento") {
    if (d.evento === "publicada") sale = c.ctx.publicada && (c.ctx.diasParaBoda ?? 1) >= 0;
    else if (d.evento === "pago" || d.evento === "vinculo") sale = hayMiembros && (c.pagado || d.evento === "vinculo") && (c.ctx.diasParaBoda ?? 1) >= 0;
  } else if (d.tipo === "desfase") {
    const ancla = c.anclas[d.ancla];
    if (ancla) {
      const objetivo = sumarDias(ancla, d.dias);
      const pasado = diasEntre(objetivo, hoy);
      sale = pasado >= 0 && pasado <= (paso.ventanaDias ?? 2);
      margen = (paso.ventanaDias ?? 2) - pasado;
      // Si la boda (o la fecha límite) cambia de fecha, la cuenta atrás vuelve
      // a valer para la fecha nueva: el ancla va en la clave.
      periodo = d.ancla === "boda" || d.ancla === "limite-rsvp" ? ancla : undefined;
    }
  } else if (d.tipo === "recurrente") {
    const n = Math.floor(diasEntre(ORIGEN, hoy) / Math.max(1, d.cadaDias));
    periodo = `p${n}`;
    margen = 100 + (d.cadaDias - 1 - (diasEntre(ORIGEN, hoy) % Math.max(1, d.cadaDias)));
    sale = true;
  }
  if (!sale) return null;
  try {
    if (paso.condicion && !paso.condicion(c.ctx)) return null;
  } catch (e) {
    console.error("[correos.condicion]", paso.id, e);
    return null;
  }
  return { periodo, margen };
}

// ─────────────────────────────────────────────────────────── cron de los novios

export type Informe = { bodas: number; revisados: number; resultados: Record<string, number>; reintentos?: number; inicio?: boolean };

export async function cronNovios(hoy = diaMadrid()): Promise<Informe> {
  const informe: Informe = { bodas: 0, revisados: 0, resultados: {} };
  const anota = (r: string) => (informe.resultados[r] = (informe.resultados[r] ?? 0) + 1);
  const modo = modoDatos();
  if (!modo) return informe;

  // Arranque en producción: sin `__inicio__`, los eventos pasados no se recuperan.
  const arranque = modo === "supabase" && !(await leerEnvio("__inicio__"));
  informe.inicio = arranque;

  const pasos = SECUENCIA.filter((p) => p.categoria !== "estudio" && p.disparador.tipo !== "cron");
  const [bodas, pedidos, configs, contadores] = await Promise.all([
    listarTodas(),
    listarPedidos().catch(() => [] as Pedido[]),
    configsHasta(new Date(Date.now() + 3 * 365 * 86_400_000)).catch(() => []),
    leerContadores(sumarDias(hoy, -400), hoy, ["apertura"]),
  ]);
  const retencion = new Map(configs.map((c) => [c.invitacion_id, c.retencion_hasta]));
  const aperturas = new Map<string, { total: number; semana: number }>();
  const haceSemana = sumarDias(hoy, -7);
  for (const f of contadores) {
    const a = aperturas.get(f.clave) ?? { total: 0, semana: 0 };
    a.total += f.n;
    if (f.dia >= haceSemana) a.semana += f.n;
    aperturas.set(f.clave, a);
  }

  for (const inv of bodas) {
    if (!inv.id || inv.estado === "archivada") continue;
    if (modo === "supabase" && SLUGS_DEMO.has(inv.slug)) continue; // las muestras del catálogo no tienen novios
    const b = inv as Boda;
    informe.bodas++;
    try {
      const suyos = pedidos.filter((p) => p.invitacion_id === b.id);
      // Cancelada: todos sus pedidos devueltos, anulados o en disputa. No se le escribe más.
      if (suyos.length && suyos.every((p) => ["reembolsado", "anulado", "disputado"].includes(p.estado_pago))) {
        anota("cancelada");
        continue;
      }
      const para = await destinatarios(b.id, b.slug, suyos);
      if (!para.length) continue;
      const c = await contextoDe(b, hoy, { pedidos: suyos, retencion: retencion.get(b.id) ?? null, aperturas: aperturas.get(b.slug) ?? { total: 0, semana: 0 } });
      const candidatos = pasos.flatMap((paso) => {
        const t = toca(paso, c, hoy, para.length > 0);
        return t ? para.map((email) => ({ paso, email, margen: t.margen, clave: claveDe(paso, b.id, email, t.periodo) })) : [];
      });
      // Con 1 correo por persona y día, primero lo que caduca antes (la víspera
      // tiene ventana 0; el resumen semanal puede esperar a mañana).
      candidatos.sort((x, y) => x.margen - y.margen);
      if (!candidatos.length) continue;
      const previos = await leerEnvios(candidatos.map((x) => x.clave));
      for (const { paso, email, clave } of candidatos) {
        const previo = previos.get(clave);
        if (previo && ["enviado", "buzon", "omitido"].includes(previo.estado)) continue;
        // Un evento (publicada, bienvenida) no tiene ventana: si el límite diario
        // lo aplazó, caduca a los 3 días. «Ya está publicada» meses después, no.
        if (previo && paso.disparador.tipo === "evento" && previo.estado !== "pendiente" && diasEntre(diaMadrid(new Date(previo.creado)), hoy) > 3) {
          await guardarEnvio({ ...previo, estado: "omitido", error: `caducado (${previo.estado})`, carga: null });
          anota("caducado");
          continue;
        }
        informe.revisados++;
        if (arranque && paso.disparador.tipo === "evento") {
          await omitir({ clave, correo: paso.id, categoria: paso.categoria, email, invitacion_id: b.id, slug: b.slug });
          anota("omitido-arranque");
          continue;
        }
        const datos: DatosCorreo = {
          pareja: { a: b.pareja.a, b: b.pareja.b },
          fecha: c.ctx.fecha,
          slug: b.slug,
          enlaces: enlacesBoda(b.slug, email),
          diasParaBoda: c.ctx.diasParaBoda,
          codigoAmigos: process.env.CORREOS_CODIGO_AMIGOS || null,
          cifras: c.cifras,
          pendientes: { datos: !c.ctx.datosCompletos, diseno: !c.ctx.disenoAprobado },
          recuerdo: c.recuerdo,
        };
        anota(await enviarPaso(paso, email, datos, clave, { id: b.id, slug: b.slug }, hoy));
      }
    } catch (e) {
      console.error("[correos.cronNovios]", b.slug, e);
      anota("error");
    }
  }
  if (arranque) await omitir({ clave: "__inicio__", correo: "__inicio__", categoria: "estudio", email: "-", invitacion_id: null, slug: null });
  informe.reintentos = await reintentarFallidos(hoy);
  return informe;
}

// ─────────────────────────────────────────────────────────── cron del estudio

export async function cronEstudio(hoy = diaMadrid()): Promise<{ diario: string; semanal: string | null }> {
  const para = emailsEstudio();
  const res = { diario: "sin-destinatario", semanal: null as string | null };
  // Las huellas (hashes de visitante y sales) solo sirven el mismo día: se
  // borra todo lo anterior a hoy (vivían como mucho ~31 h).
  await limpiarHuellas(hoy).catch((e) => console.error("[correos.limpiarHuellas]", e));
  // Plazos de conservación (E3): estadísticas 25 meses (guía AEPD de medición
  // de audiencia, 2024) y registro de envíos 36 meses (idempotencia de toda la
  // vida de una boda: reserva → aniversario).
  await purgarContadores(sumarDias(hoy, -760)).catch((e) => console.error("[correos.purgarContadores]", e));
  await purgarEnvios(sumarDias(hoy, -1095)).catch((e) => console.error("[correos.purgarEnvios]", e));
  if (!para.length) return res;

  const diario = await datosEstudio(1, hoy);
  if (huboActividad(diario.actual)) {
    const paso = pasoDe("estudio-diario");
    for (const email of para) res.diario = await enviarPaso(paso, email, datosParaEstudio(diario.datos), `estudio-diario:${hoy}:${email}`, { id: null, slug: null });
  } else res.diario = "sin-actividad";

  if (esLunes(hoy)) {
    const semana = await datosEstudio(7, hoy);
    const paso = pasoDe("estudio-semanal");
    for (const email of para) res.semanal = await enviarPaso(paso, email, datosParaEstudio(semana.datos), `estudio-semanal:${hoy}:${email}`, { id: null, slug: null });
  }
  return res;
}
