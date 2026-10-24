"use client";

import { useSyncExternalStore } from "react";
import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * ÓRBITA — «T menos». El formato de lanzamiento («T − 120:04:12:33») sobre
 * un mini sistema solar: el planeta interior da una vuelta por minuto, el
 * de en medio una por hora y el exterior marca los días que quedan del año.
 * Sin JS: el sistema quieto y la fecha. Con «menos movimiento»: sin
 * segundos ni giros (la frase `aria-live` va por minutos siempre).
 */
const RM = "(prefers-reduced-motion: reduce)";
const quietoSub = (f: () => void) => {
  const q = matchMedia(RM);
  q.addEventListener("change", f);
  return () => q.removeEventListener("change", f);
};

export default function OrbitaCuenta({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const quieto = useSyncExternalStore(quietoSub, () => matchMedia(RM).matches, () => true);
  const cifras = c.vivo && c.estado === "falta";
  const orbitas: [string, number, string][] = [
    ["46%", cifras && !quieto ? -c.total * 6 : 40, "or-o1"],
    ["70%", cifras && !quieto ? -c.total / 10 : 160, "or-o2"],
    ["94%", cifras ? -((c.d % 365) / 365) * 360 : 260, "or-o3"],
  ];
  return (
    <div className="or-cuenta">
      <Anuncio c={c} />
      <div className="or-sistema" aria-hidden="true">
        <span className="or-sol" />
        {orbitas.map(([d, a, k]) => (
          <span key={k} className={`or-orb ${k}`} style={{ width: d, rotate: `${a}deg` }}>
            <i />
          </span>
        ))}
        <p className="or-t">
          {cifras ? (
            <span className="tabular-nums">
              {c.d < 1000 && <span className="or-tm">T − </span>}
              {c.d}:{dos(c.h)}:{dos(c.m)}
              {!quieto && <span className="or-seg">:{dos(c.s)}</span>}
            </span>
          ) : (
            <span className="or-t-quieto">{c.estado === "hoy" ? "Hoy" : c.estado === "paso" ? "Gracias" : "T −"}</span>
          )}
        </p>
      </div>
      {cifras && (
        <p aria-hidden="true" className="or-unidades">
          días · horas · min{!quieto && " · seg"}
        </p>
      )}
      <p className="or-cuenta-pie">
        {c.estado === "hoy" ? "Hoy nos casamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
      </p>
    </div>
  );
}
