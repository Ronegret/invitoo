import { notFound } from "next/navigation";
import Editor from "@/components/estudio/Editor";
import { obtenerPorId } from "@/lib/datos";

export default async function EditarBoda({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // /estudio/nueva entra por aquí a propósito: es el mismo formulario vacío.
  if (id === "nueva") return <Editor inv={null} id={null} />;

  const inv = await obtenerPorId(id);
  if (!inv) notFound();

  return <Editor inv={inv} id={id} />;
}
