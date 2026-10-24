import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { actualizarConfig, borrarTodoDe, configsHasta } from "@/lib/momentos/datos";
import { AVISO_BORRADO_DIAS } from "@/lib/momentos/planes";

/**
 * GET /api/momentos/limpieza — el borrado automático de verdad.
 *
 * Lo lanza el cron diario de Vercel (`app/vercel.json`) con
 * `Authorization: Bearer <CRON_SECRET>`. Hace dos cosas:
 *   1. Bodas con `retencion_hasta` vencido: borra los archivos del bucket y
 *      las filas de `momentos`, y cierra el álbum (activo = false).
 *   2. Bodas a las que les quedan ≤ 30 días: marca `aviso_borrado` (el panel
 *      lo enseña y es el gancho para el correo de aviso).
 * Idempotente: si se corta a medias, la siguiente pasada sigue.
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

  const ahora = new Date();
  const caducadas = await configsHasta(ahora);
  let momentos = 0;
  for (const c of caducadas) {
    momentos += await borrarTodoDe(c.invitacion_id);
    if (c.activo || c.mensaje_fijado) {
      await actualizarConfig(c.invitacion_id, { activo: false, subidas_abiertas: false, mensaje_fijado: null });
    }
  }

  const pronto = new Date(ahora.getTime() + AVISO_BORRADO_DIAS * 86_400_000);
  const porAvisar = (await configsHasta(pronto)).filter(
    (c) => !c.aviso_borrado && c.retencion_hasta && new Date(c.retencion_hasta) > ahora,
  );
  for (const c of porAvisar) {
    await actualizarConfig(c.invitacion_id, { aviso_borrado: ahora.toISOString() });
  }

  return NextResponse.json(
    { bodasBorradas: caducadas.length, momentosBorrados: momentos, avisos: porAvisar.length },
    { headers: { "cache-control": "no-store" } },
  );
}
