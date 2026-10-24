import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SelloAlianzas from "@/components/SelloAlianzas";
import { TOKENS_PANEL, ui } from "@/components/panel/estilos";
import { sesionValida } from "@/app/estudio/sesion";
import { salir } from "@/lib/auth/acciones";
import { usuarioActual } from "@/lib/auth/acceso";
import { tokensGuardados } from "@/lib/auth/enlace";
import { bodasDeCuenta, invitacionPorToken, vincularMiembro, type BodaDeCuenta } from "@/lib/datos";
import { formatearFecha } from "@/lib/fecha";

export const metadata: Metadata = {
  title: "Vuestras bodas · Invitoo",
  robots: { index: false, follow: false },
};

/**
 * `/panel`: a qué boda vais. Casi siempre es una sola y se salta esta
 * pantalla; la ve quien lleva varias (un planner, la hermana que ayuda).
 */
export default async function PanelInicio() {
  const [usuario, tokens, estudio] = await Promise.all([usuarioActual(), tokensGuardados(), sesionValida()]);

  if (usuario?.email) await vincularMiembro(usuario.id, usuario.email);
  const [deCuenta, deEnlace] = await Promise.all([
    usuario ? bodasDeCuenta(usuario.id, usuario.email) : Promise.resolve([] as BodaDeCuenta[]),
    Promise.all(tokens.map((t) => invitacionPorToken(t))),
  ]);

  const bodas = new Map<string, { slug: string; pareja: string; fecha: string }>();
  for (const b of deCuenta) bodas.set(b.slug, b);
  for (const inv of deEnlace) {
    if (inv) bodas.set(inv.slug, { slug: inv.slug, pareja: `${inv.pareja.a} y ${inv.pareja.b}`, fecha: inv.pareja.fecha });
  }
  const lista = [...bodas.values()];

  if (lista.length === 1 && !estudio) redirect(`/panel/${lista[0].slug}`);
  if (lista.length === 0 && !estudio) redirect("/cuenta/entrar?error=acceso");

  return (
    <main style={TOKENS_PANEL} className="grano min-h-dvh bg-[var(--papel)] px-4 py-12 text-[var(--tinta)]">
      <div className="mx-auto max-w-[32rem]">
        <SelloAlianzas size={34} className="text-[var(--acento)]" />
        <h1 className={`${ui.h1} mt-5`}>Vuestras bodas</h1>
        {lista.length === 0 ? (
          <p className={`mt-4 ${ui.texto} ${ui.suave}`}>
            Estáis en el estudio. Abrid el panel de una boda desde{" "}
            <Link href="/estudio" className={ui.enlace}>la lista del estudio</Link>.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {lista.map((b) => (
              <li key={b.slug}>
                <Link href={`/panel/${b.slug}`} className={`${ui.tarjeta} flex min-h-16 items-center justify-between gap-4 hover:border-[var(--acento)]/40 ${ui.foco}`}>
                  <span>
                    <span className="display block text-[1.3rem]">{b.pareja}</span>
                    <span className={`text-[0.92rem] ${ui.suave}`}>{formatearFecha(b.fecha)}</span>
                  </span>
                  <span aria-hidden="true" className="text-[var(--acento)]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <form action={salir} className="mt-10">
          <button type="submit" className={ui.boton}>Salir</button>
        </form>
      </div>
    </main>
  );
}
