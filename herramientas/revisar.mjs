/**
 * Revisión automática de la web entera.
 *
 * Abre con un navegador de verdad las cinco páginas públicas y las doce
 * invitaciones de muestra, y comprueba lo que no se ve leyendo el código:
 *
 *  · que cada página responde y pinta algo,
 *  · que hay UN solo <h1> por página (lo rompimos ya una vez),
 *  · que ninguna se desborda a lo ancho en móvil,
 *  · que no queda ningún bloque invisible por una animación que no disparó,
 *  · y —lo importante hoy— que las doce invitaciones tienen ORDEN DE
 *    SECCIONES DISTINTO entre sí. Si dos comparten la misma secuencia, las
 *    dos plantillas son la misma cosa repintada, y eso es justo lo que
 *    había que arreglar.
 *
 * Uso:  node herramientas/revisar.mjs [http://localhost:3000]
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Playwright vive en app/node_modules; esto lo resuelve desde ahí sin que
// importe desde qué carpeta se lance la herramienta.
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(pathToFileURL(join(RAIZ, "app/package.json")).href);
const { abrirNavegador } = await import("./navegador.mjs");

const BASE = process.argv[2] ?? "http://localhost:3000";

const PAGINAS = ["/", "/plantillas", "/servicios", "/precios", "/preguntas"];
const DEMOS = [
  ["sobre", "laura-y-ruben"],
  ["floracion", "nora-y-sebas"],
  ["cielo", "sara-y-marcos"],
  ["velo", "claudia-y-jorge"],
  ["constelacion", "yone-y-noe"],
  ["bruma", "frank-y-nico"],
  ["marea", "elena-y-pau"],
  ["terracota", "irene-y-dani"],
  ["tinta", "marta-y-alvaro"],
  ["jardin", "lucia-y-tomas"],
  ["lino", "julia-y-hector"],
  ["brasa", "carmen-y-ivan"],
];

const fallos = [];
const nota = (donde, que) => fallos.push(`${donde}: ${que}`);

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

await navegador.close();

console.log("\n" + "-".repeat(62));
if (fallos.length === 0) {
  console.log(`Sin fallos. ${PAGINAS.length} páginas y ${DEMOS.length} invitaciones revisadas.`);
} else {
  console.log(`${fallos.length} fallos:`);
  for (const f of fallos) console.log(`  · ${f}`);
  process.exitCode = 1;
}
