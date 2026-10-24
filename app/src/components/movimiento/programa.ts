/**
 * El guion del revelado, en JavaScript de toda la vida.
 *
 * Igual que `aperturas/programa.ts`, esta función se manda DOS veces:
 *   1. Como `<script>` en línea al FINAL del lienzo de la invitación. Corre
 *      antes del primer pintado y antes de que llegue React: por 3G el
 *      revelado funciona aunque la hidratación tarde seis segundos.
 *   2. Desde `MovimientoCliente`, solo si el script no llegó a correr
 *      (navegación en cliente).
 *
 * Por eso no usa nada de fuera: ni imports ni variables del módulo. Se
 * serializa con `toString()`.
 *
 * LA REGLA DE ORO: el contenido nunca queda invisible por culpa de esto.
 *   · Sin JavaScript no se esconde nada (el CSS solo actúa con `html.js`
 *     Y con `data-espera`, que solo pone este script).
 *   · Lo que ya está en pantalla al empezar no se esconde.
 *   · Con `prefers-reduced-motion` no se esconde nada.
 *   · Sin IntersectionObserver no se esconde nada.
 *
 * Estados de cada pieza (`[data-revelar]` o `[data-rama]`):
 *   (nada)        → visible, quieta
 *   data-espera   → por debajo de la pantalla, esperando (oculta)
 *   data-entrando → entrando: aquí, y solo aquí, se declaran las
 *                   transiciones, para no pisar las de los bloques
 */
