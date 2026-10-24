"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cuandoOciosoYVisible, forzado3D, marcarSin3D, puede3D } from "./capacidad";
import type { CartaGaleria } from "./EscenaTarjetas3D";

/**
 * `<Tarjetas3D>`: las cartulinas 3D de la galería, en UNA sola escena
 * detrás del carril HTML (un contexto WebGL para todas: es lo que menos
 * pesa en un móvil). Se coloca exactamente sobre el `<ul>` y pinta cada
 * tarjeta donde está su `<li>`.
 *
 * Igual que `<Sobre3D>`: nada en el servidor; carga con `next/dynamic`
 * cuando la página está ociosa y el carril a la vista; si el dispositivo no
 * lo merece, no se monta y quedan las portadas HTML (que siguen ahí, debajo,
 * para el lector de pantalla, el teclado y la View Transition).
 */

const Escena = dynamic(() => import("./EscenaTarjetas3D"), { ssr: false, loading: () => null });

export default function Tarjetas3D({
  carril,
  cartas,
  onListo,
  onFallo,
}: {
  carril: React.RefObject<HTMLUListElement | null>;
  cartas: CartaGaleria[];
  onListo?: () => void;
  onFallo?: (motivo: string) => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [cargar, setCargar] = useState(false);
  const [listo, setListo] = useState(false);
  const [fuera, setFuera] = useState(false);
  const [activo, setActivo] = useState(true);
  const [rect, setRect] = useState<{ top: number; left: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const ul = carril.current;
    if (!ul || !puede3D()) return;
    return cuandoOciosoYVisible(ul, () => setCargar(true));
  }, [carril]);

  // La caja del canvas = la del carril.
  useEffect(() => {
    const ul = carril.current;
    if (!ul || !cargar) return;
    const medir = () =>
      setRect({ top: ul.offsetTop, left: ul.offsetLeft, w: ul.offsetWidth, h: ul.offsetHeight });
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(ul);
    let visible = true;
    const poner = () => setActivo(visible && document.visibilityState === "visible");
    const io = new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      poner();
    });
    io.observe(ul);
    document.addEventListener("visibilitychange", poner);
    return () => {
      obs.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", poner);
    };
  }, [carril, cargar]);

  if (fuera || !cargar || !rect || !carril.current) return null;

  return (
    <div
      ref={caja}
      aria-hidden
      data-tresd={listo ? "listo" : "cargando"}
      style={{
        position: "absolute",
        top: rect.top,
        left: rect.left,
        width: rect.w,
        height: rect.h,
        zIndex: 0,
        pointerEvents: "none",
        opacity: listo ? 1 : 0,
        transition: "opacity 300ms cubic-bezier(0.22, 0.61, 0.36, 1)",
      }}
    >
      <Escena
        cartas={cartas}
        carril={carril.current}
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
    </div>
  );
}
