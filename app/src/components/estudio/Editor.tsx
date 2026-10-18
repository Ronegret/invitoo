"use client";

import { useActionState } from "react";
import Link from "next/link";
import { guardarDesdeEstudio, type Resultado } from "@/app/acciones";
import { PLANTILLAS } from "@/data/plantillas";
import type { Invitacion } from "@/lib/tipos";

/**
 * El editor de una boda.
 *
 * Los datos de cabecera van en campos; los bloques, en un textarea con el
 * JSON. No es pereza: un constructor visual de bloques es semanas de trabajo
 * y aquí dentro solo entra el estudio, que sabe leer JSON. El servidor valida
 * antes de guardar, así que un JSON roto no llega a publicarse.
 *
 * Cuando el volumen lo pida, este textarea se sustituye por una lista
 * ordenable sin tocar nada más: el modelo de datos ya es el bueno.
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

  const fechaLocal = inv
    ? new Date(inv.pareja.fecha).toISOString().slice(0, 16)
    : "";

  return (
    <form action={enviar} className="mx-auto max-w-[44rem] px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-[clamp(2rem,7vw,2.8rem)]">
          {inv ? `${inv.pareja.a} & ${inv.pareja.b}` : "Nueva boda"}
        </h1>
        <Link href="/estudio" className="text-[0.79rem] uppercase tracking-[0.18em] opacity-55">
          Volver
        </Link>
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
          <span className={etiqueta}>Fecha y hora</span>
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

      <label className="mt-14 block">
        <span className={etiqueta}>Bloques (JSON) — el orden es el de la página</span>
        <textarea
          name="bloques"
          rows={22}
          spellCheck={false}
          defaultValue={JSON.stringify(inv?.bloques ?? [], null, 2)}
          className="mt-3 w-full rounded-lg border border-[var(--tinta)]/20 bg-[var(--papel)] p-4 font-mono text-[0.82rem] leading-relaxed outline-none focus:border-[var(--acento)]"
        />
      </label>

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
    </form>
  );
}
