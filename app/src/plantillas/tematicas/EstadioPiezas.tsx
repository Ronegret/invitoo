"use client";

import { useEffect, useRef, useState } from "react";
import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * NOCHE DE ESTADIO (K5) — las islas de cliente:
 *  · `EstadioMarcador`: la cuenta atrás en un marcador de paletas abatibles;
 *    solo gira la cifra que cambia.
 *  · `EstadioGol`: envuelve el RSVP (sin tocarlo). Al aparecer su sello de
 *    «sí»: el balón entra por la escuadra, la red se hincha, los focos
 *    destellan una vez, cae confeti en vuestros colores y el marcador pasa
 *    a «1 – 0». También con el botón «Marcar el gol».
 *  · `EstadioGrada`: la grada del cierre; un toque hace la ola desde el dedo.
 * Sin JS: el marcador enseña la fecha y la red y la grada esperan quietas.
 */

const quieto = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** El rugido de la grada: ruido filtrado, 1 s, bajito. Solo tras un gesto. */
function rugido() {
  if (document.documentElement.dataset.silencio === "1") return;
  try {
    const c = new AudioContext();
    const n = c.sampleRate;
    const buf = c.createBuffer(1, n, n);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    f.type = "bandpass";
    f.frequency.value = 700;
    f.Q.value = 0.6;
    g.gain.setValueAtTime(0.001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.25);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1);
    s.buffer = buf;
    s.connect(f).connect(g).connect(c.destination);
    s.start();
    window.setTimeout(() => void c.close(), 1300);
  } catch {
    /* sin audio */
  }
}

function Paleta({ valor, etiqueta, grande }: { valor: string; etiqueta: string; grande?: boolean }) {
  return (
    <div className={`es-paleta${grande ? " grande" : ""}`}>
      <span className="es-paleta-cifras">
        {Array.from(valor).map((n, i) => (
          <span key={`${i}-${n}`} className="es-cifra display tabular-nums">
            {n}
          </span>
        ))}
      </span>
      <span className="es-paleta-et">{etiqueta}</span>
    </div>
  );
}

export function EstadioMarcador({ hasta, a, b }: { hasta: string; a: string; b: string }) {
  const c = useCuenta(hasta);
  return (
    <div className="es-marcador">
      <Anuncio c={c} />
      <p className="es-marcador-rotulo">
        {a} y {b} · La final
      </p>
      {c.vivo && c.estado === "falta" ? (
        <div className="es-marcador-cifras" aria-hidden="true">
          <Paleta valor={String(c.d)} etiqueta="días" grande />
          <div className="es-marcador-fila">
            <Paleta valor={dos(c.h)} etiqueta="horas" />
            <Paleta valor={dos(c.m)} etiqueta="min" />
            <Paleta valor={dos(c.s)} etiqueta="seg" />
          </div>
        </div>
      ) : (
        <p className="es-marcador-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy es la final" : c.estado === "paso" ? "Ya nos casamos. ¡Gracias, afición!" : mayuscula(c.fecha)}
        </p>
      )}
    </div>
  );
}

export function EstadioGol({ slug, children }: { slug: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gol, setGol] = useState<"" | "1" | "recien">("");
  const [nombre, setNombre] = useState("");

  function marcar() {
    setGol("recien");
    rugido();
    if (!quieto()) {
      try {
        navigator.vibrate?.([30, 50, 30, 50, 80]);
      } catch {
        /* sin vibración */
      }
    }
  }

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
      setGol(recien ? "recien" : "1");
      if (recien && !quieto()) navigator.vibrate?.([30, 50, 30, 50, 80]);
    };
    mira();
    const mo = new MutationObserver(mira);
    mo.observe(raiz, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [slug]);

  return (
    <div ref={ref} className="es-gol" data-gol={gol || undefined}>
      <div className="es-porteria" aria-hidden="true">
        <span className="es-foco f1" />
        <span className="es-foco f2" />
        <svg className="es-red" viewBox="0 0 240 120">
          <defs>
            <pattern id="es-malla" width="10" height="9" patternUnits="userSpaceOnUse">
              <path d="M0 4.5 L2.5 0 H7.5 L10 4.5 L7.5 9 H2.5 Z" fill="none" stroke="currentColor" strokeWidth=".6" />
            </pattern>
          </defs>
          <rect className="es-malla" x="14" y="14" width="212" height="100" fill="url(#es-malla)" />
          <path className="es-palos" d="M12 118 V12 H228 V118" />
        </svg>
        <span className="es-balon" />
        <span className="es-confeti">
          {Array.from({ length: 40 }, (_, i) => (
            <i key={i} className={`c${i % 3}`} style={{ "--x": `${(i * 53) % 100}%`, "--r": `${(i * 47) % 360}deg`, "--d": `${(i % 8) * 70}ms` } as React.CSSProperties} />
          ))}
        </span>
      </div>
      <p className="es-resultado display tabular-nums" aria-hidden="true">
        {gol ? "1 – 0" : "0 – 0"}
      </p>
      <p className="es-golazo" role="status">
        {gol ? `¡Golazo${nombre ? `, ${nombre}` : ""}! Te esperamos en la grada.` : ""}
      </p>
      {!gol && (
        <button type="button" className="es-boton" onClick={marcar}>
          Marcar el gol
        </button>
      )}
      {children}
    </div>
  );
}

/** La grada: filas de puntos en vuestros colores. Un toque hace la ola. */
export function EstadioGrada() {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      className="es-grada"
      aria-label="Haced la ola"
      onClick={(e) => {
        const el = ref.current;
        if (!el || quieto()) return;
        const r = el.getBoundingClientRect();
        const x = e.clientX ? (e.clientX - r.left) / r.width : 0.5;
        el.querySelectorAll<HTMLElement>("i").forEach((p) => {
          const px = Number(p.dataset.c) / 23;
          p.style.animation = "none";
          void p.offsetWidth;
          p.style.animation = `es-ola 700ms var(--ease-carta) ${Math.round(Math.abs(px - x) * 900)}ms both`;
        });
      }}
    >
      {Array.from({ length: 4 }, (_, f) => (
        <span key={f} className="es-fila" aria-hidden="true">
          {Array.from({ length: 24 }, (_, c) => (
            <i key={c} data-c={c} className={`k${(c + f) % 3}`} style={{ "--i": c + f * 3 } as React.CSSProperties} />
          ))}
        </span>
      ))}
    </button>
  );
}
