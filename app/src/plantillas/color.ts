/**
 * Contraste, calculado y no a ojo.
 *
 * Una pareja elige «naranja» o «lima» y espera verlo. Pero un lima #C6F432
 * sobre blanco tiene un contraste de 1,3: como texto no se lee. La solución
 * no es prohibir el color, es separar dos usos:
 *
 *  · `acento`       el color tal cual, para superficies (botones, bandas).
 *  · `acentoTexto`  el mismo tono, oscurecido (o aclarado sobre fondo
 *                   oscuro) lo justo para pasar AA (4,5:1) como texto.
 *  · `sobreAcento`  el texto que va ENCIMA de una superficie de acento:
 *                   negro o blanco, el que más contraste dé.
 *
 * Fórmulas de WCAG 2.x (luminancia relativa sRGB). Sin dependencias: lo usa
 * el servidor, el cliente y `herramientas/revisar.mjs` lo replica.
 */

export type Rgb = [number, number, number];

export function hexARgb(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = Number.parseInt(h.slice(0, 6), 16);
  if (!Number.isFinite(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbAHex([r, g, b]: Rgb): string {
  const c = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Luminancia relativa WCAG, 0 (negro) – 1 (blanco). */
export function luminancia(hex: string): number {
  const [r, g, b] = hexARgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG entre dos colores (1–21). */
export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [claro, oscuro] = la > lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (oscuro + 0.05);
}

export const AA = 4.5;

/** ¿El papel es oscuro? Decide hacia dónde se corrige el acento. */
export function esOscuro(hex: string): boolean {
  return luminancia(hex) < 0.18;
}

function mezclar(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * El acento, legible como texto sobre `papel`.
 *
 * Si ya pasa AA se devuelve tal cual. Si no, se mezcla con la tinta (que por
 * definición contrasta con el papel) en pasos del 4 % hasta que pase. Así
 * el tono se conserva —el naranja sigue siendo naranja, solo más tostado—
 * en vez de saltar a negro.
 */
export function acentoLegible(acento: string, papel: string, tinta: string, minimo = AA): string {
  if (contraste(acento, papel) >= minimo) return acento.toLowerCase();
  const destino: Rgb = contraste(tinta, papel) >= minimo
    ? hexARgb(tinta)
    : esOscuro(papel)
      ? [255, 255, 255]
      : [0, 0, 0];
  const origen = hexARgb(acento);
  for (let t = 0.04; t <= 1.0001; t += 0.04) {
    const candidato = rgbAHex(mezclar(origen, destino, t));
    if (contraste(candidato, papel) >= minimo) return candidato;
  }
  return rgbAHex(destino);
}

/** Negro o blanco encima del acento: el que más contraste dé. */
export function sobreAcento(acento: string, oscuro = "#111111", claro = "#ffffff"): string {
  return contraste(acento, oscuro) >= contraste(acento, claro) ? oscuro : claro;
}
