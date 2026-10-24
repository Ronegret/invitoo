"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import ProbadorColor from "@/components/color/ProbadorColor";
import { reescribirNombres } from "@/components/sitio/catalogo/reescribir";
import { fraseDatos } from "@/components/sitio/nombres";
import { PLANTILLAS } from "@/data/plantillas";
import { enlaceWhatsApp } from "@/lib/contacto";

/**
 * La barra de las invitaciones de muestra.
 *
 * Una muestra que no se puede contratar no vende nada. Quien llega aquí desde
 * la galería está a un toque de decir «quiero ésta», y ese toque tiene que
 * estar a mano en todo momento, no al final del scroll.
 *
 * Aparece cuando el visitante ya ha visto algo (400 px de scroll) para no
 * pisar la apertura, que es justo el momento que tiene que emocionar, y
 * solo al volver hacia arriba: mientras se baja leyendo se aparta, y nunca
 * tapa el formulario de confirmación ni el botón de música. Se puede
 * cerrar, y una vez cerrada no vuelve. Solo en las muestras: en una
 * invitación de verdad no existe.
 *
 * Además, en las muestras:
 *  · «Probadla con vuestros nombres»: lee `?nombres=Ana,Luis` (y
 *    `&fecha=…&fd=…`) o el mensaje `invitoo:nombres` de la portada, y
 *    reescribe la muestra sin recargarla.
 *  · El probador de colores de G3 (hoja inferior), en lugar de las bolitas.
 *  · Con `?vista=1` (la muestra dentro de un iframe de la web) la barra no
 *    se pinta: ya está la web alrededor. Solo escucha.
 */
const leerParams = () => {
  try {
    return window.location.search;
  } catch {
    return "";
  }
};
const nada = () => () => {};

