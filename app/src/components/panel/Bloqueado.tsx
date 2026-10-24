"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { TEXTO_BLOQUEADO } from "@/lib/planes-boda";
import IconoPanel from "./IconosPanel";
import { ui } from "./estilos";

/**
 * Lo no contratado: en gris y con candado, pero a la vista y enfocable.
 * Al tocarlo se abre una vista previa de lo que obtendríais y «Contratar».
 *
 *   <Bloqueado titulo="En directo" precio={89} resumen="…" incluye={[…]}
 *     vista={<VistaPreviaDirecto />} contratar={<ContratarDirecto … />} />
 *
 * Accesibilidad: el botón se anuncia como «Bloqueado: no incluido en
 * vuestro plan» más el nombre; el diálogo es `<dialog>` nativo (atrapa el
 * foco, Escape lo cierra y devuelve el foco al botón).
 */
export default function Bloqueado({
  titulo,
  precio,
  unidad,
  resumen,
  incluye,
  vista,
  contratar,
  hrefContratar,
  compacto = false,
}: {
  titulo: string;
  precio: number;
  unidad?: string;
  resumen: string;
  incluye: string[];
  /** Cómo se vería: una maqueta estática, nunca datos reales. */
  vista?: ReactNode;
  /** El flujo de compra (p. ej. `ContratarDirecto` de H1). Si no, `hrefContratar`. */
  contratar?: ReactNode;
  hrefContratar?: string;
  /** Solo la fila (para listas); si no, tarjeta con vista previa difuminada. */
  compacto?: boolean;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const idTitulo = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  const precioTexto = `${precio.toLocaleString("es-ES")} €${unidad ? ` ${unidad}` : ""}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        aria-label={`${titulo}. ${TEXTO_BLOQUEADO}. Ver qué incluye`}
        className={`group relative w-full overflow-hidden rounded-2xl border border-dashed border-[#CFC9C2] bg-[#F2EFEB] text-left text-[#5E5650] transition-colors hover:border-[#A9A29A] ${ui.foco} ${compacto ? "flex min-h-14 items-center gap-3 px-4" : "p-5 sm:p-6"}`}
      >
        {compacto ? (
          <>
            <IconoPanel id="candado" className="shrink-0" />
            <span className="flex-1 font-medium">{titulo}</span>
            <span className="text-[0.88rem]">{precioTexto}</span>
          </>
        ) : (
          <>
            {vista && (
              <div aria-hidden="true" className="pointer-events-none mb-5 select-none overflow-hidden rounded-xl opacity-55 grayscale">
                {vista}
              </div>
            )}
            <span className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/80 text-[#4A433D] shadow-[var(--sombra-1,0_1px_2px_rgba(0,0,0,.06))]">
                <IconoPanel id="candado" size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[1.05rem] font-medium text-[#3E3833]">{titulo}</span>
                <span className="mt-1 block text-[0.95rem] leading-relaxed">{resumen}</span>
                <span className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#CFC9C2] bg-white px-4 text-[0.9rem] font-medium text-[#3E3833] group-hover:border-[#8C1D2C]/40">
                  Ver qué incluye · {precioTexto}
                </span>
              </span>
            </span>
          </>
        )}
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        onClose={() => setAbierto(false)}
        onClick={(e) => e.target === dialogo.current && setAbierto(false)}
        className="m-auto max-h-[min(92dvh,52rem)] w-[min(100vw-2rem,40rem)] overflow-y-auto overscroll-contain rounded-3xl border-0 bg-[var(--papel,#FAF8F5)] p-0 text-[var(--tinta,#1F1A17)] shadow-[var(--sombra-5,0_30px_80px_rgba(0,0,0,.25))] backdrop:bg-black/40"
      >
        {abierto && (
          <div className="p-5 sm:p-7">
            <div className={`flex items-start justify-between gap-4 ${contratar ? "float-right -mr-2 -mt-2 ml-2" : ""}`}>
              <div className="min-w-0">
                {/* Con flujo de compra propio, él pone el título y el candado. */}
                <p className={`${ui.eyebrow} flex items-center gap-2 ${contratar ? "sr-only" : ""}`}>
                  <IconoPanel id="candado" size={16} /> No incluido en vuestro plan
                </p>
                <h2 id={idTitulo} className={contratar ? "sr-only" : `${ui.h2} mt-2`}>{titulo}</h2>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-full hover:bg-black/[0.05] ${ui.foco}`}
              >
                <IconoPanel id="cerrar" />
              </button>
            </div>
            {contratar ? (
              // El flujo de compra trae su propia vista previa y lo que incluye.
              <div>{contratar}</div>
            ) : (
              <>
                <p className={`mt-3 ${ui.texto} ${ui.suave}`}>{resumen}</p>
                {vista && <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--linea)]">{vista}</div>}
                <ul className="mt-5 flex flex-col gap-2">
                  {incluye.map((x) => (
                    <li key={x} className="flex gap-3 text-[0.98rem]">
                      <IconoPanel id="check" size={20} className="mt-0.5 shrink-0 text-[var(--verde)]" />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--linea)] pt-5">
                  <Link href={hrefContratar ?? "#"} className={ui.botonLleno} onClick={() => setAbierto(false)}>
                    Contratar · {precioTexto}
                  </Link>
                  <span className={`text-[0.9rem] ${ui.suave}`}>IVA incluido. Lo activamos nosotros y os avisamos.</span>
                </div>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
