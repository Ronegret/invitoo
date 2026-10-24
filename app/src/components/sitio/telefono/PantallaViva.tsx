"use client";

import { useEffect, useRef, useState } from "react";
import s from "./telefono.module.css";

/**
 * Lo que se ve dentro del teléfono (W2): una invitación de verdad.
 *
 *  1. El póster de la apertura (en el HTML del servidor: nunca hay un
 *     marco vacío, y sin JavaScript se queda así).
 *  2. Si hay vídeo, la apertura suena (muda) cuando el teléfono está a la
 *     vista y la página ya ha cargado. Nunca con ahorro de datos, en 2G ni
 *     con «menos movimiento».
 *  3. Al terminar, un DESTELLO, y aparece la invitación: una tira con la
 *     invitación entera (`/sitio/recorridos/<slug>`), que sube con el scroll
 *     de la página (CSS `animation-timeline`, cero JS por frame).
 *
 * El único JavaScript es un IntersectionObserver: arranca y para el vídeo
 * y marca `data-visible` para que la animación de reserva se pause fuera
 * de la vista.
 */

type Modo = "scroll" | "auto" | "quieto";
type Fase = "poster" | "video" | "destello" | "invitacion";

export default function PantallaViva({
  tira,
  altoTira = 8308,
  poster,
  video,
  modo = "scroll",
  linea,
  desde,
  hastaRango,
  hasta,
  duracion,
  fondo,
  href,
  titulo,
  prioridad = false,
  bucle = false,
  activo = true,
}: {
  /** Slug de la invitación cuya tira está en /sitio/recorridos. */
  tira?: string;
  altoTira?: number;
  /** Póster de la apertura (o la portada si no hay vídeo). */
  poster?: string;
  video?: string;
  modo?: Modo;
  /** `animation-timeline` de la tira (por defecto, el scroll de la página). */
  linea?: string;
  desde?: string;
  hastaRango?: string;
  /** Hasta dónde baja la tira (por defecto −45 %). */
  hasta?: string;
  duracion?: string;
  fondo?: string;
  /** En táctil, todo el teléfono abre esta invitación. */
  href?: string;
  /** Para el lector de pantalla. */
  titulo: string;
  prioridad?: boolean;
  /** Sin tira: el vídeo se repite (fichas del catálogo). */
  bucle?: boolean;
  /** Si es falso, el vídeo no arranca (escenas que aún no tocan). */
  activo?: boolean;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [fase, setFase] = useState<Fase>(video ? "poster" : "invitacion");
  const [visible, setVisible] = useState(false);
  const [puede, setPuede] = useState(false);

  /* ¿Se puede gastar en vídeo? Y ¿está a la vista? */
  useEffect(() => {
    const red = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ahorro = !!red?.saveData || /^(slow-)?2g$/.test(red?.effectiveType ?? "");
    let cargada = document.readyState === "complete";
    let idle = 0;
    const listo = () => {
      const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number })
        .requestIdleCallback;
      if (ric) idle = ric(() => setPuede(!quieto && !ahorro), { timeout: 1500 });
      else idle = window.setTimeout(() => setPuede(!quieto && !ahorro), 300);
    };
    const alCargar = () => {
      cargada = true;
      listo();
    };
    if (cargada) listo();
    else window.addEventListener("load", alCargar, { once: true });

    const nodo = raiz.current;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "120px 0px",
    });
    if (nodo) obs.observe(nodo);
    return () => {
      obs.disconnect();
      window.removeEventListener("load", alCargar);
      window.clearTimeout(idle);
    };
  }, []);

  /* El vídeo suena solo cuando toca, y se para fuera de la vista. */
  useEffect(() => {
    const v = ref.current;
    if (!v || !video) return;
    const debe = puede && visible && activo && (fase === "poster" || fase === "video");
    if (debe) {
      if (v.readyState === 0) v.load();
      else if (fase === "poster" && v.currentTime > 0) v.currentTime = 0;
      v.play()
        .then(() => setFase((f) => (f === "poster" ? "video" : f)))
        .catch(() => {});
    } else if (!v.paused) v.pause();
  }, [puede, visible, activo, fase, video]);

  /* Al volver a una escena, la apertura empieza otra vez. */
  const [activoVisto, setActivoVisto] = useState(activo);
  if (activoVisto !== activo) {
    setActivoVisto(activo);
    if (!activo && video && !bucle) setFase("poster");
  }

  const alTerminar = () => {
    if (bucle || !tira) return;
    setFase("destello");
    window.setTimeout(() => setFase("invitacion"), 420);
  };

  const estilo = {
    "--fondo": fondo,
    "--linea": linea,
    "--desde": desde,
    "--hasta-rango": hastaRango,
    "--hasta": hasta,
    "--duracion": duracion,
  } as React.CSSProperties;

  return (
    <div
      ref={raiz}
      className={s.viva}
      data-fase={fase}
      data-modo={modo}
      data-tira={tira ? "" : undefined}
      data-visible={visible || undefined}
      style={estilo}
      role="img"
      aria-label={titulo}
    >
      {tira && (
        <picture>
          <source type="image/avif" srcSet={`/sitio/recorridos/${tira}.avif`} />
          <img
            src={`/sitio/recorridos/${tira}.webp`}
            alt=""
            width={600}
            height={altoTira}
            loading={prioridad && !video ? "eager" : "lazy"}
            decoding="async"
            className={s.tira}
            draggable={false}
          />
        </picture>
      )}

      {poster && (fase !== "invitacion" || !tira) && (
        // eslint-disable-next-line @next/next/no-img-element -- póster AVIF ya optimizado
        <img
          src={poster}
          alt=""
          width={720}
          height={1280}
          loading={prioridad ? "eager" : "lazy"}
          fetchPriority={prioridad ? "high" : undefined}
          decoding="async"
          className={s.capa}
          style={{ zIndex: 1 }}
        />
      )}

      {video && (
        <video
          ref={ref}
          className={s.capa}
          src={video}
          muted
          playsInline
          loop={bucle}
          preload="none"
          aria-hidden
          tabIndex={-1}
          onEnded={alTerminar}
          style={{ opacity: fase === "video" || fase === "destello" || (bucle && fase !== "poster") ? 1 : 0 }}
        />
      )}

      <span aria-hidden className={s.destello} />

      {href && <a href={href} className={s.enlace} aria-hidden tabIndex={-1} />}
    </div>
  );
}
