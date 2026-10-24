/**
 * Prueba rápida de extremo a extremo y capturas.
 *
 * Abre las OCHO invitaciones de muestra (las de `app/src/data/demo.ts`) con
 * un navegador de verdad, confirma asistencia con el RSVP nuevo (dos
 * personas, menú y alérgenos por persona, autobús) y deja el muro escrito.
 * Las capturas van a `_research/capturas/`.
 *
 *   BASE=http://localhost:3000 PANEL=/novios/<token> node herramientas/capturar.mjs
 *
 * Sin Supabase (`next dev` o `INVITOO_MEMORIA=1 next start`) el panel de
 * prueba es `/novios/demo-laura-y-ruben`. La batería completa de QA
 * (scroll horizontal, sin JS, OG, CSV, seguridad) está en `qa/qa.mjs`.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
// playwright vive en app/node_modules.
const { chromium } = createRequire(pathToFileURL(join(RAIZ, "app/package.json")).href)("playwright");

const BASE = process.env.BASE ?? "http://localhost:3000";
const SALIDA = join(RAIZ, "_research/capturas");
mkdirSync(SALIDA, { recursive: true });

/** Las bodas de muestra, sin compilar: demo.ts solo importa tipos. */
const BODAS = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--no-warnings",
      "--input-type=module",
      "-e",
      `const d = await import(${JSON.stringify(pathToFileURL(join(RAIZ, "app/src/data/demo.ts")).href)});
       process.stdout.write(JSON.stringify(Object.values(d.DEMO).map((b) => ({ slug: b.slug, plantilla: b.plantilla }))));`,
    ],
    { encoding: "utf8" },
  ),
);
const PRIMERA = BODAS[0].slug;
const PANEL = process.env.PANEL ?? `/novios/demo-${PRIMERA}`;

const nav = await chromium.launch();
const MOVIL = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const ESCRITORIO = { viewport: { width: 1440, height: 900 } };

/** Contexto con la apertura dada por vista: se entra directo a la portada. */
async function contexto(perfil, conApertura = false) {
  const ctx = await nav.newContext(perfil);
  if (!conApertura) {
    await ctx.addInitScript((slugs) => {
      try {
        for (const s of slugs) localStorage.setItem(`invitoo:abierta:${s}`, "1");
      } catch {}
    }, BODAS.map((b) => b.slug));
  }
  return ctx;
}

async function foto(ruta, nombre, perfil = ESCRITORIO, completa = true) {
  const ctx = await contexto(perfil);
  const pag = await ctx.newPage();
  await pag.goto(BASE + ruta, { waitUntil: "load" });
  if (completa) {
    // Las imágenes van con loading="lazy": se recorre la página antes.
    await pag.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 180));
      }
      scrollTo(0, 0);
    });
  }
  await pag.waitForTimeout(900);
  await pag.screenshot({ path: `${SALIDA}/${nombre}.png`, fullPage: completa });
  console.log("·", nombre);
  await ctx.close();
}

// ── RSVP nuevo: dos personas, menú y alérgenos por persona, autobús ─────────
{
  const ctx = await contexto(MOVIL);
  const pag = await ctx.newPage();
  await pag.goto(`${BASE}/i/${PRIMERA}#confirmar`, { waitUntil: "load" });
  const f = pag.locator("#confirmar form");
  await f.getByText("Sí, allí estaré").click();
  await pag.getByRole("button", { name: "Uno más" }).click();
  await f.locator('input[name="p0_nombre"]').fill("Marta Ibáñez");
  await f.locator('input[name="p1_nombre"]').fill("Pablo Ibáñez");
  await f.locator('label:has(input[name="p0_menu"][value="vegetariano"])').click();
  await f.locator('label:has(input[name="p1_menu"][value="infantil"])').click();
  const det = f.locator("details");
  await det.nth(0).locator("summary").click();
  await det.nth(0).locator('label:has(input[value="frutos_cascara"])').click();
  await det.nth(0).locator("textarea").fill("Celiaquía estricta");
  await det.nth(1).locator("summary").click();
  await det.nth(1).locator('label:has(input[value="lacteos"])').click();
  const bus = f.locator('label:has(input[name="bus"][value="ida_vuelta"])');
  if (await bus.count()) await bus.click();
  const parada = f.locator('input[name="parada"]');
  if (await parada.count()) await parada.fill("Plaza de España");
  await pag.screenshot({ path: `${SALIDA}/movil-rsvp.png`, fullPage: true });
  await f.locator('button[type="submit"]').click();
  await pag.waitForTimeout(2500);
  const titulo = await pag.locator("#confirmar h2").innerText();
  console.log("RSVP →", /Contamos con|Gracias/.test(titulo) ? "GUARDADO" : `FALLÓ: ${titulo}`);
  await pag.screenshot({ path: `${SALIDA}/movil-rsvp-ok.png` });

  // Muro
  await pag.fill("#muro-nombre", "Los primos de Cuenca");
  await pag.fill("#muro-mensaje", "Que no se os acabe nunca la paciencia ni la música.");
  await pag.getByRole("button", { name: "Enviar" }).click();
  await pag.waitForTimeout(2500);
  console.log("Muro →", (await pag.locator("body").innerText()).includes("Escrito") ? "GUARDADO" : "revisar");
  await ctx.close();
}

// ── Capturas ────────────────────────────────────────────────────────────────
await foto("/", "home");
await foto("/", "home-movil", MOVIL);
await foto("/plantillas", "plantillas");
await foto("/para-invitados", "para-invitados");
await foto(PANEL, "panel-novios");
await foto(PANEL, "panel-novios-movil", { ...MOVIL, deviceScaleFactor: 1 });
for (const b of BODAS) {
  await foto(`/i/${b.slug}`, `invitacion-${b.plantilla}`, MOVIL, false);
  await foto(`/i/${b.slug}`, `invitacion-${b.plantilla}-completa`, ESCRITORIO);
}

// Las aperturas en marcha (Sobre con vídeo, Registro y Azulejo sin vídeo).
for (const b of BODAS.filter((x) => ["sobre", "registro", "azulejo"].includes(x.plantilla))) {
  const ctx = await contexto(MOVIL, true);
  const pag = await ctx.newPage();
  await pag.goto(`${BASE}/i/${b.slug}`, { waitUntil: "load" });
  await pag.waitForTimeout(1400);
  await pag.screenshot({ path: `${SALIDA}/apertura-${b.plantilla}.png` });
  console.log("· apertura", b.plantilla);
  await ctx.close();
}

await foto("/entrar", "entrar", ESCRITORIO, false);
await nav.close();
console.log("listo");
