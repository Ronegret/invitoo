"use client";

import { useId } from "react";
import { Magnetico } from "@/components/sistema";
import EnlaceReserva from "@/components/sitio/EnlaceReserva";
import { consultaNombres, useNombres } from "@/components/sitio/nombres";
import s from "./campo.module.css";

/**
 * «Escribid vuestros nombres». Dos campos y una «&» en medio, como se
 * escriben en una invitación. Al escribir, el sobre y la cartulina de la
 * portada se reescriben solos (y, si ya es un móvil, la invitación de
 * dentro). Se guarda en este navegador, nada más: no viaja a ningún sitio.
 *
 * Debajo, los dos botones de la portada. Van aquí porque el primero lleva
 * los nombres: «Abrir una de ejemplo» abre la muestra con vuestros nombres.
 * Sin JavaScript, los dos enlaces funcionan igual (sin nombres).
 */
export default function CampoNombres({
  slug,
  ejemplo,
  reserva,
  fechaMuestra = "",
  abreSobre = false,
}: {
  slug: string;
  ejemplo: [string, string];
  reserva: string;
  /** La fecha de la muestra (ISO), para que la invitación cambie la suya. */
  fechaMuestra?: string;
  /** Si al empezar a escribir se abre el sobre de la portada. */
  abreSobre?: boolean;
}) {
  const [n, poner] = useNombres();
  const id = useId();
  const q = consultaNombres(n.a, n.b, n.fecha, fechaMuestra);
  const hay = Boolean(n.a || n.b || n.fecha);

  const alEnfocar = () => {
    if (abreSobre) window.dispatchEvent(new Event("invitoo:abrir-sobre"));
  };

  return (
    <div className={s.campo}>
      <fieldset className={s.grupo}>
        <legend className={s.leyenda}>Escribid vuestros nombres</legend>
        <div className={s.fila}>
          <label className={s.etiqueta} htmlFor={`${id}-a`}>
            <span className="sr-only">Un nombre</span>
            <input
              id={`${id}-a`}
              className={s.entrada}
              value={n.a}
              onChange={(e) => poner({ a: e.target.value })}
              onFocus={alEnfocar}
              placeholder={ejemplo[0]}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              maxLength={24}
              enterKeyHint="next"
            />
          </label>
          <span className={s.y} aria-hidden>
            &amp;
          </span>
          <label className={s.etiqueta} htmlFor={`${id}-b`}>
            <span className="sr-only">El otro nombre</span>
            <input
              id={`${id}-b`}
              className={s.entrada}
              value={n.b}
              onChange={(e) => poner({ b: e.target.value })}
              onFocus={alEnfocar}
              placeholder={ejemplo[1]}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              maxLength={24}
              enterKeyHint="done"
            />
          </label>
        </div>
        <label className={s.fechaFila}>
          <span className={s.fechaEtiqueta}>Y la fecha</span>
          <input
            type="date"
            className={s.fecha}
            value={n.fecha}
            onChange={(e) => poner({ fecha: e.target.value })}
            onFocus={alEnfocar}
            min="2025-01-01"
            max="2035-12-31"
          />
        </label>
        <p className={s.ayuda} aria-live="polite">
          {hay ? (
            <>
              Así se leen en la invitación.{" "}
              <button type="button" className={s.borrar} onClick={() => poner({ a: "", b: "", fecha: "" })}>
                Borrar
              </button>
            </>
          ) : (
            "Se quedan en este navegador. No los ve nadie más."
          )}
        </p>
      </fieldset>

      <div className={s.botones}>
        <Magnetico fuerza={4} className={s.magnetico}>
          <a href={`/i/${slug}${q ? `?${q}` : ""}`} className={`boton-lleno ${s.principal}`} data-petalos>
            Abrir una de ejemplo
          </a>
        </Magnetico>
        <EnlaceReserva href={reserva} className={`boton ${s.secundario}`} data-petalos>
          Hablamos 20 minutos
        </EnlaceReserva>
      </div>
    </div>
  );
}
