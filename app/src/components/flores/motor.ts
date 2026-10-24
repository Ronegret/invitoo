/**
 * El motor de pétalos: un único <canvas> fijo, sin dependencias.
 *
 *  · `rafaga(x, y)`: 5–8 pétalos que saltan desde el dedo y caen meciéndose.
 *  · `celebrar()`: lluvia suave de pétalos y confeti dorado (el «sí» del RSVP).
 *  · `destello(x, y)`: una chispa dorada mínima (el rastro del cursor).
 *
 * Coste: el bucle de `requestAnimationFrame` solo corre mientras hay algo
 * vivo; sin partículas no hay bucle (y el canvas queda vacío). Como mucho
 * 40 piezas vivas de toque (64 en la celebración). Los pétalos son sprites
 * pintados una vez en canvases pequeños y luego solo se copian con
 * `drawImage` y una transformación. Con la pestaña oculta, se vacía.
 *
 * Con `prefers-reduced-motion` no hace nada: lo comprueba quien lo llama y,
 * por si acaso, también aquí.
 */

type Pieza = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  giro: number;
  vg: number;
  tam: number;
  vida: number;
  max: number;
  sprite: HTMLCanvasElement;
  fase: number;
  tipo: 0 | 1 | 2; // pétalo, confeti, chispa
};

export type Motor = {
  rafaga: (x: number, y: number, n?: number) => void;
  /** El «sí»: un golpe de pétalos y oro desde (x, y) —el sello— y una lluvia suave. */
  celebrar: (x?: number, y?: number) => void;
  /** Los pétalos que salen del sobre al abrirse: un abanico hacia arriba. */
  abanico: (x: number, y: number) => void;
  destello: (x: number, y: number) => void;
  /** Recalcula los colores (si cambia la paleta en vivo). */
  tenir: (acento?: string, papel?: string) => void;
};

const MAX_TOQUE = 40;
const MAX_FIESTA = 64;

