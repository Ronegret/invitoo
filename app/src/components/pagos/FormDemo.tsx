"use client";

import { useActionState } from "react";
import { confirmarPlanDemo, type ResultadoDemo } from "@/lib/pagos/acciones-planes";
import BotonEnviar from "./BotonEnviar";
import { BOTON_PRINCIPAL } from "./estilos";

const CAMPO =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--tinta)]/20 bg-white/80 px-4 text-[1.0625rem] outline-none focus-visible:border-[var(--acento)] focus-visible:ring-2 focus-visible:ring-[var(--acento)]/30";
const ETIQUETA = "block text-[1rem] opacity-80";

/**
 * Lo mismo que pide Stripe Checkout (email, teléfono, los dos nombres y la
 * fecha), para probar en local sin claves. Va por `confirmarPlanDemo`, que
 * llama a la misma función que el webhook.
 */
export default function FormDemo({ plan, importe }: { plan: string; importe: string }) {
  const [r, enviar] = useActionState<ResultadoDemo, FormData>(confirmarPlanDemo, null);
  return (
    <form action={enviar} className="flex flex-col gap-5">
      <input type="hidden" name="plan" value={plan} />
      <label className={ETIQUETA}>
        Email
        <input name="email" type="email" required autoComplete="email" className={CAMPO} />
      </label>
      <label className={ETIQUETA}>
        Teléfono
        <input name="telefono" type="tel" autoComplete="tel" className={CAMPO} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={ETIQUETA}>
          Nombre de uno de los novios
          <input name="novioa" required minLength={2} maxLength={60} autoComplete="given-name" className={CAMPO} />
        </label>
        <label className={ETIQUETA}>
          Nombre del otro
          <input name="noviob" required minLength={2} maxLength={60} className={CAMPO} />
        </label>
      </div>
      <label className={ETIQUETA}>
        Fecha de la boda (si ya la tenéis)
        <input name="fecha" maxLength={40} placeholder="12/09/2027" className={CAMPO} />
      </label>
      {r?.error && (
        <p role="alert" className="text-[1.0625rem] text-[var(--acento)]">
          {r.error}
        </p>
      )}
      <BotonEnviar className={`${BOTON_PRINCIPAL} mt-2`} pendiente="Reservando…">
        Reservar por {importe} (demo)
      </BotonEnviar>
    </form>
  );
}
