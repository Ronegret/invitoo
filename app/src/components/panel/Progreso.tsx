/**
 * Progreso de las confirmaciones: una barra sobria en plazas (vienen · no
 * vienen · sin respuesta), con las cifras escritas al lado. La barra no lleva
 * información que no esté también en texto, así que es decorativa para el
 * lector de pantalla y la lista de abajo es la que cuenta.
 */
export default function Progreso({
  vienen,
  noVienen,
  pendientes,
}: {
  vienen: number;
  noVienen: number;
  pendientes: number;
}) {
  const total = vienen + noVienen + pendientes;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  const respondido = total ? Math.round(((vienen + noVienen) / total) * 100) : 0;
  const tramos = [
    { n: vienen, texto: "Vienen", color: "var(--verde)", muestra: "bg-[var(--verde)]" },
    { n: noVienen, texto: "No vienen", color: "#B9B1A9", muestra: "bg-[#B9B1A9]" },
    { n: pendientes, texto: "Sin respuesta", color: "var(--acento-claro)", muestra: "bg-[var(--acento-claro)] ring-1 ring-inset ring-[var(--acento)]/30" },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="display text-[2.4rem] leading-none tabular-nums">
          {respondido}
          <span className="text-[1.3rem]">%</span>
        </p>
        <p className="text-[0.92rem] text-[var(--suave)]">ya ha contestado</p>
      </div>
      <div aria-hidden="true" className="mt-4 flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-[#EFECE8]">
        {tramos.map(
          (t) =>
            t.n > 0 && (
              <span
                key={t.texto}
                className="h-full first:rounded-l-full last:rounded-r-full motion-safe:transition-[width] motion-safe:duration-700"
                style={{ width: `${pct(t.n)}%`, background: t.color }}
              />
            ),
        )}
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-3 text-[0.9rem]">
        {tramos.map((t) => (
          <li key={t.texto} className="flex items-start gap-2">
            <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${t.muestra}`} />
            <span>
              <span className="block font-medium tabular-nums">{t.n}</span>
              <span className="text-[var(--suave)]">{t.texto}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.82rem] text-[var(--suave)]">En plazas: cada persona cuenta una.</p>
    </div>
  );
}
