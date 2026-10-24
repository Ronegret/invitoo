/**
 * Paletas armónicas con AA garantizado.
 *
 * Una paleta de invitación son cinco colores, y solo tres los elige la
 * pareja:
 *   · papel        el fondo;
 *   · tinta        el texto (≥ 7:1 sobre el papel: AAA para el cuerpo);
 *   · acento       el color tal cual, para superficies (botones, bandas);
 *   · acentoTexto  el mismo tono con la luminosidad justa para leerse
 *                  como texto (≥ 4,5:1). Se ajusta SOLO la L de OKLCH;
 *   · sobreAcento  negro o blanco encima del acento (≥ 4,5:1). Si ninguno
 *                  llega —pasa con algunos grises medios—, el acento se
 *                  mueve lo mínimo para que llegue.
 *
 * El modo (claro/oscuro) lo manda la plantilla: Constelación es de noche y
 * el resto de día. `resolverTokens` descarta un tema con el modo cambiado,
 * así que aquí tampoco se deja salir del suyo.
 *
 * Todo es puro: se usa en el servidor (validar al guardar), en el cliente
 * (probador) y en node (pruebas).
 */

import { AA, contraste, esOscuro, sobreAcento as negroOBlanco } from "../../plantillas/color";
import { girar, hexAOklch, oklchAHex } from "./oklch";

export type Modo = "claro" | "oscuro";

/** Lo que elige la pareja. */
export type Colores = { papel: string; tinta: string; acento: string };

/** Lo que se aplica y se guarda: los cinco, ya legibles. */
export type Paleta = Colores & { acentoTexto: string; sobreAcento: string };

export type PaletaResuelta = Paleta & {
  /** ¿Hemos tenido que tocar algo para que se lea? */
  ajustado: boolean;
  /** Qué se ha tocado, para explicarlo. */
  ajustes: ("papel" | "tinta" | "acento" | "acentoTexto")[];
  ratios: { tinta: number; acentoTexto: number; sobreAcento: number };
};

/** Mínimo de la tinta sobre el papel: AAA, porque es el texto de todo. */
export const MINIMO_TINTA = 7;

/**
 * El carácter de cada plantilla en OKLCH: lo que hace que un «aleatorio»
 * de Velo salga neutro y uno de Registro salga eléctrico.
 */
export type Perfil = {
  modo: Modo;
  papel: { l: number; c: number };
  tinta: { l: number; c: number };
  acento: { l: [number, number]; c: [number, number] };
  /** Armonías que le sientan bien. */
  armonias: Armonia[];
  /** Papel siempre blanco puro (Registro). */
  papelBlanco?: boolean;
};

export type Armonia = "analoga" | "complementaria" | "marfil" | "monocroma" | "triadica";

export const PERFILES: Record<string, Perfil> = {
  carta: { modo: "claro", papel: { l: 0.96, c: 0.018 }, tinta: { l: 0.25, c: 0.02 }, acento: { l: [0.32, 0.5], c: [0.06, 0.13] }, armonias: ["marfil", "analoga", "complementaria"] },
  sobre: { modo: "claro", papel: { l: 0.955, c: 0.016 }, tinta: { l: 0.23, c: 0.018 }, acento: { l: [0.33, 0.5], c: [0.07, 0.15] }, armonias: ["marfil", "analoga"] },
  floracion: { modo: "claro", papel: { l: 0.955, c: 0.022 }, tinta: { l: 0.26, c: 0.025 }, acento: { l: [0.42, 0.6], c: [0.06, 0.14] }, armonias: ["analoga", "complementaria", "triadica"] },
  mar: { modo: "claro", papel: { l: 0.965, c: 0.012 }, tinta: { l: 0.25, c: 0.035 }, acento: { l: [0.42, 0.62], c: [0.06, 0.13] }, armonias: ["analoga", "complementaria", "monocroma"] },
  velo: { modo: "claro", papel: { l: 0.94, c: 0.01 }, tinta: { l: 0.22, c: 0.008 }, acento: { l: [0.45, 0.58], c: [0.02, 0.06] }, armonias: ["monocroma", "marfil"] },
  constelacion: { modo: "oscuro", papel: { l: 0.18, c: 0.04 }, tinta: { l: 0.94, c: 0.015 }, acento: { l: [0.72, 0.86], c: [0.06, 0.13] }, armonias: ["complementaria", "analoga", "monocroma"] },
  tinta: { modo: "claro", papel: { l: 0.975, c: 0.006 }, tinta: { l: 0.19, c: 0.005 }, acento: { l: [0.38, 0.5], c: [0.005, 0.045] }, armonias: ["monocroma", "marfil"] },
  registro: { modo: "claro", papel: { l: 1, c: 0 }, tinta: { l: 0.23, c: 0.005 }, acento: { l: [0.55, 0.88], c: [0.15, 0.25] }, armonias: ["monocroma"], papelBlanco: true },
  azulejo: { modo: "claro", papel: { l: 0.985, c: 0.01 }, tinta: { l: 0.23, c: 0.03 }, acento: { l: [0.42, 0.7], c: [0.1, 0.17] }, armonias: ["marfil", "complementaria", "analoga"] },
};