function rgb(c: string): [number, number, number] | null {
  const s = c.trim();
  let m = /^#([\da-f]{3})$/i.exec(s);
  if (m) return [0, 1, 2].map((i) => parseInt(m![1][i] + m![1][i], 16)) as [number, number, number];
  m = /^#([\da-f]{6})/i.exec(s);
  if (m) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as [number, number, number];
  m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(s);
  if (m) return [+m[1], +m[2], +m[3]];
  return null;
}
const mezcla = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
const css = (c: number[], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

let unico: Motor | null = null;

export function motor(): Motor {
  if (unico) return unico;
  const quieto = (() => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  })();

  const lienzo = document.createElement("canvas");
  lienzo.setAttribute("aria-hidden", "true");
  lienzo.className = "invitoo-petalos";
  Object.assign(lienzo.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "55",
  } as CSSStyleDeclaration);
  document.body.appendChild(lienzo);

  /**
   * Dónde vive el canvas. Mientras la apertura (z 50) está delante, encima de
   * ella: los pétalos del sobre salen del lacre. En cuanto se va, DETRÁS del
   * texto (z -1 dentro del lienzo, que es `isolate`), igual que las
   * partículas: un pétalo nunca cruza por encima de los nombres ni de una
   * línea de texto.
   */
  function colocar() {
    const delante = document.querySelector('.apertura[data-estado="dentro"], .apertura[data-estado="saliendo"]');
    const raiz = delante ? null : document.querySelector<HTMLElement>(".lienzo");
    const padre = raiz ?? document.body;
    if (lienzo.parentElement !== padre) padre.appendChild(lienzo);
    lienzo.style.zIndex = raiz ? "-1" : "55";
  }
  const ctx = lienzo.getContext("2d")!;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0;
  let H = 0;
  const medir = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    lienzo.width = Math.round(W * dpr);
    lienzo.height = Math.round(H * dpr);
  };
  medir();
  let medirPendiente = false;
  window.addEventListener("resize", () => (medirPendiente = true), { passive: true });

  // ——— sprites ———
  let petalos: HTMLCanvasElement[] = [];
  let oros: HTMLCanvasElement[] = [];
  let chispa: HTMLCanvasElement;

  function spritePetalo(base: number[], luz: number[]) {
    const c = document.createElement("canvas");
    const s = 28 * dpr;
    c.width = s;
    c.height = s;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    g.translate(14, 14);
    const gr = g.createLinearGradient(0, -12, 0, 12);
    gr.addColorStop(0, css(luz, 0.95));
    gr.addColorStop(1, css(base, 0.92));
    g.fillStyle = gr;
    g.beginPath();
    // Pétalo: lágrima ancha con la punta apenas hendida.
    g.moveTo(0, 12);
    g.bezierCurveTo(10, 6, 10, -8, 3, -12);
    g.quadraticCurveTo(0, -9.5, -3, -12);
    g.bezierCurveTo(-10, -8, -10, 6, 0, 12);
    g.fill();
    g.strokeStyle = css(mezcla(base, [255, 255, 255], 0.5), 0.5);
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(0, 10);
    g.quadraticCurveTo(1, 0, 0, -8);
    g.stroke();
    return c;
  }
  function spriteOro(a: string, b: string) {
    const c = document.createElement("canvas");
    c.width = 6 * dpr;
    c.height = 12 * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    const gr = g.createLinearGradient(0, 0, 6, 12);
    gr.addColorStop(0, a);
    gr.addColorStop(0.5, "#fff3c8");
    gr.addColorStop(1, b);
    g.fillStyle = gr;
    g.fillRect(0, 0, 6, 12);
    return c;
  }
  function spriteChispa() {
    const c = document.createElement("canvas");
    const s = 16 * dpr;
    c.width = s;
    c.height = s;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    const gr = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    gr.addColorStop(0, "rgba(255,246,214,1)");
    gr.addColorStop(0.35, "rgba(226,190,110,.85)");
    gr.addColorStop(1, "rgba(201,161,74,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 16, 16);
    return c;
  }

  function tenir(acento?: string, papel?: string) {
    const raiz = document.querySelector<HTMLElement>("[data-plantilla]") ?? document.documentElement;
    const cs = getComputedStyle(raiz);
    const a = rgb(acento ?? cs.getPropertyValue("--acento")) ?? [176, 92, 110];
    const p = rgb(papel ?? cs.getPropertyValue("--papel")) ?? [247, 242, 234];
    const rosa = [233, 178, 168];
    // Tres tonos: el acento empolvado, un rosa de jardín y casi blanco.
    petalos = [
      spritePetalo(mezcla(a, p, 0.35), mezcla(a, p, 0.7)),
      spritePetalo(mezcla(mezcla(a, rosa, 0.55), p, 0.2), mezcla(rosa, p, 0.55)),
      spritePetalo(mezcla(a, p, 0.62), mezcla([255, 255, 255], p, 0.3)),
      spritePetalo(mezcla(rosa, p, 0.15), mezcla(rosa, [255, 255, 255], 0.6)),
    ];
    oros = [spriteOro("#c9a14a", "#9c7a2e"), spriteOro("#e2c370", "#b8923f"), spriteOro("#d8b45c", "#c9a14a")];
    chispa = spriteChispa();
  }
  tenir();

  // ——— física ———
  const vivas: Pieza[] = [];
  let bucle = 0;
  let antes = 0;
  let cuadros = 0;

  function nueva(p: Partial<Pieza> & Pick<Pieza, "x" | "y" | "sprite" | "tipo">): Pieza {
    return {
      vx: 0,
      vy: 0,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 3,
      giro: Math.random() * Math.PI * 2,
      vg: 2 + Math.random() * 3,
      tam: 1,
      vida: 0,
      max: 2.2,
      fase: Math.random() * 10,
      ...p,
    };
  }

  function arrancar() {
    colocar();
    if (bucle || quieto) return;
    if (medirPendiente) {
      medirPendiente = false;
      medir();
    }
    antes = performance.now();
    bucle = requestAnimationFrame(paso);
  }

  function paso(ahora: number) {
    const dt = Math.min(0.05, (ahora - antes) / 1000);
    antes = ahora;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    for (let i = vivas.length - 1; i >= 0; i--) {
      const p = vivas[i];
      p.vida += dt;
      if (p.vida >= p.max || p.y > H + 40) {
        vivas.splice(i, 1);
        continue;
      }
      if (p.tipo === 2) {
        // La chispa: sube un poco y se apaga.
        p.y -= 14 * dt;
      } else {
        const aire = p.tipo === 0 ? 2.2 : 1.6;
        p.vy += (p.tipo === 0 ? 300 : 420) * dt;
        p.vx += Math.sin(p.fase + p.vida * 3.2) * (p.tipo === 0 ? 46 : 30) * dt;
        p.vx -= p.vx * aire * dt;
        p.vy -= p.vy * aire * dt;
        // Velocidad terminal: un pétalo planea, no cae.
        const tope = p.tipo === 0 ? 70 : 110;
        if (p.vy > tope) p.vy = tope;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.giro += p.vg * dt;
      }
      const t = p.vida / p.max;
      const alfa = t < 0.08 ? t / 0.08 : t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1;
      const voltea = p.tipo === 2 ? 1 : Math.cos(p.giro);
      ctx.globalAlpha = alfa * (p.tipo === 2 ? 0.9 : 0.92);
      const c = Math.cos(p.rot) * p.tam * dpr;
      const s = Math.sin(p.rot) * p.tam * dpr;
      ctx.setTransform(c * voltea, s * voltea, -s, c, p.x * dpr, p.y * dpr);
      const w = p.sprite.width / dpr;
      const h = p.sprite.height / dpr;
      ctx.drawImage(p.sprite, -w / 2, -h / 2, w, h);
    }
    ctx.globalAlpha = 1;
    if (vivas.length) {
      if ((cuadros = (cuadros + 1) % 20) === 0) colocar();
      bucle = requestAnimationFrame(paso);
    } else {
      bucle = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    }
  }

  function hueco(max: number, n: number) {
    // Si no caben, se van primero las más viejas.
    const sobran = vivas.length + n - max;
    if (sobran > 0) vivas.splice(0, sobran);
  }

  function rafaga(x: number, y: number, n = 5 + Math.floor(Math.random() * 4)) {
    if (quieto) return;
    hueco(MAX_TOQUE, n);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
      const v = 110 + Math.random() * 170;
      vivas.push(
        nueva({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(ang) * v,
          vy: Math.sin(ang) * v,
          tam: 0.55 + Math.random() * 0.4,
          max: 1.9 + Math.random() * 0.9,
          sprite: petalos[i % petalos.length],
          tipo: 0,
        }),
      );
    }
    arrancar();
  }

  function celebrar(x?: number, y?: number) {
    if (quieto) return;
    if (medirPendiente) {
      medirPendiente = false;
      medir();
    }
    hueco(MAX_FIESTA, 0);
    let soltadas = 0;
    if (x !== undefined && y !== undefined) {
      // El golpe: el sello toca el papel y salta un abanico de oro y pétalos.
      for (let i = 0; i < 20; i++) {
        const oro = i % 2 === 0;
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
        const v = 260 + Math.random() * 260;
        vivas.push(
          nueva({
            x: x + (Math.random() - 0.5) * 20,
            y,
            vx: Math.cos(ang) * v,
            vy: Math.sin(ang) * v,
            tam: oro ? 0.6 + Math.random() * 0.4 : 0.55 + Math.random() * 0.4,
            max: 2.2 + Math.random() * 1,
            vg: oro ? 7 + Math.random() * 6 : 2 + Math.random() * 3,
            sprite: oro ? oros[i % oros.length] : petalos[i % petalos.length],
            tipo: oro ? 1 : 0,
          }),
        );
      }
      soltadas = 20;
      arrancar();
    }
    // Una lluvia que cae a lo largo de 1,6 s, no de golpe.
    const tanda = () => {
      const n = Math.min(8, MAX_FIESTA - vivas.length);
      for (let i = 0; i < n; i++) {
        const oro = (soltadas + i) % 3 === 0;
        vivas.push(
          nueva({
            x: Math.random() * W,
            y: -20 - Math.random() * 60,
            vx: (Math.random() - 0.5) * 40,
            vy: 30 + Math.random() * 50,
            tam: oro ? 0.7 + Math.random() * 0.4 : 0.6 + Math.random() * 0.45,
            max: 3.6 + Math.random() * 1.4,
            vg: oro ? 6 + Math.random() * 6 : 2 + Math.random() * 3,
            sprite: oro ? oros[i % oros.length] : petalos[i % petalos.length],
            tipo: oro ? 1 : 0,
          }),
        );
      }
      soltadas += n;
      arrancar();
      // Sin hueco (n = 0) también se para: nunca un temporizador eterno.
      if (n > 0 && soltadas < 64) window.setTimeout(tanda, 220);
    };
    window.setTimeout(tanda, x !== undefined ? 260 : 0);
  }

  function abanico(x: number, y: number) {
    if (quieto) return;
    if (medirPendiente) {
      medirPendiente = false;
      medir();
    }
    // Dos tandas: una al partirse el lacre y otra cuando sube la cartulina.
    const tanda = (n: number, fuerza: number) => {
      hueco(MAX_TOQUE, n);
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const v = fuerza * (0.55 + Math.random() * 0.6);
        vivas.push(
          nueva({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 12,
            vx: Math.cos(ang) * v,
            vy: Math.sin(ang) * v,
            tam: 0.6 + Math.random() * 0.55,
            max: 2.4 + Math.random() * 1.2,
            sprite: petalos[i % petalos.length],
            tipo: 0,
          }),
        );
      }
      arrancar();
    };
    tanda(16, 420);
    window.setTimeout(() => tanda(12, 520), 820);
  }

  let ultimoDestello = 0;
  function destello(x: number, y: number) {
    if (quieto) return;
    const t = performance.now();
    if (t - ultimoDestello < 70 || vivas.length >= MAX_TOQUE) return;
    ultimoDestello = t;
    vivas.push(
      nueva({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, tam: 0.35 + Math.random() * 0.35, max: 0.55, sprite: chispa, tipo: 2, rot: 0, vr: 0 }),
    );
    arrancar();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      vivas.length = 0;
      if (bucle) cancelAnimationFrame(bucle);
      bucle = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    }
  });

  unico = { rafaga, celebrar, abanico, destello, tenir };
  return unico;
}
