"use client";

import { useActionState } from "react";
import { dejarMensaje, type Resultado } from "@/app/acciones";
import Icono from "@/components/Iconos";

/**
 * El muro de mensajes.
 *
 * Se escribe, no se lee: los mensajes no se publican en la invitación. Van a
 * los novios y se les entregan al final. Así nadie se corta al escribir y
 * nadie compite por quedar mejor que el anterior.
 */
export default function Muro({ slug }: { slug: string }) {
  const [estado, enviar, pendiente] = useActionState<Resultado | null, FormData>(
    dejarMensaje,
    null,
  );

  const campo =
    "mt-2 w-full rounded-none border-b-2 border-current/30 bg-transparent py-3 text-[1.125rem] outline-none focus:border-[var(--acento-texto,var(--acento))]";

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-[30rem] text-center">
        <Icono id="mensaje" size={26} className="mx-auto text-[var(--acento-texto,var(--acento))]" />
        <h2 className="display mt-4 text-[clamp(2.1rem,9vw,3.1rem)]">
          Escríbenos algo
        </h2>

        {estado?.ok ? (
          <p role="status" className="mt-8 text-[1.0625rem] leading-relaxed">
            {estado.mensaje}
          </p>
        ) : (
          <>
            <p className="mt-6 text-[1.0625rem] leading-relaxed opacity-85">
              Un consejo, una anécdota, una tontería. Lo recopilamos todo y se lo
              damos a los novios el día de la boda.
            </p>

            <form action={enviar} className="mt-10 text-left">
              <input type="hidden" name="invitacion" value={slug} />
              <label htmlFor="muro-nombre" className="block text-[1rem] font-medium">
                Tu nombre
              </label>
              <input
                id="muro-nombre"
                name="nombre"
                required
                autoComplete="name"
                className={campo}
              />

              <label
                htmlFor="muro-mensaje"
                className="mt-8 block text-[1rem] font-medium"
              >
                Tu mensaje
              </label>
              <textarea
                id="muro-mensaje"
                name="mensaje"
                rows={4}
                required
                className={`${campo} resize-none`}
              />

              {estado && !estado.ok && (
                <p role="alert" className="mt-4 text-[1rem] font-medium text-[var(--acento-texto,var(--acento))]">
                  {estado.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pendiente}
                className="mt-9 min-h-14 w-full rounded-full border border-current/30 px-8 text-[1.0625rem] font-medium disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))]"
              >
                {pendiente ? "Un segundo…" : "Enviar"}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
