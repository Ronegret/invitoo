import { downloadZip } from "client-zip";
import type { ArchivoZip } from "@/lib/momentos/acciones-control";

/**
 * «Descargar todo»: el ZIP se arma EN EL NAVEGADOR con client-zip (MIT) a
 * partir de URLs firmadas. Ni un byte pasa por Vercel.
 *
 *  · Chrome/Edge de escritorio: se elige dónde guardar y el ZIP se escribe
 *    en streaming, sin cargarlo en memoria (un solo archivo, sea del tamaño
 *    que sea).
 *  · El resto (Safari, Firefox, móviles): por lotes de ~1,5 GB, cada lote
 *    un ZIP («parte 1 de 3»), porque se arma en memoria.
 */

const LOTE_BYTES = 1.5 * 1024 * 1024 * 1024;

type Progreso = (texto: string) => void;

type Guardador = (opciones: { suggestedName: string; types?: unknown[] }) => Promise<{
  createWritable: () => Promise<WritableStream<Uint8Array>>;
}>;

async function* entradas(
  archivos: ArchivoZip[],
  mensajes: string | null,
  progreso: Progreso,
  base: number,
  total: number,
  album: string | null = null,
) {
  if (album) yield { name: "abrid-aqui.html", input: album, lastModified: new Date() };
  if (mensajes) yield { name: "mensajes.txt", input: mensajes, lastModified: new Date() };
  let i = 0;
  for (const a of archivos) {
    i++;
    progreso(`Descargando ${base + i} de ${total}…`);
    try {
      const r = await fetch(a.url);
      if (!r.ok) continue;
      yield { name: a.nombre, input: r };
    } catch {
      // Una que falle no tumba el ZIP entero.
    }
  }
}

function lotes(archivos: ArchivoZip[]) {
  const salida: ArchivoZip[][] = [[]];
  let peso = 0;
  for (const a of archivos) {
    if (peso + a.bytes > LOTE_BYTES && salida[salida.length - 1].length) {
      salida.push([]);
      peso = 0;
    }
    salida[salida.length - 1].push(a);
    peso += a.bytes;
  }
  return salida;
}

export async function descargarZip(
  archivos: ArchivoZip[],
  mensajes: string,
  carpeta: string,
  progreso: Progreso,
  /** `abrid-aqui.html`: el álbum con los pies, para verlo sin conexión. */
  album: string | null = null,
): Promise<void> {
  const total = archivos.length;
  const guardar = (window as unknown as { showSaveFilePicker?: Guardador }).showSaveFilePicker;
  if (guardar) {
    let destino: WritableStream<Uint8Array> | null = null;
    try {
      const h = await guardar({ suggestedName: `${carpeta}.zip` });
      destino = await h.createWritable();
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
      destino = null;
    }
    if (destino) {
      const cuerpo = downloadZip(entradas(archivos, mensajes || null, progreso, 0, total, album)).body;
      if (cuerpo) {
        await cuerpo.pipeTo(destino);
        progreso(`Listo: ${total} archivos.`);
        return;
      }
    }
  }
  const partes = lotes(archivos);
  let hechos = 0;
  for (let i = 0; i < partes.length; i++) {
    const nombre = partes.length > 1 ? `${carpeta}-parte-${i + 1}-de-${partes.length}.zip` : `${carpeta}.zip`;
    const blob = await downloadZip(entradas(partes[i], i === 0 ? mensajes || null : null, progreso, hechos, total, i === 0 ? album : null)).blob();
    hechos += partes[i].length;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  progreso(`Listo: ${total} archivos${partes.length > 1 ? ` en ${partes.length} partes` : ""}.`);
}
