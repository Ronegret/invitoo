"use client";

import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * ALTA SOCIEDAD — la cuenta atrás es un reloj de bolsillo de oro.
 *
 * Las agujas marcan lo que falta (horas, minutos y segundos) y giran en
 * el sentido de siempre: el ángulo se calcula sin «dar la vuelta» (sin el
 * salto de 0 a 360), así que la transición nunca rebobina. Los días van
 * en la ventanilla de las seis, como la fecha de un reloj de verdad, y
 * debajo, las cuatro cifras para leerlas sin esfuerzo.
 */
const ROMANOS = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

export default function RelojBolsillo({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  // Ángulos «desenrollados»: crecen sin parar mientras se consume el tiempo.
  // Sin JS (o antes de hidratar), las 10:08:37 de los escaparates.
  const t = -c.total;
  const seg = c.vivo ? t * 6 : 222;
  const min = c.vivo ? t * 0.1 : 51.7;
  const hor = c.vivo ? t / 120 : 304;

  return (
    <div className="bolsillo" data-vivo={c.vivo ? "1" : undefined}>
      <Anuncio c={c} />
      <div className="bolsillo-cadena" aria-hidden="true">
        <svg viewBox="0 0 300 380" className="bolsillo-svg" role="presentation">
          <defs>
            <radialGradient id="bol-oro" cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#f6e7b8" />
              <stop offset=".45" stopColor="#d2ad62" />
              <stop offset="1" stopColor="#8d6a2c" />
            </radialGradient>
            <radialGradient id="bol-esfera" cx="45%" cy="40%" r="70%">
              <stop offset="0" stopColor="#fffdf7" />
              <stop offset="1" stopColor="#efe6d4" />
            </radialGradient>
            <linearGradient id="bol-cristal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".55" />
              <stop offset=".35" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* La anilla y la corona */}
          <circle cx="150" cy="30" r="18" fill="none" stroke="url(#bol-oro)" strokeWidth="6" />
          <rect x="138" y="44" width="24" height="22" rx="5" fill="url(#bol-oro)" />
          <rect x="134" y="62" width="32" height="10" rx="3" fill="url(#bol-oro)" />
          {/* La caja */}
          <circle cx="150" cy="215" r="146" fill="url(#bol-oro)" />
          <circle cx="150" cy="215" r="136" fill="none" stroke="#7a5a22" strokeOpacity=".45" strokeWidth="1" />
          <circle cx="150" cy="215" r="128" fill="url(#bol-esfera)" />
          {/* Guirnalda grabada en la esfera */}
          <circle cx="150" cy="215" r="118" fill="none" style={{ stroke: "var(--acento)" }} strokeOpacity=".35" strokeWidth=".8" strokeDasharray="1 5" />
          {/* Marcas de minuto */}
          {Array.from({ length: 60 }, (_, i) => (
            <line
              key={i}
              x1="150"
              y1={i % 5 === 0 ? 96 : 92}
              x2="150"
              y2="90"
              stroke="#2a2a33"
              strokeOpacity={i % 5 === 0 ? 0.8 : 0.4}
              strokeWidth={i % 5 === 0 ? 1.6 : 0.8}
              transform={`rotate(${i * 6} 150 215)`}
            />
          ))}
          {ROMANOS.map((r, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return (
              <text
                key={r}
                x={(150 + Math.sin(a) * 100).toFixed(2)}
                y={(215 - Math.cos(a) * 100 + 6).toFixed(2)}
                textAnchor="middle"
                className="bolsillo-romano"
              >
                {r}
              </text>
            );
          })}
          {/* La ventanilla de los días, a las seis */}
          <rect x="118" y="252" width="64" height="30" rx="3" fill="#fffdf8" stroke="#8d6a2c" strokeWidth="1" />
          <text x="150" y="273" textAnchor="middle" className="bolsillo-dias">{c.vivo ? c.d : "—"}</text>
          <text x="150" y="246" textAnchor="middle" className="bolsillo-mini">días</text>
          {/* Agujas */}
          <g className="bolsillo-aguja hora" style={{ transform: `rotate(${hor}deg)` }}>
            <path d="M150 215 L146 205 L150 150 L154 205 Z" fill="#1f2a3a" />
            <circle cx="150" cy="160" r="5" fill="none" stroke="#1f2a3a" strokeWidth="2" />
          </g>
          <g className="bolsillo-aguja minuto" style={{ transform: `rotate(${min}deg)` }}>
            <path d="M150 218 L147 205 L150 112 L153 205 Z" fill="#1f2a3a" />
          </g>
          <g className="bolsillo-aguja segundo" style={{ transform: `rotate(${seg}deg)` }}>
            <line x1="150" y1="238" x2="150" y2="102" style={{ stroke: "var(--acento)" }} strokeWidth="1.3" />
            <circle cx="150" cy="232" r="3.4" style={{ fill: "var(--acento)" }} />
          </g>
          <circle cx="150" cy="215" r="5.5" fill="url(#bol-oro)" stroke="#7a5a22" strokeWidth=".8" />
          <circle cx="150" cy="215" r="128" fill="url(#bol-cristal)" />
        </svg>
      </div>

      {c.vivo && c.estado === "falta" ? (
        <dl className="bolsillo-cifras" aria-hidden="true">
          {(
            [
              ["días", String(c.d)],
              ["horas", dos(c.h)],
              ["minutos", dos(c.m)],
              ["segundos", dos(c.s)],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dd className="display tabular-nums">{v}</dd>
              <dt>{k}</dt>
            </div>
          ))}
        </dl>
      ) : (
        <p className="bolsillo-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy nos casamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
        </p>
      )}
    </div>
  );
}
