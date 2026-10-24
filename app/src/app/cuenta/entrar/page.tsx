import type { Metadata } from "next";
import Link from "next/link";
import SelloAlianzas from "@/components/SelloAlianzas";
import EntrarCuenta from "@/components/panel/EntrarCuenta";
import { TOKENS_PANEL, ui } from "@/components/panel/estilos";
import BotonGoogle from "@/app/cuenta/_google/BotonGoogle";
import { entrarDemo } from "@/lib/auth/acciones";
import { destinoPanel } from "@/lib/auth/destino";
import { hayAuth } from "@/lib/auth/supabase";
import { modoDemo } from "@/lib/datos";

export const metadata: Metadata = {
  title: "Entrar · Invitoo",
  robots: { index: false, follow: false },
};

const AVISOS: Record<string, string> = {
  enlace: "Ese enlace ya no vale (caducan en una hora y solo sirven una vez). Pedid un código nuevo aquí abajo.",
  privado: "Ese enlace privado ya no funciona. Pedid uno nuevo al estudio o entrad con vuestro email.",
  acceso: "No encontramos acceso a esa boda con esta cuenta. Entrad con el email con el que os invitaron o con vuestro enlace privado.",
  "google-cancelado": "Habéis cerrado la ventana de Google sin elegir cuenta. Cuando queráis, probad otra vez o pedid un código por email.",
  "google-off": "Ahora mismo no podemos abrir Google. Entrad con un código por email: llega en un minuto.",
  google: "Google no ha podido confirmar la cuenta. Probad otra vez desde este mismo navegador o pedid un código por email.",
  "google-sin-verificar": "Esa cuenta no tiene el email verificado, así que no podemos saber de quién es. Entrad con un código por email.",
};

export default async function PaginaEntrarCuenta({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  // `siguiente` (Google y enlaces nuevos) o `volver` (el proxy y los antiguos).
  const volver = destinoPanel(q.siguiente ?? q.volver);
  const error = typeof q.error === "string" ? AVISOS[q.error] : undefined;
  const salida = q.salida === "1";
  const demo = modoDemo();

  return (
    <main style={TOKENS_PANEL} className="grano flex min-h-dvh items-center justify-center bg-[var(--papel)] px-4 py-12 text-[var(--tinta)]">
      <div className="w-full max-w-[26rem]">
        <Link href="/" className={`mx-auto mb-8 flex min-h-11 w-fit items-center gap-3 rounded-full px-2 ${ui.foco}`}>
          <SelloAlianzas size={34} className="text-[var(--acento)]" />
          <span className="display text-[1.5rem]">Invitoo</span>
        </Link>

        <section className={`${ui.tarjeta} sm:p-8`} aria-labelledby="titulo-entrar">
          <p className={ui.eyebrow}>Vuestra boda</p>
          <h1 id="titulo-entrar" className={`${ui.h1} mt-2`}>Entrar</h1>
          <p className={`mt-3 ${ui.texto} ${ui.suave}`}>
            Aquí veis quién viene, vuestros buenos deseos y todo lo del gran día.
          </p>

          {salida && (
            <p role="status" className="mt-5 rounded-xl bg-[var(--verde-claro)] p-4 text-[0.95rem] text-[var(--verde)]">
              Habéis salido. Hasta pronto.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-5 rounded-xl bg-[var(--acento-claro)] p-4 text-[0.95rem] text-[var(--acento)]">
              {error}
            </p>
          )}

          {(hayAuth() || demo) && (
            <div className="mt-7">
              <BotonGoogle siguiente={volver} />
              {demo && !hayAuth() ? (
                <p className={`mt-3 text-center text-[1rem] ${ui.suave}`}>
                  <span className={`${ui.chip} mr-1.5 bg-[var(--acento-claro)] text-[var(--acento)]`}>Modo demo</span>
                  sin Google de verdad: elegiréis una cuenta de prueba.
                </p>
              ) : (
                <p className={`mt-3 text-center text-[1.0625rem] ${ui.suave}`}>
                  Con el Gmail que nos disteis al reservar. Un toque y dentro.
                </p>
              )}
            </div>
          )}

          {hayAuth() && (
            <div className="mt-7 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-[var(--linea)]" />
              <span className={`text-[1.0625rem] ${ui.suave}`}>o recibid un código por email</span>
              <span className="h-px flex-1 bg-[var(--linea)]" />
            </div>
          )}

          <div id="email" className="mt-6">
            {hayAuth() ? (
              <>
                <h2 className="sr-only">O recibid un código por email</h2>
                <EntrarCuenta volver={volver} />
              </>
            ) : demo ? null : (
              <p className={`${ui.texto} ${ui.suave}`}>
                El acceso con email llega muy pronto. Mientras tanto, entrad con el
                enlace privado que os mandamos por WhatsApp o por correo.
              </p>
            )}
          </div>

          {demo && (
            <div className="mt-8 border-t border-[var(--linea)] pt-6">
              <p className={`text-[0.95rem] ${ui.suave}`}>¿Solo queréis echar un vistazo?</p>
              <form action={entrarDemo} className="mt-3">
                <button type="submit" className={`${ui.boton} w-full`}>
                  Entrar con la boda de ejemplo
                </button>
              </form>
            </div>
          )}
        </section>

        <p className={`mt-6 text-center text-[0.9rem] ${ui.suave}`}>
          ¿Tenéis el enlace privado? Abridlo y entraréis directamente.
        </p>
      </div>
    </main>
  );
}
