import { notFound } from "next/navigation";
import AjustesEstudio from "@/components/estudio/AjustesEstudio";
import Editor from "@/components/estudio/Editor";
import { onlineHasta } from "@/components/panel/util";
import { obtenerContrato, obtenerExtras, obtenerPorId } from "@/lib/datos";
import { obtenerConfig } from "@/lib/momentos/datos";

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

  const [extras, config, contrato] = await Promise.all([
    obtenerExtras(id),
    obtenerConfig({ inv, id }).catch(() => null),
    obtenerContrato(id),
  ]);
  const porDefecto = onlineHasta(inv.pareja.fecha, null).toISOString().slice(0, 10);

  return (
    <>
      <Editor inv={inv} id={id} />
      <AjustesEstudio
        id={id}
        slug={inv.slug}
        onlineHasta={extras.online_hasta}
        porDefecto={porDefecto}
        plan={config?.plan ?? null}
        anosExtra={config?.anos_extra ?? 0}
        contrato={contrato}
      />
    </>
  );
}
