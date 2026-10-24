import { NextResponse, type NextRequest } from "next/server";
import { bodaDeSuscripcion, listarAvisos } from "@/lib/avisos/datos";

/**
 * POST /api/avisos/ultimo { endpoint } — lo pide el service worker al
 * recibir un push sin carga útil. Solo responde a una suscripción que
 * conocemos y solo con el título del último aviso de SU boda (el endpoint es
 * un secreto largo que solo tiene ese navegador).
 */
export async function POST(peticion: NextRequest) {
  let endpoint = "";
  try {
    endpoint = String((await peticion.json())?.endpoint ?? "").slice(0, 900);
  } catch {
    return NextResponse.json({}, { status: 400 });
  }
  if (!/^https:\/\//.test(endpoint)) return NextResponse.json({}, { status: 400 });
  const boda = await bodaDeSuscripcion(endpoint);
  if (!boda) return NextResponse.json({}, { status: 404 });
  const [a] = await listarAvisos(boda, 1);
  if (!a) return NextResponse.json({});
  return NextResponse.json(
    { titulo: a.titulo, detalle: a.detalle ?? "", enlace: a.enlace ?? "/panel" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
