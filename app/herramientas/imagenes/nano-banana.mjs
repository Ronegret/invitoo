#!/usr/bin/env node
/**
 * Invitoo · generador de imágenes (CLI).
 *
 *   node herramientas/imagenes/nano-banana.mjs estado
 *   node herramientas/imagenes/nano-banana.mjs generar --prompt "…" --aspecto 4:5 [--ref a.png] [--salida id] [--motor gemini] [--borrador]
 *   node herramientas/imagenes/nano-banana.mjs editar  --imagen public/generadas/x.png --prompt "quita la copa" [--salida id]
 *   node herramientas/imagenes/nano-banana.mjs variaciones --imagen x.png [--n 3]  |  --prompt "…" --n 4
 *   node herramientas/imagenes/nano-banana.mjs lote [--solo carta] [--max 10] [--motores cloudflare,gemini] [--borrador] [--rehacer] [--simulacro]
 *
 * Motores: local (ComfyUI) → cloudflare (gratis) → gemini (Nano Banana Pro, de pago). Cambia el orden con
 * --motores o con INVITOO_MOTORES en app/.env.local. Las claves van en app/.env.local (ver docs/18-imagenes-ia.md).
 */
import path from "node:path";
import { generar, editar, lote, disponibilidad, cuotaCloudflare, ASPECTOS, MODELOS, resolverRuta, semillaDe } from "./nucleo.mjs";

function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { o._.push(a); continue; }
    const k = a.slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    if (k === "ref" || k === "solo") (o[k] ||= []).push(...String(v).split(","));
    else o[k] = v;
  }
  return o;
}

const AYUDA = `Invitoo · imágenes con IA

  estado                         motores disponibles, cuota de Cloudflare y modelos
  generar  --prompt "…" [--aspecto ${Object.keys(ASPECTOS).join("|")}] [--ref img.png]… [--salida id]
           [--motor local|cloudflare|gemini] [--modelo …] [--semilla n] [--borrador] [--uso "…"]
  editar   --imagen ruta.png --prompt "instrucción" [--salida id] [--motor gemini|cloudflare]
  variaciones (--imagen ruta.png | --prompt "…") [--n 3] [--aspecto 4:5]
  exportar                       escribe encargos-flux.json (name, prompt, width, height, seed, carpeta)
  lote     [--archivo encargos.json] [--solo id|prefijo|grupo] [--max n] [--motores a,b] [--borrador] [--rehacer] [--simulacro]

Salida: app/public/generadas/<id>.png + <id>-<ancho>.avif/.webp, y catálogo en herramientas/imagenes/catalogo.json`;

const o = args(process.argv.slice(2));
const cmd = o._[0];
const motores = o.motor ? [o.motor] : o.motores ? String(o.motores).split(",") : undefined;

try {
  if (cmd === "estado") {
    const d = await disponibilidad();
    for (const [m, s] of Object.entries(d)) console.log(`${s.ok ? "✓" : "✗"} ${m.padEnd(10)} ${s.ok ? s.nota || "listo" : s.motivo}`);
    const c = cuotaCloudflare();
    console.log(`\nCloudflare hoy (UTC ${c.fecha}): ${Math.round(c.neurons)}/${c.limite} neurons`);
    console.log(`Modelos: gemini ${MODELOS.gemini.final} (borrador ${MODELOS.gemini.borrador}) · cloudflare ${MODELOS.cloudflare.final} (borrador ${MODELOS.cloudflare.borrador}) · local FLUX.1 schnell`);
  } else if (cmd === "generar") {
    if (!o.prompt) throw new Error("Falta --prompt");
    const r = await generar({
      id: o.salida ? path.basename(String(o.salida), path.extname(String(o.salida))) : `img-${Date.now()}`,
      prompt: String(o.prompt),
      aspecto: o.aspecto || "4:5",
      refs: (o.ref || []).map(resolverRuta),
      motores,
      modelo: o.modelo,
      semilla: o.semilla != null ? Number(o.semilla) : undefined,
      borrador: !!o.borrador,
      uso: o.uso,
      promptCrudo: !!o.crudo,
    });
    console.log(`✓ ${r.archivo} · ${r.motor} · ${r.modelo} · semilla ${r.semilla}`);
  } else if (cmd === "editar") {
    if (!o.imagen || !o.prompt) throw new Error("Faltan --imagen y --prompt");
    const r = await editar({ id: o.salida, imagen: String(o.imagen), instruccion: String(o.prompt), motores, modelo: o.modelo });
    console.log(`✓ ${r.archivo} · ${r.motor} · ${r.modelo}`);
  } else if (cmd === "variaciones") {
    const n = Number(o.n || 3);
    for (let i = 1; i <= n; i++) {
      const base = o.salida || (o.imagen ? path.basename(String(o.imagen), path.extname(String(o.imagen))) : `var-${Date.now()}`);
      const r = o.imagen
        ? await editar({ id: `${base}-v${i}`, imagen: String(o.imagen), instruccion: `create a natural variation (${["different moment", "slightly different angle", "different framing"][i % 3]}), same people and setting`, motores })
        : await generar({ id: `${base}-v${i}`, prompt: String(o.prompt), aspecto: o.aspecto || "4:5", motores, semilla: semillaDe(base + i), borrador: !!o.borrador });
      console.log(`✓ ${r.archivo}`);
    }
  } else if (cmd === "exportar") {
    // Lote plano para lanzarlo con otro programa (p. ej. C:\IA\probar-flux.py): name, prompt, width, height, seed, carpeta
    const fs = await import("node:fs");
    const { ENCARGOS, DIR, componerPrompt, ASPECTOS: A, semillaDe: sd } = await import("./nucleo.mjs");
    const datos = JSON.parse(fs.readFileSync(o.archivo ? resolverRuta(o.archivo) : ENCARGOS, "utf8"));
    const plano = datos.encargos.map((e) => {
      const [width, height] = A[e.aspecto] || A["1:1"];
      return { name: e.id, carpeta: e.grupo, prompt: componerPrompt(e, "local"), width, height, seed: e.semilla ?? sd(e.id) };
    });
    const destino = path.join(DIR, "encargos-flux.json");
    fs.writeFileSync(destino, JSON.stringify(plano, null, 2));
    console.log(`✓ ${plano.length} encargos → ${path.relative(process.cwd(), destino)}`);
  } else if (cmd === "lote") {
    const r = await lote({
      archivo: o.archivo,
      solo: o.solo,
      desde: o.desde,
      max: o.max ? Number(o.max) : undefined,
      motores,
      borrador: !!o.borrador,
      rehacer: !!o.rehacer,
      simulacro: !!o.simulacro,
    });
    process.exitCode = r.fallidos.length ? 2 : 0;
  } else {
    console.log(AYUDA);
  }
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exitCode = 1;
}
