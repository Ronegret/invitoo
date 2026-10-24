/**
 * «En directo» en el navegador del invitado: preparar cada archivo antes de
 * subirlo, subirlo con progreso y reintento, y una cola en IndexedDB para que
 * nada se pierda si se va la wifi o se cierra la pestaña.
 *
 * Todo lo pesado ocurre en el móvil: tres versiones de cada foto (2048 px,
 * 1280 px y 480 px). Nada de transformaciones de imagen en el servidor.
 *
 * Solo navegador. Sin dependencias.
 */

import { COMPRESION } from "./planes";

// ────────────────────────────────────────────────────────── dispositivo

const CLAVE_DISPOSITIVO = "invitoo:dispositivo";

/** Un id aleatorio por navegador. Solo sirve para el antispam y para «lo mío». */
export function idDispositivo(): string {
  try {
    const previo = localStorage.getItem(CLAVE_DISPOSITIVO);
    if (previo && /^[a-z0-9]{16,40}$/.test(previo)) return previo;
  } catch {}
  const nuevo = [...crypto.getRandomValues(new Uint8Array(12))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  try {
    localStorage.setItem(CLAVE_DISPOSITIVO, nuevo);
  } catch {}
  return nuevo;
}

export function leerLocal(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}
export function guardarLocal(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {}
}

// ───────────────────────────────────────────────────────────────── fotos

export class ArchivoNoValido extends Error {}

let webpCodifica: Promise<boolean> | null = null;
/** Safari antiguo no codifica WebP en canvas (devuelve PNG): entonces, JPEG. */
function puedeWebp() {
  webpCodifica ??= new Promise((ok) => {
    const c = document.createElement("canvas");
    c.width = c.height = 2;
    c.toBlob((b) => ok(b?.type === "image/webp"), "image/webp", 0.8);
  });
  return webpCodifica;
}

async function decodificar(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Algunos navegadores no traen la opción: se prueba con <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function lienzo(origen: CanvasImageSource, ancho: number, alto: number, lado: number) {
  const escala = Math.min(1, lado / Math.max(ancho, alto));
  const w = Math.max(1, Math.round(ancho * escala));
  const h = Math.max(1, Math.round(alto * escala));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new ArchivoNoValido("No se puede preparar la foto en este móvil.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(origen, 0, 0, w, h);
  return c;
}

function aBlob(c: HTMLCanvasElement, tipo: string, calidad: number) {
  return new Promise<Blob>((ok, mal) =>
    c.toBlob((b) => (b ? ok(b) : mal(new ArchivoNoValido("No se ha podido comprimir la foto."))), tipo, calidad),
  );
}

export type FotoPreparada = {
  tipo: "foto";
  mime: string;
  grande: Blob;
  pantalla: Blob;
  miniatura: Blob;
  ancho: number;
  alto: number;
};

const HEIC = /\.(heic|heif)$/i;

export async function prepararFoto(file: File): Promise<FotoPreparada> {
  // El iPhone convierte HEIC a JPEG al elegir desde <input>; si llega HEIC
  // sin convertir (Android, escritorio), casi nadie lo sabe abrir.
  let origen: ImageBitmap | HTMLImageElement;
  try {
    origen = await decodificar(file);
  } catch {
    if (HEIC.test(file.name) || /heic|heif/i.test(file.type)) {
      throw new ArchivoNoValido(
        "Esta foto está en formato HEIC y aquí no se puede abrir. En el iPhone: Ajustes › Cámara › Formatos › «Más compatible».",
      );
    }
    throw new ArchivoNoValido("Esta foto no se puede abrir. Prueba con otra.");
  }
  const ancho = "naturalWidth" in origen ? origen.naturalWidth : origen.width;
  const alto = "naturalHeight" in origen ? origen.naturalHeight : origen.height;
  const mime = (await puedeWebp()) ? "image/webp" : "image/jpeg";
  const g = lienzo(origen, ancho, alto, COMPRESION.ladoLargo);
  const [grande, pantalla, miniatura] = await Promise.all([
    aBlob(g, mime, COMPRESION.calidad),
    aBlob(lienzo(g, g.width, g.height, COMPRESION.ladoPantalla), mime, COMPRESION.calidadPantalla),
    aBlob(lienzo(g, g.width, g.height, COMPRESION.miniatura), mime, COMPRESION.calidadMiniatura),
  ]);
  if ("close" in origen) origen.close();
  if (grande.size > COMPRESION.maxBytesFoto) throw new ArchivoNoValido("Esta foto pesa demasiado.");
  return { tipo: "foto", mime, grande, pantalla, miniatura, ancho: g.width, alto: g.height };
}

// ──────────────────────────────────────────────────────────────── vídeo

export type VideoPreparado = {
  tipo: "video";
  mime: string;
  grande: Blob;
  miniatura: Blob | null;
  ancho: number;
  alto: number;
  duracion: number;
};

const MIME_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];

/** Comprueba duración y peso con un <video> oculto y saca un fotograma de portada. */
export async function prepararVideo(file: File, maxSegundos: number): Promise<VideoPreparado> {
  const mime = MIME_VIDEO.includes(file.type) ? file.type : /\.mov$/i.test(file.name) ? "video/quicktime" : "video/mp4";
  if (file.size > COMPRESION.maxBytesVideo) {
    throw new ArchivoNoValido(
      `Este vídeo pesa ${Math.round(file.size / 1048576)} MB y caben ${Math.round(COMPRESION.maxBytesVideo / 1048576)} MB. Grábalo más corto o en 1080p.`,
    );
  }
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "metadata";
  v.src = url;
  try {
    await new Promise<void>((ok, mal) => {
      const t = window.setTimeout(() => mal(new ArchivoNoValido("Este vídeo no se puede abrir.")), 12000);
      v.onloadedmetadata = () => {
        window.clearTimeout(t);
        ok();
      };
      v.onerror = () => {
        window.clearTimeout(t);
        mal(new ArchivoNoValido("Este vídeo no se puede abrir. Prueba con otro."));
      };
    });
    const duracion = v.duration;
    if (!Number.isFinite(duracion) || duracion <= 0) throw new ArchivoNoValido("Este vídeo no se puede abrir.");
    if (duracion > maxSegundos + 0.5) {
      throw new ArchivoNoValido(`Este vídeo dura ${Math.round(duracion)} s. Caben vídeos de ${maxSegundos} s como mucho.`);
    }
    // El fotograma de portada. Si el móvil no deja, sin portada y ya está.
    let miniatura: Blob | null = null;
    try {
      await new Promise<void>((ok, mal) => {
        const t = window.setTimeout(() => mal(new Error("sin fotograma")), 5000);
        v.onseeked = () => {
          window.clearTimeout(t);
          ok();
        };
        v.currentTime = Math.min(0.6, duracion / 2);
      });
      const c = lienzo(v, v.videoWidth, v.videoHeight, COMPRESION.miniatura);
      miniatura = await aBlob(c, (await puedeWebp()) ? "image/webp" : "image/jpeg", COMPRESION.calidadMiniatura);
    } catch {}
    return { tipo: "video", mime, grande: file, miniatura, ancho: v.videoWidth, alto: v.videoHeight, duracion };
  } finally {
    v.removeAttribute("src");
    v.load();
    URL.revokeObjectURL(url);
  }
}

// ──────────────────────────────────────────────────────────────── subida

export class ErrorRed extends Error {}

/** PUT con progreso (XHR: `fetch` todavía no da progreso de subida). */
export function subir(
  url: string,
  cuerpo: Blob,
  cabeceras: Record<string, string>,
  progreso: (fraccion: number) => void,
  senal?: AbortSignal,
): Promise<void> {
  return new Promise((ok, mal) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    for (const [k, v] of Object.entries(cabeceras)) x.setRequestHeader(k, v);
    x.upload.onprogress = (e) => e.lengthComputable && progreso(e.loaded / e.total);
    x.onload = () => {
      if (x.status >= 200 && x.status < 300) ok();
      else if (x.status >= 500 || x.status === 408 || x.status === 429) mal(new ErrorRed(`HTTP ${x.status}`));
      else mal(new Error(`HTTP ${x.status}`));
    };
    x.onerror = () => mal(new ErrorRed("red"));
    x.ontimeout = () => mal(new ErrorRed("tiempo"));
    x.timeout = 5 * 60_000;
    senal?.addEventListener("abort", () => x.abort());
    x.send(cuerpo);
  });
}

/** Reintenta lo que falla por red: 1 s, 3 s, 8 s. */
export async function conReintento<T>(fn: () => Promise<T>, intentos = 4): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = e;
      if (!(e instanceof ErrorRed) && !(e instanceof TypeError)) throw e;
      if (!navigator.onLine) await esperarRed();
      else await new Promise((r) => setTimeout(r, [1000, 3000, 8000, 15000][i] ?? 15000));
    }
  }
  throw ultimo;
}

