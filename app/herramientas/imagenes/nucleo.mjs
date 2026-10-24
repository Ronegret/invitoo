/**
 * Invitoo · núcleo del generador de imágenes con IA.
 *
 * Tres motores, intercambiables y con el mismo contrato:
 *   - «local»      ComfyUI en el PC de Rodrigo (http://127.0.0.1:8188) con FLUX.1 schnell. Gratis.
 *   - «cloudflare» Workers AI (FLUX.1 schnell / FLUX.2 klein 4B). Gratis hasta 10.000 neurons/día.
 *   - «gemini»     Nano Banana Pro (gemini-3-pro-image) y familia. De pago (requiere facturación).
 *
 * Lo usan la CLI (`nano-banana.mjs`), el lote, `local-comfyui.mjs` y el servidor MCP.
 * Las claves se leen del entorno o de `app/.env.local`, y NUNCA se imprimen.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const DIR = path.dirname(fileURLToPath(import.meta.url));
export const APP = path.resolve(DIR, "../..");
export const SALIDA = path.join(APP, "public", "generadas");
export const CATALOGO = path.join(DIR, "catalogo.json");
export const ENCARGOS = path.join(DIR, "encargos.json");
const CUOTA = path.join(DIR, ".cuota-cloudflare.json");

// ───────────────────────── configuración ─────────────────────────

/** Lee app/.env.local (sin sobrescribir lo que ya venga del entorno). */
export function cargarEntorno() {
  for (const f of [".env.local", ".env"]) {
    const p = path.join(APP, f);
    if (!fs.existsSync(p)) continue;
    for (const linea of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

cargarEntorno(); // para que INVITOO_* de .env.local cuenten ya en las constantes

export const MODELOS = {
  gemini: {
    final: process.env.INVITOO_GEMINI_MODELO || "gemini-3-pro-image", // Nano Banana Pro
    borrador: process.env.INVITOO_GEMINI_BORRADOR || "gemini-3.1-flash-image", // Nano Banana 2
    otros: ["gemini-nano-banana-2.1", "gemini-2.5-flash-image", "nano-banana-pro-preview"],
  },
  cloudflare: {
    final: process.env.INVITOO_CF_MODELO || "@cf/black-forest-labs/flux-2-klein-4b",
    borrador: process.env.INVITOO_CF_BORRADOR || "@cf/black-forest-labs/flux-1-schnell",
  },
  local: { final: "flux2-klein-4b", borrador: "flux2-klein-4b" },
};

/** Neurons estimados por imagen de 1 MP (configurables). Se escalan por megapíxeles. */
const NEURONS_MP = {
  "@cf/black-forest-labs/flux-1-schnell": Number(process.env.INVITOO_CF_NEURONS_SCHNELL || 58),
  "@cf/black-forest-labs/flux-2-klein-4b": Number(process.env.INVITOO_CF_NEURONS_KLEIN || 105),
};
const LIMITE_NEURONS = Number(process.env.INVITOO_CF_LIMITE_DIARIO || 10000);

/** Proporción → tamaño FLUX (múltiplos de 16, ≈ 1 MP) y cadena para Gemini. */
export const ASPECTOS = {
  "1:1": [1024, 1024],
  "4:5": [896, 1120],
  "3:4": [880, 1168],
  "2:3": [832, 1248],
  "9:16": [768, 1360],
  "16:9": [1360, 768],
  "3:2": [1248, 832],
  "5:4": [1120, 896],
  "21:9": [1536, 656],
};

/** Anchos de las variantes AVIF/WebP. */
export const ANCHOS = [480, 768, 1080, 1600, 2048];

export class ErrorMotor extends Error {
  constructor(motor, codigo, mensaje, { reintentable = false, agotado = false } = {}) {
    super(mensaje);
    this.motor = motor;
    this.codigo = codigo;
    this.reintentable = reintentable;
    /** El motor no sirve para el resto de esta ejecución (sin facturación, sin cuota, apagado…). */
    this.agotado = agotado;
  }
}

// ───────────────────────── prompts ─────────────────────────

/** Reglas que se añaden a todo encargo (personas ficticias, sin texto ni marcas). */
export const REGLAS = {
  positivo:
    "Editorial wedding photography, natural light, true-to-life skin texture, subtle film grain, " +
    "shot on a full-frame camera with a prime lens, refined and understated, Spanish setting.",
  negativo:
    "text, letters, words, typography, watermark, signature, logo, brand names, celebrity, famous person, " +
    "recognisable real person, extra fingers, deformed hands, plastic skin, oversaturated, HDR, cartoon, CGI look, " +
    "stock-photo posing, cheesy, kitsch",
};

/** Prompt final para cada motor. FLUX no tiene negativos: se reformulan en positivo. */
export function componerPrompt(enc, motor) {
  const base = (enc.prompt || "").trim();
  if (motor === "gemini") {
    const neg = [enc.negativos, REGLAS.negativo].filter(Boolean).join(", ");
    return `${base}\n\n${REGLAS.positivo}\nStrictly avoid: ${neg}. All people are fictional. No visible text anywhere in the image.`;
  }
  // FLUX (schnell / klein / local): inglés descriptivo y solo en positivo.
  const flux = (enc.prompt_flux || base).trim();
  return `${flux} ${REGLAS.positivo} Clean image with no lettering, no signage and no logos; fictional people.`;
}

// ───────────────────────── utilidades ─────────────────────────

const require = createRequire(path.join(APP, "package.json"));
function sharp() {
  try {
    return require("sharp");
  } catch {
    throw new Error("Falta «sharp». En la carpeta app ejecuta:  npm i sharp --no-save");
  }
}

export function semillaDe(texto) {
  return crypto.createHash("sha256").update(String(texto)).digest().readUInt32BE(0) % 2147483647;
}

function leerJSON(p, def) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return def;
  }
}

export function resolverRuta(p) {
  if (!p) return p;
  if (path.isAbsolute(p)) return p;
  for (const base of [process.cwd(), APP, SALIDA, path.join(APP, "public")]) {
    const q = path.join(base, p);
    if (fs.existsSync(q)) return q;
  }
  return path.join(process.cwd(), p);
}

async function aPNG(buf) {
  return sharp()(buf).png().toBuffer();
}

/** Imagen de referencia lista para enviar (redimensionada al máximo pedido). */
async function referencia(ruta, max) {
  const s = sharp()(fs.readFileSync(resolverRuta(ruta))).rotate();
  const buf = await s.resize({ width: max, height: max, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  return buf;
}

/** Recorta al centro a la proporción pedida (para motores que no la respetan). */
async function ajustarAspecto(buf, aspecto) {
  const [aw, ah] = aspecto.split(":").map(Number);
  const img = sharp()(buf);
  const { width, height } = await img.metadata();
  const objetivo = aw / ah;
  if (Math.abs(width / height - objetivo) < 0.01) return buf;
  let w = width, h = Math.round(width / objetivo);
  if (h > height) { h = height; w = Math.round(height * objetivo); }
  return sharp()(buf).extract({ left: Math.round((width - w) / 2), top: Math.round((height - h) / 2), width: w, height: h }).png().toBuffer();
}

// ───────────────────────── cuota de Cloudflare ─────────────────────────

function hoyUTC() {
  return new Date().toISOString().slice(0, 10);
}
export function cuotaCloudflare() {
  const c = leerJSON(CUOTA, {});
  const neurons = c.fecha === hoyUTC() ? c.neurons || 0 : 0;
  return { fecha: hoyUTC(), neurons, limite: LIMITE_NEURONS, libre: Math.max(0, LIMITE_NEURONS - neurons) };
}
function sumarNeurons(n) {
  const c = cuotaCloudflare();
  const nuevo = { fecha: c.fecha, neurons: Math.round((c.neurons + n) * 10) / 10 };
  fs.writeFileSync(CUOTA, JSON.stringify(nuevo));
  return nuevo.neurons;
}
export function costeCloudflare(modelo, w, h) {
  return (NEURONS_MP[modelo] ?? 110) * ((w * h) / (1024 * 1024));
}

// ───────────────────────── motores ─────────────────────────

/** ¿Qué motores pueden trabajar ahora? (sin gastar cuota). */
export async function disponibilidad() {
  cargarEntorno();
  const out = {};
  // local
  try {
    const r = await fetch(`${urlComfy()}/system_stats`, { signal: AbortSignal.timeout(1500) });
    out.local = r.ok ? { ok: true } : { ok: false, motivo: `ComfyUI respondió ${r.status}` };
  } catch {
    out.local = { ok: false, motivo: `ComfyUI no responde en ${urlComfy()} (¿está abierto en Pinokio?)` };
  }
  // cloudflare
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    out.cloudflare = { ok: false, motivo: "Faltan CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN en app/.env.local" };
  } else {
    const c = cuotaCloudflare();
    out.cloudflare = c.libre > 60
      ? { ok: true, cuota: c }
      : { ok: false, motivo: `Cuota gratuita de hoy agotada (${c.neurons}/${c.limite} neurons). Se renueva a las 00:00 UTC.`, cuota: c };
  }
  // gemini
  out.gemini = process.env.GEMINI_API_KEY
    ? { ok: true, nota: "La clave existe; la facturación solo se comprueba al generar." }
    : { ok: false, motivo: "Falta GEMINI_API_KEY en app/.env.local" };
  return out;
}

// --- Gemini (Nano Banana) ---
async function motorGemini({ prompt, aspecto, refs = [], modelo, semilla, tamano = "2K" }) {
  const clave = process.env.GEMINI_API_KEY;
  if (!clave) throw new ErrorMotor("gemini", "sin-clave", "Falta GEMINI_API_KEY en app/.env.local.", { agotado: true });
  const parts = [{ text: prompt }];
  for (const r of refs.slice(0, 6)) {
    parts.push({ inline_data: { mime_type: "image/png", data: (await referencia(r, 1536)).toString("base64") } });
  }
  const cuerpo = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: aspecto, ...(modelo.includes("pro") || modelo.includes("3.1") || modelo.includes("2.1") ? { imageSize: tamano } : {}) },
      ...(semilla != null ? { seed: semilla } : {}),
    },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": clave },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(180000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw explicarGemini(r.status, j, modelo);
  const partes = j.candidates?.[0]?.content?.parts || [];
  const img = partes.find((p) => p.inlineData || p.inline_data);
  if (!img) {
    const motivo = j.candidates?.[0]?.finishReason || j.promptFeedback?.blockReason || "sin imagen";
    throw new ErrorMotor("gemini", "sin-imagen", `Gemini no devolvió imagen (${motivo}). Si es SAFETY o IMAGE_SAFETY, suaviza el prompt.`);
  }
  const d = img.inlineData || img.inline_data;
  return { buf: Buffer.from(d.data, "base64"), modelo };
}

