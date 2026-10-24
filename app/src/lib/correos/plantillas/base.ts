/**
 * El marco común de todos los correos de Invitoo (E2 · Contenido).
 *
 * Funciones puras, sin dependencias de servidor ni alias `@/`: se pueden
 * ejecutar en Node tal cual (las capturas de QA lo hacen) y en la galería.
 *
 * Cada plantilla describe su correo con BLOQUES (párrafos, pasos, cifras…)
 * y `componer()` produce a la vez el HTML y el texto plano. Así las dos
 * versiones nunca se separan.
 *
 * HTML a prueba de clientes:
 *  · tablas de 600 px con `role="presentation"`, todo el estilo en línea;
 *  · botón «bulletproof» (VML en Outlook de escritorio);
 *  · modo oscuro: `color-scheme`, `@media (prefers-color-scheme: dark)` para
 *    Apple Mail / iOS, y `[data-ogsc]`/`[data-ogsb]` para Outlook.com y
 *    las apps de Outlook. Gmail app invierte por su cuenta: los colores
 *    claros de base están elegidos para que la inversión siga siendo legible;
 *  · preheader visible arriba (y relleno invisible para que la bandeja no
 *    arrastre el texto siguiente);
 *  · texto ≥ 16 px en todo, contraste AA (tinta #12100E / #2A2420 sobre
 *    papel, gris #5E5650 = 6,9:1), alt en todas las imágenes, `lang="es"`.
 */

/* ───────────────────────── Colores (doc 17 §3) ───────────────────────── */

export const C = {
  bruma: "#EDE6DD",
  papel: "#FAF8F5",
  tinta: "#12100E",
  texto: "#2A2420",
  suave: "#5E5650",
  borde: "#E3D8CC",
  granate: "#8C1D2C",
  oro: "#B08D57",
  // Oscuro
  oFondo: "#141110",
  oCarta: "#1E1A17",
  oBorde: "#3A322C",
  oTexto: "#F3EEE8",
  oSuave: "#CDC2B6",
  oAcento: "#E8B4BB",
  oOro: "#C9A66B",
  oNota: "#2A2420",
} as const;

const SERIF = "'Bodoni Moda',Didot,'Bodoni 72','Times New Roman',Georgia,serif";
const SANS = "'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

/* ───────────────────────── Utilidades puras ───────────────────────── */

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/** «Ana y Pablo», «Lucía e Ignacio». */
export function pareja(p: { a: string; b: string }) {
  const a = p.a.trim();
  const b = p.b.trim();
  if (!a && !b) return "";
  if (!b) return a;
  if (!a) return b;
  const e = /^(h?i)(?![aeiouáéó])/i.test(b) ? "e" : "y";
  return `${a} ${e} ${b}`;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «14 de junio de 2027» (sin año con `corta`). Recibe ISO yyyy-mm-dd. */
export function fechaLarga(iso: string | null | undefined, corta = false) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const dia = Number(m[3]);
  const mes = MESES[Number(m[2]) - 1] ?? "";
  return corta ? `${dia} de ${mes}` : `${dia} de ${mes} de ${m[1]}`;
}

/** Suma días a un ISO yyyy-mm-dd (UTC, sin zona: solo calendario). */
export function sumarDias(iso: string, dias: number) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const NUM = new Intl.NumberFormat("es-ES");
export const num = (n: number | null | undefined) => NUM.format(n ?? 0);

const EUR = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const EUR2 = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Céntimos → «149 €» o «74,50 €» (nunca «74,5 €»). */
export const euros = (centimos: number | null | undefined) => {
  const c = Math.round(centimos ?? 0);
  return (c % 100 === 0 ? EUR : EUR2).format(c / 100);
};

/** «1 persona» / «3 personas». */
export const plural = (n: number, uno: string, varios: string) => `${num(n)} ${n === 1 ? uno : varios}`;

/** Tendencia legible sin depender del color: «▲ 23 %», «▼ 5 %», «= igual», «nuevo». */
export function tendencia(t: { actual: number; anterior: number }) {
  if (t.anterior === 0) return t.actual === 0 ? "= igual" : "▲ nuevo";
  const p = Math.round(((t.actual - t.anterior) / t.anterior) * 100);
  if (p === 0) return "= igual";
  return p > 0 ? `▲ ${p} %` : `▼ ${Math.abs(p)} %`;
}

