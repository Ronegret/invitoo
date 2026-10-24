import type { ReactNode } from "react";
import { ui } from "./estilos";

/** La cabecera de cada sección: contexto pequeño, título y, si hace falta, acciones. */
export default function Cabecera({
  eyebrow,
  titulo,
  children,
  acciones,
}: {
  eyebrow?: string;
  titulo: string;
  children?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className={ui.eyebrow}>{eyebrow}</p>}
        <h1 className={`${ui.h1} mt-1.5`}>{titulo}</h1>
        {children && <div className={`mt-2 max-w-[40rem] ${ui.texto} ${ui.suave}`}>{children}</div>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2 sm:shrink-0">{acciones}</div>}
    </header>
  );
}

/** Un estado vacío: qué es esto, por qué está vacío y qué hacer. */
export function Vacio({ titulo, children, accion }: { titulo: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--linea)] px-5 py-10 text-center">
      <p className="display text-[1.3rem]">{titulo}</p>
      <p className={`mx-auto mt-2 max-w-[30rem] ${ui.texto} ${ui.suave}`}>{children}</p>
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}
