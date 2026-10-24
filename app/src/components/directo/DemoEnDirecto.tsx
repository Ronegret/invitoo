"use client";

import { useEffect, useRef, useState } from "react";
import { DISENO_INICIAL, ESTILOS_PASE, type EstiloPase } from "@/lib/momentos/diseno";
import { FOTO_DEL_MOVIL } from "@/lib/momentos/muestra";
import VistaPantalla from "./VistaPantalla";

/**
 * La demo de /en-directo: la TV del salón (la pantalla de verdad, con fotos
 * de muestra) que cambia de estilo sola cada pocos segundos, y un móvil que
 * sube una foto con su mensaje y la hace aparecer en la TV.
 *
 * El usuario manda: en cuanto toca un estilo, deja de cambiar solo. Con
 * `prefers-reduced-motion` no cambia sola nunca.
 */

const CADA_MS = 11_000;
const PAREJA = { a: "Carmen", b: "Javier" };

export default function DemoEnDirecto() {
  const [estilo, setEstilo] = useState<EstiloPase>("polaroid");
  const [auto, setAuto] = useState(true);
  const [foto, setFoto] = useState<(typeof FOTO_DEL_MOVIL & { id: string }) | null>(null);
  const [subida, setSubida] = useState<"lista" | "subiendo" | "hecha">("lista");
  const [progreso, setProgreso] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Solo cambia sola mientras se ve y si nadie ha tocado nada.
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || !visible || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      setEstilo((x) => ESTILOS_PASE[(ESTILOS_PASE.findIndex((y) => y.id === x) + 1) % ESTILOS_PASE.length].id);
    }, CADA_MS);
    return () => window.clearInterval(t);
  }, [auto, visible]);

  function subir() {
    if (subida === "subiendo") return;
    setSubida("subiendo");
    setProgreso(0);
    const inicio = performance.now();
    const paso = () => {
      const f = Math.min(1, (performance.now() - inicio) / 1400);
      setProgreso(f);
      if (f < 1) requestAnimationFrame(paso);
      else {
        setSubida("hecha");
        setFoto({ ...FOTO_DEL_MOVIL, id: `m${Date.now()}` });
      }
    };
    requestAnimationFrame(paso);
  }

  const actual = ESTILOS_PASE.find((x) => x.id === estilo)!;

  return (
    <div ref={caja} className="demo-directo grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center lg:gap-12">
      <div className="min-w-0">
        <VistaPantalla
          diseno={{ ...DISENO_INICIAL, estilo }}
          pareja={PAREJA}
          plantilla="carta"
          foto={foto}
          ritmo={0.6}
          titulo={`Demostración: la pantalla del salón en estilo ${actual.nombre}, con fotos de muestra`}
        />
        <div className="mt-5" role="radiogroup" aria-label="Estilo de la pantalla">
          <div className="flex flex-wrap gap-2">
            {ESTILOS_PASE.map((x) => (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={estilo === x.id}
                onClick={() => {
                  setEstilo(x.id);
                  setAuto(false);
                }}
                className={`inline-flex min-h-12 items-center rounded-full border px-5 text-[1rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b9bf] ${estilo === x.id ? "border-[#f4efe8] bg-[#f4efe8] text-[#1f1a17]" : "border-white/35 text-[#f4efe8] hover:border-white/70"}`}
              >
                {x.nombre}
              </button>
            ))}
          </div>
          <p className="mt-3 min-h-[3.4em] text-[1rem] leading-relaxed text-[#f4efe8]/80" aria-live="polite">
            {actual.descripcion}
            {auto && <span className="sr-only"> Cambia de estilo sola cada once segundos; tocad uno para fijarlo.</span>}
          </p>
        </div>
      </div>

      {/* El móvil de un invitado */}
      <div className="mx-auto w-full max-w-[17rem]">
        <div className="movil rounded-[2.4rem] border border-white/15 bg-[#0e0c0b] p-2.5 shadow-[0_40px_80px_-40px_rgba(0,0,0,.9)]">
          <div className="overflow-hidden rounded-[1.9rem] bg-[#f7f1e8] px-4 pb-5 pt-6 text-[#2a2420]">
            <p className="text-center text-[0.8rem] uppercase tracking-[0.2em] text-[#5e5650]">Las fotos de la boda</p>
            <p className="display mt-1 text-center text-[1.6rem] leading-tight">
              Carmen <span className="italic text-[#8c1d2c]">&amp;</span> Javier
            </p>
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-[#2a2420]/20 p-1 text-[0.85rem] font-medium">
              <span className="rounded-full bg-[#8c1d2c] py-1.5 text-center text-white">Subir</span>
              <span className="py-1.5 text-center">En directo</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element -- foto de muestra */}
              <img src={FOTO_DEL_MOVIL.src} alt="La foto que va a subir el invitado" className="aspect-[4/3] w-full object-cover" width={900} height={675} loading="lazy" />
            </div>
            <p className="display mt-3 text-[1.05rem] italic leading-snug">«{FOTO_DEL_MOVIL.mensaje}»</p>
            <button
              type="button"
              onClick={subida === "hecha" ? () => setSubida("lista") : subir}
              disabled={subida === "subiendo"}
              className="mt-4 flex min-h-14 w-full items-center justify-center rounded-md bg-[#8c1d2c] px-4 text-[1.05rem] font-medium text-white transition-transform active:scale-[.98] disabled:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c1d2c]"
            >
              {subida === "lista" ? "Subir esta foto" : subida === "subiendo" ? `Subiendo ${Math.round(progreso * 100)} %` : "Subir otra vez"}
            </button>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#2a2420]/10" aria-hidden>
              <div className="h-full rounded-full bg-[#8c1d2c]" style={{ width: `${subida === "lista" ? 0 : Math.max(4, progreso * 100)}%` }} />
            </div>
            <p className="mt-2 min-h-[2.8em] text-center text-[0.95rem] leading-snug text-[#5e5650]" role="status">
              {subida === "hecha" ? "✓ Subida. Mirad la TV." : "Pulsad y mirad la TV."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
