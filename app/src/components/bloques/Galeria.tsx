"use client";

import { useEffect, useRef, useState } from "react";
import Rama from "@/components/Botanica";

/**
 * La galería de la invitación.
 *
 * El mosaico anterior salía a media columna y las fotos se veían diminutas.
 * Ahora manda la fotografía: una a sangre de pantalla completa con parallax,
 * y debajo el resto en grande. Una invitación de boda tiene que enseñar
 * caras, no miniaturas.
 *
 * Dos composiciones para que diez plantillas no sean la misma maqueta:
 *   · `sangre`  una enorme a pantalla completa y tres grandes debajo
 *   · `tira`    un carrusel horizontal que se arrastra con el dedo
 *
 * Sutilezas, todas del mismo lado: lento y suave.
 *  · Cada foto se descubre por máscara, de abajo a arriba y escalonada.
 *  · Zoom permanente de un 6 % en veinte segundos: no se ve moverse.
 *  · Al tocar una se abre a pantalla completa.
 */
export default function Galeria({
  fotos,
  titulo = "Nosotros",
  variante = "sangre",
}: {
  fotos: string[];
  titulo?: string;
  variante?: "sangre" | "tira";
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [y, setY] = useState(0);

  useEffect(() => {
    const quieto =
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quieto) {
      setVisible(true);
      return;
    }
    const nodo = caja.current;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "160px 0px", threshold: 0 },
    );
    if (nodo) obs.observe(nodo);
    // Red de seguridad: nunca se deja una foto invisible.
    const rescate = window.setTimeout(() => setVisible(true), 1400);

    let pedido = 0;
    const mover = () => {
      if (pedido) return;
      pedido = requestAnimationFrame(() => {
        pedido = 0;
        const n = caja.current;
        if (!n) return;
        const r = n.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const centro =
          (r.top + r.height / 2 - window.innerHeight / 2) /
          (window.innerHeight / 2 + r.height / 2);
        setY(centro * 8);
      });
    };
    mover();
    window.addEventListener("scroll", mover, { passive: true });
    return () => {
      obs.disconnect();
      window.clearTimeout(rescate);
      window.removeEventListener("scroll", mover);
      if (pedido) cancelAnimationFrame(pedido);
    };
  }, []);

  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(null);
    window.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [abierta]);

  if (!fotos.length) return null;
  const [primera, ...resto] = fotos;

  const cabecera = (
    <div className="px-6 text-center">
      <h2 className="display text-[clamp(2.1rem,9vw,3.1rem)]">{titulo}</h2>
      <Rama
        forma="guirnalda"
        ancho={170}
        className="mx-auto mt-5 text-[var(--acento)] opacity-45"
      />
    </div>
  );

  return (
    <section ref={caja} className="py-24">
      {cabecera}

      {/* La primera, a sangre y con parallax. Es la que tiene que impresionar. */}
      <button
        type="button"
        onClick={() => setAbierta(primera)}
        aria-label="Ver la foto a pantalla completa"
        className="relative mt-14 block h-[72svh] w-full overflow-hidden"
        style={{
          clipPath: visible ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
          transition: "clip-path 1300ms cubic-bezier(.62,0,.24,1)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
        <img
          src={primera}
          alt=""
          width={900}
          height={1200}
          loading="lazy"
          decoding="async"
          className="absolute left-0 h-[118%] w-full object-cover"
          style={{ top: `${-9 + y}%`, transition: "top 120ms linear" }}
        />
      </button>

      {variante === "tira" ? (
        // Tira que se arrastra con el dedo: más ligera de leer en móvil.
        <div className="tira mt-4 flex gap-4 overflow-x-auto px-4 pb-4">
          {resto.map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => setAbierta(f)}
              aria-label={`Ver la foto ${i + 2} a pantalla completa`}
              className="shrink-0 overflow-hidden"
              style={{
                width: "72vw",
                maxWidth: "22rem",
                aspectRatio: "3 / 4",
                clipPath: visible ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                transition: `clip-path 1100ms cubic-bezier(.62,0,.24,1) ${200 + i * 160}ms`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
              <img
                src={f}
                alt=""
                width={900}
                height={1200}
                loading="lazy"
                decoding="async"
                className="respira h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 px-4 sm:gap-5 sm:px-5">
          {resto.map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => setAbierta(f)}
              aria-label={`Ver la foto ${i + 2} a pantalla completa`}
              className="foto-mosaico relative overflow-hidden"
              style={{
                // La primera de la fila ocupa las dos columnas cada tres.
                gridColumn: i % 3 === 2 ? "span 2" : undefined,
                aspectRatio: i % 3 === 2 ? "16 / 10" : "3 / 4",
                clipPath: visible ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                transition: `clip-path 1100ms cubic-bezier(.62,0,.24,1) ${200 + i * 170}ms`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
              <img
                src={f}
                alt=""
                width={900}
                height={1200}
                loading="lazy"
                decoding="async"
                className="respira h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {abierta && (
        <div
          className="visor fixed inset-0 z-50 grid place-items-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setAbierta(null)}
          role="dialog"
          aria-label="Foto ampliada"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
          <img src={abierta} alt="" className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => setAbierta(null)}
            aria-label="Cerrar"
            className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full border border-white/25 text-[1.4rem] text-white"
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        /* Ken Burns: un 6 % en veinte segundos. No se ve moverse; se siente
           que respira. */
        .respira { animation: respira 20s ease-in-out infinite alternate; }
        @keyframes respira {
          from { transform: scale(1); }
          to   { transform: scale(1.06); }
        }
        .tira { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
        .tira > * { scroll-snap-align: center; }
        .tira::-webkit-scrollbar { display: none; }
        .visor { animation: entraVisor 420ms ease forwards; }
        @keyframes entraVisor { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .respira, .visor { animation: none; }
          .foto-mosaico { clip-path: none !important; transition: none !important; }
        }
      `}</style>
    </section>
  );
}
