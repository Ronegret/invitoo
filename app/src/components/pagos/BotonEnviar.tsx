"use client";

import { useFormStatus } from "react-dom";

/**
 * El botón de un formulario de pago. Mientras el servidor abre Stripe dice
 * «Abriendo el pago…» y no deja un segundo clic. Sin JavaScript, el
 * formulario se envía igual (la acción es de servidor).
 */
export default function BotonEnviar({
  children,
  pendiente = "Abriendo el pago…",
  className = "",
}: {
  children: React.ReactNode;
  pendiente?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} disabled:cursor-progress disabled:opacity-70`}>
      {pending ? pendiente : children}
    </button>
  );
}
