import Icono from "@/components/Iconos";
import { DIRECTO, OPCIONES_DIRECTO, euros } from "@/data/sitio";

/**
 * «En directo» en /precios: la misma hoja de tres columnas que los planes,
 * para que se lea como parte de la misma carta. El álbum (incluido), En
 * directo (el que recomendamos, en negativo) y el Gestionado.
 *
 * Precios, límites y listas salen de `lib/momentos/planes.ts` a través de
 * `OPCIONES_DIRECTO`: aquí no se escribe ningún número.
 */
export default function TablaDirecto({ titulos = "h3" }: { titulos?: "h2" | "h3" }) {
  const T = titulos;
  return (
    <div>
      <ol className="grid gap-px overflow-hidden border border-[var(--tinta)]/15 bg-[var(--tinta)]/15 lg:grid-cols-3">
        {OPCIONES_DIRECTO.map((o) => {
          const negativo = o.destacado;
          return (
            <li
              key={o.id}
              className={`flex flex-col p-7 sm:p-10 ${
                negativo ? "bg-[var(--tinta)] text-[var(--papel)]" : "bg-[var(--papel)]"
              }`}
            >
              <T className="display text-[clamp(1.9rem,3.4vw,2.4rem)] leading-[1.05]">{o.nombre}</T>
              <p className="mt-3 text-[1rem] leading-[1.6] opacity-70">{o.resumen}</p>

              <p className="mt-8 flex items-baseline gap-2">
                {o.precio > 0 ? (
                  <>
                    <span className="display text-[clamp(3rem,5vw,3.8rem)] leading-none tabular-nums">
                      {euros(o.precio)}
                    </span>
                    <span className="display text-[1.6rem]">€</span>
                  </>
                ) : (
                  <span className="display text-[clamp(2.2rem,4vw,2.8rem)] leading-none">Incluido</span>
                )}
              </p>
              <p className={`mt-2 text-[1rem] ${negativo ? "text-[#e8b9bf]" : "opacity-60"}`}>
                {o.precio > 0 ? `IVA incluido.${o.incluido ? ` ${o.incluido}.` : ""}` : `${o.incluido}.`}
              </p>

              {o.base && <p className="mt-8 text-[1rem] font-semibold">{o.base}</p>}
              <ul className={`${o.base ? "mt-3" : "mt-8"} flex flex-1 flex-col gap-3`}>
                {o.incluye.map((linea) => (
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

              {o.nota && (
                <p className="mt-8 border-t border-current/15 pt-5 text-[1rem] leading-[1.6] opacity-60">
                  {o.nota}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 border-b border-[var(--tinta)]/15 pb-6">
        <h3 className="display text-[1.5rem] leading-tight">{DIRECTO.conservar.nombre}</h3>
        <p className="text-right tabular-nums">
          <span className="display text-[1.7rem]">{euros(DIRECTO.conservar.precio)} €</span>
        </p>
        <p className="col-span-2 max-w-[40rem] text-[1rem] leading-[1.65] opacity-70">
          {`Las fotos, los vídeos y los mensajes siguen online ${DIRECTO.conservar.meses} meses más, para quien no ha terminado de descargarlas. Se puede pedir las veces que haga falta.`}
        </p>
      </div>
      <p className="mt-6 max-w-[44rem] text-[1rem] leading-[1.7] opacity-70">
        En el salón solo hace falta {DIRECTO.local.charAt(0).toLowerCase() + DIRECTO.local.slice(1)}.
        Sin pantalla, el álbum de la invitación sigue recogiendo las fotos igual.
      </p>
    </div>
  );
}
