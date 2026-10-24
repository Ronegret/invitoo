"use client";

import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * PASE VIP — las dos islas de cliente.
 *
 * `FestivalCartel`: la cuenta atrás es un cartel de festival. DÍAS es el
 * cabeza de cartel; horas, minutos y segundos bajan de tamaño como el
 * line-up. Solo sube (240 ms) la cifra que cambia; nada parpadea.
 *
 * `FestivalFoil`: el foil holográfico de la acreditación sigue al dedo
 * (`pointermove` → `--fx`/`--fy`). Sin sensores ni permisos; sin puntero,
 * el foil se mueve con el scroll (CSS).
 */
export function FestivalCartel({ hasta, pie }: { hasta: string; pie: string }) {
  const c = useCuenta(hasta);
  const filas = [
    ["días", String(c.d)],
    ["horas", dos(c.h)],
    ["minutos", dos(c.m)],
    ["segundos", dos(c.s)],
  ] as const;
  return (
    <div className="fe-cartel">
      <Anuncio c={c} />
      {c.vivo && c.estado === "falta" ? (
        <ol className="fe-cartel-filas display" aria-hidden="true">
          {filas.map(([et, n], i) => (
            <li key={et} data-fila={i}>
              <span className="fe-cartel-n tabular-nums">
                {Array.from(n).map((x, j) => (
                  <span key={`${j}-${x}`} className="fe-cifra">{x}</span>
                ))}
              </span>{" "}
              <span className="fe-cartel-et">{et}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="fe-cartel-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy es el día" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
        </p>
      )}
      <p className="fe-cartel-pie">{pie}</p>
    </div>
  );
}

export function FestivalFoil({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fe-foil-dedo"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--fx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        e.currentTarget.style.setProperty("--fy", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
        e.currentTarget.dataset.dedo = "1";
      }}
      onPointerLeave={(e) => {
        delete e.currentTarget.dataset.dedo;
      }}
    >
      {children}
    </div>
  );
}
