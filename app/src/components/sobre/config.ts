import type { AjustesDelSobre, Bloque, ColorLacre, ForroSobre, Invitacion } from "@/lib/tipos";

/**
 * El sobre de papel: qué se puede elegir y qué trae cada plantilla.
 *
 * Isomorfo y sin dependencias de ejecución: lo usan la apertura (servidor),
 * `AjustesSobre` (cliente, vista previa en vivo) y la server action que
 * guarda `tema.sobre`.
 */

export const FORROS: { id: ForroSobre; nombre: string }[] = [
  { id: "olivo", nombre: "Olivo" },
  { id: "azulejo", nombre: "Azulejo" },
  { id: "moare", nombre: "Moaré" },
  { id: "rayas", nombre: "Rayas finas" },
  { id: "constelacion", nombre: "Constelación" },
  { id: "lino", nombre: "Lino" },
  { id: "floral", nombre: "Flor menuda" },
  { id: "damasco", nombre: "Damasco" },
  { id: "cuadros", nombre: "Ventana" },
  { id: "liso", nombre: "Liso" },
];

/** Las ceras. `luz` y `sombra` modelan el relieve; `grabado`, lo hundido. */
export const CERAS: Record<ColorLacre, { nombre: string; base: string; luz: string; sombra: string; grabado: string }> = {
  granate: { nombre: "Granate", base: "#7d1a29", luz: "#b94a58", sombra: "#3a0911", grabado: "#4d0e19" },
  oro: { nombre: "Oro", base: "#a9844c", luz: "#ead29c", sombra: "#5c421b", grabado: "#6f5224" },
  verde: { nombre: "Verde bosque", base: "#24443a", luz: "#5f8c78", sombra: "#0b1a14", grabado: "#12271f" },
  noche: { nombre: "Azul noche", base: "#1f2c47", luz: "#5a6f9e", sombra: "#0a1020", grabado: "#111a2e" },
};
export const COLORES_LACRE = Object.keys(CERAS) as ColorLacre[];

/** Papeles de sobre sugeridos en el selector (cualquier hex vale). */
export const PAPELES: { color: string; nombre: string }[] = [
  { color: "#efe6d6", nombre: "Marfil" },
  { color: "#f4efe6", nombre: "Algodón" },
  { color: "#e6d6bd", nombre: "Kraft claro" },
  { color: "#e9dcd6", nombre: "Rosa empolvado" },
  { color: "#dfe3d8", nombre: "Salvia" },
  { color: "#d9dde6", nombre: "Bruma azul" },
];

/** Tintes de forro sugeridos. */
export const TINTES: { color: string; nombre: string }[] = [
  { color: "#1f3a2e", nombre: "Bosque" },
  { color: "#6e1f2b", nombre: "Granate" },
  { color: "#1c2840", nombre: "Noche" },
  { color: "#b08d57", nombre: "Oro" },
  { color: "#3d5a80", nombre: "Azulejo" },
  { color: "#8a8f7a", nombre: "Olivo gris" },
];

/** Todo resuelto: lo que pinta el sobre. */
export type SobreResuelto = {
  forro: ForroSobre;
  forroColor: string;
  papel: string;
  lacre: "iniciales" | "alianzas";
  lacreColor: ColorLacre;
  matasellos: boolean;
  ciudad: string;
  /** «3d» si la boda lo pide y el navegador puede (lo decide `SobreVivo`). */
  modo: "papel" | "3d";
};

type Recomendado = Omit<SobreResuelto, "ciudad">;

const BASE: Recomendado = {
  forro: "liso",
  forroColor: "#6e1f2b",
  papel: "#efe6d6",
  lacre: "iniciales",
  lacreColor: "granate",
  matasellos: true,
  modo: "papel",
};

/** Lo que trae cada plantilla. Las que no están: `BASE`, con el forro del acento. */
export const SOBRE_POR_PLANTILLA: Record<string, Partial<Recomendado>> = {
  sobre: { forro: "moare", forroColor: "#7a1c2b", papel: "#efe5d5", lacre: "iniciales", lacreColor: "granate" },
  carta: { forro: "olivo", forroColor: "#1f3a2e", papel: "#f1e8d7", lacre: "iniciales", lacreColor: "oro" },
};

/** Variantes de catálogo que cambian el tinte del forro (Carta). */
const FORRO_POR_VARIANTE: Record<string, Record<string, string>> = {
  carta: { bosque: "#1f3a2e", granate: "#6e1f2b", noche: "#1c2840" },
};

/** Plantillas que abren con el sobre si la boda no dice lo contrario. */
const CON_SOBRE = new Set(["sobre", "carta"]);

/** ¿Esta boda abre con el sobre de papel? */
export function usaSobre(inv: Pick<Invitacion, "plantilla" | "tema">): boolean {
  const activo = inv.tema?.sobre?.activo;
  if (activo === true) return true;
  if (activo === false) return false;
  return CON_SOBRE.has(String(inv.plantilla));
}