/** Origen absoluto para las imágenes, sacado de un enlace del correo. */
export function origenDe(...urls: (string | undefined | null)[]) {
  for (const u of urls) {
    if (!u) continue;
    try {
      return new URL(u).origin;
    } catch {
      /* relativo: probamos el siguiente */
    }
  }
  return "https://invitoo.es";
}

/* ───────────────────────── Bloques ───────────────────────── */

export type Bloque =
  /** Párrafo. `destacado` lo pone en serif algo mayor (la frase de entrada). */
  | { tipo: "p"; texto: string; destacado?: boolean }
  /** Pasos numerados con título y una línea. */
  | { tipo: "pasos"; items: { titulo: string; texto: string }[] }
  /** Lista con viñeta de aro dorado. */
  | { tipo: "lista"; items: string[] }
  /** Cifras grandes en rejilla de 2 o 3 (en móvil se apilan de 2 en 2). */
  | { tipo: "cifras"; items: { valor: string; etiqueta: string; nota?: string }[] }
  /** Tabla de dos columnas: «clave · valor». */
  | { tipo: "tabla"; titulo?: string; filas: [string, string][]; vacio?: string }
  /** Barras horizontales (tablas: funcionan hasta en Outlook). */
  | { tipo: "barras"; titulo?: string; filas: { etiqueta: string; valor: number; texto?: string }[] }
  /** Recuadro sobre bruma: un consejo, un código, un dato aparte. */
  | { tipo: "nota"; titulo?: string; texto: string; codigo?: string }
  /** Cita en serif cursiva (un deseo del Libro). */
  | { tipo: "cita"; texto: string; autor?: string | null }
  /** Subtítulo de sección (correos del estudio). */
  | { tipo: "seccion"; texto: string };

export type Pie =
  | { tipo: "servicio"; preferencias: string; baja?: string; motivo: string }
  | { tipo: "fidelizacion"; preferencias: string; baja: string; motivo: string }
  | { tipo: "estudio"; ajustes: string };

export type Composicion = {
  asunto: string;
  preheader: string;
  /** Antetítulo en versalitas granate («Faltan 7 días»). */
  antetitulo?: string;
  titulo: string;
  bloques: Bloque[];
  cta: { texto: string; url: string };
  /** Línea tras el botón, en pequeño-pero-legible. */
  posdata?: string;
  /** Firma del estudio (no en los correos internos). */
  firma?: boolean;
  pie: Pie;
  /** Origen absoluto para el logo (`https://invitoo.es`). */
  origen: string;
  /** Correo interno: más denso y sin firma. */
  interno?: boolean;
};

/* ───────────────────────── HTML de cada bloque ───────────────────────── */

const P = (extra = "") =>
  `margin:0 0 18px;font-family:${SANS};font-size:17px;line-height:1.6;color:${C.texto};${extra}`;

