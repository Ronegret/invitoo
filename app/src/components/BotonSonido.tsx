"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * La canción de la boda.
 *
 * El vídeo de apertura va mudo por obligación del navegador, así que la
 * canción necesita un gesto del invitado. Ya no se le pregunta en una
 * «puerta»: hay un botón sobre el propio vídeo y otro, discreto y fijo, en
 * la invitación. Los dos mandan sobre LA MISMA pista —está aquí, a nivel de
 * módulo—: lo que se enciende en la apertura sigue sonando al bajar, y nunca
 * hay dos canciones una encima de otra.
 *
 * El audio no se descarga hasta que se pulsa: 0 bytes para quien no lo quiere.
 * Si la boda no tiene música, este componente no se pinta.
 */

const VOLUMEN = 0.32;
let pista: HTMLAudioElement | null = null;
let urlPista = "";
let sonando = false;
const oyentes = new Set<() => void>();

function avisar() {
  oyentes.forEach((f) => f());
}

function suscribir(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

function alternar(url: string) {
  if (!pista || urlPista !== url) {
    pista?.pause();
    pista = new Audio(url);
    urlPista = url;
    pista.loop = true;
    pista.preload = "auto";
    pista.addEventListener("pause", () => {
      sonando = false;
      avisar();
    });
    pista.addEventListener("play", () => {
      sonando = true;
      avisar();
    });
  }
  const a = pista;
  if (!a.paused) {
    a.pause();
    return;
  }
  // Entra subiendo, no de golpe: un corte de volumen asusta. Con el ajuste
  // «musicaFundido» de la boda (`data-mov-musica`, por defecto sí) sube en
  // unos tres segundos con una curva suave; sin él, entra a su volumen.
  // (En iOS el volumen es de solo lectura y suena directamente.)
  const fundido = document.querySelector("[data-mov-musica]")?.getAttribute("data-mov-musica") !== "0";
  const DURA = 3200;
  a.volume = fundido ? 0 : VOLUMEN;
  void a.play().then(
    () => {
      if (!fundido) return;
      const inicio = performance.now();
      const sube = window.setInterval(() => {
        const t = Math.min(1, (performance.now() - inicio) / DURA);
        if (a.paused || t >= 1) {
          a.volume = VOLUMEN;
          window.clearInterval(sube);
        } else {
          // Curva de salida (cúbica): se oye pronto y se asienta despacio.
          a.volume = VOLUMEN * (1 - Math.pow(1 - t, 3));
        }
      }, 50);
    },
    () => {
      sonando = false;
      avisar();
    },
  );
}

export default function BotonSonido({
  url,
  titulo,
  dedicalo = false,
  sobre,
}: {
  url: string;
  titulo: string;
  /** La canción es de Dedícalo: se dice, porque es suya. */
  dedicalo?: boolean;
  /**
   * Dónde va. Sin valor: el botón fijo de la invitación. Con valor: el de la
   * apertura, con texto, sobre vídeo oscuro, vídeo claro o papel.
   */
  sobre?: "video" | "video-claro" | "papel";
}) {
  const activo = useSyncExternalStore(
    suscribir,
    () => sonando,
    () => false,
  );

  // El fijo se aparta mientras la apertura está en pantalla: allí ya hay uno.
  const [apertura, setApertura] = useState(false);
  useEffect(() => {
    if (sobre) return;
    const mirar = () =>
      setApertura(Boolean(document.querySelector('.apertura[data-estado="dentro"]')));
    mirar();
    window.addEventListener("invitoo:apertura", mirar);
    return () => window.removeEventListener("invitoo:apertura", mirar);
  }, [sobre]);

  // Sobre la portada el botón fijo pisaba la fecha o el botón de confirmar
  // (Mar, Registro). Se queda fuera hasta bajar media pantalla, salvo que ya
  // esté sonando: entonces tiene que estar a mano para pararla.
  const [enPortada, setEnPortada] = useState(true);
  // Mientras se baja leyendo, el botón se aparta: nunca tapa una línea que
  // se está leyendo. Vuelve al subir un poco y al final (el pie le guarda
  // su hueco).
  const [apartado, setApartado] = useState(false);
  useEffect(() => {
    if (sobre) return;
    let antes = window.scrollY;
    const mirar = () => {
      const y = window.scrollY;
      setEnPortada(y < window.innerHeight * 0.5);
      const alFinal = y + window.innerHeight >= document.documentElement.scrollHeight - 8;
      if (alFinal) setApartado(false);
      else if (y > antes + 6) setApartado(true);
      else if (y < antes - 24) setApartado(false);
      antes = y;
    };
    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    return () => window.removeEventListener("scroll", mirar);
  }, [sobre]);
  const oculto = apertura || (enPortada && !activo) || apartado;

  if (!url) return null;

  // Nombre estable + `aria-pressed`: el lector dice «Música, activado».
  const etiqueta = `Música: ${titulo}`;
  const ondas = (
    <span className="flex h-[18px] items-end gap-[3px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="sonido-onda w-[3px] rounded-full bg-current"
          data-activo={activo ? "1" : "0"}
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </span>
  );

  const estilos = (
    <style>{`
      .sonido-onda { height: 7px; transition: height 250ms ease; }
      .sonido-onda[data-activo="1"] { height: 16px; animation: sonidoOnda 900ms ease-in-out infinite alternate; }
      @keyframes sonidoOnda { from { height: 5px } to { height: 17px } }
      .sonido-boton { transition: scale 120ms ease-out, background-color 150ms ease, opacity 200ms ease-out, translate 240ms cubic-bezier(.22,.61,.36,1); }
      .sonido-boton:active { scale: .97; }
      @media (prefers-reduced-motion: reduce) {
        .sonido-onda[data-activo="1"] { animation: none; }
      }
    `}</style>
  );

  if (sobre) {
    const tono =
      sobre === "video"
        ? "border-white/45 bg-black/35 text-white focus-visible:outline-white"
        : "border-[color-mix(in_srgb,var(--tinta)_30%,transparent)] bg-[color-mix(in_srgb,var(--papel)_78%,transparent)] text-[var(--tinta)] focus-visible:outline-[var(--tinta)]";
    return (
      <button
        type="button"
        onClick={() => alternar(url)}
        aria-pressed={activo}
        title={etiqueta}
        className={`sonido-boton inline-flex min-h-14 items-center gap-3 rounded-full border px-6 text-[1rem] tracking-[0.04em] backdrop-blur-md focus-visible:outline-3 focus-visible:outline-offset-3 ${tono}`}
      >
        {ondas}
        <span>{dedicalo ? "Escuchar su canción" : "Con música"}</span>
        {estilos}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => alternar(url)}
      aria-pressed={activo}
      aria-label={etiqueta}
      className="sonido-boton fixed right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-current/20 bg-[var(--papel)]/85 text-[var(--acento-texto,var(--acento))] backdrop-blur-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))]"
      // Se sube para no chocar con la barra de contratación de las muestras.
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
        opacity: oculto ? 0 : 1,
        translate: oculto ? "0 12px" : undefined,
        pointerEvents: oculto ? "none" : undefined,
      }}
      tabIndex={oculto ? -1 : undefined}
      aria-hidden={oculto || undefined}
    >
      {ondas}
      {estilos}
    </button>
  );
}
