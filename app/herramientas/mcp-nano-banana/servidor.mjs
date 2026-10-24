#!/usr/bin/env node
/**
 * Invitoo · servidor MCP de imágenes (stdio).
 *
 * Herramientas: generar_imagen, editar_imagen, variaciones, lote_encargos y estado_motores.
 * Motores: ComfyUI local → Cloudflare Workers AI (gratis) → Gemini / Nano Banana Pro (de pago).
 * Claves: GEMINI_API_KEY, CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN, del entorno que pone
 * Claude Desktop (claude_desktop_config.json) o de app/.env.local. Nunca se devuelven ni se registran.
 */
// En stdio, stdout es el canal del protocolo: todo log va a stderr.
console.log = (...a) => console.error(...a);

import fs from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from "node:module";
import { generar, editar, lote, disponibilidad, cuotaCloudflare, ASPECTOS, APP, semillaDe } from "../imagenes/nucleo.mjs";

const sharp = createRequire(path.join(APP, "package.json"))("sharp");
const aspecto = z.enum(Object.keys(ASPECTOS)).default("4:5").describe("Proporción de la imagen");
const motor = z.enum(["auto", "local", "cloudflare", "gemini"]).default("auto")
  .describe("auto = local → cloudflare → gemini (o INVITOO_MOTORES)");

/** Vista previa ligera (JPEG 512 px) para que el cliente la muestre. */
async function vista(archivo) {
  const buf = await sharp(path.join(APP, archivo)).resize({ width: 512, height: 512, fit: "inside" }).jpeg({ quality: 78 }).toBuffer();
  return { type: "image", data: buf.toString("base64"), mimeType: "image/jpeg" };
}

function resumen(r) {
  return [
    `✓ ${r.archivo}`,
    `motor: ${r.motor} · modelo: ${r.modelo} · semilla: ${r.semilla} · aspecto: ${r.aspecto}`,
    `variantes: ${r.variantes.filter((v) => v.endsWith(".avif")).map((v) => "/" + v).join(", ")}`,
    r.neurons ? `Cloudflare: ~${r.neurons} neurons (hoy ${Math.round(cuotaCloudflare().neurons)}/${cuotaCloudflare().limite})` : "",
    "Recuerda: imagen generada con IA. En la web, indicadlo en las demos.",
  ].filter(Boolean).join("\n");
}

function fallo(e) {
  return { isError: true, content: [{ type: "text", text: e.message }] };
}

const motores = (m) => (m && m !== "auto" ? [m] : undefined);

const server = new McpServer({ name: "invitoo-imagenes", version: "1.0.0" });

server.registerTool(
  "generar_imagen",
  {
    title: "Generar imagen",
    description:
      "Genera una imagen nueva para Invitoo (foto editorial de boda, bodegón, textura…) y la guarda en app/public/generadas/<salida>.png con AVIF/WebP en varios anchos. Escribe el prompt en inglés, descriptivo. Personas siempre ficticias, sin texto ni logos.",
    inputSchema: {
      prompt: z.string().min(3).describe("Descripción en inglés"),
      aspecto,
      salida: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).optional().describe("id/nombre de archivo, p. ej. carta-pareja-01"),
      referencias: z.array(z.string()).max(6).optional().describe("Rutas de imágenes de referencia (coherencia de personas o estilo)"),
      motor,
      modelo: z.string().optional().describe("p. ej. gemini-3-pro-image, gemini-3.1-flash-image, @cf/black-forest-labs/flux-1-schnell"),
      semilla: z.number().int().nonnegative().optional(),
      borrador: z.boolean().default(false).describe("Modelos rápidos y baratos"),
      uso: z.string().optional().describe("Dónde se usará (queda en el catálogo)"),
    },
  },
  async (a) => {
    try {
      const r = await generar({
        id: a.salida || `img-${Date.now()}`,
        prompt: a.prompt,
        aspecto: a.aspecto,
        refs: a.referencias,
        motores: motores(a.motor),
        modelo: a.modelo,
        semilla: a.semilla,
        borrador: a.borrador,
        uso: a.uso,
      });
      return { content: [{ type: "text", text: resumen(r) }, await vista(r.archivo)] };
    } catch (e) {
      return fallo(e);
    }
  },
);

