"use client";
/* eslint-disable react-hooks/immutability -- three.js: la escena, la cámara y
   los materiales son objetos mutables por diseño (R3F los muta en cada
   fotograma, fuera del render de React). */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  Group,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
} from "three";
import { pintarCara, type TexturasCara } from "./cartulina";
import { EntornoEstudio } from "./estudio";
import { Lienzo } from "./Lienzo";
import { cantoCurvo, planoCurvo } from "./geometria";
import { cargarFuente, familiaCss, papelAlgodon, sombraSuave } from "./texturas";

/**
 * La galería de plantillas como un abanico de cartulinas de verdad: UNA
 * sola escena (un solo contexto WebGL) detrás del carril HTML, con cada
 * tarjeta colocada donde está su `<li>`. El carril sigue siendo HTML con
 * scroll nativo (nada de secuestrar el dedo); el canvas solo lee
 * `scrollLeft` y pinta.
 *
 * Unidades: píxeles CSS. La cámara está a 1200 px del plano (la misma
 * `perspective(1200px)` del abanico CSS), así que lo 3D cae encima de lo
 * HTML: el nombre, la etiqueta y los colores de cada tarjeta, que siguen
 * siendo HTML, giran con su cartulina.
 */

export type CartaGaleria = {
  id: string;
  a: string;
  b: string;
  fecha: string;
  papel: string;
  tinta: string;
  acento: string;
  /** Familia CSS de la plantilla (puede ser `var(--fp-…)`). */
  letra: string;
};

export type PropsEscenaTarjetas = {
  cartas: CartaGaleria[];
  /** El `<ul>` del carril: de él salen las posiciones. */
  carril: HTMLUListElement;
  activo: boolean;
  onListo?: () => void;
  onLento?: (fps: number) => void;
};

const PERSPECTIVA = 1200;
const GROSOR = 3.2; // px: cartulina de 600 g a esta escala, un pelo exagerada
const CURVA = 6; // px de flecha en el centro (la cartulina gruesa nunca está plana)

/** Plantillas con el canto teñido del acento en vez de dorado. */
const CANTO_COLOR = new Set(["mar", "registro", "azulejo", "tinta"]);

type Geo = { left: number; top: number; w: number; h: number; liW: number; liH: number; liLeft: number; liTop: number };

/** Lee del DOM dónde está cada marco, sin transformaciones (offset*). */
function medir(ul: HTMLUListElement): Geo[] {
  return Array.from(ul.children).map((li) => {
    const el = li as HTMLElement;
    const marco = el.querySelector<HTMLElement>("[data-portada]");
    let top = 0;
    let left = 0;
    let n: HTMLElement | null = marco;
    while (n && n !== el) {
      top += n.offsetTop;
      left += n.offsetLeft;
      n = n.offsetParent as HTMLElement | null;
      if (n && !el.contains(n)) break;
    }
    return {
      left,
      top,
      w: marco?.offsetWidth ?? 0,
      h: marco?.offsetHeight ?? 0,
      liW: el.offsetWidth,
      liH: el.offsetHeight,
      liLeft: el.offsetLeft,
      liTop: el.offsetTop,
    };
  });
}

