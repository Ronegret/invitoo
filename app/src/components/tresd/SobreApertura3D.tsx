"use client";

import { useEffect, useRef, useState } from "react";
import { cargarInvitado } from "@/components/bloques/invitado";
import Sobre3D from "./Sobre3D";

/**
 * El sobre 3D en la apertura «Sobre» de la invitación (`tema.sobre.modo =
 * "3d"`). Contrato con F1 (aperturas/programa.ts):
 *
 *  · El toque lo sigue recibiendo el botón `[data-abrir]` del sobre de
 *    papel (transparente encima); aquí se escucha `invitoo:apertura` con
 *    `detail === "abriendo"` y se abre el 3D.
 *  · La apertura entera (lacre → solapa → cartulina delante) cabe en 1,45 s:
 *    programa.ts cierra a los 1 550 ms y funde a la portada.
 *  · Cuando el primer fotograma 3D está pintado se pone
 *    `data-sobre3d="1"` en `.apertura`: el sobre de papel se aparta y su pie
 *    (nombres, fecha, pista) sigue a la vista, por encima del canvas.
 *  · Sin WebGL, gama baja, reduced-motion o ahorro de datos: no se monta
 *    nada y queda el sobre de papel de siempre.
 *
 * El canvas va DETRÁS del `.sc` (es su hermano anterior) y pone la mesa de
 * lino; el sobre 3D se coloca donde está `.sc-sobre`.
 */
export default function SobreApertura3D({
  modo3d,
  slug,
  a,
  b,
  fecha,
  iniciales,
  papel,
  forroColor,
  lacreColor,
  sello,
  matasellos,
  tinta,
  acento,
  letraMano,
}: {
  /** `tema.sobre.modo === "3d"`. Sin él, solo con `?sobre3d` en la URL (vista previa). */
  modo3d: boolean;
  slug: string;
  a: string;
  b: string;
  fecha: string;
  iniciales: [string, string];
  papel: string;
  forroColor: string;
  lacreColor: string;
  sello: "iniciales" | "alianzas";
  matasellos: { aro: string; centro: string } | null;
  tinta: string;
  acento: string;
  /** La familia real de la letra a mano (next/font `style.fontFamily`). */
  letraMano: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [escrito, setEscrito] = useState<string | null>(null);
  const [sitio, setSitio] = useState<{ encuadre: number; centroY: number } | null>(null);
  // El HTML es el mismo con o sin 3D (un div vacío): leer la URL aquí no
  // descuadra la hidratación.
  const [quiere] = useState(
    () => modo3d || (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("sobre3d")),
  );

  // «Para Carmen» (o «Para ti»), igual que NombreEnSobre.
  useEffect(() => {
    let vivo = true;
    void cargarInvitado(slug).then((i) => {
      if (vivo) setEscrito(i ? `Para ${i.nombre}` : "Para ti");
    });
    return () => {
      vivo = false;
    };
  }, [slug]);

  // El toque, por el guion de la apertura.
  useEffect(() => {
    const oir = (e: Event) => {
      if ((e as CustomEvent).detail === "abriendo") setAbierto(true);
    };
    window.addEventListener("invitoo:apertura", oir);
    return () => window.removeEventListener("invitoo:apertura", oir);
  }, []);

  // Dónde está el sobre de papel: ahí va el 3D.
  useEffect(() => {
    const el = caja.current;
    const capa = el?.parentElement;
    if (!el || !capa) return;
    const medir = () => {
      const sobre = capa.querySelector<HTMLElement>(".sc-sobre");
      const r = el.getBoundingClientRect();
      const s = sobre?.getBoundingClientRect();
      if (!s || !r.width || !r.height) return;
      setSitio({ encuadre: s.width / r.width, centroY: (s.top + s.height / 2 - r.top) / r.height });
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={caja} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {quiere && sitio && escrito !== null && (
        <Sobre3D
          a={a}
          b={b}
          fecha={fecha}
          iniciales={iniciales}
          escrito={escrito}
          sello={sello}
          matasellos={matasellos}
          papel={papel}
          forroColor={forroColor}
          lacreColor={lacreColor}
          tinta={tinta}
          acento={acento}
          letraMano={letraMano}
          letraCarta="var(--display), serif"
          letraTexto="var(--texto), sans-serif"
          abierto={abierto}
          duracion={1.45}
          encuadre={sitio.encuadre * 1.06}
          centroY={sitio.centroY}
          caida={3.6}
          destino={{ x: 0.5, y: Math.max(0.3, sitio.centroY), w: 0.84 }}
          onListo={() => {
            const ap = caja.current?.closest(".apertura");
            ap?.setAttribute("data-sobre3d", "1");
          }}
          onFallo={() => caja.current?.closest(".apertura")?.removeAttribute("data-sobre3d")}
        />
      )}
      {/* Con el 3D, el fondo del sobre de papel se aparta para dejar ver la mesa. */}
      <style>{`.apertura[data-sobre3d="1"] .sc { background: transparent; }`}</style>
    </div>
  );
}
