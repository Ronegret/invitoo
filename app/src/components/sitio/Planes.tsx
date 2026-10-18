import Icono from "@/components/Iconos";
import Revelar from "@/components/Revelar";
import { COMUNES, PASOS_COMPRA, PLANES } from "@/data/plantillas";
import { enlaceReserva } from "@/lib/contacto";

/**
 * Los planes.
 *
 * Reescrito después de medir a La Qualité, que es quien mejor lo tiene
 * resuelto de toda la competencia española. Tres cosas suyas, y el porqué de
 * cada una:
 *
 *  1. **La banda «incluido en todos los planes».** Antes cada tarjeta decía
 *     «Todo lo del Esencial» y había que leer la de al lado para entender la
 *     que estabas mirando. Sacando lo común arriba, en las tarjetas queda
 *     solo lo que de verdad las separa —que es lo único que ayuda a
 *     elegir— y el plan barato deja de parecer incompleto.
 *  2. **Los cuatro pasos, justo debajo del titular.** Ahí es donde aparece
 *     la pregunta de «¿y después de pagar qué pasa?». Responderla antes de
 *     enseñar el precio cuesta una línea.
 *  3. **El camino de cada plan, en cursiva.** Una frase que dice cómo se
 *     trabaja en ese nivel: «Elegís plantilla → la rediseñamos con lo
 *     vuestro → la aprobáis». Es lo que de verdad se compra.
 *
 * Y una tira de confianza debajo —Stripe, respuesta en 24 h—, que es la
 * última duda antes de pulsar.
 *
 * Los enlaces de pago son los de Stripe que ya estaban en invitoo.es: no se
 * inventa ninguno. El plan sin enlace no lleva botón de comprar sino de
 * hablar, porque un encargo desde cero no se cierra a ciegas.
 */

const CONFIANZA = [
  { icono: "candado", texto: "Pago seguro con Stripe" },
  { icono: "reloj", texto: "Os contestamos en menos de 24 h" },
  { icono: "sobre", texto: "Nada automático: os escribe una persona" },
];

export default function Planes() {
  return (
    <div>
      {/* ── Los cuatro pasos entre pagar y tenerla ────────────────────── */}
      <Revelar>
        <ol className="mx-auto mb-14 flex max-w-[52rem] flex-wrap items-center justify-center gap-x-3 gap-y-3 text-[0.82rem]">
          {PASOS_COMPRA.map((paso, i) => (
            <li key={paso} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden className="text-[var(--oro)] opacity-60">
                  →
                </span>
              )}
              <span className="flex items-center gap-2 opacity-70">
                <span
                  aria-hidden
                  className="grid h-6 w-6 place-items-center rounded-full border border-[var(--oro)]/45 text-[0.68rem]"
                >
                  {i + 1}
                </span>
                {paso}
              </span>
            </li>
          ))}
        </ol>
      </Revelar>

      {/* ── Lo que llevan todos, fuera del comparador ─────────────────── */}
      <Revelar retraso={80}>
        <div className="mx-auto mb-10 max-w-[62rem] border border-[var(--oro)]/25 bg-[var(--papel)] px-7 py-7 sm:px-10">
          <p className="text-center text-[0.72rem] uppercase tracking-[0.34em] text-[var(--oro)]">
            Incluido en todos los planes
          </p>
          <ul className="mt-6 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
            {COMUNES.map((linea) => (
              <li
                key={linea}
                className="flex gap-3 text-[0.92rem] leading-[1.6] opacity-75"
              >
                <span aria-hidden className="mt-0.5 shrink-0 text-[var(--verde)]">
                  <Icono id="check" size={14} />
                </span>
                {linea}
              </li>
            ))}
          </ul>
        </div>
      </Revelar>

      {/* ── Las tarjetas, solo con lo que las diferencia ──────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {PLANES.map((plan, i) => (
          <Revelar
            key={plan.id}
            retraso={i * 90}
            className="plan relative flex flex-col border bg-[var(--papel)] p-8 pt-9 text-center"
            style={{
              borderColor: plan.destacado
                ? "var(--acento)"
                : "color-mix(in srgb, var(--tinta) 14%, transparent)",
            }}
          >
            {plan.destacado && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--acento)] px-4 py-1 text-[0.66rem] uppercase tracking-[0.22em] text-[var(--papel)]">
                El más elegido
              </span>
            )}

            <h3 className="display text-[1.7rem]">{plan.nombre}</h3>
            {/* Tres líneas fijas: sin esto, «Vuestros colores, vuestra
                tipografía y la gente confirmando sola» ocupa una línea más
                que las demás y los cuatro importes quedan a alturas
                distintas. Un comparador con los precios desalineados se lee
                peor y se compara peor. */}
            <p className="min-h-[3.9rem] mt-2 text-[0.9rem] leading-[1.45] opacity-60">
              {plan.resumen}
            </p>

            <p className="display mt-5 text-[2.7rem] leading-none">
              {"desde" in plan && plan.desde && (
                <span className="mr-1.5 text-[0.95rem] opacity-50">desde</span>
              )}
              {plan.precio} €
            </p>
            <p className="mt-2 text-[0.74rem] uppercase tracking-[0.16em] opacity-45">
              IVA incluido · pago único
            </p>

            {/* Cómo se trabaja en este nivel. Es lo que de verdad se compra. */}
            <p className="mt-6 border-y border-[var(--tinta)]/10 py-4 text-[0.84rem] italic leading-[1.6] opacity-65">
              {plan.camino}
            </p>

            <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-left">
              {plan.incluye.map((linea) => (
                <li
                  key={linea}
                  className="flex gap-3 text-[0.9rem] leading-[1.6] opacity-75"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-[var(--verde)]"
                  >
                    <Icono id="check" size={14} />
                  </span>
                  {linea}
                </li>
              ))}
            </ul>

            <a
              href={plan.pago ?? enlaceReserva()}
              target="_blank"
              rel="noopener noreferrer"
              className={`${plan.destacado ? "boton-lleno" : "boton"} mt-9 inline-flex min-h-13 items-center justify-center rounded-full border border-[var(--tinta)]/25 py-3.5 text-[0.76rem] uppercase tracking-[0.18em]`}
              style={
                plan.destacado
                  ? {
                      background: "var(--tinta)",
                      color: "var(--papel)",
                      borderColor: "var(--tinta)",
                    }
                  : undefined
              }
            >
              {plan.pago ? "Contratar" : "Hablamos primero"}
            </a>
          </Revelar>
        ))}
      </div>

      {/* ── La última duda antes de pulsar ────────────────────────────── */}
      <Revelar retraso={120}>
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[0.82rem] opacity-55">
          {CONFIANZA.map((c) => (
            <li key={c.texto} className="flex items-center gap-2.5">
              <span aria-hidden className="text-[var(--oro)]">
                <Icono id={c.icono} size={15} />
              </span>
              {c.texto}
            </li>
          ))}
        </ul>
      </Revelar>
    </div>
  );
}
