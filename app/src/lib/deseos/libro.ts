import "server-only";

import { readFile } from "node:fs/promises";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { obtenerPlantilla } from "@/data/plantillas";
import { formatearFecha } from "@/lib/fecha";
import { archivoLocal, BUCKET, modoAlmacen } from "@/lib/momentos/almacen";
import { servicio } from "@/lib/supabase/clientes";
import type { Invitacion } from "@/lib/tipos";
import { contraste, esOscuro, hexARgb } from "@/plantillas/color";
import { resolverTokens } from "@/plantillas/tokens";
import type { Deseo } from "./datos";

/**
 * «Nuestro libro de buenos deseos»: el PDF, generado en el servidor.
 *
 * pdf-lib + fontkit (≈1 MB en el servidor, nada en el navegador). Las
 * fuentes son las de la plantilla de la boda: se piden a Fontsource en
 * TTF y se guardan en memoria de la
 * instancia; fontkit incrusta solo los glifos usados (TTF estáticas de Fontsource). Si la red falla, se
 * compone con Times/Helvetica antes que dejar a la pareja sin libro.
 *
 * Formato A5 (148 × 210 mm). Páginas:
 *   portada (nombres, fecha, sello) · dedicatoria · los deseos (uno por
 *   página, o en composición editorial) · índice de nombres · contraportada.
 */

const A5: [number, number] = [419.53, 595.28];
const MM = 2.8346;
const MARGEN = 18 * MM;

export type OpcionesLibro = {
  composicion: "uno" | "editorial";
  /** Solo los favoritos, o todos los visibles. */
  soloFavoritos: boolean;
  dedicatoria: string;
};

type Familias = { display: string; texto: string; cursiva: boolean };

// Familias de Google Fonts que tienen cursiva (las demás, la redonda).
const CON_CURSIVA = new Set([
  "Cormorant Garamond",
  "Playfair Display",
  "EB Garamond",
  "Fraunces",
  "Instrument Serif",
  "Inter Tight",
]);

// ─────────────────────────────────────────────────────────────── fuentes

async function ttf(familia: string, cursiva: boolean, peso = 400): Promise<Uint8Array | null> {
  const k = `fontsource|${familia}|${cursiva}|${peso}`;
  const g = globalThis as { __invitooFuentesPdf?: Map<string, Promise<Uint8Array | null>> };
  const cache = (g.__invitooFuentesPdf ??= new Map());
  if (!cache.has(k)) {
    cache.set(
      k,
      (async () => {
        try {
          // Fontsource (jsDelivr): TTF estática por peso y estilo, subconjunto
          // «latin» (cubre el español). La TTF que sirve Google Fonts es una
          // instancia de la variable y fontkit la recorta mal (salían huecos
          // en el texto: comprobado pasándolo a PNG).
          const id = familia.toLowerCase().replace(/ /g, "-");
          const url = `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/latin-${peso}-${cursiva ? "italic" : "normal"}.ttf`;
          const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
          return r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
        } catch {
          return null;
        }
      })().then((x) => {
        if (!x) cache.delete(k); // que el siguiente lo vuelva a intentar
        return x;
      }),
    );
  }
  return cache.get(k)!;
}

type Juego = { display: PDFFont; cursiva: PDFFont; texto: PDFFont; propias: boolean };

async function fuentes(pdf: PDFDocument, f: Familias): Promise<Juego> {
  pdf.registerFontkit(fontkit);
  const [d, c, t] = await Promise.all([
    ttf(f.display, false, f.display === "Cormorant Garamond" ? 500 : 400),
    f.cursiva ? ttf(f.display, true, f.display === "Cormorant Garamond" ? 500 : 400) : Promise.resolve(null),
    ttf(f.texto, false, 400),
  ]);
  if (d && t) {
    const display = await pdf.embedFont(d, { subset: true });
    return {
      display,
      cursiva: c ? await pdf.embedFont(c, { subset: true }) : display,
      texto: await pdf.embedFont(t, { subset: true }),
      propias: true,
    };
  }
  return {
    display: await pdf.embedFont(StandardFonts.TimesRoman),
    cursiva: await pdf.embedFont(StandardFonts.TimesRomanItalic),
    texto: await pdf.embedFont(StandardFonts.Helvetica),
    propias: false,
  };
}

// ────────────────────────────────────────────────────────────── utilidades

