import type { Metadata } from "next";
import Link from "next/link";
import MarcoPago, { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/components/pagos/MarcoPago";
import { WHATSAPP } from "@/lib/contacto";
import { GRUPOS, leerPreferencias, TEXTO_GRUPO, verificar } from "@/lib/correos/preferencias";
import { guardarBaja } from "./acciones";

export const metadata: Metadata = {
  title: "Vuestros correos · Invitoo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * /baja?e=…&t=… — qué correos os llegan de Invitoo.
 *
 * Llega desde el pie de cada correo: «Preferencias» abre esta página tal
 * cual y «Darse de baja» añade `&baja=1`, que pone arriba el botón de baja
 * (un clic). No se da de baja al abrir la página: los escáneres de enlaces
 * de Outlook y de los antivirus abren todas las URL de un correo. La baja
 * sin clics es la del `List-Unsubscribe` (POST a /api/correos/baja).
 */

const MENSAJE: Record<string, string> = {
  baja: "Hecho. No os escribiremos más, salvo un aviso imprescindible: si vuestro álbum se fuera a borrar, os lo diríamos antes.",
  guardado: "Guardado. A partir de ahora solo os llegará lo que habéis dejado marcado.",
  alta: "¡Bienvenidos de vuelta! Os volverán a llegar todos los correos.",
  error: "No hemos podido guardarlo. Probad otra vez dentro de un rato o escribidnos por WhatsApp.",
};

/** «ana@gmail.com» → «a••@gmail.com»: se reconoce, no se expone. */
function velado(email: string) {
  const [u, d] = email.split("@");
  return `${u.slice(0, 1)}••@${d}`;
}

export default async function Baja({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const uno = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const e = uno("e");
  const t = uno("t");
  const email = verificar(e, t);

  if (!email) {
    return (
      <MarcoPago>
        <h1 className="display text-[clamp(2rem,8vw,2.6rem)] leading-tight">Este enlace no funciona</h1>
        <p className="mt-5 text-[1.0625rem] leading-relaxed opacity-80">
          Puede que esté incompleto: a veces el correo lo corta en dos líneas. Abrid el enlace desde el último correo
          que os enviamos o escribidnos y os damos de baja nosotros, sin preguntas.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola, no quiero recibir más correos de Invitoo.")}`} className={BOTON_PRINCIPAL} target="_blank" rel="noopener noreferrer">
            Escribir por WhatsApp
          </a>
          <Link href="/" className={BOTON_SECUNDARIO}>
            Ir a Invitoo
          </Link>
        </div>
      </MarcoPago>
    );
  }

  const prefs = await leerPreferencias(email);
  const hecho = MENSAJE[uno("hecho")] ? uno("hecho") : null;
  const pideBaja = uno("baja") === "1" && !prefs.bajaTotal && !hecho;
  const algunoApagado = GRUPOS.some((g) => !prefs.grupos[g]);

  return (
    <MarcoPago>
      <p className="text-[0.95rem] uppercase tracking-[0.22em] opacity-65">Vuestros correos</p>
      <h1 className="display mt-2 text-[clamp(2rem,8vw,2.6rem)] leading-tight">
        {prefs.bajaTotal ? "Ya no os escribimos" : pideBaja ? "¿Dejamos de escribiros?" : "Qué correos os llegan"}
      </h1>
      <p className="mt-3 text-[1.0625rem] opacity-75">
        Para <strong className="font-semibold">{velado(email)}</strong>.
      </p>

      {hecho && (
        <p role="status" className={`mt-6 rounded-2xl border px-5 py-4 text-[1.0625rem] leading-relaxed ${hecho === "error" ? "border-[var(--acento)]/40 bg-[var(--acento)]/[0.06]" : "border-[var(--tinta)]/15 bg-[var(--tinta)]/[0.03]"}`}>
          {MENSAJE[hecho]}
        </p>
      )}

      {pideBaja && (
        <form action={guardarBaja} className="mt-8 rounded-[1.25rem] border border-[var(--tinta)]/12 bg-white/60 p-5 sm:p-6">
          <input type="hidden" name="e" value={e} />
          <input type="hidden" name="t" value={t} />
          <input type="hidden" name="accion" value="baja" />
          <p className="text-[1.0625rem] leading-relaxed">
            Un clic y no os escribimos más. Solo os avisaríamos si vuestro álbum se fuera a borrar, para que no perdáis las fotos.
          </p>
          <button type="submit" className={`${BOTON_PRINCIPAL} mt-5`}>
            Sí, dejad de escribirnos
          </button>
          <p className="mt-4 text-[1rem] opacity-70">¿Preferís recibir solo algunos? Elegidlos aquí debajo.</p>
        </form>
      )}

      {prefs.bajaTotal ? (
        <form action={guardarBaja} className="mt-8">
          <input type="hidden" name="e" value={e} />
          <input type="hidden" name="t" value={t} />
          <input type="hidden" name="accion" value="alta" />
          <p className="text-[1.0625rem] leading-relaxed opacity-80">
            Si os habéis dado de baja sin querer, o queréis volver a saber cómo van las confirmaciones, se arregla con un clic.
          </p>
          <button type="submit" className={`${BOTON_SECUNDARIO} mt-5`}>
            Volver a recibirlos
          </button>
        </form>
      ) : (
        <form action={guardarBaja} className="mt-10">
          <input type="hidden" name="e" value={e} />
          <input type="hidden" name="t" value={t} />
          <input type="hidden" name="accion" value="guardar" />
          <fieldset>
            <legend className="display text-[1.5rem]">Elegid cuáles</legend>
            <p className="mt-2 text-[1rem] opacity-70">Os escribimos poco: como mucho un correo al día, y solo cuando hay algo que contar.</p>
            <ul className="mt-5 flex flex-col">
              {GRUPOS.map((g) => (
                <li key={g} className="border-t border-[var(--tinta)]/12 last:border-b">
                  <label className="flex min-h-14 cursor-pointer items-start gap-4 py-4">
                    <input
                      type="checkbox"
                      name={`g-${g}`}
                      defaultChecked={prefs.grupos[g]}
                      className="mt-1 size-6 shrink-0 accent-[var(--acento)]"
                      aria-describedby={`ayuda-${g}`}
                    />
                    <span>
                      <span className="block text-[1.0625rem] font-medium">{TEXTO_GRUPO[g].nombre}</span>
                      <span id={`ayuda-${g}`} className="mt-1 block text-[1rem] leading-relaxed opacity-70">
                        {TEXTO_GRUPO[g].ayuda}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <button type="submit" className={`${BOTON_PRINCIPAL} mt-7`}>
            Guardar
          </button>
          {algunoApagado && !hecho && (
            <p className="mt-4 text-[1rem] opacity-70">Hay grupos apagados: de esos no os llegará nada.</p>
          )}
        </form>
      )}

      <p className="mt-12 text-[1rem] leading-relaxed opacity-70">
        Los avisos del panel (cuando alguien confirma o deja un deseo) se eligen aparte, en «Avisos» dentro del panel.
        Cómo tratamos vuestros datos: <Link href="/privacidad" className="underline underline-offset-4">privacidad</Link>.
      </p>
    </MarcoPago>
  );
}
