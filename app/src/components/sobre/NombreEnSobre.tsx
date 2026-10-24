"use client";

import { useEffect, useState } from "react";
import { cargarInvitado } from "@/components/bloques/invitado";

/**
 * «Para Carmen», escrito a mano en el sobre.
 *
 * La invitación es estática: el nombre llega en el navegador desde `?n=`
 * (`/api/invitado`, una sola petición compartida con el RSVP y la portada).
 * Sin enlace personal se escribe «Para ti». Mientras llega, nada: el nombre
 * se escribe cuando ya se sabe, nunca se corrige delante del invitado.
 *
 * La escritura es un velo `clip-path` de izquierda a derecha (`.sc-trazo`):
 * con letra de pluma se lee como tinta que corre. Sin JS no hay capa de
 * apertura, así que no hace falta un texto de reserva.
 */
export default function NombreEnSobre({
  slug,
  sinNombre = "Para ti",
  fijo,
}: {
  slug: string;
  /** Lo que se escribe si el enlace no es personal. */
  sinNombre?: string;
  /** Vista previa del panel: el nombre de ejemplo, sin pedir nada. */
  fijo?: string;
}) {
  const [texto, setTexto] = useState<string | null>(fijo ?? null);

  useEffect(() => {
    if (fijo !== undefined) return;
    let vivo = true;
    void cargarInvitado(slug).then((i) => {
      if (vivo) setTexto(i ? `Para ${i.nombre}` : sinNombre);
    });
    return () => {
      vivo = false;
    };
  }, [slug, sinNombre, fijo]);

  if (!texto) return null;
  return (
    <>
      <span key={texto} className="sc-trazo">
        {texto}
      </span>
      <style>{TRAZO}</style>
    </>
  );
}

const TRAZO = `
.sc-trazo {
  display: inline-block; padding-inline: .2em;
  animation: sc-trazo 1300ms cubic-bezier(.45,.05,.4,.95) 500ms both;
}
@keyframes sc-trazo {
  from { clip-path: inset(-20% 100% -30% 0); }
  to   { clip-path: inset(-20% -2% -30% 0); }
}
@media (prefers-reduced-motion: reduce) { .sc-trazo { animation: none; } }
`;
