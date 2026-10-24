"use client";

import { saludoDe, useInvitado } from "@/components/bloques/invitado";

/** «Querida Carmen,» encima de los nombres del rótulo, si el enlace es personal. */
export default function SaludoApertura({ slug }: { slug: string }) {
  const invitado = useInvitado(slug);
  if (!invitado) return null;
  return (
    <p className="display mb-6 text-[clamp(1.5rem,6vw,2.2rem)] italic">{saludoDe(invitado)}</p>
  );
}
