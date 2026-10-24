"use client";

import { useRef, useState } from "react";
import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";
import { pulsar, ruido, vibrar } from "./musicales";

/**
 * CARA A — las dos islas de cliente.
 *
 * `ViniloCuenta`: la contraportada. La cuenta atrás es el tracklist de la
 * cara B, con puntos guía y cifras tabulares; al lado, un disco con su
 * brazo cuya aguja avanza con los segundos (una vuelta por minuto, giro
 * continuo, ningún destello).
 *
 * `ViniloDisco` (MOMENTO WOW): «Tocad el vinilo». Un toque y el LP acelera
 * hasta 33⅓ rpm y suena un segundo (el crepitar de la aguja y un acorde
 * sintetizado aquí mismo, sin archivos). Otro toque lo frena. Es un
 * <button> con aria-pressed: funciona con Enter y Espacio.
 */
export function ViniloCuenta({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const pistas = [
    ["Días", String(c.d)],
    ["Horas", dos(c.h)],
    ["Minutos", dos(c.m)],
    ["Segundos", dos(c.s)],
  ] as const;
  return (
    <div className="vi-contra">
      <Anuncio c={c} />
      <div className="vi-contra-disco" aria-hidden="true">
        <span className="vi-mini" style={{ "--giro": `${c.vivo ? c.s * 6 : 0}deg` } as React.CSSProperties}>
          <span className="vi-mini-galleta" />
        </span>
        <span className="vi-brazo" />
      </div>
      {c.vivo && c.estado === "falta" ? (
        <ol className="vi-pistas" aria-hidden="true">
          {pistas.map(([t, n], i) => (
            <li key={t}>
              <span className="vi-num tabular-nums">0{i + 1}</span>
              <span className="vi-guia">{t}</span>
              <span className="vi-valor display tabular-nums">{n}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="vi-contra-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy, en directo" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
        </p>
      )}
    </div>
  );
}

export function ViniloDisco({ iniciales }: { iniciales: string }) {
  const [gira, setGira] = useState(false);
  const ultima = useRef(0);
  return (
    <button
      type="button"
      className="vi-disco"
      aria-pressed={gira}
      aria-label="Hacer girar el disco y escuchar un acorde"
      data-gira={gira ? "1" : "0"}
      onClick={() => {
        const ahora = Date.now();
        if (ahora - ultima.current < 250) return;
        ultima.current = ahora;
        const sigue = !gira;
        setGira(sigue);
        if (sigue) {
          ruido(0.9, 0.16, "aguja");
          // Mi menor abierto, rasgueado: Mi2 Si2 Mi3 Sol3 Si3.
          [82.41, 123.47, 164.81, 196, 246.94].forEach((hz, i) => pulsar(hz, 0.2, 0.25 + i * 0.03));
          vibrar(8);
        }
      }}
    >
      <span className="vi-surcos" aria-hidden="true" />
      <span className="vi-galleta" aria-hidden="true">
        <span className="vi-galleta-l">{iniciales}</span>
        <span className="vi-galleta-t">Cara A · 33⅓</span>
      </span>
      <span className="vi-brillo" aria-hidden="true" />
    </button>
  );
}
