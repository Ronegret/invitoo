"use client";

import { useSyncExternalStore } from "react";

/**
 * Lo común de las tres cuentas atrás temáticas (K1).
 *
 * La invitación es estática: el servidor (y quien no tenga JavaScript) ve
 * LA FECHA, que siempre es verdad; el navegador la cambia por el reloj.
 *
 * Accesibilidad: las cifras que cambian cada segundo van `aria-hidden`. Lo
 * que se anuncia es una frase en una región `aria-live` que solo cambia
 * cuando cambia el MINUTO («Faltan 238 días, 4 horas y 12 minutos»), y que
 * nunca se queda en «00»: cuando la boda llega dice «Hoy nos casamos», y
 * después, «Ya nos casamos».
 */
function suscribir(f: () => void) {
  const id = window.setInterval(f, 1000);
  return () => window.clearInterval(id);
}
const ahora = () => Math.floor(Date.now() / 1000);
const enServidor = () => null;

export type Cuenta = {
  /** null en el servidor y sin JS. */
  vivo: boolean;
  d: number;
  h: number;
  m: number;
  s: number;
  /** Segundos que faltan (0 si ya pasó). */
  total: number;
  estado: "falta" | "hoy" | "paso";
  fecha: string;
  frase: string;
};

const FECHA = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Madrid",
});
const DIA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" });

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export function useCuenta(hasta: string): Cuenta {
  const segundo = useSyncExternalStore(suscribir, ahora, enServidor);
  const fin = new Date(hasta).getTime();
  const fecha = Number.isFinite(fin) ? FECHA.format(new Date(fin)) : "";
  if (segundo === null || !Number.isFinite(fin)) {
    return { vivo: false, d: 0, h: 0, m: 0, s: 0, total: 0, estado: "falta", fecha, frase: "" };
  }
  const total = Math.max(0, Math.floor(fin / 1000) - segundo);
  if (total === 0) {
    const hoy = DIA.format(new Date(segundo * 1000)) === DIA.format(new Date(fin));
    return {
      vivo: true, d: 0, h: 0, m: 0, s: 0, total, fecha,
      estado: hoy ? "hoy" : "paso",
      frase: hoy ? "Hoy nos casamos. Gracias por estar aquí." : `Ya nos casamos, el ${fecha}. Gracias por estar.`,
    };
  }
  const d = Math.floor(total / 86_400);
  const h = Math.floor(total / 3_600) % 24;
  const m = Math.floor(total / 60) % 60;
  const s = total % 60;
  // La frase va por minutos (redondeando hacia arriba): «12 minutos» no
  // pasa a «11» hasta que de verdad quedan 11, y nunca dice «0 minutos»
  // mientras falten segundos.
  const minutos = Math.ceil(total / 60);
  const fd = Math.floor(minutos / 1440);
  const fh = Math.floor(minutos / 60) % 24;
  const fm = minutos % 60;
  const trozos = [
    fd > 0 && plural(fd, "día", "días"),
    fh > 0 && plural(fh, "hora", "horas"),
    fm > 0 && plural(fm, "minuto", "minutos"),
  ].filter(Boolean) as string[];
  const lista = trozos.length > 1 ? `${trozos.slice(0, -1).join(", ")} y ${trozos.at(-1)}` : trozos[0];
  const falta = minutos === 1 && trozos.length === 1 ? "Falta" : fd === 1 && trozos.length === 1 ? "Falta" : "Faltan";
  return { vivo: true, d, h, m, s, total, estado: "falta", fecha, frase: `${falta} ${lista} para la boda, el ${fecha}.` };
}

/** La frase para el lector de pantalla: cambia, como mucho, una vez por minuto. */
export function Anuncio({ c }: { c: Cuenta }) {
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {c.frase}
    </p>
  );
}

export const dos = (n: number) => String(n).padStart(2, "0");

export const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
