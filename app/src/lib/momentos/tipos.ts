import type { DisenoDirecto } from "./diseno";
import type { PlanMomentos } from "./planes";

/**
 * Tipos compartidos de «En directo» (servidor y navegador). Sin lógica.
 */

export type TipoMomento = "foto" | "video" | "mensaje";
export type EstadoMomento = "visible" | "oculto" | "pendiente";
export type Moderacion = "auto" | "manual";

/** Una fila de `momentos`. Las rutas son del bucket, nunca URLs. */
export type FilaMomento = {
  id: string;
  invitacion_id: string;
  tipo: TipoMomento;
  /** 2048 px (la del ZIP) o el vídeo. */
  ruta: string | null;
  /** 1280 px: la que pinta la TV. */
  ruta_pantalla: string | null;
  /** 480 px: muro y moderación (en vídeo, el fotograma de portada). */
  ruta_miniatura: string | null;
  ancho: number | null;
  alto: number | null;
  duracion: number | null;
  bytes: number;
  autor: string;
  mensaje: string | null;
  estado: EstadoMomento;
  destacado: boolean;
  dispositivo: string | null;
  /** El momento programado en curso cuando se subió. */
  capitulo: string | null;
  retirada_pedida: string | null;
  creado: string;
};

/** Una fila de `directo`. */
export type ConfigDirecto = {
  invitacion_id: string;
  activo: boolean;
  /** «Cerrar subidas»: la pantalla y el muro siguen; no entra nada nuevo. */
  subidas_abiertas: boolean;
  moderacion: Moderacion;
  clave_pantalla: string;
  token_subida: string;
  plan: PlanMomentos;
  anos_extra: number;
  limite_fotos: number;
  limite_videos: number;
  limite_bytes: number;
  retencion_hasta: string | null;
  mensaje_fijado: string | null;
  capitulo: string | null;
  capitulo_desde: string | null;
  /** Cuándo se avisó de que se borra (30 días antes). */
  aviso_borrado: string | null;
};

/** Lo que sale hacia el navegador: con URLs firmadas y sin datos internos. */
export type MomentoPublico = {
  id: string;
  tipo: TipoMomento;
  /** URL firmada de corta duración: foto de 2048 px o el vídeo. */
  url: string | null;
  /** 1280 px, para la TV (si falta, `url`). */
  pantalla: string | null;
  miniatura: string | null;
  ancho: number | null;
  alto: number | null;
  duracion: number | null;
  autor: string;
  mensaje: string | null;
  destacado: boolean;
  capitulo: string | null;
  creado: string;
};

/** Para moderar: lo público más el estado y el peso. */
export type MomentoModeracion = MomentoPublico & {
  estado: EstadoMomento;
  bytes: number;
  retiradaPedida: boolean;
};

export type Uso = { fotos: number; videos: number; mensajes: number; bytes: number };

export type Feed = {
  momentos: MomentoPublico[];
  /** Hora del servidor: el siguiente `?desde=`. */
  ahora: string;
  activo: boolean;
  subidasAbiertas: boolean;
  /** Recuerdos visibles en total (fotos + vídeos + mensajes). */
  total: number;
  /** Solo para la pantalla. */
  fijado?: MomentoPublico | null;
  capitulo?: { titulo: string; desde: string } | null;
  /** Solo para la pantalla: el diseño vigente (cambia en vivo desde el panel). */
  diseno?: DisenoDirecto;
  /** Solo en el feed completo: los ids visibles, para quitar lo ocultado. */
  ids?: string[];
};
