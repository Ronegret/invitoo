import Cabecera from "@/components/panel/Cabecera";
import Bloqueado from "@/components/panel/Bloqueado";
import ContratarDirecto from "@/components/panel/ContratarDirectoPanel";
import VistaPreviaDirecto from "@/components/panel/VistaPreviaDirecto";
import { contratoDelPanel, exigirPanel } from "@/components/panel/cargar";
import { ui } from "@/components/panel/estilos";
import ControlDirecto from "@/components/directo/ControlDirecto";
import GaleriaMomentos from "@/components/directo/GaleriaMomentos";
import VuestroAlbum from "@/components/directo/VuestroAlbum";
import { avisosDirecto } from "@/components/panel/directo";
import { after } from "next/server";
import { avisar } from "@/lib/avisos/avisar";
import { listarAvisos } from "@/lib/avisos/datos";
import { formatearFecha } from "@/lib/fecha";
import { INFO_ANADIDO, incluye } from "@/lib/planes-boda";

export const dynamic = "force-dynamic";

/**
 * «En directo»: el QR de las mesas, la pantalla del salón, la moderación y
 * vuestras fotos. Lo construye H1 en `components/directo/`. Si no está
 * contratado (plan «album»), en gris con candado, vista previa y «Contratar».
 */
export default async function EnDirecto({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fotos?: string; pago?: string }>;
}) {
  const { slug } = await params;
  const { fotos, pago } = await searchParams;
  const acceso = await exigirPanel(slug);
  const [contrato, directo] = await Promise.all([contratoDelPanel(slug, acceso.invitacionId), avisosDirecto(slug)]);
  const tiene = incluye(contrato, "directo");
  const info = INFO_ANADIDO.directo;

  // Vuelta de Stripe (?pago=ok|cancelado): aviso arriba y, si se pagó, en la
  // campana (una sola vez: no se repite si ya hay uno de hace menos de 1 h).
  const pagoOk = pago === "ok";
  const titulo = "Pago recibido: En directo ya está activo";
  if (pagoOk && tiene) {
    after(async () => {
      const recientes = await listarAvisos(acceso.invitacionId, 10);
      if (recientes.some((a) => a.titulo === titulo && Date.now() - new Date(a.creado).getTime() < 3_600_000)) return;
      await avisar(acceso.invitacionId, slug, {
        tipo: "solicitud",
        titulo,
        detalle: "Ya podéis imprimir el QR de las mesas y probar la pantalla del salón.",
        enlace: `/panel/${slug}/directo`,
      });
    });
  }

  return (
    <>
      <Cabecera eyebrow="En directo" titulo="Las fotos de vuestros invitados">
        {tiene
          ? "Un QR en las mesas, las fotos en la pantalla del salón y todo guardado para después."
          : "Con vuestro plan, los invitados suben fotos al álbum desde la invitación. En directo añade la pantalla del salón."}
      </Cabecera>

      {(pago === "ok" || pago === "cancelado") && (
        <div
          role="status"
          className={`mb-8 flex items-start gap-3 rounded-2xl px-5 py-4 ${pagoOk ? "bg-[var(--verde-claro)] text-[var(--verde)]" : "bg-[#EFECE8] text-[var(--suave)]"}`}
        >
          <span className="mt-0.5 shrink-0" aria-hidden="true">{pagoOk ? "✓" : "·"}</span>
          <p>
            <span className="font-medium">{pagoOk ? (tiene ? titulo : "Pago recibido. Lo estamos activando…") : "Pago cancelado."}</span>{" "}
            {pagoOk
              ? tiene
                ? "Gracias. Ya podéis imprimir el QR de las mesas y probar la pantalla."
                : "Tarda unos segundos: recargad la página en un momento."
              : "No se ha cobrado nada. Podéis contratarlo cuando queráis."}
          </p>
        </div>
      )}

      {(directo.avisoBorrado || directo.retiradas > 0) && (
        <div role="note" className="mb-8 flex flex-col gap-2 rounded-2xl border-l-4 border-l-[var(--acento)] bg-[var(--acento-claro)] px-5 py-4 text-[var(--acento)]">
          {directo.avisoBorrado && directo.borrado && (
            <p className="font-medium">
              Atención: el álbum de fotos se borra el{" "}
              {formatearFecha(directo.borrado, { day: "numeric", month: "long", year: "numeric" })}. Descargad el ZIP antes.
            </p>
          )}
          {directo.retiradas > 0 && (
            <p className="font-medium">
              {directo.retiradas === 1
                ? "1 foto retirada por un invitado: pendiente de revisar."
                : `${directo.retiradas} fotos retiradas por invitados: pendientes de revisar.`}{" "}
              <a href="?fotos=retiradas#t-galeria" className="underline underline-offset-4">Revisarlas</a>
            </p>
          )}
        </div>
      )}

      {tiene ? (
        <section aria-labelledby="t-directo">
          <h2 id="t-directo" className="sr-only">Control de la pantalla</h2>
          <ControlDirecto slug={slug} />
        </section>
      ) : (
        <section aria-labelledby="t-contratar">
          <h2 id="t-contratar" className={`${ui.h2} mb-4`}>La pantalla del salón</h2>
          <Bloqueado
            titulo={info.nombre}
            precio={info.precio}
            resumen={info.resumen}
            incluye={info.incluye}
            vista={<VistaPreviaDirecto />}
            contratar={<ContratarDirecto slug={slug} bloqueado />}
          />
        </section>
      )}

      <section aria-labelledby="t-album" className="mt-10">
        <h2 id="t-album" className="sr-only">Vuestro álbum</h2>
        <VuestroAlbum slug={slug} />
      </section>

      <section aria-labelledby="t-galeria" className="mt-10 scroll-mt-20">
        <h2 id="t-galeria" className={ui.h2}>Vuestras fotos</h2>
        <p className={`mt-1 ${ui.suave}`}>Lo que suben los invitados. Podéis ocultar cualquiera y descargarlas todas en un ZIP.</p>
        <div className="mt-5">
          <GaleriaMomentos slug={slug} filtroInicial={fotos === "retiradas" ? "retiradas" : "todas"} />
        </div>
      </section>
    </>
  );
}
