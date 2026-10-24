/**
 * El guion de la apertura, en JavaScript de toda la vida.
 *
 * Esta función se manda DOS veces y es la misma:
 *   1. Como `<script>` en línea dentro del HTML del servidor, al final de la
 *      capa de la apertura. Corre antes de que se pinte la portada, así que
 *      decide sin parpadeo si la apertura se ve o no, y el botón «Saltar»
 *      funciona aunque React tarde seis segundos en llegar por 3G.
 *   2. Desde React, solo si el script no llegó a correr (navegación en
 *      cliente desde otra página de la web).
 *
 * Por eso NO puede usar nada de fuera: ni imports, ni variables del módulo,
 * ni sintaxis moderna. Se serializa con `toString()`.
 *
 * Estados de la capa (`data-estado`):
 *   espera  → recién servida, oculta (también sin JavaScript: la invitación
 *             se lee directamente, sin vídeo)
 *   dentro  → la apertura está en pantalla
 *   saliendo→ fundido de salida (navegadores sin View Transitions)
 *   destello→ la luz florece, tapa el último fotograma y se disuelve
 *   levantando → el velo termina de subir
 *   fuera   → oculta para siempre en esta visita
 */
/** Clase que lleva el titular de la portada para recibir los nombres del rótulo. */
export const CLASE_TITULAR_PORTADA = "vt-nombres";

export type ConfigApertura = {
  /** Clave de `localStorage` para «ya la vio». */
  clave: string;
  /** Montaje vertical y horizontal. Vacíos en la apertura sin vídeo (Sobre). */
  vertical: string;
  horizontal: string;
  /** Segundo en que entra el rótulo. */
  rotuloEn: number;
  /** Salvavidas en ms. 0 = sin salvavidas (el Sobre espera a que lo abran). */
  espera: number;
  /** Duración de la animación del Sobre al abrirse, en ms. */
  abrirMs: number;
  /**
   * Fundido de la apertura a la portada, en ms (sale del movimiento de la
   * boda: `--mov-salida`). Opcional para no romper configuraciones viejas.
   */
  salirMs?: number;
  /**
   * Con «menos movimiento», enseñar la apertura igualmente (el sobre: es
   * quieto y personal) y salir con un fundido simple al tocar.
   */
  quietoMuestra?: boolean;
  /** Al salir, los nombres de la portada se escriben (`data-trazo` en el padre). */
  trazo?: boolean;
  /**
   * Cómo se sale (U1): «destello» (luz que florece y se disuelve) o
   * «velo-scroll» (la capa se retira hacia arriba con el dedo). Sin valor,
   * el fundido antiguo con View Transitions.
   */
  transicion?: "destello" | "velo-scroll";
  /** Duración del destello o de la subida del velo, en ms. */
  transicionMs?: number;
};

