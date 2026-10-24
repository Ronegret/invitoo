"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { marcarAvisosLeidos } from "@/lib/avisos/acciones";
import type { Aviso, TipoAviso } from "@/lib/avisos/tipos";
import IconoPanel, { type IconoPanelId } from "./IconosPanel";
import { ui } from "./estilos";
import { hace } from "./util";

const ICONO: Record<TipoAviso, IconoPanelId> = {
  confirmacion: "check",
  cambio: "respuestas",
  deseo: "deseos",
  retirada: "alerta",
  solicitud: "cambio",
};

/**
 * La campana del panel: cuántos avisos nuevos y los últimos, en un
 * desplegable. Abrirla no marca nada; «Marcar todo como leído» sí. Sin JS,
 * «Avisos» sigue en la navegación.
 */
export default function Campana({
  slug,
  avisos,
  noLeidos,
  ahora,
  className = "",
}: {
  slug: string;
  avisos: Aviso[];
  noLeidos: number;
  ahora: number;
  className?: string;
}) {
  const [abierta, setAbierta] = useState(false);
  const [leidos, setLeidos] = useState(false);
  const [, empezar] = useTransition();
  const caja = useRef<HTMLDivElement>(null);
  const id = useId();
  const n = leidos ? 0 : noLeidos;

  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: PointerEvent) => !caja.current?.contains(e.target as Node) && setAbierta(false);
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierta(false);
        caja.current?.querySelector<HTMLElement>("[data-campana]")?.focus();
      }
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierta]);

  const texto = n === 0 ? "Avisos: nada nuevo" : n === 1 ? "Avisos: 1 nuevo" : `Avisos: ${n} nuevos`;

  return (
    <div ref={caja} className={`relative ${className}`}>
      <button
        type="button"
        data-campana
        aria-expanded={abierta}
        aria-controls={id}
        aria-label={texto}
        onClick={() => setAbierta((x) => !x)}
        className={`relative grid h-12 w-12 place-items-center rounded-full text-[var(--tinta)] transition-colors hover:bg-black/[0.04] ${ui.foco}`}
      >
        <IconoPanel id="campana" />
        {n > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 grid min-w-5 place-items-center rounded-full bg-[var(--acento)] px-1 text-[0.7rem] font-semibold leading-5 text-white ring-2 ring-[var(--papel)] tabular-nums"
          >
            {n > 9 ? "9+" : n}
          </span>
        )}
      </button>

      {abierta && (
        <div
          id={id}
          role="region"
          aria-label="Últimos avisos"
          className="fixed inset-x-3 top-[4.25rem] z-50 max-h-[min(70dvh,32rem)] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--linea)] bg-[var(--tarjeta)] shadow-[var(--sombra-3,0_18px_50px_rgba(0,0,0,.16))] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[3.5rem] sm:w-[24rem] lg:left-0 lg:right-auto"
        >
          <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-[var(--linea)] bg-[var(--tarjeta)] px-4 py-2">
            <p className="font-medium">Avisos</p>
            {n > 0 && (
              <button
                type="button"
                onClick={() =>
                  empezar(async () => {
                    setLeidos(true);
                    await marcarAvisosLeidos(slug);
                  })
                }
                className={`min-h-12 rounded-full px-3 text-[0.88rem] text-[var(--acento)] hover:bg-[var(--acento-claro)] ${ui.foco}`}
              >
                Marcar todo como leído
              </button>
            )}
          </div>
          {avisos.length === 0 ? (
            <p className={`px-4 py-8 text-center text-[0.95rem] ${ui.suave}`}>
              Aquí os contamos quién confirma, los deseos nuevos y lo que hagamos por vosotros.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--linea)]">
              {avisos.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.enlace ?? `/panel/${slug}/avisos`}
                    onClick={() => setAbierta(false)}
                    className={`flex gap-3 px-4 py-3 hover:bg-black/[0.025] ${ui.foco}`}
                  >
                    <IconoPanel id={ICONO[a.tipo]} size={20} className="mt-0.5 shrink-0 text-[var(--acento)]" />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[0.95rem] ${!a.leido && !leidos ? "font-medium" : ""}`}>
                        {!a.leido && !leidos && <span className="sr-only">Nuevo: </span>}
                        {a.titulo}
                      </span>
                      {a.detalle && <span className={`mt-0.5 line-clamp-2 block text-[0.88rem] ${ui.suave}`}>{a.detalle}</span>}
                      <span className={`mt-0.5 block text-[0.8rem] ${ui.suave}`}>{hace(a.creado, ahora)}</span>
                    </span>
                    {!a.leido && !leidos && <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--acento)]" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/panel/${slug}/avisos`}
            onClick={() => setAbierta(false)}
            className={`flex min-h-12 items-center justify-center border-t border-[var(--linea)] text-[0.92rem] ${ui.enlace}`}
          >
            Ver todos y elegir cómo os avisamos
          </Link>
        </div>
      )}
    </div>
  );
}