function Carta({
  carta,
  geo,
  indice,
  estado,
}: {
  carta: CartaGaleria;
  geo: Geo;
  indice: number;
  estado: React.MutableRefObject<{ tilt: { x: number; y: number }[]; listo: Set<string> }>;
}) {
  const { gl, invalidate } = useThree();
  const [cara, setCara] = useState<TexturasCara | null>(null);

  // La cara: se pinta cuando la fuente de la plantilla ha llegado.
  useEffect(() => {
    let vivo = true;
    const el = gl.domElement;
    const letra = familiaCss(carta.letra, el);
    const texto = familiaCss("inherit", el);
    const t = window.setTimeout(() => {
      Promise.all([cargarFuente(`italic 500 40px ${letra}`), cargarFuente(`500 16px ${texto}`)]).then(() => {
        if (!vivo) return;
        const ancho = 512;
        const nueva = pintarCara({
          ancho,
          alto: Math.round((ancho * geo.h) / Math.max(1, geo.w)),
          papel: carta.papel,
          tinta: carta.tinta,
          acento: carta.acento,
          letra,
          letraTexto: texto,
          a: carta.a,
          b: carta.b,
          fecha: carta.fecha,
          plantilla: carta.id,
          antetitulo: carta.id === "registro" ? "Nos casamos." : "Nos casamos",
          y: carta.id === "registro" ? "+" : carta.id === "velo" ? "y" : "&",
        });
        setCara((vieja) => {
          vieja?.dispose();
          return nueva;
        });
        estado.current.listo.add(carta.id);
        invalidate();
      });
      // Escalonado: una cara por tarea, para no bloquear el hilo.
    }, 40 + (indice % 6) * 60);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carta.a, carta.b, carta.fecha, carta.papel, carta.tinta, carta.acento, carta.letra, carta.id, geo.w, geo.h]);
  useEffect(() => () => cara?.dispose(), [cara]);

  const mat = useMemo(() => {
    if (!cara) return null;
    const m = new MeshPhysicalMaterial({
      map: cara.color,
      normalMap: cara.normal,
      roughnessMap: cara.pbr,
      metalnessMap: cara.pbr,
      roughness: 1,
      metalness: 1,
      sheen: 0.3,
      sheenRoughness: 0.8,
      clearcoat: 0.08,
      clearcoatRoughness: 0.6,
      transparent: true,
    });
    m.normalScale.set(0.7, 0.7);
    return m;
  }, [cara]);

  const canto = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(CANTO_COLOR.has(carta.id) ? carta.acento : "#c9a35a"),
        metalness: CANTO_COLOR.has(carta.id) ? 0.2 : 1,
        roughness: CANTO_COLOR.has(carta.id) ? 0.5 : 0.28,
        transparent: true,
      }),
    [carta.id, carta.acento],
  );
  const dorso = useMemo(() => {
    const f = papelAlgodon();
    return new MeshStandardMaterial({ color: new Color(carta.papel), map: f.detalle, roughness: 0.9, transparent: true });
  }, [carta.papel]);
  const sombra = useMemo(
    () =>
      new MeshBasicMaterial({
        map: sombraSuave(geo.w + 60, geo.h + 60, 0.2),
        color: "#3a2a1c",
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    [geo.w, geo.h],
  );
  useEffect(
    () => () => {
      mat?.dispose();
      canto.dispose();
      dorso.dispose();
      sombra.map?.dispose();
      sombra.dispose();
    },
    [mat, canto, dorso, sombra],
  );

  const g = useMemo(
    () => ({
      cara: planoCurvo(geo.w, geo.h, 20, 1, CURVA),
      // El canto, medio píxel hacia dentro: de frente no asoma (sin dientes).
      canto: cantoCurvo(geo.w - 1, geo.h - 1, GROSOR, CURVA * ((geo.w - 1) / geo.w) ** 2),
      dorso: planoCurvo(geo.w, geo.h, 20, 1, CURVA),
    }),
    [geo.w, geo.h],
  );
  useEffect(
    () => () => {
      g.cara.dispose();
      g.canto.dispose();
      g.dorso.dispose();
    },
    [g],
  );

  const raiz = useRef<Group>(null);
  const cuerpo = useRef<Group>(null);
  const sombraRef = useRef<Group>(null);

  // La pose se calcula en el padre (useFrame de Abanico) y se guarda aquí.
  useFrame(() => {
    const r = raiz.current;
    const c = cuerpo.current;
    if (!r || !c || !mat) return;
    const t = estado.current.tilt[indice] ?? { x: 0, y: 0 };
    // Un pelo inclinada hacia atrás, como apoyada: se ve el canto de abajo.
    c.rotation.x = t.x - 0.07;
    c.rotation.y = t.y;
  });

  if (!mat) return null;
  return (
    <group ref={raiz} name={`carta-${indice}`}>
      {/* La sombra, en la «pared» de detrás. */}
      <group ref={sombraRef} name="sombra">
        <mesh material={sombra} position={[0, 0, 0]}>
          <planeGeometry args={[geo.w + 60, geo.h + 60]} />
        </mesh>
      </group>
      <group ref={cuerpo} name="cuerpo">
        <mesh geometry={g.cara} material={mat} />
        <mesh geometry={g.canto} material={canto} />
        <mesh geometry={g.dorso} material={dorso} position={[0, 0, -GROSOR]} rotation={[0, Math.PI, 0]} />
      </group>
    </group>
  );
}

function Abanico({ p }: { p: PropsEscenaTarjetas }) {
  const { camera, size, invalidate, scene } = useThree();
  // Las medidas se rehacen cuando cambia el tamaño (`version`) o las cartas.
  const [version, setVersion] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` y `cartas` son los disparadores
  const geos = useMemo(() => medir(p.carril), [p.carril, p.cartas, version]);
  const [visibles, setVisibles] = useState<[number, number]>([0, 3]);
  const estado = useRef({
    tilt: [] as { x: number; y: number }[],
    meta: [] as { x: number; y: number }[],
    listo: new Set<string>(),
    avisado: false,
    inicio: -1,
    frames: 0,
    medido: false,
  });

  // Cámara a 1200 px, en píxeles CSS.
  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    cam.fov = (2 * Math.atan(size.height / 2 / PERSPECTIVA) * 180) / Math.PI;
    cam.position.set(0, 0, PERSPECTIVA);
    cam.near = 100;
    cam.far = 3000;
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  // Medir otra vez si cambia el tamaño o el número de tarjetas.
  useEffect(() => {
    const ul = p.carril;
    const re = () => {
      setVersion((v) => v + 1);
      invalidate();
    };
    const obs = new ResizeObserver(re);
    obs.observe(ul);
    // Solo se montan (y pintan su textura) las tarjetas cerca de la vista:
    // con 28 plantillas, la memoria de vídeo de un móvil no da para todas.
    const rango = () => {
      const izq = ul.scrollLeft - ul.clientWidth * 0.75;
      const der = ul.scrollLeft + ul.clientWidth * 1.75;
      const vis: number[] = [];
      Array.from(ul.children).forEach((li, i) => {
        const el = li as HTMLElement;
        if (el.offsetLeft + el.offsetWidth >= izq && el.offsetLeft <= der) vis.push(i);
      });
      const a = vis.length ? vis[0] : 0;
      const b = vis.length ? vis[vis.length - 1] : -1;
      setVisibles((v) => (v[0] === a && v[1] === b ? v : [a, b]));
    };
    rango();
    const scroll = () => {
      rango();
      invalidate();
    };
    ul.addEventListener("scroll", scroll, { passive: true });
    return () => {
      obs.disconnect();
      ul.removeEventListener("scroll", scroll);
    };
  }, [p.carril, p.cartas.length, invalidate]);

  // Inclinar: el ratón sobre una tarjeta la inclina (y el foil brilla); en
  // táctil, el giroscopio inclina todas un poco.
  useEffect(() => {
    const ul = p.carril;
    const fino = window.matchMedia("(pointer: fine)").matches;
    const sobre = (e: PointerEvent) => {
      if (!p.activo) return;
      const meta = estado.current.meta;
      Array.from(ul.children).forEach((li, i) => {
        const r = (li.querySelector("[data-portada]") as HTMLElement | null)?.getBoundingClientRect();
        if (!r) return;
        const dentro = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        meta[i] = dentro
          ? { x: ((e.clientY - r.top) / r.height - 0.5) * 0.26, y: ((e.clientX - r.left) / r.width - 0.5) * -0.3 }
          : { x: 0, y: 0 };
      });
      invalidate();
    };
    const fuera = () => {
      estado.current.meta = estado.current.meta.map(() => ({ x: 0, y: 0 }));
      invalidate();
    };
    let ref: { b: number; g: number } | null = null;
    const giro = (e: DeviceOrientationEvent) => {
      if (!p.activo || e.beta == null || e.gamma == null) return;
      ref ??= { b: e.beta, g: e.gamma };
      const x = Math.max(-1, Math.min(1, (e.beta - ref.b) / 20)) * 0.12;
      const y = Math.max(-1, Math.min(1, (e.gamma - ref.g) / 20)) * -0.16;
      estado.current.meta = p.cartas.map(() => ({ x, y }));
      invalidate();
    };
    if (fino) {
      ul.addEventListener("pointermove", sobre, { passive: true });
      ul.addEventListener("pointerleave", fuera, { passive: true });
    } else window.addEventListener("deviceorientation", giro, { passive: true });
    return () => {
      ul.removeEventListener("pointermove", sobre);
      ul.removeEventListener("pointerleave", fuera);
      window.removeEventListener("deviceorientation", giro);
    };
  }, [p.carril, p.activo, p.cartas, invalidate]);

  useEffect(() => {
    if (p.activo) invalidate();
  }, [p.activo, invalidate]);

  useFrame((st, dtBruto) => {
    const dt = Math.min(dtBruto, 1 / 30);
    const ul = p.carril;
    const e = estado.current;
    let seguir = false;

    // FPS de los dos primeros segundos.
    if (e.inicio < 0) e.inicio = st.clock.elapsedTime;
    const vida = st.clock.elapsedTime - e.inicio;
    if (!e.medido && e.listo.size > 0) {
      e.frames++;
      if (vida > 2) {
        e.medido = true;
        if (e.frames / vida < 30) p.onLento?.(e.frames / vida);
      } else seguir = true;
    }

    const W = size.width;
    const H = size.height;
    const vista = ul.clientWidth;
    const sl = ul.scrollLeft;
    const k = 1 - Math.pow(0.002, dt);
    geos.forEach((g, i) => {
      const nodo = scene.getObjectByName(`carta-${i}`);
      if (!nodo || !g.w) return;
      // Progreso de `view(inline)`: 0 entrando por la derecha, 1 saliendo por la izquierda.
      const izq = g.liLeft - sl;
      const prog = (vista - izq) / (vista + g.liW);
      const kk = Math.max(-1, Math.min(1, (prog - 0.5) * 2));
      const a = Math.abs(kk);
      // Origen: 50 % 100 % del li (como `transform-origin` del CSS).
      const ox = izq + g.liW / 2 - W / 2;
      const oy = H / 2 - (g.liTop + g.liH);
      nodo.position.set(ox, oy - 0.09 * g.liH * a, 0);
      nodo.rotation.set(0, (30 * kk * Math.PI) / 180, (-7 * kk * Math.PI) / 180, "YXZ");
      nodo.scale.setScalar(1 - 0.14 * a);
      // La cartulina, dentro del li.
      const cuerpo = nodo.getObjectByName("cuerpo");
      const sombra = nodo.getObjectByName("sombra");
      const cx = g.left + g.w / 2 - g.liW / 2;
      const cy = g.liH - (g.top + g.h / 2);
      if (cuerpo) cuerpo.position.set(cx, cy, GROSOR);
      if (sombra) sombra.position.set(cx + 8 + 10 * kk, cy - 16, -24);
      // Inclinación suave hacia la meta.
      const t = (e.tilt[i] ??= { x: 0, y: 0 });
      const m = e.meta[i] ?? { x: 0, y: 0 };
      t.x += (m.x - t.x) * k;
      t.y += (m.y - t.y) * k;
      if (Math.abs(m.x - t.x) > 0.0005 || Math.abs(m.y - t.y) > 0.0005) seguir = true;
      // El abanico CSS funde los extremos al 55 %.
      const op = 1 - 0.45 * a;
      nodo.traverse((o) => {
        const mm = (o as { material?: { opacity: number } }).material;
        if (mm && "opacity" in mm) {
          const base = (mm as { userData?: { base?: number } }).userData?.base;
          (mm as { opacity: number }).opacity = (base ?? (o.parent?.name === "sombra" ? 0.42 : 1)) * op;
        }
      });
    });

    if (!e.avisado && e.listo.size >= Math.min(3, p.cartas.length)) {
      e.avisado = true;
      requestAnimationFrame(() => requestAnimationFrame(() => p.onListo?.()));
    }
    if (seguir && p.activo) invalidate();
  });

  return (
    <>
      {p.cartas.map((c, i) =>
        geos[i] && i >= visibles[0] && i <= visibles[1] ? (
          <Carta key={`${c.id}-${i}`} carta={c} geo={geos[i]} indice={i} estado={estado} />
        ) : null,
      )}
    </>
  );
}

export default function EscenaTarjetas3D(p: PropsEscenaTarjetas) {
  return (
    <Lienzo dpr={[1, 1.75]} alpha tonemapping={NeutralToneMapping} exposicion={1.05}>
      <EntornoEstudio intensidad={0.9} />
      <directionalLight position={[-500, 700, 900]} intensity={1.6} color="#fff6ea" />
      <ambientLight intensity={0.15} />
      <Abanico p={p} />
    </Lienzo>
  );
}
