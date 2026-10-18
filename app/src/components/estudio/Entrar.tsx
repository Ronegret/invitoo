"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { entrar } from "@/app/estudio/acciones";
import SelloAlianzas from "@/components/SelloAlianzas";

export default function Entrar() {
  const [error, enviar, pendiente] = useActionState<string | null, FormData>(
    entrar,
    null,
  );
  const volver = useSearchParams().get("volver") ?? "/estudio";

  return (
    <main className="grano relative grid min-h-dvh place-items-center px-6">
      <form action={enviar} className="w-full max-w-[20rem] text-center">
        <input type="hidden" name="volver" value={volver} />
        <SelloAlianzas size={44} className="mx-auto opacity-70" />
        <h1 className="display mt-8 text-[1.9rem]">Estudio</h1>

        <input
          type="password"
          name="clave"
          required
          autoFocus
          autoComplete="current-password"
          aria-label="Clave"
          className="mt-9 w-full border-b border-[var(--tinta)]/25 bg-transparent py-3 text-center text-[1.05rem] outline-none focus:border-[var(--acento)]"
        />

        {error && (
          <p role="alert" className="mt-4 text-[0.92rem] text-[var(--acento)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pendiente}
          className="mt-8 min-h-13 w-full rounded-full bg-[var(--tinta)] py-3.5 text-[0.8rem] uppercase tracking-[0.18em] text-[var(--papel)] disabled:opacity-55"
        >
          {pendiente ? "…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