export function programaApertura(raiz: HTMLElement, cfg: ConfigApertura) {
  /* eslint-disable no-var -- se serializa tal cual y corre en navegadores viejos */
  if (!raiz || raiz.getAttribute("data-listo") === "1") return;
  raiz.setAttribute("data-listo", "1");

  // El estado también va en el <main> (`data-ap`): las reglas que dependen
  // de la apertura lo leen ahí y no con `main:has(> .apertura[…])`, que
  // obligaba a recalcular el estilo de TODA la invitación con cada cambio
  // del DOM (el segundero de la cuenta atrás: 1.100 elementos por fotograma).
  function estado(e: string) {
    raiz.setAttribute("data-estado", e);
    if (raiz.parentElement) raiz.parentElement.setAttribute("data-ap", e);
  }

  var visto = false;
  var quieto = false;
  // Dentro de un iframe (la demo del hero de la web) no se recuerda nada:
  // si no, quien luego abra la invitación de ejemplo la vería sin apertura.
  var enMarco = true;
  try {
    enMarco = window.self !== window.top;
  } catch {
    /* origen cruzado: es un marco */
  }
  try {
    if (!enMarco) visto = window.localStorage.getItem(cfg.clave) === "1";
  } catch {
    /* modo privado o almacenamiento bloqueado: se ve, y no pasa nada */
  }
  try {
    quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    /* noop */
  }
  // Vista previa del editor (?vista=1): la apertura solo si se pide con
  // ?apertura=1; si no, cada ajuste la volvería a enseñar entera.
  try {
    var q = window.location.search;
    if (/[?&]vista=1(&|$)/.test(q) && !/[?&]apertura=1(&|$)/.test(q)) visto = true;
    if (/[?&]apertura=1(&|$)/.test(q)) visto = false;
  } catch {
    /* noop */
  }
  if (visto || (quieto && !cfg.quietoMuestra)) {
    estado("fuera");
    return;
  }
  if (quieto) raiz.setAttribute("data-quieto", "1");

  estado("dentro");
  raiz.setAttribute("data-mostrada", "1");
  raiz.style.display = "";

  var video = raiz.querySelector("video");
  var cerrado = false;
  var temporizador = 0;

  function avisar(estado: string) {
    try {
      window.dispatchEvent(new CustomEvent("invitoo:apertura", { detail: estado }));
    } catch {
      /* navegadores sin CustomEvent: nadie escucha */
    }
  }

  function soltarVideo() {
    if (!video) return;
    try {
      video.pause();
      video.removeAttribute("src");
      video.load(); // suelta el archivo: megas que ya no hacen falta
    } catch {
      /* la capa se va igual */
    }
  }

  function terminar() {
    if (cfg.trazo && raiz.parentElement) raiz.parentElement.setAttribute("data-trazo", "1");
    estado("fuera");
    soltarVideo();
    avisar("fuera");
  }

  function cerrar() {
    if (cerrado) return;
    cerrado = true;
    window.clearTimeout(temporizador);
    document.removeEventListener("keydown", tecla);
    try {
      if (!enMarco) window.localStorage.setItem(cfg.clave, "1");
    } catch {
      /* noop */
    }
    var doc = document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    if (quieto) {
      // Menos movimiento: un fundido casi instantáneo, sin luz ni viaje.
      estado("saliendo");
      window.setTimeout(terminar, 220);
      return;
    }
    if (cfg.transicion === "destello" || cfg.transicion === "velo-scroll") {
      // Los nombres de la portada se escriben mientras la luz se disuelve.
      if (raiz.parentElement) raiz.parentElement.setAttribute("data-trazo", "1");
      estado(cfg.transicion === "destello" ? "destello" : "levantando");
      avisar(cfg.transicion === "destello" ? "destello" : "levantando");
      window.setTimeout(terminar, cfg.transicionMs || 680);
      return;
    }
    // Las pseudo-capas de View Transitions cuelgan de <html>, no del
    // lienzo: la duración de la salida tiene que estar ahí.
    if (cfg.salirMs) document.documentElement.style.setProperty("--mov-salida", cfg.salirMs + "ms");
    if (typeof doc.startViewTransition === "function") {
      // El navegador hace la foto del antes y del después y funde una en
      // otra; los nombres del rótulo viajan hasta el titular de la portada.
      try {
        doc.startViewTransition(terminar);
        return;
      } catch {
        /* sigue con el fundido de siempre */
      }
    }
    estado("saliendo");
    window.setTimeout(terminar, cfg.salirMs || 1100);
  }

  function tecla(e: KeyboardEvent) {
    if (e.key === "Escape" || e.key === "Esc") cerrar();
  }

  function mostrarRotulo() {
    raiz.setAttribute("data-rotulo", "1");
  }

  document.addEventListener("keydown", tecla);
  raiz.addEventListener("invitoo:cerrar", cerrar);

  // Tocar o deslizar también abre (U1). En el Sobre, el gesto rompe el
  // lacre; con vídeo, sale. Los botones (Saltar, sonido) van a lo suyo.
  var avanzar = function () {
    var lacre = raiz.querySelector("[data-abrir]") as HTMLElement | null;
    if (lacre) lacre.click();
    else cerrar();
  };
  var esBoton = function (t: EventTarget | null) {
    var el = t as Element | null;
    return !!(el && el.closest && el.closest("button, a, [data-abrir]"));
  };
  var velo = cfg.transicion === "velo-scroll" && !quieto;
  if (!velo) {
    raiz.addEventListener("click", function (e) {
      if (!esBoton(e.target) && !raiz.querySelector("[data-abrir]")) cerrar();
    });
    var yTacto = 0;
    raiz.addEventListener("touchstart", function (e) {
      yTacto = e.touches[0] ? e.touches[0].clientY : 0;
    }, { passive: true });
    raiz.addEventListener("touchend", function (e) {
      var t = e.changedTouches[0];
      if (t && yTacto - t.clientY > 40) avanzar();
    }, { passive: true });
    raiz.addEventListener("wheel", function (e) {
      if (e.deltaY > 12) avanzar();
    }, { passive: true });
  } else {
    // El velo: la capa sigue al dedo hacia arriba. Un solo rAF por frame,
    // sin medir nada dentro del bucle (el alto se lee al tocar).
    raiz.setAttribute("data-velo", "1");
    var progreso = 0;
    var cuadro = 0;
    var y0 = 0;
    var alto = window.innerHeight || 700;
    var reposo = 0;
    var pintar = function () {
      cuadro = 0;
      raiz.style.setProperty("--velo", String(progreso));
    };
    var pedir = function () {
      if (!cuadro) cuadro = window.requestAnimationFrame(pintar);
    };
    var soltar = function () {
      if (cerrado) return;
      if (progreso > 0.22) {
        cerrar();
        return;
      }
      progreso = 0;
      raiz.setAttribute("data-velo-vuelve", "1");
      pedir();
    };
    var mover = function (p: number) {
      raiz.removeAttribute("data-velo-vuelve");
      progreso = p < 0 ? 0 : p > 1 ? 1 : p;
      pedir();
    };
    raiz.addEventListener("touchstart", function (e) {
      if (esBoton(e.target)) return;
      alto = window.innerHeight || alto;
      y0 = e.touches[0] ? e.touches[0].clientY : 0;
    }, { passive: true });
    raiz.addEventListener("touchmove", function (e) {
      if (!e.touches[0] || cerrado) return;
      mover((y0 - e.touches[0].clientY) / (alto * 0.55));
    }, { passive: true });
    raiz.addEventListener("touchend", soltar, { passive: true });
    raiz.addEventListener("wheel", function (e) {
      if (cerrado) return;
      e.preventDefault();
      mover(progreso + e.deltaY / ((window.innerHeight || 700) * 0.9));
      window.clearTimeout(reposo);
      reposo = window.setTimeout(soltar, 180);
    }, { passive: false });
    raiz.addEventListener("click", function (e) {
      if (!esBoton(e.target) && !raiz.querySelector("[data-abrir]")) cerrar();
    });
  }

  var saltar = raiz.querySelector("[data-saltar]");
  if (saltar) {
    saltar.addEventListener("click", cerrar);
  }
  // El foco entra en el diálogo (no en «Saltar»: un anillo grueso sobre
  // el sobre es lo primero que se veía). Con Tab se llega a todo.
  try {
    raiz.setAttribute("tabindex", "-1");
    raiz.style.outline = "none";
    raiz.focus({ preventScroll: true });
  } catch {
    /* noop */
  }

  // El Sobre: el lacre se rompe con un toque, con Intro o con Espacio (es un
  // <button>, así que el teclado viene de serie).
  var abrir = raiz.querySelector("[data-abrir]");
  if (abrir) {
    abrir.addEventListener("click", function () {
      if (raiz.getAttribute("data-fase") === "abriendo") return;
      if (quieto) {
        cerrar();
        return;
      }
      raiz.setAttribute("data-fase", "abriendo");
      avisar("abriendo");
      // Un toque háptico mínimo al partir el lacre, donde lo haya.
      try {
        if (navigator.vibrate) navigator.vibrate(8);
      } catch {
        /* noop */
      }
      window.setTimeout(cerrar, cfg.abrirMs);
    });
  }

  if (video && (cfg.vertical || cfg.horizontal)) {
    var ancho = false;
    try {
      ancho = window.matchMedia("(orientation: landscape) and (min-width: 700px)").matches;
    } catch {
      ancho = (window.innerWidth || 0) > (window.innerHeight || 0);
    }
    // Se elige aquí y no con <source media>: hay que descargar UNO SOLO, y
    // los WebView antiguos ignoran `media` y bajan el primero que ven.
    var fuente = ancho ? cfg.horizontal || cfg.vertical : cfg.vertical || cfg.horizontal;
    // Los clips de V1 vienen también en WebM (VP9, más ligero): si el
    // navegador lo lee, ese. Si falla, el MP4 (ver `sinVideo` abajo).
    var mp4 = fuente;
    try {
      if (/\.mp4$/.test(fuente) && video.canPlayType('video/webm; codecs="vp9"')) fuente = fuente.replace(/\.mp4$/, ".webm");
    } catch {
      /* sin canPlayType: MP4 */
    }
    var v = video;
    var sinVideo = function () {
      // Ahorro de batería, archivo roto o 3G imposible: el póster con los
      // nombres hace de apertura unos segundos y se entra.
      mostrarRotulo();
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(cerrar, 3200);
    };
    v.addEventListener("timeupdate", function () {
      if (v.currentTime >= cfg.rotuloEn) mostrarRotulo();
      // El clip termina con su propio destello (0,6 s que funden al papel):
      // el rótulo se retira al empezar y el nuestro se enciende encima, con
      // el pico justo cuando el clip llega al papel liso.
      if (v.duration && isFinite(v.duration)) {
        if (v.currentTime >= v.duration - 0.6) raiz.setAttribute("data-rotulo-sale", "1");
        if (v.currentTime >= v.duration - 0.4) cerrar();
      }
    });
    v.addEventListener("ended", cerrar);
    v.addEventListener("error", function () {
      // El WebM no está o no se lee: el MP4 una vez; si tampoco, el póster.
      if (v.getAttribute("data-mp4") !== "1" && fuente !== mp4) {
        v.setAttribute("data-mp4", "1");
        v.src = mp4;
        try {
          var p2 = v.play();
          if (p2 && typeof p2.then === "function") p2.then(undefined, sinVideo);
        } catch {
          sinVideo();
        }
        return;
      }
      sinVideo();
    });
    // React no escribe el atributo `muted` en el HTML del servidor, y sin él
    // iOS se niega a arrancar el vídeo solo. Se pone a mano, las tres formas.
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.preload = "auto";
    v.src = fuente;
    try {
      var p = v.play();
      if (p && typeof p.then === "function") p.then(undefined, sinVideo);
    } catch {
      sinVideo();
    }
  } else {
    mostrarRotulo();
  }

  if (cfg.espera > 0) temporizador = window.setTimeout(cerrar, cfg.espera);
  avisar("dentro");
  /* eslint-enable no-var */
}
