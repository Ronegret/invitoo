import { ANADIDOS, euros } from "@/data/sitio";

/**
 * Los añadidos, como una carta: nombre y nota a la izquierda, precio a la
 * derecha alineado por la cifra. Se comparan de arriba abajo de un vistazo,
 * que es para lo que sirve una lista de precios.
 */
export default function Anadidos() {
  return (
    <ul className="border-t border-[var(--tinta)]/15">
      {ANADIDOS.map((a) => (
        <li
          key={a.nombre}
          className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 border-b border-[var(--tinta)]/15 py-6"
        >
          <h3 className="display text-[1.5rem] leading-tight">{a.nombre}</h3>
          <p className="text-right tabular-nums">
            {a.desde && <span className="mr-1 text-[1rem] opacity-60">desde</span>}
            <span className="display text-[1.7rem]">{euros(a.precio)} €</span>
            {a.unidad && (
              <span className="block text-[1rem] opacity-60">{a.unidad}</span>
            )}
          </p>
          <p className="col-span-2 max-w-[40rem] text-[1rem] leading-[1.65] opacity-70 sm:col-span-1">
            {a.nota}
          </p>
        </li>
      ))}
    </ul>
  );
}
