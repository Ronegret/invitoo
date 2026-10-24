import type { Metadata } from "next";
import Link from "next/link";
import BotonImprimir from "@/components/panel/BotonImprimir";
import { exigirPanel, invitacionDelPanel, origen } from "@/components/panel/cargar";
import { TOKENS_PANEL, ui } from "@/components/panel/estilos";
import SelloAlianzas from "@/components/SelloAlianzas";
import { formatearFecha } from "@/lib/fecha";
import { qrElegante } from "@/lib/momentos/qr";
import { contraste, esOscuro } from "@/plantillas/color";
import { resolverTokens } from "@/plantillas/tokens";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tarjetas del QR de deseos · Invitoo", robots: { index: false, follow: false } };

/**
 * Tarjetas del QR de deseos: cuatro por A4 (A6 cada una), con línea de
 * corte suave. Con el color de la boda; si la plantilla es de noche, en
 * papel claro (se imprime en casa).
 */
export default async function TarjetasDeseos({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await exigirPanel(slug);
  const [inv, base] = await Promise.all([invitacionDelPanel(slug), origen()]);
  const t = resolverTokens(inv.plantilla, inv.tema);
  const oscura = esOscuro(t.papel);
  const papel = oscura ? "#FBF8F2" : t.papel;
  const tinta = oscura ? "#1F1A17" : t.tinta;
  const acento = contraste(t.acento, papel) >= 4.5 ? t.acento : contraste(t.acentoTexto, papel) >= 4.5 ? t.acentoTexto : "#8C1D2C";
  const url = `${base}/i/${slug}/deseos`;
  const qr = qrElegante(url, { tinta, papel: "transparent", acento });
  const fecha = formatearFecha(inv.pareja.fecha, { day: "numeric", month: "long", year: "numeric" });

  const tarjeta = (i: number) => (
    <div
      key={i}
      className="tarjeta relative flex flex-col items-center justify-between overflow-hidden px-[8mm] py-[9mm] text-center"
      style={{ background: papel, color: tinta }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-[4mm] rounded-[2px] border" style={{ borderColor: `${acento}55` }} />
      <div className="flex flex-col items-center">
        <span style={{ color: acento }}>
          <SelloAlianzas size={30} />
        </span>
        <p className="mt-[3mm] text-[7.5pt] uppercase tracking-[0.3em]" style={{ color: acento }}>
          Libro de buenos deseos
        </p>
        <p className="display mt-[2mm] text-[19pt] italic leading-tight">
          {inv.pareja.a} &amp; {inv.pareja.b}
        </p>
      </div>
      <div className="w-[40mm] [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
      <div>
        <p className="text-[10.5pt] leading-snug">Escanéalo con la cámara y déjanos<br />tu nombre y un buen deseo.</p>
        <p className="mt-[2mm] text-[7pt] uppercase tracking-[0.22em] opacity-70">{fecha}</p>
      </div>
    </div>
  );

  return (
    <div style={TOKENS_PANEL} className="min-h-dvh bg-[#EDEAE5] text-[var(--tinta)] print:bg-white">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        .pliego { width: 210mm; height: 297mm; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .tarjeta { outline: 0.2mm dashed rgba(0,0,0,.18); outline-offset: -0.1mm; }
        @media screen and (max-width: 860px) { .pliego { width: 100%; height: auto; grid-template-columns: 1fr; } .tarjeta { aspect-ratio: 105 / 148.5; } }
        @media print { .no-imprimir { display: none !important; } .pliego { box-shadow: none !important; margin: 0 !important; } }
      `}</style>
      <div className="no-imprimir sticky top-0 z-10 border-b border-[var(--linea)] bg-[var(--papel)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[52rem] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/panel/${slug}/deseos`} className={`inline-flex min-h-12 items-center ${ui.enlace}`}>
            ← Volver al libro de deseos
          </Link>
          <BotonImprimir>Imprimir las tarjetas</BotonImprimir>
        </div>
        <p className={`mx-auto max-w-[52rem] px-4 pb-3 text-[0.9rem] ${ui.suave}`}>
          Cuatro tarjetas A6 por folio. Imprimid al 100 % (sin «ajustar a la página») y cortad por la línea discontinua.
        </p>
      </div>
      <main className="py-6 sm:py-10 print:p-0">
        <div className="pliego mx-auto bg-white shadow-[var(--sombra-3,0_10px_30px_rgba(0,0,0,.08))]">{[0, 1, 2, 3].map(tarjeta)}</div>
      </main>
    </div>
  );
}
