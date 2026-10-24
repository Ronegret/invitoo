"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Rama from "@/components/Botanica";

/**
 * La galería de la invitación.
 *
 * Manda la fotografía: una a sangre de pantalla completa con parallax, y
 * debajo el resto en grande. Una invitación de boda tiene que enseñar caras,
 * no miniaturas.
 *
 * Dos composiciones para que las plantillas no sean la misma maqueta:
 *   · `sangre`  una enorme a pantalla completa y el resto en mosaico
 *   · `tira`    un carrusel horizontal que se arrastra con el dedo
 *
 * Sutilezas, todas del mismo lado: lento y suave.
 *  · Cada foto se descubre como a través de un velo de luz: de un
 *    desenfoque leve a nítida, escalonada, con el ritmo del movimiento de
 *    la boda (`--mov-dur`, `--mov-desenfoque-foto`). Solo opacity y
 *    filter. El velo solo se arma ya en el navegador: sin JavaScript las
 *    fotos se ven sin más.
 *  · El parallax mueve la foto con un `transform` desde una ref, sin
 *    re-renderizar React en cada fotograma. Se apaga con el ajuste
 *    «parallax» de la boda (`data-mov-parallax="0"`).
 *  · Al tocar una se abre a pantalla completa: diálogo modal de verdad, con
 *    el foco dentro, Escape, flechas y el foco de vuelta donde estaba.
 */

