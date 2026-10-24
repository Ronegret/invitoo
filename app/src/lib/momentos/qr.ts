import "server-only";

import QRCode from "qrcode";

/**
 * El QR de Invitoo. No es el cuadrado de bloques negros de cualquier
 * aparcamiento: es una pieza más de la papelería de la boda.
 *
 * - Puntos redondos finos en vez de módulos cuadrados.
 * - Los tres ojos dibujados como un aro con esquinas suaves y un punto dentro.
 * - En el centro, el sello de las alianzas de Invitoo sobre una medalla del
 *   color del papel.
 * - El color de la tinta de cada boda.
 *
 * Que siga leyéndose: corrección «H» (recupera un 30 %), y la medalla del
 * centro tapa menos del 6 % del área. Margen de 4 módulos, el que pide la
 * norma, para que lea bien impreso en una tarjeta. Los puntos ocupan el 84 %
 * del módulo: más pequeños y las cámaras viejas empiezan a dudar.
 */

type Opciones = {
  /** Color de los puntos. Oscuro: el contraste es lo que hace que lea. */
  tinta?: string;
  /** Fondo. «transparent» para pintarlo sobre la tarjeta. */
  papel?: string;
  /** Color del sello del centro y del punto de los ojos. */
  acento?: string;
  /** Sin sello en el centro (por si se imprime muy pequeño). */
  sinSello?: boolean;
};

const MARGEN = 4;

export function qrSvg(texto: string, tinta = "#1d1712", papel = "#ffffff", opciones: Opciones = {}) {
  return qrElegante(texto, { tinta, papel, ...opciones });
}

export function qrElegante(texto: string, o: Opciones = {}) {
  const tinta = o.tinta ?? "#1d1712";
  const papel = o.papel ?? "#ffffff";
  const acento = o.acento ?? "#8c1d2c";
  const qr = QRCode.create(texto, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const datos = qr.modules.data;
  const total = n + MARGEN * 2;

  const esOjo = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

  // Hueco del centro para el sello: un cuadrado de ~22 % del lado, impar.
  let hueco = Math.round(n * 0.22);
  if (hueco % 2 === 0) hueco += 1;
  const h0 = Math.floor((n - hueco) / 2);
  const h1 = h0 + hueco;
  const enHueco = (x: number, y: number) =>
    !o.sinSello && x >= h0 && x < h1 && y >= h0 && y < h1;

  // Patrones de alineación (versión ≥ 2): se pintan sólidos, como mini-ojos.
  // Con puntos sueltos las cámaras los pierden en tamaños grandes.
  const alineacion: [number, number][] = [];
  if (qr.version > 1) {
    const cuantos = Math.floor(qr.version / 7) + 2;
    const paso = n === 145 ? 26 : Math.ceil((n - 13) / (2 * cuantos - 2)) * 2;
    const pos = [n - 7];
    for (let i = 1; i < cuantos - 1; i++) pos[i] = pos[i - 1] - paso;
    pos.push(6);
    pos.reverse();
    for (let i = 0; i < pos.length; i++)
      for (let j = 0; j < pos.length; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) continue;
        alineacion.push([pos[j], pos[i]]);
      }
  }
  const enAlineacion = (x: number, y: number) =>
    alineacion.some(([ax, ay]) => Math.abs(x - ax) <= 2 && Math.abs(y - ay) <= 2);

  const r = 0.46;
  let puntos = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!datos[y * n + x] || esOjo(x, y) || enHueco(x, y) || enAlineacion(x, y)) continue;
      const cx = x + MARGEN + 0.5;
      const cy = y + MARGEN + 0.5;
      // Un círculo como dos arcos: más corto que <circle> repetido mil veces.
      puntos += `M${(cx - r).toFixed(2)} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
    }
  }

  const ojo = (x: number, y: number) => {
    const X = x + MARGEN;
    const Y = y + MARGEN;
    return (
      `<rect x="${X + 0.5}" y="${Y + 0.5}" width="6" height="6" rx="1.9" fill="none" stroke="${tinta}" stroke-width="1"/>` +
      `<rect x="${X + 2}" y="${Y + 2}" width="3" height="3" rx="1" fill="${acento}"/>`
    );
  };

  let sello = "";
  if (!o.sinSello) {
    const c = MARGEN + n / 2;
    const radio = hueco / 2 - 0.35;
    // El monograma de SelloAlianzas.tsx (viewBox 300×212), escalado al hueco.
    const escala = (radio * 1.32) / 300;
    const tx = c - 150 * escala;
    const ty = c - 112 * escala;
    sello =
      `<circle cx="${c}" cy="${c}" r="${radio}" fill="${papel === "transparent" ? "#ffffff" : papel}"/>` +
      `<circle cx="${c}" cy="${c}" r="${radio - 0.45}" fill="none" stroke="${acento}" stroke-width="0.16"/>` +
      `<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${escala.toFixed(5)})" fill="none" stroke="${acento}" stroke-linejoin="round">` +
      `<circle cx="71" cy="118" r="65" stroke-width="13"/>` +
      `<circle cx="201" cy="110" r="84" stroke-width="13"/>` +
      `<path d="M71 46 42 13h58L71 46ZM71 46 56 13M71 46l15-33" stroke-width="9"/>` +
      `</g>`;
  }

  const fondo = papel === "transparent" ? "" : `<rect width="${total}" height="${total}" fill="${papel}"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="geometricPrecision" role="img" aria-label="Código QR">` +
    fondo +
    `<path d="${puntos}" fill="${tinta}"/>` +
    ojo(0, 0) +
    ojo(n - 7, 0) +
    ojo(0, n - 7) +
    alineacion
      .filter(([ax, ay]) => !enHueco(ax, ay))
      .map(([ax, ay]) => {
        const X = ax - 2 + MARGEN;
        const Y = ay - 2 + MARGEN;
        return (
          `<rect x="${X + 0.5}" y="${Y + 0.5}" width="4" height="4" rx="1.2" fill="none" stroke="${tinta}" stroke-width="1"/>` +
          `<rect x="${X + 2}" y="${Y + 2}" width="1" height="1" rx="0.5" fill="${tinta}"/>`
        );
      })
      .join("") +
    sello +
    `</svg>`
  );
}

/**
 * PNG para quien lo quiera meter en Canva o en Word: el mismo diseño,
 * rasterizado con sharp (va con Next). Si sharp no está, el QR clásico.
 */
export async function qrPng(texto: string, ancho = 1600, opciones: Opciones = {}) {
  const svg = qrElegante(texto, { papel: "#ffffff", ...opciones });
  try {
    const { default: sharp } = await import("sharp");
    return await sharp(Buffer.from(svg), { density: 600 }).resize(ancho, ancho).png().toBuffer();
  } catch {
    return QRCode.toBuffer(texto, {
      type: "png",
      errorCorrectionLevel: "H",
      margin: MARGEN,
      width: ancho,
      color: { dark: opciones.tinta ?? "#1d1712", light: "#ffffff" },
    });
  }
}
