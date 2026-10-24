"use client";

import { fraseDatos, useNombres } from "@/components/sitio/nombres";

/**
 * Un enlace a la conversación que ya lleva lo que la pareja ha escrito en
 * la web (nombres y fecha). Si el destino es WhatsApp, el mensaje sale
 * escrito con esos datos; si es la agenda, va tal cual. Sin JavaScript o
 * antes de hidratar, es el enlace del servidor: nunca se queda sin destino.
 */
export default function EnlaceReserva({
  href,
  mensaje = "Hola, queremos una invitación para nuestra boda.",
  children,
  ...resto
}: {
  href: string;
  mensaje?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"a">, "href" | "children">) {
  const [n] = useNombres();
  const datos = fraseDatos(n);
  let destino = href;
  if (datos && href.startsWith("https://wa.me/")) {
    const base = href.split("?")[0];
    destino = `${base}?text=${encodeURIComponent(`${mensaje} ${datos}`)}`;
  }
  return (
    <a href={destino} target="_blank" rel="noopener noreferrer" {...resto}>
      {children}
    </a>
  );
}
