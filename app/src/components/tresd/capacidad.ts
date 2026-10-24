/**
 * ¿Merece este dispositivo el 3D? Si no, se queda la versión CSS (que es
 * buena y es la de siempre). No se monta nada de three.js si:
 *  · no hay WebGL (o el contexto falla);
 *  · `prefers-reduced-motion: reduce`;
 *  · ahorro de datos o red 2G;
 *  · gama baja: `deviceMemory` ≤ 2, o `hardwareConcurrency` ≤ 4 en táctil
 *    (solo en Chromium, ver abajo);
 *  · `?sin3d` en la URL (para probar el respaldo) — y `?con3d` lo fuerza.
 *
 * Los FPS se miden después, en los 2 primeros segundos de animación
 * (`MedidorFps`): si van por debajo de 30, el canvas se retira solo.
 */

let cache: boolean | null = null;

export function motivoSin3D(): string | null {
  if (typeof window === "undefined") return "servidor";
  const q = new URLSearchParams(window.location.search);
  if (q.has("sin3d")) return "url";
  if (q.has("con3d")) return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced-motion";
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData) return "ahorro-datos";
  if (/^(slow-)?2g$/.test(nav.connection?.effectiveType ?? "")) return "red-lenta";
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return "memoria";
  // Núcleos: solo donde el navegador dice la verdad (Chromium, que también
  // expone deviceMemory). Safari en iOS no da deviceMemory y redondea los
  // núcleos a la baja: ahí manda la medición de FPS, no esta cifra, o todos
  // los iPhone se quedarían sin 3D.
  const tactil = window.matchMedia("(pointer: coarse)").matches;
  if (tactil && typeof nav.deviceMemory === "number" && (nav.hardwareConcurrency ?? 8) <= 4) return "nucleos";
  if (!hayWebGL()) return "sin-webgl";
  return null;
}

export function puede3D() {
  if (cache === null) cache = motivoSin3D() === null;
  return cache;
}

function hayWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Para cuando el canvas pide retirarse (FPS bajos): no se vuelve a probar. */
export function marcarSin3D() {
  cache = false;
}

/**
 * Llama a `fn` cuando la página está ociosa y `el` está (casi) a la vista.
 * Devuelve la función que lo cancela.
 */
export function cuandoOciosoYVisible(el: Element, fn: () => void, margen = "200px") {
  let hecho = false;
  let ocioso = 0;
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const obs = new IntersectionObserver(
    (es) => {
      if (hecho || !es.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      const ya = () => {
        if (hecho) return;
        hecho = true;
        fn();
      };
      if (w.requestIdleCallback) ocioso = w.requestIdleCallback(ya, { timeout: 1500 });
      else ocioso = window.setTimeout(ya, 200);
    },
    { rootMargin: margen },
  );
  obs.observe(el);
  return () => {
    hecho = true;
    obs.disconnect();
    if (w.cancelIdleCallback) w.cancelIdleCallback(ocioso);
    else clearTimeout(ocioso);
  };
}

/** `?con3d`: fuerza el 3D y no se retira por FPS (para QA con SwiftShader). */
export function forzado3D() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("con3d");
}
