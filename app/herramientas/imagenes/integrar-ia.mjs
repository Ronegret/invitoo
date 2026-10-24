/**
 * Integra las imágenes propias generadas con FLUX.2 klein (I1, 24-10-2026).
 *
 *   node herramientas/imagenes/integrar-ia.mjs [--rehacer] [--origen ../imagenes-ia]
 *
 *  1. Cada JPG de `imagenes-ia/**` (salvo los DESCARTES) sale en
 *     `public/generadas/<id>-{480,768,1080}.{avif,webp}`. El nombre del
 *     archivo es el `name` del encargo (encargos-flux.json y
 *     encargos-tematicas-k2..k5.json).
 *  2. Derivadas: `tinta-detalle` (alianzas en blanco y negro para Tinta).
 *  3. Pósteres de las cabeceras temáticas (`public/tematicas/<id>/poster-v.avif`
 *     720×1280 y `poster-h.avif` 1280×720), con recorte por atención.
 *  4. Pósteres de las aperturas (`public/aperturas/<id>/poster.avif`): el
 *     primer fotograma limpio del propio vídeo vertical (sin nombres
 *     rotulados de otras parejas; los nombres los pinta la invitación).
 *  5. Lo sustituido se mueve (no se borra) a `archivo-fotos-antiguas/`.
 *  6. Anota cada imagen en `herramientas/imagenes/catalogo.json`.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const REHACER = args.includes("--rehacer");
const iOrigen = args.indexOf("--origen");
const ORIGEN = path.resolve(APP, iOrigen >= 0 ? args[iOrigen + 1] : "../imagenes-ia");
const SALIDA = path.join(APP, "public", "generadas");
const ARCHIVO = path.join(APP, "archivo-fotos-antiguas");
const CATALOGO = path.join(APP, "herramientas", "imagenes", "catalogo.json");
const ANCHOS = [480, 768, 1080];

/** Revisadas en hoja de contactos (qa/v3/i1/revision): defectos → no se publican. */
export const DESCARTES = {
  "aire-poster-h": "Reflejo de una tercera persona en el espejo del fondo",
  "tinta-album-4": "Rótulo con letras inventadas («SHOAPPHIS») junto a la cara del novio",
  "lupulo-poster": "Etiqueta de la botella con letras inventadas",
  "marca-bodegon-papeleria": "Lacre con un garabato de letra (pedido liso)",
  "textura-marmol": "No es una textura: una modelo con un vestido de mármol",
  "orbita-detalle-anillos": "Carta celeste con pseudo-texto legible",
  "estadio-detalle-entrada": "Balón de rugby en la temática de fútbol",
  "meta-poster": "Dos hombres corriendo: no es la pareja de la demo (novia y novio)",
};

fs.mkdirSync(SALIDA, { recursive: true });

function jpgs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...jpgs(p));
    else if (/\.jpe?g$/i.test(e.name)) out.push(p);
  }
  return out;
}

const encargos = new Map();
for (const f of ["encargos-flux.json", "encargos-tematicas-k2.json", "encargos-tematicas-k3.json", "encargos-tematicas-k4.json", "encargos-tematicas-k5.json"]) {
  const p = path.join(APP, "herramientas", "imagenes", f);
  if (fs.existsSync(p)) for (const e of JSON.parse(fs.readFileSync(p, "utf8"))) encargos.set(e.name, { ...e, lista: f });
}

/** ¿Existe y se lee? (un corte a medias deja archivos truncados). */
async function valida(f) {
  if (!fs.existsSync(f)) return false;
  try {
    await sharp(f).stats();
    return true;
  } catch {
    return false;
  }
}

async function variantes(id, entrada) {
  const hechas = [];
  for (const a of ANCHOS) {
    for (const [ext, opt] of [["avif", { quality: 52, effort: 2 }], ["webp", { quality: 78 }]]) {
      const f = path.join(SALIDA, `${id}-${a}.${ext}`);
      if (REHACER || !(await valida(f))) await entrada().resize({ width: a, kernel: "lanczos3" })[ext](opt).toFile(f);
      hechas.push(`generadas/${id}-${a}.${ext}`);
    }
  }
  return hechas;
}

function archivar(rel) {
  const de = path.join(APP, "public", rel);
  if (!fs.existsSync(de)) return false;
  const a = path.join(ARCHIVO, rel);
  if (fs.existsSync(a)) return false; // ya archivado: lo de public es nuevo
  fs.mkdirSync(path.dirname(a), { recursive: true });
  fs.renameSync(de, a);
  return true;
}

