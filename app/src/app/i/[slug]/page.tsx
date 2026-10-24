import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { redireccionDemo } from "@/data/demo";
import { listarSlugsPublicados, obtenerInvitacion } from "@/lib/datos";
import { formatearFecha } from "@/lib/fecha";
import Medir from "@/lib/visitas/Medir";
import Cuerpo from "./Cuerpo";

/**
 * La invitación. ESTÁTICA de verdad:
 *
 *  · se pre-renderizan las que existen (`generateStaticParams`);
 *  · las que se publiquen después se generan la primera vez que alguien las
 *    abre y quedan en caché (`dynamicParams` por defecto);
 *  · al guardar en el estudio, `revalidatePath('/i/<slug>')` la regenera.
 *
 * Nada de `searchParams` aquí: leerlos la volvía dinámica y cada visita era
 * un SSR con consulta a Supabase. La personalización (`?n=` token del
 * invitado, `?c=` variante de color) se resuelve en el cliente: `?c=` en
 * `Lienzo.tsx`, `?n=` en los componentes del invitado vía `GET /api/invitado`.
 */
export async function generateStaticParams() {
  const slugs = await listarSlugsPublicados();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const inv = await obtenerInvitacion(slug);
  if (!inv) return {};
  const { a, b } = inv.pareja;
  const fecha = formatearFecha(inv.pareja.fecha);
  return {
    title: `${a} & ${b} · ${fecha}`,
    description: `Nos casamos el ${fecha}. Aquí está todo: la hora, el sitio, cómo llegar y cómo confirmar.`,
    // La imagen la pone `opengraph-image.tsx` de este mismo segmento.
    openGraph: {
      title: `${a} & ${b}`,
      description: `Nos casamos el ${fecha}.`,
    },
    // Una invitación es privada: se comparte por enlace, no se busca en Google.
    robots: { index: false, follow: false },
  };
}

export default async function Invitacion({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Demos de las plantillas fusionadas: /i/<slug viejo> → la demo nueva con
  // la variante que mejor la recuerda. Los enlaces viejos siguen vivos.
  const destino = redireccionDemo(slug);
  if (destino) redirect(destino);
  const inv = await obtenerInvitacion(slug);
  if (!inv || inv.estado !== "publicada") notFound();

  return (
    <>
      <Cuerpo inv={inv} />
      {/* Aperturas por boda (o vistas de plantilla en las demos), sin cookies: lib/visitas. */}
      <Medir slug={slug} />
    </>
  );
}
