import { BufferAttribute, BufferGeometry, ExtrudeGeometry, Shape, Vector2 } from "three";
import { azar, ruido } from "./texturas";

/**
 * Las piezas de papel: formas planas con grosor de verdad (ExtrudeGeometry
 * con un bisel mínimo, que es lo que hace brillar el canto) y UV planas en
 * centímetros, para que la fibra tenga la misma escala en todas.
 */

/** UV planas: u = x / escala, v = y / escala (centímetros de papel). */
export function uvPlanas(g: BufferGeometry, escala: number, ox = 0, oy = 0) {
  const p = g.getAttribute("position");
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) - ox) / escala;
    uv[i * 2 + 1] = (p.getY(i) - oy) / escala;
  }
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  return g;
}

/** UV 0–1 sobre un rectángulo w×h centrado (la cara de una cartulina). */
export function uvRect(g: BufferGeometry, w: number, h: number) {
  const p = g.getAttribute("position");
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / w + 0.5;
    uv[i * 2 + 1] = p.getY(i) / h + 0.5;
  }
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  return g;
}

/**
 * Un polígono con los bordes «desbarbados»: cada lado se subdivide y se
 * le da un temblor de `barba` cm, como el canto de un papel hecho a mano.
 */
export function formaDesbarbada(puntos: [number, number][], barba: number | number[], semilla = 1, paso = 0.3) {
  const r = azar(semilla);
  const s = new Shape();
  const n = puntos.length;
  let primero = true;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = puntos[i];
    const [x1, y1] = puntos[(i + 1) % n];
    const largo = Math.hypot(x1 - x0, y1 - y0);
    const bLado = Array.isArray(barba) ? barba[i] ?? 0 : barba;
    // Un lado recto (un pliegue) no se subdivide: los puntos alineados dan
    // triángulos astilla con normales rotas (rayitas oscuras en el canto).
    const k = bLado > 0 ? Math.max(1, Math.round(largo / paso)) : 1;
    const nx = -(y1 - y0) / largo;
    const ny = (x1 - x0) / largo;
    const fase = r() * 100;
    for (let j = 0; j < k; j++) {
      const t = j / k;
      // Sin temblor en las esquinas, para que cierren.
      const peso = Math.sin(Math.PI * t);
      const b = Array.isArray(barba) ? barba[i] ?? 0 : barba;
      const d = (ruido(fase + t * largo * 4, 0, 1e6) - 0.5) * 2 * b * peso;
      const x = x0 + (x1 - x0) * t + nx * d;
      const y = y0 + (y1 - y0) * t + ny * d;
      if (primero) {
        s.moveTo(x, y);
        primero = false;
      } else s.lineTo(x, y);
    }
  }
  s.closePath();
  return s;
}

/** Rectángulo de esquinas redondeadas (la cartulina). */
export function rectRedondo(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Papel con grosor: la forma extruida `grosor` cm con un bisel finísimo. */
export function lamina(forma: Shape, grosor: number, bisel = Math.min(0.008, grosor / 3), curvas = 6) {
  const g = new ExtrudeGeometry(forma, {
    depth: Math.max(0.0005, grosor - bisel * 2),
    bevelEnabled: true,
    bevelThickness: bisel,
    bevelSize: bisel,
    bevelSegments: 1,
    curveSegments: curvas,
  });
  g.translate(0, 0, bisel);
  // Sin computeVertexNormals: ExtrudeGeometry ya trae las suyas, y
  // recalcularlas en los triángulos astilla de la tapa da rayas oscuras.
  return g;
}

/**
 * La cartulina: rectángulo redondeado con grosor y una curvatura leve (el
 * papel grueso nunca está plano del todo). La cara de delante es el grupo
 * 0 y lleva UV 0–1; el canto es el grupo 1.
 */
export function cartulina(w: number, h: number, grosor: number, radio: number, curva = 0) {
  const forma = rectRedondo(w, h, radio);
  const g = new ExtrudeGeometry(forma, {
    depth: grosor,
    bevelEnabled: true,
    bevelThickness: grosor * 0.18,
    bevelSize: grosor * 0.18,
    bevelSegments: 2,
    curveSegments: 5,
  });
  g.translate(0, 0, -grosor / 2);
  uvRect(g, w, h);
  if (curva) {
    // Las caras tapa se triangulan con pocos vértices: para que la curva se
    // vea, se subdividen antes. La curva va en x (la fibra «tira» así).
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (w / 2);
      p.setZ(i, p.getZ(i) - curva * x * x);
    }
  }
  g.computeVertexNormals();
  return g;
}

