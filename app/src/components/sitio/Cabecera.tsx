"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Iman } from "@/components/Gestos";
import { enlaceReserva } from "@/lib/contacto";

/**
 * Páginas de verdad, no anclas.
 *
 * Antes eran cinco saltos dentro de una sola página de doce mil píxeles.
 * Ahora cada una es una URL: se puede mandar por WhatsApp el enlace de los
 * precios sin mandar la web entera, Google las indexa por separado y el
 * botón de atrás del móvil hace lo que uno espera.
 */
const ENLACES = [
  { href: "/plantillas", texto: "Plantillas" },
  { href: "/servicios", texto: "Qué lleva" },
  { href: "/precios", texto: "Precios" },
  { href: "/preguntas", texto: "Preguntas" },
];

/**
 * La cabecera.
 *
 * Dos cosas la separan de un menú corriente:
 *
 *  · **La píldora que persigue.** Una pastilla de fondo se desplaza y se
 *    estira hasta el enlace que tienes debajo del ratón, y vuelve a la
 *    sección en la que estás al salir. Es UN solo elemento animado con
 *    `transform`, no un fondo por enlace: cuesta lo mismo tenerlo que no.
 *  · **El menú móvil escalonado.** Los enlaces entran uno detrás de otro
 *    desde la derecha, no todos de golpe.
 *
 * Además la cabecera se encoge al bajar, para devolver sitio a la página.
 */