function explicarGemini(status, j, modelo) {
  const msg = j?.error?.message || "";
  if (status === 429 && /limit: 0|free_tier/i.test(msg)) {
    return new ErrorMotor(
      "gemini",
      "sin-facturacion",
      `Gemini rechaza la petición (429, cuota 0 del nivel gratuito para ${modelo}). La clave es válida, pero el proyecto ` +
        "no tiene facturación: la generación de imágenes no entra en el plan gratuito de la API. Actívala en " +
        "https://aistudio.google.com/ → API keys → tu proyecto → «Set up billing» (o en console.cloud.google.com/billing). " +
        "No se reintenta. Mientras tanto se usará Cloudflare o ComfyUI local si están configurados.",
      { agotado: true },
    );
  }
  if (status === 429)
    return new ErrorMotor("gemini", "limite", "Gemini: límite de peticiones por minuto. Espera un minuto y relanza (no se reintenta solo).", { agotado: true });
  if (status === 400 && /API key not valid/i.test(msg)) return new ErrorMotor("gemini", "clave", "GEMINI_API_KEY no es válida.", { agotado: true });
  if (status === 403) return new ErrorMotor("gemini", "permiso", "Gemini: la clave no tiene permiso para este modelo o la API no está habilitada.", { agotado: true });
  if (status === 404) return new ErrorMotor("gemini", "modelo", `Gemini: el modelo «${modelo}» no existe para esta clave. Usa --modelo con uno de ${MODELOS.gemini.otros.join(", ")}.`, { agotado: true });
  return new ErrorMotor("gemini", `http-${status}`, `Gemini respondió ${status}: ${msg.slice(0, 300)}`, { reintentable: status >= 500 });
}

