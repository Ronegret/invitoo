"use client";

import { createRoot, extend, type ReconcilerRoot, type RootState } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import {
  AmbientLight,
  DirectionalLight,
  Group,
  Mesh,
  PlaneGeometry,
  SpotLight,
  type ShadowMapType,
  type ToneMapping,
} from "three";

/**
 * Un `<Canvas>` mínimo de React Three Fiber, hecho con `createRoot`.
 *
 * ¿Por qué no `<Canvas>`? Porque `<Canvas>` hace `extend(THREE)` con TODO
 * three.js, y eso impide que el empaquetador quite lo que no se usa (unos
 * 40 KB gz de más). Aquí solo se registran las piezas que pintan nuestras
 * escenas. Lo demás se usa con `<mesh material={…} geometry={…}>` o se
 * crea a mano.
 *
 * Sin eventos de puntero de R3F: el canvas es decorativo
 * (`pointer-events: none`); el toque lo recibe el HTML de encima.
 */

extend({ AmbientLight, DirectionalLight, Group, Mesh, PlaneGeometry, SpotLight });

export function Lienzo({
  children,
  dpr,
  alpha = false,
  sombras,
  tonemapping,
  exposicion = 1,
  fondo,
}: {
  children: ReactNode;
  dpr: number | [number, number];
  alpha?: boolean;
  sombras?: ShadowMapType;
  tonemapping: ToneMapping;
  exposicion?: number;
  /** Color de fondo (si no hay transparencia). */
  fondo?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const raiz = useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null);
  const hijos = useRef(children);
  const configurado = useRef(false);

  // El contenido cambia a menudo (nombres, colores): solo se vuelve a pintar.
  useEffect(() => {
    hijos.current = children;
    if (configurado.current) raiz.current?.render(children);
  }, [children]);

  // Crear y destruir la raíz.
  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const r = createRoot(c);
    raiz.current = r;
    return () => {
      r.unmount();
      raiz.current = null;
    };
  }, []);

  // Configurar y pintar; y otra vez al cambiar el tamaño.
  useEffect(() => {
    const r = raiz.current;
    const el = caja.current;
    if (!r || !el) return;
    let vivo = true;
    const pintar = async () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const d = Array.isArray(dpr) ? Math.min(dpr[1], Math.max(dpr[0], window.devicePixelRatio || 1)) : dpr;
      await r.configure({
        frameloop: "demand",
        dpr: d,
        size: { width: w, height: h, top: 0, left: 0 },
        shadows: sombras === undefined ? false : { type: sombras },
        gl: { antialias: true, alpha, powerPreference: "default" },
        camera: { fov: 22, near: 1, far: 400, position: [0, -10, 80] },
        onCreated: (s: RootState) => {
          s.gl.toneMapping = tonemapping;
          s.gl.toneMappingExposure = exposicion;
          if (fondo && !alpha) s.gl.setClearColor(fondo);
          else s.gl.setClearColor(0x000000, 0);
        },
      });
      if (!vivo) return;
      configurado.current = true;
      r.render(hijos.current);
    };
    void pintar();
    const obs = new ResizeObserver(() => void pintar());
    obs.observe(el);
    return () => {
      vivo = false;
      obs.disconnect();
    };
    // `dpr` llega como array literal: se compara por valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dpr), alpha, sombras, tonemapping, exposicion, fondo]);

  return (
    <div ref={caja} aria-hidden style={{ position: "absolute", inset: 0 }}>
      <canvas ref={lienzo} tabIndex={-1} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
