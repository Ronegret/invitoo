"use client";

import { Anuncio, mayuscula, useCuenta } from "./cuenta";

/**
 * ORILLA (K2) — la cuenta atrás es «La marea»: las cifras escritas en la
 * arena y, por detrás, una lámina de agua acuarelada que SUBE a medida que
 * se acerca la boda (--marea = 1 − días/365, entre 0,1 y 1) y hace un
 * vaivén lento. Cuando cambia el minuto, una ola pequeña cruza bajo las
 * cifras. Con «menos movimiento», sin vaivén ni ola (CSS).
 *
 * Sin JS, la fecha; el lector de pantalla oye la frase de `Anuncio`.
 */
export default function OrillaMarea({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const vivo = c.vivo && c.estado === "falta";
  const marea = vivo ? Math.min(1, Math.max(0.1, 1 - c.d / 365)) : 0.55;
  const cifras = [
    ["días", String(c.d)],
    ["horas", String(c.h)],
    ["min", String(c.m)],
    ["seg", String(c.s)],
  ] as const;
  return (
    <div className="ol-cuenta" style={{ "--marea": marea } as React.CSSProperties} data-vivo={c.vivo ? "1" : undefined}>
      <Anuncio c={c} />
      <span className="ol-agua bucle" aria-hidden="true" />
      <span className="ol-espuma bucle" aria-hidden="true" />
      {vivo && <span key={Math.floor(c.total / 60)} className="ol-olita" aria-hidden="true" />}
      {vivo ? (
        <div className="ol-cifras" aria-hidden="true">
          {cifras.map(([k, v]) => (
            <div key={k}>
              <p className="ol-cifra display tabular-nums">
                <span key={v} className="ol-cifra-v">{v}</span>
              </p>
              <p className="ol-unidad">{k}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="ol-cuenta-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy nos casamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
        </p>
      )}
      <p className="ol-marea-nota" aria-hidden="true">{vivo ? "La marea sube cada día que falta menos" : " "}</p>
    </div>
  );
}
