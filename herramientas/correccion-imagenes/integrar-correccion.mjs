/**
 * Integra las candidatas buenas del lote de corrección Q1.
 *   node qa/v4/q1/integrar-correccion.mjs elegidas.json
 * elegidas.json: { "<id>": "<ruta a la candidata .png/.jpg revisada y aprobada>", ... }
 * Para cada id: copia la candidata a imagenes-ia/<grupo>/<id>.jpg (el original
 * defectuoso ya está guardado en qa/v4/q1/originales/), rehace public/generadas/<id>-{480,768,1080}.{avif,webp}
 * con los mismos parámetros que integrar-ia.mjs, actualiza catalogo.json (semilla y prompt nuevos)
 * y, si el id alimenta un póster temático (meta-album-2 → meta/poster-h, riviera-poster → riviera/poster-v), lo rehace.
 * No hace falta tocar código: mismas rutas.
 */
import { createRequire } from "node:module"; import fs from "node:fs"; import path from "node:path";
const WEB = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const APP = WEB + "/app";
const require = createRequire(APP + "/package.json"); const sharp = require("sharp");
const elegidas = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const encargos = JSON.parse(fs.readFileSync(APP + "/herramientas/imagenes/encargos-correccion.json", "utf8"));
const CAT = APP + "/herramientas/imagenes/catalogo.json"; const cat = JSON.parse(fs.readFileSync(CAT, "utf8"));
const jpgs = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? jpgs(path.join(d, e.name)) : /\.jpg$/.test(e.name) ? [path.join(d, e.name)] : []);
const porId = new Map(jpgs(WEB + "/imagenes-ia").map((p) => [path.basename(p, ".jpg"), p]));
const POSTER = { "meta-album-2": ["tematicas/meta/poster-h.avif", 1280, 720], "riviera-poster": ["tematicas/riviera/poster-v.avif", 720, 1280] };
for (const [id, cand] of Object.entries(elegidas)) {
  const orig = porId.get(id); if (!orig) { console.error("id desconocido", id); continue; }
  const des = WEB + "/qa/v4/q1/originales"; fs.mkdirSync(des, { recursive: true });
  if (!fs.existsSync(path.join(des, id + ".jpg"))) fs.copyFileSync(orig, path.join(des, id + ".jpg"));
  await sharp(cand).jpeg({ quality: 92 }).toFile(orig + ".tmp"); fs.renameSync(orig + ".tmp", orig);
  const variantes = [];
  for (const a of [480, 768, 1080]) for (const [ext, opt] of [["avif", { quality: 52, effort: 2 }], ["webp", { quality: 78 }]]) {
    const f = `${APP}/public/generadas/${id}-${a}.${ext}`;
    await sharp(orig).resize({ width: a, kernel: "lanczos3" })[ext](opt).toFile(f + ".tmp"); fs.renameSync(f + ".tmp", f);
    variantes.push(`generadas/${id}-${a}.${ext}`);
  }
  const v = path.basename(cand).match(/__v(\d)/)?.[1];
  const enc = encargos.find((e) => e.id === id && (!v || e.name === `${id}__v${v}`));
  const meta = await sharp(orig).metadata();
  const e = cat.imagenes.find((x) => x.id === id) ?? (cat.imagenes.push({ id }), cat.imagenes.at(-1));
  Object.assign(e, { motor: "local", modelo: "FLUX.2 [klein] 4B (Apache-2.0)", semilla: enc?.seed ?? null, prompt: enc?.prompt ?? null, lista: "encargos-correccion.json", original: { ancho: meta.width, alto: meta.height }, variantes });
  e.qa = { ...(e.qa || {}), regenerada: new Date().toISOString().slice(0, 10), servida_como: `regenerada (${path.basename(cand)})`, pendiente: null };
  if (POSTER[id]) { const [rel, w, h] = POSTER[id]; const f = APP + "/public/" + rel; await sharp(orig).resize(w, h, { fit: "cover", position: sharp.strategy.attention }).avif({ quality: 50, effort: 5 }).toFile(f + ".tmp"); fs.renameSync(f + ".tmp", f); }
  console.log("ok", id);
}
fs.writeFileSync(CAT, JSON.stringify(cat, null, 2));
