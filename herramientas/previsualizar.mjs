/**
 * Genera la vista previa de cada plantilla A PARTIR DE LA INVITACIÓN REAL.
 *
 * Antes la ficha del catálogo enseñaba un fotograma suelto del vídeo: un
 * banco con una planta, unas flores… cosas que no tenían nada que ver con
 * cómo queda la invitación. Quien miraba el catálogo no veía el diseño.
 *
 * Ahora se abre cada invitación con un navegador, se salta la puerta y se
 * fotografía su PORTADA: la foto de la pareja, sus nombres en su tipografía,
 * su guirnalda y su paleta. Lo que se ve en la ficha es exactamente lo que
 * recibe un invitado.
 *
 *   node herramientas/previsualizar.mjs
 *
 * Requiere el servidor de desarrollo levantado (npm run dev).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(pathToFileURL(join(RAIZ, "app/package.json")).href);
const { abrirNavegador } = await import("./navegador.mjs");

const BASE = process.env.BASE ?? "http://localhost:3000";
// Fuera de `public/`: escribir ahí dispara la recarga del servidor de
// desarrollo en mitad de la captura.
const TEMP = join(tmpdir(), "invitoo-previas");

const cat = readFileSync(join(RAIZ, "app/src/data/plantillas.ts"), "utf8");
const plantillas = [...cat.matchAll(/id: "([a-z]+)",\s*\n\s*demo: "([a-z0-9-]+)"/g)].map(
  ([, id, demo]) => ({ id, demo }),
);

console.log(`${plantillas.length} plantillas`);
rmSync(TEMP, { recursive: true, force: true });
mkdirSync(TEMP, { recursive: true });

const { nav, motor } = await abrirNavegador();
console.log(`  (navegador: ${motor})`);
const ctx = await nav.newContext({
  viewport: { width: 420, height: 746 },
  deviceScaleFactor: 2,
  isMobile: true,
  // Sin animaciones: se quiere el estado final, no un fotograma a medias.
  reducedMotion: "reduce",
});

for (const { id, demo } of plantillas) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/i/${demo}`, { waitUntil: "load", timeout: 40000 });
  await p.waitForTimeout(1200);

  const entrar = p.getByRole("button", { name: /Seguir sin m/i });
  if (await entrar.count()) await entrar.click();

  // NO se usa `img.decode()`: sobre una imagen con loading="lazy" que aún no
  // ha empezado a cargar, esa promesa NO SE RESUELVE NUNCA y el script se
  // queda colgado para siempre. Con esperar a que la portada esté pintada
  // sobra, que es lo único que se fotografía.
  await p.waitForTimeout(2200);

  // El distintivo de Next en desarrollo es un círculo oscuro que se colaba
  // en las previas del catálogo. Se oculta solo para la foto.
  await p.addStyleTag({
    content: "nextjs-portal,[data-next-badge-root],[data-nextjs-toast]{display:none!important}",
  });
  await p.waitForTimeout(200);

  const png = join(TEMP, `${id}.png`);
  await p.locator("section").first().screenshot({ path: png, timeout: 20000 });
  await p.close();

  const destino = join(RAIZ, "app/public/aperturas", id, "poster.avif");
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-i", png,
    "-vf", "scale=720:-1:flags=lanczos",
    // `-cpu-used 8` es imprescindible: por defecto libaom tarda minutos por
    // imagen a este tamaño.
    "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "34", "-cpu-used", "8",
    destino,
  ]);

  const kb = Math.round(readFileSync(destino).length / 1024);
  console.log(`  ${id.padEnd(13)} ${String(kb).padStart(4)} KB  ← /i/${demo}`);
}

await nav.close();
rmSync(TEMP, { recursive: true, force: true });
console.log("\nlas fichas enseñan ya la invitación de verdad");