const nada = () => () => {};
function suscribirMovimiento(f: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", f);
  return () => mq.removeEventListener("change", f);
}
const quietoAhora = () =>
  typeof IntersectionObserver === "undefined" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Galeria({
  fotos,
  titulo = "Nosotros",
  variante = "sangre",
}: {
  fotos: string[];
  titulo?: string;
  variante?: "sangre" | "tira";
}) {
  const caja = useRef<HTMLElement>(null);
  const primeraImg = useRef<HTMLImageElement>(null);
  const hidratado = useSyncExternalStore(nada, () => true, () => false);
  const quieto = useSyncExternalStore(suscribirMovimiento, quietoAhora, () => true);
  const [visto, setVisto] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);

  // La máscara solo existe si hay JS, hay movimiento y aún no se ha visto.
  const enmascarar = hidratado && !quieto && !visto;

  useEffect(() => {
    if (quieto) return;
    const nodo = caja.current;
    let respondio = false;
    const obs = new IntersectionObserver(
      ([e]) => {
        respondio = true;
        if (e.isIntersecting) {
          setVisto(true);
          obs.disconnect();
        }
      },
      { rootMargin: "160px 0px", threshold: 0 },
    );
    if (nodo) obs.observe(nodo);
    // Red de seguridad: nunca se deja una foto invisible. Solo si el
    // observador no ha dicho NADA (siempre responde al empezar a observar);
    // si ha respondido, la foto está más abajo y se revelará al llegar.
    const rescate = window.setTimeout(() => {
      if (!respondio) setVisto(true);
    }, 2000);
    const lienzo = nodo?.closest<HTMLElement>("[data-mov-parallax]");

    let pedido = 0;
    const mover = () => {
      if (pedido) return;
      pedido = requestAnimationFrame(() => {
        pedido = 0;
        const n = caja.current;
        const img = primeraImg.current;
        if (!n || !img) return;
        if (lienzo?.getAttribute("data-mov-parallax") === "0") {
          img.style.transform = "";
          return;
        }
        const r = n.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const centro =
          (r.top + r.height / 2 - window.innerHeight / 2) /
          (window.innerHeight / 2 + r.height / 2);
        img.style.transform = `translate3d(0, ${(centro * 7).toFixed(2)}%, 0)`;
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
  }, [quieto]);

  if (!fotos.length) return null;
  const [primera, ...resto] = fotos;

  const mascara = (ms: number): React.CSSProperties => ({
    opacity: enmascarar ? 0 : 1,
    filter: enmascarar ? "blur(var(--mov-desenfoque-foto, 6px))" : "none",
    transition:
      hidratado && !quieto
        ? `opacity calc(var(--mov-dur, 1100ms) * 1.2) var(--mov-curva, ease-out) ${ms}ms,` +
          ` filter calc(var(--mov-dur, 1100ms) * 1.5) var(--mov-curva, ease-out) ${ms}ms`
        : undefined,
  });

  const boton =
    "relative overflow-hidden focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--acento-texto,var(--acento))]";

  return (
    <section ref={caja} className="galeria py-24">
      <div className="px-6 text-center">
        <h2 className="display text-[clamp(2.1rem,9vw,3.1rem)]">{titulo}</h2>
        <Rama
          forma="guirnalda"
          ancho={170}
          className="mx-auto mt-5 max-w-full text-[var(--acento-texto,var(--acento))] opacity-60"
        />
      </div>

      {/* La primera, a sangre y con parallax. Es la que tiene que impresionar. */}
      <button
        type="button"
        onClick={() => setAbierta(0)}
        aria-label={`Ver la foto 1 de ${fotos.length} a pantalla completa`}
        className={`${boton} mt-14 block h-[72svh] w-full`}
        style={mascara(0)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado, puede venir de Supabase */}
        <img
          ref={primeraImg}
          src={primera}
          alt=""
          width={900}
          height={1200}
          sizes="100vw"
          loading="lazy"
          decoding="async"
          className="absolute left-0 top-[-9%] h-[118%] w-full object-cover will-change-transform"
        />
      </button>

      {variante === "tira" ? (
        // Tira que se arrastra con el dedo: más ligera de leer en móvil.
        <div className="tira mt-4 flex gap-4 overflow-x-auto px-4 pb-4">
          {resto.map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => setAbierta(i + 1)}
              aria-label={`Ver la foto ${i + 2} de ${fotos.length} a pantalla completa`}
              className={`${boton} shrink-0`}
              style={{
                width: "72vw",
                maxWidth: "22rem",
                aspectRatio: "3 / 4",
                ...mascara(200 + i * 160),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
              <img
                src={f}
                alt=""
                width={900}
                height={1200}
                sizes="(min-width: 640px) 22rem, 72vw"
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
              onClick={() => setAbierta(i + 1)}
              aria-label={`Ver la foto ${i + 2} de ${fotos.length} a pantalla completa`}
              className={boton}
              style={{
                // Cada tres, una ocupa las dos columnas.
                gridColumn: i % 3 === 2 ? "span 2" : undefined,
                aspectRatio: i % 3 === 2 ? "16 / 10" : "3 / 4",
                ...mascara(200 + i * 170),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
              <img
                src={f}
                alt=""
                width={900}
                height={i % 3 === 2 ? 563 : 1200}
                sizes={i % 3 === 2 ? "100vw" : "50vw"}
                loading="lazy"
                decoding="async"
                className="respira h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {abierta !== null && (
        <Visor
          fotos={fotos}
          indice={abierta}
          onCambiar={setAbierta}
          onCerrar={() => setAbierta(null)}
        />
      )}

      <style>{`
        /* Ken Burns: un 6 % en veinte segundos. No se ve moverse; se siente
           que respira. */
        .galeria .respira { animation: respira 20s ease-in-out infinite alternate; }
        @keyframes respira {
          from { transform: scale(1); }
          to   { transform: scale(1.06); }
        }
        .tira { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .tira > * { scroll-snap-align: center; }
        .tira::-webkit-scrollbar { display: none; }
        .visor { animation: entraVisor 220ms cubic-bezier(.23,1,.32,1) both; }
        @keyframes entraVisor { from { opacity: 0 } to { opacity: 1 } }
        .visor img { animation: entraFoto 260ms cubic-bezier(.23,1,.32,1) both; }
        @keyframes entraFoto { from { opacity: 0; transform: scale(.97) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) {
          .galeria .respira, .visor, .visor img { animation: none; }
        }
      `}</style>
    </section>
  );
}

/** La foto a pantalla completa. Diálogo modal: el foco no se escapa. */
function Visor({
  fotos,
  indice,
  onCambiar,
  onCerrar,
}: {
  fotos: string[];
  indice: number;
  onCambiar: (i: number) => void;
  onCerrar: () => void;
}) {
  const dialogo = useRef<HTMLDivElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const total = fotos.length;
  const ir = (paso: number) => onCambiar((indice + paso + total) % total);

  // Al abrir: foco dentro y página quieta. Al cerrar: foco de vuelta.
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    cerrar.current?.focus();
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = scroll;
      previo?.focus?.({ preventScroll: true });
    };
  }, []);

  function tecla(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCerrar();
    } else if (e.key === "ArrowRight" && total > 1) {
      ir(1);
    } else if (e.key === "ArrowLeft" && total > 1) {
      ir(-1);
    } else if (e.key === "Tab") {
      // Trampa de foco: de la última pieza a la primera y al revés.
      const piezas = dialogo.current?.querySelectorAll<HTMLElement>("button");
      if (!piezas?.length) return;
      const primera = piezas[0];
      const ultima = piezas[piezas.length - 1];
      if (e.shiftKey && document.activeElement === primera) {
        e.preventDefault();
        ultima.focus();
      } else if (!e.shiftKey && document.activeElement === ultima) {
        e.preventDefault();
        primera.focus();
      }
    }
  }

  const redondo =
    "grid h-14 w-14 place-items-center rounded-full border border-white/40 bg-black/40 text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <div
      ref={dialogo}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${total}`}
      onKeyDown={tecla}
      className="visor fixed inset-0 z-[60] grid place-items-center bg-black/92 p-4"
    >
      {/* Tocar fuera de la foto cierra; para el teclado está el botón. */}
      <div aria-hidden className="absolute inset-0" onClick={onCerrar} />
      {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
      <img
        key={fotos[indice]}
        src={fotos[indice]}
        alt={`Foto ${indice + 1} de ${total}`}
        decoding="async"
        className="relative max-h-full max-w-full object-contain"
      />
      <button
        ref={cerrar}
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar la foto"
        className={`${redondo} absolute right-4 text-[1.6rem]`}
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <span aria-hidden>×</span>
      </button>
      {total > 1 && (
        <div
          className="absolute inset-x-0 flex justify-center gap-4"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
        >
          <button type="button" onClick={() => ir(-1)} aria-label="Foto anterior" className={redondo}>
            <span aria-hidden className="text-[1.4rem]">‹</span>
          </button>
          <p className="grid min-w-16 place-items-center text-[1rem] tabular-nums text-white" aria-hidden>
            {indice + 1} / {total}
          </p>
          <button type="button" onClick={() => ir(1)} aria-label="Foto siguiente" className={redondo}>
            <span aria-hidden className="text-[1.4rem]">›</span>
          </button>
        </div>
      )}
    </div>
  );
}
