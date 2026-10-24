"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { entrar } from "@/app/estudio/acciones";
import SelloAlianzas from "@/components/SelloAlianzas";
import BotonGoogle from "@/app/cuenta/_google/BotonGoogle";

const AVISOS_GOOGLE: Record<string, string> = {
  "google-estudio": "Esa cuenta de Google no está en la lista del estudio.",
  "google-cancelado": "Has cerrado Google sin elegir cuenta.",
  "google-off": "Google no está disponible ahora. Entra con la clave.",
  google: "Google no ha podido confirmar la cuenta. Prueba otra vez.",
  "google-sin-verificar": "Esa cuenta de Google no tiene el email verificado.",
};

/** `google`: hay ESTUDIO_EMAILS y Supabase (o la demo local). */
export default function Entrar({ google = false }: { google?: boolean }) {
  const [error, enviar, pendiente] = useActionState<string | null, FormData>(
    entrar,
    null,
  );
  const q = useSearchParams();
  const volver = q.get("volver") ?? "/estudio";
  const errorGoogle = AVISOS_GOOGLE[q.get("error") ?? ""];

  return (
    <main className="grano relative grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-[20rem] text-center">
        <SelloAlianzas size={44} className="mx-auto opacity-70" />
        <h1 className="display mt-8 text-[1.9rem]">Estudio</h1>
        {errorGoogle && (
          <p role="alert" className="mt-4 text-[0.95rem] text-[var(--acento)]">
            {errorGoogle}
          </p>
        )}
        {google && (
          <div className="mt-8">
            <BotonGoogle para="estudio" siguiente={volver} texto="Entrar con Google" />
            <p aria-hidden="true" className="mt-6 text-[0.8rem] uppercase tracking-[0.18em] opacity-60">o con la clave</p>
          </div>
        )}
        <form action={enviar}>
          <input type="hidden" name="volver" value={volver} />

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
      </div>
    </main>
  );
}
