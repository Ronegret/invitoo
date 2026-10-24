"use client";

import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * ELEGANCIA PURA — cuatro cifras finas separadas por filetes de oro de
 * 1 px. La que cambia llega desenfocada y se ENFOCA (600 ms): es la única
 * animación de la pantalla.
 */
export default function CifrasFinas({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  return (
    <div className="finas">
      <Anuncio c={c} />
      {c.vivo && c.estado === "falta" ? (
        <dl className="finas-fila" aria-hidden="true">
          {(
            [
              ["días", String(c.d)],
              ["horas", dos(c.h)],
              ["minutos", dos(c.m)],
              ["segundos", dos(c.s)],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="finas-celda">
              <dd className="display tabular-nums">
                {Array.from(v).map((n, i) => (
                  // Cada dígito con su `key`: solo se vuelve a enfocar el que cambia.
                  <span key={`${i}-${n}`} className="finas-n">
                    {n}
                  </span>
                ))}
              </dd>
              <dt>{k}</dt>
            </div>
          ))}
        </dl>
      ) : (
        <p className="finas-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy nos casamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
        </p>
      )}
    </div>
  );
}