/** Subdivide un plano para curvarlo (la cartulina de la galería). */
export function planoCurvo(w: number, h: number, segX: number, segY: number, curva: number) {
  const g = new BufferGeometry();
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= segY; j++) {
    for (let i = 0; i <= segX; i++) {
      const u = i / segX;
      const v = j / segY;
      const x = (u - 0.5) * w;
      const y = (v - 0.5) * h;
      const nx = x / (w / 2);
      pos.push(x, y, -curva * nx * nx);
      uv.push(u, v);
    }
  }
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = a + 1;
      const c = a + segX + 1;
      const d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * El canto de una cartulina curva: una tira cerrada alrededor del borde,
 * de `grosor` de alto, que sigue la misma curva que la cara.
 */
export function cantoCurvo(w: number, h: number, grosor: number, curva: number, seg = 24) {
  const borde: Vector2[] = [];
  for (let i = 0; i <= seg; i++) borde.push(new Vector2(-w / 2 + (w * i) / seg, -h / 2));
  for (let i = 1; i <= seg; i++) borde.push(new Vector2(w / 2, -h / 2 + (h * i) / seg));
  for (let i = 1; i <= seg; i++) borde.push(new Vector2(w / 2 - (w * i) / seg, h / 2));
  for (let i = 1; i < seg; i++) borde.push(new Vector2(-w / 2, h / 2 - (h * i) / seg));
  const pos: number[] = [];
  const idx: number[] = [];
  const n = borde.length;
  borde.forEach((p) => {
    const nx = p.x / (w / 2);
    const z = -curva * nx * nx;
    pos.push(p.x, p.y, z, p.x, p.y, z - grosor);
  });
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    const b = ((i + 1) % n) * 2;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * El lacre: un disco de cera de borde irregular, con el labio que se
 * desborda al apretar el sello, el centro plano y las iniciales en relieve
 * (`relieve(x, y)` en −1…1 devuelve 0–1). Malla polar, normales suaves.
 */
export function geometriaLacre(radio: number, alto: number, relieve: (x: number, y: number) => number, semilla = 3) {
  const A = 160; // segmentos angulares
  const R = 70; // anillos
  const r = azar(semilla);
  const fases = [r() * 10, r() * 10, r() * 10];
  const borde = (t: number) =>
    radio *
    (1 +
      0.07 * (ruido(Math.cos(t) * 2 + fases[0], Math.sin(t) * 2 + fases[1], 1e6) - 0.5) * 2 +
      0.035 * Math.sin(t * 7 + fases[2]) +
      0.02 * Math.sin(t * 13 + fases[0]));
  const sello = radio * 0.7;
  const pos: number[] = [0, 0, alto * 0.74];
  const uv: number[] = [0.5, 0.5];
  for (let j = 1; j <= R; j++) {
    const f = j / R;
    for (let i = 0; i < A; i++) {
      const t = (i / A) * Math.PI * 2;
      const re = borde(t);
      // Más anillos cerca del borde del sello (el escalón) y del canto.
      const rr = f * re;
      const x = Math.cos(t) * rr;
      const y = Math.sin(t) * rr;
      let z: number;
      if (rr < sello * 0.94) {
        // El sello: plano, con la huella.
        z = alto * (0.74 + 0.06 * relieve(x / sello, y / sello));
      } else {
        const u = Math.min(1, (rr - sello * 0.94) / (re - sello * 0.94));
        // El labio de cera que se sube al apretar y cae hasta el papel.
        const labio = 0.74 + 0.42 * Math.sin(Math.PI * Math.min(1, u * 1.15) * 0.85);
        z = alto * labio * Math.sqrt(Math.max(0, 1 - Math.pow(u, 5)));
      }
      z += alto * 0.03 * (ruido(x * 6 + fases[1], y * 6, 1e6) - 0.5);
      pos.push(x, y, Math.max(0, z));
      uv.push(x / (radio * 2.4) + 0.5, y / (radio * 2.4) + 0.5);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < A; i++) idx.push(0, 1 + i, 1 + ((i + 1) % A));
  for (let j = 0; j < R - 1; j++) {
    for (let i = 0; i < A; i++) {
      const a = 1 + j * A + i;
      const b = 1 + j * A + ((i + 1) % A);
      const c = a + A;
      const d = b + A;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