export function perfilDe(plantilla: string): Perfil {
  return PERFILES[plantilla] ?? PERFILES.sobre;
}

// ─────────────────────────────────────────────────────────── corrección AA

/**
 * Mueve SOLO la luminosidad (OKLCH L) de `color` hasta que contraste
 * `minimo` con `fondo`. El tono no cambia; el croma solo baja si el color
 * deja de caber en sRGB. Hacia dónde: lejos del fondo.
 */
export function ajustarLuminosidad(color: string, fondo: string, minimo = AA): string {
  const c = color.toLowerCase();
  if (contraste(c, fondo) >= minimo) return c;
  const o = hexAOklch(c);
  const paso = esOscuro(fondo) ? 0.004 : -0.004;
  for (let l = o.l + paso; l >= 0 && l <= 1; l += paso) {
    const candidato = oklchAHex({ ...o, l });
    if (contraste(candidato, fondo) >= minimo) return candidato;
  }
  return esOscuro(fondo) ? "#ffffff" : "#000000";
}

/** El texto que va encima del acento: el mismo criterio que `resolverTokens`. */
export const textoSobre = (acento: string) => negroOBlanco(acento);

/**
 * El acento como superficie: si ni negro (#111) ni blanco dan 4,5:1 encima
 * —grises medios de luminancia ≈ 0,19—, se mueve la L lo mínimo hacia el
 * lado más cercano que funcione.
 */
export function acentoSuperficie(acento: string): string {
  const a = acento.toLowerCase();
  if (contraste(a, textoSobre(a)) >= AA) return a;
  const o = hexAOklch(a);
  for (let d = 0.004; d < 0.5; d += 0.004) {
    for (const l of [o.l - d, o.l + d]) {
      if (l < 0 || l > 1) continue;
      const candidato = oklchAHex({ ...o, l });
      if (contraste(candidato, textoSobre(candidato)) >= AA) return candidato;
    }
  }
  return a;
}

/** El papel dentro del modo de la plantilla (sin cambiar su tono). */
export function papelEnModo(papel: string, modo: Modo): string {
  const p = papel.toLowerCase();
  const o = hexAOklch(p);
  if (modo === "claro" && o.l >= 0.9 && !esOscuro(p)) return p;
  if (modo === "oscuro" && o.l <= 0.3 && esOscuro(p)) return p;
  const l = modo === "claro" ? 0.93 : 0.22;
  const c = Math.min(o.c, modo === "claro" ? 0.05 : 0.07);
  return oklchAHex({ l, c, h: o.h });
}

/**
 * La paleta completa y legible a partir de lo que eligió la pareja. Es LA
 * función que garantiza AA: todo lo que se aplica o se guarda pasa por aquí.
 */
export function resolverPaleta(colores: Colores, modo: Modo): PaletaResuelta {
  const ajustes: PaletaResuelta["ajustes"] = [];
  const papel = papelEnModo(colores.papel, modo);
  if (papel !== colores.papel.toLowerCase()) ajustes.push("papel");
  const tinta = ajustarLuminosidad(colores.tinta, papel, MINIMO_TINTA);
  if (tinta !== colores.tinta.toLowerCase()) ajustes.push("tinta");
  const acento = acentoSuperficie(colores.acento);
  if (acento !== colores.acento.toLowerCase()) ajustes.push("acento");
  const acentoTexto = ajustarLuminosidad(acento, papel, AA);
  if (acentoTexto !== acento) ajustes.push("acentoTexto");
  const sobreAcento = textoSobre(acento);
  return {
    papel,
    tinta,
    acento,
    acentoTexto,
    sobreAcento,
    ajustado: ajustes.length > 0,
    ajustes,
    ratios: {
      tinta: contraste(tinta, papel),
      acentoTexto: contraste(acentoTexto, papel),
      sobreAcento: contraste(sobreAcento, acento),
    },
  };
}

/** ¿Cumple todo? Lo usan las pruebas y la server action. */
export function cumpleAA(p: Paleta, modo: Modo): boolean {
  return (
    contraste(p.tinta, p.papel) >= AA &&
    contraste(p.acentoTexto, p.papel) >= AA &&
    contraste(p.sobreAcento, p.acento) >= AA &&
    esOscuro(p.papel) === (modo === "oscuro")
  );
}

// ───────────────────────────────────────────────────── paletas generadas

const tonoPapel = (h: number, armonia: Armonia) => {
  switch (armonia) {
    case "analoga":
      return girar(h, 28);
    case "complementaria":
      return girar(h, 180);
    case "triadica":
      return girar(h, 120);
    case "marfil":
      return 80; // el crema de papel de algodón, case con lo que case
    case "monocroma":
    default:
      return h;
  }
};

