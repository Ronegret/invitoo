/**
 * Los revelados al hacer scroll de las plantillas temáticas (K1).
 *
 * Dos caminos, y en ninguno se esconde nada sin red:
 *  1. Donde hay `animation-timeline: view()` (Chrome, Edge, Safari 26), las
 *     escenas son CSS puro ligado al scroll: van y vuelven con el dedo, a la
 *     velocidad nativa. Nada que hidratar.
 *  2. Donde no, este guion en línea (sin React, sin imports: se serializa
 *     con `toString()`) marca `data-k-espera` y un único
 *     IntersectionObserver pone `data-k-visto` al asomar cada escena, y la
 *     transición CSS hace el resto.
 * Sin JavaScript, o con «menos movimiento», todo se ve quieto y entero.
 */
export function programaEscenas(raiz: Element | null) {
  /* eslint-disable no-var -- se serializa tal cual */
  if (!raiz) return;
  var css = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (css || quieto || !("IntersectionObserver" in window)) return;
  var nodos = raiz.querySelectorAll("[data-k-escena]");
  var alto = window.innerHeight || 700;
  var io = new IntersectionObserver(
    function (es) {
      for (var i = 0; i < es.length; i++) {
        if (es[i].isIntersecting) {
          es[i].target.setAttribute("data-k-visto", "1");
          io.unobserve(es[i].target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  for (var i = 0; i < nodos.length; i++) {
    var r = nodos[i].getBoundingClientRect();
    // Lo que ya está en pantalla al llegar no se esconde.
    if (r.top < alto * 0.92) continue;
    nodos[i].setAttribute("data-k-espera", "1");
    io.observe(nodos[i]);
  }
}

const GUION = `(${programaEscenas.toString()})(document.currentScript&&document.currentScript.parentElement);`;

/** Va al FINAL del lienzo de cada plantilla temática. */
export function GuionEscenas() {
  return <script dangerouslySetInnerHTML={{ __html: GUION }} />;
}
