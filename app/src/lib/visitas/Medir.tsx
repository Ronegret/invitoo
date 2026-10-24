"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Baliza, Clic } from "./tipos";

/**
 * El script de medición. Sin cookies, sin localStorage, sin identificadores:
 * manda una baliza por vista y por clic medible y se olvida. El servidor
 * hace el resto (`/api/visitas`).
 *
 *  · En la web (`(sitio)/layout.tsx`): <Medir />
 *  · En una invitación (`/i/[slug]`): <Medir slug={slug} /> — cuenta como
 *    apertura de esa boda (o como vista de plantilla si es una demo).
 *
 * Clics medibles: cualquier enlace a WhatsApp, y «Reservar»: un elemento con
 * `data-medir="reservar"` o un botón/enlace cuyo texto empiece por «Reservar».
 */

/**
 * E3 · Si el navegador pide no ser rastreado (Global Privacy Control o Do
 * Not Track), no se mide nada. Cuesta algo de precisión y deja la medición
 * del lado más prudente (doc 24, §E3).
 */
function noRastrear(): boolean {
  try {
    const n = navigator as Navigator & { globalPrivacyControl?: boolean };
    return n.globalPrivacyControl === true || n.doNotTrack === "1";
  } catch {
    return false;
  }
}

function enviar(b: Baliza) {
  try {
    if (noRastrear()) return;
    const cuerpo = JSON.stringify(b);
    // text/plain: sendBeacon sin preflight y sin cabeceras raras.
    if (navigator.sendBeacon?.(`/api/visitas`, new Blob([cuerpo], { type: "text/plain" }))) return;
    void fetch("/api/visitas", { method: "POST", body: cuerpo, keepalive: true, headers: { "Content-Type": "text/plain" } });
  } catch {
    /* medir nunca puede romper la página */
  }
}

/** Solo la primera vista de la sesión de página trae el referer (las navegaciones internas no). */
let primera = true;
/** La última vista enviada: evita contar dos veces el mismo render (StrictMode en desarrollo). */
let ultima = { clave: "", t: 0 };

function clicDe(el: Element | null): Clic | null {
  const objetivo = el?.closest("a,button,[data-medir]");
  if (!objetivo) return null;
  const marcado = objetivo.getAttribute("data-medir");
  if (marcado === "reservar" || marcado === "whatsapp") return marcado;
  const href = objetivo.getAttribute("href") ?? "";
  if (/(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/.test(href)) return "whatsapp";
  if (/^\s*reservar/i.test(objetivo.textContent ?? "")) return "reservar";
  return null;
}

export default function Medir({ slug }: { slug?: string }) {
  const ruta = usePathname();

  useEffect(() => {
    if (!ruta) return;
    const clave = `${ruta}${window.location.search}`;
    if (ultima.clave === clave && Date.now() - ultima.t < 1500) return;
    ultima = { clave, t: Date.now() };
    const q = new URLSearchParams(window.location.search);
    const utm = q.get("utm_source") || q.get("utm_medium") || q.get("utm_campaign") || undefined;
    let ref: string | undefined;
    try {
      // Solo el dominio, y solo si viene de fuera.
      const r = primera && document.referrer ? new URL(document.referrer) : null;
      if (r && r.host !== window.location.host) ref = `${r.protocol}//${r.host}/`;
    } catch {
      ref = undefined;
    }
    const entrada = primera;
    primera = false;
    enviar({ t: "v", r: ruta, ref, utm: entrada ? utm : undefined, s: slug, e: entrada ? 1 : undefined });
  }, [ruta, slug]);

  useEffect(() => {
    const alPulsar = (e: MouseEvent) => {
      const k = clicDe(e.target as Element | null);
      if (k) enviar({ t: "c", k, r: window.location.pathname });
    };
    document.addEventListener("click", alPulsar, { capture: true, passive: true });
    return () => document.removeEventListener("click", alPulsar, { capture: true });
  }, []);

  return null;
}
