"use client";

import { useEffect, useState } from "react";
import Rama from "@/components/Botanica";

/**
 * La portada de la invitación, a sangre.
 *
 * Antes era un óvalo pequeño encima de un fondo crema. Se veía diminuta y
 * todas las bodas acababan pareciéndose, porque lo que mandaba era el color
 * del papel y no la fotografía.
 *
 * Ahora la fotografía ES la portada: ocupa la pantalla entera, los nombres
 * van encima y el papel solo aparece al bajar. Es como se abre una
 * invitación de verdad.
 *
 * Tres variantes de composición para que diez plantillas no sean la misma
 * maqueta repintada:
 *   · `centro`   nombres en el centro de la foto
 *   · `bajo`     foto arriba, nombres debajo sobre papel (editorial)
 *   · `partida`  foto a la mitad y nombres montados en el borde
 */
export default function PortadaFoto({
  a,
  b,
  fecha,
  frase,
  foto,
  variante = "centro",
}: {
  a: string;
  b: string;
  fecha: string;
  frase: string;
  foto?: string;
  variante?: "centro" | "bajo" | "partida";
}) {
  const [entrado, setEntrado] = useState(false);
  const [y, setY] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setEntrado(true), 80);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => window.clearTimeout(t);
    }
    // La foto sube más despacio que la página: da profundidad sin que nadie
    // sepa por qué.
    let pedido = 0;
    const mover = () => {
      if (pedido) return;
      pedido = requestAnimationFrame(() => {
        pedido = 0;
        setY(Math.min(60, window.scrollY * 0.22));
      });
    };
    window.addEventListener("scroll", mover, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", mover);
      if (pedido) cancelAnimationFrame(pedido);
    };
  }, []);

  const fechaLarga = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));

  const paso = (ms: number) => ({
    opacity: entrado ? 1 : 0,
    transform: entrado ? "none" : "translateY(16px)",
    transition: `opacity 1100ms ease ${ms}ms, transform 1100ms cubic-bezier(.22,.7,.28,1) ${ms}ms`,
  });

  const claro = variante !== "bajo";

  const nombres = (
    <>
      <p
        className="text-[0.76rem] uppercase tracking-[0.4em]"
        style={{ ...paso(900), opacity: entrado ? 0.72 : 0 }}
      >
        {fechaLarga}
      </p>
      <h1
        className="display asienta mt-6 text-[clamp(3rem,15vw,5.6rem)] leading-[0.98]"
        style={{ ...paso(1150), animationDelay: "1150ms" }}
      >
        {a}
        <span className="italic" style={{ color: claro ? "rgba(255,255,255,.7)" : "var(--acento)" }}>
          {" "}
          &amp;{" "}
        </span>
        {b}
      </h1>
      <span
        className="mx-auto mt-7 block h-px w-28"
        style={{
          background: claro ? "rgba(255,255,255,.5)" : "var(--acento)",
          transform: entrado ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 1300ms cubic-bezier(.22,.7,.28,1) 1700ms",
        }}
      />
      <p
        className="mx-auto mt-7 max-w-[26rem] text-[1.04rem] leading-[1.85]"
        style={{ ...paso(1900), opacity: entrado ? 0.82 : 0 }}
      >
        {frase}
      </p>
      <a
        href="#confirmar"
        className="mt-10 inline-flex min-h-13 items-center rounded-full border px-8 text-[0.8rem] uppercase tracking-[0.22em] transition-colors duration-500"
        style={{
          ...paso(2150),
          borderColor: claro ? "rgba(255,255,255,.45)" : "color-mix(in srgb, currentColor 30%, transparent)",
        }}
      >
        Confirmar asistencia
      </a>
    </>
  );

  if (variante === "bajo") {
    // Editorial: la foto arriba, el texto sobre papel debajo.
    return (
      <section className="pb-20">
        <div className="relative h-[58svh] w-full overflow-hidden">
          {foto && (
            /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
            <img
              src={foto}
              alt=""
              width={1100}
              height={733}
              fetchPriority="high"
              className="absolute left-0 h-[124%] w-full object-cover"
              style={{
                top: `${-12 + y * 0.18}%`,
                // Sin máscara de entrada: la puerta y el vídeo ya han hecho
                // de apertura, y dejar un hueco de color plano detrás es
                // justo lo que se veía como un gris raro.
                transform: entrado ? "scale(1)" : "scale(1.05)",
                transition: "transform 2600ms cubic-bezier(.22,.7,.28,1)",
              }}
            />
          )}
        </div>
        <div className="px-6 pt-14 text-center">
          <Rama
            forma="guirnalda"
            ancho={190}
            retraso={700}
            className="mx-auto mb-8 text-[var(--acento)] opacity-50"
          />
          {nombres}
        </div>
      </section>
    );
  }

  const alto = variante === "partida" ? "78svh" : "100svh";

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: alto }}>
      {foto && (
        /* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */
        <img
          src={foto}
          alt=""
          width={1100}
          height={733}
          fetchPriority="high"
          className="absolute left-0 w-full object-cover"
          style={{
            top: `${-11 + y * 0.2}%`,
            height: "124%",
            transform: entrado ? "scale(1)" : "scale(1.06)",
            transition: "transform 2800ms cubic-bezier(.22,.7,.28,1)",
          }}
        />
      )}

      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 95% at 50% 45%, rgba(10,8,7,.26) 0%, rgba(10,8,7,.46) 55%, rgba(10,8,7,.78) 100%)",
        }}
      />

      <div
        className="relative grid place-items-center px-6 py-24 text-center text-white"
        style={{ minHeight: alto, textShadow: "0 1px 34px rgba(0,0,0,.55)" }}
      >
        <div>
          <Rama
            forma="guirnalda"
            ancho={180}
            retraso={600}
            className="mx-auto mb-9 opacity-65"
          />
          {nombres}
        </div>
      </div>
    </section>
  );
}
