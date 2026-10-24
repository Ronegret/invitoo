/**
 * La capa viva de la invitación (el código de verdad de `<CapaInteraccion />`).
 * Solo se descarga si la boda la tiene encendida: la carga
 * `MovimientoCliente` con `import()`, y `montarCapa()` devuelve la función
 * que la apaga (la vista previa la enciende y apaga en vivo).
 *
 *  · `petalos`: al tocar caen 5–8 pétalos desde el dedo (`motor.ts`, un
 *    canvas que solo trabaja mientras hay algo cayendo; 40 como máximo).
 *  · `reflejo`: los nombres (`h1.vt-nombres`) llevan un reflejo dorado que
 *    sigue al puntero en escritorio y a la inclinación del móvil
 *    (DeviceOrientation; en iOS el permiso se pide solo tras un gesto). Al
 *    salir de la apertura, los nombres se enfocan letra a letra.
 *  · `destellos`: un rastro mínimo de chispas doradas tras el cursor (solo
 *    puntero fino).
 *
 * Con `prefers-reduced-motion`: ni pétalos, ni chispas, ni letras; el
 * reflejo se queda quieto.
 */

export type OpcionesCapa = { petalos: boolean; reflejo: boolean; destellos: boolean };

export function montarCapa(op: OpcionesCapa): () => void {
  let estilo = document.getElementById("invitoo-capa") as HTMLStyleElement | null;
  if (!estilo) {
    estilo = document.createElement("style");
    estilo.id = "invitoo-capa";
    estilo.textContent = CSS_CAPA;
    document.head.appendChild(estilo);
  }
  return montar(op);
}

// ─────────────────────────────────────────────────────────────── montaje

function montar(op: OpcionesCapa) {
  const limpiezas: (() => void)[] = [];
  const on = <K extends keyof WindowEventMap>(
    obj: Window | Document,
    tipo: K,
    f: (e: WindowEventMap[K]) => void,
    o: AddEventListenerOptions = { passive: true },
  ) => {
    obj.addEventListener(tipo, f as EventListener, o);
    limpiezas.push(() => obj.removeEventListener(tipo, f as EventListener, o));
  };

  let quieto = false;
  let fino = false;
  try {
    quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  } catch {
    /* noop */
  }

  const cargarMotor = () => import("./motor").then((m) => m.motor());

  // ——— pétalos al tocar ———
  if (op.petalos && !quieto) {
    on(document, "pointerdown", (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as Element | null;
      // Ni al escribir, ni dentro de la apertura (el sobre ya suelta los suyos).
      if (t?.closest("input, textarea, select, [contenteditable], .apertura, [data-sin-petalos]")) return;
      void cargarMotor().then((m) => m.rafaga(e.clientX, e.clientY));
    });
  }

  // ——— chispas tras el cursor ———
  if (op.destellos && fino && !quieto) {
    let motorListo: { destello: (x: number, y: number) => void } | null = null;
    void cargarMotor().then((m) => (motorListo = m));
    on(window, "pointermove", (e: PointerEvent) => {
      if (e.pointerType === "mouse" && motorListo) motorListo.destello(e.clientX, e.clientY);
    });
  }

  // ——— los nombres ———
  if (op.reflejo) limpiezas.push(nombres(quieto, fino));

  return () => limpiezas.forEach((f) => f());
}

// ───────────────────────────────────────────────── nombres: letras y reflejo

