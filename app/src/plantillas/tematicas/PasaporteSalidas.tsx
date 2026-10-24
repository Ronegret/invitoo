"use client";

import { Anuncio, mayuscula, useCuenta } from "./cuenta";

/**
 * PASAPORTE (K2) — la cuenta atrás es un panel de salidas de paletas
 * (split-flap): cada dígito tiene dos mitades y la de arriba cae al
 * cambiar (la `key` es el dígito). Debajo, el sello del día: «FALTAN 120
 * DÍAS», que se estampa al llegar y a medianoche (su `key` son los días).
 *
 * Sin JS, la fecha. El lector de pantalla oye la frase de `Anuncio`, como
 * mucho cada minuto; el panel y el sello van `aria-hidden`.
 */
function Paleta({ v }: { v: string }) {
  return (
    <span className="ps-paleta">
      <span key={`${v}a`} className="ps-paleta-sup">{v}</span>
      <span className="ps-paleta-inf">{v}</span>
    </span>
  );
}

const dig = (n: number, w = 2) => String(n).padStart(w, "0").split("");

export default function PasaporteSalidas({ hasta, destino }: { hasta: string; destino: string }) {
  const c = useCuenta(hasta);
  const vivo = c.vivo && c.estado === "falta";
  const grupos: [string[], string][] = [
    [dig(c.d, c.d > 99 ? 3 : 2), "días"],
    [dig(c.h), "h"],
    [dig(c.m), "min"],
    [dig(c.s), "s"],
  ];
  return (
    <div className="ps-salidas" data-vivo={c.vivo ? "1" : undefined}>
      <Anuncio c={c} />
      <div className="ps-panel" aria-hidden={c.vivo ? "true" : undefined}>
        <div className="ps-panel-cab" aria-hidden="true">
          <span>Salidas</span>
          <span>Departures</span>
        </div>
        <div className="ps-panel-fila" aria-hidden="true">
          <span className="ps-panel-vuelo">BODA</span>
          <span className="ps-panel-destino">{destino.toUpperCase()}</span>
          <span className="ps-panel-estado">{vivo ? "EN HORA" : "EMBARCANDO"}</span>
        </div>
        {vivo ? (
          <div className="ps-paletas" aria-hidden="true">
            {grupos.map(([ds, u]) => (
              <span key={u} className="ps-grupo">
                <span className="ps-digitos">
                  {ds.map((x, i) => (
                    <Paleta key={i} v={x} />
                  ))}
                </span>
                <span className="ps-unidad">{u}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="ps-panel-fecha">
            {c.estado === "hoy" ? "Hoy nos casamos" : c.estado === "paso" ? "Ya nos casamos. Gracias por estar" : mayuscula(c.fecha)}
          </p>
        )}
      </div>
      {vivo && (
        <svg key={c.d} viewBox="0 0 120 120" className="ps-sello-dia" aria-hidden="true">
          <circle cx="60" cy="60" r="54" />
          <circle cx="60" cy="60" r="45" />
          <path d="M22 60 H32 M88 60 H98" />
          <text x="60" y="50">FALTAN</text>
          <text x="60" y="72" className="ps-sello-num">{c.d} {c.d === 1 ? "DÍA" : "DÍAS"}</text>
          <text x="60" y="88" className="ps-sello-mini">ENTRADA · ENTRY</text>
        </svg>
      )}
    </div>
  );
}