export function programaMovimiento(raiz: HTMLElement | null) {
  /* eslint-disable no-var -- se serializa tal cual y corre en navegadores viejos */
  if (!raiz || raiz.getAttribute("data-mov-listo") === "1") return;
  raiz.setAttribute("data-mov-listo", "1");
  var html = document.documentElement;
  html.classList.add("js");

  var quieto = false;
  try {
    quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    /* noop */
  }

  var SELECTOR = "[data-revelar],[data-rama],[data-flor]";
  var obs: IntersectionObserver | null = null;

  function ms(variable: string, porDefecto: number) {
    var v = "";
    try {
      v = getComputedStyle(raiz as HTMLElement).getPropertyValue(variable).trim();
    } catch {
      /* noop */
    }
    var n = parseFloat(v);
    return isFinite(n) ? n : porDefecto;
  }

  // Duraciones: se leen UNA vez (P3). Antes se leían con getComputedStyle
  // dentro de cada entrada, justo después de escribir un atributo: cada
  // pieza forzaba un recálculo de estilo de toda la invitación.
  var durPieza = 0;
  var durRama = 0;
  var durFlor: Map<Element, number> = new Map();
  function leerDuraciones(piezas: ArrayLike<HTMLElement>) {
    durPieza = ms("--mov-dur", 1100) + ms("--mov-paso", 110) * 8 + 400;
    durRama = ms("--mov-ornamento", 2000) + 1600;
    for (var i = 0; i < piezas.length; i++) {
      if (!piezas[i].hasAttribute("data-flor")) continue;
      var cs = getComputedStyle(piezas[i]);
      durFlor.set(
        piezas[i],
        5200 / Math.max(0.5, parseFloat(cs.getPropertyValue("--fl-vel")) || 1) +
          (parseFloat(cs.getPropertyValue("--fl-retraso")) || 0),
      );
    }
  }

  function entrar(el: HTMLElement) {
    if (!el.hasAttribute("data-espera")) return;
    var total = el.hasAttribute("data-flor")
      ? durFlor.get(el) || 5200
      : el.hasAttribute("data-rama")
        ? durRama
        : durPieza;
    el.setAttribute("data-entrando", "");
    // Dos fotogramas: el navegador tiene que ver el estado oculto CON la
    // transición declarada antes de quitarlo, o salta sin animar.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        el.removeAttribute("data-espera");
        window.setTimeout(function () {
          el.removeAttribute("data-entrando");
        }, total);
      });
    });
  }

  function preparar() {
    var piezas = raiz!.querySelectorAll<HTMLElement>(SELECTOR);
    if (quieto || typeof IntersectionObserver === "undefined") return;
    var alto = window.innerHeight || 800;
    obs = new IntersectionObserver(
      function (entradas) {
        for (var i = 0; i < entradas.length; i++) {
          if (entradas[i].isIntersecting) {
            var el = entradas[i].target as HTMLElement;
            obs!.unobserve(el);
            entrar(el);
          }
        }
      },
      // Se descubre cuando ya asoma un poco: la entrada se tiene que VER.
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    var alCargar: HTMLElement[] = [];
    // Primero TODAS las lecturas (una sola maquetación), después las
    // escrituras: leer y escribir alternando recalculaba el estilo de toda
    // la página por cada pieza (P3).
    leerDuraciones(piezas);
    var candidatas: HTMLElement[] = [];
    var dentro: boolean[] = [];
    for (var i = 0; i < piezas.length; i++) {
      var el = piezas[i];
      // Ramas sin animación (ajuste «ornamentos» apagado): se quedan dibujadas.
      if (el.hasAttribute("data-rama") && raiz!.getAttribute("data-mov-ornamentos") === "0") continue;
      // Flores apagadas por la boda: ni se esperan ni se observan.
      if (el.hasAttribute("data-flor") && raiz!.getAttribute("data-mov-flores") === "ninguna") continue;
      // Las ramas de la portada se dibujan al entrar en la invitación, no al
      // llegar a ellas: ya están en pantalla.
      if (el.getAttribute("data-rama") === "al-cargar" || el.getAttribute("data-flor") === "al-cargar") {
        alCargar.push(el);
        continue;
      }
      var r = el.getBoundingClientRect();
      candidatas.push(el);
      dentro.push(r.top < alto * 0.92 && r.bottom > 0); // ya en pantalla
    }
    for (var a = 0; a < alCargar.length; a++) alCargar[a].setAttribute("data-espera", "");
    for (var c = 0; c < candidatas.length; c++) {
      if (dentro[c]) continue;
      candidatas[c].setAttribute("data-espera", "");
      obs.observe(candidatas[c]);
    }
    // Cinturón y tirantes: si el observador no avisa de algo (ya pasó en
    // algunos móviles), al hacer scroll se suelta todo lo que ya está a la
    // vista o por encima. El oyente se quita solo cuando no queda nada.
    var pedido = 0;
    var revisar = function () {
      pedido = 0;
      var quedan = raiz!.querySelectorAll<HTMLElement>("[data-espera]:not([data-entrando])");
      var limite = (window.innerHeight || 800) * 0.96;
      var sueltas: HTMLElement[] = [];
      for (var k = 0; k < quedan.length; k++) {
        if (quedan[k].getAttribute("data-rama") === "al-cargar" || quedan[k].getAttribute("data-flor") === "al-cargar") continue;
        if (quedan[k].getBoundingClientRect().top < limite) sueltas.push(quedan[k]);
      }
      for (var q = 0; q < sueltas.length; q++) {
        if (obs) obs.unobserve(sueltas[q]);
        entrar(sueltas[q]);
      }
      if (!quedan.length) window.removeEventListener("scroll", alScroll);
    };
    var alScroll = function () {
      if (!pedido) pedido = window.setTimeout(revisar, 250);
    };
    window.addEventListener("scroll", alScroll, { passive: true });
    if (alCargar.length) {
      var soltar = function () {
        for (var j = 0; j < alCargar.length; j++) entrar(alCargar[j]);
      };
      // Si la apertura está delante, se espera a que se retire.
      if (document.querySelector('.apertura[data-estado="dentro"]')) {
        var alSalir = function (e: Event) {
          if ((e as CustomEvent<string>).detail !== "fuera") return;
          window.removeEventListener("invitoo:apertura", alSalir);
          window.setTimeout(soltar, 120);
        };
        window.addEventListener("invitoo:apertura", alSalir);
      } else {
        window.setTimeout(soltar, 80);
      }
    }
  }

  preparar();

  // Para la vista previa: «Repetir» vuelve a esconder y a revelar.
  (raiz as HTMLElement & { __movRepetir?: () => void }).__movRepetir = function () {
    if (obs) obs.disconnect();
    var todas = raiz!.querySelectorAll<HTMLElement>(SELECTOR);
    for (var i = 0; i < todas.length; i++) {
      todas[i].removeAttribute("data-entrando");
      todas[i].removeAttribute("data-espera");
    }
    try {
      quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* noop */
    }
    if (quieto || typeof IntersectionObserver === "undefined") return;
    leerDuraciones(todas);
    // Todo a la espera, también lo que está en pantalla, y se revela.
    obs = new IntersectionObserver(
      function (entradas) {
        for (var j = 0; j < entradas.length; j++) {
          if (entradas[j].isIntersecting) {
            obs!.unobserve(entradas[j].target);
            entrar(entradas[j].target as HTMLElement);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    for (var k = 0; k < todas.length; k++) {
      if (todas[k].hasAttribute("data-rama") && raiz!.getAttribute("data-mov-ornamentos") === "0") continue;
      todas[k].setAttribute("data-espera", "");
      obs.observe(todas[k]);
    }
  };

  html.classList.add("mov-listo");
  /* eslint-enable no-var */
}

/** El script de la cabeza del lienzo: marca `html.js` antes de pintar nada. */
export const SCRIPT_JS = `document.documentElement.classList.add("js")`;
