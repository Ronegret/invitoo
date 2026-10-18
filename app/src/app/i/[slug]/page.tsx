import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Apertura from "@/components/aperturas/Apertura";
import BotonSonido from "@/components/BotonSonido";
import BarraDemo from "@/components/sitio/BarraDemo";
import { PLANTILLAS } from "@/data/plantillas";
import SelloAlianzas from "@/components/SelloAlianzas";
import { MAQUETAS } from "@/plantillas";
import { listarSlugsPublicados, obtenerInvitacion } from "@/lib/datos";
import type { Bloque } from "@/lib/tipos";

/**
 * Se pre-renderizan las invitaciones que ya existen. Las que se publiquen
 * después se generan la primera vez que alguien las abre y quedan en caché:
 * montar una boda nueva no obliga a desplegar.
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
  const fecha = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
    new Date(inv.pareja.fecha),
  );
  return {
    title: `${a} & ${b} · ${fecha}`,
    description: `Nos casamos el ${fecha}. Aquí está todo: la hora, el sitio, cómo llegar y cómo confirmar.`,
    openGraph: {
      title: `${a} & ${b}`,
      description: `Nos casamos el ${fecha}.`,
      images: inv.apertura ? [inv.apertura.poster] : undefined,
    },
    // Una invitación es privada: se comparte por enlace, no se busca en Google.
    robots: { index: false, follow: false },
  };
}

export default async function Invitacion({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const consulta = await searchParams;
  const inv = await obtenerInvitacion(slug);
  if (!inv || inv.estado !== "publicada") notFound();

  const muestra = PLANTILLAS.find((p) => p.demo === slug);

  // Variante de color: /i/slug?c=verdeoscuro. Es lo que convierte doce
  // diseños en treinta y seis opciones sin rediseñar nada, porque la paleta
  // de una boda son tres variables CSS y nada más.
  const plantilla = PLANTILLAS.find((p) => p.id === inv.plantilla);
  const pedida = typeof consulta.c === "string" ? consulta.c : "";
  const variante = plantilla?.variantes.find((v) => v.id === pedida);
  const tema = variante
    ? { ...inv.tema, tinta: variante.tinta, papel: variante.papel, acento: variante.acento }
    : inv.tema;

  // El enlace puede venir con el nombre del invitado: /i/slug?n=Carmen&a=1
  // Es lo que hace que la invitación se sienta escrita para quien la abre.
  const nombre = typeof consulta.n === "string" ? consulta.n.slice(0, 40).trim() : "";
  const saludo = nombre
    ? {
        nombre,
        acompanantes: Math.min(8, Math.max(0, Number(consulta.a) || 0)),
      }
    : null;

  /**
   * El buscador de bloques que recibe la maqueta. Los datos de la boda
   * siguen siendo el JSON de Supabase —un itinerario, una galería, un
   * dress code—; lo que cambia según la plantilla es dónde se coloca cada
   * cosa, y eso lo decide su archivo.
   */
  const buscar = <T extends Bloque["t"]>(t: T) =>
    inv.bloques.find((x) => x.t === t) as Extract<Bloque, { t: T }> | undefined;

  const Maqueta = MAQUETAS[inv.plantilla] ?? MAQUETAS.sobre;

  return (
    <main
      className="grano relative min-h-dvh overflow-x-clip"
      style={
        {
          "--tinta": tema.tinta,
          "--papel": tema.papel,
          "--acento": tema.acento,
          "--grano": tema.grano ?? 0.035,
          background: "var(--papel)",
          color: "var(--tinta)",
        } as React.CSSProperties
      }
    >
      <Apertura inv={inv} saludo={saludo} />

      {/* Si es una de las muestras del catálogo, se puede contratar desde
          aquí mismo: una demo que no se puede pedir no vende nada. */}
      {muestra && (
        <BarraDemo
          plantilla={muestra.id}
          nombre={muestra.nombre}
          variantes={muestra.variantes}
          activa={variante?.id ?? muestra.variantes[0].id}
          slug={slug}
        />
      )}

      {inv.musica && (
        <BotonSonido url={inv.musica.url} titulo={inv.musica.titulo} />
      )}

      {/* Aquí entra la plantilla. Doce archivos, doce páginas distintas. */}
      <Maqueta inv={inv} b={buscar} />

      {/* La firma. Es la puerta de entrada del motor de referidos:
          120 personas en edad de casarse ven esto en cada boda. */}
      <footer className="flex flex-col items-center gap-3 px-6 pb-16 pt-10">
        <SelloAlianzas size={26} className="opacity-40" />
        <a
          href="/para-invitados"
          className="inline-flex min-h-12 items-center px-4 py-3 text-[0.76rem] uppercase tracking-[0.3em] opacity-45"
        >
          Diseñado por Invitoo
        </a>
      </footer>
    </main>
  );
}