export default function Cabecera() {
  const [abierto, setAbierto] = useState(false);
  const [bajado, setBajado] = useState(false);
  const ruta = usePathname();
  /**
   * La portada de la home es el vídeo de marca, que es crema de principio a
   * fin: ahí la cabecera tiene que ir en tinta desde el primer instante o no
   * se ve. Las páginas interiores abren con fotografía bajo un degradado
   * oscuro, y ahí manda el blanco.
   */
  const portadaClara = ruta === "/";
  /** ¿Se escribe en tinta o en blanco? */
  const enTinta = bajado || portadaClara;
  // La píldora descansa sobre la página en la que estás.
  const activo =
    ENLACES.find((e) => ruta === e.href || ruta.startsWith(e.href + "/"))?.href ??
    "";
  const [pildora, setPildora] = useState({ x: 0, w: 0, visible: false });
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  useEffect(() => {
    const mirar = () => setBajado(window.scrollY > 40);
    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    return () => window.removeEventListener("scroll", mirar);
  }, []);

  const mover = useCallback(
    (href: string | null) => {
      const caja = nav.current;
      if (!caja) return;
      const destino = caja.querySelector<HTMLElement>(
        `[data-href="${href ?? activo}"]`,
      );
      if (!destino) {
        setPildora((p) => ({ ...p, visible: false }));
        return;
      }
      const r = destino.getBoundingClientRect();
      const rc = caja.getBoundingClientRect();
      setPildora({ x: r.left - rc.left, w: r.width, visible: true });
    },
    [activo],
  );

  useEffect(() => {
    mover(null);
  }, [mover]);

  return (
    <header
      // Sobre la portada va transparente y en blanco, como una cabecera de
      // revista; en cuanto se baja se vuelve papel. Si fuese opaca desde el
      // principio partiría la fotografía en dos.
      className="fixed inset-x-0 z-40 border-b transition-all duration-700"
      style={{
        top: "env(safe-area-inset-top, 0px)",
        background: bajado ? "color-mix(in srgb, var(--papel) 88%, transparent)" : "transparent",
        backdropFilter: bajado ? "blur(12px)" : "none",
        borderColor: bajado
          ? "color-mix(in srgb, var(--tinta) 12%, transparent)"
          : "transparent",
        color: enTinta ? "var(--tinta)" : "#fff",
      }}
    >
      <div
        className="mx-auto flex max-w-[72rem] items-center justify-between gap-6 px-5 transition-all duration-500"
        style={{ paddingTop: bajado ? 6 : 12, paddingBottom: bajado ? 6 : 12 }}
      >
        <Link href="/" aria-label="Invitoo — inicio" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG del logo real */}
          <img
            src="/marca/palabra.svg"
            alt="Invitoo"
            width={104}
            height={26}
            className="w-auto transition-all duration-700"
            style={{
              height: bajado ? 21 : 26,
              filter: enTinta ? "none" : "invert(1)",
            }}
          />
        </Link>

        <nav
          ref={nav}
          className="relative hidden items-center gap-1 md:flex"
          onPointerLeave={() => mover(null)}
        >
          <span
            aria-hidden
            className="absolute inset-y-0 my-auto h-8 rounded-full"
            style={{
              width: pildora.w,
              background: enTinta
                ? "color-mix(in srgb, var(--tinta) 8%, transparent)"
                : "rgba(255,255,255,.18)",
              transform: `translateX(${pildora.x}px)`,
              opacity: pildora.visible ? 1 : 0,
              transition:
                "transform 420ms cubic-bezier(.22,.7,.28,1), width 420ms cubic-bezier(.22,.7,.28,1), opacity 260ms ease",
            }}
          />
          {ENLACES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              data-href={e.href}
              aria-current={activo === e.href ? "page" : undefined}
              onPointerEnter={() => mover(e.href)}
              className="relative z-10 rounded-full px-3.5 py-2 text-[0.82rem] transition-opacity"
              style={{ opacity: activo === e.href ? 1 : 0.68 }}
            >
              {e.texto}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Iman fuerza={8}>
            <a
              href={enlaceReserva()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-11 items-center rounded-full border px-5 text-[0.78rem] uppercase tracking-[0.16em] transition-colors duration-700 sm:inline-flex"
              style={
                enTinta
                  ? { background: "var(--tinta)", color: "var(--papel)", borderColor: "var(--tinta)" }
                  : { background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.5)" }
              }
            >
              Hablamos
            </a>
          </Iman>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className="grid h-11 w-11 place-items-center md:hidden"
          >
            <span className="flex w-5 flex-col gap-[5px]">
              <span
                className="h-px w-full bg-current transition-transform duration-300"
                style={{
                  transform: abierto ? "translateY(3px) rotate(45deg)" : undefined,
                }}
              />
              <span
                className="h-px w-full bg-current transition-transform duration-300"
                style={{
                  transform: abierto ? "translateY(-3px) rotate(-45deg)" : undefined,
                }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Menú móvil: los enlaces entran escalonados desde la derecha. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 md:hidden"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 3.4rem)",
          pointerEvents: abierto ? "auto" : "none",
          visibility: abierto ? "visible" : "hidden",
        }}
      >
        <div
          className="h-full bg-[var(--papel)] px-6 pb-10 pt-6 transition-opacity duration-300"
          style={{ opacity: abierto ? 1 : 0 }}
        >
          {ENLACES.map((e, i) => (
            <Link
              key={e.href}
              href={e.href}
              onClick={() => setAbierto(false)}
              className="display flex min-h-16 items-center border-b border-[var(--tinta)]/10 text-[2rem]"
              style={{
                opacity: abierto ? 1 : 0,
                transform: abierto ? "none" : "translateX(28px)",
                transition: `opacity 420ms ease ${abierto ? 90 + i * 70 : 0}ms, transform 520ms cubic-bezier(.22,.7,.28,1) ${abierto ? 90 + i * 70 : 0}ms`,
              }}
            >
              {e.texto}
            </Link>
          ))}
          <a
            href={enlaceReserva()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAbierto(false)}
            className="mt-9 flex min-h-14 items-center justify-center rounded-full bg-[var(--tinta)] py-3.5 text-[0.82rem] uppercase tracking-[0.16em] text-[var(--papel)]"
            style={{
              opacity: abierto ? 1 : 0,
              transform: abierto ? "none" : "translateY(16px)",
              transition: `opacity 420ms ease ${abierto ? 440 : 0}ms, transform 520ms cubic-bezier(.22,.7,.28,1) ${abierto ? 440 : 0}ms`,
            }}
          >
            Hablamos 20 minutos por Meet
          </a>
        </div>
      </div>
    </header>
  );
}
