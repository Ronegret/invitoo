import { NextResponse, type NextRequest } from "next/server";
import { cronAutorizado, hoyDe } from "@/lib/correos/cron";
import { cronNovios } from "@/lib/correos/motor";

/**
 * GET /api/correos/novios — la secuencia de cada boda (cron diario, ~09:15
 * Madrid). Idempotente: se puede lanzar dos veces el mismo día sin duplicar.
 * `?hoy=yyyy-mm-dd` simula otro día (para probar la cuenta atrás).
 */
export const maxDuration = 300;

export async function GET(peticion: NextRequest) {
  if (!cronAutorizado(peticion.headers)) return NextResponse.json({ error: "Sin acceso" }, { status: 401 });
  const informe = await cronNovios(hoyDe(peticion.url));
  return NextResponse.json({ ok: true, ...informe });
}
