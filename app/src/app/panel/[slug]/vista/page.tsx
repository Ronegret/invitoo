import type { Metadata } from "next";
import Cuerpo from "@/app/i/[slug]/Cuerpo";
import { exigirPanel, invitacionDelPanel } from "@/components/panel/cargar";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Vista previa de la invitación tal como está guardada, aunque sea un
 * borrador, con el acceso del panel (estudio, cuenta o enlace). Es la que
 * usa `<AjustesMovimiento urlVista>` cuando la invitación no está publicada.
 * Vive fuera del grupo `(secciones)` para no llevar la navegación del panel.
 */
export default async function VistaPanel({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await exigirPanel(slug);
  const inv = await invitacionDelPanel(slug);
  return <Cuerpo inv={inv} conBarraDemo={false} />;
}
