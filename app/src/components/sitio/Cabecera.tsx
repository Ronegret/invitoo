"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import EnlaceReserva from "@/components/sitio/EnlaceReserva";
import { conEjemplo, fechaBonita, useNombres } from "@/components/sitio/nombres";
import { Magnetico } from "@/components/sistema";
import { enlaceReserva } from "@/lib/contacto";
import s from "./cabecera.module.css";

/**
 * La cabecera de invitoo.es (v3, «estilo rodd.es» con la marca de la casa).
 *
 *  · Una CÁPSULA FLOTANTE de papel esmerilado (backdrop-filter) que se
 *    compacta al bajar: menos alto, menos ancho y una sombra cálida. La
 *    marca no cambia: papel, tinta, granate, Bodoni y el logotipo.
 *  · Enlaces en texto fino con un SUBRAYADO que se dibuja de izquierda a
 *    derecha, y una CÁPSULA que se desliza hasta la página en la que estás
 *    (un solo elemento con transform: al navegar, viaja).
 *  · «Entrar», discreto, y el CTA «Hablemos» en cápsula con un círculo
 *    granate y una flecha que gira al pasar el ratón.
 *  · En móvil, un MENÚ A PANTALLA COMPLETA: enlaces grandes en Bodoni que
 *    suben escalonados desde su línea (como FlowingMenu), una mini
 *    invitación viva con los nombres que hayáis escrito y los dos CTA.
 *
 * Accesible: enlace para saltar al contenido, `aria-expanded` y
 * `aria-controls` en el botón, el menú es un diálogo modal con trampa de
 * foco, Escape lo cierra y el foco vuelve al botón. El resto de la página
 * queda `inert` mientras está abierto.
 *
 * Sin JavaScript: los enlaces de escritorio se ven (en móvil, el pie lleva
 * todos los enlaces y el CTA de la portada sigue ahí).
 */

const ENLACES: { href: string; texto: string; nota: string; ancho?: boolean }[] = [
  { href: "/plantillas", texto: "Plantillas", nota: "28, por estilo" },
  { href: "/en-directo", texto: "En directo", nota: "en el salón" },
  { href: "/servicios", texto: "Qué lleva", nota: "todo hecho" },
  { href: "/precios", texto: "Precios", nota: "pago único" },
  { href: "/preguntas", texto: "Preguntas", nota: "sin letra pequeña" },
  { href: "/colaboradores", texto: "Colaboradores", nota: "fincas", ancho: true },
];

/** La invitación de ejemplo del menú. La calcula el layout (servidor). */
export type Mini = { slug: string; ejemplo: [string, string, string]; fecha: string; desde: number };

