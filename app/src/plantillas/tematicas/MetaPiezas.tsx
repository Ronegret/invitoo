"use client";

import { useEffect, useRef, useState } from "react";
import { Anuncio, dos, mayuscula, useCuenta } from "./cuenta";

/**
 * LÍNEA DE META (K5) — las islas de cliente:
 *  · `MetaReloj`: el reloj del pórtico de meta, y el tiempo que falta
 *    convertido en kilómetros de maratón, con un punto en la pista.
 *  · `MetaCinta`: envuelve el RSVP (sin tocarlo). Al aparecer su sello de
 *    «sí», la cinta de meta se rompe, el reloj se congela («Tu tiempo hasta
 *    la boda») y cae la medalla. También con «Cruzar la meta» o
 *    deslizando el dedo por la cinta.
 *  · `MetaMedalla`: un botón; al tocarla se da la vuelta y enseña el reverso.
 * Sin JS: el reloj enseña la fecha, la cinta está tensa y la medalla quieta.
 */

const quieto = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MARATON = 42.195;

/** La cinta de raso que se rompe: un chasquido seco de 0,3 s. Solo tras un gesto. */
function chasquido() {
  if (document.documentElement.dataset.silencio === "1") return;
  try {
    const c = new AudioContext();
    const n = Math.round(c.sampleRate * 0.3);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const s = c.createBufferSource();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    f.type = "highpass";
    f.frequency.value = 1800;
    g.gain.value = 0.3;
    s.buffer = buf;
    s.connect(f).connect(g).connect(c.destination);
    s.start();
    window.setTimeout(() => void c.close(), 600);
  } catch {
    /* sin audio */
  }
}

const km = (d: number, h: number) => Math.min(MARATON, ((d + h / 24) / 365) * MARATON);

export function MetaReloj({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const falta = c.vivo && c.estado === "falta";
  const k = falta ? km(c.d, c.h) : 0;
  // Un óvalo de pista: el punto avanza hacia la meta (arriba) según lo recorrido.
  const hecho = falta ? 1 - k / MARATON : 1;
  return (
    <div className="mt-reloj">
      <Anuncio c={c} />
      {falta ? (
        <div aria-hidden="true">
          <p className="mt-reloj-dias display tabular-nums">
            {c.d} <span>{c.d === 1 ? "día" : "días"}</span>
          </p>
          <p className="mt-crono tabular-nums">
            {dos(c.h)}:{dos(c.m)}:<span key={c.s} className="mt-crono-s">{dos(c.s)}</span>
          </p>
          <p className="mt-reloj-et">horas · minutos · segundos</p>
        </div>
      ) : (
        <p className="mt-reloj-fecha display" aria-hidden={c.vivo ? "true" : undefined}>
          {c.estado === "hoy" ? "Hoy cruzamos la meta" : c.estado === "paso" ? "Ya nos casamos. ¡Meta!" : mayuscula(c.fecha)}
        </p>
      )}
      <svg className="mt-ovalo" viewBox="0 0 220 110" aria-hidden="true">
        <rect x="6" y="6" width="208" height="98" rx="49" className="mt-ovalo-calle" />
        <rect x="16" y="16" width="188" height="78" rx="39" className="mt-ovalo-interior" />
        <rect x="11" y="11" width="198" height="88" rx="44" pathLength={1} className="mt-ovalo-hecho" style={{ strokeDashoffset: 1 - hecho }} />
        <path d="M110 4 V20" className="mt-ovalo-meta" />
      </svg>
      {falta && (
        <p className="mt-km" aria-hidden="true">
          Faltan <strong className="tabular-nums">{k.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km</strong> de maratón
        </p>
      )}
    </div>
  );
}

export function MetaCinta({ slug, hasta, children }: { slug: string; hasta: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const toque = useRef<number | null>(null);
  const [rota, setRota] = useState<"" | "1" | "recien">("");
  const [nombre, setNombre] = useState("");
  const [tiempo, setTiempo] = useState("");

  function congelar() {
    const ms = Math.max(0, new Date(hasta).getTime() - Date.now());
    const d = Math.floor(ms / 864e5);
    const h = Math.floor(ms / 36e5) % 24;
    setTiempo(`${d} d ${h} h`);
  }

  function cruzar() {
    if (rota) return;
    congelar();
    setRota("recien");
    chasquido();
    if (!quieto()) {
      try {
        navigator.vibrate?.([20, 40, 60]);
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
      const ms = Math.max(0, new Date(hasta).getTime() - Date.now());
      setTiempo(`${Math.floor(ms / 864e5)} d ${Math.floor(ms / 36e5) % 24} h`);
      setRota(recien ? "recien" : "1");
      if (recien && !quieto()) navigator.vibrate?.([20, 40, 60]);
    };
    mira();
    const mo = new MutationObserver(mira);
    mo.observe(raiz, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [slug, hasta]);

  return (
    <div ref={ref} className="mt-meta" data-rota={rota || undefined}>
      <div
        className="mt-portico"
        aria-hidden="true"
        onPointerDown={(e) => {
          toque.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (toque.current !== null && e.clientX - toque.current > 60) cruzar();
          toque.current = null;
        }}
      >
        <span className="mt-poste izq" />
        <span className="mt-poste der" />
        <span className="mt-cinta izq" />
        <span className="mt-cinta der" />
        <span className="mt-medalla-cae">
          <span className="mt-medalla-cinta" />
          <span className="mt-medalla-disco" />
        </span>
      </div>
      <p className="mt-tiempo" role="status">
        {rota ? (
          <>
            <span className="mt-tiempo-et">{nombre ? `¡Meta, ${nombre}!` : "¡Meta!"} Tu tiempo hasta la boda</span>
            <span className="mt-tiempo-n tabular-nums">{tiempo}</span>
          </>
        ) : (
          ""
        )}
      </p>
      {!rota && (
        <button type="button" className="mt-boton" onClick={cruzar}>
          Cruzar la meta
        </button>
      )}
      {children}
    </div>
  );
}

export function MetaMedalla({ a, b, fecha }: { a: string; b: string; fecha: string }) {
  const [vuelta, setVuelta] = useState(false);
  return (
    <button
      type="button"
      className="mt-medalla"
      aria-pressed={vuelta}
      aria-label={vuelta ? `Medalla: ${a} y ${b}, ${fecha}, finisher` : "Dad la vuelta a la medalla"}
      onClick={() => setVuelta((v) => !v)}
    >
      <span className="mt-medalla-cinta" aria-hidden="true" />
      <span className="mt-medalla-giro" aria-hidden="true" data-vuelta={vuelta ? "1" : undefined}>
        <span className="mt-medalla-cara anverso">
          <span className="mt-medalla-ini display">
            {a.charAt(0)}
            <i>y</i>
            {b.charAt(0)}
          </span>
        </span>
        <span className="mt-medalla-cara reverso">
          <span>{a} y {b}</span>
          <span className="tabular-nums">{fecha}</span>
          <span>Finisher</span>
        </span>
      </span>
    </button>
  );
}
