"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { conEjemplo, consultaNombres, fechaBonita, iniciales, useNombres } from "@/components/sitio/nombres";
import { puede3D } from "@/components/tresd/capacidad";
import Sobre3D from "@/components/tresd/Sobre3D";
import s from "./portada.module.css";

/**
 * El sobre de la portada de invitoo.es.
 *
 * Es de la web, no de las invitaciones (el de las invitaciones es de E1):
 * aquí no se abre una boda, se enseña qué se siente al recibir una.
 *
 * TRES FASES, en `data-fase`:
 *  · `cerrado`  — el sobre sobre el lino, con «Para vosotros» a mano y el
 *    lacre. Es lo que sale del servidor y lo que se ve sin JavaScript (y
 *    entonces el sobre es un enlace a la invitación de ejemplo).
 *  · `abierto`  — al tocar, o solo a los 4 s: el lacre se parte, la solapa
 *    gira y sube la cartulina con los nombres.
 *  · `movil`    — la cartulina gira a vertical, se estira y le crece el
 *    marco: es la pantalla de un móvil, y dentro entra la invitación viva.
 *
 * LA CARTULINA ES LA PANTALLA. No son dos piezas que se cruzan: es el mismo
 * elemento. Dentro del sobre va girado −90° y recortado (clip-path) a 5:7;
 * al convertirse, gira a 0°, el recorte se abre hasta la pantalla entera y
 * aparece el marco. Su contenido gira al revés a la vez, así que los
 * nombres siempre se leen derechos.
 *
 * LCP. El póster del render 3D (`/tresd/sobre-*.webp`) es un `<img>` del
 * HTML del servidor con `fetchPriority="high"`, sin opacidad de entrada: es
 * lo primero que se pinta y lo más grande del primer pantallazo. El titular
 * va en líneas sueltas, ninguna tan grande como el sobre.
 *
 * Movimiento: solo transform, opacity y clip-path, con las curvas de la
 * casa. Con `prefers-reduced-motion` no se abre solo y, si se toca, cambia
 * sin animación.
 *
 * 3D (X1). Encima del sobre CSS va un PÓSTER (`/tresd/sobre-*.avif|webp`):
 * la foto del mismo render en 3D, que es el LCP. Cuando la página está
 * ociosa y el dispositivo lo merece, `<Sobre3D>` carga three.js y, en
 * cuanto su primer fotograma está pintado, ocupa el sitio del póster
 * (`data-tresd="1"`): el lacre se parte, la solapa gira, la cartulina sale
 * y viene a cámara hasta el sitio exacto donde la cartulina CSS empieza a
 * hacerse móvil. Sin WebGL, en gama baja, con reduced-motion o ahorro de
 * datos, no se carga nada y al tocar se abre el sobre CSS de siempre (el
 * póster se funde al empezar).
 */

type Fase = "cerrado" | "abierto" | "movil";

const ABRE_SOLO = 4000;
const SUBE = 2300;
/** Con el 3D, la apertura dura lo que su animación (lacre → cartulina delante). */
const SUBE_3D = 2700;
const DURACION_3D = 2.6;
const ESPERA_3D = 2500;

