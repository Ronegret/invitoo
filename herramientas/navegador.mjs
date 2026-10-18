/**
 * De dónde sale el navegador con el que se verifica todo.
 *
 * Playwright trae su propio Chromium, y era lo que usábamos. Dejó de
 * funcionar de un día para otro con este error:
 *
 *   browserType.launch: spawn UNKNOWN
 *   → «Una directiva de Control de aplicaciones bloqueó este archivo»
 *
 * Windows App Control (Smart App Control / WDAC) bloquea
 * `chrome-headless-shell.exe` porque no está firmado por un editor de su
 * lista. No es un fallo de Playwright ni algo que se arregle reinstalando:
 * la política puede volver a activarse en cualquier momento, y entonces se
 * queda uno sin poder revisar nada.
 *
 * Por eso esto: se prueba con lo que haya instalado en la máquina —el Chrome
 * o el Edge de verdad, que sí están firmados y permitidos— y solo como
 * último recurso con el Chromium de Playwright.
 *
 * Uso:
 *   import { abrirNavegador } from "./navegador.mjs";
 *   const { nav, motor } = await abrirNavegador();
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Playwright vive en app/node_modules, no en la raíz. */
export const req = createRequire(
  pathToFileURL(join(RAIZ, "app/package.json")).href,
);

/** En orden de preferencia: primero lo que el sistema ya permite ejecutar. */
const CANDIDATOS = [
  { nombre: "chrome del sistema", opciones: { channel: "chrome" } },
  { nombre: "edge del sistema", opciones: { channel: "msedge" } },
  { nombre: "chromium de playwright", opciones: {} },
];

export async function abrirNavegador(extra = {}) {
  const { chromium } = req("playwright");
  const fallos = [];
  for (const { nombre, opciones } of CANDIDATOS) {
    try {
      const nav = await chromium.launch({ ...opciones, ...extra });
      return { nav, motor: nombre };
    } catch (e) {
      fallos.push(`${nombre}: ${String(e.message ?? e).split("\n")[0]}`);
    }
  }
  throw new Error(
    "No hay ningún navegador que se pueda abrir.\n  " + fallos.join("\n  "),
  );
}

export { RAIZ };
