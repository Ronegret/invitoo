/**
 * Revisión automática de la web entera.
 *
 * Dos partes:
 *
 *  1. EL CATÁLOGO, sin navegador (lee src/data/plantillas.ts y
 *     src/plantillas/color.ts con el quitatipos de Node):
 *       · que están las 9 plantillas de la casa (más las temáticas de
 *         src/plantillas/tematicas, si las hay),
 *       · que todos los ids antiguos (alias) resuelven a una plantilla que
 *         existe, y los slugs de demo antiguos a una demo que existe,
 *       · que no hay dos plantillas con la misma fuente de display Y el
 *         mismo papel (si las hay, son la misma plantilla repintada),
 *       · que cada variante tiene 3 colores con contraste AA: tinta/papel,
 *         acento-texto/papel y sobre-acento/acento. Imprime la tabla.
 *
 *  2. LAS PÁGINAS, con un navegador de verdad: las públicas y las ocho
 *     invitaciones de muestra (h1 único, sin desbordes, nada invisible,
 *     orden de secciones distinto entre plantillas) y que los slugs de
 *     demo antiguos siguen respondiendo.
 *
 * Uso:  node herramientas/revisar.mjs [http://localhost:3000]
 *       node herramientas/revisar.mjs --catalogo     (solo la parte 1)
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOLO_CATALOGO = process.argv.includes("--catalogo");
const BASE = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "http://localhost:3000";

const PAGINAS = ["/", "/plantillas", "/servicios", "/precios", "/preguntas"];
const fallos = [];
const nota = (donde, que) => fallos.push(`${donde}: ${que}`);

// ---------------------------------------------------------------- catálogo
/**
 * Se evalúa en un Node hijo con `--experimental-strip-types`: los dos
 * archivos solo importan tipos, así que se leen tal cual, sin compilar.
 */
function leerCatalogo() {
  const url = (r) => pathToFileURL(join(RAIZ, "app/src", r)).href;
  const codigo = `
    const cat = await import(${JSON.stringify(url("data/plantillas.ts"))});
    const color = await import(${JSON.stringify(url("plantillas/color.ts"))});
    let demo = { ALIAS_DEMOS: {}, slugs: [] };
    try {
      const d = await import(${JSON.stringify(url("data/demo.ts"))});
      demo = { ALIAS_DEMOS: d.ALIAS_DEMOS, slugs: Object.keys(d.DEMO) };
    } catch (e) { demo.error = String(e); }
    const filas = [];
    for (const p of cat.PLANTILLAS) for (const v of p.variantes) {
      const acentoTexto = color.acentoLegible(v.acento, v.papel, v.tinta);
      const sobre = color.sobreAcento(v.acento);
      filas.push({ id: p.id, variante: v.id, papel: v.papel, acento: v.acento, acentoTexto, sobre,
        tintaPapel: color.contraste(v.tinta, v.papel),
        acentoPapel: color.contraste(acentoTexto, v.papel),
        sobreAcento: color.contraste(sobre, v.acento) });
    }
    const alias = Object.fromEntries(Object.keys(cat.ALIAS_PLANTILLAS).map((k) => [k, cat.resolverPlantillaId(k)]));
    console.log(JSON.stringify({
      plantillas: cat.PLANTILLAS.map((p) => ({ id: p.id, display: p.tipografia.display, papel: p.tema.papel, demo: p.demo })),
      alias, filas, demo,
    }));
  `;
  const salida = execFileSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", codigo],
    { encoding: "utf8" },
  );
  return JSON.parse(salida);
}

const cat = leerCatalogo();
const ids = new Set(cat.plantillas.map((p) => p.id));

const CASA = ["carta", "sobre", "floracion", "mar", "velo", "constelacion", "tinta", "registro", "azulejo"];
for (const id of CASA) if (!ids.has(id)) nota("catálogo", `falta la plantilla de la casa «${id}»`);
if (new Set(cat.plantillas.map((p) => p.id)).size !== cat.plantillas.length) nota("catálogo", "hay ids de plantilla repetidos");

