import { after, NextResponse, type NextRequest } from "next/server";
import { mediaPorHora } from "@/lib/correos/metricas";
import { programar } from "@/lib/correos/programar";
import { registrarBaliza } from "@/lib/visitas/registrar";
import type { Baliza } from "@/lib/visitas/tipos";

/**
 * POST /api/visitas — la baliza del script de medición (`lib/visitas/Medir.tsx`).
 *
 * Sin cookies y sin guardar la IP: la IP y el navegador solo entran en el
 * hash del visitante del día (con una sal que se borra a los dos días).
 * Siempre responde 204, también si se descarta (bots, rutas privadas, otro
 * origen): el navegador no tiene nada que esperar.
 */

const NADA = () => new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
const MAX_CUERPO = 2048;

/** Lee el cuerpo hasta `max` bytes; si hay más, null (no se carga entero en memoria). */
async function leerCuerpo(peticion: NextRequest, max: number): Promise<string | null> {
  const largo = Number(peticion.headers.get("content-length"));
  if (Number.isFinite(largo) && largo > max) return null;
  if (!peticion.body) return "";
  const lector = peticion.body.getReader();
  const trozos: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await lector.cancel().catch(() => {});
      return null;
    }
    trozos.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(trozos));
}

/**
 * Límite de ritmo por instancia (sin dependencias ni almacén): 60 balizas por
 * minuto por conexión. La clave es la IP, solo en la memoria del proceso y
 * durante un minuto; nunca se escribe en la base ni en logs. No es infalible entre instancias de
 * Vercel, pero corta el inflado burdo y el crecimiento de filas.
 */
const RITMO = { ventana: 60_000, max: 60 };
const g = globalThis as { __invitooRitmoVisitas?: Map<string, { n: number; desde: number }> };
function dentroDelRitmo(ip: string): boolean {
  const m = (g.__invitooRitmoVisitas ??= new Map());
  const ahora = Date.now();
  if (m.size > 5000) for (const [k, v] of m) if (ahora - v.desde > RITMO.ventana) m.delete(k);
  const k = ip || "?";
  const e = m.get(k);
  if (!e || ahora - e.desde > RITMO.ventana) {
    m.set(k, { n: 1, desde: ahora });
    return true;
  }
  e.n++;
  return e.n <= RITMO.max;
}
const TEXTO = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);

function leer(crudo: string): Baliza | null {
  if (crudo.length > 2000) return null;
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(crudo) as Record<string, unknown>;
  } catch {
    return null;
  }
  const r = TEXTO(j.r, 300);
  if (!r) return null;
  if (j.t === "v") return { t: "v", r, ref: TEXTO(j.ref, 300), utm: TEXTO(j.utm, 60), s: TEXTO(j.s, 80), e: j.e === 1 ? 1 : undefined };
  if (j.t === "c" && (j.k === "reservar" || j.k === "whatsapp")) return { t: "c", k: j.k, r };
  return null;
}

export async function POST(peticion: NextRequest) {
  // Solo desde nuestras páginas: que nadie infle las cifras desde fuera.
  const sitio = peticion.headers.get("sec-fetch-site");
  if (sitio && sitio !== "same-origin") return NADA();
  const origen = peticion.headers.get("origin");
  const host = peticion.headers.get("host") ?? "";
  if (origen) {
    try {
      if (new URL(origen).host !== host) return NADA();
    } catch {
      return NADA();
    }
  }
  const ip = (peticion.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || peticion.headers.get("x-real-ip") || "";
  if (!dentroDelRitmo(ip)) return NADA();
  const crudo = await leerCuerpo(peticion, MAX_CUERPO).catch(() => null);
  const b = crudo ? leer(crudo) : null;
  if (!b) return NADA();

  const navegador = (peticion.headers.get("user-agent") ?? "").slice(0, 300);
  const { pico } = await registrarBaliza(b, { ip, navegador, propio: host.replace(/^www\./, "").split(":")[0] }).catch((e) => {
    console.error("[api.visitas]", e);
    return { pico: null };
  });
  if (pico) {
    after(async () => programar({ evento: "pico", vistas: pico, media: await mediaPorHora(), ruta: b.r }));
  }
  return NADA();
}
