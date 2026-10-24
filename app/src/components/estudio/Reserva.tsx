"use client";

import { useState, useTransition } from "react";
import { moverPedidoAccion, vincularPedidoAccion } from "@/lib/pagos/acciones-estudio";
import type { EstadoPedido } from "@/lib/pagos/pedidos";
import type { BodaOpcion } from "./Cobrar";

const BOTON =
  "inline-flex min-h-11 items-center rounded-full border border-[var(--tinta)]/25 px-4 text-[0.78rem] uppercase tracking-[0.14em] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)]";

/** Una reserva pagada en la bandeja: moverla de estado y vincularla a su boda. */
export default function Reserva({
  id,
  estado,
  vinculada,
  bodas,
}: {
  id: string;
  estado: EstadoPedido;
  vinculada: boolean;
  bodas: BodaOpcion[];
}) {
  const [boda, setBoda] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, empezar] = useTransition();
  const mover = (e: EstadoPedido) => empezar(async () => setAviso((await moverPedidoAccion(id, e)).mensaje));

  return (
    <div className="mt-4 flex flex-col gap-3">
      {!vinculada && bodas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`b-${id}`}>Boda de esta reserva</label>
          <select
            id={`b-${id}`}
            value={boda}
            onChange={(e) => setBoda(e.target.value)}
            className="min-h-11 rounded-full border border-[var(--tinta)]/20 bg-white/70 px-4 text-[0.95rem]"
          >
            <option value="">Vincular a una boda…</option>
            {bodas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!boda || ocupado}
            className={BOTON}
            onClick={() => empezar(async () => setAviso((await vincularPedidoAccion(id, boda)).mensaje))}
          >
            Vincular
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {estado === "nueva" && (
          <button type="button" disabled={ocupado} className={BOTON} onClick={() => mover("en_curso")}>
            En curso
          </button>
        )}
        {estado !== "hecha" ? (
          <button type="button" disabled={ocupado} className={`${BOTON} border-transparent bg-[var(--tinta)] text-[var(--papel)]`} onClick={() => mover("hecha")}>
            Hecha
          </button>
        ) : (
          <button type="button" disabled={ocupado} className={BOTON} onClick={() => mover("en_curso")}>
            Reabrir
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="text-[0.9rem] empty:hidden">{aviso}</p>
    </div>
  );
}
