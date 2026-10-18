"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WHATSAPP } from "@/lib/contacto";

/**
 * La barra de las invitaciones de muestra.
 *
 * Una muestra que no se puede contratar no vende nada. Quien llega aquí desde
 * la galería está a un toque de decir «quiero ésta», y ese toque tiene que
 * estar a mano en todo momento, no al final del scroll.
 *
 * Aparece cuando el visitante ya ha visto algo (400 px de scroll) para no
 * pisar la apertura, que es justo el momento que tiene que emocionar. Se
 * puede cerrar, y una vez cerrada no vuelve.
 */
export default function BarraDemo({
  plantilla,
  nombre,
  variantes = [],
  activa,
  slug,
}: {
  plantilla: string;
  nombre: string;
  variantes?: { id: string; nombre: string; acento: string; papel: string }[];
  activa?: string;
  slug?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [cerrada, setCerrada] = useState(false);

  useEffect(() => {
    const mirar = () => setVisible(window.scrollY > 400);
    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    return () => window.removeEventListener("scroll", mirar);
  }, []);

  if (cerrada) return null;

  const mensaje = encodeURIComponent(
    `Hola, he visto la plantilla «${nombre}» en invitoo.es y la quiero para nuestra boda.`,
  );

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(120%)",
        transition: "opacity 420ms ease, transform 520ms cubic-bezier(.22,.7,.28,1)",
      }}
    >
      <div className="pointer-events-auto flex w-full max-w-[34rem] items-center gap-2.5 rounded-full border border-white/15 bg-[#12100e]/92 py-2.5 pl-4 pr-2 sm:gap-3 sm:pl-5 sm:pr-2.5 text-[var(--papel)] shadow-[0_18px_40px_-16px_rgba(0,0,0,.6)] backdrop-blur-md">
        <div className="min-w-0 flex-1">
          {/* A 390 px la etiqueta y el nombre no caben en dos líneas sin
              apelotonarse: se deja solo el nombre y se recupera el contexto
              a partir de 380 px. */}
          <p className="hidden text-[0.75rem] uppercase tracking-[0.24em] opacity-55 min-[380px]:block">
            Plantilla de muestra
          </p>
          <p className="display truncate text-[1.05rem] leading-tight sm:text-[1.15rem]">
            {nombre}
          </p>
        </div>

        {/* Los colores de la familia, ahí mismo. Es lo que hace que un
            catálogo de doce diseños se sienta de treinta y seis, y sobre
            todo lo que deja a la pareja probar en vez de imaginar. */}
        {variantes.length > 1 && slug && (
          <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label="Color de la plantilla">
            {variantes.map((v) => (
              <a
                key={v.id}
                href={`/i/${slug}?c=${v.id}`}
                aria-label={`Verla en ${v.nombre}`}
                aria-current={v.id === activa ? "true" : undefined}
                title={v.nombre}
                className="grid h-11 w-8 place-items-center"
              >
                <span
                  className="block h-6 w-6 rounded-full border-2 transition-transform duration-300 hover:scale-110"
                  style={{
                    background: v.acento,
                    borderColor: v.id === activa ? "var(--papel)" : "transparent",
                  }}
                />
              </a>
            ))}
          </div>
        )}

        <Link
          href="/plantillas"
          className="hidden min-h-11 shrink-0 items-center rounded-full px-3 py-2 text-[0.78rem] uppercase tracking-[0.16em] opacity-65 transition-opacity hover:opacity-100 sm:block"
        >
          Otras
        </Link>

        <a
          href={`https://wa.me/${WHATSAPP}?text=${mensaje}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-[var(--papel)] px-4 py-3.5 min-h-11 text-[0.76rem] uppercase tracking-[0.14em] text-[#12100e] transition-transform hover:scale-[1.03] sm:px-5 sm:text-[0.78rem]"
        >
          Quiero ésta
        </a>

        <button
          type="button"
          onClick={() => setCerrada(true)}
          aria-label="Cerrar"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[1.1rem] leading-none opacity-45 transition-opacity hover:opacity-90"
        >
          ×
        </button>
      </div>
    </div>
  );
}