function htmlBloque(b: Bloque): string {
  switch (b.tipo) {
    case "p":
      return b.destacado
        ? `<p class="b-texto" style="margin:0 0 20px;font-family:${SERIF};font-size:21px;line-height:1.45;color:${C.tinta}">${esc(b.texto)}</p>`
        : `<p class="b-texto" style="${P()}">${esc(b.texto)}</p>`;

    case "seccion":
      return `<p class="b-acento" style="margin:28px 0 12px;font-family:${SANS};font-size:16px;line-height:1.3;letter-spacing:.14em;text-transform:uppercase;color:${C.granate}">${esc(b.texto)}</p>`;

    case "pasos":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px">${b.items
        .map(
          (it, i) => `<tr>
<td valign="top" width="44" style="width:44px;padding:4px 0 16px"><p class="b-oro" style="margin:0;font-family:${SERIF};font-size:30px;line-height:1;color:${C.oro}">${i + 1}</p></td>
<td valign="top" style="padding:4px 0 16px"><p class="b-texto" style="margin:0;font-family:${SANS};font-size:17px;line-height:1.4;font-weight:600;color:${C.tinta}">${esc(it.titulo)}</p>
<p class="b-suave" style="margin:4px 0 0;font-family:${SANS};font-size:16px;line-height:1.55;color:${C.suave}">${esc(it.texto)}</p></td></tr>`,
        )
        .join("")}</table>`;

    case "lista":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px">${b.items
        .map(
          (t) => `<tr><td valign="top" width="28" style="width:28px;padding:2px 0 12px"><p class="b-oro" aria-hidden="true" style="margin:0;font-family:${SERIF};font-size:20px;line-height:1.3;color:${C.oro}">&#9702;</p></td>
<td valign="top" style="padding:2px 0 12px"><p class="b-texto" style="margin:0;font-family:${SANS};font-size:17px;line-height:1.55;color:${C.texto}">${esc(t)}</p></td></tr>`,
        )
        .join("")}</table>`;

    case "cifras": {
      const n = b.items.length;
      const ancho = n >= 3 ? "33%" : n === 2 ? "50%" : "100%";
      const celdas = b.items
        .map(
          (it) => `<td class="b-cifra" valign="top" width="${ancho}" style="width:${ancho};padding:6px 6px 14px;text-align:center">
<p class="b-texto" style="margin:0;font-family:${SERIF};font-size:36px;line-height:1.1;color:${C.tinta}">${esc(it.valor)}</p>
<p class="b-suave" style="margin:6px 0 0;font-family:${SANS};font-size:16px;line-height:1.35;color:${C.suave}">${esc(it.etiqueta)}</p>${
            it.nota ? `<p class="b-suave" style="margin:2px 0 0;font-family:${SANS};font-size:16px;line-height:1.35;color:${C.suave}">${esc(it.nota)}</p>` : ""
          }</td>`,
        )
        .join("");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="b-borde" style="margin:4px 0 22px;border-top:1px solid ${C.borde};border-bottom:1px solid ${C.borde}"><tr><td style="padding:16px 0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${celdas}</tr></table></td></tr></table>`;
    }

    case "tabla":
      return `${b.titulo ? htmlBloque({ tipo: "seccion", texto: b.titulo }) : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px">${
        b.filas.length
          ? b.filas
              .map(
                ([k, v], i) => `<tr><td class="b-texto b-borde" style="padding:10px 12px 10px 0;border-top:${i === 0 && !b.titulo ? "0" : `1px solid ${C.borde}`};font-family:${SANS};font-size:16px;line-height:1.4;color:${C.texto};word-break:break-word">${esc(k)}</td>
<td class="b-texto b-borde" align="right" style="padding:10px 0;border-top:${i === 0 && !b.titulo ? "0" : `1px solid ${C.borde}`};font-family:${SANS};font-size:16px;line-height:1.4;color:${C.tinta};font-weight:600;white-space:nowrap">${esc(v)}</td></tr>`,
              )
              .join("")
          : `<tr><td class="b-suave b-borde" style="padding:10px 0;border-top:1px solid ${C.borde};font-family:${SANS};font-size:16px;color:${C.suave}">${esc(b.vacio ?? "Sin datos")}</td></tr>`
      }</table>`;

    case "barras": {
      const max = Math.max(1, ...b.filas.map((f) => f.valor));
      return `${b.titulo ? htmlBloque({ tipo: "seccion", texto: b.titulo }) : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px">${b.filas
        .map((f) => {
          const pc = Math.max(2, Math.round((f.valor / max) * 100));
          return `<tr><td class="b-suave" width="64" style="width:64px;padding:5px 8px 5px 0;font-family:${SANS};font-size:16px;line-height:1.2;color:${C.suave};white-space:nowrap">${esc(f.etiqueta)}</td>
<td style="padding:5px 0"><table role="presentation" width="${pc}%" cellpadding="0" cellspacing="0" border="0"><tr><td class="b-barra" height="14" style="height:14px;line-height:14px;font-size:1px;background:${C.granate};border-radius:3px">&nbsp;</td></tr></table></td>
<td class="b-texto" align="right" width="56" style="width:56px;padding:5px 0 5px 8px;font-family:${SANS};font-size:16px;line-height:1.2;color:${C.tinta}">${esc(f.texto ?? num(f.valor))}</td></tr>`;
        })
        .join("")}</table>`;
    }

    case "nota":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px"><tr><td class="b-nota" style="padding:20px 22px;background:${C.bruma};border-radius:12px">${
        b.titulo ? `<p class="b-texto" style="margin:0 0 6px;font-family:${SANS};font-size:16px;font-weight:600;line-height:1.4;color:${C.tinta}">${esc(b.titulo)}</p>` : ""
      }<p class="b-texto" style="margin:0;font-family:${SANS};font-size:16px;line-height:1.55;color:${C.texto}">${esc(b.texto)}</p>${
        b.codigo
          ? `<p class="b-acento" style="margin:12px 0 0;font-family:${SERIF};font-size:26px;line-height:1.2;letter-spacing:.12em;color:${C.granate}">${esc(b.codigo)}</p>`
          : ""
      }</td></tr></table>`;

    case "cita":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px"><tr><td class="b-oro-borde" style="padding:4px 0 4px 20px;border-left:2px solid ${C.oro}">
<p class="b-texto" style="margin:0;font-family:${SERIF};font-style:italic;font-size:21px;line-height:1.45;color:${C.tinta}">«${esc(b.texto)}»</p>${
        b.autor ? `<p class="b-suave" style="margin:8px 0 0;font-family:${SANS};font-size:16px;line-height:1.4;color:${C.suave}">— ${esc(b.autor)}</p>` : ""
      }</td></tr></table>`;
  }
}