server.registerTool(
  "editar_imagen",
  {
    title: "Editar imagen",
    description: "Edita una imagen existente con una instrucción en lenguaje natural (Gemini o FLUX.2 klein). Conserva personas, encuadre y luz.",
    inputSchema: {
      imagen: z.string().describe("Ruta de la imagen (absoluta, relativa a app/ o a public/generadas)"),
      instruccion: z.string().min(3).describe("Qué cambiar, en inglés o español"),
      salida: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).optional(),
      motor: z.enum(["auto", "cloudflare", "gemini"]).default("auto"),
    },
  },
  async (a) => {
    try {
      const r = await editar({ id: a.salida, imagen: a.imagen, instruccion: a.instruccion, motores: motores(a.motor) });
      return { content: [{ type: "text", text: resumen(r) }, await vista(r.archivo)] };
    } catch (e) {
      return fallo(e);
    }
  },
);

server.registerTool(
  "variaciones",
  {
    title: "Variaciones",
    description: "Crea N variaciones de un prompt (semillas distintas) o de una imagen existente (misma escena, otro momento o encuadre).",
    inputSchema: {
      prompt: z.string().optional(),
      imagen: z.string().optional(),
      n: z.number().int().min(1).max(6).default(3),
      aspecto,
      salida: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).optional(),
      motor,
      borrador: z.boolean().default(true),
    },
  },
  async (a) => {
    if (!a.prompt && !a.imagen) return fallo(new Error("Indica «prompt» o «imagen»."));
    const base = a.salida || (a.imagen ? path.basename(a.imagen, path.extname(a.imagen)) : `var-${Date.now()}`);
    const out = [], vistas = [];
    try {
      for (let i = 1; i <= a.n; i++) {
        const r = a.imagen
          ? await editar({ id: `${base}-v${i}`, imagen: a.imagen, instruccion: ["a natural variation a few seconds later", "the same scene from a slightly different angle", "the same scene with a tighter framing"][(i - 1) % 3], motores: motores(a.motor) })
          : await generar({ id: `${base}-v${i}`, prompt: a.prompt, aspecto: a.aspecto, motores: motores(a.motor), semilla: semillaDe(base + i), borrador: a.borrador });
        out.push(r.archivo);
        vistas.push(await vista(r.archivo));
      }
      return { content: [{ type: "text", text: `✓ ${out.length} variaciones:\n${out.join("\n")}` }, ...vistas] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `${out.length ? `Hechas: ${out.join(", ")}\n` : ""}${e.message}` }, ...vistas] };
    }
  },
);

server.registerTool(
  "lote_encargos",
  {
    title: "Lote de encargos",
    description: "Genera los encargos de herramientas/imagenes/encargos.json (dirección de arte de Invitoo). Salta lo ya generado. Filtra con «solo» (id, prefijo o grupo) y «max».",
    inputSchema: {
      solo: z.array(z.string()).optional(),
      max: z.number().int().min(1).max(200).default(10),
      motor,
      borrador: z.boolean().default(false),
      simulacro: z.boolean().default(false).describe("Solo muestra qué haría"),
    },
  },
  async (a) => {
    try {
      const r = await lote({ solo: a.solo, max: a.max, motores: motores(a.motor), borrador: a.borrador, simulacro: a.simulacro });
      return { content: [{ type: "text", text: `Hechas: ${r.ok.join(", ") || "ninguna"}\nYa existían: ${r.saltados.length}\nPendientes: ${r.fallidos.join(", ") || "ninguna"}` }] };
    } catch (e) {
      return fallo(e);
    }
  },
);

server.registerTool(
  "estado_motores",
  { title: "Estado de los motores", description: "Qué motores están listos (ComfyUI local, Cloudflare, Gemini) y la cuota gratuita de hoy.", inputSchema: {} },
  async () => {
    const d = await disponibilidad();
    const c = cuotaCloudflare();
    const txt = Object.entries(d).map(([m, s]) => `${s.ok ? "✓" : "✗"} ${m}: ${s.ok ? s.nota || "listo" : s.motivo}`).join("\n");
    const cat = path.join(APP, "herramientas/imagenes/catalogo.json");
    const n = fs.existsSync(cat) ? JSON.parse(fs.readFileSync(cat, "utf8")).imagenes.length : 0;
    return { content: [{ type: "text", text: `${txt}\nCloudflare hoy: ${Math.round(c.neurons)}/${c.limite} neurons\nImágenes en el catálogo: ${n}` }] };
  },
);

await server.connect(new StdioServerTransport());
console.error("invitoo-imagenes MCP listo (stdio).");
