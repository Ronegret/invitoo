import type { Movimiento, PlantillaGuardada } from "@/lib/tipos";

/**
 * El sistema de movimiento de las invitaciones.
 *
 * Una boda no se anima como un producto. Aquí nada rebota, nada es
 * elástico, nada llega con prisa: todo entra como se deja una carta sobre
 * la mesa. Tres reglas:
 *
 *  1. Solo `opacity`, `transform` y `filter` (y `stroke-dashoffset` en
 *     las ramas, que son SVG de 2 KB). Nada que mueva el layout.
 *  2. Curvas de salida largas: la mayor parte del recorrido ocurre al
 *     principio y el final se queda flotando («exhalación»).
 *  3. Todo es ajustable por boda, pero cada plantilla trae lo suyo con
 *     criterio: `movimientoPorDefecto(plantilla)`.
 *
 * Este módulo es isomorfo (servidor y cliente) y no importa nada en tiempo
 * de ejecución: lo usan Lienzo (servidor), la vista previa (cliente) y la
 * server action de guardado.
 *
 * Cómo llega al navegador: `variablesMovimiento()` → variables CSS en el
 * contenedor de la invitación (`--mov-*`) y `atributosMovimiento()` →
 * `data-mov-*`. El bloque «Movimiento» de globals.css hace el resto.
 */

// ─────────────────────────────────────────────────────────────── tokens

/** Curvas. Ninguna pasa de 1 (sin rebote), salvo `sello`, que pasa un 3 %. */
export const CURVAS = {
  /** La de todos los días: salida suave y franca. */
  suave: "cubic-bezier(.22,.61,.36,1)",
  /** «Exhalación»: arranca despacio y se queda flotando al final. */
  exhala: "cubic-bezier(.25,.1,.12,1)",
  /** Para lo que ya está en pantalla y se desplaza (el velo, una máscara). */
  vaiven: "cubic-bezier(.65,.05,.36,1)",
  /** La carta: entradas de papel, francas al principio y que se posan (docs/09 §4). */
  carta: "cubic-bezier(.22,.61,.36,1)",
  /** El velo: lo que gira o se descubre en pantalla (la solapa, el trazo de los nombres). */
  velo: "cubic-bezier(.65,0,.35,1)",
  /**
   * El sello que se estampa: un único rebote, de un 3 % del recorrido como
   * mucho (pico ≈ 1,03). Es la ÚNICA curva con rebote.
   */
  sello: "cubic-bezier(.3,1.3,.56,1)",
} as const;

/** Duraciones base en ms (antes de aplicar la velocidad). */
export const DURACIONES = {
  breve: 320,
  media: 900,
  larga: 1400,
  lenta: 2200,
} as const;

type Preset = {
  /** Duración de la entrada de cada pieza. */
  dur: number;
  /** Escalonado entre piezas de una misma sección. */
  paso: number;
  /** Distancia máxima de ascenso, en px (se escala con la intensidad). */
  dist: number;
  /** Desenfoque máximo, en px (se escala con la intensidad). */
  desenfoque: number;
  /** Lo que tarda en dibujarse una rama. */
  ornamento: number;
  curva: string;
};

/** El carácter de cada estilo. */
export const PRESETS: Record<Movimiento["estilo"], Preset> = {
  minimo: { dur: 700, paso: 70, dist: 10, desenfoque: 0, ornamento: 1300, curva: CURVAS.suave },
  sereno: { dur: 1100, paso: 110, dist: 16, desenfoque: 5, ornamento: 2000, curva: CURVAS.exhala },
  romantico: { dur: 1400, paso: 140, dist: 20, desenfoque: 7, ornamento: 2600, curva: CURVAS.exhala },
  cinematografico: { dur: 1800, paso: 180, dist: 30, desenfoque: 10, ornamento: 3200, curva: CURVAS.exhala },
};

export const ESTILOS: Movimiento["estilo"][] = ["minimo", "sereno", "romantico", "cinematografico"];
export const ENTRADAS: Movimiento["entrada"][] = ["fundido", "fundido-desenfoque", "ascenso", "velo"];
export const PARTICULAS: Movimiento["particulas"][] = ["ninguna", "petalos", "destellos", "polvo-de-oro"];
export const FLORES: Movimiento["flores"][] = ["ninguna", "sutiles", "jardin"];

