/**
 * El diseño de la pantalla del salón y de la página de subida: el estilo del
 * pase y los detalles de la boda. Es DATO puro: lo leen el servidor, el
 * control del panel, la vista previa y la web.
 *
 * Se guarda en `directo.diseno` (jsonb). Cualquier cosa que llegue se pasa
 * por `normalizarDiseno`: lo que no se entiende vuelve al valor de partida.
 */

export type EstiloPase = "revista" | "polaroid" | "cine" | "mosaico";

export type DisenoDirecto = {
  estilo: EstiloPase;
  /** Marco fino con las iniciales arriba y el sello abajo. */
  marco: boolean;
  /** La frase de la portada de bienvenida («Gracias por estar»…). */
  frase: string;
  /** Rótulo animado a pantalla completa al lanzar un momento. */
  rotulos: boolean;
  /** Mensajes como tarjetas escritas a mano (si no, tipográficas). */
  manuscritas: boolean;
};

export const ESTILOS_PASE: { id: EstiloPase; nombre: string; descripcion: string }[] = [
  { id: "revista", nombre: "Revista", descripcion: "Una foto o composiciones de dos y tres, con fundidos lentos." },
  { id: "polaroid", nombre: "Polaroid", descripcion: "Las fotos caen sobre la mesa y se apilan, con el nombre escrito a mano." },
  { id: "cine", nombre: "Cine", descripcion: "Pantalla panorámica y un Ken Burns lento, como en los créditos." },
  { id: "mosaico", nombre: "Mosaico", descripcion: "Un muro de fotos que se renueva de una en una." },
];

export const MAX_FRASE = 90;

export const DISENO_INICIAL: DisenoDirecto = {
  estilo: "revista",
  marco: true,
  frase: "Gracias por compartir este día con nosotros",
  rotulos: true,
  manuscritas: true,
};

export function esEstiloPase(x: unknown): x is EstiloPase {
  return x === "revista" || x === "polaroid" || x === "cine" || x === "mosaico";
}

export function normalizarDiseno(x: unknown): DisenoDirecto {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const frase =
    typeof o.frase === "string"
      ? o.frase.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_FRASE)
      : DISENO_INICIAL.frase;
  return {
    estilo: esEstiloPase(o.estilo) ? o.estilo : DISENO_INICIAL.estilo,
    marco: typeof o.marco === "boolean" ? o.marco : DISENO_INICIAL.marco,
    frase,
    rotulos: typeof o.rotulos === "boolean" ? o.rotulos : DISENO_INICIAL.rotulos,
    manuscritas: typeof o.manuscritas === "boolean" ? o.manuscritas : DISENO_INICIAL.manuscritas,
  };
}

/** «Carmen» y «Javier» → «C·J». Para el marco y el sello. */
export function iniciales(a: string, b: string) {
  const i = (s: string) => (s.trim().match(/\p{L}/u)?.[0] ?? "").toLocaleUpperCase("es-ES");
  return { a: i(a), b: i(b) };
}

/** El diseño en la URL de la vista previa (`?d=`): base64url de un JSON corto. */
export function disenoAParam(d: DisenoDirecto) {
  const json = JSON.stringify(d);
  const b64 =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function disenoDeParam(p: string | null | undefined): DisenoDirecto {
  if (!p || p.length > 800) return DISENO_INICIAL;
  try {
    const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? decodeURIComponent(escape(atob(b64)))
        : Buffer.from(b64, "base64").toString("utf8");
    return normalizarDiseno(JSON.parse(json));
  } catch {
    return DISENO_INICIAL;
  }
}

/** Los mensajes que se cruzan la vista previa y su iframe (postMessage). */
export const MENSAJE_DISENO = "invitoo:directo:diseno";
export const MENSAJE_FOTO = "invitoo:directo:foto";
