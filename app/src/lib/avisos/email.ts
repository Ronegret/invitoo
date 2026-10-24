import "server-only";

/**
 * El correo de Avisos. Con `RESEND_API_KEY`, se manda con la API de Resend
 * por `fetch` (sin SDK: una petición POST y nada más). Sin clave, se escribe
 * en el log del servidor: en local se ve qué habría salido.
 *
 *   RESEND_API_KEY    — clave de Resend (opcional).
 *   AVISOS_REMITENTE  — «Invitoo <avisos@invitoo.es>» por defecto. El dominio
 *                       tiene que estar verificado en Resend.
 */

export type Correo = { para: string[]; asunto: string; texto: string; html: string };

export function hayEmail() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function enviarEmail(c: Correo): Promise<boolean> {
  const para = [...new Set(c.para.map((x) => x.trim().toLowerCase()).filter((x) => /.+@.+\..+/.test(x)))].slice(0, 10);
  if (!para.length) return false;
  const clave = process.env.RESEND_API_KEY;
  if (!clave) {
    console.info(`[avisos.email] (sin RESEND_API_KEY, no se envía) para=${para.join(",")} asunto=«${c.asunto}»\n${c.texto}`);
    return true;
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.AVISOS_REMITENTE || "Invitoo <avisos@invitoo.es>",
        to: para,
        subject: c.asunto,
        text: c.texto,
        html: c.html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error("[avisos.email]", r.status, (await r.text()).slice(0, 300));
    return r.ok;
  } catch (e) {
    console.error("[avisos.email]", e);
    return false;
  }
}

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/**
 * Plantilla del correo: papel de Invitoo, granate y Bodoni de reserva.
 * Tabla y estilos en línea: es lo único que respetan todos los clientes.
 */
export function plantillaCorreo(o: {
  saludo: string;
  lineas: { titulo: string; detalle?: string | null }[];
  boton: { texto: string; url: string };
  pie?: string;
}) {
  const filas = o.lineas
    .map(
      (l) =>
        `<tr><td style="padding:14px 0;border-top:1px solid #eadfd6"><p style="margin:0;font-size:17px;color:#1F1A17">${escapar(l.titulo)}</p>${
          l.detalle ? `<p style="margin:4px 0 0;font-size:15px;color:#5E5650">${escapar(l.detalle)}</p>` : ""
        }</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#FAF8F5;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #eadfd6;border-radius:18px">
<tr><td style="padding:28px 28px 8px"><p style="margin:0;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#8C1D2C">Invitoo</p>
<h1 style="margin:10px 0 0;font-family:'Bodoni Moda',Didot,Georgia,serif;font-weight:400;font-size:28px;line-height:1.15;color:#1F1A17">${escapar(o.saludo)}</h1></td></tr>
<tr><td style="padding:8px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas}</table></td></tr>
<tr><td style="padding:18px 28px 28px"><a href="${escapar(o.boton.url)}" style="display:inline-block;background:#8C1D2C;color:#ffffff;text-decoration:none;font-size:16px;padding:14px 26px;border-radius:999px">${escapar(o.boton.texto)}</a>
${o.pie ? `<p style="margin:22px 0 0;font-size:13px;color:#5E5650">${escapar(o.pie)}</p>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
  const texto = [o.saludo, "", ...o.lineas.map((l) => `· ${l.titulo}${l.detalle ? ` — ${l.detalle}` : ""}`), "", `${o.boton.texto}: ${o.boton.url}`, o.pie ? `\n${o.pie}` : ""].join("\n");
  return { html, texto };
}
