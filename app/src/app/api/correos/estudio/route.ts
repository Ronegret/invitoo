import { NextResponse, type NextRequest } from "next/server";
import { cronAutorizado, hoyDe } from "@/lib/correos/cron";
import { cronEstudio } from "@/lib/correos/motor";

/**
 * GET /api/correos/estudio — el resumen de Rodrigo (cron diario, a primera
 * hora): el diario si ayer hubo actividad y, los lunes, el semanal con
 * tendencias. También borra las huellas de visitante de días pasados.
 */
export const maxDuration = 120;

export async function GET(peticion: NextRequest) {
  if (!cronAutorizado(peticion.headers)) return NextResponse.json({ error: "Sin acceso" }, { status: 401 });
  const r = await cronEstudio(hoyDe(peticion.url));
  return NextResponse.json({ ok: true, ...r });
}
