"use client";

import { useRef } from "react";
import { ProbadorColor } from "@/components/color";

/**
 * Banco de pruebas del modo compacto tal como lo usará la web (F3): la
 * invitación a pantalla completa en un iframe y la hoja inferior que le
 * manda los colores por postMessage. El iframe se encoge con
 * `--hoja-color` (la altura de la hoja abierta): nada queda tapado.
 */
export default function VistaMovil({ slug, plantilla }: { slug: string; plantilla: string }) {
  const marco = useRef<HTMLIFrameElement>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "0.75rem",
          padding: "0.5rem max(1rem, env(safe-area-inset-right)) 0.5rem max(1rem, env(safe-area-inset-left))",
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
          background: "#12100e",
          color: "#faf8f5",
        }}
      >
        <ProbadorColor slug={slug} plantilla={plantilla} modo="compacto" destino={marco} />
      </div>
      <iframe
        ref={marco}
        src={`/i/${slug}?vista=1`}
        title="Invitación de muestra"
        style={{
          flex: "1 1 auto",
          width: "100%",
          border: 0,
          marginBottom: "var(--hoja-color, 0px)",
          transition: "margin-bottom 320ms cubic-bezier(.22,.7,.2,1)",
        }}
      />
    </div>
  );
}
