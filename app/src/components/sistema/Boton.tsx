import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Magnetico from "./Magnetico";
import "./sistema.css";

type Comun = {
  /** primario (granate) · oro (con brillo) · contorno · fantasma */
  variante?: "primario" | "oro" | "contorno" | "fantasma";
  /** Alto en px. 56 para el CTA principal (confirmar asistencia). */
  tamano?: 48 | 56;
  /** Deshabilita, pone aria-busy y gira el aro sin mover el ancho del botón. */
  cargando?: boolean;
  /** Al hacer clic, el cursor suelta pétalos en vez de la onda. */
  petalos?: boolean;
  /** Lo envuelve en <Magnetico>. Solo para uno o dos CTA por pantalla. */
  magnetico?: boolean;
  /** Icono a la derecha (SVG con currentColor, 18 px). */
  icono?: ReactNode;
  /** Ocupa todo el ancho (útil en móvil). */
  ancho?: boolean;
  children: ReactNode;
};

type ComoBoton = Comun & Omit<ComponentPropsWithoutRef<"button">, keyof Comun> & { href?: undefined };
type ComoEnlace = Comun & Omit<ComponentPropsWithoutRef<typeof Link>, keyof Comun> & { href: string };

/**
 * El botón del sistema. Con `href` es un <Link>; sin él, un <button>.
 * Hereda el acento de donde esté: dentro de una invitación usa --acento y
 * --sobre-acento de la plantilla, y el radio --boton-radio si lo define.
 *
 *   <Boton href="/empezar" magnetico>Empezar</Boton>
 *   <Boton variante="oro" tamano={56} petalos type="submit" cargando={enviando}>¿Vienes?</Boton>
 */
export default function Boton(props: ComoBoton | ComoEnlace) {
  const {
    variante = "primario",
    tamano = 48,
    cargando = false,
    petalos = false,
    magnetico = false,
    icono,
    ancho = false,
    children,
    className,
    ...resto
  } = props;

  const clase = ["bt", `bt-${variante}`, tamano === 56 ? "bt-56" : "", ancho ? "bt-ancho" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  const datos = { "data-cursor-petalos": petalos ? "" : undefined, "aria-busy": cargando || undefined };
  const dentro = (
    <>
      <span className="bt-texto">
        {children}
        {icono ? <span className="bt-icono" aria-hidden="true">{icono}</span> : null}
      </span>
      {cargando ? (
        <span className="bt-cargando" role="status">
          <span className="bt-aro" aria-hidden="true" />
          <span className="sr-only">Un momento…</span>
        </span>
      ) : null}
    </>
  );

  let el: ReactNode;
  if (typeof resto.href === "string") {
    const { href, ...enlace } = resto as ComoEnlace;
    el = (
      <Link href={href} className={clase} {...datos} {...enlace} aria-disabled={cargando || undefined}>
        {dentro}
      </Link>
    );
  } else {
    const { type = "button", disabled, ...boton } = resto as ComoBoton;
    el = (
      <button type={type} className={clase} disabled={disabled || cargando} {...datos} {...boton}>
        {dentro}
      </button>
    );
  }
  return magnetico ? <Magnetico className={ancho ? "magnetico-ancho" : undefined}>{el}</Magnetico> : el;
}