// --- Cloudflare Workers AI (FLUX) ---
async function motorCloudflare({ prompt, aspecto, refs = [], modelo, semilla }) {
  const cuenta = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN;
  if (!cuenta || !token) throw new ErrorMotor("cloudflare", "sin-credenciales", "Faltan CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN en app/.env.local.", { agotado: true });
  const [w, h] = ASPECTOS[aspecto] || ASPECTOS["1:1"];
  const coste = costeCloudflare(modelo, w, h);
  const c = cuotaCloudflare();
  if (c.neurons + coste > c.limite && !process.env.INVITOO_CF_SIN_LIMITE)
    throw new ErrorMotor("cloudflare", "cuota", `Cloudflare: esta imagen (~${Math.round(coste)} neurons) superaría el gratuito de hoy (${c.neurons}/${c.limite}). Se renueva a las 00:00 UTC.`, { agotado: true });
  const url = `https://api.cloudflare.com/client/v4/accounts/${cuenta}/ai/run/${modelo}`;
  let r;
  if (modelo.includes("flux-2")) {
    const form = new FormData();
    form.append("prompt", prompt.slice(0, 2048));
    form.append("width", String(w));
    form.append("height", String(h));
    if (semilla != null) form.append("seed", String(semilla));
    let i = 0;
    for (const ref of refs.slice(0, 4)) {
      const b = await referencia(ref, 511); // el modelo exige < 512 × 512
      form.append(`input_image_${i++}`, new Blob([b], { type: "image/png" }), `ref${i}.png`);
    }
    r = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form, signal: AbortSignal.timeout(180000) });
  } else {
    r = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ prompt: prompt.slice(0, 2048), steps: 4, width: w, height: h, ...(semilla != null ? { seed: semilla } : {}) }),
      signal: AbortSignal.timeout(180000),
    });
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) {
    const msg = (j.errors || []).map((e) => e.message).join("; ") || `HTTP ${r.status}`;
    if (r.status === 401 || r.status === 403)
      throw new ErrorMotor("cloudflare", "permiso", `Cloudflare rechaza el token (${r.status}). Crea uno con el permiso «Workers AI · Read/Edit» (ver docs/18-imagenes-ia.md).`, { agotado: true });
    if (r.status === 429 || /neuron|quota|limit/i.test(msg))
      throw new ErrorMotor("cloudflare", "cuota", `Cloudflare: cuota diaria agotada (${msg}). Se renueva a las 00:00 UTC.`, { agotado: true });
    throw new ErrorMotor("cloudflare", `http-${r.status}`, `Cloudflare respondió ${r.status}: ${msg.slice(0, 300)}`, { reintentable: r.status >= 500 });
  }
  const b64 = j.result?.image || j.image;
  if (!b64) throw new ErrorMotor("cloudflare", "sin-imagen", "Cloudflare no devolvió imagen.");
  const total = sumarNeurons(coste);
  if (total >= 0.9 * LIMITE_NEURONS)
    console.warn(`⚠ Cloudflare: llevas ${Math.round(total)} de ${LIMITE_NEURONS} neurons gratuitos de hoy (≥ 90 %).`);
  return { buf: Buffer.from(b64, "base64"), modelo, neurons: Math.round(coste) };
}

