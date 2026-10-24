"use client";
/* eslint-disable react-hooks/immutability -- three.js: la escena, la cámara y
   los materiales son objetos mutables por diseño (R3F los muta en cada
   fotograma, fuera del render de React). */

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  BackSide,
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderChunk,
  Vector3,
} from "three";
import { lino } from "./texturas";

/**
 * El estudio de fotografía de producto, sin descargar ningún HDR:
 *  · un entorno pintado en una escena mínima (una caja gris cálida con un
 *    softbox grande arriba a la izquierda, una tira de relleno a la derecha
 *    y el rebote cálido de la mesa), pasado por PMREM una sola vez;
 *  · la mesa de lino con un desenfoque que crece al alejarse del foco (la
 *    profundidad de campo de un 100 mm macro a f/4).
 */

export function EntornoEstudio({ intensidad = 1 }: { intensidad?: number }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const sala = new Scene();
    const mat = (c: string, i = 1) => new MeshBasicMaterial({ color: new Color(c).multiplyScalar(i) });
    const caja = new Mesh(new BoxGeometry(60, 60, 60), mat("#6e655c", 0.55));
    (caja.material as MeshBasicMaterial).side = BackSide;
    sala.add(caja);
    const panel = (w: number, h: number, c: string, i: number, p: [number, number, number]) => {
      const m = new Mesh(new PlaneGeometry(w, h), mat(c, i));
      m.position.set(...p);
      m.lookAt(0, 0, 0);
      sala.add(m);
    };
    // Softbox grande: la ventana del bodegón, arriba a la izquierda.
    panel(26, 18, "#fff7ec", 5.5, [-14, 10, 22]);
    // Relleno: una tira estrecha a la derecha.
    panel(6, 24, "#ffffff", 2.2, [24, -2, 12]);
    // El cenital, muy suave.
    panel(30, 30, "#fffaf2", 1.4, [0, 0, 29]);
    // Rebote cálido desde abajo (la mesa de lino).
    panel(50, 18, "#d8c6a8", 0.9, [0, -26, -2]);
    const pm = new PMREMGenerator(gl);
    const rt = pm.fromScene(sala, 0.035);
    scene.environment = rt.texture;
    scene.environmentIntensity = intensidad;
    sala.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (m.material as MeshBasicMaterial).dispose();
      }
    });
    pm.dispose();
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [gl, scene, intensidad]);
  return null;
}

/**
 * La mesa de lino. `foco` es el punto nítido (mundo); `desenfoque` el
 * nivel de mip que se suma por cada cm de distancia al foco.
 */
export function MesaLino({
  tamano = 140,
  repeticion = 3.2,
  foco = [0, 0, 0],
  desenfoque = 0.09,
  tono = "#ffffff",
}: {
  tamano?: number;
  /** Centímetros que ocupa un mosaico del lino. */
  repeticion?: number;
  foco?: [number, number, number];
  desenfoque?: number;
  tono?: string;
}) {
  const material = useMemo(() => {
    const t = lino();
    const color = t.color.clone();
    const normal = t.normal.clone();
    const rep = tamano / repeticion;
    color.repeat.set(rep, rep);
    normal.repeat.set(rep, rep);
    color.needsUpdate = normal.needsUpdate = true;
    const m = new MeshStandardMaterial({
      map: color,
      normalMap: normal,
      color: new Color(tono),
      roughness: 0.93,
      metalness: 0,
    });
    m.normalScale.set(0.9, 0.9);
    const f = new Vector3(...foco);
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uFoco = { value: f };
      sh.uniforms.uDesenfoque = { value: desenfoque };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vMundo;")
        .replace(
          "#include <worldpos_vertex>",
          "#include <worldpos_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;",
        );
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vMundo;\nuniform vec3 uFoco;\nuniform float uDesenfoque;",
        )
        .replace(
          "#include <map_fragment>",
          ShaderChunk.map_fragment.replace(
            "texture2D( map, vMapUv )",
            "texture2D( map, vMapUv, clamp(distance(vMundo, uFoco) * uDesenfoque, 0.0, 4.0) )",
          ),
        )
        .replace(
          "#include <normal_fragment_maps>",
          ShaderChunk.normal_fragment_maps.replace(
            "texture2D( normalMap, vNormalMapUv )",
            "texture2D( normalMap, vNormalMapUv, clamp(distance(vMundo, uFoco) * uDesenfoque, 0.0, 4.0) )",
          ),
        );
    };
    return m;
  }, [tamano, repeticion, foco, desenfoque, tono]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} receiveShadow position={[0, 0, -0.002]}>
      <planeGeometry args={[tamano, tamano]} />
    </mesh>
  );
}
