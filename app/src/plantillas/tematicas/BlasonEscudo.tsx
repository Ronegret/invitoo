"use client";

import { useState } from "react";
import { ESCUDO, EscudoArmas } from "./BlasonArmas";

/**
 * BLASÓN (K2) — el escudo de armas de la pareja.
 *
 * Partido: un mueble para cada uno (torre y flor de lis por defecto) y las
 * iniciales en el jefe. Al tocarlo gira y enseña el reverso con la divisa.
 * Es un botón de verdad (`aria-pressed`): el lector de pantalla oye la
 * divisa también sin girarlo. Con «menos movimiento» cambia sin giro.
 */
/** El escudo que gira al tocarlo y enseña la divisa. */
export default function BlasonEscudo({
  iniciales,
  nombres,
  divisa,
}: {
  iniciales: string;
  nombres: string;
  divisa: string;
}) {
  const [vuelta, setVuelta] = useState(false);
  return (
    <button
      type="button"
      className="bl-escudo-giro"
      data-vuelta={vuelta ? "1" : undefined}
      aria-pressed={vuelta}
      aria-label={`Escudo de ${nombres}. Divisa: ${divisa}`}
      onClick={() => setVuelta((v) => !v)}
    >
      <span className="bl-cara">
        <EscudoArmas iniciales={iniciales} id="blg" />
      </span>
      <span className="bl-reverso" aria-hidden="true">
        <svg viewBox="0 0 100 120">
          <path d={ESCUDO} className="bl-reverso-campo" />
        </svg>
        <span className="bl-divisa">
          <span className="bl-divisa-antes">Divisa</span>
          {divisa}
        </span>
      </span>
      <span className="bl-escudo-pista" aria-hidden="true">
        {vuelta ? "Tocad para volver" : "Tocad el escudo"}
      </span>
    </button>
  );
}