function esperarRed() {
  return new Promise<void>((ok) => {
    if (navigator.onLine) return ok();
    const f = () => {
      window.removeEventListener("online", f);
      ok();
    };
    window.addEventListener("online", f);
    setTimeout(f, 30_000);
  });
}

// ─────────────────────────────────────────────────────────── cola (IndexedDB)

/**
 * La cola de subidas. Cada archivo ya preparado se guarda aquí ANTES de
 * subirlo y se borra al confirmarse. Si se va la wifi del salón o el
 * invitado cierra la pestaña, al volver se retoma solo.
 */
export type EnCola = {
  clave: string;
  slug: string;
  nombre: string;
  creado: number;
  preparado: FotoPreparada | VideoPreparado;
  /** El pie de foto opcional (por foto o por lote): viaja con ella en la cola. */
  mensaje?: string | null;
};

const BD = "invitoo-momentos";
const ALMACEN = "cola";

function abrirBd(): Promise<IDBDatabase | null> {
  return new Promise((ok) => {
    try {
      const r = indexedDB.open(BD, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ALMACEN, { keyPath: "clave" });
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(null);
    } catch {
      ok(null);
    }
  });
}

async function operar<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const bd = await abrirBd();
  if (!bd) return null;
  return new Promise((ok) => {
    try {
      const tx = bd.transaction(ALMACEN, modo);
      const r = fn(tx.objectStore(ALMACEN));
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(null);
      tx.oncomplete = () => bd.close();
    } catch {
      ok(null);
    }
  });
}

export const cola = {
  poner: (x: EnCola) => operar("readwrite", (s) => s.put(x)),
  quitar: (clave: string) => operar("readwrite", (s) => s.delete(clave)),
  async todas(slug: string): Promise<EnCola[]> {
    const xs = ((await operar("readonly", (s) => s.getAll())) ?? []) as EnCola[];
    // Lo de hace más de 3 días ya no se retoma.
    const viejo = Date.now() - 3 * 86_400_000;
    for (const x of xs) if (x.creado < viejo) void cola.quitar(x.clave);
    return xs.filter((x) => x.slug === slug && x.creado >= viejo).sort((a, b) => a.creado - b.creado);
  },
};
