"use client";

import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/** Clave de son 3-2, en semicorcheas de un compás de 16. */
const GOLPES = [0, 3, 6, 10, 12];

/**
 * SON DE FUEGO — la cuenta atrás «La clave»: las cuatro cifras en marcos de
 * cartel con bombillas de latón, y debajo la clave 3-2 que enseña el ritmo
 * (cinco puntos que se iluminan a su compás, 2 s por compás, fundidos de
 * 120 ms; área diminuta: no cuenta como destello). Con «menos movimiento»
 * los puntos quedan encendidos y quietos.
 */
export function FuegoClave({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const marcos = [
    ["días", String(c.d)],
    ["horas", dos(c.h)],
    ["min", dos(c.m)],
    ["seg", dos(c.s)],
  ] as const;
  return (
    <div className="fu-clave">
      <Anuncio c={c} />
      {c.vivo && c.estado === "falta" ? (
        <div className="fu-marcos" aria-hidden="true">
          {marcos.map(([et, n]) => (
            <div key={et} className="fu-marco">
              <span className="fu-marco-n display tabular-nums">
                {Array.from(n).map((x, j) => (
                  <span key={`${j}-${x}`} className="fu-cifra">{x}</span>
                ))}
              </span>
              <span className="fu-marco-et">{et}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="fu-clave-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Esta noche se baila" : c.estado === "paso" ? "Ya nos casamos. Gracias por bailar" : mayuscula(c.fecha)}
        </p>
      )}
      <div className="fu-clave-linea" aria-hidden="true">
        {GOLPES.map((g) => (
          <i key={g} style={{ "--paso": g } as React.CSSProperties} />
        ))}
      </div>
      <p className="fu-clave-ley">Así suena la clave 3-2</p>
    </div>
  );
}
