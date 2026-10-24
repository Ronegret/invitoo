/**
 * El motor de `<ColorVivo />`. Lo carga `MovimientoCliente` con `import()`
 * solo si la boda tiene `colorVivo`. Sin bucle de scroll: un único
 * IntersectionObserver con una línea a media pantalla decide qué sección
 * manda, y el cambio de tono es un fundido de `opacity` entre dos velos
 * fijos (1,6 s, ease-velo): compositor, sin repintar. Ni JS por fotograma.
 */

type RGB = [number, number, number];

const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export const contraste = (a: RGB, b: RGB) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const mezcla = (a: RGB, b: RGB, t: number): RGB =>
  a.map((v, i) => Math.round(v * (1 - t) + b[i] * t)) as RGB;
const css = (c: RGB) => `rgb(${c[0]} ${c[1]} ${c[2]})`;

/** Resuelve cualquier color CSS (hex, var(), rgb…) a RGB, dentro del lienzo. */
function resolutor(raiz: HTMLElement) {
  const sonda = document.createElement("span");
  sonda.hidden = true;
  raiz.appendChild(sonda);
  return {
    rgb(c: string): RGB | null {
      sonda.style.color = "";
      sonda.style.color = c;
      if (!sonda.style.color) return null;
      const m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(getComputedStyle(sonda).color);
      return m ? [+m[1], +m[2], +m[3]] : null;
    },
    fin: () => sonda.remove(),
  };
}

/**
 * Lleva un tono hacia el papel hasta que la tinta y el acento (como texto)
 * pasen AA sobre él. Si ni el papel pasa, se queda el papel.
 */
export function corregirAA(c: RGB, papel: RGB, textos: RGB[], min = 4.5): RGB {
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const x = mezcla(c, papel, t);
    if (textos.every((tx) => contraste(tx, x) >= min)) return x;
  }
  return papel;
}

export function montarColor(raiz: HTMLElement): () => void {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  } catch {
    /* noop */
  }
  const r = resolutor(raiz);
  const papel = r.rgb("var(--papel)") ?? [247, 242, 234];
  const tinta = r.rgb("var(--tinta)") ?? [42, 36, 32];
  const acento = r.rgb("var(--acento)") ?? [140, 29, 44];
  const acentoTexto = r.rgb("var(--acento-texto, var(--acento))") ?? acento;

  let paleta: RGB[] = [];
  const marca = raiz.querySelector<HTMLElement>("[data-color-vivo]")?.getAttribute("data-color-vivo");
  if (marca) {
    try {
      paleta = (JSON.parse(marca) as string[]).map((c) => r.rgb(c)).filter(Boolean) as RGB[];
    } catch {
      /* paleta rota: la de serie */
    }
  }
  if (!paleta.length) {
    // De serie: el papel y tres velos apenas tintados (rubor, oro, salvia).
    paleta = [papel, mezcla(papel, acento, 0.075), mezcla(papel, [201, 161, 74], 0.11), mezcla(papel, [135, 161, 155], 0.11)];
  }
  const textos = [tinta, acentoTexto];
  paleta = paleta.map((c) => corregirAA(c, papel, textos));

  // Las secciones de primer nivel (no anidadas) del lienzo.
  const secciones = Array.from(raiz.querySelectorAll<HTMLElement>("section, footer")).filter(
    (s) => !s.parentElement?.closest("section, footer") && !s.closest(".apertura"),
  );
  const tono = new Map<Element, string>();
  secciones.forEach((s, i) => {
    const pedido = s.getAttribute("data-color");
    const c = pedido ? r.rgb(pedido) : null;
    tono.set(s, css(c ? corregirAA(c, papel, textos) : paleta[i % paleta.length]));
  });
  r.fin();

  // Dos velos fijos del tamaño de la pantalla, detrás del contenido (el
  // lienzo aísla su contexto de apilamiento): el tono nuevo entra en uno
  // mientras el otro se apaga. Solo `opacity`: lo hace el compositor, sin
  // repintar la página entera (el lienzo mide miles de píxeles).
  let estilo = document.getElementById("invitoo-color-vivo");
  if (!estilo) {
    estilo = document.createElement("style");
    estilo.id = "invitoo-color-vivo";
    estilo.textContent =
      ".cv-velo{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:0;" +
      "transition:opacity 1600ms var(--ease-velo,cubic-bezier(.65,0,.35,1));will-change:opacity}" +
      ".cv-velo[data-on]{opacity:1}";
    document.head.appendChild(estilo);
  }
  const velos = [0, 1].map(() => {
    const v = document.createElement("div");
    v.className = "cv-velo";
    v.setAttribute("aria-hidden", "true");
    raiz.prepend(v);
    return v;
  });
  let activo = 0;
  let actual = "";
  raiz.setAttribute("data-color-vivo-on", "");
  const poner = (c: string) => {
    if (c === actual) return;
    actual = c;
    const sale = velos[activo];
    activo = 1 - activo;
    const entra = velos[activo];
    entra.style.backgroundColor = c;
    entra.setAttribute("data-on", "");
    sale.removeAttribute("data-on");
    // (P3) Ya no se escribe `--color-vivo` en el lienzo: nadie la leía y,
    // al heredarse, cada cambio de sección recalculaba el estilo de toda
    // la invitación (≈4.000 elementos) en pleno scroll.
  };

  const io = new IntersectionObserver(
    (es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        const c = tono.get(e.target);
        if (c) poner(c);
      }
    },
    // Manda la sección que cruza la línea de media pantalla.
    { rootMargin: "-50% 0px -50% 0px" },
  );
  secciones.forEach((s) => io.observe(s));

  return () => {
    io.disconnect();
    velos.forEach((v) => v.remove());
    raiz.removeAttribute("data-color-vivo-on");
  };
}
