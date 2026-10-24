import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { resumenDiario } from "@/lib/avisos/avisar";

/**
 * GET /api/avisos/resumen — el resumen diario de Avisos.
 *
 * Lo lanza el cron de Vercel (`app/vercel.json`) cada mañana con
 * `Authorization: Bearer <CRON_SECRET>`. Por cada boda junta en un correo
 * los avisos de tipo «Resumen diario». Idempotente.
 */
export const maxDuration = 300;

function autorizado(peticion: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  const dada = Buffer.from(peticion.headers.get("authorization") ?? "");
  const esperada = Buffer.from(`Bearer ${secreto}`);
  return dada.length === esperada.length && timingSafeEqual(dada, esperada);
}

export async function GET(peticion: NextRequest) {
  if (!autorizado(peticion)) return NextResponse.json({ error: "Sin acceso" }, { status: 401 });
  const r = await resumenDiario();
  return NextResponse.json({ ok: true, ...r });
}
