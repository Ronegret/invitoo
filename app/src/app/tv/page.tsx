import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pantallasActivas } from "@/lib/momentos/datos";
import { ALFABETO_TV, codigoTv, iguales } from "@/lib/momentos/servidor";

/**
 * invitoo.es/tv — la pantalla del salón con el mando de la tele.
 *
 * El enlace de la pantalla es largo (lleva la clave) y en una Smart TV no
 * se teclea. Aquí basta el código de 6 caracteres que sale en el panel
 * (En directo → La pantalla del salón). El código depende de la clave: si
 * la pareja la regenera, el código viejo deja de valer.
 *
 * Seguridad: el código se compara en tiempo constante y hay un límite de
 * intentos por IP (en memoria, por instancia: frena el tanteo; 887 millones
 * de códigos posibles). Sin código válido no se revela nada de ninguna boda.
 * Funciona sin JavaScript (formulario GET).
 */

export const metadata: Metadata = {
  title: "Pantalla En directo · Invitoo",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#0c0a09", colorScheme: "dark" };
export const dynamic = "force-dynamic";

const VENTANA_MS = 10 * 60_000;
const MAX_INTENTOS = 12;
const intentos = ((globalThis as { __invitooTv?: Map<string, { n: number; desde: number }> }).__invitooTv ??= new Map());

function frenado(ip: string): boolean {
  const ahora = Date.now();
  const x = intentos.get(ip);
  if (!x || ahora - x.desde > VENTANA_MS) {
    intentos.set(ip, { n: 1, desde: ahora });
    if (intentos.size > 5000) for (const [k, v] of intentos) if (ahora - v.desde > VENTANA_MS) intentos.delete(k);
    return false;
  }
  x.n += 1;
  return x.n > MAX_INTENTOS;
}

const limpiar = (v: string) => v.toUpperCase().replace(/[\s.-]/g, "").slice(0, 8);

export default async function Tv({ searchParams }: { searchParams: Promise<{ c?: string | string[] }> }) {
  const { c } = await searchParams;
  const pedido = typeof c === "string" ? limpiar(c) : "";
  let error = "";

  if (pedido) {
    const h = await headers();
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
    if (frenado(ip)) {
      error = "Demasiados intentos. Esperad unos minutos y probad otra vez.";
    } else if (pedido.length !== 6 || [...pedido].some((x) => !ALFABETO_TV.includes(x))) {
      error = "El código tiene 6 letras y números. Miradlo en vuestro panel, en En directo.";
    } else {
      const activas = await pantallasActivas();
      const hallada = activas.find((x) => iguales(codigoTv(x.config), pedido));
      if (hallada) redirect(`/directo/${hallada.slug}?k=${encodeURIComponent(hallada.config.clave_pantalla)}`);
      error = "Ese código no es de ninguna pantalla activa. Revisadlo en el panel (puede haber cambiado si regenerasteis la clave).";
    }
  }

  return (
    <main className="grid min-h-[100svh] grid-cols-[minmax(0,1fr)] place-items-center bg-[#0c0a09] px-6 py-12 text-center text-[#f4efe8]">
      <div className="w-full max-w-[46rem]">
        <p className="text-[1.125rem] uppercase tracking-[0.3em] opacity-70">Invitoo · En directo</p>
        <h1 className="display mt-6 text-[clamp(2.4rem,6vw,4.4rem)] leading-tight">La pantalla del salón</h1>
        <p className="mx-auto mt-5 max-w-[34rem] text-[1.25rem] leading-relaxed opacity-80">
          Escribid el código de 6 caracteres que aparece en vuestro panel, en «En directo».
        </p>
        <form method="get" action="/tv" className="mx-auto mt-10 flex max-w-[30rem] flex-col items-stretch gap-4 sm:flex-row">
          <label htmlFor="tv-codigo" className="sr-only">
            Código de la pantalla
          </label>
          <input
            id="tv-codigo"
            name="c"
            required
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            maxLength={8}
            defaultValue={pedido}
            placeholder="ABC234"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "tv-error" : undefined}
            size={8}
            className="min-h-16 w-full min-w-0 flex-1 rounded-2xl border border-white/25 bg-white/5 px-5 text-center font-mono text-[2rem] uppercase tracking-[0.35em] text-white outline-none placeholder:text-white/25 focus:border-[#e2c58a] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#e2c58a]"
          />
          <button
            type="submit"
            className="min-h-16 rounded-2xl bg-[#e2c58a] px-8 text-[1.25rem] font-medium text-[#12100e] transition-transform active:scale-[.98] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white"
          >
            Abrir
          </button>
        </form>
        <p id="tv-error" role={error ? "alert" : undefined} className="mx-auto mt-6 min-h-8 max-w-[34rem] text-[1.125rem] text-[#f2b8a8]">
          {error}
        </p>
      </div>
    </main>
  );
}
