import "server-only";

import { createPrivateKey, sign } from "node:crypto";

/**
 * Notificaciones del navegador (Web Push), sin dependencias.
 *
 * Se manda un push SIN carga útil: así no hay que cifrar nada (RFC 8291) y
 * basta con firmar un JWT VAPID (RFC 8292) con ES256. El service worker
 * (`/panel/sw.js`) se despierta, pide el último aviso a `/api/avisos/ultimo`
 * con el endpoint de su suscripción y lo enseña.
 *
 *   VAPID_PUBLIC_KEY  — clave pública P-256 sin comprimir, base64url (65 bytes).
 *   VAPID_PRIVATE_KEY — clave privada, base64url (32 bytes).
 *   VAPID_SUBJECT     — «mailto:hola@invitoo.es» por defecto.
 *
 * Para generarlas: `npx web-push generate-vapid-keys` (o cualquier
 * generador VAPID). Si falta alguna, el push queda desactivado y el panel
 * esconde la opción.
 */

export function clavePublicaVapid(): string | null {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  return pub && priv ? pub : null;
}

const b64u = (b: Buffer) => b.toString("base64url");

function jwt(audiencia: string): string | null {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return null;
  try {
    const bytes = Buffer.from(pub, "base64url");
    if (bytes.length !== 65) return null;
    const clave = createPrivateKey({
      key: {
        kty: "EC",
        crv: "P-256",
        d: priv,
        x: b64u(bytes.subarray(1, 33)),
        y: b64u(bytes.subarray(33, 65)),
      },
      format: "jwk",
    });
    const cabecera = b64u(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
    const cuerpo = b64u(
      Buffer.from(
        JSON.stringify({
          aud: audiencia,
          exp: Math.floor(Date.now() / 1000) + 12 * 3600,
          sub: process.env.VAPID_SUBJECT || "mailto:hola@invitoo.es",
        }),
      ),
    );
    const firma = sign("sha256", Buffer.from(`${cabecera}.${cuerpo}`), { key: clave, dsaEncoding: "ieee-p1363" });
    return `${cabecera}.${cuerpo}.${b64u(firma)}`;
  } catch (e) {
    console.error("[avisos.push] claves VAPID no válidas", e);
    return null;
  }
}

/** Devuelve `false` si la suscripción ya no existe (404/410) y hay que borrarla. */
export async function enviarPush(endpoint: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const token = jwt(url.origin);
  const pub = process.env.VAPID_PUBLIC_KEY;
  if (!token || !pub) return true;
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { TTL: "86400", Urgency: "normal", Authorization: `vapid t=${token}, k=${pub}`, "Content-Length": "0" },
      signal: AbortSignal.timeout(6000),
    });
    if (r.status === 404 || r.status === 410) return false;
    if (!r.ok) console.error("[avisos.push]", r.status, (await r.text()).slice(0, 200));
    return true;
  } catch (e) {
    console.error("[avisos.push]", e);
    return true;
  }
}
