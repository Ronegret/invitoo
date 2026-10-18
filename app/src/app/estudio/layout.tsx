import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Caducidad from "@/components/estudio/Caducidad";
import SelloAlianzas from "@/components/SelloAlianzas";
import { salir } from "./acciones";
import { claveConfigurada, sesionValida } from "./sesion";

export const metadata: Metadata = {
  title: "Estudio · Invitoo",
  robots: { index: false, follow: false },
};

// El panel lee borradores: nunca se cachea ni se pre-renderiza.
export const dynamic = "force-dynamic";

/**
 * La puerta real está en `src/proxy.ts`, que corta ANTES de que se renderice
 * nada. Lo de aquí es una segunda barrera por si algún día se toca el
 * matcher: no se confía en una sola comprobación para algo que enseña
 * borradores y enlaces privados.
 */
export default async function EstudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!claveConfigurada()) {
    return (
      <Aviso titulo="Falta configurar el estudio">
        Pon <code>ESTUDIO_CLAVE</code> en <code>.env.local</code> y reinicia.
        Mira <code>.env.example</code>.
      </Aviso>
    );
  }

  if (!(await sesionValida())) redirect("/entrar");

  return (
    <div className="grano relative min-h-dvh">
      <Caducidad salir={salir} />
      <header className="flex items-center justify-between gap-4 border-b border-[var(--tinta)]/12 px-5 py-4">
        <Link href="/estudio" className="flex items-center gap-3">
          <SelloAlianzas size={26} className="opacity-70" />
          <span className="text-[0.78rem] uppercase tracking-[0.28em] opacity-60">
            Estudio
          </span>
        </Link>
        <form action={salir}>
          <button
            type="submit"
            className="min-h-11 px-3 text-[0.79rem] uppercase tracking-[0.2em] opacity-55"
          >
            Salir
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}

function Aviso({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-[28rem] text-center">
        <h1 className="display text-[2rem]">{titulo}</h1>
        <p className="mt-5 text-[1rem] leading-relaxed opacity-70">{children}</p>
      </div>
    </main>
  );
}
