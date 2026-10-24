"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Un valor de localStorage como estado de React, sin desajuste de
 * hidratación: en el servidor (y en el primer pintado) vale `null`.
 */
const EVENTO = "invitoo:local";

function suscribir(f: () => void) {
  window.addEventListener("storage", f);
  window.addEventListener(EVENTO, f);
  return () => {
    window.removeEventListener("storage", f);
    window.removeEventListener(EVENTO, f);
  };
}

/** Si el navegador no deja guardar (modo privado), se recuerda en memoria. */
const memoria = new Map<string, string>();

function leer(clave: string) {
  try {
    return localStorage.getItem(clave) ?? memoria.get(clave) ?? null;
  } catch {
    return memoria.get(clave) ?? null;
  }
}

export function useLocal(clave: string): [string | null, (v: string | null) => void] {
  const valor = useSyncExternalStore(
    suscribir,
    () => leer(clave),
    () => null,
  );
  const poner = useCallback(
    (v: string | null) => {
      if (v === null) memoria.delete(clave);
      else memoria.set(clave, v);
      try {
        if (v === null) localStorage.removeItem(clave);
        else localStorage.setItem(clave, v);
      } catch {}
      window.dispatchEvent(new Event(EVENTO));
    },
    [clave],
  );
  return [valor, poner];
}

/** ¿Ya estamos en el navegador? (false en el servidor y al hidratar). */
const nada = () => () => {};
export function useHidratado() {
  return useSyncExternalStore(nada, () => true, () => false);
}
