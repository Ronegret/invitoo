"use client";

import { useSyncExternalStore } from "react";
import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * BRAZADA — «El reloj de ritmo» (el pace clock de todas las piscinas):
 * esfera blanca, 60 marcas, números de 5 en 5 y una aguja cian que barre
 * los segundos hacia atrás, porque descuenta. Cada minuto, al pasar por el
 * 60, la marca se ilumina como una salida. Debajo, el marcador.
 * Sin JS: la esfera y la fecha. Con «menos movimiento»: sin aguja ni
 * segundos (la frase `aria-live` va por minutos siempre).
 */
const RM = "(prefers-reduced-motion: reduce)";
const quietoSub = (f: () => void) => {
  const q = matchMedia(RM);
  q.addEventListener("change", f);
  return () => q.removeEventListener("change", f);
};

const NUMEROS = Array.from({ length: 12 }, (_, i) => {
  const a = ((i * 30 - 90) * Math.PI) / 180;
  return { n: i === 0 ? 60 : i * 5, x: (100 + 68 * Math.cos(a)).toFixed(1), y: (105 + 68 * Math.sin(a)).toFixed(1) };
});

export default function BrazadaCuenta({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const quieto = useSyncExternalStore(quietoSub, () => matchMedia(RM).matches, () => true);
  const cifras = c.vivo && c.estado === "falta";
  return (
    <div className="br-ritmo-caja">
      <Anuncio c={c} />
      <svg viewBox="0 0 200 200" aria-hidden="true" className="br-ritmo">
        <circle cx="100" cy="100" r="96" className="br-esfera" />
        {Array.from({ length: 60 }, (_, i) => (
          <line
            key={i}
            x1="100"
            y1="10"
            x2="100"
            y2={i % 5 ? 16 : 22}
            className={i % 5 ? "br-marca" : i ? "br-marca br-marca-5" : "br-marca br-marca-5 br-marca-0"}
            style={{ rotate: `${i * 6}deg` }}
          />
        ))}
        {NUMEROS.map((p) => (
          <text key={p.n} x={p.x} y={p.y} className="br-num">
            {p.n}
          </text>
        ))}
        {cifras && !quieto && (
          <g key={Math.floor(c.total / 60)} className="br-destello">
            <circle cx="100" cy="16" r="7" />
          </g>
        )}
        {cifras && !quieto && <line x1="100" y1="114" x2="100" y2="20" className="br-aguja" style={{ rotate: `${c.total * 6}deg` }} />}
        <circle cx="100" cy="100" r="5" className="br-eje" />
      </svg>
      {cifras ? (
        <p aria-hidden="true" className="br-marcador tabular-nums">
          {c.d} d · {dos(c.h)}:{dos(c.m)}
          {!quieto && <span className="br-seg">:{dos(c.s)}</span>}
        </p>
      ) : null}
      <p className="br-ritmo-pie">
        {c.estado === "hoy" ? "Hoy nos casamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
      </p>
    </div>
  );
}