const luminancia = (c: string) => {
  const m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(c);
  if (!m) return 0;
  const [r, g, b] = [+m[1], +m[2], +m[3]].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Parte el texto de un titular en letras (cada una en su <span>) SIN
 * perder los nodos de React: los nodos de texto originales se guardan y se
 * devuelven a su sitio al terminar la entrada.
 */
function partir(h: HTMLElement) {
  const devolver: (() => void)[] = [];
  let i = 0;
  const recorrer = (nodo: Node) => {
    for (const hijo of Array.from(nodo.childNodes)) {
      if (hijo.nodeType === Node.TEXT_NODE) {
        const texto = hijo.textContent ?? "";
        if (!texto.trim()) continue;
        const frag = document.createDocumentFragment();
        const trozos: Node[] = [];
        for (const parte of texto.split(/(\s+)/)) {
          if (!parte) continue;
          if (/^\s+$/.test(parte)) {
            const t = document.createTextNode(parte);
            frag.appendChild(t);
            trozos.push(t);
            continue;
          }
          const palabra = document.createElement("span");
          palabra.className = "nv-p";
          for (const letra of Array.from(parte)) {
            const l = document.createElement("span");
            l.className = "nv-l";
            l.textContent = letra;
            l.style.setProperty("--i", String(i++));
            palabra.appendChild(l);
          }
          frag.appendChild(palabra);
          trozos.push(palabra);
        }
        const padre = hijo.parentNode!;
        padre.replaceChild(frag, hijo);
        devolver.push(() => {
          if (!trozos[0]?.parentNode) return;
          trozos[0].parentNode.insertBefore(hijo, trozos[0]);
          trozos.forEach((t) => t.parentNode?.removeChild(t));
        });
      } else if (hijo.nodeType === Node.ELEMENT_NODE) {
        recorrer(hijo);
      }
    }
  };
  recorrer(h);
  return { total: i, devolver: () => devolver.reverse().forEach((f) => f()) };
}

function nombres(quieto: boolean, fino: boolean) {
  const titulares = Array.from(document.querySelectorAll<HTMLElement>(".vt-nombres"));
  if (!titulares.length) return () => {};
  const limpiezas: (() => void)[] = [];

  // El color base de la tinta y el oro del reflejo, según el fondo.
  const preparar = (h: HTMLElement) => {
    const base = getComputedStyle(h).color;
    const claro = luminancia(base) > 0.45; // nombres claros sobre fondo oscuro
    h.style.setProperty("--nv-base", base);
    h.style.setProperty("--nv-oro", claro ? "#f1d892" : "#a9822f");
    h.style.setProperty("--nv-oro-pico", claro ? "#fff4d1" : "#c99b3c");
    // innerText respeta los saltos de los hijos en bloque («Àlex / y / Bruno»).
    if (!h.hasAttribute("aria-label")) h.setAttribute("aria-label", (h.innerText || h.textContent || "").replace(/\s+/g, " ").trim());
    // `background-clip: text` recorta con los glifos de TODOS los hijos en su
    // posición sin transformar: un hijo en bloque, flex o animado (la «y» de
    // Carta con sus ::before/::after) deja un «&» fantasma donde no está.
    // Esos titulares se quedan sin reflejo (las letras sí se enfocan).
    const raro = Array.from(h.querySelectorAll<HTMLElement>("*")).some((el) => {
      const c = getComputedStyle(el);
      return c.display !== "inline" || c.transform !== "none" || c.animationName !== "none" ||
        ["::before", "::after"].some((ps) => {
          const p = getComputedStyle(el, ps);
          return p.content !== "none" && p.content !== "normal" && p.content !== '""';
        });
    });
    if (raro) return;
    // El recorte del fondo es la caja del titular: con interlineados < 1
    // (Registro, Tinta) las letras se salen y quedaban cortadas. Se amplía la
    // caja .14em arriba y abajo y se devuelve con el margen, sin mover nada.
    if (!h.hasAttribute("data-nv-caja")) {
      const cs = getComputedStyle(h);
      h.setAttribute("data-nv-caja", "");
      h.style.paddingTop = `calc(${cs.paddingTop} + .14em)`;
      h.style.paddingBottom = `calc(${cs.paddingBottom} + .14em)`;
      h.style.marginTop = `calc(${cs.marginTop} - .14em)`;
      h.style.marginBottom = `calc(${cs.marginBottom} - .14em)`;
    }
    h.setAttribute("data-nv-brillo", "");
  };

  // Entrada letra a letra: solo si la apertura está delante (los nombres aún
  // no se ven, así que partirlos no hace parpadear nada).
  const apertura = document.querySelector('.apertura[data-estado="dentro"]');
  if (apertura && !quieto) {
    for (const h of titulares) {
      const { total, devolver } = partir(h);
      h.setAttribute("data-nv", "espera");
      h.style.setProperty("--nv-n", String(total));
      const alSalir = (e: Event) => {
        if ((e as CustomEvent<string>).detail !== "fuera") return;
        window.removeEventListener("invitoo:apertura", alSalir);
        h.setAttribute("data-nv", "entra");
        // Al terminar, el titular vuelve a ser texto normal.
        const fin = 300 + total * 45 + 900;
        const t = window.setTimeout(() => {
          devolver();
          // Ya entró: que el trazo de la portada no vuelva a empezar.
          h.setAttribute("data-nv-fin", "");
          h.removeAttribute("data-nv");
          preparar(h);
          h.setAttribute("data-nv-barrido", "");
          // El primer pase del reflejo, justo al quedar enfocados.
          window.setTimeout(() => pasar(), 250);
        }, fin);
        limpiezas.push(() => window.clearTimeout(t));
      };
      window.addEventListener("invitoo:apertura", alSalir);
      limpiezas.push(() => window.removeEventListener("invitoo:apertura", alSalir));
    }
  } else {
    titulares.forEach((h) => {
      preparar(h);
      if (quieto) return;
      h.setAttribute("data-nv-barrido", "");
      // El trazo de la portada (si lo hay) dura 1,44 s: después, que no vuelva.
      const t = window.setTimeout(() => h.setAttribute("data-nv-fin", ""), 1600);
      limpiezas.push(() => window.clearTimeout(t));
    });
  }
  if (quieto) return () => limpiezas.forEach((f) => f());

  // ——— el reflejo sigue al puntero o a la inclinación ———
  let objetivo = -30;
  let actual = -30;
  let activo = false; // hay mano (o inclinación) que seguir
  let bucle = 0;
  const visibles = new Set<HTMLElement>();

  const pintar = () => {
    actual += (objetivo - actual) * 0.12;
    for (const h of visibles) {
      if (!h.hasAttribute("data-nv")) h.style.setProperty("--brillo-x", `${actual.toFixed(1)}%`);
    }
    bucle = Math.abs(objetivo - actual) > 0.2 && visibles.size ? requestAnimationFrame(pintar) : 0;
  };
  const mover = (pct: number) => {
    objetivo = Math.max(-30, Math.min(130, pct));
    if (!activo) {
      activo = true;
      for (const h of titulares) h.removeAttribute("data-nv-barrido");
    }
    if (!bucle && visibles.size) bucle = requestAnimationFrame(pintar);
  };

  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (e.isIntersecting) visibles.add(e.target as HTMLElement);
      else visibles.delete(e.target as HTMLElement);
    }
  });
  titulares.forEach((h) => io.observe(h));
  limpiezas.push(() => io.disconnect());

  // Sin mano que seguir, el reflejo cruza los nombres: un pase de 2,4 s
  // cada 9 s, solo si se ven. Nada corre entre pase y pase (antes era una
  // animación infinita que recalculaba estilos en cada fotograma).
  const pasar = () => {
    if (activo) return;
    for (const h of visibles) {
      if (!h.hasAttribute("data-nv-barrido") || !h.hasAttribute("data-nv-fin")) continue;
      h.setAttribute("data-nv-pasa", "");
      window.setTimeout(() => h.removeAttribute("data-nv-pasa"), 2500);
    }
  };
  const primero = window.setTimeout(pasar, 1900);
  const cada = window.setInterval(pasar, 9000);
  limpiezas.push(() => {
    window.clearTimeout(primero);
    window.clearInterval(cada);
  });

  if (fino) {
    const alMover = (e: PointerEvent) => {
      const h = visibles.values().next().value as HTMLElement | undefined;
      if (!h) return;
      const r = h.getBoundingClientRect();
      mover(((e.clientX - r.left) / Math.max(1, r.width)) * 100);
    };
    window.addEventListener("pointermove", alMover, { passive: true });
    limpiezas.push(() => window.removeEventListener("pointermove", alMover));
  } else {
    // Inclinación del móvil: gamma −25…25° → 0…100 %.
    const alInclinar = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return;
      mover(50 + (e.gamma / 25) * 50);
    };
    const escuchar = () => {
      window.addEventListener("deviceorientation", alInclinar, { passive: true });
      limpiezas.push(() => window.removeEventListener("deviceorientation", alInclinar));
    };
    type ConPermiso = { requestPermission?: () => Promise<"granted" | "denied"> };
    const DOE = (window as Window & { DeviceOrientationEvent?: ConPermiso }).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") {
      // iOS: el permiso solo puede pedirse dentro de un gesto. El primero que haya.
      const pedir = () => {
        document.removeEventListener("pointerup", pedir);
        DOE.requestPermission!()
          .then((r) => r === "granted" && escuchar())
          .catch(() => {});
      };
      document.addEventListener("pointerup", pedir, { once: true });
      limpiezas.push(() => document.removeEventListener("pointerup", pedir));
    } else if (DOE) {
      escuchar();
    }
  }

  return () => {
    if (bucle) cancelAnimationFrame(bucle);
    limpiezas.forEach((f) => f());
  };
}

