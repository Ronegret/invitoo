#!/usr/bin/env node
/**
 * Invitoo · genera los encargos GRATIS en tu PC con ComfyUI (Pinokio) y FLUX.2 klein 4B (o FLUX.1 schnell).
 *
 *   node herramientas/imagenes/local-comfyui.mjs                 → todos los encargos pendientes
 *   node herramientas/imagenes/local-comfyui.mjs --solo carta    → solo un grupo o prefijo
 *   node herramientas/imagenes/local-comfyui.mjs --flujo flux-schnell-fp8   (otro flujo de flujos/; por defecto flux2-klein-4b)
 *   node herramientas/imagenes/local-comfyui.mjs --copiar-a "C:\Users\rodri\Desktop\Invitoo\imagenes-ia"   (copia por categoría)
 *   node herramientas/imagenes/local-comfyui.mjs --y-nube        → si ComfyUI no puede, sigue con Cloudflare y Gemini
 *
 * Guarda en app/public/generadas/<id>.png (+ AVIF/WebP) y lo anota en catalogo.json.
 * Lo que ya existe se salta: puedes cortarlo y relanzarlo cuando quieras.
 */
import { lote, disponibilidad } from "./nucleo.mjs";

const argv = process.argv.slice(2);
const val = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
if (val("--flujo")) process.env.INVITOO_COMFY_FLUJO = val("--flujo");
if (val("--url")) process.env.COMFYUI_URL = val("--url");
if (val("--copiar-a")) process.env.INVITOO_COPIAR_A = val("--copiar-a");

const d = await disponibilidad();
if (!d.local.ok && !argv.includes("--y-nube")) {
  console.error(`✗ ${d.local.motivo}\n  Abre Pinokio → ComfyUI → Start, espera a que cargue y vuelve a ejecutar.`);
  process.exit(1);
}
const motores = argv.includes("--y-nube") ? ["local", "cloudflare", "gemini"] : ["local"];
const r = await lote({
  solo: val("--solo") ? val("--solo").split(",") : undefined,
  max: val("--max") ? Number(val("--max")) : undefined,
  motores,
  rehacer: argv.includes("--rehacer"),
});
process.exitCode = r.fallidos.length ? 2 : 0;
