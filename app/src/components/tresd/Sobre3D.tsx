"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cuandoOciosoYVisible, forzado3D, marcarSin3D, puede3D } from "./capacidad";
import type { PropsEscenaSobre } from "./EscenaSobre3D";

/**
 * `<Sobre3D>`: el sobre fotografiado, en WebGL, por encima de un póster
 * (o del sobre CSS) que ya está pintado.
 *
 * Cómo llega sin estorbar al LCP:
 *  1. El servidor no pinta nada de esto: el LCP es el póster (`<img>`) o el
 *     sobre CSS de quien lo use.
 *  2. Ya en el cliente, si el dispositivo lo merece (`puede3D`), espera a
 *     que la página esté ociosa y el sobre a la vista, y entonces pide el
 *     trozo de three.js (`next/dynamic`, `ssr: false`).
 *  3. Pinta, y cuando el primer fotograma con texturas está en pantalla,
 *     funde el canvas (300 ms) y llama a `onListo`: el que lo usa oculta su
 *     versión CSS.
 *  4. Mide los FPS dos segundos; si no llegan a 30, se retira (`onFallo`) y
 *     la versión CSS vuelve a estar ahí.
 *
 * Es decorativo: `aria-hidden`, `pointer-events: none`. El toque lo recibe
 * el botón o enlace de HTML que el que lo usa pone encima.
 */

const Escena = dynamic(() => import("./EscenaSobre3D"), { ssr: false, loading: () => null });

export type PropsSobre3D = Partial<
  Omit<PropsEscenaSobre, "activo" | "onListo" | "onLento" | "a" | "b" | "fecha" | "iniciales" | "escrito">
> &
  Pick<PropsEscenaSobre, "a" | "b" | "fecha" | "iniciales" | "escrito"> & {
    onListo?: () => void;
    /** Se retira (FPS bajos o error): vuelve lo CSS. */
    onFallo?: (motivo: string) => void;
    className?: string;
    style?: React.CSSProperties;
  };

const POR_DEFECTO = {
  papel: "#f8f2e8",
  forroColor: "#7a1c2b",
  lacreColor: "#7d1626",
  tinta: "#2a2420",
  acento: "#7d1626",
  letraMano: "var(--font-mano), cursive",
  letraCarta: "var(--font-italica), serif",
  letraTexto: "var(--texto), sans-serif",
  abierto: false,
  duracion: 2.6,
  destino: { x: 0.5, y: 0.36, w: 0.8 },
  encuadre: 0.84,
  caida: 3.6,
  matasellos: null,
} satisfies Partial<PropsEscenaSobre>;

export default function Sobre3D({ onListo, onFallo, className = "", style, ...props }: PropsSobre3D) {
  const caja = useRef<HTMLDivElement>(null);
  const [cargar, setCargar] = useState(false);
  const [listo, setListo] = useState(false);
  const [fuera, setFuera] = useState(false);
  const [activo, setActivo] = useState(true);

  // Decide y espera a la ociosidad + visibilidad.
  useEffect(() => {
    const el = caja.current;
    if (!el || !puede3D()) return;
    return cuandoOciosoYVisible(el, () => setCargar(true));
  }, []);

  // Fuera de pantalla o con la pestaña oculta: no se pinta.
  useEffect(() => {
    const el = caja.current;
    if (!el || !cargar) return;
    let visible = true;
    const poner = () => setActivo(visible && document.visibilityState === "visible");
    const obs = new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      poner();
    });
    obs.observe(el);
    document.addEventListener("visibilitychange", poner);
    return () => {
      obs.disconnect();
      document.removeEventListener("visibilitychange", poner);
    };
  }, [cargar]);

  // Si el contexto WebGL se pierde, fuera.
  useEffect(() => {
    if (!cargar) return;
    const el = caja.current;
    // En desarrollo (StrictMode) R3F desmonta y suelta el contexto del
    // primer canvas: solo cuenta si el canvas perdido sigue en la página.
    const perdido = (e: Event) => {
      const c = e.target as HTMLCanvasElement;
      window.setTimeout(() => {
        if (!c.isConnected) return;
        setFuera(true);
        onFallo?.("contexto-perdido");
      }, 600);
    };
    el?.addEventListener("webglcontextlost", perdido, true);
    return () => el?.removeEventListener("webglcontextlost", perdido, true);
  }, [cargar, onFallo]);

  if (fuera) return null;

  return (
    <div
      ref={caja}
      aria-hidden
      className={className}
      data-tresd={listo ? "listo" : cargar ? "cargando" : "no"}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: listo ? 1 : 0,
        transition: "opacity 300ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        ...style,
      }}
    >
      {cargar && (
        <Escena
          {...POR_DEFECTO}
          {...(Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) as typeof props)}
          activo={activo}
          onListo={() => {
            setListo(true);
            onListo?.();
          }}
          onLento={(fps) => {
            if (forzado3D()) return;
            marcarSin3D();
            setFuera(true);
            onFallo?.(`fps-${Math.round(fps)}`);
          }}
        />
      )}
    </div>
  );
}
