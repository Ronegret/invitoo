"use client";

import { useEffect, useRef, useState } from "react";

/**
 * El vídeo de la cabecera de las plantillas temáticas (K1).
 *
 *  · El PÓSTER va en el HTML del servidor (`<picture>`, una sola versión
 *    según la forma de la pantalla): es el LCP y la pantalla nunca está
 *    vacía. Sin JavaScript se queda el póster y todo se lee igual.
 *  · El `<video>` no tiene `src` en el HTML: aquí se elige UN montaje
 *    (vertical o horizontal) y solo se descarga ese.
 *  · No arranca mientras la apertura (sobre o vídeo) está delante, ni
 *    fuera de pantalla (se pausa al salir: batería).
 *  · Silenciado, en línea y en bucle; salta el fundido a negro del máster.
 *  · Si el navegador no deja reproducir solo (modo ahorro, iOS en bajo
 *    consumo) o el invitado pide menos movimiento, aparece un botón «Ver
 *    el vídeo» con el estilo del tema. No hay sonido: la música es el
 *    botón propio de la invitación.
 */
export type FuenteVideo = {
  vertical: string;
  horizontal?: string;
  poster: string;
  posterHorizontal?: string;
  /** Montajes WebM (VP9), ya recortados y en bucle limpio. Si el navegador los lee, se prefieren. */
  webm?: string;
  webmHorizontal?: string;
};

const ANCHO = "(orientation: landscape) and (min-width: 768px)";
// Los clips de V1 (doc qa/v4/v1/CONTRATO.md) arrancan en el póster y son un
// bucle limpio también en MP4: ya no hay negro que saltar.
const INICIO_MP4 = 0;

function aperturaDelante() {
  return document.querySelector<HTMLElement>(
    '.apertura[data-estado="dentro"], .apertura[data-estado="saliendo"]',
  );
}

export default function HeroVideo({
  fuente,
  clase = "",
  etiqueta = "Ver el vídeo",
  children,
}: {
  fuente: FuenteVideo;
  /** La gradación del tema (`.grad-regencia`…), en el póster y en el vídeo. */
  clase?: string;
  etiqueta?: string;
  /** Capas que van ENCIMA del vídeo y se mueven con él (tinte, velo). */
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [boton, setBoton] = useState(false);
  const [vivo, setVivo] = useState(false);
  // WCAG 2.2.2: lo que se mueve solo más de 5 s se puede pausar.
  const [pausado, setPausado] = useState(false);
  const pausadoRef = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let cancelado = false;
    // En pantalla sí, fuera no; y no antes de que se retire la apertura.
    let visible = true;
    let listo = false;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ancho = window.matchMedia(ANCHO).matches;
    let webm = fuente.webm && v.canPlayType('video/webm; codecs="vp9"') ? (ancho && fuente.webmHorizontal) || fuente.webm : null;
    // Un solo montaje: el WebM recortado si se puede, si no el MP4.
    v.src = webm ?? (ancho && fuente.horizontal ? fuente.horizontal : fuente.vertical);
    let INICIO = webm ? 0 : INICIO_MP4;
    v.loop = true;
    // Si el WebM falla (no está, o el códec no va), el MP4 de siempre.
    const fallo = () => {
      if (!webm || v.src.endsWith(".mp4")) return;
      webm = null;
      INICIO = INICIO_MP4;
      v.src = ancho && fuente.horizontal ? fuente.horizontal : fuente.vertical;
      if (listo && visible) reproducir();
    };
    v.addEventListener("error", fallo);

    const reproducir = () => {
      if (cancelado || pausadoRef.current) return;
      if (INICIO && v.currentTime < INICIO) {
        try { v.currentTime = INICIO; } catch { /* aún sin metadatos */ }
      }
      v.play().then(
        () => setBoton(false),
        // Una petición interrumpida por otra (AbortError) no es un bloqueo.
        (e: unknown) => {
          if ((e as { name?: string } | null)?.name !== "AbortError") setBoton(true);
        },
      );
    };

    // Bucle sin el negro del final ni del principio.
    const bucle = () => {
      if (!webm && v.duration && v.currentTime > v.duration - 0.5) v.currentTime = INICIO;
    };
    const enMarcha = () => setVivo(true);
    v.addEventListener("timeupdate", bucle);
    v.addEventListener("playing", enMarcha);

    if (quieto) {
      // Con «menos movimiento» no arranca solo: se ofrece el botón.
      requestAnimationFrame(() => {
        if (!cancelado) setBoton(true);
      });
      return () => {
        cancelado = true;
        v.removeEventListener("error", fallo);
        v.removeEventListener("timeupdate", bucle);
        v.removeEventListener("playing", enMarcha);
      };
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!listo) return;
      if (visible) reproducir();
      else v.pause();
    });
    io.observe(v);

    // Esperar a que la apertura se retire.
    let mo: MutationObserver | null = null;
    const empezar = () => {
      listo = true;
      v.preload = "auto";
      if (visible) reproducir();
    };
    const capa = aperturaDelante();
    if (capa) {
      mo = new MutationObserver(() => {
        if (!aperturaDelante()) {
          mo?.disconnect();
          empezar();
        }
      });
      mo.observe(capa, { attributes: true, attributeFilter: ["data-estado"] });
    } else {
      empezar();
    }

    return () => {
      cancelado = true;
      io.disconnect();
      mo?.disconnect();
      v.removeEventListener("error", fallo);
      v.removeEventListener("timeupdate", bucle);
      v.removeEventListener("playing", enMarcha);
    };
  }, [fuente]);

  return (
    <>
    <div className={`k-hero-medio kv ${clase}`} data-vivo={vivo ? "1" : undefined}>
      <picture>
        {fuente.posterHorizontal && <source media={ANCHO} srcSet={fuente.posterHorizontal} />}
        {/* Póster AVIF dentro de <picture>: es el LCP. */}
        <img className="kv-poster kv-grad" src={fuente.poster} alt="" fetchPriority="high" decoding="async" />
      </picture>
      <video
        ref={ref}
        className="kv-video kv-grad"
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
      />
      {children}
    </div>
      {vivo && !boton && (
        <button
          type="button"
          className="kv-pausa"
          aria-pressed={pausado}
          aria-label={pausado ? "Reanudar el vídeo de fondo" : "Pausar el vídeo de fondo"}
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            const p = !pausado;
            pausadoRef.current = p;
            setPausado(p);
            if (p) v.pause();
            else void v.play().catch(() => setBoton(true));
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
            {pausado ? <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /> : <path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z" fill="currentColor" />}
          </svg>
        </button>
      )}
      {boton && (
        <button
          type="button"
          className="kv-play"
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            v.preload = "auto";
            v.play().then(() => setBoton(false), () => setBoton(true));
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
            <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
          </svg>
          {etiqueta}
        </button>
      )}
    </>
  );
}
