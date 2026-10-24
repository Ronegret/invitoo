"use client";

import { useEffect, useRef } from "react";
import "./sistema.css";

/**
 * El cursor de Invitoo: un punto de tinta y un aro que lo sigue con inercia.
 *
 * Se monta UNA vez por página (en el layout) y no pinta nada hasta que hay
 * un ratón de verdad: `(pointer: fine) and (hover: hover)`, sin
 * `prefers-reduced-motion`. En táctil no existe. Nunca recibe eventos
 * (pointer-events: none) y nunca tapa: todos sus rellenos son tintes con
 * `mix-blend-mode`, el texto de debajo se sigue leyendo.
 *
 * Estados (por delegación, sin listeners por elemento):
 *  - a, button, [role=button], label, summary  → el aro crece y se tiñe de granate
 *  - [data-cursor="abrir" | "ver" | "arrastrar"] → aro grande con rótulo
 *  - p, h1–h6, li, blockquote… o [data-cursor="texto"] → barra fina
 *  - formularios, campos, iframes, [data-cursor="nativo"] → cursor del sistema
 *  - clic → onda; con [data-cursor-petalos] en un ancestro → pétalos
 *  - tema: [data-cursor-tema="oscuro" | "claro"] o, si no hay, la luminancia
 *    del primer fondo opaco hacia arriba.
 */

const ROTULO: Record<string, string> = { abrir: "Abrir", ver: "Ver", arrastrar: "Arrastrar" };
const NATIVO = "form,input,textarea,select,iframe,[contenteditable],[data-cursor=nativo]";
const ENLACE = "a,button,[role=button],label,summary,[data-cursor=enlace]";
const TEXTO = "p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,dd,dt,td,[data-cursor=texto]";

function oscuro(el: Element | null): boolean {
  for (; el; el = el.parentElement) {
    const t = el.getAttribute("data-cursor-tema");
    if (t) return t == "oscuro";
    const s = getComputedStyle(el);
    let m = s.backgroundColor.match(/[\d.]+/g);
    // Un degradado (botón de oro) cuenta por su primer color.
    if (!m || +m[3] < 0.5) m = s.backgroundImage.match(/rgba?\([^)]+/)?.[0].match(/[\d.]+/g) ?? null;
    if (m && !(+m[3] < 0.5)) return +m[0] * 0.3 + +m[1] * 0.59 + +m[2] * 0.11 < 110;
  }
  return false;
}

export default function CursorInvitoo() {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = raiz.current!;
    const [aro, punto] = r.children as unknown as HTMLElement[];
    const rotulo = aro.lastElementChild as HTMLElement;
    const mq = matchMedia("(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)");
    const html = document.documentElement;
    let x = -99, y = -99, ax = x, ay = y, t = 0, raf = 0;
    // Bloque de texto bajo el puntero: la barra solo sale sobre las líneas
    // de letra, no en el hueco a la derecha de un titular.
    let tx: Element | null = null;
    const rango = document.createRange();
    const enLetra = () => {
      rango.selectNodeContents(tx!);
      for (const b of rango.getClientRects()) if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return "texto";
      return "";
    };

    const bucle = (ahora: number) => {
      const k = 1 - Math.pow(0.8, Math.min(64, ahora - t || 16) / 16.7);
      t = ahora;
      ax += (x - ax) * k;
      ay += (y - ay) * k;
      aro.style.transform = `translate3d(${ax}px,${ay}px,0)`;
      raf = Math.abs(x - ax) + Math.abs(y - ay) > 0.1 ? requestAnimationFrame(bucle) : 0;
    };

    const mover = (e: PointerEvent) => {
      if (e.pointerType != "mouse") return void (r.dataset.visible = "");
      x = e.clientX;
      y = e.clientY;
      punto.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (!r.dataset.visible) {
        ax = x;
        ay = y;
        r.dataset.visible = "1";
      }
      if (!raf) raf = requestAnimationFrame((n) => ((t = n), bucle(n)));
      if (tx) r.dataset.estado = enLetra();
    };

    const sobre = (e: PointerEvent) => {
      const el = e.target as Element;
      const c = el.closest("[data-cursor]");
      const d = c?.getAttribute("data-cursor");
      tx = null;
      let est = el.closest(NATIVO)
        ? "nativo"
        : d && ROTULO[d]
          ? d
          : el.closest(ENLACE)
            ? "enlace"
            : el.closest(TEXTO)
              ? "texto"
              : "";
      if (est == "texto" && d != "texto") {
        tx = el.closest(TEXTO);
        est = enLetra();
      }
      r.dataset.estado = est;
      rotulo.textContent = ROTULO[est] || "";
      r.style.setProperty("--ci-alto", getComputedStyle(el).fontSize);
      // Con rótulo, el tono lo decide la pieza entera (el sobre), no el sello.
      r.dataset.tema = oscuro(ROTULO[est] ? c : el) ? "claro" : "";
    };

    const clic = (e: PointerEvent) => {
      if (e.pointerType != "mouse" || r.dataset.estado == "nativo") return;
      const p = (e.target as Element).closest("[data-cursor-petalos]");
      for (let i = 0, n = p ? 7 : 1; i < n; i++) {
        const s = document.createElement("i");
        s.className = p ? "ci-petalo" : "ci-onda";
        const a = (i / n) * 6.28 + Math.random();
        s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${Math.cos(a) * 46}px;--dy:${Math.sin(a) * 46 - 14}px;--g:${(Math.random() * 300) | 0}deg`;
        s.onanimationend = () => s.remove();
        r.append(s);
      }
    };

    // Al hacer scroll no hay pointerover: se recalcula bajo el puntero.
    let rs = 0;
    const desplazar = () =>
      (rs ||= requestAnimationFrame(() => {
        rs = 0;
        const el = r.dataset.visible && document.elementFromPoint(x, y);
        if (el) sobre({ target: el } as unknown as PointerEvent);
      }));
    const fuera = () => (r.dataset.visible = "");
    const evs: [string, EventListener][] = [
      ["pointermove", mover as EventListener],
      ["pointerover", sobre as EventListener],
      ["pointerdown", clic as EventListener],
      ["scroll", desplazar],
    ];

    const activar = () => {
      const vivo = mq.matches;
      html.classList.toggle("ci-activo", vivo);
      for (const [n, f] of evs) (vivo ? addEventListener : removeEventListener)(n, f, { passive: true });
      (vivo ? document.addEventListener : document.removeEventListener).call(document, "mouseleave", fuera);
      if (!vivo) fuera();
    };

    activar();
    mq.addEventListener("change", activar);
    return () => {
      mq.removeEventListener("change", activar);
      html.classList.remove("ci-activo");
      for (const [n, f] of evs) removeEventListener(n, f);
      document.removeEventListener("mouseleave", fuera);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rs);
    };
  }, []);

  return (
    <div ref={raiz} className="ci" aria-hidden="true">
      <div className="ci-aro">
        <span className="ci-circulo" />
        <span className="ci-barra" />
        <span className="ci-rotulo" />
      </div>
      <div className="ci-punto" />
    </div>
  );
}
