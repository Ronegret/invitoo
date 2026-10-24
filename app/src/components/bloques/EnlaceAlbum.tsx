"use client";

import { useSyncExternalStore } from "react";
import { partesMadrid } from "@/lib/fecha";
import { leerToken } from "./invitado";

/**
 * El botón del bloque Álbum. La invitación es estática, así que lo que
 * depende del momento y del invitado se decide aquí, en el navegador:
 *
 *  · Con enlace personal (`?n=`), el botón lo lleva consigo: la página de
 *    subida lo reconoce como invitado y no le pide el QR de la mesa.
 *  · Antes del día de la boda se explica cuándo se abre. Sin JS (y en el
 *    HTML estático) se enseña esa explicación, que es lo normal.
 */
const nada = () => () => {};

function claveDia(fecha: string | Date) {
  const p = partesMadrid(fecha);
  return p.anio * 10_000 + p.mes * 100 + p.dia;
}

export default function EnlaceAlbum({
  slug,
  fecha,
  fechaTexto,
}: {
  slug: string;
  fecha: string;
  /** «sábado, 14 de junio de 2027», ya formateada en el servidor. */
  fechaTexto: string;
}) {
  const token = useSyncExternalStore(nada, leerToken, () => null);
  const antes = useSyncExternalStore(
    nada,
    () => claveDia(new Date()) < claveDia(fecha),
    () => true,
  );
  const href = `/i/${slug}/momentos${token ? `?n=${encodeURIComponent(token)}` : ""}`;

  return (
    <>
      <a
        href={href}
        className="album-cta group mt-10 inline-flex min-h-14 items-center gap-3 rounded-full border border-current/35 px-9 text-[1rem] uppercase tracking-[0.18em] text-[var(--acento-texto,var(--acento))] transition-[border-color,background-color] duration-300 hover:border-current/70 hover:bg-current/[0.04] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--acento-texto,var(--acento))]"
      >
        Compartid vuestras fotos
        <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </a>
      {antes && (
        <p className="mx-auto mt-5 max-w-[26rem] text-[1rem] leading-relaxed opacity-80">
          El álbum se abre el día de la boda, el {fechaTexto}, y seguirá abierto un año. Ese día también
          habrá un código QR en cada mesa.
        </p>
      )}
    </>
  );
}
