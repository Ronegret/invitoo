import type { Bloque } from "@/lib/tipos";

/**
 * Los bloques de una invitación: su nombre en el estudio, un bloque vacío de
 * cada tipo (para «Añadir bloque») y la validación que hace el servidor antes
 * de guardar. Un bloque roto guardado es una invitación que revienta el sábado
 * por la mañana, así que aquí se comprueba todo lo que la maqueta lee.
 *
 * Sin dependencias de servidor: el editor usa `NOMBRES` y `bloqueVacio`.
 */

export type TipoBloque = Bloque["t"];

export const NOMBRES: Record<TipoBloque, string> = {
  portada: "Portada",
  cuentaAtras: "Cuenta atrás",
  historia: "Nuestra historia",
  capitulos: "Historia por capítulos",
  itinerario: "Itinerario",
  rsvp: "Confirmación (RSVP)",
  album: "Álbum compartido",
  muro: "Muro de mensajes",
  playlist: "Playlist",
  regalos: "Regalos",
  dressCode: "Dress code",
  alojamiento: "Alojamiento",
  galeria: "Galería",
  notas: "Notas prácticas",
  hashtag: "Hashtag",
  anuncio: "Quién invita",
  ninos: "Niños",
  preguntas: "Preguntas frecuentes",
  autobus: "Autobús",
  extranjeros: "Invitados de fuera",
  preboda: "Preboda",
};

export const TIPOS = Object.keys(NOMBRES) as TipoBloque[];

export function bloqueVacio(t: TipoBloque): Bloque {
  switch (t) {
    case "portada":
      return { t, frase: "" };
    case "cuentaAtras":
      return { t };
    case "historia":
      return { t, parrafos: [""] };
    case "capitulos":
      return { t, capitulos: [{ titulo: "", texto: "" }] };
    case "itinerario":
      return { t, paradas: [{ titulo: "Ceremonia", hora: "12:00", lugar: "", direccion: "" }] };
    case "rsvp":
      return { t, pideMenu: true, pideAlergias: true, pideBus: false };
    case "album":
      return { t, subidaInvitados: true };
    case "muro":
      return { t };
    case "playlist":
      return { t, spotify: "" };
    case "regalos":
      return { t };
    case "dressCode":
      return { t, nota: "", paleta: [] };
    case "alojamiento":
      return { t, opciones: [{ nombre: "" }] };
    case "galeria":
      return { t, fotos: [] };
    case "notas":
      return { t, items: [{ titulo: "", texto: "" }] };
    case "hashtag":
      return { t, etiqueta: "" };
    case "anuncio":
      return { t, estilo: "moderno", texto: "Con la alegría de nuestras familias, nos casamos. Y no sería lo mismo sin ti." };
    case "ninos":
      return { t, admitidos: "si", nota: "Los peques son bienvenidos: habrá menú infantil. Dinos sus nombres y edades.", menuInfantil: true };
    case "preguntas":
      return { t, items: [{ p: "¿Hay parking?", r: "" }] };
    case "autobus":
      return { t, ida: [{ hora: "16:45", desde: "" }], vueltas: ["01:00", "04:00"] };
    case "extranjeros":
      return { t, titulo: "Welcome!", texto: "", idioma: "en" };
    case "preboda":
      return { t, cuando: "", lugar: "", texto: "" };
  }
}

// ───────────────────────────────────────────────────────────────── validación

type Obj = Record<string, unknown>;
const esObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);

class Invalido extends Error {}

function txt(o: Obj, k: string, donde: string, opts: { opcional?: boolean; max?: number } = {}) {
  const v = o[k];
  if (v === undefined || v === null || v === "") {
    if (opts.opcional) return undefined;
    throw new Invalido(`${donde}: falta «${k}».`);
  }
  if (typeof v !== "string") throw new Invalido(`${donde}: «${k}» tiene que ser texto.`);
  const t = v.trim();
  if (t.length > (opts.max ?? 4000)) throw new Invalido(`${donde}: «${k}» es demasiado largo.`);
  return t;
}

function bool(o: Obj, k: string) {
  return o[k] === true;
}

function lista<T>(o: Obj, k: string, donde: string, cada: (x: unknown, i: number) => T, opcional = false): T[] {
  const v = o[k];
  if (v === undefined && opcional) return [];
  if (!Array.isArray(v)) throw new Invalido(`${donde}: «${k}» tiene que ser una lista.`);
  if (v.length > 60) throw new Invalido(`${donde}: «${k}» tiene demasiados elementos.`);
  return v.map(cada);
}

function textos(o: Obj, k: string, donde: string, opcional = false) {
  return lista(o, k, donde, (x) => {
    if (typeof x !== "string") throw new Invalido(`${donde}: «${k}» solo admite textos.`);
    return x.trim();
  }, opcional).filter(Boolean);
}

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const HORA = /^\d{1,2}[:.h]\d{2}$/;

