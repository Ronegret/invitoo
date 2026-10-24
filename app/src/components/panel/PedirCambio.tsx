"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Resultado } from "@/app/panel/tipos";
import { prepararFoto, subir } from "@/lib/momentos/navegador";
import { pedirCambioAccion, prepararFotoSolicitud } from "@/lib/solicitudes/acciones";
import { Enviar } from "./Formulario";
import IconoPanel from "./IconosPanel";
import { ui } from "./estilos";

/**
 * «Pedir un cambio»: qué queréis cambiar, en qué sección (opcional) y una
 * captura o foto (opcional). La foto se sube antes de enviar, comprimida en
 * el móvil; el formulario funciona sin JS (sin la foto).
 */
export default function PedirCambio({
  slug,
  secciones,
  inicial,
  seccionInicial,
}: {
  slug: string;
  secciones: { id: string; nombre: string }[];
  inicial?: string;
  seccionInicial?: string;
}) {
  const [estado, enviar] = useActionState<Resultado, FormData>(pedirCambioAccion, null);
  const [foto, setFoto] = useState<{ ruta: string; vista: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const form = useRef<HTMLFormElement>(null);

  // Al enviar con éxito se vacía la foto (ajuste durante el render, sin efecto)
  // y el formulario se reinicia en el DOM.
  const [visto, setVisto] = useState(estado);
  if (estado !== visto) {
    setVisto(estado);
    if (estado?.ok) setFoto(null);
  }
  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);

  async function elegir(f: File | undefined) {
    setErrorFoto("");
    if (!f) return;
    setSubiendo(true);
    try {
      const p = await prepararFoto(f);
      const r = await prepararFotoSolicitud(slug, p.mime);
      if (!r.ok) throw new Error(r.error);
      await subir(r.destino.url, p.grande, r.destino.cabeceras, () => {});
      setFoto({ ruta: r.ruta, vista: URL.createObjectURL(p.miniatura) });
    } catch (e) {
      setErrorFoto(e instanceof Error && e.message ? e.message : "No se ha podido adjuntar. Enviadla sin foto o por WhatsApp.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <form ref={form} action={enviar} className="flex flex-col gap-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="foto_ruta" value={foto?.ruta ?? ""} />
      <div>
        <label htmlFor="c-texto" className="font-medium">¿Qué queréis cambiar?</label>
        <textarea
          id="c-texto"
          name="texto"
          required
          minLength={4}
          maxLength={2000}
          rows={5}
          defaultValue={inicial}
          placeholder="Por ejemplo: la hora de la ceremonia es a las 12:30, no a las 12:00."
          aria-describedby="c-ayuda"
          className={ui.area}
        />
        <p id="c-ayuda" className={`mt-1.5 text-[0.88rem] ${ui.suave}`}>Con una frase basta. Lo leemos nosotros, no un robot.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-seccion" className={ui.etiqueta}>Sección (opcional)</label>
          <select id="c-seccion" name="seccion" defaultValue={seccionInicial ?? ""} className={ui.campo}>
            <option value="">No lo sé / varias</option>
            {secciones.map((s) => (
              <option key={s.id} value={s.nombre}>{s.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <span className={ui.etiqueta} id="c-foto-t">Una captura o foto (opcional)</span>
          {foto ? (
            <div className="mt-1.5 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.vista} alt="Foto adjunta" className="h-12 w-12 rounded-lg object-cover" />
              <button type="button" onClick={() => setFoto(null)} className={ui.boton}>Quitar</button>
            </div>
          ) : (
            <label className={`${ui.boton} mt-1.5 w-full cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--acento)]`}>
              <IconoPanel id="mas_simple" size={18} />
              {subiendo ? "Adjuntando…" : "Adjuntar imagen"}
              <input
                type="file"
                accept="image/*"
                aria-labelledby="c-foto-t"
                className="sr-only"
                disabled={subiendo}
                onChange={(e) => elegir(e.target.files?.[0])}
              />
            </label>
          )}
          {errorFoto && <p role="alert" className="mt-1.5 text-[0.88rem] text-[var(--acento)]">{errorFoto}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Enviar pendiente="Enviando…">Enviar la solicitud</Enviar>
        <p role="status" aria-live="polite" className={`text-[0.95rem] empty:hidden ${estado?.ok === false ? "text-[var(--acento)]" : "text-[var(--verde)]"}`}>
          {estado?.mensaje}
        </p>
      </div>
    </form>
  );
}
