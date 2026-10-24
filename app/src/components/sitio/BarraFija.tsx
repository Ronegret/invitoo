"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const nada = () => () => {};
import { enlaceReserva } from "@/lib/contacto";

/**
 * La barra fija de la home.
 *
 * El motivo es medible: la página tiene más de doce mil píxeles y la llamada
 * a la acción solo estaba arriba del todo y abajo del todo. Quien se queda a
 * mitad —mirando plantillas o precios, que es justo donde se decide— no
 * tiene nada que pulsar sin volver al principio.
 *
 * chungdoi.com resuelve lo mismo con una barra inferior tipo app, y es de lo
 * poco que les copio tal cual.
 *
 * Aparece pasada la portada, no antes: encima de una fotografía a pantalla
 * completa sobraría y estropearía justo el momento que tiene que emocionar.
 * Y se puede cerrar: quien no la quiere no la vuelve a ver en esa sesión.
 */
export default function BarraFija({
  resumen,
  corto,
}: {
  /** «8 plantillas · desde 149 € · lista en 5 días». Lo calcula el layout. */
  resumen: string;
  /** La versión para pantallas estrechas. */
  corto: string;
}) {
  const [visible, setVisible] = useState(false);
  const [cerradaAhora, setCerrada] = useState(false);
  // Si ya la cerró en esta sesión, no vuelve. Se lee sin efecto: en el
  // servidor no hay sessionStorage y cuenta como abierta.
  const cerradaAntes = useSyncExternalStore(
    nada,
    () => {
      try {
        return sessionStorage.getItem("invitoo:barra") === "0";
      } catch {
        return false; // modo privado: se ve
      }
    },
    () => false,
  );
  const cerrada = cerradaAhora || cerradaAntes;

  useEffect(() => {
    const mirar = () => {
      // Pasada la portada y antes del cierre, donde ya hay botones propios y
      // esto sería ruido. El margen de abajo es proporcional: /precios es
      // mucho más corta que la home y con un umbral fijo no aparecería nunca.
      const y = window.scrollY;
      const alto = document.body.scrollHeight;
      const fin = alto - window.innerHeight * 1.5;
      setVisible(y > window.innerHeight * 0.65 && y < fin);
    };
    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    return () => window.removeEventListener("scroll", mirar);
  }, []);

  function cerrar() {
    setCerrada(true);
    try {
      sessionStorage.setItem("invitoo:barra", "0");
    } catch {
      /* noop */
    }
  }

  if (cerrada) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(140%)",
        transition:
          "opacity 420ms ease, transform 520ms cubic-bezier(.22,.7,.28,1)",
      }}
    >
      <div className="pointer-events-auto flex w-full max-w-[32rem] items-center gap-3 rounded-full border border-white/12 bg-[#191411]/94 py-2.5 pl-5 pr-2 text-[var(--papel)] shadow-[0_18px_44px_-18px_rgba(0,0,0,.65)] backdrop-blur-md">
        <p className="min-w-0 flex-1 text-[1rem] leading-tight">
          <span className="hidden sm:inline">{resumen}</span>
          <span className="sm:hidden">{corto}</span>
        </p>
        <Link
          href="/plantillas"
          className="hidden min-h-12 shrink-0 items-center rounded-full px-4 text-[1rem] opacity-75 transition-opacity hover:opacity-100 sm:inline-flex"
        >
          Plantillas
        </Link>
        <a
          href={enlaceReserva()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-[var(--papel)] px-5 text-[1rem] text-[#191411] transition-transform duration-200 hover:scale-[1.02]"
        >
          Hablamos
        </a>
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[1.1rem] leading-none opacity-45 transition-opacity hover:opacity-90"
        >
          ×
        </button>
      </div>
    </div>
  );
}
