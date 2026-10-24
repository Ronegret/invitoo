"use client";

import { useEffect, useState } from "react";
import { quitarPush, suscribirPush } from "@/lib/avisos/acciones";
import { ui } from "./estilos";

type Estado = "cargando" | "sinSoporte" | "bloqueado" | "apagado" | "encendido" | "trabajando";

const aBytes = (b64: string) => {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

/**
 * Notificaciones del navegador (opcionales). Registra `/panel/sw.js`, pide
 * permiso SOLO al pulsar el botón y guarda la suscripción. Sin claves VAPID
 * en el servidor, el panel ni lo enseña.
 */
export default function ActivarPush({ slug, clave }: { slug: string; clave: string }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setEstado("sinSoporte");
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const reg = await navigator.serviceWorker.getRegistration("/panel/");
      const sub = await reg?.pushManager.getSubscription();
      setEstado(sub ? "encendido" : "apagado");
    })().catch(() => setEstado("sinSoporte"));
  }, []);

  async function encender() {
    setError("");
    setEstado("trabajando");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") return setEstado(permiso === "denied" ? "bloqueado" : "apagado");
      const reg = await navigator.serviceWorker.register("/panel/sw.js", { scope: "/panel/" });
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(clave) });
      const j = sub.toJSON();
      const r = await suscribirPush(slug, { endpoint: sub.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth });
      if (!r.ok) throw new Error(r.error);
      setEstado("encendido");
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "No se ha podido activar en este navegador.");
      setEstado("apagado");
    }
  }

  async function apagar() {
    setEstado("trabajando");
    const reg = await navigator.serviceWorker.getRegistration("/panel/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await quitarPush(slug, sub.endpoint);
      await sub.unsubscribe();
    }
    setEstado("apagado");
  }

  return (
    <div className="flex flex-col gap-3">
      <p className={ui.suave} aria-live="polite">
        {estado === "cargando" && "Comprobando este navegador…"}
        {estado === "sinSoporte" && "Este navegador no admite notificaciones. En iPhone, añadid el panel a la pantalla de inicio y abridlo desde ahí."}
        {estado === "bloqueado" && "Las notificaciones están bloqueadas para invitoo.es. Activadlas en los ajustes del navegador y volved aquí."}
        {estado === "apagado" && "Apagadas en este dispositivo."}
        {estado === "encendido" && "Encendidas en este dispositivo. Os llegará un aviso con cada novedad (salvo las que tengáis en «Nada»)."}
        {estado === "trabajando" && "Un momento…"}
      </p>
      {error && <p role="alert" className="text-[0.95rem] text-[var(--acento)]">{error}</p>}
      <div>
        {estado === "encendido" ? (
          <button type="button" onClick={apagar} className={ui.boton}>Apagar en este dispositivo</button>
        ) : (
          <button type="button" onClick={encender} disabled={estado !== "apagado"} className={ui.botonLleno}>
            Activar en este dispositivo
          </button>
        )}
      </div>
    </div>
  );
}
