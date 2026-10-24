"use client";

import { useEffect, useRef } from "react";
import { manuscrita } from "./fuentes";

/**
 * Momento firma 5: «Con cariño, Laura y Rubén», escrito a mano al llegar al
 * pie de la invitación.
 *
 *   <FirmaManuscrita nombres="Laura y Rubén" />
 *   <FirmaManuscrita nombres="Laura y Rubén" prefijo="Os queremos," color="var(--acento-texto)" />
 *
 * La pluma corre de izquierda a derecha (un velo `clip-path`), línea a
 * línea: primero el «Con cariño,», luego los nombres. Una sola vez, cuando
 * la firma entra en pantalla.
 *
 * Sin JavaScript y con «menos movimiento» se ve escrita desde el principio:
 * la clase que la oculta solo la pone el efecto, y solo si va a animarse.
 * El texto es real (se lee y se copia); la letra, Pinyon Script.
 */
export function FirmaManuscrita({
  nombres,
  prefijo = "Con cariño,",
  color,
  className = "",
}: {
  /** «Laura y Rubén». */
  nombres: string;
  /** La línea de encima. `""` la quita. */
  prefijo?: string;
  /** Color de la tinta (CSS). Por defecto, la tinta de la boda. */
  color?: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let quieto = false;
    try {
      quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* noop */
    }
    if (quieto || typeof IntersectionObserver === "undefined") return;
    // Si ya está a la vista al hidratar (pantallas altas), se escribe igual.
    el.setAttribute("data-firma", "espera");
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          el.setAttribute("data-firma", "escribe");
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <p
      ref={ref}
      className={`firma-manuscrita ${manuscrita.variable} ${className}`}
      style={color ? ({ "--firma-tinta": color } as React.CSSProperties) : undefined}
      suppressHydrationWarning
    >
      {prefijo && <span className="firma-linea firma-linea-1">{prefijo}</span>}
      <span className={`firma-linea ${prefijo ? "firma-linea-2" : "firma-linea-1"}`}>{nombres}</span>
      <style>{CSS}</style>
    </p>
  );
}

export default FirmaManuscrita;

const CSS = `
.firma-manuscrita {
  margin: 0; text-align: center;
  font-family: var(--f-manuscrita), "Snell Roundhand", cursive;
  font-size: clamp(2.1rem, 8vw, 3.2rem); line-height: 1.15;
  color: var(--firma-tinta, var(--tinta, currentColor));
}
.firma-linea { display: block; padding-inline: .25em; }
.firma-linea-1 { font-size: .72em; opacity: .85; }
.firma-manuscrita[data-firma="espera"] .firma-linea { clip-path: inset(-25% 100% -35% 0); }
.firma-manuscrita[data-firma="escribe"] .firma-linea {
  animation: firma-escribe 1100ms cubic-bezier(.45,.05,.4,.95) both;
}
.firma-manuscrita[data-firma="escribe"] .firma-linea-2 { animation-duration: 1500ms; animation-delay: 900ms; }
@keyframes firma-escribe {
  from { clip-path: inset(-25% 100% -35% 0); }
  to   { clip-path: inset(-25% -3% -35% -3%); }
}
@media (prefers-reduced-motion: reduce) {
  .firma-manuscrita .firma-linea { clip-path: none !important; animation: none !important; }
}
`;
