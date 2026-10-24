"use client";
/* eslint-disable react-hooks/immutability -- three.js: la escena, la cámara y
   los materiales son objetos mutables por diseño (R3F los muta en cada
   fotograma, fuera del render de React). */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  VSMShadowMap,
  NeutralToneMapping,
  PerspectiveCamera,
  Quaternion,
  ShapeGeometry,
  SpotLight,
  SRGBColorSpace,
  Vector3,
  type BufferGeometry,
  type Material,
  type Texture,
} from "three";
import { BoxGeometry } from "three";
import { pintarCara, type TexturasCara } from "./cartulina";
import { EntornoEstudio, MesaLino } from "./estudio";
import { Lienzo } from "./Lienzo";
import { cartulina, formaDesbarbada, geometriaLacre, lamina, uvPlanas } from "./geometria";
import {
  alturaANormal,
  cargarFuente,
  escribirTinta,
  familiaCss,
  forro,
  leerAltura,
  lienzo,
  papelAlgodon,
  sombraSuave,
} from "./texturas";

/**
 * El sobre en 3D: papel de algodón con grosor, solapas con pliegue, forro
 * teñible, lacre de cera con las iniciales, nombre escrito a tinta,
 * matasellos y, dentro, la cartulina con canto dorado y letterpress.
 *
 * Unidades: centímetros. La mesa es el plano XY (z hacia la cámara). La
 * cámara es un «100 mm» (fov estrecho) casi cenital, como en un bodegón.
 *
 * Este archivo solo lo carga `Sobre3D.tsx` con `next/dynamic` y
 * `ssr: false`: nada de three.js llega al HTML ni al primer JS.
 */

export type PropsEscenaSobre = {
  a: string;
  b: string;
  /** La fecha tal y como va en la cartulina («30 · MARZO · 2027»). */
  fecha: string;
  iniciales: [string, string];
  /** Lo escrito a mano en el sobre. */
  escrito: string;
  /** Lo que lleva el sello: las iniciales o las alianzas de la marca. */
  sello?: "iniciales" | "alianzas";
  /** El texto del aro del matasellos; `null` sin matasellos. */
  matasellos: { aro: string; centro: string } | null;
  papel: string;
  forroColor: string;
  lacreColor: string;
  tinta: string;
  acento: string;
  /** Familias CSS (pueden ser `var(--x)`). */
  letraMano: string;
  letraCarta: string;
  letraTexto: string;
  abierto: boolean;
  /** Segundos de la apertura (toque → cartulina delante). */
  duracion: number;
  /** Dónde acaba la cartulina: centro (0–1 desde arriba a la izquierda) y ancho (fracción del canvas). */
  destino: { x: number; y: number; w: number };
  /** Fracción del ancho del canvas que ocupa el sobre cerrado. */
  encuadre: number;
  /** Altura (0–1 desde arriba) a la que va el centro del sobre. */
  centroY?: number;
  /** Centímetros que baja el sobre al abrirse (deja sitio a la cartulina). */
  caida: number;
  /** ¿Está a la vista? Fuera de pantalla no se pinta nada. */
  activo: boolean;
  /** Sin la deriva de los dos primeros segundos (para el póster). */
  quieto?: boolean;
  onListo?: () => void;
  onAbierto?: () => void;
  onLento?: (fps: number) => void;
};

const W = 16; // ancho del sobre
const H = 10.7; // alto
const Z_FRENTE = 0.03;
const Z_LATERAL = 0.12;
const Z_BAJA = 0.145;
const Z_SOLAPA = 0.17;
const G_SOLAPA = 0.025;
const PUNTA = -0.85; // y de la punta de la solapa
const CW = 14.4; // la cartulina, 7:5
const CH = 10.28;
const CG = 0.05; // grosor de la cartulina (con el bisel, 0,7 mm: cartulina de 700 g)
const R_LACRE = 1.32;