/** Nombres humanos, para los formularios. */
export const NOMBRES = {
  estilo: {
    minimo: "Mínimo",
    sereno: "Sereno",
    romantico: "Romántico",
    cinematografico: "Cinematográfico",
  },
  entrada: {
    fundido: "Fundido",
    "fundido-desenfoque": "Fundido con desenfoque",
    ascenso: "Ascenso suave",
    velo: "Velo que se retira",
  },
  particulas: {
    ninguna: "Ninguna",
    petalos: "Pétalos",
    destellos: "Destellos",
    "polvo-de-oro": "Polvo de oro",
  },
  flores: {
    ninguna: "Sin flores",
    sutiles: "Unas pocas",
    jardin: "Todo un jardín",
  },
} as const satisfies {
  flores: Record<Movimiento["flores"], string>;
  estilo: Record<Movimiento["estilo"], string>;
  entrada: Record<Movimiento["entrada"], string>;
  particulas: Record<Movimiento["particulas"], string>;
};

export const LIMITES = {
  velocidad: { min: 0.6, max: 1.6 },
  intensidad: { min: 0, max: 1 },
} as const;

// ─────────────────────────────────────────────── por defecto, por plantilla

const BASE: Movimiento = {
  estilo: "sereno",
  velocidad: 1,
  intensidad: 0.5,
  entrada: "fundido-desenfoque",
  ornamentos: true,
  particulas: "ninguna",
  parallax: true,
  musicaFundido: true,
  flores: "sutiles",
  interaccion: true,
  colorVivo: false,
  petalosAlTocar: false,
};

/**
 * Lo que trae cada plantilla. Ids del catálogo; los antiguos («cielo»,
 * «brasa») caen en la suya por `resolverId`.
 */
const POR_PLANTILLA: Record<string, Partial<Movimiento>> = {
  // Papel y lacre: todo se posa, como una cartulina sobre la mesa.
  sobre: { estilo: "romantico", intensidad: 0.55, entrada: "fundido-desenfoque", flores: "sutiles", colorVivo: true, petalosAlTocar: true },
  // La carta: papel, oro y un poco de polvo dorado.
  carta: { estilo: "romantico", intensidad: 0.5, entrada: "fundido-desenfoque", particulas: "polvo-de-oro", flores: "sutiles", colorVivo: true, petalosAlTocar: true },
  // Campo: las ramas crecen y caen unos pocos pétalos.
  floracion: { estilo: "romantico", velocidad: 0.95, intensidad: 0.6, entrada: "ascenso", particulas: "petalos", flores: "jardin", colorVivo: true, petalosAlTocar: true },
  // Mar: bruma que se aclara.
  mar: { estilo: "sereno", velocidad: 0.9, intensidad: 0.55, entrada: "fundido-desenfoque", flores: "sutiles", colorVivo: true },
  // Etiqueta: cada sección se descubre bajo un velo.
  velo: { estilo: "cinematografico", velocidad: 0.9, intensidad: 0.6, entrada: "velo", flores: "sutiles", colorVivo: true },
  // Noche: destellos, entradas largas.
  constelacion: { estilo: "cinematografico", velocidad: 0.9, intensidad: 0.55, entrada: "fundido-desenfoque", particulas: "destellos", flores: "ninguna", colorVivo: true },
  // Mínima: un fundido y nada más.
  tinta: { estilo: "minimo", intensidad: 0.3, entrada: "fundido", parallax: false, flores: "ninguna", interaccion: false },
  // Civil, suiza: rápida y recta.
  registro: { estilo: "minimo", velocidad: 1.15, intensidad: 0.45, entrada: "ascenso", parallax: false, flores: "ninguna" },
  // Mediterránea: luz de verano, sin prisa.
  azulejo: { estilo: "sereno", intensidad: 0.5, entrada: "ascenso", flores: "sutiles", colorVivo: true },
};

const ALIAS: Record<string, string> = {
  jardin: "floracion",
  terracota: "floracion",
  brasa: "floracion",
  cielo: "mar",
  marea: "mar",
  lino: "velo",
  bruma: "velo",
};