const color = (hex: string) => {
  const [r, g, b] = hexARgb(hex);
  return rgb(r / 255, g / 255, b / 255);
};

/** Fuera emojis y caracteres de control: no hay fuente de boda que los tenga. */
function sanear(s: string, propias: boolean) {
  let x = s.replace(/\p{Extended_Pictographic}|️|‍/gu, "").replace(/[\u0000-\u0009\u000B-\u001F]/g, "");
  // Con las estándar (WinAnsi) solo vale latín-1 y poco más.
  if (!propias) x = x.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/[^\n -ÿ€…]/g, "");
  return x.trim();
}

function partir(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
  const lineas: string[] = [];
  for (const parrafo of texto.split(/\n+/)) {
    let linea = "";
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) linea = prueba;
      else {
        if (linea) lineas.push(linea);
        // Una palabra más larga que la línea: se corta a la fuerza.
        let p = palabra;
        while (fuente.widthOfTextAtSize(p, tam) > ancho && p.length > 1) {
          let n = p.length - 1;
          while (n > 1 && fuente.widthOfTextAtSize(p.slice(0, n), tam) > ancho) n--;
          lineas.push(p.slice(0, n));
          p = p.slice(n);
        }
        linea = p;
      }
    }
    if (linea) lineas.push(linea);
    lineas.push("");
  }
  while (lineas.length && lineas[lineas.length - 1] === "") lineas.pop();
  return lineas;
}

/** Texto con tracking (pdf-lib no lo trae): letra a letra si hay espaciado. */
function escribir(p: PDFPage, texto: string, x: number, y: number, fuente: PDFFont, tam: number, c: ReturnType<typeof rgb>, espaciado = 0) {
  if (!espaciado) {
    p.drawText(texto, { x, y, size: tam, font: fuente, color: c });
    return;
  }
  let cx = x;
  for (const letra of texto) {
    p.drawText(letra, { x: cx, y, size: tam, font: fuente, color: c });
    cx += fuente.widthOfTextAtSize(letra, tam) + espaciado;
  }
}

const anchoCon = (texto: string, fuente: PDFFont, tam: number, espaciado = 0) =>
  fuente.widthOfTextAtSize(texto, tam) + espaciado * Math.max(0, [...texto].length - 1);

function centrado(p: PDFPage, texto: string, y: number, fuente: PDFFont, tam: number, c: ReturnType<typeof rgb>, espaciado = 0) {
  escribir(p, texto, (A5[0] - anchoCon(texto, fuente, tam, espaciado)) / 2, y, fuente, tam, c, espaciado);
}

// El monograma de SelloAlianzas.tsx (viewBox 300 × 212).
const ARO_IZQ = "M6 118a65 65 0 1 0 130 0a65 65 0 1 0 -130 0";
const ARO_DER = "M117 110a84 84 0 1 0 168 0a84 84 0 1 0 -168 0";
const BRILLANTE = "M71 46 42 13h58L71 46ZM71 46 56 13M71 46l15-33";

function sello(p: PDFPage, cx: number, cy: number, ancho: number, c: ReturnType<typeof rgb>) {
  const s = ancho / 300;
  const x = cx - 150 * s;
  const y = cy + 106 * s; // drawSvgPath pinta hacia abajo desde (x, y)
  p.drawSvgPath(ARO_IZQ, { x, y, scale: s, borderColor: c, borderWidth: 13 * s });
  p.drawSvgPath(ARO_DER, { x, y, scale: s, borderColor: c, borderWidth: 13 * s });
  p.drawSvgPath(BRILLANTE, { x, y, scale: s, borderColor: c, borderWidth: 9 * s });
}