/** Quita las claves `undefined` para que el JSON guardado quede limpio. */
function limpio<T extends Obj>(o: T): T {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}

function validarUno(x: unknown, i: number): Bloque {
  const donde = `Bloque ${i + 1}`;
  if (!esObj(x) || typeof x.t !== "string" || !(x.t in NOMBRES)) {
    throw new Invalido(`${donde}: tipo desconocido.`);
  }
  const t = x.t as TipoBloque;
  const d = `${donde} (${NOMBRES[t]})`;
  switch (t) {
    case "portada": {
      const variante = x.variante;
      if (variante !== undefined && !["centro", "bajo", "partida"].includes(variante as string)) {
        throw new Invalido(`${d}: variante no válida.`);
      }
      return limpio({ t, frase: txt(x, "frase", d, { max: 400 })!, foto: txt(x, "foto", d, { opcional: true }), variante: variante as "centro" | undefined });
    }
    case "cuentaAtras":
    case "muro":
      return { t };
    case "historia": {
      const parrafos = textos(x, "parrafos", d);
      if (parrafos.length === 0) throw new Invalido(`${d}: escribe al menos un párrafo.`);
      const fotos = textos(x, "fotos", d, true);
      return limpio({ t, parrafos, fotos: fotos.length ? fotos : undefined });
    }
    case "capitulos":
      return limpio({
        t,
        titulo: txt(x, "titulo", d, { opcional: true, max: 120 }),
        capitulos: lista(x, "capitulos", d, (c, j) => {
          if (!esObj(c)) throw new Invalido(`${d}: capítulo ${j + 1} no válido.`);
          const dc = `${d}, capítulo ${j + 1}`;
          return limpio({
            cuando: txt(c, "cuando", dc, { opcional: true, max: 60 }),
            titulo: txt(c, "titulo", dc, { max: 120 })!,
            texto: txt(c, "texto", dc)!,
            foto: txt(c, "foto", dc, { opcional: true }),
          });
        }),
      });
    case "itinerario": {
      const paradas = lista(x, "paradas", d, (p, j) => {
        if (!esObj(p)) throw new Invalido(`${d}: parada ${j + 1} no válida.`);
        const dp = `${d}, parada ${j + 1}`;
        const hora = txt(p, "hora", dp, { max: 5 })!;
        if (!HORA.test(hora)) throw new Invalido(`${dp}: la hora va como 12:30.`);
        return limpio({
          titulo: txt(p, "titulo", dp, { max: 80 })!,
          hora,
          lugar: txt(p, "lugar", dp, { max: 160 })!,
          direccion: txt(p, "direccion", dp, { opcional: true, max: 240 }) ?? "",
          mapa: txt(p, "mapa", dp, { opcional: true, max: 600 }),
          icono: txt(p, "icono", dp, { opcional: true, max: 30 }),
        });
      });
      if (paradas.length === 0) throw new Invalido(`${d}: añade al menos una parada.`);
      return limpio({ t, titulo: txt(x, "titulo", d, { opcional: true, max: 80 }), paradas });
    }
    case "rsvp": {
      const limite = txt(x, "limite", d, { opcional: true, max: 40 });
      if (limite && Number.isNaN(Date.parse(limite))) throw new Invalido(`${d}: la fecha límite no es una fecha.`);
      return limpio({
        t,
        pideMenu: bool(x, "pideMenu"),
        pideAlergias: bool(x, "pideAlergias"),
        pideBus: bool(x, "pideBus"),
        limite,
        motivoLimite: txt(x, "motivoLimite", d, { opcional: true, max: 300 }),
      });
    }
    case "album":
      return limpio({ t, subidaInvitados: bool(x, "subidaInvitados"), titulo: txt(x, "titulo", d, { opcional: true, max: 80 }) });
    case "playlist":
      return limpio({
        t,
        spotify: txt(x, "spotify", d, { max: 600 })!,
        titulo: txt(x, "titulo", d, { opcional: true, max: 80 }),
        nota: txt(x, "nota", d, { opcional: true, max: 400 }),
      });
    case "regalos":
      return limpio({
        t,
        iban: txt(x, "iban", d, { opcional: true, max: 42 }),
        enlacePago: txt(x, "enlacePago", d, { opcional: true, max: 600 }),
        titulo: txt(x, "titulo", d, { opcional: true, max: 80 }),
        nota: txt(x, "nota", d, { opcional: true, max: 600 }),
        bizum: txt(x, "bizum", d, { opcional: true, max: 20 }),
        titular: txt(x, "titular", d, { opcional: true, max: 120 }),
      });
    case "dressCode": {
      const paleta = textos(x, "paleta", d, true);
      const mal = paleta.find((c) => !HEX.test(c));
      if (mal) throw new Invalido(`${d}: «${mal}» no es un color (#rrggbb).`);
      return { t, nota: txt(x, "nota", d, { max: 600 })!, paleta };
    }
    case "alojamiento":
      return {
        t,
        opciones: lista(x, "opciones", d, (h, j) => {
          if (!esObj(h)) throw new Invalido(`${d}: opción ${j + 1} no válida.`);
          const dh = `${d}, opción ${j + 1}`;
          return limpio({
            nombre: txt(h, "nombre", dh, { max: 120 })!,
            nota: txt(h, "nota", dh, { opcional: true, max: 300 }),
            enlace: txt(h, "enlace", dh, { opcional: true, max: 600 }),
          });
        }),
      };
    case "galeria": {
      const variante = x.variante;
      if (variante !== undefined && !["sangre", "tira"].includes(variante as string)) {
        throw new Invalido(`${d}: variante no válida.`);
      }
      return limpio({ t, fotos: textos(x, "fotos", d), titulo: txt(x, "titulo", d, { opcional: true, max: 80 }), variante: variante as "tira" | undefined });
    }
    case "notas":
      return {
        t,
        items: lista(x, "items", d, (n, j) => {
          if (!esObj(n)) throw new Invalido(`${d}: nota ${j + 1} no válida.`);
          const dn = `${d}, nota ${j + 1}`;
          return { titulo: txt(n, "titulo", dn, { max: 120 })!, texto: txt(n, "texto", dn, { max: 1200 })! };
        }),
      };
    case "hashtag":
      return limpio({
        t,
        etiqueta: txt(x, "etiqueta", d, { max: 60 })!.replace(/^#/, ""),
        nota: txt(x, "nota", d, { opcional: true, max: 300 }),
      });
    case "anuncio": {
      const estilo = x.estilo === "clasico" ? "clasico" : "moderno";
      return limpio({ t, estilo, texto: txt(x, "texto", d, { max: 1200 })!, padrinos: txt(x, "padrinos", d, { opcional: true, max: 300 }) });
    }
    case "ninos": {
      const admitidos = (["si", "no", "solo-familia"] as const).find((v) => v === x.admitidos);
      if (!admitidos) throw new Invalido(`${d}: elige si los niños vienen (sí, no o solo la familia).`);
      return limpio({ t, admitidos, nota: txt(x, "nota", d, { max: 600 })!, menuInfantil: bool(x, "menuInfantil") || undefined });
    }
    case "preguntas":
      return limpio({
        t,
        titulo: txt(x, "titulo", d, { opcional: true, max: 80 }),
        items: lista(x, "items", d, (n, j) => {
          if (!esObj(n)) throw new Invalido(`${d}: pregunta ${j + 1} no válida.`);
          const dn = `${d}, pregunta ${j + 1}`;
          return { p: txt(n, "p", dn, { max: 160 })!, r: txt(n, "r", dn, { max: 1200 })! };
        }),
      });
    case "autobus":
      return limpio({
        t,
        ida: lista(x, "ida", d, (n, j) => {
          if (!esObj(n)) throw new Invalido(`${d}: salida ${j + 1} no válida.`);
          const dn = `${d}, salida ${j + 1}`;
          const hora = txt(n, "hora", dn, { max: 5 })!;
          if (!HORA.test(hora)) throw new Invalido(`${dn}: la hora va como 16:45.`);
          return limpio({ hora, desde: txt(n, "desde", dn, { max: 160 })!, mapa: txt(n, "mapa", dn, { opcional: true, max: 600 }) });
        }),
        vueltas: textos(x, "vueltas", d, true),
        nota: txt(x, "nota", d, { opcional: true, max: 400 }),
      });
    case "extranjeros":
      return limpio({
        t,
        titulo: txt(x, "titulo", d, { max: 80 })!,
        texto: txt(x, "texto", d, { max: 1200 })!,
        idioma: txt(x, "idioma", d, { opcional: true, max: 12 }),
      });
    case "preboda":
      return limpio({
        t,
        cuando: txt(x, "cuando", d, { max: 120 })!,
        lugar: txt(x, "lugar", d, { max: 160 })!,
        texto: txt(x, "texto", d, { max: 600 })!,
        direccion: txt(x, "direccion", d, { opcional: true, max: 240 }),
      });
  }
}

export function validarBloques(
  entrada: unknown,
): { ok: true; bloques: Bloque[] } | { ok: false; error: string } {
  if (!Array.isArray(entrada)) return { ok: false, error: "Los bloques tienen que ser una lista." };
  if (entrada.length > 40) return { ok: false, error: "Demasiados bloques." };
  try {
    return { ok: true, bloques: entrada.map(validarUno) };
  } catch (e) {
    if (e instanceof Invalido) return { ok: false, error: e.message };
    throw e;
  }
}
