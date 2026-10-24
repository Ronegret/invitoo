import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import SelloAlianzas from "@/components/SelloAlianzas";
import { Guirnalda } from "@/components/flores";
import { obtenerPlantilla } from "@/data/plantillas";
import { invitacionPorSlug } from "@/lib/datos";
import { formatearFecha } from "@/lib/fecha";
import { FUENTES } from "@/plantillas";
import { resolverTokens, variablesCss } from "@/plantillas/tokens";
import FormDeseo from "./FormDeseo";

/**
 * /i/<slug>/deseos — a donde lleva el QR de deseos. Viste como la
 * invitación (tokens y fuentes de su plantilla) y pide solo dos cosas: tu
 * nombre y tu deseo. Va también sin JS (formulario normal). El antispam vive
 * en la acción (`lib/deseos/acciones.ts`): trampa, tiempo y límites.
 */

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const inv = await invitacionPorSlug(slug);
  if (!inv) return {};
  return {
    title: `Un buen deseo para ${inv.pareja.a} & ${inv.pareja.b}`,
    description: "Déjales tu nombre y un buen deseo. Irá en su libro de buenos deseos.",
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export const dynamic = "force-dynamic";

export default async function PaginaDeseos({ params }: Props) {
  const { slug } = await params;
  const inv = await invitacionPorSlug(slug);
  if (!inv || inv.estado === "archivada") notFound();
  const plantilla = obtenerPlantilla(inv.plantilla);
  const tokens = resolverTokens(inv.plantilla, inv.tema);
  const { a, b } = inv.pareja;

  return (
    <main
      className={`grano relative min-h-dvh overflow-x-clip ${FUENTES[plantilla.id]}`}
      data-modo={tokens.modo}
      data-plantilla={plantilla.id}
      style={
        {
          ...variablesCss(tokens),
          background: "var(--papel)",
          color: "var(--tinta)",
          fontFamily: "var(--texto)",
        } as React.CSSProperties
      }
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-6 -top-4 opacity-80">
        <Guirnalda esquina="sup-izq" tamano={170} densidad="ligera" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-4 -right-6 opacity-70">
        <Guirnalda esquina="inf-der" tamano={150} densidad="ligera" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[34rem] flex-col px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(4.5rem+env(safe-area-inset-top))]">
        <header className="deseo-entra text-center">
          <span className="inline-block text-[var(--acento-texto)]">
            <SelloAlianzas size={40} />
          </span>
          <p className="mt-5 text-[0.78rem] uppercase tracking-[0.32em] text-[var(--acento-texto)]">Libro de buenos deseos</p>
          <h1 className="mt-3 text-[clamp(2.4rem,11vw,3.4rem)] leading-[1.05]" style={{ fontFamily: "var(--display)" }}>
            {a} <span className="italic text-[var(--acento-texto)]">&amp;</span> {b}
          </h1>
          <p className="mt-3 text-[1.0625rem] opacity-85">{formatearFecha(inv.pareja.fecha, { day: "numeric", month: "long", year: "numeric" })}</p>
          <p className="mx-auto mt-6 max-w-[26rem] text-[1.125rem] leading-relaxed">
            Escríbeles unas líneas. Las guardarán en su libro de buenos deseos, para leerlas dentro de muchos años.
          </p>
        </header>

        <FormDeseo slug={slug} pareja={`${a} y ${b}`} />
      </div>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .deseo-entra { animation: deseo-entra 900ms cubic-bezier(.2,.7,.2,1) both; }
          @keyframes deseo-entra { from { opacity: 0; transform: translateY(14px); } }
        }
      `}</style>
    </main>
  );
}
