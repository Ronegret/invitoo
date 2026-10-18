/**
 * Prueba de extremo a extremo y capturas.
 * Abre la web con un navegador de verdad, rellena el RSVP y el muro contra
 * Supabase, y guarda las pantallas para poder mirarlas.
 */
// playwright vive en app/node_modules.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
// playwright vive en app/node_modules.
const { chromium } = createRequire(pathToFileURL(join(RAIZ, "app/package.json")).href)("playwright");
import { createHash } from "node:crypto";

const BASE = "http://localhost:3000";
const SALIDA = join(RAIZ, "_research/capturas");
const PANEL = "/novios/229c0acc9a2af0c770";

const { nav, motor } = await abrirNavegador();
console.log(`  (navegador: ${motor})`);

async function foto(ruta, nombre, { movil = false, completa = true, antes } = {}) {
  const ctx = await nav.newContext(
    movil
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  );
  const pag = await ctx.newPage();
  await pag.goto(BASE + ruta, { waitUntil: "load" });
  if (antes) await antes(pag);
  // Las imágenes van con loading="lazy": sin recorrer la página, una captura
  // de página completa las pilla sin cargar y sale medio vacía.
  if (completa) {
    await pag.evaluate(async () => {
      const paso = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += paso) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 180));
      }
      window.scrollTo(0, 0);
    });
    await pag.waitForTimeout(900);
  }
  await pag.waitForTimeout(700);
  await pag.screenshot({ path: `${SALIDA}/${nombre}.png`, fullPage: completa });
  console.log("·", nombre);
  await ctx.close();
}

// ── Prueba real del RSVP ────────────────────────────────────────────────────
{
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pag = await ctx.newPage();
  await pag.goto(`${BASE}/i/laura-y-ruben`, { waitUntil: "load" });

  // La apertura tapa la página: se salta, como haría cualquiera.
  const saltar = pag.getByRole("button", { name: "Saltar" });
  if (await saltar.count()) await saltar.click();
  await pag.waitForTimeout(900);
  await pag.screenshot({ path: `${SALIDA}/movil-portada.png` });

  await pag.getByRole("link", { name: /Confirmar asistencia/i }).click();
  await pag.waitForTimeout(600);

  // OJO: en la página hay DOS campos llamados "nombre" — el del muro y el del
  // RSVP. Hay que acotar al formulario o se rellena el que no es.
  const rsvp = pag.locator('form:has(input[name="asiste"])');
  await rsvp.locator('input[name="nombre"]').fill("Marta Ibáñez");
  // Se pulsa como pulsaría una persona: sobre la etiqueta, no sobre el input.
  await rsvp.getByText("Sí, allí estaré").click();
  await pag.waitForTimeout(400);
  await rsvp.locator('input[name="acompanantes"]').fill("2");
  await rsvp.getByText("Vegetariano", { exact: true }).click();
  await rsvp.locator('textarea[name="alergias"]').fill("Alérgica a los frutos secos");
  await rsvp.getByText("Cogeré el autobús que ponéis").click();
  await pag.screenshot({ path: `${SALIDA}/movil-rsvp.png`, fullPage: true });

  await rsvp.getByRole("button", { name: /^Confirmar$/ }).click();
  await pag.waitForTimeout(2500);
  const texto = await pag.locator("body").innerText();
  console.log("RSVP →", texto.includes("Contamos contigo") ? "GUARDADO" : "FALLÓ: " + texto.slice(0, 160));
  await pag.screenshot({ path: `${SALIDA}/movil-rsvp-ok.png` });

  // Muro
  await pag.goto(`${BASE}/i/laura-y-ruben`, { waitUntil: "load" });
  await pag.fill("#muro-nombre", "Los primos de Cuenca");
  await pag.fill("#muro-mensaje", "Que no se os acabe nunca la paciencia ni la música. Nos vemos en la pista.");
  await pag.getByRole("button", { name: "Enviar" }).click();
  await pag.waitForTimeout(2500);
  const t2 = await pag.locator("body").innerText();
  console.log("Muro →", t2.includes("Escrito") ? "GUARDADO" : "FALLÓ");
  await ctx.close();
}

// ── Capturas ────────────────────────────────────────────────────────────────
await foto("/", "home");
await foto("/", "home-movil", { movil: true });
await foto("/para-invitados", "para-invitados");
await foto(PANEL, "panel-novios");
await foto(PANEL, "panel-novios-movil", { movil: true });

// La invitación, sin la capa de apertura por encima.
await foto("/i/laura-y-ruben", "invitacion", {
  antes: async (p) => {
    const b = p.getByRole("button", { name: "Saltar" });
    if (await b.count()) await b.click();
    await p.waitForTimeout(800);
  },
});

// La apertura en marcha.
await foto("/i/laura-y-ruben", "apertura", {
  movil: true, completa: false,
  antes: async (p) => await p.waitForTimeout(3800),
});

// El estudio, con su cookie.
{
  const huella = createHash("sha256").update("invitoo-estudio-2026-cambiar-esto").digest("hex");
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: "invitoo_estudio", value: huella, url: BASE + "/estudio" }]);
  const pag = await ctx.newPage();
  await pag.goto(`${BASE}/estudio`, { waitUntil: "load" });
  await pag.screenshot({ path: `${SALIDA}/estudio.png`, fullPage: true });
  console.log("· estudio");
  const id = await pag.getByRole("link", { name: "Editar" }).first().getAttribute("href");
  await pag.goto(BASE + id, { waitUntil: "load" });
  await pag.screenshot({ path: `${SALIDA}/estudio-editor.png`, fullPage: true });
  console.log("· estudio-editor");
  await ctx.close();
}

await foto("/entrar", "entrar", { completa: false });
await nav.close();
console.log("listo");
