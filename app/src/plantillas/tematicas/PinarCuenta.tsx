"use client";

import { useSyncExternalStore } from "react";
import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * BOSQUE ENCANTADO — «Los anillos del tronco».
 *
 * Una rodaja de tronco (seis anillos irregulares y una grieta) con las
 * cifras grabadas a fuego. Una luciérnaga da una vuelta por minuto al borde
 * de la corteza y, cada día que falta menos, se dibuja un anillo nuevo en el
 * centro. Sin JS: la rodaja y la fecha. Con «menos movimiento»: sin
 * luciérnaga ni segundos (la frase `aria-live` va por minutos siempre).
 */
const RM = "(prefers-reduced-motion: reduce)";
const quietoSub = (f: () => void) => {
  const q = matchMedia(RM);
  q.addEventListener("change", f);
  return () => q.removeEventListener("change", f);
};

/** Un anillo irregular: un círculo con el radio ondulado (determinista). */
function anillo(r: number, i: number) {
  const n = 28;
  let d = "";
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2;
    const rr = r + Math.sin(a * 3 + i) * (0.9 + i * 0.25) + Math.cos(a * 5 + i * 2) * 0.7;
    d += `${k ? "L" : "M"}${(100 + rr * Math.cos(a)).toFixed(1)} ${(100 + rr * Math.sin(a)).toFixed(1)}`;
  }
  return d + "Z";
}
const ANILLOS = [86, 75, 64, 53, 42, 31].map(anillo);

export default function PinarCuenta({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const quieto = useSyncExternalStore(quietoSub, () => matchMedia(RM).matches, () => true);
  const cifras = c.vivo && c.estado === "falta";
  return (
    <div className="pi-tronco">
      <Anuncio c={c} />
      <div className="pi-rodaja" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="97" className="pi-corteza" />
          <circle cx="100" cy="100" r="91" className="pi-madera" />
          {ANILLOS.map((d, i) => (
            <path key={i} d={d} className="pi-anillo" style={{ "--i": i } as React.CSSProperties} />
          ))}
          <path d="M100 14 L103 34 L99 46 L102 58" className="pi-grieta" />
          {cifras && <circle key={c.d} cx="100" cy="100" r="20" pathLength={1} className="pi-anillo-nuevo" />}
        </svg>
        {cifras && !quieto && (
          <span className="pi-orbita" style={{ rotate: `${-c.total * 6}deg` }}>
            <span className="pi-luciernaga" />
          </span>
        )}
        <div className="pi-cifras">
          {cifras ? (
            (
              [
                ["días", String(c.d)],
                ["horas", dos(c.h)],
                ["min", dos(c.m)],
                ["seg", quieto ? "··" : dos(c.s)],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <p className="pi-grabado tabular-nums">{v}</p>
                <p className="pi-unidad">{k}</p>
              </div>
            ))
          ) : (
            <p className="pi-fecha-centro">
              {c.estado === "hoy" ? "Hoy" : c.estado === "paso" ? "Gracias" : "Os esperamos"}
            </p>
          )}
        </div>
      </div>
      <p className="pi-tronco-pie">
        {c.estado === "hoy" ? "Hoy nos casamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
      </p>
    </div>
  );
}