export default function EscenaSobre({
  slug,
  ejemplo,
  fechaLarga,
  fechaIso = "",
  titulo,
}: {
  slug: string;
  /** La pareja de la muestra: [«Laura», «Rubén», «30 de marzo»]. */
  ejemplo: [string, string, string];
  /** «30 · Marzo · 2027», como va en la cartulina. */
  fechaLarga: string;
  /** La fecha de la muestra en ISO, para reescribirla dentro de la invitación. */
  fechaIso?: string;
  /** Para el lector de pantalla. */
  titulo: string;
}) {
  const [fase, setFase] = useState<Fase>("cerrado");
  const [vivo, setVivo] = useState(false);
  const [cargado, setCargado] = useState(false);
  const [tresd, setTresd] = useState(false);
  const tresdRef = useRef(false);
  const fallo3d = useRef(false);
  const faseRef = useRef<Fase>("cerrado");
  useEffect(() => {
    faseRef.current = fase;
  }, [fase]);
  const [caja, setCaja] = useState<{ w: number; h: number } | null>(null);
  const [nombres] = useNombres();
  const n = conEjemplo(nombres, ejemplo);
  const escenario = useRef<HTMLDivElement>(null);
  const marco = useRef<HTMLIFrameElement>(null);
  const relojes = useRef<number[]>([]);

  const abrir = useCallback(() => {
    setFase((f) => {
      if (f !== "cerrado") return f;
      const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      relojes.current.push(
        window.setTimeout(() => setFase("movil"), quieto ? 0 : tresdRef.current ? SUBE_3D : SUBE),
      );
      return "abierto";
    });
  }, []);

  // Solo a los 4 s, si nadie lo ha tocado y no se pide menos movimiento.
  // Si el 3D va a llegar, se espera a él (como mucho 7 s) y entonces se
  // deja 2,5 s quieto para que se vea el sobre antes de abrirse.
  // `?sinauto` (QA) no lo abre solo.
  useEffect(() => {
    const quieto =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      new URLSearchParams(window.location.search).has("sinauto");
    const t = relojes.current;
    if (!quieto) {
      if (!puede3D()) t.push(window.setTimeout(abrir, ABRE_SOLO));
      else {
        const inicio = performance.now();
        const mirar = () => {
          const pasado = performance.now() - inicio;
          if (tresdRef.current) t.push(window.setTimeout(abrir, ESPERA_3D));
          else if (pasado > 7000 || fallo3d.current) t.push(window.setTimeout(abrir, Math.max(0, ABRE_SOLO - pasado)));
          else t.push(window.setTimeout(mirar, 250));
        };
        mirar();
      }
    }
    const abrePorCampo = () => abrir();
    window.addEventListener("invitoo:abrir-sobre", abrePorCampo);
    return () => {
      t.forEach(clearTimeout);
      window.removeEventListener("invitoo:abrir-sobre", abrePorCampo);
    };
  }, [abrir]);

  // La invitación viva entra cuando hay móvil y la página ya ha cargado.
  // Con ahorro de datos o 2G, no: se queda la cartulina, que ya se entiende.
  useEffect(() => {
    if (fase !== "movil") return;
    const red = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (red?.saveData || /^(slow-)?2g$/.test(red?.effectiveType ?? "")) return;
    // (P3) La invitación de dentro es una página entera y comparte el hilo
    // principal con la portada (mismo origen): cargarla nada más abrirse el
    // sobre metía 2–3 s de tareas largas justo cuando la pareja empieza a
    // tocar (INP). Ahora entra con el primer gesto (tocar, teclear, bajar)
    // o, si no lo hay, cuando la página lleva un rato ociosa. Mientras, la
    // cartulina con sus nombres ya se lee en la pantalla.
    let hecho = false;
    let ocioso = 0;
    let reloj = 0;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const gestos = ["pointerdown", "keydown", "scroll", "wheel"] as const;
    const ya = () => {
      if (hecho) return;
      hecho = true;
      quitar();
      setVivo(true);
    };
    const quitar = () => gestos.forEach((g) => window.removeEventListener(g, ya));
    gestos.forEach((g) => window.addEventListener(g, ya, { passive: true, once: true }));
    const esperar = () => {
      reloj = window.setTimeout(() => {
        if (w.requestIdleCallback) ocioso = w.requestIdleCallback(ya, { timeout: 4000 });
        else ya();
      }, 2500);
    };
    if (document.readyState === "complete") esperar();
    else window.addEventListener("load", esperar, { once: true });
    return () => {
      hecho = true;
      quitar();
      window.removeEventListener("load", esperar);
      window.clearTimeout(reloj);
      if (ocioso && w.cancelIdleCallback) w.cancelIdleCallback(ocioso);
    };
  }, [fase]);

  // La invitación se pinta a 390 px y se escala a la pantalla.
  useEffect(() => {
    const nodo = escenario.current;
    if (!nodo) return;
    const pantalla = nodo.querySelector<HTMLElement>(`.${s.pantalla}`);
    if (!pantalla) return;
    const medir = () => {
      nodo.style.setProperty("--escala", String(pantalla.offsetWidth / 390));
      setCaja((c) =>
        c && c.w === nodo.offsetWidth && c.h === nodo.offsetHeight ? c : { w: nodo.offsetWidth, h: nodo.offsetHeight },
      );
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(pantalla);
    obs.observe(nodo);
    return () => obs.disconnect();
  }, []);

  // Los nombres, también dentro de la invitación de verdad (BarraDemo los
  // recoge y reescribe la muestra sin recargarla).
  useEffect(() => {
    const mandar = () => {
      try {
        marco.current?.contentWindow?.postMessage(
          { tipo: "invitoo:nombres", a: n.a, b: n.b, fecha: nombres.fecha, fd: fechaIso },
          window.location.origin,
        );
      } catch {
        /* el iframe se ha ido: no pasa nada */
      }
    };
    if (cargado) mandar();
    // La muestra los pide cuando ya ha hidratado (puede ser después del load).
    const alPedir = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.source === marco.current?.contentWindow && e.data?.tipo === "invitoo:pide-nombres")
        mandar();
    };
    window.addEventListener("message", alPedir);
    return () => window.removeEventListener("message", alPedir);
  }, [cargado, n.a, n.b, nombres.fecha, fechaIso]);

  // La URL del iframe se fija al cargarlo: los cambios van por mensaje.
  const [src] = useState(() => {
    const q = consultaNombres(nombres.a, nombres.b, nombres.fecha, fechaIso);
    return `/i/${slug}?vista=1${q ? `&${q}` : ""}`;
  });
  const q = consultaNombres(nombres.a, nombres.b, nombres.fecha, fechaIso);
  const entera = `/i/${slug}${q ? `?${q}` : ""}`;

  // Dónde acaba la cartulina 3D: justo donde la CSS empieza a hacerse móvil
  // (mismas cuentas que `.pantalla` con `--s: 1.15` y `--dy: -20cqw`).
  const destino = caja
    ? {
        x: 0.5,
        y: (0.5 * caja.h - 0.2 * caja.w) / caja.h,
        w: (0.88 * caja.h * (1 - 2 * 0.176) * 1.15) / caja.w,
      }
    : undefined;
  const hayNombres = Boolean(nombres.a || nombres.b);
  const ini = iniciales(n.a, n.b);

  return (
    <div
      ref={escenario}
      className={s.escenario}
      data-fase={fase}
      data-cargado={cargado ? "1" : "0"}
      data-tresd={tresd ? "1" : undefined}
      data-nombres={hayNombres ? "1" : undefined}
    >
      {/* El póster: la foto del render 3D. Es el LCP; se queda si no hay 3D. */}
      <picture className={s.poster}>
        <source media="(min-width: 1024px)" type="image/avif" srcSet="/tresd/sobre-escritorio.avif" />
        <source media="(min-width: 1024px)" type="image/webp" srcSet="/tresd/sobre-escritorio.webp" />
        <source type="image/avif" srcSet="/tresd/sobre-movil.avif" />
        <img src="/tresd/sobre-movil.webp" alt="" width={780} height={1040} fetchPriority="high" decoding="async" />
      </picture>

      {caja && (
        <Sobre3D
          className={s.capa3d}
          a={n.a}
          b={n.b}
          fecha={fechaBonita(nombres.fecha) || fechaLarga}
          iniciales={[ini[0] ?? "", ini[1] ?? ""]}
          escrito="Para vosotros"
          sello="alianzas"
          matasellos={{ aro: `${n.a} & ${n.b} · Barcelona ·`, centro: ini }}
          letraMano="var(--font-mano), cursive"
          letraCarta="var(--font-italica), var(--display)"
          letraTexto="inherit"
          abierto={fase !== "cerrado"}
          duracion={DURACION_3D}
          destino={destino}
          encuadre={0.84}
          onListo={() => {
            // Si ya se abrió (CSS), el 3D llega tarde: no se cambia a mitad.
            if (faseRef.current !== "cerrado") return;
            tresdRef.current = true;
            setTresd(true);
          }}
          onFallo={() => {
            fallo3d.current = true;
            tresdRef.current = false;
            setTresd(false);
          }}
        />
      )}
      {/* ───── El sobre: un enlace sin JS, un botón con él ───── */}
      <a
        href={entera}
        onClick={(e) => {
          if (fase !== "cerrado") return;
          e.preventDefault();
          abrir();
        }}
        aria-label={fase === "cerrado" ? "Abrir el sobre" : titulo}
        className={s.toque}
        tabIndex={fase === "movil" ? -1 : undefined}
        aria-hidden={fase === "movil" || undefined}
      />

      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático, es el LCP */}
      <img
        src="/sitio/sobre-dorso.svg"
        alt=""
        width={600}
        height={400}
        decoding="async"
        className={`${s.pieza} ${s.dorso}`}
      />

      <div className={`${s.pieza} ${s.solapaCaja}`} aria-hidden>
        <div className={s.solapa}>
          <svg viewBox="0 0 600 236" className={s.cara} preserveAspectRatio="none">
            <defs>
              <linearGradient id="solapa-luz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f6efe4" />
                <stop offset="1" stopColor="#ebe0cf" />
              </linearGradient>
            </defs>
            <path d="M0 0H600L318 226Q300 240 282 226Z" fill="url(#solapa-luz)" />
            <path d="M0 .5 282 226Q300 240 318 226L600 .5" fill="none" stroke="#c9b69a" strokeOpacity=".7" />
          </svg>
          <svg viewBox="0 0 600 236" className={s.dorsoSolapa} preserveAspectRatio="none">
            <defs>
              <pattern id="solapa-forro" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="22" height="22" fill="#efe6d6" />
                <path d="M0 0H22M0 0V22" stroke="#b08d57" strokeWidth=".7" strokeOpacity=".55" />
              </pattern>
            </defs>
            <path d="M0 0H600L318 226Q300 240 282 226Z" fill="url(#solapa-forro)" />
            <path d="M14 7H586L306 220Q300 225 294 220Z" fill="none" stroke="#b08d57" strokeOpacity=".8" />
          </svg>
        </div>
      </div>

      {/* ───── La cartulina, que será la pantalla ───── */}
      <div className={s.marco} aria-hidden />
      <div className={s.pantalla}>
        <span className={s.isla} aria-hidden />
        <div className={s.cartulina} aria-hidden>
          <p className={s.cartulinaSobre}>Nos casamos</p>
          <p className={s.cartulinaNombres}>
            <span>{n.a}</span>
            <span className={s.y}>&amp;</span>
            <span>{n.b}</span>
          </p>
          <p className={s.cartulinaFecha}>{fechaBonita(nombres.fecha) || fechaLarga}</p>
        </div>
        {vivo && (
          <iframe
            ref={marco}
            src={src}
            title={titulo}
            tabIndex={-1}
            onLoad={() => setCargado(true)}
            className={s.iframe}
          />
        )}
        {fase === "movil" && (
          <a href={entera} aria-label={`${titulo}, a pantalla completa`} className={s.tocarMovil} />
        )}
      </div>

      <svg viewBox="0 0 600 400" className={`${s.pieza} ${s.bolsillo}`} aria-hidden preserveAspectRatio="none">
        <defs>
          <linearGradient id="bolsillo-lados" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#efe5d6" />
            <stop offset=".5" stopColor="#f5eee3" />
            <stop offset="1" stopColor="#ece1d0" />
          </linearGradient>
          <linearGradient id="bolsillo-bajo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7f1e7" />
            <stop offset="1" stopColor="#efe6d7" />
          </linearGradient>
        </defs>
        <path d="M0 6V400H600V6L318 214Q300 228 282 214Z" fill="url(#bolsillo-lados)" />
        <path d="M0 400 286 186Q300 176 314 186L600 400Z" fill="url(#bolsillo-bajo)" />
        <path d="M0 400 286 186Q300 176 314 186L600 400" fill="none" stroke="#cdbb9f" strokeOpacity=".6" />
        <path d="M.5 6 282 214M599.5 6 318 214" stroke="#d3c3a8" strokeOpacity=".55" />
      </svg>

      <p className={`${s.pieza} ${s.escrito}`} aria-hidden>
        <span>Para vosotros</span>
      </p>

      <Matasellos texto={`${n.a} & ${n.b}`} iniciales={iniciales(n.a, n.b)} />

      <div className={`${s.pieza} ${s.lacreCaja}`} aria-hidden>
        <span className={`${s.lacre} ${s.lacreIzq}`}>
          <Lacre />
        </span>
        <span className={`${s.lacre} ${s.lacreDer}`}>
          <Lacre />
        </span>
        <span className={s.reflejo} />
      </div>

      <p className={s.pista} aria-hidden>
        {fase === "cerrado" ? "Tocad el sobre" : " "}
      </p>
    </div>
  );
}