for (const [viejo, nuevo] of Object.entries(cat.alias)) {
  if (!ids.has(nuevo)) nota("catálogo", `el alias «${viejo}» resuelve a «${nuevo}», que no existe`);
}
for (const id of ["jardin", "cielo", "marea", "lino", "bruma", "terracota", "brasa"]) {
  if (!(id in cat.alias)) nota("catálogo", `falta el alias del id antiguo «${id}»`);
}

const vistas = new Map();
for (const p of cat.plantillas) {
  const clave = `${p.display.toLowerCase()}|${p.papel.toLowerCase()}`;
  if (vistas.has(clave)) nota("catálogo", `${p.id} y ${vistas.get(clave)} comparten fuente de display (${p.display}) y papel (${p.papel})`);
  vistas.set(clave, p.id);
  if (!cat.demo.error && !cat.demo.slugs.includes(p.demo)) nota("catálogo", `${p.id}: su demo «${p.demo}» no está en data/demo.ts`);
}
if (cat.demo.error) nota("catálogo", `no se pudo leer data/demo.ts: ${cat.demo.error}`);
for (const [viejo, { slug }] of Object.entries(cat.demo.ALIAS_DEMOS ?? {})) {
  if (!cat.demo.slugs.includes(slug)) nota("catálogo", `el slug antiguo «${viejo}» apunta a «${slug}», que no existe`);
}

const f2 = (n) => n.toFixed(2).padStart(5);
console.log("\n  Contraste (AA = 4.50)            tinta/papel  acento-texto/papel  sobre/acento");
for (const r of cat.filas) {
  const malo = Math.min(r.tintaPapel, r.acentoPapel, r.sobreAcento) < 4.5;
  if (malo) nota("contraste", `${r.id}/${r.variante} no llega a AA`);
  console.log(
    `  ${(r.id + "/" + r.variante).padEnd(26)} ${r.acentoTexto} ${f2(r.tintaPapel)}        ${f2(r.acentoPapel)}             ${f2(r.sobreAcento)}${malo ? "  ✗" : ""}`,
  );
}

const DEMOS = cat.plantillas.map((p) => [p.id, p.demo]);
const DEMOS_ANTIGUAS = Object.keys(cat.demo.ALIAS_DEMOS ?? {});

if (SOLO_CATALOGO) {
  console.log("\n" + "-".repeat(62));
  if (fallos.length === 0) console.log(`Catálogo sin fallos: ${cat.plantillas.length} plantillas, ${cat.filas.length} variantes.`);
  else {
    console.log(`${fallos.length} fallos:`);
    for (const f of fallos) console.log(`  · ${f}`);
    process.exitCode = 1;
  }
  process.exit();
}

const { abrirNavegador } = await import("./navegador.mjs");

const { nav: navegador, motor } = await abrirNavegador();
console.log(`  (navegador: ${motor})`);
const ctx = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

/** Lo común a cualquier página: h1 único, sin desbordes, nada invisible. */
async function auditar(pagina, donde) {
  const h1 = await pagina.locator("h1").count();
  if (h1 !== 1) nota(donde, `${h1} elementos <h1> (debe haber exactamente 1)`);

  const ancho = await pagina.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (ancho > 2) nota(donde, `se desborda ${ancho}px a lo ancho`);

  const invisibles = await pagina.evaluate(() => {
    const dentro = (n) => {
      const r = n.getBoundingClientRect();
      return r.height > 40 && r.top < document.body.scrollHeight;
    };
    return [...document.querySelectorAll("section, article, li")]
      .filter((n) => dentro(n) && getComputedStyle(n).opacity === "0").length;
  });
  if (invisibles > 0) nota(donde, `${invisibles} bloques quedan en opacity:0`);
}

