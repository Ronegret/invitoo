"use client";

import { ESCUDO } from "./BlasonArmas";
import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * BLASÓN (K2) — la cuenta atrás es «La proclama»: un edicto en pergamino
 * con su lacre y, debajo, cuatro escudos con las cifras. Cuando cambia una
 * cifra, su escudo voltea (la `key` es el valor): el de los segundos, cada
 * segundo; el de los días, a medianoche.
 *
 * Sin JS se lee la fecha. El lector de pantalla oye la frase de `Anuncio`
 * (cambia como mucho una vez por minuto); los escudos van `aria-hidden`.
 */
export default function BlasonProclama({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const cifras = [
    ["días", String(c.d)],
    ["horas", dos(c.h)],
    ["minutos", dos(c.m)],
    ["segundos", dos(c.s)],
  ] as const;
  return (
    <div className="bl-proclama" data-vivo={c.vivo ? "1" : undefined}>
      <Anuncio c={c} />
      <p className="bl-edicto">
        <span className="bl-capitular" aria-hidden="true">P</span>
        <span className="sr-only">P</span>or la presente se proclama, a todos los presentes y por venir, que
        {c.vivo && c.estado === "falta" ? " faltan para el enlace:" : " el enlace se celebrará el día:"}
      </p>
      {c.vivo && c.estado === "falta" ? (
        <div className="bl-escudos" aria-hidden="true">
          {cifras.map(([k, v]) => (
            <div key={k} className="bl-escudo-cifra-caja">
              <svg key={v} viewBox="0 0 100 120" className={`bl-escudo-cifra${k === "días" ? " bl-dia" : ""}`}>
                <path d={ESCUDO} className="bl-escudo-campo" />
                <path d={ESCUDO} className="bl-escudo-filo" transform="translate(50 60) scale(.86) translate(-50 -60)" />
                <text x="50" y="60" className="bl-escudo-num">{v}</text>
              </svg>
              <p>{k}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="bl-proclama-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy nos casamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
        </p>
      )}
      <p className="bl-edicto-pie">Dado en el castillo, y firmado por los contrayentes.</p>
      <span className="bl-proclama-lacre" aria-hidden="true" />
    </div>
  );
}
