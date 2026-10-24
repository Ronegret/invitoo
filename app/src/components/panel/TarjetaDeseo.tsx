"use client";

import { moderarDeseoAccion } from "@/lib/deseos/acciones-panel";
import Formulario, { Enviar } from "./Formulario";
import IconoPanel from "./IconosPanel";
import { ui } from "./estilos";

export type DeseoVista = {
  clave: string;
  origen: "muro" | "directo" | "qr";
  nombreOrigen: string;
  nombre: string;
  texto: string;
  original: string;
  corregido: boolean;
  foto: string | null;
  oculto: boolean;
  favorito: boolean;
  leido: boolean;
  fecha: string;
};

/**
 * Un deseo en el panel: quién, qué, de dónde, y tres gestos (favorito,
 * ocultar, corregir una errata). Cada gesto es un `<form>`: funciona sin JS.
 */
export default function TarjetaDeseo({ slug, d }: { slug: string; d: DeseoVista }) {
  const ocultoTexto = d.origen === "qr" ? "No saldrá en el libro." : "No se ve en la invitación ni sale en el libro.";
  return (
    <article
      aria-labelledby={`d-${d.clave}`}
      className={`${ui.tarjeta} relative flex flex-col gap-4 transition-shadow hover:shadow-[var(--sombra-2,0_4px_14px_rgba(0,0,0,.06))] ${d.oculto ? "bg-[#F6F4F1]" : ""} ${!d.leido && !d.oculto ? "border-l-4 border-l-[var(--acento)]" : ""}`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 id={`d-${d.clave}`} className="font-medium">
          {!d.leido && !d.oculto && <span className="sr-only">Nuevo: </span>}
          {d.nombre}
        </h3>
        <span className={`${ui.chip} bg-[#EFECE8] text-[var(--suave)]`}>{d.nombreOrigen}</span>
        {d.favorito && (
          <span className={`${ui.chip} gap-1 bg-[#F6EEDC] text-[#6E5326]`}>
            <IconoPanel id="estrella" size={14} /> Favorito
          </span>
        )}
        {d.oculto && <span className={`${ui.chip} bg-[#EFECE8] text-[var(--suave)]`}>Oculto</span>}
        <span className={`ml-auto text-[0.85rem] ${ui.suave}`}>{d.fecha}</span>
      </header>

      <div className="flex gap-4">
        {d.foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.foto} alt={`Foto de ${d.nombre}`} loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
        )}
        <blockquote className={`min-w-0 flex-1 whitespace-pre-line font-serif text-[1.08rem] italic leading-relaxed ${d.oculto ? "text-[var(--suave)]" : ""}`}>
          «{d.texto}»
        </blockquote>
      </div>
      {d.oculto && <p className={`text-[0.88rem] ${ui.suave}`}>{ocultoTexto}</p>}
      {d.corregido && <p className={`text-[0.85rem] ${ui.suave}`}>Corregido. Original: «{d.original}»</p>}

      <Formulario accion={moderarDeseoAccion} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="clave" value={d.clave} />
        <button
          type="submit"
          name="que"
          value={d.favorito ? "quitar-favorito" : "favorito"}
          aria-pressed={d.favorito}
          className={`${ui.boton} ${d.favorito ? "border-[#B08D57] bg-[#F6EEDC] text-[#6E5326]" : ""}`}
        >
          <IconoPanel id="estrella" size={18} />
          {d.favorito ? "Favorito" : "Marcar favorito"}
        </button>
        <button type="submit" name="que" value={d.oculto ? "mostrar" : "ocultar"} className={ui.boton}>
          <IconoPanel id="ojo" size={18} />
          {d.oculto ? "Volver a mostrar" : "Ocultar"}
        </button>
        {!d.leido && !d.oculto && (
          <button type="submit" name="que" value="leido" className={`${ui.boton} border-transparent bg-transparent`}>
            Marcar leído
          </button>
        )}
      </Formulario>

      <details className="group">
        <summary className={`inline-flex min-h-12 cursor-pointer items-center gap-2 text-[0.92rem] ${ui.suave} ${ui.foco}`}>
          <IconoPanel id="lapiz" size={18} /> Corregir una errata
        </summary>
        <Formulario accion={moderarDeseoAccion} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="clave" value={d.clave} />
          <input type="hidden" name="que" value="corregir" />
          <label htmlFor={`c-${d.clave}`} className={ui.etiqueta}>Texto para el libro</label>
          <textarea id={`c-${d.clave}`} name="texto" rows={3} maxLength={1200} defaultValue={d.texto} className={ui.area} />
          <label className="flex min-h-12 items-start gap-3 text-[0.92rem]">
            <input type="checkbox" name="permiso" value="si" className="mt-1 h-5 w-5 accent-[var(--acento)]" />
            Solo una errata, y con permiso de quien lo escribió. El original se guarda.
          </label>
          <div className="flex flex-wrap gap-2">
            <Enviar variante="borde">Guardar corrección</Enviar>
            {d.corregido && (
              <button type="submit" name="restaurar" value="si" className={ui.boton}>
                Volver al original
              </button>
            )}
          </div>
        </Formulario>
      </details>
    </article>
  );
}
