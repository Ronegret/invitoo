"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Invitacion } from "@/lib/tipos";

/**
 * Apertura en vídeo.
 *
 * Patrón tomado del que Rodrigo ya tiene probado en aem.rodd.es, con lo que
 * allí es innegociable y aquí también:
 *
 *   · SIN SONIDO. Sin `muted` ningún navegador deja arrancar solo un vídeo:
 *     el play() se rechaza y el invitado ve una pantalla negra.
 *   · `playsinline`. Sin ese atributo, Safari en iPhone se lleva el vídeo a su
 *     reproductor a pantalla completa, con sus controles encima.
 *   · Que nunca bloquee. Si el archivo no está, tarda o el navegador se niega,
 *     la invitación sigue: el telón se levanta igual.
 *   · Un montaje por forma de pantalla, y se carga UNO SOLO.
 *
 * Lo que se añade sobre ese patrón, y es lo que lo convierte en producto:
 * encima del vídeo va una capa con los nombres, la fecha y la paleta de ESA
 * boda. El vídeo es el mismo para todas las parejas de esa plantilla; la capa
 * es distinta para cada una. Así se consigue impacto de vídeo real sin
 * renderizar un máster por cliente.
 */

const ESPERA_MAXIMA = 12_000;

type Props = {
  inv: Invitacion;
  onAbierta: () => void;
};

export default function AperturaVideo({ inv, onAbierta }: Props) {
  const capa = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const cerrado = useRef(false);
  const [fuente, setFuente] = useState<string | null>(null);
  const [rotulo, setRotulo] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const ap = inv.apertura;

  const cerrar = useCallback(() => {
    if (cerrado.current) return;
    cerrado.current = true;
    setSaliendo(true);
    window.setTimeout(() => {
      const v = video.current;
      if (v) {
        try {
          v.pause();
          v.removeAttribute("src");
          v.load(); // suelta el archivo: megas que ya no hacen falta
        } catch {
          /* la capa se va igual */
        }
      }
      onAbierta();
    }, 620);
  }, [onAbierta]);

  // Elegir montaje. Se decide en JS y no en CSS porque hay que descargar uno
  // solo: bajar los dos para enseñar uno es tirar la mitad de los datos del
  // móvil de alguien.
  useEffect(() => {
    if (!ap) return;
    let grande = false;
    try {
      grande = window.matchMedia("(min-width: 768px)").matches;
    } catch {
      grande = (window.innerWidth || 0) >= 768;
    }
    setFuente(grande ? ap.horizontal : ap.vertical);
  }, [ap]);

  // Salvavidas: si el vídeo se cuelga, la invitación no se queda con él.
  useEffect(() => {
    const id = window.setTimeout(cerrar, ESPERA_MAXIMA);
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", tecla);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", tecla);
    };
  }, [cerrar]);

  function alCargar() {
    const v = video.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      // Algunos modos de ahorro de batería rechazan incluso el vídeo mudo.
      // No se deja una pantalla negra: se entra a la invitación.
      p.catch(cerrar);
    }
  }

  // El rótulo con los nombres entra en el segundo que marca la plantilla.
  function alAvanzar() {
    const v = video.current;
    if (!v || !ap) return;
    if (!rotulo && v.currentTime >= ap.rotuloEn) setRotulo(true);
  }

  if (!ap) return null;

  const { a, b } = inv.pareja;
  const fecha = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(inv.pareja.fecha));

  return (
    <div
      ref={capa}
      role="dialog"
      aria-label={`Invitación de boda de ${a} y ${b}`}
      className="fixed inset-0 z-50 overflow-hidden bg-black transition-opacity duration-[620ms]"
      style={{ opacity: saliendo ? 0 : 1 }}
    >
      {/* El póster es lo primero que se pinta: la pantalla nunca está negra
          mientras el vídeo carga, y es el LCP de la página. */}
      <video
        ref={video}
        // eslint-disable-next-line jsx-a11y/media-has-caption -- decorativo, sin diálogo
        className="absolute inset-0 h-full w-full object-cover"
        src={fuente ?? undefined}
        poster={ap.poster}
        muted
        autoPlay
        playsInline
        preload="auto"
        aria-hidden="true"
        onLoadedData={alCargar}
        onTimeUpdate={alAvanzar}
        onEnded={cerrar}
        onError={cerrar}
      />

      {/* Velo: garantiza contraste del rótulo sobre cualquier fotograma. */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: rotulo ? 1 : 0,
          // El velo tiene que aguantar el peor fotograma posible, no el
          // mejor: en una floración a contraluz el blanco se come el texto.
          background:
            "radial-gradient(115% 85% at 50% 52%, rgba(0,0,0,.62) 0%, rgba(0,0,0,.34) 58%, rgba(0,0,0,.5) 100%)",
        }}
      />

      {/* Lo que hace que este vídeo sea de ESTA boda y no de una plantilla. */}
      <div
        className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center"
        style={{
          opacity: rotulo ? 1 : 0,
          transform: rotulo ? "none" : "translateY(14px)",
          transition: "opacity 1100ms ease, transform 1100ms cubic-bezier(.2,.7,.3,1)",
          color: ap.rotuloClaro ? "#fff" : inv.tema.tinta,
          // Sobre vídeo no hay contraste garantizado: la sombra lo asegura
          // sin oscurecer la imagen entera.
          textShadow: ap.rotuloClaro ? "0 1px 26px rgba(0,0,0,.55)" : "none",
        }}
      >
        <div>
          <p className="text-[0.78rem] uppercase tracking-[0.34em] opacity-80">
            {fecha}
          </p>
          <p className="display mt-5 text-[clamp(2.6rem,13vw,6rem)]">
            {a}
            {/* Sobre vídeo el acento de la boda suele ser oscuro y se pierde.
                Aquí manda la legibilidad; el color vuelve en la portada. */}
            <span
              className="italic"
              style={{ color: ap.rotuloClaro ? "rgba(255,255,255,.72)" : inv.tema.acento }}
            >
              {" "}
              &amp;{" "}
            </span>
            {b}
          </p>
        </div>
      </div>

      {/* Visible desde el primer fotograma. Quien vuelve por décima vez a
          mirar la hora tiene que poder pasar de largo en un toque. */}
      <button
        type="button"
        onClick={cerrar}
        autoFocus
        className="absolute right-4 z-10 min-h-11 rounded-full border border-white/35 bg-black/25 px-5 text-[0.79rem] uppercase tracking-[0.22em] text-white backdrop-blur-sm"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        Saltar
      </button>
    </div>
  );
}