// --- Local: ComfyUI (Pinokio) ---
function urlComfy() {
  return (process.env.COMFYUI_URL || "http://127.0.0.1:8188").replace(/\/$/, "");
}
async function motorLocal({ prompt, aspecto, semilla, flujo }) {
  const base = urlComfy();
  const [w, h] = ASPECTOS[aspecto] || ASPECTOS["1:1"];
  const archivo = path.join(DIR, "flujos", `${flujo || process.env.INVITOO_COMFY_FLUJO || "flux2-klein-4b"}.json`);
  const g = JSON.parse(fs.readFileSync(archivo, "utf8"));
  delete g._comentario;
  // Rellena los nodos marcados con _meta.title
  for (const n of Object.values(g)) {
    const t = n._meta?.title;
    if (t === "PROMPT") n.inputs.text = prompt;
    if (t === "LIENZO") Object.assign(n.inputs, { width: w, height: h });
    if (t === "MUESTREO") {
      const k = "noise_seed" in n.inputs ? "noise_seed" : "seed";
      n.inputs[k] = semilla ?? Math.floor(Math.random() * 2 ** 31);
    }
  }
  let r;
  try {
    r = await fetch(`${base}/prompt`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: g, client_id: "invitoo" }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new ErrorMotor("local", "apagado", `ComfyUI no responde en ${base}. Ábrelo desde Pinokio y espera a que diga «To see the GUI go to…».`, { agotado: true });
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const det = JSON.stringify(j.node_errors || j.error || j).slice(0, 400);
    throw new ErrorMotor("local", "flujo", `ComfyUI rechazó el flujo (${r.status}). ¿Están los modelos en su carpeta? Detalle: ${det}`, { agotado: true });
  }
  const id = j.prompt_id;
  const limite = Date.now() + 10 * 60 * 1000;
  while (Date.now() < limite) {
    await new Promise((res) => setTimeout(res, 1500));
    const hist = await (await fetch(`${base}/history/${id}`)).json().catch(() => ({}));
    const item = hist[id];
    if (!item) continue;
    if (item.status?.status_str === "error") throw new ErrorMotor("local", "ejecucion", "ComfyUI falló al generar (mira su consola en Pinokio).");
    for (const salida of Object.values(item.outputs || {})) {
      const im = salida.images?.[0];
      if (im) {
        const q = new URLSearchParams({ filename: im.filename, subfolder: im.subfolder || "", type: im.type || "output" });
        const buf = Buffer.from(await (await fetch(`${base}/view?${q}`)).arrayBuffer());
        return { buf, modelo: `ComfyUI · ${path.basename(archivo, ".json")}` };
      }
    }
  }
  throw new ErrorMotor("local", "tiempo", "ComfyUI tardó más de 10 minutos.");
}