export default function BarraDemo({
  nombre,
  slug,
}: {
  nombre: string;
  /** Ya no se pintan (lo hace el probador de colores); se acepta por compatibilidad. */
  variantes?: { id: string; nombre: string; acento: string; papel: string }[];
  slug?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [cerrada, setCerrada] = useState(false);
  const busqueda = useSyncExternalStore(nada, leerParams, () => "");
  const params = new URLSearchParams(busqueda);
  const enVista = params.get("vista") === "1";
  const plantilla = PLANTILLAS.find((p) => p.demo === slug);
  const [datos, setDatos] = useState("");

  // Los nombres (y la fecha) de la pareja, dentro de la muestra.
  useEffect(() => {
    if (!plantilla) return;
    const ejemplo: [string, string] = [plantilla.pareja[0], plantilla.pareja[1]];
    const aplicar = (a: string, b: string, fecha = "", fd = "") => {
      reescribirNombres(document, ejemplo, [a, b], fd, fecha);
      setDatos(fraseDatos({ a, b, fecha }));
    };
    // Solo cuando React ya ha hidratado la invitación (si se cambia el
    // texto antes, React ve otro HTML y la repinta entera) y en un momento
    // ocioso. Los mensajes seguidos (se teclea) se agrupan en uno por frame.
    let vivo = true;
    let pendiente: [string, string, string, string] | null = null;
    let hidratada = false;
    let raf = 0;
    const vaciar = () => {
      raf = 0;
      if (!vivo || !hidratada || !pendiente) return;
      const [a, b, f, fd] = pendiente;
      pendiente = null;
      aplicar(a, b, f, fd);
    };
    const pedir = (x: [string, string, string, string]) => {
      pendiente = x;
      if (!raf) raf = requestAnimationFrame(vaciar);
    };
    const ocioso = (fn: () => void) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(fn, { timeout: 1500 });
      else setTimeout(fn, 300);
    };
    let vueltas = 0;
    const esperar = () => {
      if (!vivo) return;
      const main = document.querySelector("main");
      const lista =
        document.readyState === "complete" &&
        !!main &&
        Object.keys(main).some((k) => k.startsWith("__reactFiber"));
      if (lista || vueltas++ > 80) {
        ocioso(() => {
          hidratada = true;
          vaciar();
          // Lo último que se haya escrito en la web de alrededor, si la hay.
          if (window.parent !== window) {
            try {
              window.parent.postMessage({ tipo: "invitoo:pide-nombres" }, window.location.origin);
            } catch {
              /* otro origen: nada */
            }
          }
        });
      } else window.setTimeout(esperar, 150);
    };
    esperar();

    const q = new URLSearchParams(window.location.search);
    const [a = "", b = ""] = (q.get("nombres") ?? "").split(",").map((x) => x.replace(/[<>]/g, "").slice(0, 24));
    const fecha = q.get("fecha") ?? "";
    const fd = q.get("fd") ?? "";
    if (a || b || fecha) pedir([a, b, fecha, fd]);

    const alMensaje = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.tipo !== "invitoo:nombres") return;
      const d = e.data as { a?: unknown; b?: unknown; fecha?: unknown; fd?: unknown };
      const s = (x: unknown, max: number) => (typeof x === "string" ? x.replace(/[<>]/g, "").slice(0, max) : "");
      pedir([s(d.a, 24), s(d.b, 24), s(d.fecha, 10), s(d.fd, 10)]);
    };
    window.addEventListener("message", alMensaje);
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("message", alMensaje);
    };
  }, [plantilla]);

  // Solo cuando no estorba: tras 400 px, al subir (al bajar se lee: se
  // aparta) y nunca encima del formulario de confirmación.
  useEffect(() => {
    let ultimo = window.scrollY;
    let enRsvp = false;
    let subiendo = false;
    const pintar = () => setVisible(window.scrollY > 400 && subiendo && !enRsvp);
    const mirar = () => {
      const y = window.scrollY;
      if (Math.abs(y - ultimo) > 6) {
        subiendo = y < ultimo;
        ultimo = y;
      }
      pintar();
    };
    const rsvp = document.getElementById("confirmar");
    const io = rsvp
      ? new IntersectionObserver(([e]) => {
          enRsvp = e.isIntersecting;
          pintar();
        })
      : null;
    if (rsvp) io!.observe(rsvp);
    window.addEventListener("scroll", mirar, { passive: true });
    return () => {
      window.removeEventListener("scroll", mirar);
      io?.disconnect();
    };
  }, []);

  if (cerrada || enVista) return null;

  const mensaje = [`Hola, hemos visto la plantilla «${nombre}» en invitoo.es y la queremos para nuestra boda.`, datos]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(120%)",
        transition: "opacity 420ms ease, transform 520ms cubic-bezier(.22,.7,.28,1)",
      }}
    >
      <div className="pointer-events-auto flex w-full max-w-[34rem] items-center gap-2.5 rounded-full border border-white/15 bg-[#12100e]/92 py-2.5 pl-4 pr-2 sm:gap-3 sm:pl-5 sm:pr-2.5 text-[#FAF8F5] shadow-[0_18px_40px_-16px_rgba(0,0,0,.6)] backdrop-blur-md">
        <div className="min-w-0 flex-1">
          {/* En móvil, con los tres colores, la etiqueta no cabe: se parte en
              cuatro líneas y la barra crece hasta pisar el botón de música.
              Solo el nombre; la etiqueta vuelve a partir de 640 px. */}
          <p className="hidden truncate text-[1rem] opacity-70 sm:block">
            Plantilla de muestra
          </p>
          <p className="display truncate text-[1.05rem] leading-tight sm:text-[1.15rem]">
            {nombre}
          </p>
        </div>

        {/* Los colores, ahí mismo: el probador de G3 en su hoja inferior.
            En móvil, solo las tres muestras (el texto no cabe junto al CTA). */}
        {plantilla && slug && (
          <ProbadorColor
            slug={slug}
            plantilla={plantilla.id}
            modo="compacto"
            className="shrink-0 !border-white/25 !text-[#FAF8F5] max-sm:!px-2 max-sm:[&>span:last-child]:sr-only"
          />
        )}

        <Link
          href="/plantillas"
          className="hidden min-h-12 shrink-0 items-center rounded-full px-3 py-2 text-[1rem] opacity-75 transition-opacity hover:opacity-100 sm:inline-flex"
        >
          Otras
        </Link>

        <a
          href={enlaceWhatsApp(mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-[#FAF8F5] px-4 text-[1rem] text-[#12100e] transition-transform duration-200 hover:scale-[1.02] sm:px-5"
        >
          Quiero ésta
        </a>

        <button
          type="button"
          onClick={() => setCerrada(true)}
          aria-label="Cerrar"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[1.1rem] leading-none opacity-45 transition-opacity hover:opacity-90"
        >
          ×
        </button>
      </div>
    </div>
  );
}
