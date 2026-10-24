/**
 * Qué incluye cada plan y cada añadido de una boda. UNA sola fuente.
 *
 * El panel lo lee para decidir qué se ve normal y qué sale en gris con
 * candado (siempre visible: al tocarlo, vista previa y «Contratar»). La web
 * puede leerlo también. Este archivo es DATO: sin `server-only` y sin
 * dependencias de servidor; lo importa el navegador sin coste.
 *
 * Los precios no se copian: los de los planes y añadidos generales salen de
 * `data/sitio.ts` y los de En directo de `lib/momentos/planes.ts`.
 */
import { ANADIDOS, PLANES } from "@/data/sitio";
import { AMPLIACIONES_MOMENTOS, PLANES_MOMENTOS, type PlanMomentos } from "@/lib/momentos/planes";

export type PlanBoda = "invitoo" | "cancion" | "estudio";
export const PLANES_BODA: PlanBoda[] = ["invitoo", "cancion", "estudio"];

export type AnadidoBoda = "directo" | "gestionado" | "ano_extra" | "idioma_extra" | "libro_impreso";
export const ANADIDOS_BODA: AnadidoBoda[] = ["directo", "gestionado", "ano_extra", "idioma_extra", "libro_impreso"];

/** Lo que se puede tener o no en el panel. */
export type Funcion =
  | "invitados"
  | "imprimir_lista"
  | "deseos"
  | "libro_pdf"
  | "album"
  | "directo"
  | "pantalla_tv"
  | "gestionado"
  | "cancion"
  | "idiomas"
  | "libro_impreso"
  | "ano_extra";

export type Contrato = {
  plan: PlanBoda;
  anadidos: AnadidoBoda[];
  /** El plan de «En directo» guardado en su configuración (lo cambia el pago de H1). */
  momentos: PlanMomentos;
};

const precioPlan = (id: PlanBoda) => PLANES.find((p) => p.id === id)?.precio ?? 0;
const precioAnadido = (nombre: string) => ANADIDOS.find((a) => a.nombre === nombre)?.precio ?? 0;

export const INFO_PLAN: Record<PlanBoda, { nombre: string; precio: number }> = {
  invitoo: { nombre: "Invitoo", precio: precioPlan("invitoo") },
  cancion: { nombre: "Invitoo con canción", precio: precioPlan("cancion") },
  estudio: { nombre: "Estudio", precio: precioPlan("estudio") },
};

/** Lo que aparece con candado: nombre, precio, qué da y a qué función abre. */
export const INFO_ANADIDO: Record<
  AnadidoBoda,
  { nombre: string; precio: number; unidad?: string; resumen: string; incluye: string[]; abre: Funcion[] }
> = {
  directo: {
    nombre: PLANES_MOMENTOS.directo.nombre,
    precio: PLANES_MOMENTOS.directo.precio,
    resumen: "Vuestros invitados suben fotos por un QR y salen en la pantalla del salón, con su mensaje.",
    incluye: PLANES_MOMENTOS.directo.incluye,
    abre: ["directo", "pantalla_tv"],
  },
  gestionado: {
    nombre: PLANES_MOMENTOS.gestionado.nombre,
    precio: PLANES_MOMENTOS.gestionado.precio,
    resumen: "Nosotros moderamos la pantalla durante la boda para que vosotros solo bailéis.",
    incluye: PLANES_MOMENTOS.gestionado.incluye,
    abre: ["directo", "pantalla_tv", "gestionado"],
  },
  ano_extra: {
    nombre: AMPLIACIONES_MOMENTOS.conservar.nombre,
    precio: AMPLIACIONES_MOMENTOS.conservar.precio,
    resumen: "La invitación, las fotos y los deseos, un año más online.",
    incluye: ["La invitación sigue abierta", "El álbum y el ZIP, un año más", "El libro de deseos se puede seguir descargando"],
    abre: ["ano_extra"],
  },
  idioma_extra: {
    nombre: "Idioma extra",
    precio: precioAnadido("Idioma extra"),
    unidad: "por idioma",
    resumen: "La invitación entera traducida, con su selector. Para bodas con familia fuera.",
    incluye: ["Traducción revisada a mano", "Selector de idioma en la invitación", "Confirmaciones en los dos idiomas"],
    abre: ["idiomas"],
  },
  libro_impreso: {
    nombre: "Libro de la Boda impreso",
    precio: precioAnadido("Libro de la Boda"),
    resumen: "Los buenos deseos, las fotos de los invitados y la canción, maquetados a mano e impresos en tapa dura.",
    incluye: ["Maquetación a mano", "Tapa dura, papel de 170 g", "Envío a casa"],
    abre: ["libro_impreso"],
  },
};

/** Lo que trae cada plan sin pagar nada más. */
const DEL_PLAN: Record<PlanBoda, Funcion[]> = {
  invitoo: ["invitados", "imprimir_lista", "deseos", "libro_pdf", "album"],
  cancion: ["invitados", "imprimir_lista", "deseos", "libro_pdf", "album", "cancion", "idiomas"],
  estudio: ["invitados", "imprimir_lista", "deseos", "libro_pdf", "album", "cancion", "idiomas", "libro_impreso", "directo", "pantalla_tv"],
};

/** Qué añadido desbloquea cada función que no viene en el plan (para el botón «Contratar»). */
export const QUE_CONTRATAR: Partial<Record<Funcion, AnadidoBoda>> = {
  directo: "directo",
  pantalla_tv: "directo",
  gestionado: "gestionado",
  ano_extra: "ano_extra",
  idiomas: "idioma_extra",
  libro_impreso: "libro_impreso",
};

export function esPlanBoda(x: unknown): x is PlanBoda {
  return typeof x === "string" && (PLANES_BODA as string[]).includes(x);
}
export function esAnadidoBoda(x: unknown): x is AnadidoBoda {
  return typeof x === "string" && (ANADIDOS_BODA as string[]).includes(x);
}

/** Todas las funciones que tiene una boda con su contrato. */
export function funcionesDe(c: Contrato): Set<Funcion> {
  const f = new Set<Funcion>(DEL_PLAN[c.plan]);
  for (const a of c.anadidos) for (const x of INFO_ANADIDO[a].abre) f.add(x);
  // En directo cuenta también si su configuración ya tiene un plan de pago
  // (el webhook de Stripe de H1 lo cambia allí).
  if (c.momentos !== "album") {
    f.add("directo");
    f.add("pantalla_tv");
    if (c.momentos === "gestionado" || c.momentos === "estudio") f.add("gestionado");
  }
  return f;
}

export function incluye(c: Contrato, f: Funcion): boolean {
  return funcionesDe(c).has(f);
}

/** El texto que anuncia el candado (lector de pantalla y tooltip). */
export const TEXTO_BLOQUEADO = "Bloqueado: no incluido en vuestro plan";

// ───────────────────────────────────────────── «Pedir un cambio»: plazos y rondas
//
// De docs/12 §6: plazo visible, cambios en tandas. Hasta publicar, los
// cambios son ilimitados (la garantía de la web); después de publicar, cada
// plan trae unas rondas. Una ronda = una solicitud, con todo lo que quepa.

export const PLAZOS_CAMBIO = {
  /** Primera respuesta (laborables). */
  respuestaHoras: 4,
  /** Hecho, desde que la recibimos (laborables). */
  hechoHoras: 48,
} as const;

/** Rondas incluidas DESPUÉS de publicar (`null` = sin límite). */
export const RONDAS_TRAS_PUBLICAR: Record<PlanBoda, number | null> = {
  invitoo: 2,
  cancion: 3,
  estudio: null,
};
