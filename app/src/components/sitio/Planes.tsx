import Link from "next/link";
import Icono from "@/components/Iconos";
import BotonEnviar from "@/components/pagos/BotonEnviar";
import { CONDICIONES, GARANTIA, PLANES, euros } from "@/data/sitio";
import { enlaceReserva, mensajePlan } from "@/lib/contacto";
import { reservarPlan } from "@/lib/pagos/acciones-planes";
import { modoCobro } from "@/lib/pagos/modo";
import { esPlanCerrado } from "@/lib/pagos/productos";

/**
 * Los tres planes.
 *
 * No son tres tarjetas iguales con sombra: son tres columnas de una misma
 * hoja, separadas por un filete, y la del medio —con canción— va impresa en
 * negativo. Así se ve cuál recomendamos sin poner una insignia de «el más
 * vendido» que no podríamos respaldar con datos.
 *
 * Cada plan dice lo que incluye y lo que NO. Lo segundo es lo que hace que
 * el de 149 € no parezca incompleto y el de 249 € no parezca caro: se ve
 * exactamente qué se paga.
 *
 * El botón de los planes con precio cerrado es un formulario: la acción de
 * servidor `reservarPlan` abre Stripe Checkout con el importe que dicta
 * `planes-boda.ts` (el navegador solo dice qué plan). En local sin claves
 * lleva al pago demo. En producción sin clave, a la videollamada, con un
 * texto que dice a dónde lleva de verdad. El Estudio se habla siempre.
 */
export default function Planes({ titulos = "h3" }: { titulos?: "h2" | "h3" }) {
  const T = titulos;
  const enLinea = modoCobro() !== "no";

  return (
    <div>
      <ol className="grid gap-px overflow-hidden border border-[var(--tinta)]/15 bg-[var(--tinta)]/15 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const negativo = plan.destacado;
          const pagable = enLinea && esPlanCerrado(plan.id);
          const estiloBoton = `mt-10 inline-flex min-h-14 w-full items-center justify-center rounded-full px-6 text-[1rem] ${
            negativo
              ? "bg-[var(--papel)] text-[var(--tinta)] transition-transform duration-200 ease-out hover:scale-[1.02]"
              : "boton border border-[var(--tinta)]/30"
          }`;

          return (
            <li
              key={plan.id}
              className={`relative flex flex-col p-7 sm:p-10 ${
                negativo
                  ? "bg-[var(--tinta)] text-[var(--papel)]"
                  : "bg-[var(--papel)]"
              }`}
            >
              {negativo && (
                <p className="mb-5 text-[1rem] text-[#e8b9bf]">
                  El que recomendamos
                </p>
              )}
              <T className="display text-[clamp(1.9rem,3.4vw,2.4rem)] leading-[1.05]">
                {plan.nombre}
              </T>
              <p className="mt-3 text-[1rem] leading-[1.6] opacity-70">
                {plan.resumen}
              </p>

              <p className="mt-8 flex items-baseline gap-2">
                {plan.desde && <span className="text-[1rem] opacity-60">desde</span>}
                <span className="display text-[clamp(3.4rem,6vw,4.4rem)] leading-none tabular-nums">
                  {euros(plan.precio)}
                </span>
                <span className="display text-[1.8rem]">€</span>
              </p>
              <p className="mt-2 text-[1rem] opacity-60">
                IVA incluido. {plan.plazo}.
              </p>

              {plan.base && (
                <p className="mt-8 text-[1rem] font-semibold">{plan.base}</p>
              )}
              <ul className={`${plan.base ? "mt-3" : "mt-8"} flex flex-col gap-3`}>
                {plan.incluye.map((linea) => (
                  <li key={linea} className="flex gap-3 text-[1rem] leading-[1.55]">
                    <span
                      aria-hidden
                      className={`mt-0.5 shrink-0 ${negativo ? "text-[#e8b9bf]" : "text-[var(--acento)]"}`}
                    >
                      <Icono id="check" size={17} />
                    </span>
                    {linea}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex-1 border-t border-current/15 pt-6">
                <p className="text-[1rem] opacity-60">No incluye</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {plan.noIncluye.map((linea) => (
                    <li key={linea} className="text-[1rem] leading-[1.55] opacity-60">
                      {linea}
                    </li>
                  ))}
                </ul>
              </div>

              {pagable ? (
                <form action={reservarPlan}>
                  <input type="hidden" name="plan" value={plan.id} />
                  <BotonEnviar className={estiloBoton}>Reservar por {plan.precio} €</BotonEnviar>
                  <p className="mt-3 text-center text-[1rem] leading-[1.5] opacity-70 lg:min-h-[4.5rem]">
                    Si cambiáis de idea antes de empezar el diseño, os lo devolvemos entero.{" "}
                    <Link href="/condiciones" className="underline underline-offset-4">
                      Condiciones
                    </Link>
                  </p>
                </form>
              ) : (
                <div>
                  <a
                    href={enlaceReserva(mensajePlan(plan.nombre))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={estiloBoton}
                  >
                    {plan.id === "estudio" ? "Contadnos vuestra idea" : "Reservar la videollamada"}
                  </a>
                  {plan.id === "estudio" && (
                    <p className="mt-3 text-center text-[1rem] leading-[1.5] opacity-70 lg:min-h-[4.5rem]">
                      Os mandamos el presupuesto cerrado y lo pagáis con un enlace seguro.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* La garantía y las condiciones valen para los tres: van una vez. */}
      <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <p className="display text-[clamp(1.6rem,3.4vw,2.2rem)] leading-[1.15]">
            {GARANTIA.titulo}.
          </p>
          <p className="mt-3 max-w-[34rem] text-[1.04rem] leading-[1.7] opacity-70">
            {GARANTIA.texto}
          </p>
        </div>
        <ul className="flex flex-col gap-2 lg:col-span-5">
          {CONDICIONES.map((c) => (
            <li key={c} className="flex gap-3 text-[1rem] leading-[1.6] opacity-75">
              <span aria-hidden className="mt-0.5 shrink-0 text-[var(--acento)]">
                <Icono id="check" size={17} />
              </span>
              {c}
            </li>
          ))}
          <li className="flex gap-3 text-[1rem] leading-[1.6] opacity-75">
            <span aria-hidden className="mt-0.5 shrink-0 text-[var(--acento)]">
              <Icono id="candado" size={17} />
            </span>
            Pago seguro con Stripe
          </li>
        </ul>
      </div>
    </div>
  );
}
