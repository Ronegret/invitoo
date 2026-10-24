"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { Resultado } from "@/app/panel/tipos";
import { ui } from "./estilos";

/**
 * Un formulario del panel: acción de servidor + mensaje de resultado en una
 * región viva (lo lee el lector de pantalla) + botón con estado «Guardando…».
 * Funciona también antes de hidratar: es un `<form action>` normal.
 *
 * `limpiar`: vacía el formulario cuando sale bien (alta de invitados).
 * `confirmar`: pregunta antes de enviar (borrados). El texto dice QUÉ se borra.
 */
export default function Formulario({
  accion,
  children,
  className,
  limpiar = false,
  confirmar,
  id,
}: {
  accion: (previo: Resultado, datos: FormData) => Promise<Resultado>;
  children: ReactNode;
  className?: string;
  limpiar?: boolean;
  confirmar?: string;
  id?: string;
}) {
  const [estado, enviar] = useActionState(accion, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (limpiar && estado?.ok) {
      ref.current?.reset();
      ref.current?.querySelector<HTMLElement>("input:not([type=hidden]),textarea")?.focus();
    }
  }, [estado, limpiar]);

  return (
    <form
      ref={ref}
      id={id}
      action={enviar}
      className={className}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      {children}
      <p
        role="status"
        aria-live="polite"
        className={`text-[0.95rem] empty:hidden ${estado?.ok === false ? "text-[var(--acento)]" : "text-[var(--verde)]"} basis-full`}
      >
        {estado?.mensaje}
      </p>
    </form>
  );
}

/** El botón de enviar, con su estado mientras guarda. */
export function Enviar({
  children,
  pendiente = "Guardando…",
  variante = "lleno",
  className = "",
}: {
  children: ReactNode;
  pendiente?: string;
  variante?: "lleno" | "borde" | "peligro";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const clase = variante === "lleno" ? ui.botonLleno : variante === "peligro" ? ui.botonPeligro : ui.boton;
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={`${clase} ${className}`}>
      {pending ? pendiente : children}
    </button>
  );
}
