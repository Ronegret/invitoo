import type { Metadata } from "next";
import Link from "next/link";
import SelloAlianzas from "@/components/SelloAlianzas";
import { TOKENS_PANEL, ui } from "@/components/panel/estilos";
import BotonGoogle from "@/app/cuenta/_google/BotonGoogle";
import { emailSinBoda } from "@/lib/auth/cuenta";
import { destinoPanel } from "@/lib/auth/destino";
import { hayAuth } from "@/lib/auth/supabase";
import { enlaceWhatsApp } from "@/lib/contacto";
import { modoDemo } from "@/lib/datos";

export const metadata: Metadata = {
  title: "Esta cuenta no tiene boda · Invitoo",
  robots: { index: false, follow: false },
};

/**
 * Se llega aquí tras entrar con Google con una cuenta verificada que no está
 * en ninguna boda. La sesión ya se ha cerrado; el email sale de una cookie de
 * diez minutos (solo para mostrarlo).
 */
export default async function SinBoda({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const siguiente = destinoPanel(q.siguiente);
  const email = await emailSinBoda();
  const cuenta = email ? `Esta cuenta de Google (${email})` : "Esta cuenta de Google";
  const whatsapp = enlaceWhatsApp(
    `Hola, Invitoo. Intento entrar en el panel de nuestra boda${email ? ` con ${email}` : ""} y me dice que no está asociada. ¿Nos ayudáis?`,
  );
  const hayCodigo = hayAuth();

  return (
    <main style={TOKENS_PANEL} className="grano flex min-h-dvh items-center justify-center bg-[var(--papel)] px-4 py-12 text-[var(--tinta)]">
      <div className="w-full max-w-[26rem]">
        <Link href="/" className={`mx-auto mb-8 flex min-h-11 w-fit items-center gap-3 rounded-full px-2 ${ui.foco}`}>
          <SelloAlianzas size={34} className="text-[var(--acento)]" />
          <span className="display text-[1.5rem]">Invitoo</span>
        </Link>

        <section className={`${ui.tarjeta} sm:p-8`} aria-labelledby="t-sin-boda">
          <p className={ui.eyebrow}>Casi</p>
          <h1 id="t-sin-boda" className={`${ui.h1} mt-2`}>No encontramos vuestra boda</h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed">
            <strong className="font-medium break-words">{cuenta}</strong> no está asociada a ninguna boda.
            ¿Entrasteis con otra?
          </p>
          <p className={`mt-3 text-[1.0625rem] leading-relaxed ${ui.suave}`}>
            Suele ser el Gmail del trabajo o el de vuestra pareja. Si la boda está a nombre de la otra persona,
            pedidle que os invite desde <em>Cuenta</em> en el panel y entraréis con el vuestro.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <BotonGoogle siguiente={siguiente} texto="Probar con otra cuenta de Google" />
            {hayCodigo && (
              <Link href={`/cuenta/entrar?siguiente=${encodeURIComponent(siguiente)}#email`} className={`${ui.boton} min-h-14 w-full text-[1.0625rem]`}>
                Recibir un código por email
              </Link>
            )}
            <a href={whatsapp} target="_blank" rel="noopener" className={`${ui.boton} min-h-14 w-full text-[1.0625rem]`}>
              Escribidnos por WhatsApp
            </a>
          </div>

          {modoDemo() && (
            <p className={`mt-6 text-center text-[1rem] ${ui.suave}`}>
              <span className={`${ui.chip} mr-1.5 bg-[var(--acento-claro)] text-[var(--acento)]`}>Modo demo</span>
              esta cuenta de prueba no tiene boda a propósito.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
