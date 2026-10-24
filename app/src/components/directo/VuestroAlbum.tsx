"use client";

import { useEffect, useState } from "react";
import { ui } from "@/components/panel/estilos";
import { estadoDirecto, listaDescarga, listarModeracion, type EstadoDirecto } from "@/lib/momentos/acciones-control";
import type { MomentoModeracion } from "@/lib/momentos/tipos";
import { descargarZip } from "./zip";

/**
 * «Vuestro álbum»: la entrega a los novios.
 *
 *   <VuestroAlbum slug="laura-y-ruben" />
 *
 * Un vistazo (cuántas fotos, vídeos y mensajes, y las últimas), y el botón
 * del ZIP: todas las fotos y vídeos, `abrid-aqui.html` (el álbum para verlo
 * sin conexión, cada foto con su mensaje) y `mensajes.txt`. Los mensajes y
 * los pies de foto ya están en el Libro de buenos deseos.
 */
export default function VuestroAlbum({ slug }: { slug: string }) {
  const [e, setE] = useState<EstadoDirecto | null>(null);
  const [ultimas, setUltimas] = useState<MomentoModeracion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [zip, setZip] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const [r, m] = await Promise.all([estadoDirecto(slug), listarModeracion(slug, "todas")]);
        if (!vivo) return;
        if (r.ok) setE(r);
        else setError(r.error);
        if (m.ok) setUltimas(m.momentos.filter((x) => x.estado === "visible" && x.tipo !== "mensaje" && x.miniatura).slice(0, 8));
      } catch {
        if (vivo) setError("No hay conexión. Probad otra vez en un momento.");
      }
    })();
    return () => {
      vivo = false;
    };
  }, [slug]);

  async function descargar() {
    setZip("Preparando la lista…");
    try {
      const r = await listaDescarga(slug);
      if (!r.ok) return setZip(r.error);
      if (!r.archivos.length && !r.mensajes) return setZip("Todavía no hay nada que descargar.");
      await descargarZip(r.archivos, r.mensajes, r.carpeta, setZip, r.album);
    } catch (err) {
      setZip((err as Error).name === "AbortError" ? null : "La descarga se ha cortado. Probad otra vez.");
    }
  }

  if (!e) {
    return (
      <div className={ui.tarjeta} aria-busy={!error}>
        <p className={ui.suave}>{error ?? "Cargando vuestro álbum…"}</p>
      </div>
    );
  }

  const borrado = e.retencionHasta
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(e.retencionHasta))
    : null;
  const total = e.uso.fotos + e.uso.videos;

  return (
    <section className={ui.tarjeta} aria-labelledby={`va-${slug}`}>
      <h3 id={`va-${slug}`} className={ui.h2}>Vuestro álbum</h3>
      <p className={`mt-1 ${ui.texto} ${ui.suave}`}>
        {total
          ? `${total.toLocaleString("es-ES")} ${total === 1 ? "recuerdo" : "recuerdos"} de vuestros invitados: ${e.uso.fotos} fotos, ${e.uso.videos} vídeos y ${e.uso.mensajes} mensajes.`
          : "Aquí os esperan las fotos y los mensajes de vuestros invitados."}
      </p>

      {ultimas.length > 0 && (
        <ul className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-8" aria-label="Las últimas fotos">
          {ultimas.map((m) => (
            <li key={m.id} className="aspect-square overflow-hidden rounded-lg bg-[#EFECE8]">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada */}
              <img src={m.miniatura!} alt={m.mensaje ? `Foto de ${m.autor}: «${m.mensaje}»` : `Foto de ${m.autor}`} className="h-full w-full object-cover" loading="lazy" />
            </li>
          ))}
        </ul>
      )}

      <ul className={`mt-4 space-y-1.5 text-[0.95rem] ${ui.suave}`}>
        <li>· Todas las fotos y vídeos, a buena calidad.</li>
        <li>· «abrid-aqui.html»: el álbum para verlo sin conexión, cada foto con su mensaje.</li>
        <li>· «mensajes.txt»: todo lo que os escribieron.</li>
      </ul>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={descargar} disabled={Boolean(zip && !zip.startsWith("Listo") && !zip.startsWith("Todavía"))} className={`${ui.botonLleno} min-h-14`}>
          Descargar el álbum (ZIP)
        </button>
        <a href={`/panel/${slug}/deseos`} className={`${ui.boton} min-h-14`}>
          Ver los mensajes en el Libro
        </a>
      </div>
      {zip && (
        <p role="status" className={`mt-3 text-[0.95rem] ${ui.suave}`}>
          {zip}
        </p>
      )}
      {borrado && (
        <p className={`mt-4 text-[0.9rem] ${e.avisoBorrado ? "font-medium text-[var(--acento)]" : ui.suave}`}>
          {e.avisoBorrado ? `Atención: se borra el ${borrado}. Descargadlo antes.` : `Online hasta el ${borrado}. Después se borra todo: descargadlo antes.`}
        </p>
      )}
    </section>
  );
}