const MOTORES = { gemini: motorGemini, cloudflare: motorCloudflare, local: motorLocal };

// ───────────────────────── generar + guardar ─────────────────────────

/**
 * Genera una imagen.
 * @param {object} o
 * @param {string} o.id           nombre de salida (sin extensión)
 * @param {string} o.prompt
 * @param {string} [o.aspecto]    "4:5" | "9:16" | "1:1" | "16:9" | …
 * @param {string[]} [o.refs]     rutas de imágenes de referencia
 * @param {string[]} [o.motores]  orden de preferencia. Por defecto local → cloudflare → gemini
 * @param {boolean} [o.borrador]  modelos rápidos/baratos
 */
export async function generar(o) {
  cargarEntorno();
  const aspecto = o.aspecto || "4:5";
  if (!ASPECTOS[aspecto]) throw new Error(`Aspecto no válido: ${aspecto}. Usa ${Object.keys(ASPECTOS).join(", ")}`);
  const motores = o.motores?.length ? o.motores : ordenMotores();
  const semilla = o.semilla ?? semillaDe(o.id || o.prompt);
  const agotados = o.agotados || new Set();
  const errores = [];
  for (const m of motores) {
    if (agotados.has(m)) continue;
    const modelo = o.modelo && (o.motorModelo ? o.motorModelo === m : true) && esModeloDe(o.modelo, m) ? o.modelo : MODELOS[m][o.borrador ? "borrador" : "final"];
    const enc = { prompt: o.prompt, prompt_flux: o.prompt_flux, negativos: o.negativos };
    const prompt = o.promptCrudo ? o.prompt : componerPrompt(enc, m);
    try {
      const r = await MOTORES[m]({ prompt, aspecto, refs: o.refs || [], modelo, semilla, tamano: o.tamano, flujo: o.flujo });
      let png = await aPNG(r.buf);
      if (m !== "gemini") png = await ajustarAspecto(png, aspecto);
      const guardado = await guardar(o.id || `img-${Date.now()}`, png, o.carpeta);
      const entrada = {
        id: o.id,
        uso: o.uso || "",
        prompt,
        motor: m,
        modelo: r.modelo,
        semilla,
        aspecto,
        referencias: o.refs || [],
        archivo: guardado.png,
        variantes: guardado.variantes,
        neurons: r.neurons,
        fecha: new Date().toISOString(),
        generadaConIA: true,
      };
      anotar(entrada);
      return entrada;
    } catch (e) {
      if (!(e instanceof ErrorMotor)) throw e;
      errores.push(e);
      if (e.agotado) agotados.add(m);
      console.warn(`  · ${m}: ${e.message}`);
    }
  }
  const err = new Error(
    errores.length ? `Ningún motor pudo generar «${o.id}».\n` + errores.map((e) => `  - ${e.motor}: ${e.message}`).join("\n") : "No hay motores disponibles: configura al menos uno (docs/18-imagenes-ia.md).",
  );
  err.errores = errores;
  throw err;
}