// ───────────────────────────────────────────────────────────────── estilos

export const CSS_CAPA = `
@property --brillo-x { syntax: "<percentage>"; inherits: true; initial-value: -30%; }

/* —— los nombres se enfocan letra a letra (BlurText) —— */
.vt-nombres:is([data-nv], [data-nv-fin]) { clip-path: none !important; }
.vt-nombres[data-nv], .vt-nombres[data-nv-fin]:not([data-nv-pasa]) { animation: none !important; }
.vt-nombres .nv-p { display: inline-block; white-space: nowrap; }
.vt-nombres .nv-l { display: inline-block; }
.vt-nombres[data-nv="espera"] .nv-l { opacity: 0; filter: blur(10px); transform: translateY(.18em) scale(1.06); }
.vt-nombres[data-nv="entra"] .nv-l {
  animation: nv-enfoca 900ms cubic-bezier(.22,.61,.36,1) calc(300ms + var(--i) * 45ms) both;
}
@keyframes nv-enfoca {
  0%   { opacity: 0; filter: blur(10px); transform: translateY(.18em) scale(1.06); }
  55%  { opacity: 1; filter: blur(1.5px); }
  100% { opacity: 1; filter: blur(0); transform: none; }
}

/* —— el reflejo dorado: un degradado recortado al texto —— */
.vt-nombres[data-nv-brillo] {
  background-image: linear-gradient(104deg,
    var(--nv-base) 0%,
    var(--nv-base) calc(var(--brillo-x) - 16%),
    var(--nv-oro) calc(var(--brillo-x) - 5%),
    var(--nv-oro-pico) var(--brillo-x),
    var(--nv-oro) calc(var(--brillo-x) + 5%),
    var(--nv-base) calc(var(--brillo-x) + 16%),
    var(--nv-base) 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
/* Los hijos con su propio color (la «y», el «&») no se vuelven
   transparentes: conservan su tinta; el reflejo cruza el texto directo. */
.vt-nombres[data-nv-brillo] * { -webkit-text-fill-color: currentColor; }
/* Un pase del reflejo (lo lanza capa.ts cada 9 s, solo si se ve).
   !important: el trazo de la portada (Apertura.tsx) tiene más especificidad. */
.vt-nombres[data-nv-brillo][data-nv-barrido][data-nv-pasa] { animation: nv-barrido 2400ms cubic-bezier(.45,0,.55,1) both !important; }
@keyframes nv-barrido {
  from { --brillo-x: -30%; }
  to { --brillo-x: 130%; }
}

/* —— los botones dorados brillan al pasar —— */
:is(.boton-oro, [data-brillo]) { position: relative; overflow: hidden; isolation: isolate; }
:is(.boton-oro, [data-brillo])::after {
  content: ""; position: absolute; inset: -2px; z-index: -1; pointer-events: none;
  background: linear-gradient(110deg, transparent 30%, rgba(255,248,224,.55) 48%, rgba(255,255,255,.75) 50%, rgba(255,248,224,.55) 52%, transparent 70%);
  translate: -120% 0; opacity: 0;
}
@media (hover: hover) and (pointer: fine) {
  :is(.boton-oro, [data-brillo]):hover::after { animation: nv-shiny 900ms cubic-bezier(.22,.61,.36,1) both; }
}
:is(.boton-oro, [data-brillo]):focus-visible::after { animation: nv-shiny 900ms cubic-bezier(.22,.61,.36,1) both; }
@keyframes nv-shiny { from { translate: -120% 0; opacity: 1; } to { translate: 120% 0; opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .vt-nombres .nv-l { animation: none !important; opacity: 1 !important; filter: none !important; transform: none !important; }
  .vt-nombres[data-nv-brillo] { animation: none; --brillo-x: -30%; }
  :is(.boton-oro, [data-brillo])::after { animation: none !important; }
}
`;
