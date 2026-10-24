"use client";

import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * MEMORIAS (K2) — la cuenta atrás es una hoja en el rodillo de una máquina
 * de escribir: «Faltan 120 días, 04 horas, 12 minutos y 33 segundos.»
 *
 * Cada cifra que cambia SE TECLEA (la `key` es el valor): entra con un
 * golpe de tipo y la tinta se oscurece. El carro se desplaza 2 px a cada
 * segundo, que es el único movimiento continuo. Sin JS, la fecha; el
 * lector de pantalla oye la frase de `Anuncio`, como mucho cada minuto.
 */
function Tecla({ v }: { v: string }) {
  return (
    <b key={v} className="me-tecla tabular-nums">
      {v}
    </b>
  );
}

export default function MemoriasMaquina({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const vivo = c.vivo && c.estado === "falta";
  return (
    <div className="me-maquina" data-vivo={c.vivo ? "1" : undefined}>
      <Anuncio c={c} />
      <div className="me-hoja-caja">
        <div className="me-hoja" style={{ "--carro": vivo ? c.s % 2 : 0 } as React.CSSProperties}>
          <p className="me-hoja-cab" aria-hidden="true">— Nota a máquina —</p>
          {vivo ? (
            <p className="me-hoja-texto" aria-hidden="true">
              Faltan <Tecla key={`d${c.d}`} v={String(c.d)} /> días, <Tecla key={`h${c.h}`} v={dos(c.h)} /> horas,{" "}
              <Tecla key={`m${c.m}`} v={dos(c.m)} /> minutos y <Tecla key={`s${c.s}`} v={dos(c.s)} /> segundos.
            </p>
          ) : (
            <p className="me-hoja-texto" aria-hidden={c.vivo ? "true" : undefined}>
              {c.estado === "hoy" ? "Hoy nos casamos." : c.estado === "paso" ? "Ya nos casamos. Gracias por estar." : `${mayuscula(c.fecha)}.`}
            </p>
          )}
          <p className="me-hoja-firma" aria-hidden="true">con amor</p>
        </div>
      </div>
      <svg className="me-maquina-svg" viewBox="0 0 320 120" aria-hidden="true">
        <rect x="14" y="8" width="292" height="22" rx="11" className="me-rodillo" />
        <rect x="4" y="12" width="14" height="14" rx="4" className="me-pomo" />
        <rect x="302" y="12" width="14" height="14" rx="4" className="me-pomo" />
        <path d="M30 34 H290 L304 112 H16 Z" className="me-cuerpo" />
        <path d="M60 52 H260" className="me-guia" />
        {Array.from({ length: 3 }, (_, f) =>
          Array.from({ length: 10 - f }, (_, k) => (
            <circle key={`${f}-${k}`} cx={70 + f * 10 + k * 20} cy={70 + f * 14} r="6" className="me-tecla-svg" />
          )),
        )}
      </svg>
    </div>
  );
}
