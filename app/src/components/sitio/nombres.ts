"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * «Probadla con vuestros nombres»: lo que la pareja escribe en la portada o
 * en /plantillas, compartido por toda la web.
 *
 * Vive en `localStorage` para que, si escriben «Ana y Luis» en la portada y
 * luego abren el catálogo, las ocho tarjetas ya digan Ana y Luis. Todo va en
 * try/catch: en una ventana privada, con el almacenamiento bloqueado o en
 * una captura, simplemente no se guarda y la web sigue igual.
 *
 * Un solo almacén con `useSyncExternalStore`: el sobre, la cartulina, el
 * campo y las tarjetas leen lo mismo y se repintan a la vez.
 */

export type Nombres = { a: string; b: string; fecha: string };

const CLAVE = "invitoo.nombres";
const VACIO: Nombres = { a: "", b: "", fecha: "" };
const oyentes = new Set<() => void>();

let cache: Nombres = VACIO;
let leido = false;

function leer(): Nombres {
  if (leido) return cache;
  leido = true;
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (crudo) {
      const v = JSON.parse(crudo) as Partial<Nombres>;
      cache = {
        a: limpiar(v.a, 24),
        b: limpiar(v.b, 24),
        fecha: limpiar(v.fecha, 32),
      };
    }
  } catch {
    cache = VACIO;
  }
  return cache;
}

function limpiar(v: unknown, max: number) {
  return typeof v === "string" ? v.replace(/[<>]/g, "").slice(0, max) : "";
}

function suscribir(fn: () => void) {
  oyentes.add(fn);
  const enOtraPestana = (e: StorageEvent) => {
    if (e.key !== CLAVE) return;
    leido = false;
    fn();
  };
  window.addEventListener("storage", enOtraPestana);
  return () => {
    oyentes.delete(fn);
    window.removeEventListener("storage", enOtraPestana);
  };
}

export function guardarNombres(parcial: Partial<Nombres>) {
  cache = {
    a: limpiar(parcial.a ?? leer().a, 24),
    b: limpiar(parcial.b ?? leer().b, 24),
    fecha: limpiar(parcial.fecha ?? leer().fecha, 32),
  };
  leido = true;
  try {
    if (!cache.a && !cache.b && !cache.fecha) window.localStorage.removeItem(CLAVE);
    else window.localStorage.setItem(CLAVE, JSON.stringify(cache));
  } catch {
    /* sin almacenamiento: se queda en memoria mientras dure la visita */
  }
  oyentes.forEach((f) => f());
}

/** Lo escrito, tal cual (vacío en el servidor y antes de hidratar). */
export function useNombres(): [Nombres, (p: Partial<Nombres>) => void] {
  const v = useSyncExternalStore(suscribir, leer, () => VACIO);
  const poner = useCallback((p: Partial<Nombres>) => guardarNombres(p), []);
  return [v, poner];
}

/** Lo escrito, y si falta algo, el ejemplo. */
export function conEjemplo(n: Nombres, ejemplo: [string, string, string]) {
  return {
    a: n.a.trim() || ejemplo[0],
    b: n.b.trim() || ejemplo[1],
    fecha: n.fecha.trim() || ejemplo[2],
    propios: Boolean(n.a.trim() || n.b.trim()),
  };
}

/** «Laura» + «Rubén» → «LR», para el matasellos. */
export function iniciales(a: string, b: string) {
  const i = (s: string) => (s.trim()[0] ?? "").toLocaleUpperCase("es-ES");
  return `${i(a)}${i(b)}`;
}

/**
 * Lo que va en la URL para que la invitación de verdad diga esos nombres
 * (`BarraDemo` lo lee en las muestras): `?nombres=Ana,Luis`, y si hay fecha,
 * `&fecha=2027-06-12&fd=2027-03-30` (la nueva y la de la muestra).
 */
export function consultaNombres(a: string, b: string, fecha = "", fechaMuestra = "") {
  const x = a.trim();
  const y = b.trim();
  const partes: string[] = [];
  if (x || y) partes.push(`nombres=${encodeURIComponent(`${x},${y}`)}`);
  // La fecha nueva y la de la muestra (para saber qué reescribir).
  if (partesFecha(fecha) && partesFecha(fechaMuestra)) {
    partes.push(`fecha=${fecha.slice(0, 10)}`, `fd=${fechaMuestra.slice(0, 10)}`);
  }
  return partes.join("&");
}

/* ─────────────────────────── La fecha ─────────────────────────── */

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre",
];

/** «2027-06-12» → { dia: 12, mes: 6, anio: 2027 }, o null si no es una fecha. */
export function partesFecha(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return null;
  const [anio, mes, dia] = [+m[1], +m[2], +m[3]];
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { dia, mes, anio };
}

/** «2027-06-12» → «12 · JUNIO · 2027», como va en las cartulinas. */
export function fechaBonita(iso: string) {
  const p = partesFecha(iso);
  return p ? `${p.dia} · ${MESES[p.mes - 1]} · ${p.anio}`.toLocaleUpperCase("es-ES") : "";
}

/** «2027-06-12» → «12 de junio de 2027». */
export function fechaEnLetra(iso: string) {
  const p = partesFecha(iso);
  return p ? `${p.dia} de ${MESES[p.mes - 1]} de ${p.anio}` : "";
}

/**
 * Lo que la pareja ha escrito, dicho en una frase para WhatsApp:
 * «Somos Ana y Luis y nos casamos el 12 de junio de 2027.» Vacío si no
 * han escrito nada.
 */
export function fraseDatos(n: Nombres) {
  const a = n.a.trim();
  const b = n.b.trim();
  const f = fechaEnLetra(n.fecha);
  const quien = a && b ? `Somos ${a} y ${b}` : a || b ? `Soy ${a || b}` : "";
  if (quien && f) return `${quien} y nos casamos el ${f}.`;
  if (quien) return `${quien}.`;
  if (f) return `Nos casamos el ${f}.`;
  return "";
}
