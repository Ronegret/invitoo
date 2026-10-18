"use client";

import { useEffect, useRef, useState } from "react";
import SelloAlianzas from "@/components/SelloAlianzas";

type Props = {
  a: string;
  b: string;
  fecha: string;
  /** Se llama cuando la apertura termina y la portada toma el control. */
  onAbierta: () => void;
  reducido: boolean;
};

/**
 * Apertura 01 — Sobre.
 * Reposo → el invitado toca → el lacre se rompe, la solapa gira,
 * la cartulina sube y se acerca hasta ser la portada.
 * Sin librerías: CSS 3D puro. Ver docs/04-diseno.md §3.
 */
export default function Sobre({ a, b, fecha, onAbierta, reducido }: Props) {
  const [fase, setFase] = useState<"reposo" | "abriendo">("reposo");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  function abrir() {
    if (fase !== "reposo") return;
    setFase("abriendo");
    temporizador.current = setTimeout(onAbierta, reducido ? 400 : 3200);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[var(--papel)] grano"
      data-fase={fase}
    >
      <button
        type="button"
        onClick={abrir}
        aria-label="Abrir la invitación"
        className="escena absolute inset-0 grid cursor-pointer place-items-center"
        disabled={fase !== "reposo"}
      >
        <div className="sobre">
          {/* cartulina: lo que sube y se convierte en la portada */}
          <div className="cartulina">
            <p className="fecha">{fecha}</p>
            <p className="display nombres">
              {a}
              <span className="amp"> &amp; </span>
              {b}
            </p>
            <span className="filete" />
          </div>

          {/* bolsillo frontal del sobre */}
          <div className="frente" />

          {/* solapa superior */}
          <div className="solapa">
            <span className="lacre">
              <SelloAlianzas size={44} className="text-[var(--papel)]" />
            </span>
          </div>
        </div>
      </button>

      {fase === "reposo" && (
        <p className="pointer-events-none absolute bottom-[12vh] text-[0.78rem] uppercase tracking-[0.32em] text-[var(--tinta)]/55">
          Toca para abrir
        </p>
      )}

      {fase === "abriendo" && !reducido && (
        <button
          type="button"
          onClick={onAbierta}
          className="absolute right-5 z-50 rounded-full border border-[var(--tinta)]/20 px-4 py-2 text-xs tracking-widest uppercase text-[var(--tinta)]/70"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
        >
          Saltar
        </button>
      )}

      <style>{`
        .escena { perspective: 1400px; perspective-origin: 50% 40%; }
        .sobre {
          position: relative;
          width: min(78vw, 340px);
          aspect-ratio: 3 / 2;
          transform-style: preserve-3d;
          transition: transform .9s cubic-bezier(.4,0,.2,1);
        }
        [data-fase="abriendo"] .sobre { transform: translateY(6vh) scale(.92); }

        /* --- cartulina --- */
        .cartulina {
          position: absolute;
          left: 4%; right: 4%; bottom: 6%;
          height: 118%;
          z-index: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: .9rem;
          background: var(--papel);
          box-shadow: 0 1px 0 rgba(0,0,0,.08);
          border: 1px solid color-mix(in srgb, var(--tinta) 10%, transparent);
        }
        [data-fase="abriendo"] .cartulina {
          animation: subeCartulina 2.3s .75s cubic-bezier(.33,0,.15,1) forwards;
        }
        @keyframes subeCartulina {
          0%   { transform: translateY(0) scale(1); z-index: 1; box-shadow: 0 1px 0 rgba(0,0,0,.08); }
          38%  { transform: translateY(-64%) scale(1); z-index: 5; box-shadow: 0 26px 50px rgba(0,0,0,.24); }
          100% { transform: translateY(-46%) scale(3.4); z-index: 5; box-shadow: 0 60px 120px rgba(0,0,0,.18); }
        }

        .fecha {
          font-size: .7rem; letter-spacing: .34em; text-transform: uppercase;
          color: color-mix(in srgb, var(--tinta) 55%, transparent);
        }
        .nombres { font-size: clamp(1.6rem, 7vw, 2.4rem); text-align: center; }
        .amp { color: var(--acento); font-style: italic; }
        .filete { width: 34px; height: 1px; background: var(--acento); }

        /* --- cuerpo del sobre --- */
        .frente {
          position: absolute; inset: 0; z-index: 3;
          background:
            linear-gradient(160deg,
              color-mix(in srgb, var(--bruma) 88%, #fff) 0%,
              var(--bruma) 100%);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          box-shadow: 0 18px 40px rgba(0,0,0,.14), inset 0 0 0 1px rgba(0,0,0,.05);
        }
        .frente::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(to bottom right, transparent 49.6%, color-mix(in srgb, var(--tinta) 7%, transparent) 50%, transparent 50.4%),
                      linear-gradient(to bottom left,  transparent 49.6%, color-mix(in srgb, var(--tinta) 7%, transparent) 50%, transparent 50.4%);
        }

        /* --- solapa --- */
        .solapa {
          position: absolute; top: 0; left: 0; right: 0; height: 62%;
          z-index: 4;
          transform-origin: top center;
          transform-style: preserve-3d;
          background: linear-gradient(175deg,
            color-mix(in srgb, var(--bruma) 96%, #fff) 0%,
            color-mix(in srgb, var(--bruma) 82%, var(--tinta)) 100%);
          clip-path: polygon(0 0, 100% 0, 50% 100%);
          display: grid; place-items: center;
          box-shadow: 0 6px 14px rgba(0,0,0,.08);
        }
        [data-fase="abriendo"] .solapa {
          animation: giraSolapa 1.1s .25s cubic-bezier(.6,-0.2,.3,1) forwards;
        }
        @keyframes giraSolapa {
          0%   { transform: rotateX(0deg);   z-index: 4; }
          49%  { z-index: 4; }
          50%  { z-index: 0; }
          100% { transform: rotateX(-172deg); z-index: 0; }
        }

        /* --- lacre --- */
        .lacre {
          position: absolute; top: 58%; left: 50%;
          translate: -50% -50%;
          width: 74px; height: 74px; border-radius: 999px;
          display: grid; place-items: center;
          background: radial-gradient(circle at 34% 30%,
            color-mix(in srgb, var(--acento) 78%, #fff) 0%,
            var(--acento) 46%,
            color-mix(in srgb, var(--acento) 70%, #000) 100%);
          box-shadow: 0 3px 10px rgba(0,0,0,.3), inset 0 -2px 6px rgba(0,0,0,.35);
        }
        [data-fase="abriendo"] .lacre {
          animation: rompeLacre .5s cubic-bezier(.36,1.6,.4,1) forwards;
        }
        @keyframes rompeLacre {
          0%   { transform: scale(1);    opacity: 1; }
          22%  { transform: scale(1.14); opacity: 1; }
          100% { transform: scale(.6);   opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sobre, .cartulina, .solapa, .lacre { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
