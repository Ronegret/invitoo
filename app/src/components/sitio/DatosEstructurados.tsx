import { ANADIDOS, DIRECTO, OPCIONES_DIRECTO, PLANES, PREGUNTAS } from "@/data/sitio";
import { EMAIL, INSTAGRAM, WHATSAPP } from "@/lib/contacto";

const URL_BASE = "https://invitoo.es";

/**
 * Datos estructurados (JSON-LD). Salen de las mismas listas que se pintan en
 * la página, así que no pueden prometer un precio o una respuesta que no
 * esté a la vista.
 *
 * `negocio`: Invitoo como ProfessionalService (un tipo de LocalBusiness) con
 * su catálogo de ofertas. No lleva dirección postal a propósito: se trabaja
 * a distancia, y una dirección inventada es peor que ninguna.
 * `preguntas`: FAQPage.
 */
export default function DatosEstructurados({
  tipo,
}: {
  tipo: "negocio" | "preguntas";
}) {
  const datos =
    tipo === "preguntas"
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: PREGUNTAS.map((p) => ({
            "@type": "Question",
            name: p.q,
            acceptedAnswer: { "@type": "Answer", text: p.a },
          })),
        }
      : {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "@id": `${URL_BASE}/#invitoo`,
          name: "Invitoo",
          url: URL_BASE,
          logo: `${URL_BASE}/marca/lockup.svg`,
          description:
            "Invitaciones de boda digitales a medida: apertura cinematográfica con los nombres de la pareja, canción original, confirmación de asistencia por persona, panel de los novios y fotos de los invitados en directo en la TV del salón el día de la boda.",
          email: EMAIL,
          telephone: `+${WHATSAPP}`,
          areaServed: { "@type": "Country", name: "España" },
          priceRange: `${Math.min(...PLANES.map((p) => p.precio))}–${Math.max(...PLANES.map((p) => p.precio))} €`,
          sameAs: [`https://instagram.com/${INSTAGRAM}`],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Invitaciones de boda",
            itemListElement: [
              ...PLANES.map((p) => ({
                "@type": "Offer",
                name: p.nombre,
                description: p.resumen,
                url: `${URL_BASE}/precios`,
                priceSpecification: {
                  "@type": p.desde ? "PriceSpecification" : "UnitPriceSpecification",
                  price: p.precio,
                  ...(p.desde ? { minPrice: p.precio } : {}),
                  priceCurrency: "EUR",
                  valueAddedTaxIncluded: true,
                },
                itemOffered: {
                  "@type": "Service",
                  name: `Invitación de boda digital · ${p.nombre}`,
                  serviceType: "Invitación de boda digital",
                  provider: { "@id": `${URL_BASE}/#invitoo` },
                },
              })),
              ...ANADIDOS.map((a) => ({
                "@type": "Offer",
                name: a.nombre,
                description: a.nota,
                url: `${URL_BASE}/precios`,
                priceSpecification: {
                  "@type": "PriceSpecification",
                  price: a.precio,
                  ...(a.desde ? { minPrice: a.precio } : {}),
                  priceCurrency: "EUR",
                  valueAddedTaxIncluded: true,
                },
              })),
              // «En directo»: los precios salen de lib/momentos/planes.ts.
              ...OPCIONES_DIRECTO.filter((o) => o.precio > 0).map((o) => ({
                "@type": "Offer",
                name: o.nombre,
                description: `${o.resumen} ${o.incluye.join(". ")}.`,
                url: `${URL_BASE}/precios#en-directo`,
                priceSpecification: {
                  "@type": "PriceSpecification",
                  price: o.precio,
                  priceCurrency: "EUR",
                  valueAddedTaxIncluded: true,
                },
                itemOffered: {
                  "@type": "Service",
                  name: `${o.nombre} · fotos y mensajes de los invitados en directo`,
                  serviceType: "Galería de fotos en directo para bodas",
                  provider: { "@id": `${URL_BASE}/#invitoo` },
                },
              })),
              {
                "@type": "Offer",
                name: DIRECTO.conservar.nombre,
                description: `Las fotos, los vídeos y los mensajes del día de la boda, online ${DIRECTO.conservar.meses} meses más.`,
                url: `${URL_BASE}/precios#en-directo`,
                priceSpecification: {
                  "@type": "PriceSpecification",
                  price: DIRECTO.conservar.precio,
                  priceCurrency: "EUR",
                  valueAddedTaxIncluded: true,
                },
              },
            ],
          },
        };

  return (
    <script
      type="application/ld+json"
      // Contenido propio, generado arriba. Se escapa `<` igualmente, como
      // recomienda la guía de Next (docs/01-app/02-guides/json-ld.md).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}
