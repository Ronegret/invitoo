import { CanvasTexture, LinearSRGBColorSpace, NoColorSpace, SRGBColorSpace, type Texture } from "three";
import { alturaANormal, azar, leerAltura, lienzo, papelAlgodon } from "./texturas";

/**
 * La cara de una cartulina de invitación, pintada en canvas para usarla
 * como textura: la composición (tipografía y colores de la plantilla), el
 * relieve del letterpress (lo impreso se hunde en el algodón) y la máscara
 * del foil (oro que brilla al inclinar).
 *
 * Devuelve tres texturas:
 *  · `color`  — papel, tinta y oro;
 *  · `normal` — fibra del papel + huella del tipo (letterpress);
 *  · `pbr`    — G = rugosidad, B = metalicidad (el formato de three).
 */

export type Cara = {
  /** Píxeles del lienzo (la proporción es la de la cartulina). */
  ancho: number;
  alto: number;
  papel: string;
  tinta: string;
  acento: string;
  /** Familia CSS ya resuelta (sin `var()`). */
  letra: string;
  /** Familia del texto pequeño. */
  letraTexto?: string;
  a: string;
  b: string;
  fecha: string;
  /** El id de la plantilla, para su adorno. */
  plantilla?: string;
  /** «Nos casamos». */
  antetitulo?: string;
  /** «&», «y», «+». */
  y?: string;
};

export type TexturasCara = { color: Texture; normal: Texture; pbr: Texture; dispose: () => void };

const ORO = "#c6a15a";

/** Ajusta el cuerpo de letra para que `texto` quepa en `max` px. */
function caber(ctx: CanvasRenderingContext2D, texto: string, fuente: (px: number) => string, px: number, max: number) {
  let t = px;
  ctx.font = fuente(t);
  while (ctx.measureText(texto).width > max && t > 8) {
    t -= 2;
    ctx.font = fuente(t);
  }
  return t;
}

/**
 * Pinta la composición tres veces con el mismo dibujo: en color, en altura
 * (negro = hundido) y en máscara de foil (blanco = oro). `modo` decide qué
 * pinta cada trazo.
 */