export default function Cabecera({ mini }: { mini: Mini }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [bajado, setBajado] = useState(false);
  const [pildora, setPildora] = useState<{ x: number; w: number } | null>(null);
  const cabecera = useRef<HTMLElement>(null);
  const nav = useRef<HTMLUListElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const activo =
    ENLACES.find((e) => ruta === e.href || ruta.startsWith(e.href + "/"))?.href ?? null;

  /* ───── Se compacta al bajar ───── */
  useEffect(() => {
    let raf = 0;
    const mirar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setBajado(window.scrollY > 24));
    };
    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", mirar);
    };
  }, []);

  /* ───── La cápsula de la página activa ───── */
  const medir = useCallback(() => {
    const lista = nav.current;
    if (!lista || !activo) return setPildora(null);
    const a = lista.querySelector<HTMLElement>(`[data-href="${activo}"]`);
    if (!a) return setPildora(null);
    setPildora({ x: a.offsetLeft, w: a.offsetWidth });
  }, [activo]);

  useLayoutEffect(() => {
    medir();
  }, [medir, bajado]);

  useEffect(() => {
    const obs = new ResizeObserver(medir);
    if (nav.current) obs.observe(nav.current);
    // Las fuentes cambian el ancho de las palabras al llegar.
    document.fonts?.ready.then(medir).catch(() => {});
    return () => obs.disconnect();
  }, [medir]);

  /* ───── Cerrar al navegar ───── */
  const [rutaVista, setRutaVista] = useState(ruta);
  if (rutaVista !== ruta) {
    setRutaVista(ruta);
    setAbierto(false);
  }

  /* ───── El menú móvil: modal de verdad ───── */
  useEffect(() => {
    if (!abierto) return;
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = "hidden";
    html.dataset.menu = "abierto";
    // Lo de fuera queda inerte: ni foco, ni lector de pantalla.
    const fuera = Array.from(document.body.children).filter(
      (n) => n instanceof HTMLElement && !n.contains(cabecera.current) && n.tagName !== "SCRIPT",
    ) as HTMLElement[];
    const hermanos = cabecera.current?.parentElement
      ? (Array.from(cabecera.current.parentElement.children).filter(
          (n) => n !== cabecera.current,
        ) as HTMLElement[])
      : [];
    const inertes = [...fuera, ...hermanos];
    inertes.forEach((n) => n.setAttribute("inert", ""));

    // El foco entra en el primer enlace.
    const t = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
    }, 60);

    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setAbierto(false);
        boton.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const raiz = cabecera.current;
      if (!raiz) return;
      const enfocables = Array.from(
        raiz.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((n) => n.offsetParent !== null && !n.closest("[inert]"));
      if (!enfocables.length) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", tecla);

    // Si la ventana crece hasta escritorio, el menú no tiene sentido.
    const ancho = window.matchMedia("(min-width: 1024px)");
    const alCrecer = () => ancho.matches && setAbierto(false);
    ancho.addEventListener("change", alCrecer);

    return () => {
      window.clearTimeout(t);
      html.style.overflow = antes;
      delete html.dataset.menu;
      inertes.forEach((n) => n.removeAttribute("inert"));
      document.removeEventListener("keydown", tecla);
      ancho.removeEventListener("change", alCrecer);
    };
  }, [abierto]);

  const cerrar = () => setAbierto(false);

  return (
    <header
      ref={cabecera}
      className={s.cabecera}
      data-bajado={bajado ? "1" : "0"}
      data-abierto={abierto ? "1" : "0"}
    >
      <a href="#contenido" className={s.saltar}>
        Saltar al contenido
      </a>

      <div className={s.capsula}>
        <Link href="/" aria-label="Invitoo, inicio" className={s.logo} onClick={cerrar}>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG del logo real */}
          <img src="/marca/palabra.svg" alt="" width={104} height={26} />
        </Link>

        <nav aria-label="Principal" className={s.nav}>
          <ul ref={nav} className={s.lista}>
            <li
              aria-hidden
              className={s.pildora}
              style={{
                width: pildora?.w ?? 0,
                transform: `translateX(${pildora?.x ?? 0}px)`,
                opacity: pildora ? 1 : 0,
              }}
            />
            {ENLACES.map((e) => (
              <li key={e.href} className={e.ancho ? s.soloAncho : undefined}>
                <Link
                  href={e.href}
                  data-href={e.href}
                  aria-current={activo === e.href ? "page" : undefined}
                  className={s.enlace}
                >
                  <span className={s.subrayado}>{e.texto}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={s.derecha}>
          <Link href="/cuenta/entrar" className={s.entrar} title="Entrar en vuestro panel">
            Entrar
          </Link>
          <Magnetico fuerza={4}>
            <EnlaceReserva href={enlaceReserva()} className={s.cta} data-petalos data-cursor-petalos="">
              <span className={s.ctaTexto}>Hablemos</span>
              <span className={s.circulo} aria-hidden>
                <Flecha />
              </span>
              <span className="sr-only"> (abre WhatsApp en otra pestaña)</span>
            </EnlaceReserva>
          </Magnetico>
          <button
            ref={boton}
            type="button"
            className={s.hamburguesa}
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? "Cerrar el menú" : "Abrir el menú"}
          >
            <span aria-hidden className={s.rayas}>
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <MenuMovil
        abierto={abierto}
        activo={activo}
        refPanel={panel}
        alElegir={cerrar}
        mini={mini}
      />
    </header>
  );
}