/**
 * Una paleta armónica a partir de un color semilla. La semilla es el
 * acento (es lo que la pareja «ve» como su color); papel y tinta se
 * derivan con la armonía y la luminosidad que pide la plantilla.
 */
export function generarPaleta(
  semilla: string,
  plantilla: string,
  armonia: Armonia = perfilDe(plantilla).armonias[0],
): PaletaResuelta {
  const perfil = perfilDe(plantilla);
  const s = hexAOklch(semilla);
  const hp = tonoPapel(s.h, armonia);
  const papel = perfil.papelBlanco
    ? "#ffffff"
    : oklchAHex({ l: perfil.papel.l, c: perfil.papel.c, h: hp });
  const tinta = oklchAHex({ l: perfil.tinta.l, c: perfil.tinta.c, h: armonia === "complementaria" ? s.h : hp });
  return resolverPaleta({ papel, tinta, acento: semilla }, perfil.modo);
}

/** Un número pseudoaleatorio reproducible (para pruebas). */
export function semillaAleatoria(n: number): () => number {
  let x = n >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 1_000_000) / 1_000_000;
  };
}

const entre = (r: () => number, [a, b]: [number, number]) => a + (b - a) * r();

/**
 * «Aleatorio armónico»: un tono al azar, con la luminosidad y el croma que
 * le sientan a la plantilla y una de sus armonías. Nunca sale chillón en
 * Velo ni apagado en Registro.
 */
export function aleatorioArmonico(plantilla: string, r: () => number = Math.random): PaletaResuelta {
  const perfil = perfilDe(plantilla);
  const acento = oklchAHex({ l: entre(r, perfil.acento.l), c: entre(r, perfil.acento.c), h: r() * 360 });
  const armonia = perfil.armonias[Math.floor(r() * perfil.armonias.length)];
  return generarPaleta(acento, plantilla, armonia);
}

// ─────────────────────────────────────────────── selectores del probador

export type Rol = keyof Colores;

/** Tono (0–360) de un color, para el deslizador. */
export const tonoDe = (hex: string) => Math.round(hexAOklch(hex).h);

/**
 * Cambia el tono de un rol conservando su luminosidad. Si el color era
 * neutro (sin croma), le da el croma de la plantilla para que se note.
 */
export function conTono(colores: Colores, rol: Rol, h: number, plantilla: string): Colores {
  const perfil = perfilDe(plantilla);
  const o = hexAOklch(colores[rol]);
  const minimo: Record<Rol, number> = {
    papel: perfil.papelBlanco ? 0.012 : Math.max(perfil.papel.c, 0.012),
    tinta: Math.max(perfil.tinta.c, 0.02),
    acento: Math.max(perfil.acento.c[0], 0.06),
  };
  const c = o.c < minimo[rol] * 0.6 ? minimo[rol] : o.c;
  return { ...colores, [rol]: oklchAHex({ l: o.l, c, h }) };
}

const TONOS_MUESTRA = [80, 55, 30, 5, 340, 300, 255, 215, 165, 120];

/**
 * Muestras para un rol, en el carácter de la plantilla: cremas y marfiles
 * para el papel, tintas casi negras para el texto, acentos con cuerpo.
 */
export function muestrasDe(rol: Rol, plantilla: string): { hex: string; nombre: string }[] {
  const p = perfilDe(plantilla);
  const nombres = ["Marfil", "Arena", "Terracota", "Rosa", "Peonía", "Lavanda", "Azul", "Agua", "Salvia", "Oliva"];
  if (rol === "papel") {
    const base = TONOS_MUESTRA.map((h, i) => ({
      hex: oklchAHex({ l: p.papel.l, c: p.papelBlanco ? 0.012 : Math.max(p.papel.c, 0.012), h }),
      nombre: nombres[i],
    }));
    const neutro = { hex: p.modo === "oscuro" ? oklchAHex({ l: p.papel.l, c: 0, h: 0 }) : "#ffffff", nombre: p.modo === "oscuro" ? "Carbón" : "Blanco" };
    return [neutro, ...base];
  }
  if (rol === "tinta") {
    const neutro = { hex: oklchAHex({ l: p.tinta.l, c: 0, h: 0 }), nombre: p.modo === "oscuro" ? "Blanco roto" : "Negro" };
    return [
      neutro,
      ...TONOS_MUESTRA.map((h, i) => ({ hex: oklchAHex({ l: p.tinta.l, c: Math.max(p.tinta.c, 0.025), h }), nombre: nombres[i] })),
    ];
  }
  const l = (p.acento.l[0] + p.acento.l[1]) / 2;
  const c = (p.acento.c[0] + p.acento.c[1]) / 2;
  return TONOS_MUESTRA.map((h, i) => ({ hex: oklchAHex({ l, c, h }), nombre: nombres[i] }));
}