function esModeloDe(modelo, motor) {
  if (motor === "cloudflare") return modelo.startsWith("@cf/");
  if (motor === "gemini") return /gemini|banana/.test(modelo);
  return motor === "local";
}

export function ordenMotores() {
  return (process.env.INVITOO_MOTORES || "local,cloudflare,gemini").split(",").map((s) => s.trim()).filter((m) => MOTORES[m]);
}

/** Guarda PNG máster + AVIF y WebP en varios anchos. */
export async function guardar(id, png, carpeta = SALIDA) {
  fs.mkdirSync(carpeta, { recursive: true });
  const s = sharp();
  const pngPath = path.join(carpeta, `${id}.png`);
  fs.writeFileSync(pngPath, png);
  const { width } = await s(png).metadata();
  const anchos = ANCHOS.filter((a) => a <= width);
  if (!anchos.includes(width) && width < ANCHOS[ANCHOS.length - 1]) anchos.push(width);
  const variantes = [];
  for (const a of anchos) {
    for (const [ext, opt] of [["avif", { quality: 55, effort: 5 }], ["webp", { quality: 80 }]]) {
      const f = path.join(carpeta, `${id}-${a}.${ext}`);
      await s(png).resize({ width: a })[ext](opt).toFile(f);
      variantes.push(path.relative(path.join(APP, "public"), f).split(path.sep).join("/"));
    }
  }
  return { png: path.relative(APP, pngPath).split(path.sep).join("/"), variantes };
}

export function anotar(entrada) {
  const cat = leerJSON(CATALOGO, { imagenes: [] });
  cat.imagenes = cat.imagenes.filter((x) => x.id !== entrada.id);
  cat.imagenes.push(entrada);
  cat.actualizado = new Date().toISOString();
  fs.writeFileSync(CATALOGO, JSON.stringify(cat, null, 2));
}

/** Edita una imagen existente con una instrucción (Gemini o FLUX.2 klein). */
export async function editar({ id, imagen, instruccion, aspecto, motores, modelo, semilla, uso }) {
  const ref = resolverRuta(imagen);
  if (!fs.existsSync(ref)) throw new Error(`No existe la imagen: ${imagen}`);
  const meta = await sharp()(ref).metadata();
  const asp = aspecto || masCercano(meta.width / meta.height);
  // Solo los motores que aceptan imagen de entrada
  const m = (motores || ordenMotores()).filter((x) => x !== "local");
  const prompt = `Edit the provided photograph: ${instruccion}. Keep everything else identical: the same people, faces, framing, light and colour grade.`;
  return generar({
    id: id || `${path.basename(ref, path.extname(ref))}-ed`,
    prompt,
    promptCrudo: true,
    aspecto: asp,
    refs: [ref],
    motores: m,
    modelo: modelo || (m[0] === "cloudflare" ? "@cf/black-forest-labs/flux-2-klein-4b" : undefined),
    semilla,
    uso: uso || `edición de ${path.basename(ref)}`,
  });
}

export function masCercano(r) {
  let mejor = "1:1", d = Infinity;
  for (const [k, [w, h]] of Object.entries(ASPECTOS)) {
    const x = Math.abs(Math.log(r / (w / h)));
    if (x < d) { d = x; mejor = k; }
  }
  return mejor;
}

