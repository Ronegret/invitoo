import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SelloAlianzas from "@/components/SelloAlianzas";
import { TOKENS_PANEL, ui } from "@/components/panel/estilos";
import { LogoGoogle } from "@/app/cuenta/_google/BotonGoogle";
import { emailsDeEstudio } from "@/app/estudio/sesion";
import { elegirCuentaDemo } from "@/lib/auth/acciones-google";
import { cuentasDemo } from "@/lib/auth/cuenta";
import { destinoEstudio, destinoPanel } from "@/lib/auth/destino";
import { modoDemo } from "@/lib/datos";

export const metadata: Metadata = {
  title: "Elegid una cuenta · Modo demo",
  robots: { index: false, follow: false },
};

/**
 * Demo local (INVITOO_MEMORIA, sin Supabase): hace de «Elegid una cuenta» de
 * Google para probar el flujo entero en localhost:3100 sin credenciales.
 * Fuera de la demo, 404.
 */
export default async function GoogleDemo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!modoDemo()) notFound();
  const q = await searchParams;
  const estudio = q.para === "estudio";
  const siguiente = estudio ? destinoEstudio(q.siguiente) : destinoPanel(q.siguiente);
  const cuentas = estudio
    ? [
        ...emailsDeEstudio().map((email) => ({ email, nombre: "Estudio", boda: "En ESTUDIO_EMAILS" })),
        { email: "otra.cuenta@gmail.com", nombre: "Otra cuenta", boda: "No está en la lista" },
      ]
    : cuentasDemo().map((c) => ({ ...c, boda: c.boda ? `Boda de ${c.boda}` : "Sin boda" }));

  return (
    <main style={TOKENS_PANEL} className="grano flex min-h-dvh items-center justify-center bg-[var(--papel)] px-4 py-12 text-[var(--tinta)]">
      <div className="w-full max-w-[26rem]">
        <p className="mb-6 flex justify-center">
          <span className={`${ui.chip} min-h-8 bg-[var(--acento-claro)] px-3 text-[0.9rem] text-[var(--acento)]`}>
            Modo demo · sin Google de verdad
          </span>
        </p>

        <section className={`${ui.tarjeta} sm:p-8`} aria-labelledby="t-elegir">
          <div className="flex items-center gap-3">
            <LogoGoogle size={26} />
            <span aria-hidden="true" className={ui.suave}>·</span>
            <SelloAlianzas size={26} className="text-[var(--acento)]" />
          </div>
          <h1 id="t-elegir" className={`${ui.h1} mt-5`}>Elegid una cuenta</h1>
          <p className={`mt-2 text-[1.0625rem] ${ui.suave}`}>
            para continuar a {estudio ? "el estudio de Invitoo" : "Invitoo"}
          </p>

          <ul className="mt-6 flex flex-col divide-y divide-[var(--linea)] border-y border-[var(--linea)]">
            {cuentas.map((c) => (
              <li key={c.email}>
                <form action={elegirCuentaDemo}>
                  <input type="hidden" name="email" value={c.email} />
                  <input type="hidden" name="para" value={estudio ? "estudio" : "novios"} />
                  <input type="hidden" name="siguiente" value={siguiente} />
                  <button
                    type="submit"
                    className={`flex min-h-16 w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-[var(--acento-claro)]/60 ${ui.foco}`}
                  >
                    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--tinta)] text-[1rem] font-medium text-[var(--papel)]">
                      {c.nombre.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[1.0625rem] font-medium">{c.email}</span>
                      <span className={`block truncate text-[0.95rem] ${ui.suave}`}>{c.boda}</span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>

          <Link href={estudio ? "/entrar?error=google-cancelado" : `/cuenta/entrar?error=google-cancelado&siguiente=${encodeURIComponent(siguiente)}`} className={`${ui.boton} mt-6 w-full`}>
            Cancelar
          </Link>
        </section>
      </div>
    </main>
  );
}
