"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Resultado } from "@/app/acciones";
import { guardarDesdeEstudio } from "@/app/estudio/acciones";
import { PLANTILLAS } from "@/data/plantillas";
import { aEntradaLocal } from "@/lib/fecha";
import type { Invitacion } from "@/lib/tipos";
import AjustesMovimiento from "@/components/movimiento/AjustesMovimiento";
import EditorBloques from "./EditorBloques";

/**
 * El editor de una boda.
 *
 * Los datos de cabecera van en campos; los bloques, en un formulario por
 * tipo (`EditorBloques`), con el JSON crudo plegado para casos raros. El
 * servidor valida todo antes de guardar.
 *
 * La fecha se enseña y se escribe EN HORA DE MADRID, esté donde esté el
 * navegador: el servidor la convierte al instante correcto al guardar.
 */
export default function Editor({
  inv,
  id,
}: {
  inv: Invitacion | null;
  id: string | null;
}) {
  const [estado, enviar, pendiente] = useActionState<Resultado | null, FormData>(
    guardarDesdeEstudio,
    null,
  );

  const campo =
    "mt-2 w-full border-b border-[var(--tinta)]/25 bg-transparent py-2.5 text-[1rem] outline-none focus:border-[var(--acento)]";
  const etiqueta =
    "block text-[0.76rem] uppercase tracking-[0.24em] opacity-55";

  const fechaLocal = inv ? aEntradaLocal(inv.pareja.fecha) : "";

  return (
    <>
      <form action={enviar} className="mx-auto max-w-[44rem] px-5 py-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="display text-[clamp(2rem,7vw,2.8rem)]">
            {inv ? `${inv.pareja.a} & ${inv.pareja.b}` : "Nueva boda"}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            {id && (
              <Link
                href={`/estudio/vista/${id}`}
                target="_blank"
                className="inline-flex min-h-11 items-center text-[0.79rem] uppercase tracking-[0.18em] underline underline-offset-4 opacity-70"
              >
                Vista previa
              </Link>
            )}
            <Link href="/estudio" className="inline-flex min-h-11 items-center text-[0.79rem] uppercase tracking-[0.18em] opacity-55">
              Volver
            </Link>
          </div>
        </div>

        {id && <input type="hidden" name="id" value={id} />}

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <label>
            <span className={etiqueta}>Nombre A</span>
            <input name="nombre_a" required defaultValue={inv?.pareja.a} className={campo} />
          </label>
          <label>
            <span className={etiqueta}>Nombre B</span>
            <input name="nombre_b" required defaultValue={inv?.pareja.b} className={campo} />
          </label>

          <label>
            <span className={etiqueta}>Slug — será /i/…</span>
            <input
              name="slug"
              required
              defaultValue={inv?.slug}
              placeholder="laura-y-ruben"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className={campo}
            />
          </label>
          <label>
            <span className={etiqueta}>Fecha y hora (Madrid)</span>
            <input
              name="fecha"
              type="datetime-local"
              required
              defaultValue={fechaLocal}
              className={campo}
            />
          </label>

          <label>
            <span className={etiqueta}>Plantilla</span>
            <select name="plantilla" defaultValue={inv?.plantilla ?? "sobre"} className={campo}>
              {PLANTILLAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={etiqueta}>Estado</span>
            <select name="estado" defaultValue={inv?.estado ?? "borrador"} className={campo}>
              <option value="borrador">Borrador</option>
              <option value="publicada">Publicada</option>
              <option value="archivada">Archivada</option>
            </select>
          </label>
        </div>

        <fieldset className="mt-14">
          <legend className={etiqueta}>Colores de esta boda</legend>
          <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {(
              [
                ["tinta", "Tinta", inv?.tema.tinta ?? "#241a16"],
                ["papel", "Papel", inv?.tema.papel ?? "#f7f1ea"],
                ["acento", "Acento", inv?.tema.acento ?? "#8c1d2c"],
              ] as const
            ).map(([nombre, texto, valor]) => (
              <label key={nombre} className="flex items-center gap-3">
                <input
                  type="color"
                  name={nombre}
                  defaultValue={valor}
                  className="h-11 w-11 shrink-0 cursor-pointer rounded-full border border-[var(--tinta)]/20 bg-transparent"
                />
                <span className="text-[0.85rem] opacity-65">{texto}</span>
              </label>
            ))}
            <label className="flex items-center gap-3">
              <input
                type="number"
                name="grano"
                step="0.01"
                min="0"
                max="0.2"
                defaultValue={inv?.tema.grano ?? 0.04}
                className="w-16 border-b border-[var(--tinta)]/25 bg-transparent py-2 text-[0.95rem] outline-none"
              />
              <span className="text-[0.85rem] opacity-65">Grano</span>
            </label>
          </div>
        </fieldset>

        <EditorBloques inicial={inv?.bloques ?? []} />

        {estado && (
          <p
            role="status"
            className="mt-6 text-[0.95rem]"
            style={{ color: estado.ok ? undefined : "var(--acento)" }}
          >
            {estado.ok ? estado.mensaje : estado.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pendiente}
          className="mt-10 min-h-14 w-full rounded-full bg-[var(--tinta)] px-8 text-[0.8rem] uppercase tracking-[0.18em] text-[var(--papel)] disabled:opacity-55 sm:w-auto"
        >
          {pendiente ? "Guardando…" : "Guardar"}
        </button>
        {id && (
          <p className="mt-4 text-[0.9rem] opacity-60">
            La vista previa enseña lo último guardado, también si es un borrador.
          </p>
        )}
      </form>

      {/* El movimiento se guarda aparte (no es parte de este formulario) y se
          ve en vivo en la vista previa del borrador. */}
      {inv && id && (
        <div className="mx-auto max-w-[72rem] border-t border-[var(--tinta)]/15 px-5 py-14">
          <AjustesMovimiento inv={inv} urlVista={`/estudio/vista/${id}`} />
        </div>
      )}
    </>
  );
}
