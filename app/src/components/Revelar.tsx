"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Aparición al entrar en pantalla.
 *
 * REGLA DE ORO: esto NUNCA puede dejar contenido invisible. Una animación de
 * entrada que falla no es una animación fea, es contenido que no existe —y
 * eso ya pasó: en móvil cinco de las seis fichas de plantilla se quedaban en
 * `opacity: 0` porque el observador no llegaba a dispararse para ellas.
 *
 * Por eso hay tres redes, en este orden:
 *  1. `prefers-reduced-motion` y «sin JavaScript» muestran el contenido tal cual.
 *  2. El observador dispara pronto: `threshold: 0` y margen POSITIVO, así que
 *     entra antes de asomar, no después.
 *  3. Un temporizador de seguridad: si a los 1200 ms el observador no ha
 *     dicho nada, se muestra igualmente. Más vale perderse la animación que
 *     perder el contenido.
 *
 * Y la animación en sí es corta —620 ms, 18 px— porque está para dar ritmo a
 * la lectura, no para lucirse.
 */
export default function Revelar({
  children,
  retraso = 0,
  className,
  style,
  as: Elemento = "div",
}: {
  children: React.ReactNode;
  /** Milisegundos de desfase, para escalonar hermanos. */
  retraso?: number;
  className?: string;
  /** Se fusiona con el estilo de la animación, no lo sustituye. */
  style?: React.CSSProperties;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [armado, setArmado] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    setArmado(true);

    const nodo = ref.current;
    if (!nodo) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      // Margen positivo: se dispara 140 px ANTES de asomar. Cuando el ojo
      // llega, la animación ya ha terminado.
      { rootMargin: "140px 0px 140px 0px", threshold: 0 },
    );
    obs.observe(nodo);

    // Red de seguridad. Nunca se deja nada invisible por un observador que
    // no llegó a hablar.
    const rescate = window.setTimeout(() => {
      setVisible(true);
      obs.disconnect();
    }, 1200);

    return () => {
      obs.disconnect();
      window.clearTimeout(rescate);
    };
  }, []);

  const oculto = armado && !visible;

  return (
    <Elemento
      ref={ref as never}
      className={className}
      style={{
        ...style,
        opacity: oculto ? 0 : 1,
        transform: oculto ? "translateY(18px)" : "none",
        transition: `opacity 620ms cubic-bezier(.22,.7,.28,1) ${retraso}ms, transform 620ms cubic-bezier(.22,.7,.28,1) ${retraso}ms`,
        willChange: oculto ? "opacity, transform" : undefined,
      }}
    >
      {children}
    </Elemento>
  );
}