export function sobreRecomendado(inv: Pick<Invitacion, "plantilla" | "tema">): Recomendado {
  const id = String(inv.plantilla);
  const propio = SOBRE_POR_PLANTILLA[id];
  const r: Recomendado = { ...BASE, ...(propio ?? { forroColor: inv.tema?.acento || BASE.forroColor }) };
  const porVariante = inv.tema?.variante ? FORRO_POR_VARIANTE[id]?.[inv.tema.variante] : undefined;
  if (porVariante) r.forroColor = porVariante;
  return r;
}

/** «Calle…, 28030 Madrid» → «Madrid». */
export function ciudadDe(bloques: Bloque[] | undefined): string {
  const it = bloques?.find((b) => b.t === "itinerario");
  const dir = it && it.t === "itinerario" ? it.paradas[0]?.direccion : "";
  if (!dir) return "";
  const cp = dir.match(/\b\d{5}\s+([^,]+?)\s*$/);
  const ciudad = cp ? cp[1] : dir.split(",").pop() ?? "";
  return ciudad.trim().slice(0, 28);
}

export function resolverSobre(inv: Pick<Invitacion, "plantilla" | "tema" | "bloques">): SobreResuelto {
  const r = sobreRecomendado(inv);
  const g = limpiarSobre(inv.tema?.sobre);
  return {
    forro: g.forro ?? r.forro,
    forroColor: g.forroColor ?? r.forroColor,
    papel: g.papel ?? r.papel,
    lacre: g.lacre ?? r.lacre,
    lacreColor: g.lacreColor ?? r.lacreColor,
    matasellos: g.matasellos ?? r.matasellos,
    ciudad: g.ciudad ?? ciudadDe(inv.bloques),
    modo: g.modo ?? r.modo,
  };
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Se queda con lo que vale. Nunca lanza. */
export function limpiarSobre(x: unknown): AjustesDelSobre {
  if (!x || typeof x !== "object") return {};
  const o = x as Record<string, unknown>;
  const s: AjustesDelSobre = {};
  if (typeof o.activo === "boolean") s.activo = o.activo;
  if (typeof o.forro === "string" && FORROS.some((f) => f.id === o.forro)) s.forro = o.forro as ForroSobre;
  if (typeof o.forroColor === "string" && HEX.test(o.forroColor)) s.forroColor = o.forroColor.toLowerCase();
  if (typeof o.papel === "string" && HEX.test(o.papel)) s.papel = o.papel.toLowerCase();
  if (o.lacre === "iniciales" || o.lacre === "alianzas") s.lacre = o.lacre;
  if (typeof o.lacreColor === "string" && o.lacreColor in CERAS) s.lacreColor = o.lacreColor as ColorLacre;
  if (typeof o.matasellos === "boolean") s.matasellos = o.matasellos;
  if (o.modo === "papel" || o.modo === "3d") s.modo = o.modo;
  if (typeof o.ciudad === "string") {
    const c = o.ciudad.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 28);
    if (c) s.ciudad = c;
  }
  return s;
}

/** Como `limpiarSobre`, pero dice qué falla en vez de descartarlo en silencio. */
export function validarSobre(x: unknown): { ok: true; sobre: AjustesDelSobre } | { ok: false; error: string } {
  if (x === null || x === undefined) return { ok: true, sobre: {} };
  if (typeof x !== "object" || Array.isArray(x)) return { ok: false, error: "Ajustes del sobre no válidos." };
  const o = x as Record<string, unknown>;
  const permitidas = ["activo", "forro", "forroColor", "papel", "lacre", "lacreColor", "matasellos", "ciudad", "modo"];
  const extra = Object.keys(o).find((k) => !permitidas.includes(k));
  if (extra) return { ok: false, error: `No conocemos el ajuste «${extra}».` };
  const s = limpiarSobre(o);
  for (const k of Object.keys(o)) {
    if (o[k] !== undefined && !(k in s)) return { ok: false, error: `El valor de «${k}» no es válido.` };
  }
  return { ok: true, sobre: s };
}

/** Solo lo que difiere de lo recomendado: si mejoramos lo recomendado, se hereda. */
export function diferenciaSobre(
  inv: Pick<Invitacion, "plantilla" | "tema" | "bloques">,
  s: SobreResuelto & { activo?: boolean },
): AjustesDelSobre {
  const r = sobreRecomendado(inv);
  const d: AjustesDelSobre = {};
  (Object.keys(r) as (keyof Recomendado)[]).forEach((k) => {
    if (s[k] !== r[k]) (d as Record<string, unknown>)[k] = s[k];
  });
  if (s.ciudad && s.ciudad !== ciudadDe(inv.bloques)) d.ciudad = s.ciudad;
  if (typeof s.activo === "boolean" && s.activo !== CON_SOBRE.has(String(inv.plantilla))) d.activo = s.activo;
  return d;
}

/** «Laura», «Rubén» → ["L", "R"]. */
export function iniciales(a: string, b: string): [string, string] {
  const i = (s: string) => (s.trim().match(/\p{L}/u)?.[0] ?? "").toLocaleUpperCase("es");
  return [i(a), i(b)];
}

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** «30 · III · 2027», en hora de Madrid. */
export function fechaMatasellos(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const p = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).formatToParts(d);
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${v("day")} · ${ROMANOS[Number(v("month")) - 1] ?? ""} · ${v("year")}`;
}
