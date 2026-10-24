/**
 * OKLCH, sin dependencias.
 *
 * Por qué OKLCH y no HSL: en HSL un amarillo y un azul con la misma «L»
 * no se parecen en nada a la vista. En OKLCH la L es luminosidad percibida
 * y la H es el tono de verdad: si para que un acento se lea bajamos su L,
 * el terracota sigue siendo terracota, solo más tostado.
 *
 * Fórmulas de Björn Ottosson (https://bottosson.github.io/posts/oklab/).
 * Lo usan el servidor, el cliente y las pruebas de node.
 */

import { hexARgb, rgbAHex } from "../../plantillas/color";

export type Oklch = { l: number; c: number; h: number };

const aLineal = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const aGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255;

export function hexAOklch(hex: string): Oklch {
  const [r, g, b] = hexARgb(hex).map(aLineal);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.hypot(A, B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h: c < 1e-4 ? 0 : h };
}

/** OKLCH → sRGB lineal sin recortar (puede salirse de 0–1). */
function aLinealRgb({ l, c, h }: Oklch): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const dentro = (rgb: number[]) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/**
 * OKLCH → hex. Si el color no cabe en sRGB se le baja el croma (nunca el
 * tono ni la luminosidad) hasta que quepa: así un «azul eléctrico» muy
 * claro se queda azul, solo menos saturado.
 */
export function oklchAHex(o: Oklch): string {
  const l = Math.min(1, Math.max(0, o.l));
  let c = Math.max(0, o.c);
  if (!dentro(aLinealRgb({ l, c, h: o.h }))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (dentro(aLinealRgb({ l, c: mid, h: o.h }))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  const rgb = aLinealRgb({ l, c, h: o.h }).map((v) => aGamma(Math.min(1, Math.max(0, v))));
  return rgbAHex(rgb as [number, number, number]);
}

/** Distancia angular entre dos tonos, 0–180. */
export function distanciaTono(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

export const girar = (h: number, grados: number) => ((h + grados) % 360 + 360) % 360;
