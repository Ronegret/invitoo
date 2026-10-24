"use client";

import { useRef, useState, useSyncExternalStore } from "react";

function reloj(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

const nada = () => () => {};

/**
 * La onda: 56 barras con alturas fijas (deterministas, sin Math.random:
 * la misma onda siempre). Lo que ya ha sonado se tiñe de oro.
 */
const BARRAS = Array.from({ length: 56 }, (_, i) => {
  const v = Math.abs(Math.sin(i * 1.73) * Math.cos(i * 0.41)) * 0.8 + Math.abs(Math.sin(i * 0.23)) * 0.35;
  return Math.max(0.16, Math.min(1, v));
});

/**
 * El reproductor de la canción de muestra.
 *
 * `preload="none"`: el megabyte del audio no se pide hasta que alguien
 * pulsa. La barra es un `<input type="range">` de verdad, así que se mueve
 * con el teclado y el lector de pantalla dice dónde va; encima se pinta una
 * línea fina que avanza con `transform`, nada que recoloque la página.
 *
 * Sin JavaScript se ve el `<audio controls>` nativo, que también funciona.
 * Al hidratar se cambia por el propio.
 */
export default function Reproductor({
  src,
  titulo,
  duracion,
}: {
  src: string;
  titulo: string;
  /** Segundos, para pintar la duración antes de cargar nada. */
  duracion: number;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [sonando, setSonando] = useState(false);
  const [t, setT] = useState(0);
  const [total, setTotal] = useState(duracion);
  // true en cliente, false en el HTML del servidor.
  const cliente = useSyncExternalStore(nada, () => true, () => false);

  function alternar() {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setSonando(false));
    else a.pause();
  }

  return (
    <div className="w-full">
      <audio
        ref={audio}
        src={src}
        preload="none"
        controls={!cliente}
        onLoadedMetadata={(e) => setTotal(e.currentTarget.duration)}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onEnded={() => setSonando(false)}
        className={cliente ? "hidden" : "w-full"}
      />

      {cliente && (
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={alternar}
            aria-label={sonando ? "Pausar la canción" : `Escuchar ${titulo}`}
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[var(--papel)] text-[var(--tinta)] transition-transform duration-200 ease-out hover:scale-[1.04]"
          >
            {sonando ? (
              <span aria-hidden className="flex gap-[5px]">
                <span className="block h-4 w-[4px] bg-current" />
                <span className="block h-4 w-[4px] bg-current" />
              </span>
            ) : (
              <span
                aria-hidden
                className="ml-1 block h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-current"
              />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[1rem] leading-snug opacity-85">{titulo}</p>
            <div
              className="onda-cancion relative mt-3 h-11 rounded-sm has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-4 has-[input:focus-visible]:outline-[var(--papel)]"
              data-sonando={sonando || undefined}
            >
              <span aria-hidden className="absolute inset-0 flex items-center justify-between gap-[2px]">
                {BARRAS.map((h, i) => {
                  const hecho = total ? i / BARRAS.length < t / total : false;
                  return (
                    <span
                      key={i}
                      className="onda-barra block w-full max-w-[4px] rounded-full"
                      style={{
                        height: `${Math.round(h * 100)}%`,
                        background: hecho ? "var(--oro)" : "color-mix(in srgb, var(--papel) 30%, transparent)",
                        animationDelay: `${(i % 7) * 90}ms`,
                      }}
                    />
                  );
                })}
              </span>
              <input
                type="range"
                min={0}
                max={Math.round(total) || 0}
                step={1}
                value={Math.round(t)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (audio.current) audio.current.currentTime = v;
                  setT(v);
                }}
                aria-label="Posición de la canción"
                aria-valuetext={`${reloj(t)} de ${reloj(total)}`}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <p className="mt-1 flex justify-between text-[0.95rem] tabular-nums opacity-60">
              <span>{reloj(t)}</span>
              <span>{reloj(total)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
