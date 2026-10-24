import Link from "next/link";
import { WHATSAPP } from "@/lib/contacto";

/**
 * El marco de las páginas de pago (/gracias, /pagar/…): sin el menú de la
 * web ni la barra fija de precios, que aquí solo distraen. El logotipo
 * arriba, una hoja de papel en el centro y los enlaces legales al pie.
 */
export default function MarcoPago({ children, aviso }: { children: React.ReactNode; aviso?: React.ReactNode }) {
  return (
    <div className="grano relative flex min-h-dvh flex-col bg-[var(--papel)] text-[var(--tinta)]">
      <header className="flex justify-center px-4 pb-4 pt-[max(1.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="inline-flex min-h-12 items-center" aria-label="Invitoo, volver al inicio">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG */}
          <img src="/marca/lockup.svg" alt="" width={132} height={45} className="h-auto w-[132px]" />
        </Link>
      </header>
      {aviso}
      <main id="contenido" className="mx-auto w-full max-w-[36rem] flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        {children}
      </main>
      <footer className="flex flex-wrap justify-center gap-x-6 gap-y-1 border-t border-[var(--tinta)]/10 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 text-[1rem]">
        <Link href="/condiciones" className="inline-flex min-h-12 items-center opacity-70 hover:opacity-100">
          Condiciones de contratación
        </Link>
        <Link href="/privacidad" className="inline-flex min-h-12 items-center opacity-70 hover:opacity-100">
          Privacidad
        </Link>
        <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center opacity-70 hover:opacity-100">
          WhatsApp
        </a>
      </footer>
    </div>
  );
}

/** La franja de «Modo demo». */
export function AvisoDemo({ children = "Modo demo: no se ha cobrado nada." }: { children?: React.ReactNode }) {
  return (
    <p role="note" className="mx-4 rounded-2xl border border-[var(--acento)]/35 bg-[var(--acento)]/[0.06] px-5 py-3 text-center text-[1.0625rem] font-medium text-[var(--acento)] sm:mx-auto sm:max-w-[34rem]">
      {children}
    </p>
  );
}

export { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "./estilos";
