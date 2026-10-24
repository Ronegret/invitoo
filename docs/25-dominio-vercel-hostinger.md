# Dominio invitoo.es: de Hostinger a Vercel

Comprobado el 24-10-2026.

## Situación actual
- Los DNS están en Hostinger (`ns1/ns2.dns-parking.com`).
- `invitoo.es`: registros A a `195.35.60.224` y `191.101.104.171`, que son el hosting de Hostinger donde está la web antigua.
- `www.invitoo.es`: CNAME a `www.invitoo.es.cdn.hstgr.net`, la CDN de Hostinger.
- **Correo:** MX `mx1.hostinger.com` (5) y `mx2.hostinger.com` (10), con SPF `v=spf1 include:_spf.mail.hostinger.com ~all`. **No se tocan**, porque si no, dejaría de llegar el correo de @invitoo.es.
- El proyecto `invitoo` de Vercel ya tiene añadidos los dominios `invitoo.es` (redirige con 308 a www) y `www.invitoo.es`. Están en «Invalid Configuration» porque los DNS aún no apuntan a Vercel y porque el proyecto todavía no tiene ningún despliegue.

## Cuándo cambiar
Cuando la versión nueva esté desplegada y revisada en `https://invitoo-one.vercel.app`, decisión de Rodrigo del 24-10-2026. Así la web no se queda caída.

## Qué cambiar en Hostinger (DNS / Nameservers → Administrar registros DNS)
1. **Desactivar la CDN de Hostinger** para invitoo.es (Hosting → CDN). Si sigue activa, Hostinger vuelve a poner su CNAME.
2. **Borrar** los dos registros **A** de `@` (`195.35.60.224` y `191.101.104.171`) y cualquier **AAAA** de `@`.
3. **Crear** el registro A: `@` → `216.198.79.1`, TTL 3600 o el mínimo.
4. **Borrar** el CNAME de `www` que va a `cdn.hstgr.net` y **crear** un CNAME: `www` → `334b16d846cca46e.vercel-dns-017.com.`
5. **No tocar:** MX, el TXT del SPF, ni los registros DKIM y DMARC si los hay.
6. **Después**, en Vercel → Settings → Domains → Refresh. El certificado SSL se emite solo, en unos minutos.

Cuando haya Resend (correos automáticos), se añaden sus registros DKIM y SPF sin quitar los de Hostinger. Para el SPF hay que unir las dos fuentes en un solo TXT: `v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all`. Hay que confirmar con los valores que dé Resend.