/* ───────────────────────── Texto plano de cada bloque ───────────────────────── */

function textoBloque(b: Bloque): string {
  switch (b.tipo) {
    case "p":
      return b.texto;
    case "seccion":
      return `— ${b.texto.toUpperCase()} —`;
    case "pasos":
      return b.items.map((it, i) => `${i + 1}. ${it.titulo}\n   ${it.texto}`).join("\n");
    case "lista":
      return b.items.map((t) => `· ${t}`).join("\n");
    case "cifras":
      return b.items
        .map((it) => `· ${it.etiqueta.charAt(0).toUpperCase()}${it.etiqueta.slice(1)}: ${it.valor}${it.nota ? ` (${it.nota})` : ""}`)
        .join("\n");
    case "tabla":
      return [b.titulo ? `— ${b.titulo.toUpperCase()} —` : "", ...(b.filas.length ? b.filas.map(([k, v]) => `· ${k}: ${v}`) : [b.vacio ?? "Sin datos"])]
        .filter(Boolean)
        .join("\n");
    case "barras":
      return [b.titulo ? `— ${b.titulo.toUpperCase()} —` : "", ...b.filas.map((f) => `· ${f.etiqueta}: ${f.texto ?? num(f.valor)}`)].filter(Boolean).join("\n");
    case "nota":
      return [b.titulo ? `[ ${b.titulo} ]` : "", b.texto, b.codigo ? `Código: ${b.codigo}` : ""].filter(Boolean).join("\n");
    case "cita":
      return `«${b.texto}»${b.autor ? `\n— ${b.autor}` : ""}`;
  }
}

/* ───────────────────────── Botón a prueba de Outlook ───────────────────────── */

