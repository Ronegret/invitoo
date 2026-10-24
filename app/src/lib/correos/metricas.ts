import "server-only";

import { SITIO_URL } from "@/lib/enlaces";
import { listarTodas } from "@/lib/datos";
import { leerContadores } from "@/lib/visitas/datos";
import { diaMadrid, sumarDias } from "@/lib/visitas/registrar";
import type { FilaContador } from "@/lib/visitas/tipos";
import type { DatosEstudio, Tendencia } from "./tipos";

/**
 * Las cifras del estudio, a partir de los contadores de visitas. Las usan
 * los resúmenes por correo (diario y semanal), las alertas y la página
 * `/estudio/visitas`: las mismas cuentas en los tres sitios.
 */

export type Cifras = {
  desde: string;
  hasta: string;
  porDia: { dia: string; paginas: number; visitantes: number; aperturas: number; reservar: number; whatsapp: number; iniciados: number; pagados: number; rsvp: number; fotos: number }[];
  total: { paginas: number; visitantes: number; reservar: number; whatsapp: number; iniciados: number; pagados: number; aperturas: number; rsvp: number; fotos: number };
  paginasTop: { clave: string; vistas: number }[];
  plantillasTop: { clave: string; vistas: number }[];
  origenes: { clave: string; vistas: number }[];
  bodas: { slug: string; aperturas: number; rsvp: number; fotos: number }[];
};

function top(filas: FilaContador[], tipo: FilaContador["tipo"], n = 5) {
  const m = new Map<string, number>();
  for (const f of filas) if (f.tipo === tipo) m.set(f.clave, (m.get(f.clave) ?? 0) + f.n);
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([clave, vistas]) => ({ clave, vistas }));
}

export async function cifrasPeriodo(desde: string, hasta: string, filasDadas?: FilaContador[]): Promise<Cifras> {
  const filas = (filasDadas ?? (await leerContadores(desde, hasta))).filter((f) => f.dia >= desde && f.dia <= hasta);
  const dias: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  const vacio = () => ({ paginas: 0, visitantes: 0, aperturas: 0, reservar: 0, whatsapp: 0, iniciados: 0, pagados: 0, rsvp: 0, fotos: 0 });
  const porDia = new Map(dias.map((d) => [d, { dia: d, ...vacio() }]));
  const bodas = new Map<string, { slug: string; aperturas: number; rsvp: number; fotos: number }>();
  const boda = (slug: string) => {
    if (!bodas.has(slug)) bodas.set(slug, { slug, aperturas: 0, rsvp: 0, fotos: 0 });
    return bodas.get(slug)!;
  };
  for (const f of filas) {
    const d = porDia.get(f.dia);
    if (!d) continue;
    if (f.tipo === "vistas") d.paginas += f.n;
    else if (f.tipo === "visitantes") d.visitantes += f.n;
    else if (f.tipo === "clic" && f.clave === "reservar") d.reservar += f.n;
    else if (f.tipo === "clic" && f.clave === "whatsapp") d.whatsapp += f.n;
    else if (f.tipo === "checkout" && f.clave === "iniciado") d.iniciados += f.n;
    else if (f.tipo === "checkout" && f.clave === "pagado") d.pagados += f.n;
    else if (f.tipo === "apertura") {
      d.aperturas += f.n;
      boda(f.clave).aperturas += f.n;
    } else if (f.tipo === "rsvp") {
      d.rsvp += f.n;
      boda(f.clave).rsvp += f.n;
    } else if (f.tipo === "foto") {
      d.fotos += f.n;
      boda(f.clave).fotos += f.n;
    }
  }
  const lista = [...porDia.values()];
  const total = lista.reduce((t, d) => {
    for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] += d[k];
    return t;
  }, vacio());
  return {
    desde,
    hasta,
    porDia: lista,
    total,
    paginasTop: top(filas, "ruta"),
    plantillasTop: top(filas, "plantilla"),
    origenes: top(filas, "origen", 6),
    bodas: [...bodas.values()].sort((a, b) => b.aperturas + b.rsvp * 3 - (a.aperturas + a.rsvp * 3)).slice(0, 8),
  };
}

/** ¿Hubo algo? (el resumen diario solo sale si sí). */
export function huboActividad(c: Cifras) {
  const t = c.total;
  return t.paginas + t.aperturas + t.rsvp + t.fotos + t.iniciados + t.pagados + t.reservar + t.whatsapp > 0;
}

/** Nombres de las parejas por slug, para que el correo no diga solo «laura-y-ruben». */
async function parejas(): Promise<Map<string, string>> {
  try {
    return new Map((await listarTodas()).map((i) => [i.slug, `${i.pareja.a} y ${i.pareja.b}`]));
  } catch {
    return new Map();
  }
}

/**
 * `DatosEstudio` para una plantilla de E2. `dias` = 1 (ayer) o 7 (la semana
 * pasada, de lunes a domingo si hoy es lunes). Compara con el periodo
 * anterior de la misma longitud.
 */
export async function datosEstudio(dias: number, hoy = diaMadrid()): Promise<{ datos: DatosEstudio; actual: Cifras }> {
  const hasta = sumarDias(hoy, -1);
  const desde = sumarDias(hoy, -dias);
  const antesHasta = sumarDias(desde, -1);
  const antesDesde = sumarDias(desde, -dias);
  const filas = await leerContadores(antesDesde, hasta);
  const [actual, anterior, nombres] = await Promise.all([cifrasPeriodo(desde, hasta, filas), cifrasPeriodo(antesDesde, antesHasta, filas), parejas()]);
  const t = (k: keyof Cifras["total"]): Tendencia => ({ actual: actual.total[k], anterior: anterior.total[k] });
  const datos: DatosEstudio = {
    desde,
    hasta,
    web: {
      paginas: t("paginas"),
      visitantes: t("visitantes"),
      reservarClics: t("reservar"),
      whatsappClics: t("whatsapp"),
      checkoutsIniciados: t("iniciados"),
      checkoutsPagados: t("pagados"),
      paginasTop: actual.paginasTop,
      plantillasTop: actual.plantillasTop,
      origenes: actual.origenes,
      porDia: actual.porDia.map((d) => ({ dia: d.dia, paginas: d.paginas, visitantes: d.visitantes })),
    },
    invitaciones: {
      aperturas: t("aperturas"),
      rsvp: t("rsvp"),
      fotos: t("fotos"),
      bodas: actual.bodas.map((b) => ({ ...b, pareja: nombres.get(b.slug) ?? b.slug })),
    },
    enlaceVisitas: `${SITIO_URL}/estudio/visitas`,
    enlaceEstudio: `${SITIO_URL}/estudio`,
  };
  return { datos, actual };
}

/** Media de vistas por hora de los últimos 7 días (para el aviso de pico). */
export async function mediaPorHora(hoy = diaMadrid()): Promise<number> {
  const filas = await leerContadores(sumarDias(hoy, -7), sumarDias(hoy, -1), ["vistas"]);
  const total = filas.reduce((s, f) => s + f.n, 0);
  return Math.round((total / (7 * 24)) * 10) / 10;
}
