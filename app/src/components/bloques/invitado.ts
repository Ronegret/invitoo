"use client";

import { useEffect, useState } from "react";

/**
 * El invitado que abre la invitación, si el enlace es personal.
 *
 * La página de la invitación es estática —la misma para los ciento veinte
 * invitados—, así que la personalización se lee aquí, en el navegador:
 * `/i/<slug>?n=<token>` → `GET /api/invitado?slug=&n=` → `{ nombre, cupo }`.
 *
 * Una sola petición por visita aunque la pidan el rótulo de la apertura, la
 * portada y el formulario a la vez: se guarda la promesa.
 */
export type Invitado = {
  token: string;
  nombre: string;
  /** Plazas que tiene reservadas, contándole a él. */
  cupo: number;
  /**
   * Para el «Querida/Querido/Queridos». Si la API no lo sabe, no se adivina
   * por el nombre: se escribe «Para Carmen», que nunca falla.
   */
  trato?: "querida" | "querido" | "queridos";
};

const cache = new Map<string, Promise<Invitado | null>>();

export function leerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const n = new URLSearchParams(window.location.search).get("n");
    const limpio = n?.trim().slice(0, 120);
    return limpio ? limpio : null;
  } catch {
    return null;
  }
}

function valido(x: unknown, token: string): Invitado | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const nombre = typeof o.nombre === "string" ? o.nombre.trim().slice(0, 80) : "";
  const cupo = Number(o.cupo);
  if (!nombre) return null;
  const trato =
    o.trato === "querida" || o.trato === "querido" || o.trato === "queridos"
      ? o.trato
      : undefined;
  return {
    token,
    nombre,
    cupo: Number.isInteger(cupo) && cupo >= 1 ? Math.min(cupo, 20) : 1,
    trato,
  };
}

export function cargarInvitado(slug: string): Promise<Invitado | null> {
  const token = leerToken();
  if (!token || !slug) return Promise.resolve(null);
  const clave = `${slug}|${token}`;
  let p = cache.get(clave);
  if (!p) {
    const q = new URLSearchParams({ slug, n: token });
    p = fetch(`/api/invitado?${q.toString()}`, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => valido(j, token))
      .catch(() => null);
    cache.set(clave, p);
  }
  return p;
}

export function useInvitado(slug: string): Invitado | null {
  const [invitado, setInvitado] = useState<Invitado | null>(null);
  useEffect(() => {
    let vivo = true;
    void cargarInvitado(slug).then((i) => {
      if (vivo) setInvitado(i);
    });
    return () => {
      vivo = false;
    };
  }, [slug]);
  return invitado;
}

/** «Querida Carmen,» si se sabe el trato; «Para Carmen» si no. */
export function saludoDe(i: Invitado): string {
  if (i.trato === "querida") return `Querida ${i.nombre},`;
  if (i.trato === "querido") return `Querido ${i.nombre},`;
  if (i.trato === "queridos") return `Queridos ${i.nombre},`;
  return `Para ${i.nombre}`;
}
