import Link from "next/link";
import Cabecera from "@/components/panel/Cabecera";
import IconoPanel from "@/components/panel/IconosPanel";
import { ProbadorColor } from "@/components/color";
import { guardarPaleta } from "@/lib/color/acciones";
import Formulario, { Enviar } from "@/components/panel/Formulario";
import { exigirPanel, invitacionDelPanel } from "@/components/panel/cargar";
import { ui } from "@/components/panel/estilos";
import AjustesMovimiento from "@/components/movimiento/AjustesMovimiento";
import { guardarDisenoAccion } from "@/app/panel/acciones";
import { obtenerPlantilla } from "@/data/plantillas";
import type { Bloque } from "@/lib/tipos";

export const dynamic = "force-dynamic";

/**
 * Lo que la pareja puede tocar sin llamarnos: los colores (ProbadorColor de G3, con AA y guardado), tres textos y el movimiento.
 * (Antes: el color era una de las
 * variantes de su plantilla), tres textos y cómo se mueve la invitación.
 * Lo estructural (secciones, fotos, plantilla) sigue en el estudio.
 */
export default async function Diseno({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await exigirPanel(slug);
  const inv = await invitacionDelPanel(slug);
  const p = obtenerPlantilla(inv.plantilla);
  const b = <T extends Bloque["t"]>(t: T) => inv.bloques.find((x) => x.t === t) as Extract<Bloque, { t: T }> | undefined;
  const portada = b("portada");
  const historia = b("historia");
  const dress = b("dressCode");

  return (
    <>
      <Cabecera
        eyebrow="Diseño"
        titulo="Cómo se ve vuestra invitación"
        acciones={
          <Link href={`/panel/${slug}/cambios`} className={ui.boton}>
            <IconoPanel id="cambio" size={20} /> Pedir un cambio
          </Link>
        }
      >
        Colores, textos y movimiento. Para secciones, fotos o la plantilla de {p.nombre}, pedidnos el cambio y lo hacemos nosotros.
      </Cabecera>

      {inv.estado !== "publicada" && (
        <p role="note" className="mb-6 rounded-xl bg-[var(--acento-claro)] p-4 text-[0.95rem] text-[var(--acento)]">
          La invitación aún no está publicada: guardad los cambios y os la enseñamos antes de publicarla.
        </p>
      )}

      <section aria-labelledby="t-color" className="mb-10">
        <h2 id="t-color" className="sr-only">Colores</h2>
        <ProbadorColor
          slug={slug}
          plantilla={inv.plantilla}
          tema={inv.tema}
          modo="completo"
          guardar={guardarPaleta}
          urlVista={inv.estado === "publicada" ? undefined : `/panel/${slug}/vista`}
        />
      </section>

      <Formulario accion={guardarDisenoAccion} className="flex flex-col gap-6">
        <input type="hidden" name="slug" value={slug} />

        <section aria-labelledby="t-textos" className={`${ui.tarjeta} flex flex-col gap-5`}>
          <h2 id="t-textos" className={ui.h2}>Textos</h2>
          {portada ? (
            <div>
              <label htmlFor="d-frase" className={ui.etiqueta}>Frase de portada</label>
              <textarea id="d-frase" name="frase" rows={2} maxLength={400} defaultValue={portada.frase} className={ui.area} />
            </div>
          ) : null}
          {historia ? (
            <div>
              <label htmlFor="d-historia" className={ui.etiqueta}>Nuestra historia</label>
              <textarea
                id="d-historia"
                name="historia"
                rows={8}
                defaultValue={historia.parrafos.join("\n\n")}
                aria-describedby="d-historia-ayuda"
                className={ui.area}
              />
              <p id="d-historia-ayuda" className={`mt-1 text-[0.85rem] ${ui.suave}`}>
                Dejad una línea en blanco entre párrafos.
              </p>
            </div>
          ) : (
            <p className={`text-[0.95rem] ${ui.suave}`}>
              Vuestra invitación no tiene la sección «Nuestra historia». Si la queréis, pedídnosla.
            </p>
          )}
          {dress ? (
            <div>
              <label htmlFor="d-dress" className={ui.etiqueta}>Nota del dress code</label>
              <textarea id="d-dress" name="dress" rows={3} maxLength={400} defaultValue={dress.nota} className={ui.area} />
            </div>
          ) : null}
        </section>

        <div>
          <Enviar>Guardar los textos</Enviar>
        </div>
      </Formulario>

      <section aria-labelledby="t-movimiento" className="mt-12">
        <h2 id="t-movimiento" className={ui.h2}>Movimiento</h2>
        <p className={`mt-1 mb-5 ${ui.suave}`}>Cómo entra cada sección: más sereno, más romántico o casi quieto.</p>
        <AjustesMovimiento
          inv={{ slug: inv.slug, plantilla: inv.plantilla, tema: inv.tema }}
          urlVista={inv.estado === "publicada" ? undefined : `/panel/${slug}/vista`}
        />
      </section>
    </>
  );
}
