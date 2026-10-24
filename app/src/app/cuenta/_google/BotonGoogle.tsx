"use client";

import { useFormStatus } from "react-dom";
import { entrarConGoogle, entrarEstudioConGoogle } from "@/lib/auth/acciones-google";

/**
 * «Continuar con Google», según las pautas de marca de Google
 * (developers.google.com/identity/branding-guidelines):
 *   · tema claro: fondo #FFFFFF, borde 1 px #747775, texto #1F1F1F;
 *   · la «G» oficial a cuatro colores, sin tocar, sobre blanco;
 *   · relleno 12 px a la izquierda del logo, 10 px entre logo y texto;
 *   · el texto deja claro que se entra en Invitoo con la cuenta de Google.
 * Las pautas permiten escalar el botón entero: aquí mide 56 px de alto y el
 * texto 17 px (nuestro mínimo accesible), con la «G» proporcional.
 *
 * Es un formulario normal: funciona sin JavaScript. Con JS, mientras se va a
 * Google, dice «Abriendo Google…» y no se puede pulsar dos veces.
 */

export function LogoGoogle({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

function Interior({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="inline-flex min-h-14 w-full items-center justify-center gap-[10px] rounded-full border border-[#747775] bg-white pl-3 pr-4 text-[1.0625rem] font-medium text-[#1F1F1F] shadow-[0_1px_2px_rgba(31,26,23,.06)] transition-[background-color,box-shadow] hover:bg-[#F8F8F8] hover:shadow-[0_2px_6px_rgba(31,26,23,.10)] active:bg-[#F2F2F2] disabled:cursor-progress disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C1D2C]"
      style={{ fontFamily: '"Google Sans", Roboto, var(--font-sans, system-ui), Arial, sans-serif' }}
    >
      <LogoGoogle />
      <span>{pending ? "Abriendo Google…" : texto}</span>
    </button>
  );
}

export default function BotonGoogle({
  siguiente,
  para = "novios",
  texto = "Continuar con Google",
}: {
  siguiente: string;
  para?: "novios" | "estudio";
  texto?: string;
}) {
  return (
    <form action={para === "estudio" ? entrarEstudioConGoogle : entrarConGoogle} className="w-full">
      <input type="hidden" name="siguiente" value={siguiente} />
      <Interior texto={texto} />
    </form>
  );
}