async function poster(rel, origen, w, h) {
  const f = path.join(APP, "public", rel);
  archivar(rel);
  await sharp(origen).resize(w, h, { fit: "cover", position: sharp.strategy.attention }).avif({ quality: 50, effort: 5 }).toFile(f + ".tmp");
  fs.renameSync(f + ".tmp", f);
}

const todos = jpgs(ORIGEN);
const porId = new Map(todos.map((p) => [path.basename(p).replace(/\.jpe?g$/i, ""), p]));
const catalogo = fs.existsSync(CATALOGO) ? JSON.parse(fs.readFileSync(CATALOGO, "utf8")) : { imagenes: [] };
const ids = [...porId.keys()].filter((id) => !DESCARTES[id]).sort();

// 1. Variantes, de cuatro en cuatro.
let i = 0;
async function trabajador() {
  while (i < ids.length) {
    const id = ids[i++];
    const src = porId.get(id);
    const meta = await sharp(src).metadata();
    const v = await variantes(id, () => sharp(src));
    const e = encargos.get(id);
    catalogo.imagenes = catalogo.imagenes.filter((x) => x.id !== id);
    catalogo.imagenes.push({
      id,
      motor: "local",
      modelo: "FLUX.2 [klein] 4B (Apache-2.0)",
      semilla: e?.seed ?? null,
      prompt: e?.prompt ?? null,
      lista: e?.lista ?? null,
      grupo: path.relative(ORIGEN, path.dirname(src)).split(path.sep).join("/"),
      original: { ancho: meta.width, alto: meta.height },
      variantes: v,
    });
    process.stdout.write(".");
  }
}
await Promise.all([trabajador(), trabajador()]);
console.log(`\n${ids.length} imágenes en public/generadas`);

// 2. Derivada para Tinta (blanco y negro).
if (porId.has("marca-alianzas-mano")) {
  await variantes("tinta-detalle", () => sharp(porId.get("marca-alianzas-mano")).grayscale().linear(1.08, -6));
}

// 3. Pósteres de las cabeceras temáticas.
const POSTERES = {
  regencia: ["regencia-portada", "regencia-poster-h"],
  aire: ["aire-portada", "aire-album-2"],
  cuento: ["cuento-portada", "cuento-poster-h"],
  blason: ["blason-poster-hero", "blason-album-3"],
  memorias: ["memorias-poster-hero", "memorias-detalle-2"],
  pasaporte: ["pasaporte-poster-hero", "pasaporte-album-3"],
  orilla: ["orilla-poster-hero", "orilla-album-3"],
  pinar: ["pinar-poster", "pinar-3"],
  orbita: ["orbita-poster", "orbita-4"],
  brazada: ["brazada-poster", "brazada-2"],
  festival: ["festival-poster", "festival-album-2"],
  vinilo: ["vinilo-poster", "vinilo-album-2"],
  neon: ["neon-poster", "neon-album-2"],
  fuego: ["fuego-poster", "fuego-album-2"],
  bachata: ["bachata-poster", "bachata-album-3"],
  lupulo: ["lupulo-album-1", "lupulo-album-2"],
  estadio: ["estadio-poster", "estadio-album-2"],
  meta: ["meta-album-1", "meta-album-2"],
  riviera: ["riviera-poster", "riviera-album-2"],
};
for (const [tema, [v, h]] of Object.entries(POSTERES)) {
  if (!fs.existsSync(path.join(APP, "public", "tematicas", tema))) continue;
  await poster(`tematicas/${tema}/poster-v.avif`, porId.get(v), 720, 1280);
  await poster(`tematicas/${tema}/poster-h.avif`, porId.get(h), 1280, 720);
}
console.log("pósteres temáticos listos");

// 4. Pósteres de las aperturas: primer fotograma del vídeo (se salta 1 s de negro).
const AP = path.join(APP, "public", "aperturas");
for (const id of fs.readdirSync(AP)) {
  const v = path.join(AP, id, "vertical.mp4");
  if (!fs.existsSync(v)) continue;
  const png = path.join(ARCHIVO, `.fotograma-${id}.png`);
  fs.mkdirSync(ARCHIVO, { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "1.0", "-i", v, "-frames:v", "1", png]);
  await poster(`aperturas/${id}/poster.avif`, png, 720, 1280);
  fs.rmSync(png);
}
console.log("pósteres de apertura listos");

catalogo.actualizado = new Date().toISOString();
catalogo.descartes = DESCARTES;
fs.writeFileSync(CATALOGO, JSON.stringify(catalogo, null, 2));
