import "server-only";

import { DEMO } from "@/data/demo";
import { partesMadrid } from "@/lib/fecha";
import { esNuevoHoy, sumar } from "./datos";
import { CLICS, RUTAS_FUERA, type Baliza, type TipoContador } from "./tipos";

/**
 * La entrada de la medición. La llama `POST /api/visitas` (el script del
 * navegador) y, para lo que pasa en el servidor, `contar()` desde los
 * disparos por evento (checkout, RSVP, fotos). Nunca lanza.
 */

const dos = (n: number) => String(n).padStart(2, "0");

/** yyyy-mm-dd en Madrid. */
export function diaMadrid(d: Date = new Date()): string {
  const p = partesMadrid(d);
  return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}`;
}
export function horaMadrid(d: Date = new Date()): string {
  const p = partesMadrid(d);
  return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}T${dos(p.hora)}`;
}
/** Suma días a un yyyy-mm-dd. */
export function sumarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const x = new Date(Date.UTC(a, m - 1, d + n));
  return `${x.getUTCFullYear()}-${dos(x.getUTCMonth() + 1)}-${dos(x.getUTCDate())}`;
}
/** Días de `a` a `b` (b − a). */
export function diasEntre(a: string, b: string): number {
  const f = (s: string) => {
    const [y, m, d] = s.slice(0, 10).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((f(b) - f(a)) / 86_400_000);
}

/** Un contador desde el servidor. `void contar(...)`: no espera ni lanza. */
export async function contar(tipo: TipoContador, clave = "*", n = 1): Promise<void> {
  try {
    await sumar(diaMadrid(), tipo, clave, n);
  } catch (e) {
    console.error("[visitas.contar]", e);
  }
}

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|headless|lighthouse|pingdom|monitor|vercel/i;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Una ruta razonable: sin espacios, comillas ni nada raro (cada ruta distinta es una fila). */
const RUTA = /^\/[A-Za-z0-9\-._~/%]{0,119}$/;
/** Un nombre de host válido (el referer lo controla quien hace la petición). */
const HOST = /^(?=.{1,60}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
const SLUGS_DEMO = new Map(Object.values(DEMO).map((d) => [d.slug, d.plantilla as string]));

/** Dominio del referer, sin www. Vacío si es nuestro o no se entiende. */
function origenDe(ref: string | undefined, utm: string | undefined, propio: string): string {
  const u = utm?.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
  if (u) return `utm:${u}`;
  if (!ref) return "directo";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || host === propio || host === "localhost" || host === "127.0.0.1") return "interno";
    // Agrupar los conocidos: los dominios de Google por país, Instagram en móvil…
    if (/(^|\.)google\./.test(host)) return "google";
    if (/(^|\.)(instagram|l\.instagram)\.com$/.test(host)) return "instagram";
    if (/(^|\.)(facebook|fb|m\.facebook|l\.facebook)\.com$/.test(host)) return "facebook";
    if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(host)) return "x";
    if (/(^|\.)pinterest\./.test(host)) return "pinterest";
    if (/(^|\.)tiktok\.com$/.test(host)) return "tiktok";
    if (/(^|\.)bing\.com$/.test(host)) return "bing";
    return HOST.test(host) ? host : "otro";
  } catch {
    return "directo";
  }
}

/** Umbral de vistas en una hora para el aviso de pico (`VISITAS_PICO`, 40 por defecto). */
export function umbralPico() {
  const n = Number(process.env.VISITAS_PICO);
  return Number.isFinite(n) && n >= 5 ? Math.round(n) : 40;
}

export type Peticion = { ip: string; navegador: string; propio: string };

/**
 * Registra una baliza del navegador. Devuelve la vista de la hora si se ha
 * cruzado justo el umbral de pico (para que la ruta dispare la alerta).
 */
export async function registrarBaliza(b: Baliza, p: Peticion): Promise<{ pico: number | null }> {
  if (!p.navegador || BOT.test(p.navegador)) return { pico: null };
  const ruta = (b.r || "/").split(/[?#]/)[0].slice(0, 120);
  if (!RUTA.test(ruta) || RUTAS_FUERA.test(ruta)) return { pico: null };
  const dia = diaMadrid();

  if (b.t === "c") {
    if (CLICS.includes(b.k)) await sumar(dia, "clic", b.k);
    return { pico: null };
  }

  // Invitación de una pareja: solo cuenta como apertura (no es tráfico de la web).
  const slug = b.s && b.s.length <= 80 && SLUG.test(b.s) ? b.s : null;
  if (slug && !SLUGS_DEMO.has(slug)) {
    await sumar(dia, "apertura", slug);
    return { pico: null };
  }

  const tareas: Promise<unknown>[] = [
    sumar(dia, "vistas"),
    sumar(dia, "ruta", ruta),
  ];
  if (b.e === 1) tareas.push(sumar(dia, "origen", origenDe(b.ref, b.utm, p.propio)));
  // Plantillas: la demo de una plantilla (/i/<demo>) o su ficha (?plantilla=…).
  const plantilla = slug ? SLUGS_DEMO.get(slug) : null;
  if (plantilla) tareas.push(sumar(dia, "plantilla", plantilla));
  tareas.push(esNuevoHoy(dia, p.ip, p.navegador).then((nuevo) => (nuevo ? sumar(dia, "visitantes") : 0)));
  const hora = sumar(dia, "hora", horaMadrid());
  await Promise.all(tareas);
  const enHora = await hora;
  return { pico: enHora === umbralPico() ? enHora : null };
}