async function bytesFoto(ruta: string): Promise<Uint8Array | null> {
  try {
    let crudo: Buffer | null = null;
    if (modoAlmacen() === "local") crudo = await readFile(archivoLocal(ruta));
    else {
      const { data } = (await servicio()?.storage.from(BUCKET).download(ruta)) ?? { data: null };
      crudo = data ? Buffer.from(await data.arrayBuffer()) : null;
    }
    if (!crudo) return null;
    // pdf-lib solo incrusta JPG y PNG: las webp pasan por sharp (viene con Next).
    const { default: sharp } = await import("sharp");
    return new Uint8Array(await sharp(crudo).rotate().resize(1400, 1400, { fit: "inside" }).jpeg({ quality: 82 }).toBuffer());
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────── el libro

export async function generarLibro(inv: Invitacion, deseos: Deseo[], o: OpcionesLibro): Promise<Uint8Array> {
  const plantilla = obtenerPlantilla(inv.plantilla);
  const t = resolverTokens(inv.plantilla, inv.tema);
  // Se imprime en papel: una plantilla de noche (Constelación) pasa a papel claro.
  const oscura = esOscuro(t.papel);
  const papelHex = oscura ? "#F7F3EA" : t.papel;
  const tintaHex = oscura ? "#1F1A17" : t.tinta;
  const acentoHex = contraste(t.acento, papelHex) >= 3 ? t.acento : contraste(t.acentoTexto, papelHex) >= 3 ? t.acentoTexto : "#8C1D2C";
  const papel = color(papelHex);
  const tinta = color(tintaHex);
  const acento = color(acentoHex);
  const suave = color(mezcla(tintaHex, papelHex, 0.62));
  const filete = color(mezcla(acentoHex, papelHex, 0.45));

  const pdf = await PDFDocument.create();
  const { a, b } = inv.pareja;
  pdf.setTitle(`Nuestro libro de buenos deseos · ${a} & ${b}`);
  pdf.setAuthor("Vuestros invitados");
  pdf.setCreator("Invitoo");
  pdf.setLanguage("es-ES");
  const f = await fuentes(pdf, {
    display: plantilla.tipografia.display,
    texto: plantilla.tipografia.texto,
    cursiva: CON_CURSIVA.has(plantilla.tipografia.display),
  });
  const S = (s: string) => sanear(s, f.propias);

  const lista = deseos.filter((d) => !d.oculto && (!o.soloFavoritos || d.favorito)).sort((x, y) => x.creado.localeCompare(y.creado));

  const nueva = () => {
    const p = pdf.addPage(A5);
    p.drawRectangle({ x: 0, y: 0, width: A5[0], height: A5[1], color: papel });
    return p;
  };
  const marco = (p: PDFPage) => {
    const m = 9 * MM;
    p.drawRectangle({ x: m, y: m, width: A5[0] - 2 * m, height: A5[1] - 2 * m, borderColor: filete, borderWidth: 0.6 });
    p.drawRectangle({ x: m + 3, y: m + 3, width: A5[0] - 2 * m - 6, height: A5[1] - 2 * m - 6, borderColor: filete, borderWidth: 0.25 });
  };
  const folio = (p: PDFPage, n: number) => centrado(p, String(n), 11 * MM, f.texto, 8, suave);
  const versalitas = (p: PDFPage, s: string, y: number, tam = 7.5, c = acento) => centrado(p, S(s).toUpperCase(), y, f.texto, tam, c, tam * 0.28);

  // ── portada
  {
    const p = nueva();
    marco(p);
    sello(p, A5[0] / 2, A5[1] - 62 * MM, 26 * MM, acento);
    versalitas(p, "Nuestro libro de buenos deseos", A5[1] - 84 * MM, 8);
    const nombres = S(`${a} & ${b}`);
    let tam = 40;
    while (f.cursiva.widthOfTextAtSize(nombres, tam) > A5[0] - 2 * MARGEN && tam > 18) tam -= 1;
    centrado(p, nombres, A5[1] / 2 - 4 * MM, f.cursiva, tam, tinta);
    p.drawLine({ start: { x: A5[0] / 2 - 14 * MM, y: A5[1] / 2 - 16 * MM }, end: { x: A5[0] / 2 + 14 * MM, y: A5[1] / 2 - 16 * MM }, thickness: 0.6, color: acento });
    centrado(p, S(formatearFecha(inv.pareja.fecha, { day: "numeric", month: "long", year: "numeric" })), A5[1] / 2 - 27 * MM, f.display, 13, tinta);
    const lugar = inv.bloques.find((x) => x.t === "itinerario") as { paradas?: { lugar?: string }[] } | undefined;
    const sitio = lugar?.paradas?.find((x) => x.lugar)?.lugar;
    if (sitio) centrado(p, S(sitio), A5[1] / 2 - 35 * MM, f.texto, 9, suave);
    versalitas(p, `${lista.length} ${lista.length === 1 ? "deseo" : "deseos"} de quienes os quieren`, 26 * MM, 6.5, suave);
  }

  // ── dedicatoria
  let pagina = 2;
  {
    const p = nueva();
    const dedicatoria = S(o.dedicatoria) || "Para nosotros, para dentro de muchos años.";
    const lineas = partir(dedicatoria, f.cursiva, 15, A5[0] - 2 * MARGEN - 10 * MM);
    const alto = lineas.length * 22;
    let y = A5[1] / 2 + alto / 2;
    sello(p, A5[0] / 2, y + 22 * MM, 12 * MM, filete);
    for (const l of lineas) {
      centrado(p, l, y, f.cursiva, 15, tinta);
      y -= 22;
    }
    centrado(p, S(`${a} y ${b}`), y - 12, f.texto, 9, suave, 1.2);
    folio(p, pagina);
  }

  const indice: { nombre: string; pagina: number }[] = [];
  const ancho = A5[0] - 2 * MARGEN;

  if (lista.length === 0) {
    pagina++;
    const p = nueva();
    centrado(p, S("Aquí irán vuestros deseos"), A5[1] / 2, f.cursiva, 18, tinta);
    centrado(p, S("En cuanto los invitados escriban, este libro se llena solo."), A5[1] / 2 - 22, f.texto, 9, suave);
    folio(p, pagina);
  } else if (o.composicion === "uno") {
    // ── un deseo por página
    for (const d of lista) {
      pagina++;
      const p = nueva();
      const texto = S(d.texto);
      const largo = texto.length;
      const tam = largo < 90 ? 21 : largo < 200 ? 17 : largo < 420 ? 14 : largo < 700 ? 12 : 10.5;
      const interlinea = tam * 1.42;
      let foto: PDFImage | null = null;
      if (d.fotoRuta) {
        const bytes = await bytesFoto(d.fotoRuta);
        if (bytes) foto = await pdf.embedJpg(bytes).catch(() => null);
      }
      let lineas = partir(texto, f.cursiva, tam, ancho - 8 * MM);
      const maxLineas = Math.floor((foto ? 70 : 120) * MM / interlinea);
      if (lineas.length > maxLineas) lineas = [...lineas.slice(0, maxLineas - 1), `${lineas[maxLineas - 1]}…`];
      const altoTexto = lineas.length * interlinea;
      let y: number;
      if (foto) {
        const maxAlto = 78 * MM;
        const esc = Math.min(ancho / foto.width, maxAlto / foto.height);
        const w = foto.width * esc;
        const h = foto.height * esc;
        const fy = A5[1] - MARGEN - 6 * MM - h;
        p.drawImage(foto, { x: (A5[0] - w) / 2, y: fy, width: w, height: h });
        p.drawRectangle({ x: (A5[0] - w) / 2 - 4, y: fy - 4, width: w + 8, height: h + 8, borderColor: filete, borderWidth: 0.4 });
        // Aire para la comilla grande, que sube por encima de la primera línea.
        y = fy - 10 * MM - tam * 2.4;
      } else {
        y = A5[1] / 2 + altoTexto / 2 + 6 * MM;
      }
      // La comilla de apertura, grande y en el color de la boda.
      centrado(p, "“", y + tam * 0.6, f.display, tam * 3.2, filete);
      y -= tam * 0.9;
      for (const l of lineas) {
        if (l) centrado(p, l, y, f.cursiva, tam, tinta);
        y -= l ? interlinea : interlinea * 0.6;
      }
      p.drawLine({ start: { x: A5[0] / 2 - 6 * MM, y: y - 2 }, end: { x: A5[0] / 2 + 6 * MM, y: y - 2 }, thickness: 0.5, color: acento });
      versalitas(p, d.nombre, y - 16, 8, acento);
      folio(p, pagina);
      indice.push({ nombre: d.nombre, pagina });
    }
  } else {
    // ── composición editorial: varios por página, en una columna con aire
    const tam = 12.5;
    const interlinea = tam * 1.45;
    let p: PDFPage | null = null;
    let y = 0;
    const abrir = () => {
      pagina++;
      p = nueva();
      folio(p, pagina);
      y = A5[1] - MARGEN - 4 * MM;
    };
    abrir();
    for (const d of lista) {
      const lineas = partir(S(d.texto), f.cursiva, tam, ancho);
      const alto = lineas.length * interlinea + 30;
      if (y - alto < MARGEN + 8 * MM) abrir();
      // Un deseo más largo que una página entera: se parte entre páginas.
      let primera = true;
      for (const l of lineas) {
        if (y < MARGEN + 12 * MM) abrir();
        if (primera) {
          p!.drawText("“", { x: MARGEN - 12, y: y - 4, size: tam * 2.2, font: f.display, color: filete });
          primera = false;
        }
        if (l) p!.drawText(l, { x: MARGEN, y, size: tam, font: f.cursiva, color: tinta });
        y -= l ? interlinea : interlinea * 0.6;
      }
      const nombre = S(d.nombre).toUpperCase();
      escribir(p!, nombre, A5[0] - MARGEN - anchoCon(nombre, f.texto, 7.5, 1.6), y - 2, f.texto, 7.5, acento, 1.6);
      indice.push({ nombre: d.nombre, pagina });
      y -= 18;
      // Separador: un rombo pequeño, como el brillante del sello.
      if (y > MARGEN + 20 * MM) {
        const cx = A5[0] / 2;
        p!.drawSvgPath("M0 -3 3 0 0 3 -3 0Z", { x: cx, y: y + 4, color: filete });
        y -= 18;
      }
    }
  }

  // ── índice de nombres
  if (indice.length) {
    const orden = [...indice].sort((x, y) => x.nombre.localeCompare(y.nombre, "es", { sensitivity: "base" }));
    const porPagina = 34 * 2;
    for (let i = 0; i < orden.length; i += porPagina) {
      pagina++;
      const p = nueva();
      if (i === 0) {
        versalitas(p, "Quién os escribe", A5[1] - MARGEN - 4 * MM, 8);
      }
      const trozo = orden.slice(i, i + porPagina);
      // Pocos nombres: una columna centrada con puntos guía. Muchos: dos.
      const columnas = orden.length > 34 ? 2 : 1;
      const tam = columnas === 1 ? 9.5 : 8.5;
      const paso = columnas === 1 ? 15 : 12.6;
      const col = columnas === 1 ? 74 * MM : (A5[0] - 2 * MARGEN - 10 * MM) / 2;
      const x0 = columnas === 1 ? (A5[0] - col) / 2 : MARGEN;
      const punto = f.texto.widthOfTextAtSize(".", tam) + 1.6;
      trozo.forEach((e, j) => {
        const c = Math.floor(j / 34);
        const fila = j % 34;
        const x = x0 + c * (col + 10 * MM);
        const yy = A5[1] - MARGEN - 18 * MM - fila * paso;
        let nombre = S(e.nombre);
        while (f.texto.widthOfTextAtSize(nombre, tam) > col - 26 && nombre.length > 3) nombre = `${nombre.slice(0, -2)}…`;
        p.drawText(nombre, { x, y: yy, size: tam, font: f.texto, color: tinta });
        const num = String(e.pagina);
        const anchoNum = f.texto.widthOfTextAtSize(num, tam);
        p.drawText(num, { x: x + col - anchoNum, y: yy, size: tam, font: f.texto, color: acento });
        // Puntos guía entre el nombre y la página.
        for (let px = x + f.texto.widthOfTextAtSize(nombre, tam) + 6; px < x + col - anchoNum - 6; px += punto) {
          p.drawText(".", { x: px, y: yy, size: tam, font: f.texto, color: filete });
        }
      });
      folio(p, pagina);
    }
  }

  // ── contraportada
  {
    const p = nueva();
    sello(p, A5[0] / 2, A5[1] / 2 + 8 * MM, 16 * MM, acento);
    centrado(p, S(`${a} & ${b}`), A5[1] / 2 - 14 * MM, f.cursiva, 16, tinta);
    centrado(p, S(formatearFecha(inv.pareja.fecha, { day: "numeric", month: "long", year: "numeric" })), A5[1] / 2 - 22 * MM, f.texto, 8.5, suave);
    versalitas(p, "Hecho con Invitoo · invitoo.es", 16 * MM, 6, suave);
  }

  return pdf.save();
}

/** Mezcla `a` hacia `b` (0 = a, 1 = b). */
function mezcla(a: string, b: string, t: number) {
  const x = hexARgb(a);
  const y = hexARgb(b);
  const c = (i: number) => Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, "0");
  return `#${c(0)}${c(1)}${c(2)}`;
}