function componer(ctx: CanvasRenderingContext2D, c: Cara, modo: "color" | "altura" | "foil") {
  const W = c.ancho;
  const H = c.alto;
  const u = Math.min(W, H) / 100; // unidad: 1 % del lado corto
  const vertical = H > W;
  const tinta = modo === "color" ? c.tinta : modo === "altura" ? "#000" : "#000";
  const acento = modo === "color" ? c.acento : modo === "altura" ? "#000" : "#000";
  const oro = modo === "color" ? ORO : modo === "altura" ? "#000" : "#fff";
  const conFoil = (s: string) => (modo === "foil" ? "#fff" : s);

  // ── Adorno de la plantilla
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const id = c.plantilla ?? "carta";

  // Doble filete dorado (foil) en casi todas.
  if (id !== "constelacion" && id !== "registro") {
    ctx.strokeStyle = oro;
    ctx.lineWidth = 0.55 * u;
    const m = 5 * u;
    ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    ctx.lineWidth = 0.22 * u;
    ctx.strokeRect(m + 1.6 * u, m + 1.6 * u, W - 2 * m - 3.2 * u, H - 2 * m - 3.2 * u);
  }

  const cx = W / 2;
  if (id === "carta" || id === "sobre") {
    // El sobre dibujado y el lacre, arriba.
    if (vertical) {
      ctx.strokeStyle = modo === "foil" ? "#000" : tinta;
      ctx.globalAlpha = modo === "color" ? 0.35 : 1;
      ctx.lineWidth = 0.35 * u;
      const y0 = H * 0.14;
      const w = W * 0.62;
      const h = w * 0.62;
      ctx.strokeRect(cx - w / 2, y0, w, h);
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, y0);
      ctx.lineTo(cx, y0 + h * 0.62);
      ctx.lineTo(cx + w / 2, y0);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = modo === "foil" ? "#000" : acento;
      ctx.beginPath();
      ctx.arc(cx, y0 + h * 0.62, 4.6 * u, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Horizontal: un rombo de oro arriba.
      ctx.fillStyle = oro;
      ctx.beginPath();
      const y = H * 0.2;
      ctx.moveTo(cx, y - 2 * u);
      ctx.lineTo(cx + 2 * u, y);
      ctx.lineTo(cx, y + 2 * u);
      ctx.lineTo(cx - 2 * u, y);
      ctx.fill();
      ctx.strokeStyle = oro;
      ctx.lineWidth = 0.3 * u;
      ctx.beginPath();
      ctx.moveTo(cx - 16 * u, y);
      ctx.lineTo(cx - 4 * u, y);
      ctx.moveTo(cx + 4 * u, y);
      ctx.lineTo(cx + 16 * u, y);
      ctx.stroke();
    }
  } else if (id === "floracion" || id === "velo") {
    ctx.strokeStyle = conFoil(modo === "color" ? c.acento : "#000");
    ctx.lineWidth = 0.5 * u;
    const rama = (sx: number) => {
      ctx.beginPath();
      ctx.moveTo(cx + sx * 18 * u, H * 0.86);
      ctx.bezierCurveTo(cx + sx * 34 * u, H * 0.74, cx + sx * 34 * u, H * 0.62, cx + sx * 24 * u, H * 0.5);
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const t = 0.2 + k * 0.2;
        const yy = H * (0.86 - 0.36 * t);
        const xx = cx + sx * (18 + 14 * Math.sin(t * Math.PI)) * u;
        ctx.beginPath();
        ctx.ellipse(xx + sx * 3 * u, yy, 3.2 * u, 1.3 * u, sx * -0.6, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.globalAlpha = modo === "color" ? 0.7 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };
    rama(-1);
    rama(1);
  } else if (id === "mar") {
    ctx.strokeStyle = conFoil(modo === "color" ? c.acento : "#000");
    ctx.lineWidth = 0.4 * u;
    const yMar = vertical ? H * 0.2 : H * 0.8;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      const y = yMar + H * k * 0.025;
      for (let x = W * 0.2; x <= W * 0.8; x += u) {
        const yy = y + Math.sin(x / (3 * u) + k) * 0.6 * u;
        if (x === W * 0.2) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.fillStyle = oro;
    ctx.beginPath();
    ctx.arc(cx, yMar - H * 0.02, 6 * u, Math.PI, 0);
    ctx.fill();
  } else if (id === "constelacion") {
    const r = azar(5);
    ctx.fillStyle = oro;
    for (let k = 0; k < 46; k++) {
      ctx.beginPath();
      ctx.arc(r() * W, r() * H, (0.25 + r() * 0.5) * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = oro;
    ctx.lineWidth = 0.3 * u;
    ctx.beginPath();
    ctx.arc(cx - 5 * u, H * 0.22, 9 * u, 0, Math.PI * 2);
    ctx.arc(cx + 5 * u + 9 * u, H * 0.22, 9 * u, Math.PI, Math.PI * 3);
    ctx.stroke();
  } else if (id === "tinta") {
    ctx.fillStyle = modo === "foil" ? "#000" : acento;
    ctx.globalAlpha = modo === "color" ? 0.85 : 1;
    ctx.beginPath();
    ctx.ellipse(cx, H * 0.22, 8 * u, 9 * u, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (id === "registro") {
    ctx.strokeStyle = modo === "foil" ? "#000" : acento;
    ctx.lineWidth = 0.6 * u;
    ctx.strokeRect(cx - 22 * u, H * 0.16, 44 * u, 10 * u);
    ctx.fillStyle = modo === "foil" ? "#000" : acento;
    ctx.font = `600 ${3.6 * u}px ${c.letraTexto ?? c.letra}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("REGISTRO CIVIL", cx, H * 0.16 + 5 * u);
  } else if (id === "azulejo") {
    ctx.strokeStyle = conFoil(modo === "color" ? c.acento : "#000");
    ctx.lineWidth = 0.5 * u;
    const t = 9 * u;
    for (const [x0, y0] of [[8 * u, 8 * u], [W - 8 * u - t, 8 * u], [8 * u, H - 8 * u - t], [W - 8 * u - t, H - 8 * u - t]]) {
      ctx.strokeRect(x0, y0, t, t);
      ctx.beginPath();
      ctx.arc(x0 + t / 2, y0 + t / 2, t / 3, 0, Math.PI * 2);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + t, y0 + t);
      ctx.moveTo(x0 + t, y0);
      ctx.lineTo(x0, y0 + t);
      ctx.stroke();
    }
  } else {
    tematico(ctx, id, W, H, u, cx, vertical, modo === "foil" ? "#fff" : modo === "color" ? c.acento : "#000", oro);
  }
  ctx.restore();

  // ── El texto
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const centroY = vertical ? H * 0.58 : H * 0.54;
  const texto = c.letraTexto ?? c.letra;
  const pequena = (vertical ? 3.6 : 3.4) * u;

  // «NOS CASAMOS», versalitas espaciadas.
  ctx.fillStyle = tinta;
  ctx.globalAlpha = modo === "color" ? 0.78 : 1;
  ctx.font = `500 ${pequena}px ${texto}`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${pequena * 0.32}px`;
  ctx.fillText((c.antetitulo ?? "Nos casamos").toLocaleUpperCase("es-ES"), cx, centroY - (vertical ? 22 : 19) * u);
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  ctx.globalAlpha = 1;

  // Los nombres, en la letra de la plantilla.
  const max = W * 0.78;
  const fuente = (px: number) => `italic 500 ${px}px ${c.letra}`;
  const grande = vertical ? 13 * u : 15 * u;
  if (vertical) {
    const t1 = caber(ctx, c.a, fuente, grande, max);
    const t2 = caber(ctx, c.b, fuente, grande, max);
    const t = Math.min(t1, t2);
    ctx.fillStyle = tinta;
    ctx.font = fuente(t);
    ctx.fillText(c.a, cx, centroY - 6 * u);
    ctx.fillStyle = id === "constelacion" ? oro : modo === "foil" ? "#fff" : oro;
    ctx.font = fuente(t * 0.7);
    ctx.fillText(c.y ?? "&", cx, centroY + 4 * u);
    ctx.fillStyle = tinta;
    ctx.font = fuente(t);
    ctx.fillText(c.b, cx, centroY + 16 * u);
  } else {
    const linea = `${c.a}  ${c.y ?? "&"}  ${c.b}`;
    const t = caber(ctx, linea, fuente, grande, max);
    ctx.font = fuente(t);
    const wa = ctx.measureText(`${c.a}  `).width;
    const wy = ctx.measureText(c.y ?? "&").width;
    const wb = ctx.measureText(`  ${c.b}`).width;
    let x = cx - (wa + wy + wb) / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = tinta;
    ctx.fillText(`${c.a}  `, x, centroY);
    x += wa;
    ctx.fillStyle = modo === "foil" ? "#fff" : oro;
    ctx.fillText(c.y ?? "&", x, centroY);
    x += wy;
    ctx.fillStyle = tinta;
    ctx.fillText(`  ${c.b}`, x, centroY);
    ctx.textAlign = "center";
  }

  // La fecha.
  ctx.fillStyle = tinta;
  ctx.globalAlpha = modo === "color" ? 0.8 : 1;
  ctx.font = `500 ${pequena * 0.95}px ${texto}`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${pequena * 0.28}px`;
  ctx.fillText(c.fecha.toLocaleUpperCase("es-ES"), cx, centroY + (vertical ? 30 : 17) * u);
  ctx.restore();
}

function tex(c: HTMLCanvasElement, espacio: "color" | "dato") {
  const t = new CanvasTexture(c);
  t.colorSpace = espacio === "color" ? SRGBColorSpace : NoColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Pinta la cara entera y devuelve sus tres texturas. */
export function pintarCara(c: Cara): TexturasCara {
  const W = c.ancho;
  const H = c.alto;
  const fibra = papelAlgodon();
  const fibraImg = fibra.detalle.image as HTMLCanvasElement;

  // 1 · Color: papel, fibra multiplicada, composición.
  const { c: cc, ctx: xc } = lienzo(W, H);
  xc.fillStyle = c.papel;
  xc.fillRect(0, 0, W, H);
  xc.globalCompositeOperation = "multiply";
  const pat = xc.createPattern(fibraImg, "repeat");
  if (pat) {
    xc.fillStyle = pat;
    xc.fillRect(0, 0, W, H);
  }
  xc.globalCompositeOperation = "source-over";
  // Tinta: un pase difuso (lo que chupa el algodón) y uno nítido.
  xc.save();
  xc.filter = `blur(${Math.max(0.6, W / 1400)}px)`;
  xc.globalAlpha = 0.35;
  componer(xc, c, "color");
  xc.restore();
  componer(xc, c, "color");

  // 2 · Altura: papel a medio gris, lo impreso se hunde.
  const { c: ca, ctx: xa } = lienzo(W, H);
  xa.fillStyle = "#fff";
  xa.fillRect(0, 0, W, H);
  // La huella del tipo: hundida y con el borde un poco redondeado.
  xa.filter = `blur(${Math.max(0.8, W / 900)}px)`;
  componer(xa, c, "altura");
  xa.filter = "none";
  const alt = leerAltura(ca);
  // La fibra encima, muy suave.
  const fibraAlt = leerAltura(fibraImg);
  const fw = fibraImg.width;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      alt[i] = alt[i] * 0.7 + fibraAlt[(y % fw) * fw + (x % fw)] * 0.3;
    }
  }
  const normal = tex(alturaANormal(alt, W, H, W / 260, false), "dato");

  // 3 · PBR: G rugosidad, B metal.
  const { c: cf, ctx: xf } = lienzo(W, H);
  xf.fillStyle = "#000";
  xf.fillRect(0, 0, W, H);
  componer(xf, c, "foil");
  const fd = xf.getImageData(0, 0, W, H);
  for (let i = 0; i < fd.data.length; i += 4) {
    const foil = fd.data[i] / 255;
    fd.data[i] = 0;
    fd.data[i + 1] = (0.84 * (1 - foil) + 0.3 * foil) * 255;
    fd.data[i + 2] = foil * 255;
    fd.data[i + 3] = 255;
  }
  xf.putImageData(fd, 0, 0);
  const pbr = tex(cf, "dato");
  pbr.colorSpace = LinearSRGBColorSpace;

  const color = tex(cc, "color");
  return {
    color,
    normal,
    pbr,
    dispose: () => {
      color.dispose();
      normal.dispose();
      pbr.dispose();
    },
  };
}

/**
 * Adorno de las 19 temáticas (I1): un motivo pequeño, arriba, en el acento
 * del tema (y en oro donde es foil). Barato: unas pocas primitivas de canvas.
 */
function tematico(
  ctx: CanvasRenderingContext2D,
  id: string,
  W: number,
  H: number,
  u: number,
  cx: number,
  vertical: boolean,
  acento: string,
  oro: string,
) {
  const y = vertical ? H * 0.24 : H * 0.22;
  ctx.strokeStyle = acento;
  ctx.fillStyle = acento;
  ctx.lineWidth = 0.45 * u;
  const linea = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  const circulo = (x: number, yy: number, r: number, relleno = false) => {
    ctx.beginPath();
    ctx.arc(x, yy, r, 0, Math.PI * 2);
    if (relleno) ctx.fill();
    else ctx.stroke();
  };
  const ondas = (n: number, amp: number) => {
    for (let k = 0; k < n; k++) {
      ctx.beginPath();
      for (let x = cx - 18 * u; x <= cx + 18 * u; x += u / 2) {
        const yy = y + k * 2.4 * u + Math.sin((x - cx) / (2.6 * u) + k) * amp * u;
        if (x === cx - 18 * u) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  };
  switch (id) {
    case "regencia": case "cuento": {
      // Corona de puntas finas y una perla en cada una.
      ctx.strokeStyle = oro;
      ctx.beginPath();
      ctx.moveTo(cx - 9 * u, y + 4 * u);
      ctx.lineTo(cx - 9 * u, y - 2 * u);
      ctx.lineTo(cx - 4.5 * u, y + 1.5 * u);
      ctx.lineTo(cx, y - 4 * u);
      ctx.lineTo(cx + 4.5 * u, y + 1.5 * u);
      ctx.lineTo(cx + 9 * u, y - 2 * u);
      ctx.lineTo(cx + 9 * u, y + 4 * u);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = oro;
      for (const dx of [-9, 0, 9]) circulo(cx + dx * u, y + (dx ? -2.8 : -4.8) * u, 0.9 * u, true);
      break;
    }
    case "blason": {
      ctx.beginPath();
      ctx.moveTo(cx - 7 * u, y - 6 * u);
      ctx.lineTo(cx + 7 * u, y - 6 * u);
      ctx.lineTo(cx + 7 * u, y + 1 * u);
      ctx.quadraticCurveTo(cx + 7 * u, y + 6 * u, cx, y + 8 * u);
      ctx.quadraticCurveTo(cx - 7 * u, y + 6 * u, cx - 7 * u, y + 1 * u);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = oro;
      linea(cx, y - 6 * u, cx, y + 8 * u);
      linea(cx - 7 * u, y - 1 * u, cx + 7 * u, y - 1 * u);
      break;
    }
    case "aire": case "memorias": {
      // Un marco de foto (instantánea) o un velo: rectángulo fino ladeado.
      ctx.save();
      ctx.translate(cx, y);
      ctx.rotate(id === "memorias" ? -0.08 : 0);
      ctx.strokeRect(-8 * u, -7 * u, 16 * u, 15 * u);
      ctx.strokeRect(-6.5 * u, -5.5 * u, 13 * u, 10 * u);
      ctx.restore();
      break;
    }
    case "pasaporte": {
      ctx.setLineDash([1.2 * u, 1 * u]);
      circulo(cx, y, 8 * u);
      ctx.setLineDash([]);
      circulo(cx, y, 5.6 * u);
      ctx.strokeStyle = oro;
      linea(cx - 4 * u, y, cx + 4 * u, y);
      break;
    }
    case "orilla": case "brazada": ondas(3, 0.7); break;
    case "pinar": case "lupulo": {
      // Un cono (piña o lúpulo): escamas superpuestas.
      for (let k = 0; k < 4; k++) {
        const ancho = (4.5 - k * 0.7) * u;
        ctx.beginPath();
        ctx.ellipse(cx, y + (3 - k * 2.4) * u, ancho, 1.6 * u, 0, 0, Math.PI);
        ctx.stroke();
      }
      ctx.strokeStyle = oro;
      linea(cx, y - 7 * u, cx, y - 4.6 * u);
      break;
    }
    case "orbita": {
      ctx.fillStyle = oro;
      circulo(cx, y, 3.4 * u, true);
      ctx.beginPath();
      ctx.ellipse(cx, y, 11 * u, 3.2 * u, -0.25, 0, Math.PI * 2);
      ctx.stroke();
      const r = azar(11);
      for (let k = 0; k < 14; k++) circulo(cx + (r() - 0.5) * 50 * u, y + (r() - 0.5) * 16 * u, 0.35 * u, true);
      break;
    }
    case "vinilo": case "festival": case "neon": case "fuego": case "bachata": {
      if (id === "vinilo") {
        for (const r of [8, 6.2, 4.4]) circulo(cx, y, r * u);
        ctx.fillStyle = oro;
        circulo(cx, y, 1.6 * u, true);
      } else if (id === "bachata") {
        for (let k = 0; k < 4; k++) linea(cx - 16 * u, y + (k - 1.5) * 1.6 * u, cx + 16 * u, y + (k - 1.5) * 1.6 * u);
        ctx.fillStyle = oro;
        circulo(cx + 4 * u, y + 0.8 * u, 1.1 * u, true);
        linea(cx + 5 * u, y + 0.8 * u, cx + 5 * u, y - 5 * u);
      } else if (id === "neon") {
        ondas(1, 1.4);
      } else {
        ctx.setLineDash(id === "festival" ? [0.2 * u, 1.6 * u] : []);
        linea(cx - 16 * u, y, cx + 16 * u, y);
        ctx.setLineDash([]);
        ctx.fillStyle = oro;
        for (const dx of id === "fuego" ? [-12, -5, 5, 12] : [-16, 16]) circulo(cx + dx * u, y, 1.2 * u, true);
      }
      break;
    }
    case "estadio": {
      circulo(cx, y, 7 * u);
      linea(cx - 16 * u, y, cx + 16 * u, y);
      ctx.fillStyle = oro;
      circulo(cx, y, 0.9 * u, true);
      break;
    }
    case "meta": {
      // La cinta de meta: una tira a cuadros.
      const t = 1.6 * u;
      for (let k = -8; k < 8; k++) for (let f = 0; f < 2; f++) if ((k + f) % 2 === 0) ctx.fillRect(cx + k * t, y + (f - 1) * t, t, t);
      break;
    }
    case "riviera": {
      // Una carretera de costa: curva doble con línea discontinua.
      ctx.beginPath();
      ctx.moveTo(cx - 16 * u, y + 4 * u);
      ctx.bezierCurveTo(cx - 6 * u, y - 6 * u, cx + 6 * u, y + 6 * u, cx + 16 * u, y - 4 * u);
      ctx.stroke();
      ctx.strokeStyle = oro;
      ctx.setLineDash([1.4 * u, 1.2 * u]);
      ctx.beginPath();
      ctx.moveTo(cx - 16 * u, y + 6.4 * u);
      ctx.bezierCurveTo(cx - 6 * u, y - 3.6 * u, cx + 6 * u, y + 8.4 * u, cx + 16 * u, y - 1.6 * u);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    default:
      break;
  }
}