function resolverId(id: string | null | undefined) {
  const x = String(id ?? "");
  return POR_PLANTILLA[x] ? x : (ALIAS[x] ?? "sobre");
}

/** Los ajustes recomendados de una plantilla. */
export function movimientoPorDefecto(plantilla: PlantillaGuardada | string): Movimiento {
  return { ...BASE, ...POR_PLANTILLA[resolverId(plantilla)] };
}

// ─────────────────────────────────────────────────────────────── validar

const redondear = (n: number) => Math.round(n * 100) / 100;
const acotar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Limpia lo que llegue (formulario, URL, BD): se queda solo con los campos
 * conocidos y válidos. Nunca lanza: lo que no vale, se descarta.
 */
export function limpiarMovimiento(x: unknown): Partial<Movimiento> {
  if (!x || typeof x !== "object") return {};
  const o = x as Record<string, unknown>;
  const m: Partial<Movimiento> = {};
  if (ESTILOS.includes(o.estilo as Movimiento["estilo"])) m.estilo = o.estilo as Movimiento["estilo"];
  if (ENTRADAS.includes(o.entrada as Movimiento["entrada"])) m.entrada = o.entrada as Movimiento["entrada"];
  if (PARTICULAS.includes(o.particulas as Movimiento["particulas"])) {
    m.particulas = o.particulas as Movimiento["particulas"];
  }
  if (typeof o.velocidad === "number" && Number.isFinite(o.velocidad)) {
    m.velocidad = redondear(acotar(o.velocidad, LIMITES.velocidad.min, LIMITES.velocidad.max));
  }
  if (typeof o.intensidad === "number" && Number.isFinite(o.intensidad)) {
    m.intensidad = redondear(acotar(o.intensidad, 0, 1));
  }
  if (FLORES.includes(o.flores as Movimiento["flores"])) m.flores = o.flores as Movimiento["flores"];
  for (const k of ["ornamentos", "parallax", "musicaFundido", "interaccion", "colorVivo", "petalosAlTocar"] as const) {
    if (typeof o[k] === "boolean") m[k] = o[k] as boolean;
  }
  return m;
}

/**
 * Validación estricta para la server action: dice QUÉ campo está mal en
 * vez de descartarlo en silencio.
 */
export function validarMovimiento(
  x: unknown,
): { ok: true; mov: Partial<Movimiento> } | { ok: false; error: string } {
  if (!x || typeof x !== "object" || Array.isArray(x)) {
    return { ok: false, error: "Los ajustes de movimiento no tienen el formato esperado." };
  }
  const o = x as Record<string, unknown>;
  const conocidos = new Set(Object.keys(BASE));
  const raro = Object.keys(o).find((k) => !conocidos.has(k));
  if (raro) return { ok: false, error: `Ajuste desconocido: «${raro}».` };
  const limpio = limpiarMovimiento(o);
  const malo = Object.keys(o).find((k) => o[k] !== undefined && !(k in limpio));
  if (malo) return { ok: false, error: `El ajuste «${malo}» no tiene un valor válido.` };
  const v = o.velocidad;
  if (typeof v === "number" && (v < LIMITES.velocidad.min || v > LIMITES.velocidad.max)) {
    return { ok: false, error: "La velocidad va de 0,6 a 1,6." };
  }
  const i = o.intensidad;
  if (typeof i === "number" && (i < 0 || i > 1)) {
    return { ok: false, error: "La intensidad va de 0 a 1." };
  }
  return { ok: true, mov: limpio };
}

/**
 * El movimiento final de una boda: plantilla ← guardado ← encima (p. ej.
 * `?mov=` en la vista previa). Siempre completo.
 */
export function resolverMovimiento(
  plantilla: PlantillaGuardada | string,
  guardado?: Partial<Movimiento> | null,
  encima?: Partial<Movimiento> | null,
): Movimiento {
  return {
    ...movimientoPorDefecto(plantilla),
    ...limpiarMovimiento(guardado),
    ...limpiarMovimiento(encima),
  };
}