/** El lacre: cera granate de borde irregular con las alianzas en relieve. */
function Lacre() {
  return (
    <svg viewBox="0 0 120 120">
      <defs>
        <radialGradient id="cera" cx=".38" cy=".32" r=".75">
          <stop offset="0" stopColor="#a8323f" />
          <stop offset=".55" stopColor="#8c1d2c" />
          <stop offset="1" stopColor="#5e0f1b" />
        </radialGradient>
      </defs>
      <path
        d="M60 4c9 0 13 6 21 8s15 1 19 9 2 13 6 20 10 12 8 20-8 11-10 19 0 15-7 21-14 3-21 7-11 8-19 8-12-5-20-8-15 0-20-7-2-13-6-21-11-10-9-19 7-12 9-20-3-14 4-20 13-3 20-7S51 4 60 4Z"
        fill="url(#cera)"
      />
      <circle cx="60" cy="60" r="34" fill="none" stroke="#5e0f1b" strokeOpacity=".55" strokeWidth="2.4" />
      <circle cx="60" cy="60" r="31" fill="none" stroke="#c45563" strokeOpacity=".35" strokeWidth="1" />
      <g fill="none" stroke="#5e0f1b" strokeOpacity=".7" strokeWidth="3.2" transform="translate(32 41) scale(.19)">
        <circle cx="71" cy="118" r="65" />
        <circle cx="201" cy="110" r="84" />
        <path d="M71 46 42 13h58L71 46Z" strokeWidth="6" strokeLinejoin="round" />
      </g>
      <g fill="none" stroke="#d76b78" strokeOpacity=".45" strokeWidth="2.2" transform="translate(31 40) scale(.19)">
        <circle cx="71" cy="118" r="65" />
        <circle cx="201" cy="110" r="84" />
      </g>
    </svg>
  );
}

/** El matasellos: las iniciales en el centro y los nombres en el aro. */
function Matasellos({ texto, iniciales: ini }: { texto: string; iniciales: string }) {
  return (
    <svg viewBox="0 0 176 120" className={`${s.pieza} ${s.matasellos}`} aria-hidden>
      <defs>
        <path id="aro-matasellos" d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" />
      </defs>
      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1" />
      <text fontSize="10.5" letterSpacing="2.2" fill="currentColor">
        <textPath href="#aro-matasellos" startOffset="2%">
          {`${texto.toLocaleUpperCase("es-ES")} · BARCELONA ·`}
        </textPath>
      </text>
      <text x="60" y="67" textAnchor="middle" fontSize="20" fill="currentColor" className={s.matasellosIni}>
        {ini}
      </text>
      <path
        d="M104 46q9-6 18 0t18 0t18 0t18 0M106 60q9-6 18 0t18 0t18 0t18 0M104 74q9-6 18 0t18 0t18 0t18 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
