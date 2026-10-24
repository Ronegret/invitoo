import { stat } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { escribirLocal, firmaLocalValida, leerLocal, modoAlmacen, archivoLocal } from "@/lib/momentos/almacen";
import { COMPRESION } from "@/lib/momentos/planes";

/**
 * El «Storage» de desarrollo: `app/.momentos-local/`.
 *
 *   PUT /api/momentos/local/<ruta>?op=subir&exp=…&f=…   (lo que hace Storage con la URL firmada)
 *   GET /api/momentos/local/<ruta>?op=leer&exp=…&f=…    (URL firmada de lectura, con Range)
 *
 * Solo existe en modo local: con Supabase configurado responde 404.
 */

type Ctx = { params: Promise<{ ruta: string[] }> };

const TIPOS: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

async function rutaFirmada(peticion: NextRequest, ctx: Ctx, op: "subir" | "leer") {
  if (modoAlmacen() !== "local") return null;
  const ruta = (await ctx.params).ruta.join("/");
  const q = peticion.nextUrl.searchParams;
  if (q.get("op") !== op) return null;
  return firmaLocalValida(op, ruta, Number(q.get("exp")), q.get("f") ?? "") ? ruta : null;
}

export async function PUT(peticion: NextRequest, ctx: Ctx) {
  const ruta = await rutaFirmada(peticion, ctx, "subir");
  if (!ruta) return NextResponse.json({ error: "Firma no válida" }, { status: 403 });
  if (!peticion.body) return NextResponse.json({ error: "Vacío" }, { status: 400 });
  const max = ruta.includes("/v/") ? COMPRESION.maxBytesVideo : COMPRESION.maxBytesFoto;
  try {
    const bytes = await escribirLocal(ruta, peticion.body, max);
    return NextResponse.json({ Key: ruta, bytes });
  } catch {
    return NextResponse.json({ error: "Demasiado grande" }, { status: 413 });
  }
}

export async function GET(peticion: NextRequest, ctx: Ctx) {
  const ruta = await rutaFirmada(peticion, ctx, "leer");
  if (!ruta) return new NextResponse("Firma no válida", { status: 403 });
  let tam: number;
  try {
    tam = (await stat(archivoLocal(ruta))).size;
  } catch {
    return new NextResponse("No está", { status: 404 });
  }
  const tipo = TIPOS[ruta.split(".").pop() ?? ""] ?? "application/octet-stream";
  const cabeceras = {
    "content-type": tipo,
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=3600",
  };
  // Safari no reproduce un vídeo sin Range.
  const rango = /^bytes=(\d*)-(\d*)$/.exec(peticion.headers.get("range") ?? "");
  if (rango && tam > 0) {
    const inicio = rango[1] ? Number(rango[1]) : Math.max(0, tam - Number(rango[2]));
    const fin = rango[1] && rango[2] ? Math.min(Number(rango[2]), tam - 1) : tam - 1;
    if (inicio > fin || inicio >= tam) {
      return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${tam}` } });
    }
    return new NextResponse(leerLocal(ruta, inicio, fin), {
      status: 206,
      headers: { ...cabeceras, "content-range": `bytes ${inicio}-${fin}/${tam}`, "content-length": String(fin - inicio + 1) },
    });
  }
  return new NextResponse(leerLocal(ruta), { headers: { ...cabeceras, "content-length": String(tam) } });
}
