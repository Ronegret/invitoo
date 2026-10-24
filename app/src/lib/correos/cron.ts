import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Puerta de los crons de correos: `Authorization: Bearer <CRON_SECRET>`, que
 * es lo que manda Vercel Cron. En `next dev` sin `CRON_SECRET`, abierta: así
 * se prueba en localhost (`curl localhost:3100/api/correos/novios?hoy=2026-12-01`).
 */
export function cronAutorizado(cabeceras: Headers): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return process.env.NODE_ENV !== "production";
  const dada = Buffer.from(cabeceras.get("authorization") ?? "");
  const esperada = Buffer.from(`Bearer ${secreto}`);
  return dada.length === esperada.length && timingSafeEqual(dada, esperada);
}

/**
 * `?hoy=yyyy-mm-dd` para simular un día (pruebas de la secuencia). Solo fuera
 * de producción (o con `CORREOS_SIMULAR=1`): en producción, simular el 13 de
 * junio mandaría de verdad «mañana es el día» un mes antes.
 */
export function hoyDe(url: string): string | undefined {
  if (process.env.NODE_ENV === "production" && process.env.CORREOS_SIMULAR !== "1") return undefined;
  const h = new URL(url).searchParams.get("hoy");
  return h && /^\d{4}-\d{2}-\d{2}$/.test(h) ? h : undefined;
}