/** Ordena encargos para que las referencias se generen antes que quien las usa. */
export function ordenarPorDependencias(encargos) {
  const porId = new Map(encargos.map((e) => [e.id, e]));
  const hecho = new Set(), out = [];
  const visita = (e, pila = new Set()) => {
    if (hecho.has(e.id) || pila.has(e.id)) return;
    pila.add(e.id);
    for (const r of e.referencias || []) if (porId.has(r)) visita(porId.get(r), pila);
    hecho.add(e.id);
    out.push(e);
  };
  encargos.forEach((e) => visita(e));
  return out;
}

/** Ejecuta un lote de encargos. Nunca reintenta en bucle: si un motor se agota, pasa al siguiente. */
export async function lote({ archivo = ENCARGOS, solo, desde, max, motores, borrador, rehacer = false, simulacro = false } = {}) {
  cargarEntorno();
  const datos = JSON.parse(fs.readFileSync(resolverRuta(archivo), "utf8"));
  let lista = ordenarPorDependencias(datos.encargos);
  if (solo?.length) lista = lista.filter((e) => solo.some((s) => e.id === s || e.id.startsWith(s) || (e.grupo || "") === s));
  if (desde) lista = lista.slice(Math.max(0, lista.findIndex((e) => e.id === desde)));
  if (max) lista = lista.slice(0, max);
  const hechos = new Set((leerJSON(CATALOGO, { imagenes: [] }).imagenes || []).map((x) => x.id));
  const agotados = new Set();
  const res = { ok: [], saltados: [], fallidos: [] };
  const orden = motores?.length ? motores : ordenMotores();
  console.log(`Lote: ${lista.length} encargos · motores: ${orden.join(" → ")}${borrador ? " · borrador" : ""}`);
  for (const [i, e] of lista.entries()) {
    if (!rehacer && hechos.has(e.id) && fs.existsSync(path.join(SALIDA, `${e.id}.png`))) {
      res.saltados.push(e.id);
      continue;
    }
    const refs = [
      ...(e.referencias || []).map((r) => path.join(SALIDA, `${r}.png`)),
      ...(e.referencias_archivos || []).map((r) => path.join(APP, r)),
    ].filter((p) => fs.existsSync(p));
    const disponibles = orden.filter((m) => !agotados.has(m));
    if (!disponibles.length) {
      console.log("\nTodos los motores están agotados o sin configurar. Paro aquí; relanza el lote cuando haya cuota (salta lo ya hecho).");
      res.fallidos.push(...lista.slice(i).map((x) => x.id));
      break;
    }
    // Si el encargo necesita coherencia con referencias, prefiere motores que las acepten.
    const pref = refs.length ? [...disponibles.filter((m) => m !== "local"), ...disponibles.filter((m) => m === "local")] : disponibles;
    console.log(`\n[${i + 1}/${lista.length}] ${e.id} · ${e.aspecto} · ${e.uso}`);
    if (simulacro) {
      console.log("  (simulacro) " + componerPrompt(e, pref[0]).slice(0, 160) + "…");
      continue;
    }
    try {
      const r = await generar({
        id: e.id,
        prompt: e.prompt,
        prompt_flux: e.prompt_flux,
        negativos: e.negativos,
        aspecto: e.aspecto,
        refs,
        motores: pref,
        borrador,
        semilla: e.semilla,
        uso: e.uso,
        agotados,
      });
      res.ok.push(e.id);
      console.log(`  ✓ ${r.archivo} (${r.motor} · ${r.modelo})`);
      const copia = process.env.INVITOO_COPIAR_A;
      if (copia) {
        const dest = path.join(copia, e.grupo || "otros");
        fs.mkdirSync(dest, { recursive: true });
        fs.copyFileSync(path.join(SALIDA, `${e.id}.png`), path.join(dest, `${e.id}.png`));
      }
    } catch (err) {
      res.fallidos.push(e.id);
      console.log(`  ✗ ${err.message.split("\n")[0]}`);
    }
  }
  console.log(`\nHechas ${res.ok.length} · ya existían ${res.saltados.length} · pendientes ${res.fallidos.length}`);
  if (orden.includes("cloudflare")) {
    const c = cuotaCloudflare();
    console.log(`Cloudflare hoy: ${Math.round(c.neurons)}/${c.limite} neurons.`);
  }
  return res;
}
