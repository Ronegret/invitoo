"use client";

import { useEffect, useRef, useState } from "react";
import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * LÚPULO Y COBRE (K5) — las dos islas de cliente:
 *  · `LupuloPizarra`: la cuenta atrás escrita con tiza en la pizarra del
 *    bar, y una caña que se va llenando. Un toque en la caña sube un
 *    chorro de burbujas desde el dedo.
 *  · `LupuloJarras`: envuelve el RSVP de siempre (sin tocarlo). Al
 *    aparecer su sello de «sí», las jarras chocan: «¡Salud, Carmen!».
 *    También con el botón «Chocar las jarras» o arrastrando una jarra
 *    hacia la otra.
 * Sin JS: la pizarra enseña la fecha y las jarras esperan juntas.
 */

const quieto = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** El cristal de dos jarras (sintetizado, 0,5 s, volumen 0,3). Solo tras un gesto. */
function cristal() {
  if (document.documentElement.dataset.silencio === "1") return;
  try {
    const c = new AudioContext();
    const g = c.createGain();
    g.connect(c.destination);
    g.gain.setValueAtTime(0.3, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    for (const hz of [1870, 2950, 4210]) {
      const o = c.createOscillator();
      o.frequency.value = hz;
      o.connect(g);
      o.start();
      o.stop(c.currentTime + 0.5);
    }
    window.setTimeout(() => void c.close(), 800);
  } catch {
    /* sin audio */
  }
}

export function LupuloPizarra({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const cana = useRef<HTMLButtonElement>(null);
  // La caña se llena a lo largo del último año (mínimo: vacía).
  const nivel = c.vivo ? (c.estado === "falta" ? Math.max(0.08, 1 - c.d / 365) : 1) : 0.62;

  function burbujas(e: React.PointerEvent<HTMLButtonElement>) {
    const el = cana.current;
    if (!el || quieto()) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    for (let i = 0; i < 9; i++) {
      const b = document.createElement("i");
      b.className = "lp-chorro";
      b.style.left = `${Math.min(80, Math.max(20, x + (Math.random() - 0.5) * 18))}%`;
      b.style.animationDelay = `${i * 70}ms`;
      b.style.setProperty("--t", `${4 + Math.random() * 6}px`);
      el.appendChild(b);
      window.setTimeout(() => b.remove(), 1900);
    }
  }

  return (
    <div className="lp-pizarra-cuerpo" data-vivo={c.vivo ? "1" : undefined}>
      <Anuncio c={c} />
      {c.vivo && c.estado === "falta" ? (
        <dl className="lp-tiza-cifras" aria-hidden="true">
          {(
            [
              ["días de maduración", String(c.d)],
              ["horas de fermentado", dos(c.h)],
              ["minutos", dos(c.m)],
              ["segundos", dos(c.s)],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dd className="display tabular-nums">
                {/* Cada cifra con su `key`: solo se reescribe la que cambia. */}
                <span key={v} className="lp-tiza">{v}</span>
              </dd>
              <dt>{k}</dt>
            </div>
          ))}
        </dl>
      ) : (
        <p className="lp-tiza-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy se sirve" : c.estado === "paso" ? "Ya nos casamos. ¡Salud!" : mayuscula(c.fecha)}
        </p>
      )}
      <button
        ref={cana}
        type="button"
        className="lp-cana"
        style={{ "--nivel": nivel } as React.CSSProperties}
        aria-label="Tocar la caña: suben burbujas"
        onPointerDown={burbujas}
      >
        <span className="lp-cana-vaso" aria-hidden="true">
          <span className="lp-cana-liquido" />
          <span className="lp-cana-espuma" />
          <span className="lp-cana-burbuja" style={{ "--x": "30%", "--d": "0s" } as React.CSSProperties} />
          <span className="lp-cana-burbuja" style={{ "--x": "58%", "--d": "1.3s" } as React.CSSProperties} />
          <span className="lp-cana-burbuja" style={{ "--x": "44%", "--d": "2.4s" } as React.CSSProperties} />
        </span>
      </button>
    </div>
  );
}

/** Una jarra de cristal grabado, genérica y sin etiqueta. */
function Jarra({ lado }: { lado: "izq" | "der" }) {
  return (
    <svg className={`lp-jarra ${lado}`} viewBox="0 0 80 120" aria-hidden="true">
      <path className="lp-jarra-cerveza" d="M14 30 L18 108 Q19 114 26 114 L52 114 Q59 114 60 108 L64 30 Z" />
      <path className="lp-jarra-espuma" d="M11 31 Q14 18 26 21 Q32 12 42 18 Q52 11 58 20 Q69 19 67 31 Z" />
      <path className="lp-jarra-vidrio" d="M12 24 L17 109 Q18 116 26 116 L52 116 Q60 116 61 109 L66 24" />
      {/* El asa por fuera: las dos jarras se miran. */}
      <path className="lp-jarra-asa" d={lado === "der" ? "M64 44 Q80 46 78 66 Q77 84 61 86" : "M14 44 Q-2 46 0 66 Q1 84 17 86"} />
      <path className="lp-jarra-grabado" d="M30 52 Q39 44 48 52 M29 62 Q39 54 49 62 M30 72 Q39 64 48 72" />
    </svg>
  );
}

export function LupuloJarras({ slug, children }: { slug: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const der = useRef<HTMLDivElement>(null);
  const [salud, setSalud] = useState<"" | "1">("");
  const [nombre, setNombre] = useState("");
  const arrastre = useRef<{ x: number; dx: number } | null>(null);

  function brindar(sonar: boolean) {
    setSalud("1");
    if (sonar) cristal();
    if (!quieto()) {
      try {
        navigator.vibrate?.(15);
      } catch {
        /* sin vibración */
      }
    }
  }

  // El sello de «sí» del RSVP (recién puesto o de otro día).
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    let visto = false;
    const mira = () => {
      if (visto) return;
      const recien = raiz.querySelector(".rsvp-estampa");
      if (!recien && !raiz.querySelector(".rsvp-sello")) return;
      visto = true;
      try {
        const r = JSON.parse(window.localStorage.getItem(`invitoo:rsvp:${slug}`) ?? "null") as { personas?: { nombre?: string }[] } | null;
        setNombre((r?.personas?.[0]?.nombre ?? "").trim().split(/\s+/)[0] ?? "");
      } catch {
        /* sin nombre */
      }
      setSalud("1");
      if (recien && !quieto()) navigator.vibrate?.(15);
    };
    mira();
    const mo = new MutationObserver(mira);
    mo.observe(raiz, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [slug]);

  const mover = (e: React.PointerEvent) => {
    const a = arrastre.current;
    if (!a || !der.current) return;
    a.dx = Math.min(0, Math.max(-90, e.clientX - a.x));
    der.current.style.transform = `translateX(${a.dx}px)`;
  };
  const soltar = () => {
    const a = arrastre.current;
    arrastre.current = null;
    if (der.current) der.current.style.transform = "";
    if (a && a.dx < -45) brindar(true);
  };

  return (
    <div ref={ref} className="lp-brindis" data-salud={salud || undefined}>
      <div className="lp-jarras" aria-hidden="true">
        <div className="lp-jarra-caja izq">
          <Jarra lado="izq" />
        </div>
        <span className="lp-gotas">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ "--a": `${-150 + i * 13}deg`, "--d": `${34 + (i % 3) * 12}px` } as React.CSSProperties} />
          ))}
        </span>
        <div
          ref={der}
          className="lp-jarra-caja der"
          onPointerDown={(e) => {
            arrastre.current = { x: e.clientX, dx: 0 };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
        >
          <Jarra lado="der" />
        </div>
      </div>
      <p className="lp-salud display" role="status">
        {salud ? `¡Salud${nombre ? `, ${nombre}` : ""}!` : ""}
      </p>
      {!salud && (
        <button type="button" className="lp-boton" onClick={() => brindar(true)}>
          Chocar las jarras
        </button>
      )}
      {children}
    </div>
  );
}
