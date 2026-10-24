"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Aviso } from "@/lib/avisos/tipos";
import { TEXTO_BLOQUEADO } from "@/lib/planes-boda";
import Campana from "./Campana";
import IconoPanel, { type IconoPanelId } from "./IconosPanel";
import { ui } from "./estilos";

/**
 * La navegación del panel. Una sola lista de destinos, dos formas:
 *  · móvil: barra inferior con Hoy, Invitados, Deseos, En directo y «Más»;
 *  · escritorio: barra lateral con todo.
 * Arriba (móvil) o junto al nombre (escritorio): la campana de Avisos.
 * «Pedir un cambio» va aparte, siempre a mano: es como nos piden las cosas.
 * Isla de cliente solo para marcar la sección activa y abrir «Más».
 */

type Destino = { ruta: string; texto: string; icono: IconoPanelId; abajo: boolean };

const DESTINOS: Destino[] = [
  { ruta: "", texto: "Hoy", icono: "hoy", abajo: true },
  { ruta: "/invitados", texto: "Invitados", icono: "invitados", abajo: true },
  { ruta: "/deseos", texto: "Libro de buenos deseos", icono: "deseos", abajo: true },
  { ruta: "/directo", texto: "En directo", icono: "directo", abajo: true },
  { ruta: "/diseno", texto: "Diseño", icono: "diseno", abajo: false },
  { ruta: "/avisos", texto: "Avisos", icono: "campana", abajo: false },
  { ruta: "/cuenta", texto: "Cuenta", icono: "cuenta", abajo: false },
];

/** Texto corto para la barra inferior, donde caben unos 9 caracteres. */
const CORTO: Record<string, string> = { "/deseos": "Deseos" };

