import { notFound, redirect } from "next/navigation";
import Cuerpo from "@/app/i/[slug]/Cuerpo";
import { obtenerPorId } from "@/lib/datos";
import { sesionValida } from "../../sesion";

/**
 * Vista previa de una boda tal como está guardada, aunque sea un borrador.
 * Vive dentro de /estudio: la protegen el proxy, el layout y esta comprobación.
 */
export default async function VistaPrevia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await sesionValida())) redirect("/entrar");
  const { id } = await params;
  const inv = await obtenerPorId(id);
  if (!inv) notFound();

  return (
    <>
      <p
        role="status"
        className="sticky top-0 z-50 bg-[var(--tinta)] px-5 py-3 text-center text-[0.85rem] text-[var(--papel)]"
      >
        Vista previa · {inv.estado === "publicada" ? "publicada" : inv.estado} · lo último guardado
      </p>
      <Cuerpo inv={inv} conBarraDemo={false} />
    </>
  );
}
