import type { Feed, MomentoPublico } from "./tipos";

/**
 * Lo que sale en las vistas previas de la pantalla (panel, compra y web):
 * fotos de muestra propias (`public/generadas`, IA, personas ficticias), con autores y pies inventados.
 * DATO puro.
 */

type Semilla = { f: string; ancho: number; alto: number; autor: string; mensaje?: string };

const FOTOS: Semilla[] = [
  { f: "directo-amigas", ancho: 832, alto: 1248, autor: "Lucía", mensaje: "¡Qué guapos estáis! Por muchos años así" },
  { f: "directo-brindis", ancho: 1248, alto: 832, autor: "Tío Andrés" },
  { f: "directo-abuelos-bailando", ancho: 832, alto: 1248, autor: "Marta y Pablo", mensaje: "La mesa 7 os quiere" },
  { f: "directo-mesa-detalle", ancho: 1248, alto: 832, autor: "Abuela Carmen" },
  { f: "directo-salida", ancho: 832, alto: 1248, autor: "Irene", mensaje: "El momento del sí" },
  { f: "directo-ninos", ancho: 1248, alto: 832, autor: "Javi" },
  { f: "directo-tarta", ancho: 832, alto: 1248, autor: "Sara", mensaje: "Bailad siempre así" },
  { f: "directo-pista", ancho: 1248, alto: 832, autor: "Los primos" },
  { f: "floracion-album-2", ancho: 832, alto: 1248, autor: "Nacho" },
  { f: "carta-capitulo-4", ancho: 1248, alto: 832, autor: "Elena", mensaje: "Qué bonito todo" },
  { f: "constelacion-album-2", ancho: 832, alto: 1248, autor: "Diego" },
  { f: "mar-album-4", ancho: 1248, alto: 832, autor: "Ana", mensaje: "Gracias por invitarnos" },
  { f: "cuento-album-4", ancho: 1248, alto: 832, autor: "Rocío" },
  { f: "regencia-album-4", ancho: 832, alto: 1248, autor: "Mamá", mensaje: "Mi niña" },
];

const MENSAJES = [
  { autor: "Tía Pilar", mensaje: "Que la vida os dé tantos días felices como hoy. Os queremos muchísimo." },
  { autor: "Los del máster", mensaje: "Por el amor, la paciencia y la barra libre. ¡Vivan los novios!" },
];

/** La foto que «sube» el móvil de la web y aparece en la TV. */
export const FOTO_DEL_MOVIL = {
  src: "/generadas/velo-album-3-1080.avif",
  ancho: 832,
  alto: 1248,
  autor: "Tú",
  mensaje: "¡Acabo de llegar y ya estoy llorando!",
};

export function feedMuestra(): Feed {
  const ahora = Date.now();
  const momentos: MomentoPublico[] = [
    ...FOTOS.map((s, i) => ({
      id: `muestra${String(i).padStart(4, "0")}`,
      tipo: "foto" as const,
      url: `/generadas/${s.f}-1080.avif`,
      pantalla: `/generadas/${s.f}-1080.avif`,
      miniatura: `/generadas/${s.f}-480.avif`,
      ancho: s.ancho,
      alto: s.alto,
      duracion: null,
      autor: s.autor,
      mensaje: s.mensaje ?? null,
      destacado: false,
      capitulo: null,
      creado: new Date(ahora - (i + 1) * 90_000).toISOString(),
    })),
    ...MENSAJES.map((m, i) => ({
      id: `muestramsg${i}`,
      tipo: "mensaje" as const,
      url: null,
      pantalla: null,
      miniatura: null,
      ancho: null,
      alto: null,
      duracion: null,
      autor: m.autor,
      mensaje: m.mensaje,
      destacado: false,
      capitulo: null,
      creado: new Date(ahora - (i * 7 + 3) * 90_000).toISOString(),
    })),
  ];
  return {
    momentos,
    ahora: new Date(ahora).toISOString(),
    activo: true,
    subidasAbiertas: true,
    total: momentos.length + 112,
    fijado: null,
    capitulo: null,
    ids: momentos.map((m) => m.id),
  };
}