export default function NavPanel({
  slug,
  pareja,
  pendientes,
  publicada,
  salir,
  avisos,
  noLeidos,
  ahora,
  directoBloqueado,
  cambiosAbiertos,
}: {
  slug: string;
  pareja: string;
  /** Deseos sin leer: insignia en «Libro de buenos deseos». */
  pendientes: number;
  publicada: boolean;
  salir: () => Promise<void>;
  avisos: Aviso[];
  noLeidos: number;
  ahora: number;
  /** En directo no contratado: candado junto al nombre. */
  directoBloqueado: boolean;
  /** Solicitudes de cambio sin terminar (insignia en «Pedir un cambio»). */
  cambiosAbiertos: number;
}) {
  const ruta = usePathname();
  const base = `/panel/${slug}`;
  const [abierta, setAbierta] = useState(false);
  const hoja = useRef<HTMLDivElement>(null);

  const activa = (d: Destino) =>
    d.ruta === "" ? ruta === base : ruta === base + d.ruta || ruta.startsWith(`${base + d.ruta}/`);

  // La hoja se cierra al navegar y con Escape.
  const [rutaPrevia, setRutaPrevia] = useState(ruta);
  if (rutaPrevia !== ruta) {
    setRutaPrevia(ruta);
    setAbierta(false);
  }
  useEffect(() => {
    if (!abierta) return;
    hoja.current?.querySelector<HTMLElement>("a,button")?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierta]);

  const enlaceLateral = (d: Destino) => (
    <li key={d.ruta}>
      <Link
        href={base + d.ruta}
        aria-current={activa(d) ? "page" : undefined}
        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-[0.98rem] transition-colors aria-[current=page]:bg-[var(--acento-claro)] aria-[current=page]:font-medium aria-[current=page]:text-[var(--acento)] hover:bg-black/[0.03] ${ui.foco}`}
      >
        <IconoPanel id={d.icono} />
        <span className="flex-1">{d.texto}</span>
        {d.ruta === "/deseos" && pendientes > 0 && <Insignia n={pendientes} />}
        {d.ruta === "/directo" && directoBloqueado && <Candado />}
        {d.ruta === "/avisos" && noLeidos > 0 && <Insignia n={noLeidos} texto="nuevos" />}
      </Link>
    </li>
  );

  const rutaCambios = `${base}/cambios`;
  const enCambios = ruta === rutaCambios;
  const enlaceCambios = (
    <Link
      href={rutaCambios}
      aria-current={enCambios ? "page" : undefined}
      className={`flex min-h-12 items-center gap-3 rounded-xl border border-[var(--acento)]/25 px-3 text-[0.98rem] text-[var(--acento)] transition-colors hover:bg-[var(--acento-claro)] aria-[current=page]:bg-[var(--acento-claro)] aria-[current=page]:font-medium ${ui.foco}`}
    >
      <IconoPanel id="cambio" />
      <span className="flex-1">Pedir un cambio</span>
      {cambiosAbiertos > 0 && <Insignia n={cambiosAbiertos} texto="en marcha" />}
    </Link>
  );

  const masActiva = DESTINOS.some((d) => !d.abajo && activa(d)) || enCambios;

  return (
    <>
      {/* ── escritorio */}
      <nav
        aria-label="Secciones del panel"
        className="sticky top-0 hidden h-dvh w-[16.5rem] shrink-0 flex-col border-r border-[var(--linea)] px-4 py-6 lg:flex"
      >
        <div className="flex items-start gap-1">
          <Link href={base} className={`min-w-0 flex-1 rounded-xl px-3 ${ui.foco}`}>
            <span className="display block text-[1.35rem] leading-tight">{pareja}</span>
            <span className={`mt-1 block text-[0.85rem] ${ui.suave}`}>Vuestra boda en Invitoo</span>
          </Link>
          <Campana slug={slug} avisos={avisos} noLeidos={noLeidos} ahora={ahora} className="-mr-2 -mt-1" />
        </div>
        <ul className="mt-8 flex flex-col gap-1">{DESTINOS.map(enlaceLateral)}</ul>
        <div className="mt-4">{enlaceCambios}</div>
        <div className="mt-auto flex flex-col gap-1 border-t border-[var(--linea)] pt-4">
          {publicada && (
            <a
              href={`/i/${slug}`}
              target="_blank"
              rel="noopener"
              className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-[0.95rem] hover:bg-black/[0.03] ${ui.foco}`}
            >
              <IconoPanel id="ojo" /> Ver la invitación
              <span className="sr-only">(se abre en otra pestaña)</span>
            </a>
          )}
          <form action={salir}>
            <button
              type="submit"
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.95rem] text-[var(--suave)] hover:bg-black/[0.03] ${ui.foco}`}
            >
              <IconoPanel id="salir" /> Salir
            </button>
          </form>
        </div>
      </nav>

      {/* ── móvil: arriba, el nombre, «Pedir un cambio» y la campana */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--linea)] bg-[var(--papel)]/95 pl-4 pr-2 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <Link href={base} className={`min-w-0 flex-1 truncate py-3 display text-[1.15rem] leading-tight ${ui.foco}`}>
          {pareja}
        </Link>
        <Link
          href={rutaCambios}
          aria-label="Pedir un cambio"
          className={`relative grid h-12 w-12 place-items-center rounded-full text-[var(--acento)] hover:bg-[var(--acento-claro)] ${ui.foco}`}
        >
          <IconoPanel id="cambio" />
        </Link>
        <Campana slug={slug} avisos={avisos} noLeidos={noLeidos} ahora={ahora} />
      </header>

      {/* ── móvil */}
      <nav
        aria-label="Secciones del panel"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--linea)] bg-[var(--papel)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-[36rem] grid-cols-5">
          {DESTINOS.filter((d) => d.abajo).map((d) => (
            <li key={d.ruta}>
              <Link
                href={base + d.ruta}
                aria-current={activa(d) ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.72rem] text-[var(--suave)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--acento)] ${ui.foco}`}
              >
                <span className="relative">
                  <IconoPanel id={d.icono} />
                  {d.ruta === "/deseos" && pendientes > 0 && (
                    <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-[var(--acento)] ring-2 ring-[var(--papel)]" aria-hidden="true" />
                  )}
                  {d.ruta === "/directo" && directoBloqueado && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--papel)]" aria-hidden="true">
                      <IconoPanel id="candado" size={13} />
                    </span>
                  )}
                </span>
                {CORTO[d.ruta] ?? d.texto}
                {d.ruta === "/deseos" && pendientes > 0 && <span className="sr-only"> ({pendientes} sin leer)</span>}
                {d.ruta === "/directo" && directoBloqueado && <span className="sr-only"> ({TEXTO_BLOQUEADO})</span>}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-expanded={abierta}
              aria-controls="hoja-mas"
              onClick={() => setAbierta((x) => !x)}
              className={`relative flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[0.72rem] ${masActiva || abierta ? "font-semibold text-[var(--acento)]" : "text-[var(--suave)]"} ${ui.foco}`}
            >
              <IconoPanel id="mas" />
              Más
            </button>
          </li>
        </ul>
      </nav>

      {abierta && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar el menú"
            onClick={() => setAbierta(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div
            id="hoja-mas"
            ref={hoja}
            role="dialog"
            aria-modal="true"
            aria-label="Más secciones"
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[var(--papel)] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] motion-safe:animate-[subir_220ms_ease-out]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15" aria-hidden="true" />
            <ul className="flex flex-col gap-1">
              <li className="mb-2">{enlaceCambios}</li>
              {DESTINOS.filter((d) => !d.abajo).map(enlaceLateral)}
              {publicada && (
                <li>
                  <a
                    href={`/i/${slug}`}
                    target="_blank"
                    rel="noopener"
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-[0.98rem] ${ui.foco}`}
                  >
                    <IconoPanel id="ojo" /> Ver la invitación
                    <span className="sr-only">(se abre en otra pestaña)</span>
                  </a>
                </li>
              )}
              <li>
                <form action={salir}>
                  <button
                    type="submit"
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.98rem] text-[var(--suave)] ${ui.foco}`}
                  >
                    <IconoPanel id="salir" /> Salir
                  </button>
                </form>
              </li>
            </ul>
          </div>
          <style>{`@keyframes subir{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}`}</style>
        </div>
      )}
    </>
  );
}

function Insignia({ n, texto = "sin leer" }: { n: number; texto?: string }) {
  return (
    <span className="min-w-6 rounded-full bg-[var(--acento)] px-1.5 text-center text-[0.75rem] font-semibold leading-6 text-white tabular-nums">
      {n}
      <span className="sr-only"> {texto}</span>
    </span>
  );
}

function Candado() {
  return (
    <span className="text-[var(--suave)]" title={TEXTO_BLOQUEADO}>
      <IconoPanel id="candado" size={18} />
      <span className="sr-only">{TEXTO_BLOQUEADO}</span>
    </span>
  );
}