function boton(texto: string, url: string) {
  const u = esc(url);
  const t = esc(texto);
  // Ancho aproximado para el VML (Outlook no mide el texto).
  const ancho = Math.min(520, Math.max(220, texto.length * 10 + 72));
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 4px"><tr><td align="center">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${u}" style="height:54px;v-text-anchor:middle;width:${ancho}px" arcsize="50%" stroke="f" fillcolor="${C.granate}"><w:anchorlock/><center style="color:${C.papel};font-family:Arial,sans-serif;font-size:17px">${t}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a class="b-boton" href="${u}" target="_blank" style="display:inline-block;background:${C.granate};color:${C.papel};font-family:${SANS};font-size:17px;line-height:22px;font-weight:600;letter-spacing:.02em;text-decoration:none;padding:16px 34px;border-radius:999px;border:1px solid ${C.granate};mso-hide:all">${t}</a><!--<![endif]-->
</td></tr></table>`;
}

/* ───────────────────────── CSS: móvil y modo oscuro ───────────────────────── */

const REGLAS_OSCURO = `
.b-fondo{background:${C.oFondo}!important}
.b-carta{background:${C.oCarta}!important;border-color:${C.oBorde}!important}
.b-texto{color:${C.oTexto}!important}
.b-suave{color:${C.oSuave}!important}
.b-acento{color:${C.oAcento}!important}
.b-oro{color:${C.oOro}!important}
.b-borde{border-color:${C.oBorde}!important}
.b-oro-borde{border-color:${C.oOro}!important}
.b-filete{background:${C.oOro}!important}
.b-nota{background:${C.oNota}!important}
.b-barra{background:${C.oAcento}!important}
.b-boton{border-color:${C.oOro}!important}
.b-enlace{color:${C.oAcento}!important}
.logo-claro{display:none!important}
.logo-oscuro{display:block!important;max-height:none!important;overflow:visible!important}`;

/** Lo mismo con el prefijo de Outlook.com / apps de Outlook. */
const REGLAS_OUTLOOK = REGLAS_OSCURO.replace(/^\./gm, "[data-ogsc] .").replace(/\[data-ogsc\] \.b-(fondo|carta|nota|barra|filete)/g, "[data-ogsb] .b-$1");

const CSS = `
:root{color-scheme:light dark;supported-color-schemes:light dark}
body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
@media screen and (max-width:480px){
.b-pad{padding-left:22px!important;padding-right:22px!important}
.b-h1{font-size:29px!important}
.b-cifra{display:inline-block!important;width:48%!important;box-sizing:border-box}
}
@media (prefers-color-scheme:dark){${REGLAS_OSCURO}
}
${REGLAS_OUTLOOK}
`;

/** Para la galería y las capturas: fuerza el modo oscuro sin depender del sistema. */
export function forzarOscuro(html: string) {
  return html.replace("@media (prefers-color-scheme:dark){", "@media all{");
}

/* ───────────────────────── Pie ───────────────────────── */

const ENLACE = (url: string, t: string) =>
  `<a class="b-enlace" href="${esc(url)}" target="_blank" style="color:${C.granate};text-decoration:underline">${esc(t)}</a>`;

/** Titular: se enseña la razón social cuando deje de ser un marcador. */
export const REMITENTE_PIE = "Invitoo · Estudio de invitaciones digitales · Barcelona · invitoo.es";

function htmlPie(p: Pie) {
  const lineas: string[] = [];
  if (p.tipo === "estudio") {
    lineas.push(`Correo interno del estudio. ${ENLACE(p.ajustes, "Ajustar avisos")}`);
  } else {
    lineas.push(esc(p.motivo));
    const enlaces = [ENLACE(p.preferencias, "Elegir qué correos recibís")];
    if (p.baja) enlaces.push(ENLACE(p.baja, p.tipo === "fidelizacion" ? "No quiero recibir más correos como este" : "Darse de baja"));
    lineas.push(enlaces.join(" &nbsp;·&nbsp; "));
    lineas.push(esc(REMITENTE_PIE));
  }
  return lineas
    .map((l) => `<p class="b-suave" style="margin:0 0 10px;font-family:${SANS};font-size:16px;line-height:1.5;color:${C.suave}">${l}</p>`)
    .join("");
}

function textoPie(p: Pie) {
  if (p.tipo === "estudio") return `Correo interno del estudio. Ajustar avisos: ${p.ajustes}`;
  return [
    p.motivo,
    `Elegir qué correos recibís: ${p.preferencias}`,
    p.baja ? `${p.tipo === "fidelizacion" ? "No recibir más correos como este" : "Darse de baja"}: ${p.baja}` : "",
    REMITENTE_PIE,
  ]
    .filter(Boolean)
    .join("\n");
}

/* ───────────────────────── Componer ───────────────────────── */

/** Relleno tras el preheader para que la bandeja no arrastre más texto. */
const RELLENO = "&#847;&zwnj;&nbsp;".repeat(60);

export function componer(c: Composicion) {
  const logoClaro = `${c.origen}/correo/logo-granate.png`;
  const logoOscuro = `${c.origen}/correo/logo-oro.png`;
  const cuerpo = c.bloques.map(htmlBloque).join("\n");

  const html = `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(c.asunto)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<!-- E3: sin Google Fonts. Cargarlas desde el correo manda la IP del destinatario a Google (RGPD) y no aporta: Apple Mail ya tiene Didot y Bodoni 72; el resto cae en Georgia y la sans del sistema. -->
<style>${CSS}</style>
</head>
<body class="b-fondo" style="margin:0;padding:0;width:100%;background:${C.bruma}">
<div role="article" aria-roledescription="email" aria-label="${esc(c.asunto)}" lang="es" class="b-fondo" style="background:${C.bruma}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="b-fondo" style="background:${C.bruma}">
<tr><td align="center" style="padding:20px 12px 28px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
<tr><td class="b-pad" align="center" style="padding:0 28px 16px">
<p class="b-suave" style="margin:0;font-family:${SERIF};font-style:italic;font-size:16px;line-height:1.45;color:${C.suave}">${esc(c.preheader)}</p>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all" aria-hidden="true">${RELLENO}</div>
</td></tr>
<tr><td class="b-carta" style="background:${C.papel};border:1px solid ${C.borde};border-radius:18px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td class="b-pad" align="center" style="padding:36px 44px 0">
<img class="logo-claro" src="${logoClaro}" width="168" height="42" alt="Invitoo" style="display:block;width:168px;height:42px;margin:0 auto;font-family:${SERIF};font-size:22px;color:${C.granate}">
<!--[if !mso]><!--><div class="logo-oscuro" style="display:none;max-height:0;overflow:hidden;mso-hide:all"><img src="${logoOscuro}" width="168" height="42" alt="Invitoo" style="display:block;width:168px;height:42px;margin:0 auto;font-family:${SERIF};font-size:22px;color:${C.oOro}"></div><!--<![endif]-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto 0"><tr><td class="b-filete" width="48" height="1" style="width:48px;height:1px;line-height:1px;font-size:1px;background:${C.oro}">&nbsp;</td></tr></table>
</td></tr>
<tr><td class="b-pad" style="padding:26px 44px 8px">
${c.antetitulo ? `<p class="b-acento" style="margin:0 0 10px;text-align:center;font-family:${SANS};font-size:16px;line-height:1.3;letter-spacing:.16em;text-transform:uppercase;color:${C.granate}">${esc(c.antetitulo)}</p>` : ""}
<h1 class="b-texto b-h1" style="margin:0 0 26px;text-align:center;font-family:${SERIF};font-weight:400;font-size:${c.interno ? 30 : 34}px;line-height:1.18;color:${C.tinta}">${esc(c.titulo)}</h1>
${cuerpo}
</td></tr>
<tr><td class="b-pad" align="center" style="padding:6px 44px ${c.posdata || c.firma ? 8 : 40}px">
${boton(c.cta.texto, c.cta.url)}
</td></tr>
${
  c.posdata || c.firma
    ? `<tr><td class="b-pad" style="padding:18px 44px 40px">${
        c.posdata ? `<p class="b-suave" style="margin:0 0 18px;text-align:center;font-family:${SANS};font-size:16px;line-height:1.55;color:${C.suave}">${esc(c.posdata)}</p>` : ""
      }${
        c.firma
          ? `<p class="b-texto" style="margin:0;text-align:center;font-family:${SERIF};font-style:italic;font-size:19px;line-height:1.4;color:${C.tinta}">Con cariño,<br>el estudio de Invitoo</p>`
          : ""
      }</td></tr>`
    : ""
}
</table>
</td></tr>
<tr><td class="b-pad" align="center" style="padding:24px 28px 0;text-align:center">
${htmlPie(c.pie)}
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</div>
</body>
</html>`;

  const texto = [
    c.preheader,
    "",
    "INVITOO",
    "",
    c.antetitulo ? c.antetitulo.toUpperCase() : "",
    c.titulo,
    "",
    c.bloques.map(textoBloque).join("\n\n"),
    "",
    `→ ${c.cta.texto}: ${c.cta.url}`,
    c.posdata ? `\n${c.posdata}` : "",
    c.firma ? "\nCon cariño,\nel estudio de Invitoo" : "",
    "",
    "—",
    textoPie(c.pie),
  ]
    .filter((x, i, arr) => !(x === "" && arr[i - 1] === ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { asunto: c.asunto, preheader: c.preheader, html, texto };
}
