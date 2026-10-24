"use client";

import { useEffect, useRef, useState } from "react";
import { observarConfirmacion, pulsar, ruido, vibrar, zumbido, LA_MENOR } from "./musicales";

/**
 * K4 · el RSVP de siempre, envuelto (sin tocarlo) con la recompensa de cada
 * tema musical. Al aparecer el sello de «sí» del RSVP:
 *  · el envoltorio pasa a `data-confirmado="1"` (`"recien"` si acaba de
 *    pasar): el CSS de cada plantilla hace el resto (el talón se arranca,
 *    el rótulo se enciende…);
 *  · la frase («¡Nos vemos en la pista, Carmen!») se escribe con el nombre;
 *  · si acaba de confirmar, suena ≤ 1 s y vibra (es un gesto: el «Enviar»).
 * `arriba` es una pieza decorativa del servidor (el talón, el rótulo).
 * Sin JS: el RSVP funciona igual y la pieza se queda en su estado de reposo.
 */
export default function MusicaRsvp({
  slug,
  efecto,
  frase,
  arriba,
  children,
}: {
  slug: string;
  efecto: "talon" | "vinilo" | "neon" | "fuego" | "bachata";
  /** Con «{n}» donde va «, Carmen» (o nada si no hay nombre). */
  frase: string;
  arriba?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"" | "1" | "recien">("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observarConfirmacion(el, slug, ({ recien, nombre }) => {
      setNombre(nombre);
      setEstado(recien ? "recien" : "1");
      if (!recien) return;
      if (efecto === "talon") { ruido(0.6, 0.22, "papel"); vibrar([12, 40, 12]); }
      else if (efecto === "neon") { zumbido(); vibrar([8, 60, 8]); }
      else if (efecto === "vinilo") { ruido(0.5, 0.18, "aguja"); pulsar(110, 0.22, 0.15); pulsar(164.81, 0.2, 0.18); vibrar(8); }
      else if (efecto === "fuego") { pulsar(1760, 0.08); pulsar(1760, 0.08, 0.25); vibrar([10, 30, 10]); }
      else { LA_MENOR.slice(0, 4).forEach((hz, i) => pulsar(hz, 0.22, i * 0.07)); vibrar([5, 40, 5, 40, 5]); }
    }, (n) => { if (n) setNombre(n); });
  }, [slug, efecto]);

  const texto = frase.replace("{n}", nombre ? `, ${nombre}` : "");
  return (
    <div ref={ref} className={`mr mr-${efecto}`} data-confirmado={estado || undefined}>
      {arriba}
      {estado && (
        <p className="mr-frase display" role="status">
          {texto}
        </p>
      )}
      {children}
    </div>
  );
}
