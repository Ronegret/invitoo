"use client";

import { useEffect, useRef, useState } from "react";

/**
 * La canción de la boda.
 *
 * El vídeo de apertura va mudo por obligación del navegador, así que la
 * canción de Dedícalo necesita un gesto del invitado. En vez de esconderlo,
 * se convierte en parte de la invitación: un botón discreto y permanente.
 *
 * El audio no se descarga hasta que se pulsa: 0 bytes para quien no lo quiere.
 *
 * Y si la canción YA viene sonando porque el invitado eligió «entrar con su
 * canción» en la puerta, este botón **toma el relevo de esa misma
 * reproducción** en lugar de abrir una segunda. Dos pistas a la vez sonando
 * encima la una de la otra es el peor fallo posible en una invitación con
 * música.
 */
export default function BotonSonido({
  url,
  titulo,
}: {
  url: string;
  titulo: string;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [sonando, setSonando] = useState(false);

  useEffect(() => {
    // La puerta avisa por aquí de que ya hay una pista en marcha.
    const recoger = (e: Event) => {
      const a = (e as CustomEvent<{ audio: HTMLAudioElement }>).detail?.audio;
      if (!a) return;
      audio.current = a;
      setSonando(!a.paused);
    };
    window.addEventListener("invitoo:audio", recoger);
    return () => {
      window.removeEventListener("invitoo:audio", recoger);
      audio.current?.pause();
      audio.current = null;
    };
  }, []);

  function alternar() {
    if (!audio.current) {
      audio.current = new Audio(url);
      audio.current.loop = true;
      audio.current.volume = 0.32;
    }
    if (sonando) {
      audio.current.pause();
      setSonando(false);
    } else {
      void audio.current.play().then(
        () => setSonando(true),
        () => setSonando(false),
      );
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={sonando}
      aria-label={sonando ? `Silenciar ${titulo}` : `Escuchar ${titulo}`}
      className="fixed right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-current/20 bg-[var(--papel)]/85 backdrop-blur-md"
      // Se sube para no chocar con la barra de contratación de las muestras.
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
    >
      <span className="flex items-end gap-[3px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-[var(--acento)]"
            style={{
              height: sonando ? 16 : 7,
              animation: sonando
                ? `onda 900ms ${i * 140}ms ease-in-out infinite alternate`
                : undefined,
              transition: "height 250ms ease",
            }}
          />
        ))}
      </span>
      <style>{`@keyframes onda { from { height: 5px } to { height: 17px } }`}</style>
    </button>
  );
}
