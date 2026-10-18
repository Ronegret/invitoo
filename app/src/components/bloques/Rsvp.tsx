"use client";

import { useActionState, useState } from "react";
import { confirmarAsistencia, type Resultado } from "@/app/acciones";
import SelloAlianzas from "@/components/SelloAlianzas";

/**
 * Confirmación de asistencia.
 *
 * SIN LOGIN. Pedirle a la tía Mari que se cree una cuenta es el mayor
 * generador de fricción posible en este producto: un nombre y ya está.
 *
 * El menú, las alergias y el autobús solo aparecen si esa boda los pide, y
 * solo si el invitado ha dicho que viene. Nadie rellena un campo que no le
 * toca.
 */
export default function Rsvp({
  slug,
  pideMenu,
  pideAlergias,
  pideBus,
}: {
  slug: string;
  pideMenu?: boolean;
  pideAlergias?: boolean;
  pideBus?: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState<Resultado | null, FormData>(
    confirmarAsistencia,
    null,
  );
  const [viene, setViene] = useState<boolean | null>(null);
  const [faltaElegir, setFaltaElegir] = useState(false);

  if (estado?.ok) {
    return (
      <section id="confirmar" className="scroll-mt-16 px-6 py-24 text-center">
        <SelloAlianzas size={54} className="mx-auto text-[var(--acento)]" />
        <p className="display mt-8 text-[clamp(1.9rem,8vw,2.8rem)]">
          {estado.mensaje}
        </p>
      </section>
    );
  }

  const campo =
    "mt-2 w-full border-b border-current/25 bg-transparent py-3 text-[1.05rem] outline-none placeholder:opacity-35 focus:border-[var(--acento)]";
  const etiqueta = "block text-[0.78rem] uppercase tracking-[0.26em] opacity-55";

  return (
    <section id="confirmar" className="scroll-mt-16 px-6 py-24">
      <div className="mx-auto max-w-[30rem]">
        <h2 className="display text-center text-[clamp(2.2rem,9vw,3.2rem)]">
          ¿Vienes?
        </h2>
        <p className="mt-5 text-center text-[1rem] leading-relaxed opacity-70">
          Con que nos lo digas antes de un mes de la boda nos vale. Si cambia
          algo, se avisa y ya está.
        </p>

        <form
          action={enviar}
          onSubmit={(e) => {
            if (viene === null) {
              e.preventDefault();
              setFaltaElegir(true);
            }
          }}
          className="mt-12 flex flex-col gap-9"
        >
          <input type="hidden" name="invitacion" value={slug} />

          <div>
            <label htmlFor="nombre" className={etiqueta}>
              Tu nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              autoComplete="name"
              placeholder="Ana García"
              className={campo}
            />
          </div>

          <fieldset>
            <legend className={etiqueta}>¿Contamos contigo?</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { v: "si", t: "Sí, allí estaré" },
                { v: "no", t: "No voy a poder" },
              ].map((o) => (
                <label
                  key={o.v}
                  className="flex min-h-14 cursor-pointer items-center justify-center rounded-full border px-4 text-center text-[0.92rem] transition-colors has-[:checked]:border-[var(--acento)] has-[:checked]:bg-[var(--acento)] has-[:checked]:text-[var(--papel)]"
                  style={{ borderColor: "color-mix(in srgb, currentColor 25%, transparent)" }}
                >
                  {/* Sin `required`: este radio va oculto (sr-only) y el
                      navegador no puede enseñar su aviso encima de algo que
                      no se ve — se limita a no enviar, en silencio. El
                      invitado pulsaría «Confirmar» y no pasaría nada. Se
                      valida aquí abajo y se avisa donde sí se lee. */}
                  {/* El input mide 1 px a propósito: el área táctil es la
                      etiqueta entera, de 56 px. Una auditoría automática lo
                      marca como «pequeño» y no lo es. */}
                  <input
                    type="radio"
                    name="asiste"
                    value={o.v}
                    className="sr-only"
                    onChange={() => {
                      setViene(o.v === "si");
                      setFaltaElegir(false);
                    }}
                  />
                  {o.t}
                </label>
              ))}
            </div>
            {faltaElegir && (
              <p role="alert" className="mt-3 text-[0.92rem] text-[var(--acento)]">
                Dinos si vienes o no.
              </p>
            )}
          </fieldset>

          {viene && (
            <>
              <div>
                <label htmlFor="acompanantes" className={etiqueta}>
                  ¿Vienes con alguien? ¿Cuántos?
                </label>
                <input
                  id="acompanantes"
                  name="acompanantes"
                  type="number"
                  min={0}
                  max={8}
                  defaultValue={0}
                  inputMode="numeric"
                  className={campo}
                />
              </div>

              {pideMenu && (
                <fieldset>
                  <legend className={etiqueta}>Menú</legend>
                  <div className="mt-3 flex flex-col gap-2">
                    {["Normal", "Vegetariano", "Sin gluten", "Menú infantil"].map(
                      (m) => (
                        <label
                          key={m}
                          className="flex min-h-13 cursor-pointer items-center gap-3 border-b border-current/12 text-[1rem] has-[:checked]:text-[var(--acento)]"
                        >
                          <input
                            type="radio"
                            name="menu"
                            value={m}
                            className="accent-[var(--acento)]"
                          />
                          {m}
                        </label>
                      ),
                    )}
                  </div>
                </fieldset>
              )}

              {pideAlergias && (
                <div>
                  <label htmlFor="alergias" className={etiqueta}>
                    ¿Alergia o algo que no puedas comer?
                  </label>
                  <textarea
                    id="alergias"
                    name="alergias"
                    rows={2}
                    placeholder="Frutos secos, marisco…"
                    className={`${campo} resize-none`}
                  />
                </div>
              )}

              {pideBus && (
                <label className="flex min-h-14 cursor-pointer items-center gap-3 text-[1rem]">
                  <input
                    type="checkbox"
                    name="bus"
                    value="si"
                    className="h-5 w-5 accent-[var(--acento)]"
                  />
                  Cogeré el autobús que ponéis
                </label>
              )}
            </>
          )}

          {estado && !estado.ok && (
            <p role="alert" className="text-[0.95rem] text-[var(--acento)]">
              {estado.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="min-h-14 rounded-full bg-[var(--acento)] px-8 text-[0.85rem] uppercase tracking-[0.18em] text-white disabled:opacity-55"
          >
            {pendiente ? "Un segundo…" : "Confirmar"}
          </button>
        </form>
      </div>
    </section>
  );
}
