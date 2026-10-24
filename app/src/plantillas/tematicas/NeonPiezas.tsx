"use client";

import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * NEÓN DE MEDIANOCHE — la cuenta atrás «La pista»: cuatro baldosas de
 * cristal de una pista de baile. La que cambia se ilumina en 400 ms (fundido,
 * nunca de golpe); la de los segundos respira a 1 Hz, muy por debajo de los
 * 3 Hz de WCAG 2.3.1. Con «menos movimiento», solo cambian los números.
 */
export function NeonPista({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const baldosas = [
    ["días", String(c.d)],
    ["horas", dos(c.h)],
    ["min", dos(c.m)],
    ["seg", dos(c.s)],
  ] as const;
  return (
    <div className="ne-pista">
      <Anuncio c={c} />
      {c.vivo && c.estado === "falta" ? (
        <div className="ne-baldosas" aria-hidden="true">
          {baldosas.map(([et, n]) => (
            <div key={et} className="ne-baldosa" data-et={et}>
              <span key={n} className="ne-baldosa-n display tabular-nums">{n}</span>
              <span className="ne-baldosa-et">{et}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="ne-pista-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Esta noche" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
        </p>
      )}
      <p className="ne-bpm" aria-hidden="true">92 BPM</p>
    </div>
  );
}
