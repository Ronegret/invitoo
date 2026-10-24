/**
 * GET /panel/sw.js — el service worker de las notificaciones del panel
 * (alcance /panel/). El push llega SIN carga útil (ver lib/avisos/push.ts):
 * el worker pide el último aviso a /api/avisos/ultimo con su endpoint y lo
 * enseña. Al tocarlo, abre el panel en esa sección.
 */
const SW = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let a = { titulo: "Novedades en vuestra boda", detalle: "Abrid el panel para verlo.", enlace: "/panel" };
    try {
      const sub = await self.registration.pushManager.getSubscription();
      if (sub) {
        const r = await fetch("/api/avisos/ultimo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        if (r.ok) a = Object.assign(a, await r.json());
      }
    } catch (_) {}
    await self.registration.showNotification(a.titulo, { body: a.detalle || "", icon: "/marca/sello.svg", badge: "/marca/sello.svg", data: { enlace: a.enlace || "/panel" }, tag: "invitoo-aviso" });
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.enlace || "/panel", self.location.origin).href;
  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of abiertas) if (c.url.startsWith(self.location.origin + "/panel")) { await c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  })());
});
`;

export function GET() {
  return new Response(SW, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/panel/",
      "Cache-Control": "no-cache",
    },
  });
}
