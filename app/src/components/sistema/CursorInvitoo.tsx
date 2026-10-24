"use client";

import { useEffect, useRef } from "react";
import "./sistema.css";

/**
 * El cursor de Invitoo (v2, P3): el ratón del sistema y un aro de tinta.
 *
 * POR QUÉ CAMBIÓ. La v1 escondía el ratón (`cursor: none`) y dibujaba un
 * punto y un aro que lo seguía con inercia (20 % por fotograma: ~75 ms de
 * retraso, y más en un portátil cargado). Se notaba «lento»: la mano iba
 * por delante de lo que se veía. Además, en cada movimiento medía las
 * líneas del párrafo de debajo (`Range.getClientRects`) y, en cada fotograma
 * de scroll, volvía a mirar qué había bajo el puntero.
 *
 * AHORA:
 *  · El ratón del sistema se queda SIEMPRE: es el único que va a 0 ms (lo
 *    pinta el sistema, no la página). Sobre texto es su barra; en campos,
 *    el suyo.
 *  · El aro es adorno: va a 1:1 con el ratón, colocado con `transform` en el
 *    mismo evento (sin bucle, sin inercia). Solo crece y se tiñe sobre
 *    enlaces y botones, y con [data-cursor="abrir" | "ver" | "arrastrar"]
 *    se hace disco con rótulo.
 *  · No existe en táctil, con `prefers-reduced-motion`, ni en la vista
 *    previa (iframe). Se esconde sobre texto, formularios y campos.
 *  · El tono (claro/oscuro) se calcula una vez por elemento y se recuerda.
 *  · Al hacer scroll no se toca nada por fotograma: se recalcula al pararse.
 *
 * Estados (por delegación, sin listeners por elemento):
 *  - a, button, [role=button], label, summary  → el aro crece y se tiñe
 *  - [data-cursor="abrir" | "ver" | "arrastrar"] → aro grande con rótulo
 *  - texto, campos, iframes, [data-cursor="nativo" | "texto"] → sin aro
 *  - clic → onda; con [data-cursor-petalos] en un ancestro → pétalos
 */

const ROTULO: Record<string, string> = { abrir: "Abrir", ver: "Ver", arrastrar: "Arrastrar" };
// Los campos (no el formulario entero: sus botones sí llevan aro).
const NATIVO = "input:not([type=button],[type=submit],[type=reset]),textarea,select,iframe,[contenteditable],[data-cursor=nativo],[data-cursor=texto]";
const ENLACE = "a,button,[role=button],label,summary,[data-cursor=enlace]";
const TEXTO = "p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,dd,dt,td";

const tonos = new WeakMap<Element, boolean>();
function oscuro(el0: Element | null): boolean {
  const camino: Element[] = [];
  let res = false;
  for (let el = el0; el; el = el.parentElement) {
    const visto = tonos.get(el);
    if (visto !== undefined) {
      res = visto;
      break;
    }
    camino.push(el);
    const t = el.getAttribute("data-cursor-tema");
    if (t) {
      res = t == "oscuro";
      break;
    }
    const s = getComputedStyle(el);
    let m = s.backgroundColor.match(/[\d.]+/g);
    // Un degradado (botón de oro) cuenta por su primer color.
    if (!m || +m[3] < 0.5) m = s.backgroundImage.match(/rgba?\([^)]+/)?.[0].match(/[\d.]+/g) ?? null;
    if (m && !(+m[3] < 0.5)) {
      res = +m[0] * 0.3 + +m[1] * 0.59 + +m[2] * 0.11 < 110;
      break;
    }
  }
  for (const el of camino) tonos.set(el, res);
  return res;
}

export default function CursorInvitoo() {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = raiz.current!;
    const aro = r.firstElementChild as HTMLElement;
    const rotulo = aro.lastElementChild as HTMLElement;
    const mq = matchMedia("(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)");
    let x = -99, y = -99, ultimo: Element | null = null;

    const mover = (e: PointerEvent) => {
      if (e.pointerType != "mouse") return void (r.dataset.visible = "");
      x = e.clientX;
      y = e.clientY;
      // 1:1, en este mismo evento: el aro se pinta en el mismo fotograma.
      aro.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (!r.dataset.visible) r.dataset.visible = "1";
    };

    const sobre = (e: { target: EventTarget | null }) => {
      const el = e.target as Element;
      if (!el || el === ultimo || !el.closest) return;
      ultimo = el;
      const c = el.closest("[data-cursor]");
      const d = c?.getAttribute("data-cursor");
      const est = el.closest(NATIVO)
        ? "nativo"
        : d && ROTULO[d]
          ? d
          : el.closest(ENLACE)
            ? "enlace"
            : el.closest(TEXTO)
              ? "nativo"
              : "";
      if (r.dataset.estado !== est) r.dataset.estado = est;
      rotulo.textContent = ROTULO[est] || "";
      if (est == "nativo") return;
      // Con rótulo, el tono lo decide la pieza entera (el sobre), no el sello.
      const tema = oscuro(ROTULO[est] ? c : el) ? "claro" : "";
      if (r.dataset.tema !== tema) r.dataset.tema = tema;
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

    // Al hacer scroll no hay pointerover: se mira qué hay debajo UNA vez,
    // cuando el scroll se para (nada por fotograma).
    let espera = 0;
    const alParar = () => {
      espera = 0;
      if (!r.dataset.visible) return;
      ultimo = null;
      sobre({ target: document.elementFromPoint(x, y) });
    };
    const desplazar = () => {
      clearTimeout(espera);
      espera = window.setTimeout(alParar, 140);
    };
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
    const html = document.documentElement;

    activar();
    mq.addEventListener("change", activar);
    return () => {
      mq.removeEventListener("change", activar);
      html.classList.remove("ci-activo");
      for (const [n, f] of evs) removeEventListener(n, f);
      document.removeEventListener("mouseleave", fuera);
      clearTimeout(espera);
    };
  }, []);

  return (
    <div ref={raiz} className="ci" aria-hidden="true">
      <div className="ci-aro">
        <span className="ci-circulo" />
        <span className="ci-rotulo" />
      </div>
    </div>
  );
}