/** Solo lo que difiere de la plantilla: lo que merece la pena guardar. */
export function diferenciaMovimiento(plantilla: string, m: Movimiento): Partial<Movimiento> {
  const base = movimientoPorDefecto(plantilla);
  const d: Partial<Movimiento> = {};
  for (const k of Object.keys(base) as (keyof Movimiento)[]) {
    if (m[k] !== base[k]) (d as Record<string, unknown>)[k] = m[k];
  }
  return d;
}

// ──────────────────────────────────────────────────────── al navegador

/** Las duraciones y distancias ya calculadas (ms y px). */
export function medidasMovimiento(m: Movimiento) {
  const p = PRESETS[m.estilo];
  const v = acotar(m.velocidad, LIMITES.velocidad.min, LIMITES.velocidad.max);
  const i = acotar(m.intensidad, 0, 1);
  const ms = (n: number) => Math.round(n / v);
  const desenfoque = m.entrada === "fundido" || m.entrada === "ascenso" ? p.desenfoque * 0.4 : p.desenfoque;
  return {
    dur: ms(p.dur),
    paso: ms(p.paso),
    ornamento: ms(p.ornamento),
    breve: ms(DURACIONES.breve),
    /** La salida de la apertura hacia la portada. */
    salida: ms(p.dur * 0.85 + 300),
    dist: m.entrada === "fundido" ? 0 : Math.round(p.dist * i * (m.entrada === "fundido-desenfoque" ? 0.5 : 1)),
    desenfoque: redondear(desenfoque * i),
    desenfoqueFoto: redondear(Math.min(10, (p.desenfoque + 2) * i)),
    curva: p.curva,
  };
}

/** Variables CSS para el `style` del contenedor de la invitación. */
export function variablesMovimiento(m: Movimiento): Record<string, string> {
  const x = medidasMovimiento(m);
  return {
    "--mov-dur": `${x.dur}ms`,
    "--mov-paso": `${x.paso}ms`,
    "--mov-ornamento": `${x.ornamento}ms`,
    "--mov-breve": `${x.breve}ms`,
    "--mov-salida": `${x.salida}ms`,
    "--mov-dist": `${x.dist}px`,
    "--mov-desenfoque": `${x.desenfoque}px`,
    "--mov-desenfoque-foto": `${x.desenfoqueFoto}px`,
    "--mov-curva": x.curva,
    "--mov-curva-suave": CURVAS.suave,
    "--mov-curva-vaiven": CURVAS.vaiven,
    "--ease-carta": CURVAS.carta,
    "--ease-velo": CURVAS.velo,
    "--ease-sello": CURVAS.sello,
    // Las flores florecen al ritmo de la boda (Florecer.tsx).
    "--fl-vel": String(acotar(m.velocidad, LIMITES.velocidad.min, LIMITES.velocidad.max) * (m.estilo === "minimo" ? 1.3 : m.estilo === "cinematografico" ? 0.85 : 1)),
  };
}

/** Los `data-mov-*` del contenedor: ganchos para el CSS y los scripts. */
export function atributosMovimiento(m: Movimiento): Record<`data-${string}`, string> {
  return {
    "data-mov-estilo": m.estilo,
    "data-mov-entrada": m.entrada,
    "data-mov-ornamentos": m.ornamentos ? "1" : "0",
    "data-mov-particulas": m.particulas,
    "data-mov-parallax": m.parallax ? "1" : "0",
    "data-mov-musica": m.musicaFundido ? "1" : "0",
    "data-mov-flores": m.flores,
    "data-mov-interaccion": m.interaccion ? "1" : "0",
    "data-mov-color": m.colorVivo ? "1" : "0",
    "data-mov-petalos": m.petalosAlTocar ? "1" : "0",
  };
}

// ───────────────────────────────────────────────────────────── en la URL

/** `?mov=` de la vista previa: JSON en base64url. */
export function codificarMovimiento(m: Partial<Movimiento>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(m));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodificarMovimiento(s: string | null | undefined): Partial<Movimiento> {
  if (!s || s.length > 2000) return {};
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return limpiarMovimiento(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return {};
  }
}

/** Mensaje que la vista previa manda al iframe de la invitación. */
export type MensajeMovimiento =
  | { tipo: "invitoo:mov"; mov: Partial<Movimiento> }
  | { tipo: "invitoo:mov-repetir" };
