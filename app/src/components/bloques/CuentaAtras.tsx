"use client";

import { useEffect, useState } from "react";

/**
 * Cuenta atrás. Se renderiza vacía en servidor y se rellena al hidratar,
 * para no repetir el fallo actual de invitoo.es (mostrar "0 días 0 horas"
 * antes de que arranque el JS).
 */
export default function CuentaAtras({ hasta }: { hasta: string }) {
  const [t, setT] = useState<null | { d: number; h: number; m: number; s: number }>(
    null,
  );

  useEffect(() => {
    const fin = new Date(hasta).getTime();
    const tic = () => {
      const ms = Math.max(0, fin - Date.now());
      setT({
        d: Math.floor(ms / 86_400_000),
        h: Math.floor(ms / 3_600_000) % 24,
        m: Math.floor(ms / 60_000) % 60,
        s: Math.floor(ms / 1000) % 60,
      });
    };
    tic();
    const id = setInterval(tic, 1000);
    return () => clearInterval(id);
  }, [hasta]);

  return (
    <section className="px-6 py-20 text-center" aria-live="off">
      <p className="text-[0.78rem] uppercase tracking-[0.3em] opacity-55">
        Nos quedan
      </p>
      <div className="mt-7 flex items-start justify-center gap-7 sm:gap-10">
        {(
          [
            ["días", t?.d],
            ["horas", t?.h],
            ["min", t?.m],
            ["seg", t?.s],
          ] as const
        ).map(([etiqueta, valor]) => (
          <div key={etiqueta} className="min-w-[3.2rem]">
            <p className="display text-[clamp(2.2rem,11vw,3.4rem)] tabular-nums">
              {valor === undefined || valor === null ? " " : valor}
            </p>
            <p className="mt-1 text-[0.75rem] uppercase tracking-[0.24em] opacity-50">
              {etiqueta}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
