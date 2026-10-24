"use client";

import { useEffect, useRef, useState } from "react";
import { Anuncio, mayuscula, useCuenta } from "./cuenta";

/**
 * RIVIERA (K5) — las islas de cliente:
 *  · `RivieraRelojes`: el cuadro de relojes cromados (días, horas, minutos
 *    y segundos, con barrido suave). La aguja adorna; el número informa.
 *    Y la llave: «Arrancar» hace que las cuatro agujas barran hasta el
 *    final y vuelvan, como un coche al arrancar. Los números no cambian.
 *  · `RivieraSeda`: las dos hojas de papel de seda de la portada; se
 *    apartan solas y también con el dedo.
 *  · `RivieraReserva`: envuelve el RSVP (sin tocarlo); al confirmar se
 *    estampa en seco «Reservado · Carmen».
 */

const quieto = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Un seis cilindros al ralentí, sintetizado y sin marca: 1 s, bajito. Solo tras un gesto. */
function motor() {
  if (document.documentElement.dataset.silencio === "1") return;
  try {
    const c = new AudioContext();
    const o = c.createOscillator();
    const lfo = c.createOscillator();
    const lg = c.createGain();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(48, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(82, c.currentTime + 0.35);
    o.frequency.exponentialRampToValueAtTime(52, c.currentTime + 1);
    lfo.frequency.value = 22;
    lg.gain.value = 8;
    lfo.connect(lg).connect(o.frequency);
    f.type = "lowpass";
    f.frequency.value = 420;
    g.gain.setValueAtTime(0.001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, c.currentTime + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1);
    o.connect(f).connect(g).connect(c.destination);
    o.start();
    lfo.start();
    o.stop(c.currentTime + 1);
    lfo.stop(c.currentTime + 1);
    window.setTimeout(() => void c.close(), 1300);
  } catch {
    /* sin audio */
  }
}

function Reloj({ valor, max, etiqueta, barrido }: { valor: number; max: number; etiqueta: string; barrido: boolean }) {
  const v = barrido ? max : valor;
  // Cuando la cuenta da la vuelta (0 → 59), la aguja salta sin rebobinar.
  const salto = !barrido && valor === max - 1 && max <= 60;
  return (
    <figure className="rv-reloj">
      <div className="rv-esfera" data-salto={salto ? "1" : undefined} style={{ "--giro": `${(Math.min(v, max) / max) * 270 - 135}deg` } as React.CSSProperties}>
        <span className="rv-marcas" />
        <span className="rv-aguja" />
        <span className="rv-eje" />
      </div>
      <figcaption>
        <span className="display tabular-nums">{valor}</span>
        <span className="rv-et">{etiqueta}</span>
      </figcaption>
    </figure>
  );
}

export function RivieraRelojes({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const [barrido, setBarrido] = useState(false);
  const [girada, setGirada] = useState(false);

  function arrancar() {
    setGirada(true);
    window.setTimeout(() => setGirada(false), 900);
    motor();
    if (quieto()) return;
    try {
      navigator.vibrate?.([0, 15, 20, 15]);
    } catch {
      /* sin vibración */
    }
    setBarrido(true);
    window.setTimeout(() => setBarrido(false), 650);
  }

  const vivo = c.vivo && c.estado === "falta";
  return (
    <div className="rv-cuadro" data-barrido={barrido ? "1" : undefined}>
      <Anuncio c={c} />
      {vivo ? (
        <div className="rv-relojes" aria-hidden="true">
          <Reloj valor={c.d} max={365} etiqueta={c.d === 1 ? "día" : "días"} barrido={barrido} />
          <Reloj valor={c.h} max={24} etiqueta="horas" barrido={barrido} />
          <Reloj valor={c.m} max={60} etiqueta="minutos" barrido={barrido} />
          <Reloj valor={c.s} max={60} etiqueta="segundos" barrido={barrido} />
        </div>
      ) : (
        <p className="rv-cuadro-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy es el día" : c.estado === "paso" ? "Ya nos casamos. Gracias por el viaje" : mayuscula(c.fecha)}
        </p>
      )}
      <button
        type="button"
        className="rv-llave"
        data-girada={girada ? "1" : undefined}
        aria-label="Arrancar: las agujas recorren los relojes"
        onClick={arrancar}
      >
        <svg viewBox="0 0 64 24" aria-hidden="true" className="rv-llave-svg">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3.5" className="hueco" />
          <path d="M22 10 H58 L62 12 L58 14 H52 V18 H48 V14 H44 V17 H40 V14 H22 Z" />
        </svg>
        <span>Arrancar</span>
      </button>
    </div>
  );
}

export function RivieraSeda() {
  const ref = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; hoja: HTMLElement; base: number } | null>(null);
  return (
    <div
      ref={ref}
      className="rv-seda"
      aria-hidden="true"
      onPointerDown={(e) => {
        const hoja = (e.target as HTMLElement).closest<HTMLElement>(".rv-hoja");
        if (!hoja) return;
        const m = /translateX\((-?[\d.]+)px\)/.exec(hoja.style.transform);
        arrastre.current = { x: e.clientX, hoja, base: m ? Number(m[1]) : 0 };
        hoja.setPointerCapture(e.pointerId);
        hoja.dataset.mano = "1";
      }}
      onPointerMove={(e) => {
        const a = arrastre.current;
        if (!a) return;
        const izq = a.hoja.classList.contains("izq");
        const dx = a.base + e.clientX - a.x;
        a.hoja.style.transform = `translateX(${izq ? Math.min(0, dx) : Math.max(0, dx)}px)`;
      }}
      onPointerUp={() => {
        arrastre.current = null;
      }}
      onPointerCancel={() => {
        arrastre.current = null;
      }}
    >
      <span className="rv-hoja izq" />
      <span className="rv-hoja der" />
    </div>
  );
}

export function RivieraReserva({ slug, children }: { slug: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    let visto = false;
    const mira = () => {
      if (visto || !raiz.querySelector(".rsvp-estampa, .rsvp-sello")) return;
      visto = true;
      let n = "";
      try {
        const r = JSON.parse(window.localStorage.getItem(`invitoo:rsvp:${slug}`) ?? "null") as { personas?: { nombre?: string }[] } | null;
        n = (r?.personas?.[0]?.nombre ?? "").trim().split(/\s+/)[0] ?? "";
      } catch {
        /* sin nombre */
      }
      setNombre(n);
    };
    mira();
    const mo = new MutationObserver(mira);
    mo.observe(raiz, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [slug]);
  return (
    <div ref={ref} className="rv-reserva" data-reservado={nombre !== null ? "1" : undefined}>
      <p className="rv-estampa" role="status">
        {nombre !== null && (
          <>
            <span className="rv-estampa-a">Reservado</span>
            {nombre && <span className="rv-estampa-b">{nombre}</span>}
          </>
        )}
      </p>
      {children}
    </div>
  );
}
