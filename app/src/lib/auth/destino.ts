/**
 * Adónde se vuelve después de entrar (`?siguiente=` o el antiguo `?volver=`).
 *
 * Solo caminos internos y conocidos: nada de `https://otro.com`, de
 * `//otro.com` ni de `/\otro.com` (algunos navegadores leen la barra invertida
 * como una barra). Si no encaja, se va al sitio por defecto. Así no hay
 * redirección abierta aunque alguien fabrique el enlace.
 *
 * Sin "server-only": lo usan también los formularios de cliente.
 */

const PANEL = /^\/panel(\/[a-z0-9-]+)*\/?$/;
const ESTUDIO = /^\/estudio(\/[\w-]+)*\/?$/;

function limpio(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length <= 200 && !s.includes("//") && !s.includes("\\") ? s : "";
}

/** `/panel` o `/panel/<slug>/<sección>`. */
export function destinoPanel(v: unknown): string {
  const s = limpio(v);
  return PANEL.test(s) ? s : "/panel";
}

/** `/estudio` o una de sus páginas. */
export function destinoEstudio(v: unknown): string {
  const s = limpio(v);
  return ESTUDIO.test(s) ? s : "/estudio";
}
