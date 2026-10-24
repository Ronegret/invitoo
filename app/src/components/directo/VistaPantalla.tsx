"use client";

import { useEffect, useRef, useState } from "react";
import { disenoAParam, MENSAJE_DISENO, MENSAJE_FOTO, type DisenoDirecto } from "@/lib/momentos/diseno";

/**
 * La pantalla del salón en pequeño: un iframe de `/directo/muestra` a
 * 1920 × 1080 escalado al ancho de su caja (así los `vw` de la pantalla son
 * los de una TV de verdad). El diseño se cambia en vivo por postMessage, sin
 * recargar; `foto` hace que «llegue» una foto nueva.
 *
 *   <VistaPantalla diseno={d} pareja={{ a, b }} plantilla="carta" />
 */

type Foto = { id: string; src: string; ancho: number; alto: number; autor: string; mensaje?: string };

export default function VistaPantalla({
  diseno,
  pareja,
  plantilla,
  slug,
  foto,
  ritmo = 0.7,
  marcoTv = true,
  titulo = "Vista previa de la pantalla del salón",
  className = "",
}: {
  diseno: DisenoDirecto;
  pareja: { a: string; b: string };
  plantilla?: string;
  /** Si la invitación está publicada, la vista toma sus colores de ahí. */
  slug?: string;
  foto?: Foto | null;
  ritmo?: number;
  marcoTv?: boolean;
  titulo?: string;
  className?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const marco = useRef<HTMLIFrameElement>(null);
  const [escala, setEscala] = useState(0);
  const [lista, setLista] = useState(false);
  // La URL se fija al montar: los cambios van por postMessage.
  const [src] = useState(() => {
    const q = new URLSearchParams({ a: pareja.a, b: pareja.b, d: disenoAParam(diseno), r: String(ritmo) });
    if (plantilla) q.set("p", plantilla);
    if (slug) q.set("s", slug);
    return `/directo/muestra?${q}`;
  });

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setEscala(el.clientWidth / 1920);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const f = (ev: MessageEvent) => {
      if (ev.origin === window.location.origin && ev.source === marco.current?.contentWindow && (ev.data as { tipo?: string })?.tipo === "invitoo:directo:lista") {
        setLista(true);
      }
    };
    window.addEventListener("message", f);
    return () => window.removeEventListener("message", f);
  }, []);

  useEffect(() => {
    if (!lista) return;
    marco.current?.contentWindow?.postMessage({ tipo: MENSAJE_DISENO, diseno }, window.location.origin);
  }, [diseno, lista]);

  useEffect(() => {
    if (!lista || !foto) return;
    marco.current?.contentWindow?.postMessage({ tipo: MENSAJE_FOTO, foto }, window.location.origin);
  }, [foto, lista]);

  return (
    <div className={`vista-tv ${marcoTv ? "rounded-[14px] bg-[#1b1714] p-[1.6%] shadow-[0_30px_60px_-30px_rgba(0,0,0,.55)]" : ""} ${className}`}>
      <div ref={caja} className="relative aspect-video w-full overflow-hidden rounded-[6px] bg-[#120f0d]">
        {escala > 0 && (
          <iframe
            ref={marco}
            src={src}
            title={titulo}
            loading="lazy"
            tabIndex={-1}
            className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
            style={{ width: 1920, height: 1080, transform: `scale(${escala})` }}
          />
        )}
      </div>
    </div>
  );
}
