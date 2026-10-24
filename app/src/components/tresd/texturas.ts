import {
  CanvasTexture,
  LinearSRGBColorSpace,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

/**
 * Las texturas de la papelería, todas procedurales: no se descarga ninguna
 * imagen. Se pintan una vez en un `<canvas>` (papel de algodón, lino, forro,
 * sombras) y se convierten en mapas de normales con un Sobel.
 *
 * Todo es determinista (semilla fija): el póster que sale del mismo render
 * coincide píxel a píxel con el primer fotograma del canvas.
 */

/* ───────────────────────── Azar con semilla y ruido ───────────────────────── */

export function azar(semilla = 1) {
  let s = semilla >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function hash(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Ruido de valor periódico (en `periodo` celdas), suave. */
export function ruido(x: number, y: number, periodo: number, s = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const m = (v: number) => ((v % periodo) + periodo) % periodo;
  const a = hash(m(xi), m(yi), s);
  const b = hash(m(xi + 1), m(yi), s);
  const c = hash(m(xi), m(yi + 1), s);
  const d = hash(m(xi + 1), m(yi + 1), s);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

/** fBm periódico: `octavas` capas de ruido, cada una al doble de frecuencia. */
export function fbm(u: number, v: number, base: number, octavas: number, s = 0) {
  let suma = 0;
  let amp = 0.5;
  let f = base;
  for (let o = 0; o < octavas; o++) {
    suma += amp * ruido(u * f, v * f, f, s + o * 17);
    f *= 2;
    amp *= 0.5;
  }
  return suma;
}

/* ───────────────────────── Lienzos ───────────────────────── */

export function lienzo(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  return { c, ctx };
}

function textura(c: HTMLCanvasElement, color: boolean, repetir = true): Texture {
  const t = new CanvasTexture(c);
  t.colorSpace = color ? SRGBColorSpace : NoColorSpace;
  if (repetir) t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/**
 * Altura (0–1, un valor por píxel) → mapa de normales en espacio tangente.
 * Sobel con borde periódico, así el mapa se puede repetir sin costura.
 */
export function alturaANormal(alt: Float32Array, w: number, h: number, fuerza: number, periodico = true) {
  const { c, ctx } = lienzo(w, h);
  const img = ctx.createImageData(w, h);
  const at = (x: number, y: number) => {
    if (periodico) {
      x = (x + w) % w;
      y = (y + h) % h;
    } else {
      x = Math.min(w - 1, Math.max(0, x));
      y = Math.min(h - 1, Math.max(0, y));
    }
    return alt[y * w + x];
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx =
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const dy =
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      // El lienzo va de arriba abajo y la v de la textura de abajo arriba.
      let nx = -dx * fuerza;
      let ny = dy * fuerza;
      let nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      const i = (y * w + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Lee un canvas en escala de grises (canal R) como alturas 0–1. */
export function leerAltura(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const alt = new Float32Array(c.width * c.height);
  for (let i = 0; i < alt.length; i++) alt[i] = d[i * 4] / 255;
  return alt;
}

/* ───────────────────────── Papel de algodón ───────────────────────── */

export type Papel = { detalle: Texture; normal: Texture; rugosidad: Texture };

let papelCache: Papel | null = null;

/**
 * Papel de algodón: un fieltro de manchas suaves (el «nube» de la pasta) y
 * miles de fibras cortas y curvas, unas que levantan y otras que se hunden.
 * `detalle` es casi blanco y se multiplica por el color del papel (así se
 * tiñe con cualquier hex); `normal` lleva el relieve.
 */
export function papelAlgodon(): Papel {
  if (papelCache) return papelCache;
  const N = 512;
  const r = azar(7);

  // 1 · Altura: fieltro + fibras.
  const { c: ca, ctx: xa } = lienzo(N);
  const img = xa.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N;
      const v = y / N;
      const nube = fbm(u, v, 6, 4, 3);
      const grano = hash(x, y, 9);
      const val = 0.5 + (nube - 0.5) * 0.55 + (grano - 0.5) * 0.12;
      const i = (y * N + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = val * 255;
      img.data[i + 3] = 255;
    }
  }
  xa.putImageData(img, 0, 0);
  // Las fibras, dibujadas tres veces desplazadas para que el mosaico case.
  xa.lineCap = "round";
  for (let k = 0; k < 1500; k++) {
    const x = r() * N;
    const y = r() * N;
    const ang = r() * Math.PI * 2;
    const largo = 6 + r() * 22;
    const curva = (r() - 0.5) * 10;
    const sube = r() > 0.42;
    xa.strokeStyle = sube ? `rgba(255,255,255,${0.1 + r() * 0.22})` : `rgba(0,0,0,${0.06 + r() * 0.14})`;
    xa.lineWidth = 0.5 + r() * 0.9;
    for (const [ox, oy] of [[0, 0], [-N, 0], [N, 0], [0, -N], [0, N]]) {
      const x0 = x + ox;
      const y0 = y + oy;
      const x1 = x0 + Math.cos(ang) * largo;
      const y1 = y0 + Math.sin(ang) * largo;
      xa.beginPath();
      xa.moveTo(x0, y0);
      xa.quadraticCurveTo((x0 + x1) / 2 - Math.sin(ang) * curva, (y0 + y1) / 2 + Math.cos(ang) * curva, x1, y1);
      xa.stroke();
    }
  }
  const alt = leerAltura(ca);
  const normal = textura(alturaANormal(alt, N, N, 1.6), false);

  // 2 · Detalle de color: casi blanco, con la nube y las fibras apenas.
  const { c: cd, ctx: xd } = lienzo(N);
  const di = xd.createImageData(N, N);
  for (let i = 0; i < alt.length; i++) {
    const v = 238 + (alt[i] - 0.5) * 30;
    di.data[i * 4] = v + 2;
    di.data[i * 4 + 1] = v + 1;
    di.data[i * 4 + 2] = v - 1;
    di.data[i * 4 + 3] = 255;
  }
  xd.putImageData(di, 0, 0);
  const detalle = textura(cd, true);

  // 3 · Rugosidad: el algodón es mate, las fibras que levantan, más.
  const { c: cr, ctx: xr } = lienzo(N);
  const ri = xr.createImageData(N, N);
  for (let i = 0; i < alt.length; i++) {
    const g = 215 + (alt[i] - 0.5) * 60;
    ri.data[i * 4] = 0;
    ri.data[i * 4 + 1] = g;
    ri.data[i * 4 + 2] = 0;
    ri.data[i * 4 + 3] = 255;
  }
  xr.putImageData(ri, 0, 0);
  const rugosidad = textura(cr, false);
  rugosidad.colorSpace = LinearSRGBColorSpace;

  papelCache = { detalle, normal, rugosidad };
  return papelCache;
}

/* ───────────────────────── Lino de la mesa ───────────────────────── */

let linoCache: { color: Texture; normal: Texture } | null = null;

/**
 * Lino lavado: tafetán (un hilo arriba, uno abajo) con hilos de grosor
 * irregular (los «slubs» del lino) y un poco de color en cada pasada.
 */
export function lino() {
  if (linoCache) return linoCache;
  const N = 512;
  const H = 32; // hilos por lado del mosaico
  const p = N / H;
  const r = azar(21);
  const grosorF = Array.from({ length: H }, () => 0.7 + r() * 0.5);
  const grosorC = Array.from({ length: H }, () => 0.7 + r() * 0.5);
  const tonoF = Array.from({ length: H }, () => (r() - 0.5) * 0.05);
  const tonoC = Array.from({ length: H }, () => (r() - 0.5) * 0.05);

  const alt = new Float32Array(N * N);
  const col = new Float32Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const fi = Math.floor(y / p);
      const ci = Math.floor(x / p);
      // Los hilos del lino no son rectos: ondulan un poco.
      const fy = (y % p) / p - 0.5 + 0.22 * (ruido(x / 29, fi * 1.7, N / 29, 11) - 0.5);
      const fx = (x % p) / p - 0.5 + 0.22 * (ruido(ci * 1.7, y / 31, N / 31, 12) - 0.5);
      // Arriba la trama o la urdimbre, como un damero.
      const arribaTrama = (fi + ci) % 2 === 0;
      // Slub: el grosor cambia a lo largo del hilo.
      const slubF = grosorF[fi] * (0.7 + 0.6 * ruido(x / 19, fi * 3.1, N / 19, 5));
      const slubC = grosorC[ci] * (0.7 + 0.6 * ruido(ci * 3.1, y / 23, N / 23, 6));
      const hiloF = Math.max(0, 1 - Math.pow(Math.abs(fy) / (0.5 * slubF), 2));
      const hiloC = Math.max(0, 1 - Math.pow(Math.abs(fx) / (0.5 * slubC), 2));
      // Cada hilo se arquea al pasar por encima del otro.
      const arcoF = Math.cos(fx * Math.PI);
      const arcoC = Math.cos(fy * Math.PI);
      const hF = hiloF * (arribaTrama ? 0.6 + 0.4 * arcoF : 0.3);
      const hC = hiloC * (arribaTrama ? 0.3 : 0.6 + 0.4 * arcoC);
      const h = Math.max(hF, hC);
      alt[y * N + x] = h;
      const tono = hF > hC ? tonoF[fi] : tonoC[ci];
      col[y * N + x] =
        0.9 + h * 0.08 + tono + (hash(x, y, 4) - 0.5) * 0.04;
    }
  }
  const normal = textura(alturaANormal(alt, N, N, 1.0), false);
  const { c, ctx } = lienzo(N);
  const img = ctx.createImageData(N, N);
  for (let i = 0; i < col.length; i++) {
    const v = Math.min(1, col[i]);
    img.data[i * 4] = 241 * v;
    img.data[i * 4 + 1] = 234 * v;
    img.data[i * 4 + 2] = 222 * v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  linoCache = { color: textura(c, true), normal };
  return linoCache;
}

/* ───────────────────────── Forro del sobre ───────────────────────── */

/**
 * Forro interior: papel de color con un moaré de líneas finas doradas y
 * un ligero brillo. Se tiñe con `color`.
 */
export function forro(color: string) {
  const N = 512;
  const { c, ctx } = lienzo(N);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, N, N);
  // Moaré: dos haces de ondas finas, casi paralelas.
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  for (let k = 0; k < 2; k++) {
    for (let y = -20; y < N + 20; y += 5) {
      ctx.beginPath();
      for (let x = 0; x <= N; x += 8) {
        const yy = y + Math.sin((x / N) * Math.PI * 2 * (k + 1) + y * 0.07) * (4 + k * 3);
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }
  // Una retícula de rombos en oro, como el forro de la papelería clásica.
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = "#c9a35a";
  ctx.lineWidth = 1.2;
  const paso = 64;
  for (let i = -N; i < N * 2; i += paso) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + N, N);
    ctx.moveTo(i, N);
    ctx.lineTo(i + N, 0);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return textura(c, true);
}

/* ───────────────────────── Sombra suave ───────────────────────── */

/**
 * Un rectángulo negro desenfocado sobre transparente: la sombra de
 * contacto, la que pega el objeto a la mesa. `borde` es el desenfoque en
 * fracción del lado.
 */
export function sombraSuave(ancho: number, alto: number, borde = 0.12) {
  const W = 256;
  const H = Math.round((W * alto) / ancho);
  const { c, ctx } = lienzo(W, H);
  const b = W * borde;
  ctx.filter = `blur(${b / 2.2}px)`;
  ctx.fillStyle = "#000";
  ctx.fillRect(b, b, W - 2 * b, H - 2 * b);
  ctx.filter = "none";
  return textura(c, false, false);
}

/* ───────────────────────── Tinta que empapa ───────────────────────── */

/**
 * Escribe con tinta en un lienzo: primero un halo muy suave (la tinta que
 * el algodón chupa por las fibras), después el trazo con algo de
 * transparencia y un segundo pase más oscuro en el centro del trazo.
 */
export function escribirTinta(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  fuente: string,
  color: string,
  escala = 1,
) {
  ctx.save();
  ctx.font = fuente;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.28;
  ctx.filter = `blur(${1.6 * escala}px)`;
  ctx.fillText(texto, x, y);
  ctx.filter = `blur(${0.5 * escala}px)`;
  ctx.globalAlpha = 0.55;
  ctx.fillText(texto, x, y);
  ctx.filter = "none";
  ctx.globalAlpha = 0.82;
  ctx.fillText(texto, x, y);
  ctx.restore();
}

/** Resuelve `var(--algo)` a la familia real, para el canvas. */
export function familiaCss(valor: string, el: Element = document.documentElement) {
  if (valor === "inherit") return getComputedStyle(el).fontFamily || "sans-serif";
  const m = /var\((--[\w-]+)\)/.exec(valor);
  if (!m) return valor;
  const v = getComputedStyle(el).getPropertyValue(m[1]).trim();
  return v || "serif";
}

export async function cargarFuente(fuente: string) {
  try {
    await document.fonts.load(fuente);
  } catch {
    /* sin fuente, la de respaldo */
  }
}
