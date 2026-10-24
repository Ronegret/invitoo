/**
 * Tipos compartidos de Avisos (servidor y navegador). Sin lógica de servidor.
 */

export type TipoAviso = "confirmacion" | "cambio" | "deseo" | "retirada" | "solicitud";
export const TIPOS_AVISO: TipoAviso[] = ["confirmacion", "cambio", "deseo", "retirada", "solicitud"];

export type Frecuencia = "momento" | "diario" | "nada";
export const FRECUENCIAS: Frecuencia[] = ["momento", "diario", "nada"];

export type Preferencias = Record<TipoAviso, Frecuencia>;

export const PREFERENCIAS_INICIALES: Preferencias = {
  confirmacion: "momento",
  cambio: "momento",
  deseo: "diario",
  retirada: "momento",
  solicitud: "momento",
};

/** Cómo se llama cada tipo en el panel y qué significa. */
export const TEXTO_TIPO: Record<TipoAviso, { nombre: string; ayuda: string }> = {
  confirmacion: { nombre: "Confirmaciones", ayuda: "Alguien responde por primera vez." },
  cambio: { nombre: "Cambios de respuesta", ayuda: "Alguien corrige lo que dijo (viene, no viene, menú…)." },
  deseo: { nombre: "Buenos deseos", ayuda: "Un deseo nuevo en la invitación, en el QR o en directo." },
  retirada: { nombre: "Fotos retiradas", ayuda: "Un invitado pide quitar una foto del álbum." },
  solicitud: { nombre: "Vuestras solicitudes", ayuda: "Cuando el estudio termina un cambio que pedisteis." },
};

export const TEXTO_FRECUENCIA: Record<Frecuencia, string> = {
  momento: "Al momento",
  diario: "Resumen diario",
  nada: "Nada",
};

export type Aviso = {
  id: string;
  tipo: TipoAviso;
  titulo: string;
  detalle: string | null;
  /** Ruta relativa dentro del panel. */
  enlace: string | null;
  leido: boolean;
  creado: string;
};

export function esTipoAviso(x: unknown): x is TipoAviso {
  return typeof x === "string" && (TIPOS_AVISO as string[]).includes(x);
}
export function esFrecuencia(x: unknown): x is Frecuencia {
  return typeof x === "string" && (FRECUENCIAS as string[]).includes(x);
}
