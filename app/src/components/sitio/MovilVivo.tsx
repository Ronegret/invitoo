"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Un móvil con una invitación real corriendo dentro.
 *
 * No es una captura ni un vídeo grabado: es la página `/i/<slug>` de
 * verdad, en un iframe pintado a 390 px (el ancho de un iPhone) y escalado
 * al marco. Lo que ve el visitante es exactamente lo que verá un invitado.
 *
 * Cómo se carga, para no castigar a nadie:
 *  · Sin JavaScript, o antes de hidratar, se ve la portada real de esa
 *    invitación (el póster AVIF). Nunca hay un marco vacío.
 *  · La invitación entra cuando el móvil está en pantalla y la página ya
 *    ha terminado de cargar. Con ahorro de datos o en 2G no entra: se queda
 *    el póster, que ya enseña el diseño.
 *  · Cuando el iframe ha cargado, el póster se funde (solo opacidad).
 *
 * En táctil el iframe no recibe el dedo (globals.css, `.movil-vivo`): si lo
 * recibiera, quien baja por la página se quedaría atrapado dentro del
 * móvil. Ahí todo el marco es un enlace a la invitación a pantalla completa.
 * Con ratón sí se puede recorrer dentro.
 */
export default function MovilVivo({
  slug,
  poster,
  titulo,
  className = "",
}: {
  slug: string;
  poster: string;
  /** Para el lector de pantalla: «Invitación de ejemplo de Laura y Rubén». */
  titulo: string;
  className?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [vivo, setVivo] = useState(false);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const red = (
      navigator as { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    if (red?.saveData || /^(slow-)?2g$/.test(red?.effectiveType ?? "")) return;

    const nodo = caja.current;
    if (!nodo) return;
    let enPantalla = false;
    let pagina = document.readyState === "complete";
    const probar = () => {
      if (enPantalla && pagina) setVivo(true);
    };

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          enPantalla = true;
          probar();
          obs.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    obs.observe(nodo);

    const alCargar = () => {
      pagina = true;
      probar();
    };
    if (!pagina) window.addEventListener("load", alCargar, { once: true });

    return () => {
      obs.disconnect();
      window.removeEventListener("load", alCargar);
    };
  }, []);

  const href = `/i/${slug}`;

  return (
    <div ref={caja} className={`movil-vivo relative ${className}`}>
      <div className="relative rounded-[2.6rem] bg-[var(--tinta)] p-[9px] shadow-[0_40px_80px_-40px_rgba(18,16,14,.55)]">
        {/* La isla de la cámara: un detalle que hace que se lea «teléfono»
            antes de leer nada más. */}
        <span
          aria-hidden
          className="absolute left-1/2 top-[15px] z-20 h-[18px] w-[30%] -translate-x-1/2 rounded-full bg-[var(--tinta)]"
        />
        <div className="pantalla relative overflow-hidden rounded-[2rem] bg-[var(--bruma)]">
          {vivo && (
            <iframe
              src={href}
              title={titulo}
              tabIndex={-1}
              loading="lazy"
              onLoad={() => setCargado(true)}
              className="absolute left-0 top-0"
            />
          )}

          {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
          <img
            src={poster}
            alt=""
            width={720}
            height={1280}
            fetchPriority="high"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: cargado ? 0 : 1 }}
          />

          {/* En táctil, todo el móvil abre la invitación entera. */}
          <a
            href={href}
            aria-label={`${titulo}, a pantalla completa`}
            className="absolute inset-0 z-10 hidden pointer-coarse:block"
          />
        </div>
      </div>
    </div>
  );
}