// ---------------------------------------------------------------- páginas
for (const ruta of PAGINAS) {
  const pagina = await ctx.newPage();
  const r = await pagina.goto(BASE + ruta, { waitUntil: "networkidle" });
  if (!r || r.status() >= 400) {
    nota(ruta, `responde ${r ? r.status() : "sin respuesta"}`);
    await pagina.close();
    continue;
  }
  // Bajar del todo, que es lo que dispara las apariciones.
  //
  // `behavior: "instant"` NO es un detalle. La hoja de estilos pone
  // `scroll-behavior: smooth` en <html>, así que un `scrollTo(0, y)` a secas
  // arranca una animación: con 60 ms entre salto y salto no llega ni a la
  // mitad antes de que se le pida el siguiente, y el recorrido entero de
  // 15.000 px se quedaba en 700. O sea: esta revisión llevaba tiempo
  // mirando solo la primera pantalla y diciendo que todo bien.
  await pagina.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((s) => setTimeout(s, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  // Lo bastante para que termine cualquier escena con guion —la más larga
  // es la conversación de la home, 3,4 s—. Lo que siga invisible después de
  // esto está atascado de verdad, que es lo que se busca.
  await pagina.waitForTimeout(3600);
  await auditar(pagina, ruta);
  const titulo = await pagina.title();
  if (!titulo || titulo.length < 8) nota(ruta, `título pobre: "${titulo}"`);
  console.log(`  ${ruta.padEnd(14)} ${titulo}`);
  await pagina.close();
}

// ----------------------------------------------------------- invitaciones
const huellas = new Map();

for (const [id, slug] of DEMOS) {
  const pagina = await ctx.newPage();
  const donde = `/i/${slug} (${id})`;
  const r = await pagina.goto(`${BASE}/i/${slug}`, { waitUntil: "networkidle" });
  if (!r || r.status() >= 400) {
    nota(donde, `responde ${r ? r.status() : "sin respuesta"}`);
    await pagina.close();
    continue;
  }

  // Saltarse la apertura: el vídeo y la puerta tapan la invitación.
  await pagina.evaluate((s) => {
    sessionStorage.setItem(`invitoo:abierta:${s}`, "1");
  }, slug);
  await pagina.reload({ waitUntil: "networkidle" });

  await pagina.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((s) => setTimeout(s, 50));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await pagina.waitForTimeout(500);
  await auditar(pagina, donde);

  // La huella: los títulos de sección en el orden en que aparecen. Dos
  // plantillas con la misma huella son la misma plantilla.
  const huella = await pagina.evaluate(() =>
    [...document.querySelectorAll("h2")]
      .map((n) => (n.textContent || "").trim().toLowerCase())
      .filter(Boolean)
      .join(" > "),
  );
  const secciones = huella ? huella.split(" > ").length : 0;
  const gemela = [...huellas.entries()].find(([, h]) => h === huella);
  if (gemela) nota(donde, `mismo orden de secciones que ${gemela[0]}`);
  huellas.set(id, huella);
  console.log(`  ${id.padEnd(13)} ${String(secciones).padStart(2)} secciones  ${huella.slice(0, 68)}`);
  await pagina.close();
}

// Los enlaces de demo antiguos (de plantillas fusionadas) siguen vivos.
for (const slug of DEMOS_ANTIGUAS) {
  const pagina = await ctx.newPage();
  const r = await pagina.goto(`${BASE}/i/${slug}`, { waitUntil: "domcontentloaded" });
  if (!r || r.status() >= 400) nota(`/i/${slug}`, `slug antiguo responde ${r ? r.status() : "sin respuesta"}`);
  await pagina.close();
}

await navegador.close();

console.log("\n" + "-".repeat(62));
if (fallos.length === 0) {
  console.log(`Sin fallos. Catálogo, ${PAGINAS.length} páginas, ${DEMOS.length} invitaciones y ${DEMOS_ANTIGUAS.length} enlaces antiguos revisados.`);
} else {
  console.log(`${fallos.length} fallos:`);
  for (const f of fallos) console.log(`  · ${f}`);
  process.exitCode = 1;
}
