import type { Metadata } from "next";
import type { ReactNode } from "react";
import NavPanel from "@/components/panel/NavPanel";
import { TOKENS_PANEL } from "@/components/panel/estilos";
import { contratoDelPanel, exigirPanel, invitacionDelPanel } from "@/components/panel/cargar";
import { ahoraMs } from "@/components/panel/util";
import { salir } from "@/lib/auth/acciones";
import { contarNoLeidos, listarAvisos } from "@/lib/avisos/datos";
import { contarDeseosNuevos } from "@/lib/deseos/datos";
import { incluye } from "@/lib/planes-boda";
import { solicitudesDeBoda } from "@/lib/solicitudes/datos";

export const metadata: Metadata = {
  title: "Vuestra boda · Invitoo",
  robots: { index: false, follow: false },
};

/**
 * El marco del panel: navegación (lateral en escritorio, inferior en móvil)
 * y el papel de la marca. Cada página vuelve a exigir el acceso por su cuenta
 * (ver `components/panel/cargar.ts`).
 */
export default async function LayoutPanel({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const acceso = await exigirPanel(slug);
  const id = acceso.invitacionId;
  const [inv, pendientes, avisos, noLeidos, contrato, solicitudes] = await Promise.all([
    invitacionDelPanel(slug),
    contarDeseosNuevos(id),
    listarAvisos(id, 8),
    contarNoLeidos(id),
    contratoDelPanel(slug, id),
    solicitudesDeBoda(id),
  ]);

  return (
    <div style={TOKENS_PANEL} className="min-h-dvh bg-[var(--papel)] text-[var(--tinta)] lg:flex">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-full bg-[var(--acento)] px-5 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <NavPanel
        slug={slug}
        pareja={`${inv.pareja.a} & ${inv.pareja.b}`}
        pendientes={pendientes}
        publicada={inv.estado === "publicada"}
        salir={salir}
        avisos={avisos}
        noLeidos={noLeidos}
        ahora={ahoraMs()}
        directoBloqueado={!incluye(contrato, "directo")}
        cambiosAbiertos={solicitudes.filter((x) => x.estado !== "hecha").length}
      />
      <div className="min-w-0 flex-1">
        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-[64rem] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-6 outline-none sm:px-6 lg:px-10 lg:pb-16 lg:pt-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