/* ─────────────────────────────── Menú móvil ─────────────────────────────── */

function MenuMovil({
  abierto,
  activo,
  refPanel,
  alElegir,
  mini,
}: {
  mini: Mini;
  abierto: boolean;
  activo: string | null;
  refPanel: React.RefObject<HTMLDivElement | null>;
  alElegir: () => void;
}) {
  return (
    <div
      id="menu-movil"
      ref={refPanel}
      role="dialog"
      aria-modal="true"
      aria-label="Menú"
      className={s.menu}
      data-abierto={abierto ? "1" : "0"}
      // Cerrado no existe para el teclado ni para el lector de pantalla.
      inert={!abierto}
      aria-hidden={!abierto}
    >
      <div className={s.menuFondo} aria-hidden />
      <div className={s.menuCuerpo}>
        <nav aria-label="Menú del móvil">
          <ul className={s.menuLista}>
            {ENLACES.map((e, i) => (
              <li key={e.href} style={{ "--i": i } as React.CSSProperties} className={s.menuFila}>
                <Link
                  href={e.href}
                  onClick={alElegir}
                  aria-current={activo === e.href ? "page" : undefined}
                  className={s.menuEnlace}
                >
                  <span className={s.menuMascara}>
                    <span className={s.menuPalabra}>{e.texto}</span>
                  </span>
                  <span className={s.menuNota}>{e.nota}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MiniInvitacion alElegir={alElegir} mini={mini} />

        <div className={s.menuCtas}>
          <EnlaceReserva
            href={enlaceReserva()}
            className={`${s.cta} ${s.ctaGrande}`}
            data-petalos
            onClick={alElegir}
          >
            <span className={s.ctaTexto}>Hablemos 20 minutos</span>
            <span className={s.circulo} aria-hidden>
              <Flecha />
            </span>
            <span className="sr-only"> (abre WhatsApp en otra pestaña)</span>
          </EnlaceReserva>
          <Link href="/cuenta/entrar" onClick={alElegir} className={s.menuEntrar}>
            ¿Ya tenéis invitación? <span className={s.subrayado}>Entrad en vuestro panel</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * La mini invitación del menú: la cartulina de la portada, en pequeño, con
 * los nombres que hayáis escrito (o los del ejemplo). Es viva: si escribís
 * en la portada, aquí ya pone vuestros nombres.
 */
function MiniInvitacion({ alElegir, mini }: { alElegir: () => void; mini: Mini }) {
  const [nombres] = useNombres();
  const n = conEjemplo(nombres, mini.ejemplo);
  const q = n.propios ? `?nombres=${encodeURIComponent(`${n.a},${n.b}`)}` : "";

  return (
    <Link href={`/i/${mini.slug}${q}`} onClick={alElegir} className={s.mini}>
      <span className={s.miniCartulina} aria-hidden>
        <span className={s.miniSobre}>Nos casamos</span>
        <span className={s.miniNombres}>
          {n.a} <em>&amp;</em> {n.b}
        </span>
        <span className={s.miniFecha}>{fechaBonita(nombres.fecha) || mini.fecha}</span>
        <span className={s.miniBrillo} />
      </span>
      <span className={s.miniTexto}>
        <span className={s.miniTitulo}>
          {n.propios ? "Vuestra invitación, así" : "Abrid una invitación de ejemplo"}
        </span>
        <span className={s.miniBajo}>Desde {mini.desde} €, IVA incluido</span>
      </span>
    </Link>
  );
}

function Flecha() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
    </svg>
  );
}
