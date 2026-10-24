"use client";

import { useActionState } from "react";
import type { Resultado } from "@/app/panel/tipos";
import { cambiarSolicitudAccion } from "@/lib/solicitudes/acciones";

const BOTON =
  "inline-flex min-h-11 items-center rounded-full border border-[var(--tinta)]/25 px-4 text-[0.78rem] uppercase tracking-[0.14em] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)]";

/** Mover una solicitud de estado y, si hace falta, contestar. «Hecha» avisa a la pareja. */
export default function FormEstado({ id, estado, respuesta }: { id: string; estado: string; respuesta: string | null }) {
  const [r, enviar, pendiente] = useActionState<Resultado, FormData>(cambiarSolicitudAccion, null);
  return (
    <form action={enviar} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="text-[0.8rem] opacity-70" htmlFor={`r-${id}`}>Respuesta para la pareja (opcional)</label>
      <textarea
        id={`r-${id}`}
        name="respuesta"
        rows={2}
        maxLength={1000}
        defaultValue={respuesta ?? ""}
        className="w-full rounded-xl border border-[var(--tinta)]/20 bg-white/70 p-3 text-[0.95rem]"
      />
      <div className="flex flex-wrap gap-2">
        {estado !== "en_curso" && estado !== "hecha" && (
          <button type="submit" name="estado" value="en_curso" disabled={pendiente} className={BOTON}>
            En curso
          </button>
        )}
        {estado !== "hecha" ? (
          <button type="submit" name="estado" value="hecha" disabled={pendiente} className={`${BOTON} border-transparent bg-[var(--tinta)] text-[var(--papel)]`}>
            Hecha · avisar
          </button>
        ) : (
          <button type="submit" name="estado" value="en_curso" disabled={pendiente} className={BOTON}>
            Reabrir
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="text-[0.9rem] empty:hidden">{r?.mensaje}</p>
    </form>
  );
}