/* ───────────────────────── Curvas de la casa ───────────────────────── */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const tramo = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** ease-carta ≈ cubic-bezier(0.22, 0.61, 0.36, 1) */
const salir = (x: number) => 1 - Math.pow(1 - x, 3);
/** ease-velo ≈ cubic-bezier(0.65, 0, 0.35, 1) */
const velo = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Con un pelo de rebote al llegar. */
const llegar = (x: number) => {
  const c1 = 1.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/* ───────────────────────── Texturas del sobre ───────────────────────── */

/** Lo escrito: «Para vosotros» con tinta que empapa y el matasellos. */
function pintarEscrito(p: PropsEscenaSobre, mano: string, texto: string) {
  const PX = 128; // píxeles por cm
  const { c, ctx } = lienzo(W * PX, Math.round(H * PX));
  ctx.clearRect(0, 0, c.width, c.height);
  const cm = (v: number) => v * PX;

  // «Para vosotros», un poco torcido, como se escribe en la mesa.
  ctx.save();
  ctx.translate(cm(W * 0.6), cm(H * 0.76));
  ctx.rotate(-0.045);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  let t = cm(1.25);
  ctx.font = `${t}px ${mano}`;
  while (ctx.measureText(p.escrito).width > cm(8.4) && t > 30) {
    t -= 4;
    ctx.font = `${t}px ${mano}`;
  }
  escribirTinta(ctx, p.escrito, 0, 0, `${t}px ${mano}`, "#231c26", 2);
  ctx.restore();

  if (p.matasellos) {
    const tinta = "#3f3a4a";
    const cx = cm(W * 0.21);
    const cy = cm(H * 0.67);
    const r = cm(1.55);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.16);
    ctx.strokeStyle = tinta;
    ctx.fillStyle = tinta;
    ctx.globalAlpha = 0.78;
    ctx.lineWidth = cm(0.035);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = cm(0.022);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    // Texto en el aro.
    const aro = p.matasellos.aro.toLocaleUpperCase("es-ES");
    ctx.font = `600 ${cm(0.27)}px ${texto}`;
    const radio = r * 0.81;
    const total = Array.from(aro).reduce((s, l) => s + ctx.measureText(l).width + cm(0.06), 0);
    let ang = -Math.PI / 2 - total / radio / 2;
    for (const l of Array.from(aro)) {
      const w = ctx.measureText(l).width + cm(0.06);
      ctx.save();
      ctx.rotate(ang + w / radio / 2);
      ctx.translate(0, -radio);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(l, 0, 0);
      ctx.restore();
      ang += w / radio;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 500 ${cm(0.5)}px ${p.letraCarta}`;
    ctx.fillText(p.matasellos.centro, 0, cm(0.02));
    // Las ondas del matasellos.
    ctx.lineWidth = cm(0.03);
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      for (let x = r * 1.12; x < r * 3.2; x += 4) {
        const y = k * cm(0.32) + Math.sin(x / cm(0.28)) * cm(0.07);
        if (x === r * 1.12) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    // La tinta del tampón nunca carga entera: se come a manchas.
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    let s = 99;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 1800; k++) {
      const x = cx - r * 1.2 + rnd() * r * 4.6;
      const y = cy - r * 1.2 + rnd() * r * 2.4;
      ctx.globalAlpha = 0.15 + rnd() * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 1 + rnd() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  const tx = new CanvasTexture(c);
  tx.colorSpace = SRGBColorSpace;
  tx.anisotropy = 8;
  return tx;
}

/**
 * La sombra que cada solapa deja en la de debajo: una banda oscura y
 * difusa justo fuera de su borde libre, hacia donde no viene la luz
 * (abajo a la derecha), y un hilo de luz en el canto opuesto. Es la
 * oclusión que una foto de bodegón siempre tiene en los pliegues.
 */
function pintarPliegues(bordes: [number, number][][]) {
  const PX = 64;
  const { c, ctx } = lienzo(W * PX, Math.round(H * PX));
  const aPx = ([x, y]: [number, number]) => [(x + W / 2) * PX, (H / 2 - y) * PX] as const;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const trazar = (b: [number, number][], dx: number, dy: number) => {
    ctx.beginPath();
    b.forEach((p, i) => {
      const [x, y] = aPx(p);
      if (i === 0) ctx.moveTo(x + dx, y + dy);
      else ctx.lineTo(x + dx, y + dy);
    });
    ctx.stroke();
  };
  for (const b of bordes) {
    ctx.strokeStyle = "rgba(60,40,20,0.30)";
    ctx.lineWidth = PX * 0.16;
    ctx.filter = `blur(${PX * 0.07}px)`;
    trazar(b, PX * 0.06, PX * 0.07);
    ctx.strokeStyle = "rgba(50,32,16,0.35)";
    ctx.lineWidth = PX * 0.035;
    ctx.filter = `blur(${PX * 0.012}px)`;
    trazar(b, PX * 0.02, PX * 0.025);
  }
  ctx.filter = "none";
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** La huella del sello: aro, iniciales y un ramito. Altura 0–1 (blanco = sube). */
function huellaSello(ini: [string, string], letra: string, alianzas: HTMLImageElement | null) {
  const N = 512;
  const { c, ctx } = lienzo(N);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, N, N);
  const R = N * (0.7 / 2.4); // el sello en uv
  ctx.translate(N / 2, N / 2);
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.filter = "blur(1.5px)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  // Puntitos en el aro.
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (alianzas) {
    // El monograma de la marca (M1): las alianzas, en blanco sobre negro.
    const lado = Math.round(R * 1.45);
    const { c: m, ctx: mx } = lienzo(lado);
    mx.drawImage(alianzas, 0, 0, lado, lado);
    mx.globalCompositeOperation = "source-in";
    mx.fillStyle = "#fff";
    mx.fillRect(0, 0, lado, lado);
    ctx.drawImage(m, -lado / 2, -lado / 2);
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 500 ${R * 0.78}px ${letra}`;
    ctx.fillText(ini[0], -R * 0.27, -R * 0.05);
    ctx.fillText(ini[1], R * 0.3, R * 0.08);
    ctx.font = `italic 400 ${R * 0.42}px ${letra}`;
    ctx.fillText("&", 0, R * 0.02);
  }
  ctx.filter = "none";
  return c;
}

function cargarImagen(src: string) {
  return new Promise<HTMLImageElement | null>((ok) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

/* ───────────────────────── El lacre, que se parte ───────────────────────── */

/** Inyecta el corte: cada mitad descarta lo que queda al otro lado de la grieta. */
function materialMitad(base: MeshPhysicalMaterial, lado: 1 | -1) {
  const m = base.clone();
  m.side = DoubleSide;
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLocal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLocal = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLocal;")
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        float grieta = vLocal.x - (0.09 * sin(vLocal.y * 4.7 + 0.6) + 0.05 * sin(vLocal.y * 13.0) + 0.12);
        if (grieta * ${lado.toFixed(1)} < 0.0) discard;`,
      );
  };
  m.customProgramCacheKey = () => `mitad${lado}`;
  return m;
}

type Trozo = { p: Vector3; v: Vector3; r: Vector3; w: Vector3; quieto: boolean };

/**
 * Las dos mitades del lacre: saltan hacia fuera girando, caen sobre el
 * papel, rebotan un poco y se quedan. `seg` = segundos desde la grieta.
 */
function simularTrozos(seg: number, duracion: number): Trozo[] {
  const trozos: Trozo[] = [1, -1].map((lado) => ({
    p: new Vector3(0, 0, 0),
    v: new Vector3(lado * 3.6, lado > 0 ? 1.6 : 1.1, 7.5),
    r: new Vector3(0, 0, 0),
    w: new Vector3(lado * 1.2, lado * 7.5, lado * 1.9),
    quieto: false,
  }));
  const g = (60 / duracion) * 2.2; // la gravedad se acelera si la apertura es corta
  const paso = 1 / 120;
  for (let s = 0; s < seg; s += paso) {
    const dt = Math.min(paso, seg - s);
    for (const f of trozos) {
      if (f.quieto) continue;
      f.v.z -= g * dt;
      f.p.addScaledVector(f.v, dt);
      f.r.addScaledVector(f.w, dt);
      if (f.p.z < 0) {
        f.p.z = 0;
        f.v.z = -f.v.z * 0.22;
        f.v.x *= 0.5;
        f.v.y *= 0.5;
        f.w.multiplyScalar(0.4);
        // Al tocar el papel se asienta: casi plano.
        f.r.x *= 0.3;
        f.r.y *= 0.3;
        if (Math.abs(f.v.z) < 0.5) f.quieto = true;
      }
    }
  }
  return trozos;
}

/* ───────────────────────── La escena ───────────────────────── */

function Sobre({ p, listo }: { p: PropsEscenaSobre; listo: () => void }) {
  const { gl, camera, size, invalidate } = useThree();
  const [tex, setTex] = useState<{
    escrito: Texture;
    cara: TexturasCara;
    huella: Texture;
    forro: Texture;
    alturaHuella: Float32Array;
  } | null>(null);

  /* Fuentes primero (el canvas no espera a nadie más), luego las texturas. */
  useEffect(() => {
    let vivo = true;
    const el = gl.domElement;
    const mano = familiaCss(p.letraMano, el);
    const letra = familiaCss(p.letraCarta, el);
    const texto = familiaCss(p.letraTexto, el);
    Promise.all([
      cargarFuente(`64px ${mano}`),
      cargarFuente(`italic 500 64px ${letra}`),
      cargarFuente(`500 20px ${texto}`),
      p.sello === "alianzas" ? cargarImagen("/marca/alianzas-relieve.svg") : Promise.resolve(null),
    ]).then(([, , , alianzas]) => {
      if (!vivo) return;
      const huellaC = huellaSello(p.iniciales, letra, alianzas);
      const alt = leerAltura(huellaC);
      const huella = new CanvasTexture(alturaANormal(alt, 512, 512, 3.2, false));
      const cara = pintarCara({
        ancho: 1280,
        alto: Math.round((1280 * CH) / CW),
        papel: "#fbf7ef",
        tinta: p.tinta,
        acento: p.acento,
        letra,
        letraTexto: texto,
        a: p.a,
        b: p.b,
        fecha: p.fecha,
        plantilla: "sobre",
      });
      setTex({
        escrito: pintarEscrito(p, mano, texto),
        cara,
        huella,
        forro: forro(p.forroColor),
        alturaHuella: alt,
      });
    });
    return () => {
      vivo = false;
    };
    // Se repinta si cambian los nombres o los colores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.a, p.b, p.fecha, p.escrito, p.forroColor, p.tinta, p.acento, p.letraMano, p.letraCarta, p.letraTexto, p.iniciales[0], p.iniciales[1], p.matasellos?.aro, p.sello, gl]);

  useEffect(
    () => () => {
      if (!tex) return;
      tex.escrito.dispose();
      tex.cara.dispose();
      tex.huella.dispose();
      tex.forro.dispose();
    },
    [tex],
  );

  /* ── Materiales ── */
  const papel = useMemo(() => {
    const f = papelAlgodon();
    const m = new MeshStandardMaterial({
      color: new Color(p.papel),
      map: f.detalle,
      normalMap: f.normal,
      roughnessMap: f.rugosidad,
      roughness: 1,
      metalness: 0,
    });
    m.normalScale.set(0.5, 0.5);
    return m;
  }, [p.papel]);

  const forroMat = useMemo(
    () => new MeshStandardMaterial({ color: "#ffffff", roughness: 0.62, metalness: 0.0 }),
    [],
  );
  const interiorMat = useMemo(
    () => new MeshStandardMaterial({ color: new Color("#d9cfc0"), roughness: 0.75 }),
    [],
  );
  useEffect(() => {
    if (!tex) return;
    forroMat.map = tex.forro;
    forroMat.needsUpdate = true;
    interiorMat.map = tex.forro;
    interiorMat.needsUpdate = true;
    invalidate();
  }, [tex, forroMat, interiorMat, invalidate]);

  const escritoMat = useMemo(
    () =>
      new MeshStandardMaterial({
        transparent: true,
        depthWrite: false,
        roughness: 0.7,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [],
  );
  useEffect(() => {
    if (!tex) return;
    escritoMat.map = tex.escrito;
    escritoMat.needsUpdate = true;
  }, [tex, escritoMat]);

  const cera = useMemo(() => {
    const m = new MeshPhysicalMaterial({
      color: new Color(p.lacreColor),
      roughness: 0.38,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      sheen: 0.3,
      sheenRoughness: 0.5,
      sheenColor: new Color(p.lacreColor).lerp(new Color("#ffffff"), 0.3),
      envMapIntensity: 2.2,
    });
    return m;
  }, [p.lacreColor]);
  const mitades = useMemo(() => {
    if (tex) {
      cera.normalMap = tex.huella;
      cera.normalScale.set(1, 1);
      cera.needsUpdate = true;
    }
    return [materialMitad(cera, 1), materialMitad(cera, -1)] as const;
  }, [cera, tex]);

  const caraMat = useMemo(() => {
    if (!tex) return null;
    const m = new MeshPhysicalMaterial({
      map: tex.cara.color,
      normalMap: tex.cara.normal,
      roughnessMap: tex.cara.pbr,
      metalnessMap: tex.cara.pbr,
      roughness: 1,
      metalness: 1,
      sheen: 0.25,
      sheenRoughness: 0.8,
    });
    m.normalScale.set(0.6, 0.6);
    return m;
  }, [tex]);
  const oro = useMemo(
    () => new MeshStandardMaterial({ color: new Color("#c9a35a"), metalness: 1, roughness: 0.3 }),
    [],
  );

  /* ── Geometrías ── */
  const geo = useMemo(() => {
    const frente = uvPlanas(new BoxGeometry(W, H, Z_FRENTE), 6);
    const lateralI = uvPlanas(
      lamina(formaDesbarbada([[-W / 2, H / 2], [-W / 2, -H / 2], [-0.55, 0.15]], 0, 11), G_SOLAPA),
      6,
    );
    const lateralD = uvPlanas(
      lamina(formaDesbarbada([[W / 2, -H / 2], [W / 2, H / 2], [0.55, 0.15]], 0, 12), G_SOLAPA),
      6,
    );
    const baja = uvPlanas(
      lamina(formaDesbarbada([[-W / 2, -H / 2], [W / 2, -H / 2], [0.35, 0.95], [-0.35, 0.95]], [0, 0.02, 0.01, 0.02], 13), G_SOLAPA),
      6,
    );
    // La solapa, en coordenadas de su bisagra (y = 0 es el pliegue).
    const puntoSolapa: [number, number][] = [[W / 2, 0], [-W / 2, 0], [-0.4, PUNTA - H / 2 + 0.12], [0.4, PUNTA - H / 2 + 0.12]];
    const solapa = uvPlanas(lamina(formaDesbarbada(puntoSolapa, [0, 0.02, 0.01, 0.02], 14), G_SOLAPA), 6);
    const forroSolapa = new ShapeGeometry(
      formaDesbarbada(
        puntoSolapa.map(([x, y]) => [x * 0.93, y * 0.9 - 0.25] as [number, number]),
        0.004,
        15,
      ),
    );
    uvPlanas(forroSolapa, 5);
    const pared = (w: number, h: number) => uvPlanas(new BoxGeometry(w, h, Z_LATERAL - Z_FRENTE - 0.012), 6);
    const paredH = pared(W - 0.1, 0.04);
    const lacre = geometriaLacre(R_LACRE, 0.42, (x, y) => {
      if (!tex) return 0;
      const N = 512;
      const R = N * (0.7 / 2.4);
      const px = Math.round(N / 2 + x * R);
      const py = Math.round(N / 2 - y * R);
      if (px < 0 || py < 0 || px >= N || py >= N) return 0;
      return tex.alturaHuella[py * N + px];
    });
    const carta = cartulina(CW, CH, CG, 0.08);
    return { frente, lateralI, lateralD, baja, solapa, forroSolapa, paredH, lacre, carta };
  }, [tex]);
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => (g as BufferGeometry).dispose?.());
    },
    [geo],
  );

  const pliegues = useMemo(() => {
    const mat = (t: Texture) =>
      new MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false });
    return {
      baja: mat(pintarPliegues([[[-W / 2, -H / 2], [-0.35, 0.95], [0.35, 0.95], [W / 2, -H / 2]]])),
      solapa: mat(
        pintarPliegues([[[-W / 2, H / 2], [-0.4, PUNTA + 0.12], [0.4, PUNTA + 0.12], [W / 2, H / 2]]]),
      ),
    };
  }, []);

  const sombra = useMemo(() => {
    const t = sombraSuave(W + 4, H + 4, 0.2);
    return new MeshBasicMaterial({ map: t, color: "#3b2b1c", transparent: true, opacity: 0.46, depthWrite: false });
  }, []);

  /* ── Referencias para animar ── */
  const sobre = useRef<Group>(null);
  const bisagra = useRef<Group>(null);
  const carta = useRef<Group>(null);
  const cartaMalla = useRef<Mesh>(null);
  const trozos = useRef<(Mesh | null)[]>([null, null]);
  const reloj = useRef({ t0: -1, avisado: false, inicio: -1, frames: 0, medido: false });
  const mira = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  /* La cámara: un 100 mm casi cenital, encuadrada para que el sobre ocupe `encuadre` del ancho. */
  const base = useMemo(() => {
    const cam = camera as PerspectiveCamera;
    const fov = 22;
    const aspecto = size.width / Math.max(1, size.height);
    const tan = Math.tan(((fov / 2) * Math.PI) / 180);
    const d = W / p.encuadre / (2 * tan * aspecto);
    const inclin = (13 * Math.PI) / 180;
    cam.fov = fov;
    cam.near = 1;
    cam.far = 400;
    // El sobre no tiene por qué ir en el centro: se desplaza la ventana.
    const dy = (0.5 - (p.centroY ?? 0.5)) * size.height;
    if (dy) cam.setViewOffset(size.width, size.height, 0, dy, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    return { d, inclin, fov, aspecto, tan, dy };
  }, [camera, size.width, size.height, p.encuadre, p.centroY]);

  const colocarCamara = (yaw: number, pitch: number) => {
    const cam = camera as PerspectiveCamera;
    const inc = base.inclin + pitch;
    const zc = Math.cos(inc) * base.d;
    cam.position.set(zc * Math.sin(yaw), -Math.sin(inc) * base.d, zc * Math.cos(yaw));
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
  };

  /* Pose final de la cartulina: delante de la cámara de reposo, en `destino`. */
  const final = useMemo(() => {
    const cam = new PerspectiveCamera(base.fov, base.aspecto, 1, 400);
    if (base.dy) cam.setViewOffset(size.width, size.height, 0, base.dy, size.width, size.height);
    const inc = base.inclin;
    cam.position.set(0, -Math.sin(inc) * base.d, Math.cos(inc) * base.d);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    const dist = CW / (p.destino.w * 2 * base.tan * base.aspecto);
    const ndc = new Vector3(p.destino.x * 2 - 1, -(p.destino.y * 2 - 1), 0.5).unproject(cam);
    const dir = ndc.sub(cam.position).normalize();
    const adelante = new Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const pos = cam.position.clone().add(dir.multiplyScalar(dist / dir.dot(adelante)));
    return { pos, q: cam.quaternion.clone() };
  }, [base, p.destino.x, p.destino.y, p.destino.w, size.width, size.height]);

  /* Ratón (puntero fino) y giroscopio: unos grados de paralaje real. */
  useEffect(() => {
    const fino = window.matchMedia("(pointer: fine)").matches;
    const mover = (e: PointerEvent) => {
      if (!p.activo) return;
      mira.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mira.current.ty = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    let ref: { b: number; g: number } | null = null;
    const inclinar = (e: DeviceOrientationEvent) => {
      if (!p.activo || e.beta == null || e.gamma == null) return;
      ref ??= { b: e.beta, g: e.gamma };
      mira.current.tx = Math.max(-1, Math.min(1, (e.gamma - ref.g) / 18));
      mira.current.ty = Math.max(-1, Math.min(1, (e.beta - ref.b) / 18));
      invalidate();
    };
    if (fino) window.addEventListener("pointermove", mover, { passive: true });
    else window.addEventListener("deviceorientation", inclinar, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("deviceorientation", inclinar);
    };
  }, [p.activo, invalidate]);

  useEffect(() => {
    if (p.abierto) invalidate();
  }, [p.abierto, invalidate]);
  useEffect(() => {
    if (p.activo) invalidate();
  }, [p.activo, invalidate]);

  // QA: `?t3d=0.5` congela la apertura en ese punto (0–1).
  const tFijo = useMemo(() => {
    const v = new URLSearchParams(window.location.search).get("t3d");
    return v === null ? null : Number(v);
  }, []);
  const tmpQ = useMemo(() => new Quaternion(), []);
  const tmpV = useMemo(() => new Vector3(), []);
  const avisarListo = useRef(false);

  useFrame((estado, dtBruto) => {
    const dt = Math.min(dtBruto, 1 / 30);
    const ahora = estado.clock.elapsedTime;
    const r = reloj.current;
    let seguir = false;

    // Medición de FPS: los dos primeros segundos, con una deriva mínima.
    if (r.inicio < 0) r.inicio = ahora;
    const vida = ahora - r.inicio;
    if (!r.medido && tex) {
      r.frames++;
      if (vida >= 2) {
        r.medido = true;
        const fps = r.frames / vida;
        if (fps < 30) p.onLento?.(fps);
      } else seguir = true;
    }
    const deriva = !p.quieto && !r.medido ? Math.sin(vida * 1.3) * 0.012 * Math.min(1, vida / 0.8) * (1 - clamp01((vida - 1.6) / 0.4)) : 0;

    // Paralaje: hasta ±4° de cámara, suavizado.
    const m = mira.current;
    const k = 1 - Math.pow(0.0015, dt);
    m.x += (m.tx - m.x) * k;
    m.y += (m.ty - m.y) * k;
    if (Math.abs(m.tx - m.x) > 0.001 || Math.abs(m.ty - m.y) > 0.001) seguir = true;
    const grados = Math.PI / 180;
    colocarCamara(m.x * 4 * grados + deriva, m.y * 3 * grados);

    // ── La apertura
    let t = 0;
    if (tFijo !== null) t = tFijo;
    else if (p.abierto) {
      if (r.t0 < 0) r.t0 = ahora;
      t = (ahora - r.t0) / p.duracion;
      if (t < 1.08 && tFijo === null) seguir = true;
      else if (!r.avisado) {
        r.avisado = true;
        p.onAbierto?.();
      }
    }

    // 1 · El lacre cede y se parte. La física es determinista: se integra
    //     desde la grieta hasta ahora en pasos fijos (igual a 120 fps que a
    //     20, y se puede congelar en cualquier instante para el QA).
    const aprieta = tramo(t, 0, 0.05);
    const tras = Math.max(0, (t - 0.05) * p.duracion);
    const trozos3 = simularTrozos(tras, p.duracion);
    trozos.current.forEach((tr, i) => {
      if (!tr) return;
      if (t < 0.05) {
        tr.position.set(0, 0, 0);
        tr.rotation.set(0, 0, 0);
        tr.scale.set(1, 1, 1 - 0.06 * Math.sin(aprieta * Math.PI));
        return;
      }
      const f = trozos3[i];
      tr.position.copy(f.p);
      tr.rotation.set(f.r.x, f.r.y, f.r.z);
      tr.scale.set(1, 1, 1);
    });

    // 2 · La solapa gira sobre el pliegue.
    const giro = velo(tramo(t, 0.1, 0.46));
    if (bisagra.current) {
      // La solapa es la prolongación del frente: al abrirse del todo queda
      // tumbada en la mesa, detrás, con el forro arriba; la bisagra baja del
      // grueso del sobre al pliegue del frente.
      bisagra.current.rotation.x = -giro * Math.PI;
      bisagra.current.position.z = Z_SOLAPA + (Z_FRENTE - 0.004 - Z_SOLAPA) * clamp01((giro - 0.35) / 0.65);
    }
    pliegues.solapa.opacity = 1 - clamp01(giro * 5);

    // 3 · El sobre baja un poco.
    const baja = salir(tramo(t, 0.32, 0.74));
    if (sobre.current) sobre.current.position.y = -p.caida * baja;

    // 4 · La cartulina sale del bolsillo y viene hacia la cámara.
    if (carta.current) {
      const sale = salir(tramo(t, 0.36, 0.7));
      const viene = tramo(t, 0.62, 1);
      const y0 = -p.caida * baja - 0.2 + sale * 11.2;
      // En el bolsillo: plana, dentro del sobre.
      tmpV.set(0, y0, Z_FRENTE + 0.01 + CG / 2 + sale * 0.06);
      if (viene <= 0) {
        if (cartaMalla.current) cartaMalla.current.castShadow = true;
        carta.current.position.copy(tmpV);
        carta.current.quaternion.identity();
      } else {
        const e = llegar(viene);
        const ep = velo(viene);
        // Lejos de la mesa, su sombra sería un borrón: se apaga al subir.
        if (cartaMalla.current) cartaMalla.current.castShadow = viene < 0.25;
        carta.current.position.lerpVectors(tmpV, final.pos, Math.min(1.02, e));
        // Un arco: sube antes de llegar.
        carta.current.position.z += Math.sin(ep * Math.PI) * 2.4;
        tmpQ.identity();
        carta.current.quaternion.slerpQuaternions(tmpQ, final.q, Math.min(1, ep));
      }
    }

    if (tex && !avisarListo.current) {
      avisarListo.current = true;
      // El primer fotograma con texturas ya está en pantalla en el siguiente.
      requestAnimationFrame(() => requestAnimationFrame(listo));
    }
    if (seguir && p.activo) invalidate();
  });

  useEffect(() => {
    if (tex) invalidate();
  }, [tex, invalidate]);

  if (!tex || !caraMat) return null;

  const zLacre = Z_SOLAPA + G_SOLAPA;
  return (
    <>
      <group ref={sobre}>
        {/* Sombra de contacto: pega el sobre a la mesa. */}
        <mesh material={sombra} position={[0.75, -0.65, 0.002]}>
          <planeGeometry args={[W + 4, H + 4]} />
        </mesh>

        {/* Frente (abajo): su cara de dentro lleva el forro. */}
        <mesh
          geometry={geo.frente}
          material={[papel, papel, papel, papel, interiorMat, papel] as Material[]}
          position={[0, 0, Z_FRENTE / 2]}
          castShadow
          receiveShadow
        />
        {/* Los pliegues de los lados y del fondo. */}
        <mesh geometry={geo.paredH} material={papel} position={[0, -H / 2 + 0.025, (Z_FRENTE + Z_LATERAL) / 2]} />

        {/* Solapas laterales y de abajo. */}
        <mesh geometry={geo.lateralI} material={papel} position={[0, 0, Z_LATERAL]} receiveShadow />
        <mesh geometry={geo.lateralD} material={papel} position={[0, 0, Z_LATERAL]} receiveShadow />
        <mesh geometry={geo.baja} material={papel} position={[0, 0, Z_BAJA]} castShadow receiveShadow />

        {/* La oclusión de los pliegues (la de la solapa se va al abrirla). */}
        <mesh material={pliegues.baja} position={[0, 0, Z_BAJA + G_SOLAPA + 0.001]}>
          <planeGeometry args={[W, H]} />
        </mesh>
        <mesh material={pliegues.solapa} position={[0, 0, Z_BAJA + G_SOLAPA + 0.0015]}>
          <planeGeometry args={[W, H]} />
        </mesh>

        {/* Lo escrito y el matasellos. */}
        <mesh material={escritoMat} position={[0, 0, Z_SOLAPA + 0.002]} receiveShadow>
          <planeGeometry args={[W, H]} />
        </mesh>

        {/* La solapa de arriba, con el forro por dentro. */}
        <group ref={bisagra} position={[0, H / 2, Z_SOLAPA]}>
          <mesh geometry={geo.solapa} material={papel} castShadow receiveShadow />
          <mesh geometry={geo.forroSolapa} material={forroMat} rotation={[0, Math.PI, 0]} position={[0, 0, -0.001]} />
        </group>

        {/* El lacre, en dos mitades que hoy coinciden. */}
        <group position={[0, H / 2 + PUNTA - H / 2 + 0.55, zLacre - 0.01]} rotation={[0, 0, 0.12]}>
          {mitades.map((mat, i) => (
            <mesh
              key={i}
              ref={(el) => {
                trozos.current[i] = el;
              }}
              geometry={geo.lacre}
              material={mat}
              castShadow
              receiveShadow
            />
          ))}
        </group>
      </group>

      {/* La cartulina: canto dorado y cara con letterpress. */}
      <group ref={carta}>
        <mesh ref={cartaMalla} geometry={geo.carta} material={[caraMat, oro]} castShadow receiveShadow />
      </group>
    </>
  );
}

function Luces() {
  const luz = useRef<SpotLight>(null);
  useEffect(() => {
    const l = luz.current;
    if (!l) return;
    l.target.position.set(0, 0, 0);
    l.target.updateMatrixWorld();
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.radius = 6;
    l.shadow.intensity = 0.72;
    l.shadow.blurSamples = 12;
    l.shadow.bias = -0.0025;
    l.shadow.normalBias = 0.0;
    l.shadow.camera.near = 20;
    l.shadow.camera.far = 90;
  }, []);
  return (
    <>
      <spotLight
        ref={luz}
        position={[-26, 20, 34]}
        angle={0.5}
        penumbra={1}
        decay={0}
        intensity={2.2}
        color="#fff4e6"
        castShadow
      />
      <ambientLight intensity={0.08} color="#f3e8da" />
    </>
  );
}

export default function EscenaSobre3D(p: PropsEscenaSobre) {
  const foco = useMemo<[number, number, number]>(() => [0, -1, 0], []);
  return (
    <Lienzo
      dpr={typeof window !== "undefined" && window.location.search.includes("poster") ? 2 : [1, 1.75]}
      sombras={VSMShadowMap}
      tonemapping={NeutralToneMapping}
      exposicion={1.12}
      fondo="#e7dece"
    >
      <EntornoEstudio intensidad={0.55} />
      <Luces />
      <MesaLino foco={foco} desenfoque={0.07} repeticion={2.2} tono="#fbf7f1" />
      <Sobre p={p} listo={() => p.onListo?.()} />
    </Lienzo>
  );
}
