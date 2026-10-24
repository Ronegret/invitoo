"use client";

import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * CUENTO DE HADAS — un reloj de arena de oro con polvo de hadas.
 *
 * La arena de arriba se vacía en un minuto y, al cambiar de minuto, el
 * reloj se da la vuelta solo (la ampolla llena estaba abajo y gira hasta
 * arriba: el giro ES la recarga, no hay salto). El hilo que cae y las
 * chispas son CSS. Debajo, días, horas, minutos y segundos.
 */
export default function RelojArena({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  // Fracción que queda arriba: 1 al empezar el minuto, 0 al acabarlo.
  const arriba = c.vivo ? c.s / 60 : 0.62;
  const abajo = 1 - arriba;
  const minuto = Math.floor(c.total / 60);
  // Ampollas: arriba de y=34 a y=150, abajo de y=170 a y=286 (viewBox 200×320).
  const nivelArriba = 150 - 104 * arriba;
  const nivelAbajo = 286 - 100 * abajo;

  return (
    <div className="arena">
      <Anuncio c={c} />
      <div className="arena-reloj" aria-hidden="true">
        <svg
          key={c.vivo ? minuto : "quieto"}
          viewBox="0 0 200 320"
          className={`arena-svg ${c.vivo ? "gira" : ""}`}
          role="presentation"
        >
          <defs>
            <linearGradient id="are-oro" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8d6a2c" />
              <stop offset=".5" stopColor="#f3dc9c" />
              <stop offset="1" stopColor="#8d6a2c" />
            </linearGradient>
            <linearGradient id="are-polvo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff3c4" />
              <stop offset="1" style={{ stopColor: "var(--acento)" }} />
            </linearGradient>
            <clipPath id="are-sup">
              <path d="M44 34 H156 C156 92 104 118 102 150 H98 C96 118 44 92 44 34 Z" />
            </clipPath>
            <clipPath id="are-inf">
              <path d="M98 170 H102 C104 202 156 228 156 286 H44 C44 228 96 202 98 170 Z" />
            </clipPath>
          </defs>
          {/* El cristal */}
          <path
            d="M44 34 H156 C156 92 104 118 102 160 C104 202 156 228 156 286 H44 C44 228 96 202 98 160 C96 118 44 92 44 34 Z"
            fill="rgb(255 255 255 / .06)"
            stroke="rgb(255 255 255 / .5)"
            strokeWidth="1.2"
          />
          {/* La arena de arriba (se vacía) y la de abajo (se llena) */}
          <g clipPath="url(#are-sup)">
            <rect x="40" y={nivelArriba} width="120" height={152 - nivelArriba} fill="url(#are-polvo)" className="arena-polvo" />
          </g>
          <g clipPath="url(#are-inf)">
            <path
              d={`M40 ${nivelAbajo + 10} Q100 ${nivelAbajo - 14} 160 ${nivelAbajo + 10} V290 H40 Z`}
              fill="url(#are-polvo)"
              className="arena-polvo"
            />
          </g>
          {/* El hilo que cae y las chispas */}
          <g className="arena-hilo">
            <line x1="100" y1="150" x2="100" y2={nivelAbajo} stroke="#fff1c2" strokeWidth="1.6" strokeDasharray="2 5" />
          </g>
          <g className="arena-chispas">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <circle key={i} cx={100 + (i % 2 ? 6 : -6) * (i / 3)} cy={168} r={1.4 + (i % 3) * 0.5} style={{ "--i": i } as React.CSSProperties} />
            ))}
          </g>
          {/* El armazón de oro */}
          <rect x="26" y="14" width="148" height="18" rx="4" fill="url(#are-oro)" />
          <rect x="26" y="288" width="148" height="18" rx="4" fill="url(#are-oro)" />
          <rect x="32" y="30" width="6" height="260" rx="3" fill="url(#are-oro)" />
          <rect x="162" y="30" width="6" height="260" rx="3" fill="url(#are-oro)" />
          <circle cx="35" cy="23" r="3" fill="#fff3c4" />
          <circle cx="165" cy="297" r="3" fill="#fff3c4" />
        </svg>
        <span className="arena-halo" />
      </div>

      {c.vivo && c.estado === "falta" ? (
        <dl className="arena-cifras" aria-hidden="true">
          {(
            [
              ["días", String(c.d)],
              ["horas", dos(c.h)],
              ["minutos", dos(c.m)],
              ["segundos", dos(c.s)],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dd className="tabular-nums">{v}</dd>
              <dt>{k}</dt>
            </div>
          ))}
        </dl>
      ) : (
        <p className="arena-fecha" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy nos casamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
        </p>
      )}
    </div>
  );
}
