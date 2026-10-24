"use client";

import { useRef, useState } from "react";

/**
 * La pantalla de una plantilla dentro de su marco de móvil: la portada real
 * de su invitación de muestra, y encima su apertura en vídeo, que arranca al
 * pasar el ratón, al enfocar con el teclado o al pulsar el botón (táctil).
 *
 * `preload="none"`: con ocho fichas en la página, pedir los ocho vídeos al
 * cargar es tirar los datos del móvil de alguien. El vídeo se pide cuando se
 * quiere ver.
 *
 * El póster está en el HTML del servidor: sin JavaScript la ficha se ve
 * entera, solo que sin vídeo.
 */
export default function Muestra({
  nombre,
  poster,
  video,
  prioridad = false,
}: {
  nombre: string;
  poster: string;
  video?: string;
  prioridad?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [viva, setViva] = useState(false);

  function anticipo(entra: boolean) {
    const v = ref.current;
    if (!v) return;
    setViva(entra);
    if (entra) {
      if (v.readyState === 0) v.load();
      v.currentTime = 0;
      void v.play().catch(() => setViva(false));
    } else {
      v.pause();
    }
  }

  return (
    <div
      className="relative rounded-[2.2rem] bg-[var(--tinta)] p-[7px] shadow-[0_30px_60px_-34px_rgba(18,16,14,.6)]"
      onPointerEnter={(e) => e.pointerType === "mouse" && anticipo(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && anticipo(false)}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-[1.75rem] bg-[var(--bruma)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
        <img
          src={poster}
          alt={`Portada de la invitación de muestra ${nombre}`}
          width={720}
          height={1280}
          loading={prioridad ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {video && (
          <>
            <video
              ref={ref}
              src={video}
              poster={poster}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
              style={{ opacity: viva ? 1 : 0 }}
            />
            <button
              type="button"
              onClick={() => anticipo(!viva)}
              aria-pressed={viva}
              aria-label={viva ? `Parar la apertura de ${nombre}` : `Ver la apertura de ${nombre}`}
              className="absolute bottom-4 right-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/60 bg-black/45 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-black/70"
            >
              {viva ? (
                <span aria-hidden className="flex gap-[4px]">
                  <span className="block h-3.5 w-[3px] bg-current" />
                  <span className="block h-3.5 w-[3px] bg-current" />
                </span>
              ) : (
                <span
                  aria-hidden
                  className="ml-0.5 block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-current"
                />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
