"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal, flushSync } from "react-dom";
import ProbadorColor from "@/components/color/ProbadorColor";
import { conEjemplo, consultaNombres, fechaBonita, fraseDatos, useNombres } from "@/components/sitio/nombres";
import { enLetra } from "@/data/sitio";
import { enlaceWhatsApp } from "@/lib/contacto";
import Tarjetas3D from "@/components/tresd/Tarjetas3D";
import MiniPortada from "./MiniPortada";
import { FAMILIA, VARIABLES_PLANTILLAS } from "./fuentesPlantillas";
import { reescribirNombres } from "./reescribir";
import s from "./catalogo.module.css";

/**
 * El catálogo vivo: las nueve invitaciones como un ARCO que se pasa con el
 * dedo (un CircularGallery con scroll nativo: las tarjetas giran sobre su
 * eje según su sitio en el carril, con `animation-timeline: view(inline)`,
 * sin secuestrar el scroll), cada una pintada en HTML con VUESTROS nombres.
 *
 * · Arriba (en /plantillas): «Vuestros nombres» y los filtros por estilo.
 * · Cada tarjeta lleva sus colores de catálogo: tocar uno la repinta.
 * · Al tocar la tarjeta, se abre A PANTALLA COMPLETA con una View
 *   Transition (la tarjeta crece hasta ser el móvil), con la invitación de
 *   verdad dentro, el probador de colores de G3 y «La queremos así», que
 *   abre WhatsApp con el mensaje escrito.
 *
 * Sin JavaScript: cada tarjeta es un enlace a la invitación de muestra.
 */

export type FichaCatalogo = {
  id: string;
  nombre: string;
  demo: string;
  etiqueta: string;
  gesto: string;
  para: string;
  pareja: [string, string, string];
  fecha: string;
  /** La fecha de la muestra, en ISO, para reescribirla dentro de la invitación. */
  fechaIso: string;
  estilos: string[];
  colores: { id: string; nombre: string; papel: string; tinta: string; acento: string }[];
};

type Filtro = { id: string; nombre: string };

const nada = () => () => {};

function quieto() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Una transición de vista si el navegador sabe y nadie pide calma. */
function conTransicion(cambio: () => void) {
  const d = document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
  if (!d.startViewTransition || quieto()) {
    cambio();
    return null;
  }
  return d.startViewTransition(() => flushSync(cambio));
}

export default function CatalogoVivo({
  fichas,
  filtros = [],
  conCampo = false,
  titulo,
}: {
  fichas: FichaCatalogo[];
  filtros?: Filtro[];
  /** Con «Vuestros nombres» encima (en /plantillas). */
  conCampo?: boolean;
  /** Nombre accesible del carrusel. */
  titulo: string;
}) {
  const [nombres, poner] = useNombres();
  const [filtro, setFiltro] = useState("todas");
  const [colorDe, setColorDe] = useState<Record<string, number>>({});
  const [abierta, setAbierta] = useState<string | null>(null);
  const [actual, setActual] = useState(0);
  const [tresd, setTresd] = useState(false);
  const carril = useRef<HTMLUListElement>(null);
  const id = useId();

  const visibles = useMemo(
    () => (filtro === "todas" ? fichas : fichas.filter((f) => f.estilos.includes(filtro))),
    [fichas, filtro],
  );
  const filtrosUsados = filtros.filter((f) => fichas.some((x) => x.estilos.includes(f.id)));

  /* ───── Cuál está en el centro (para el contador y las flechas) ───── */
  useEffect(() => {
    const ul = carril.current;
    if (!ul) return;
    let raf = 0;
    const mirar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const centro = ul.scrollLeft + ul.clientWidth / 2;
        let mejor = 0;
        let dist = Infinity;
        Array.from(ul.children).forEach((li, i) => {
          const el = li as HTMLElement;
          const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centro);
          if (d < dist) {
            dist = d;
            mejor = i;
          }
        });
        setActual(mejor);
      });
    };
    mirar();
    ul.addEventListener("scroll", mirar, { passive: true });
    window.addEventListener("resize", mirar);
    return () => {
      cancelAnimationFrame(raf);
      ul.removeEventListener("scroll", mirar);
      window.removeEventListener("resize", mirar);
    };
  }, [visibles.length]);

  const ir = useCallback((i: number) => {
    const ul = carril.current;
    const li = ul?.children[i] as HTMLElement | undefined;
    if (!ul || !li) return;
    ul.scrollTo({
      left: li.offsetLeft + li.offsetWidth / 2 - ul.clientWidth / 2,
      behavior: quieto() ? "auto" : "smooth",
    });
  }, []);

  /* En escritorio, el abanico arranca abierto: centrado en la del medio. */
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const ul = carril.current;
    const li = ul?.children[Math.floor(fichas.length / 2)] as HTMLElement | undefined;
    if (ul && li) ul.scrollLeft = li.offsetLeft + li.offsetWidth / 2 - ul.clientWidth / 2;
  }, [fichas.length]);

  const elegirFiltro = (f: string) => {
    conTransicion(() => setFiltro(f));
    carril.current?.scrollTo({ left: 0 });
  };

  /* ───── Abrir y cerrar con View Transition ───── */
  const abrir = (ficha: string, origen: HTMLElement) => {
    // Con las cartulinas 3D, la portada HTML está oculta: para la View
    // Transition se enseña la de esta tarjeta (es la foto de salida).
    origen.dataset.ver = "1";
    origen.style.viewTransitionName = "plantilla-abierta";
    const t = conTransicion(() => {
      origen.style.viewTransitionName = "";
      setAbierta(ficha);
    });
    if (!t) origen.style.viewTransitionName = "";
  };

  const cerrar = () => {
    const quien = abierta;
    const t = conTransicion(() => {
      setAbierta(null);
      const el = document.querySelector<HTMLElement>(`[data-portada="${quien}"]`);
      if (el) el.style.viewTransitionName = "plantilla-abierta";
    });
    const limpiar = () => {
      const el = document.querySelector<HTMLElement>(`[data-portada="${quien}"]`);
      if (el) {
        el.style.viewTransitionName = "";
        delete el.dataset.ver;
      }
      document.querySelector<HTMLElement>(`[data-abre="${quien}"]`)?.focus({ preventScroll: true });
    };
    if (t) t.finished.finally(limpiar);
    else limpiar();
  };

  const ficha = fichas.find((f) => f.id === abierta) ?? null;

  const cartas3d = useMemo(
    () =>
      visibles.map((f) => {
        const n = conEjemplo(nombres, f.pareja);
        const c = f.colores[colorDe[f.id] ?? 0] ?? f.colores[0];
        return {
          id: f.id,
          a: n.a,
          b: n.b,
          fecha: fechaBonita(nombres.fecha) || f.fecha,
          papel: c.papel,
          tinta: c.tinta,
          acento: c.acento,
          letra: FAMILIA[f.id] ?? "var(--display)",
        };
      }),
    [visibles, nombres, colorDe],
  );

  return (
    <div className={`${s.catalogo} ${VARIABLES_PLANTILLAS}`}>
      {(conCampo || filtrosUsados.length > 0) && (
        <div className={s.mandos}>
          {conCampo && (
            <fieldset className={s.campo}>
              <legend className={s.leyenda}>Vuestros nombres</legend>
              <div className={s.fila}>
                <label className={s.etiqueta}>
                  <span className="sr-only">Un nombre</span>
                  <input
                    className={s.entrada}
                    value={nombres.a}
                    onChange={(e) => poner({ a: e.target.value })}
                    placeholder="Laura"
                    autoComplete="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    maxLength={24}
                    enterKeyHint="next"
                  />
                </label>
                <span className={s.y} aria-hidden>
                  &amp;
                </span>
                <label className={s.etiqueta}>
                  <span className="sr-only">El otro nombre</span>
                  <input
                    className={s.entrada}
                    value={nombres.b}
                    onChange={(e) => poner({ b: e.target.value })}
                    placeholder="Rubén"
                    autoComplete="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    maxLength={24}
                    enterKeyHint="done"
                  />
                </label>
              </div>
              <label className={s.fechaFila}>
                <span className={s.fechaEtiqueta}>Y la fecha</span>
                <input
                  type="date"
                  className={s.fecha}
                  value={nombres.fecha}
                  onChange={(e) => poner({ fecha: e.target.value })}
                  min="2025-01-01"
                  max="2035-12-31"
                />
              </label>
              <p className={s.ayuda} aria-live="polite">
                {nombres.a || nombres.b || nombres.fecha
                  ? `Las ${enLetra(fichas.length)} ya lo dicen. Nada sale de este navegador.`
                  : `Escribidlos y las ${enLetra(fichas.length)} se reescriben.`}
              </p>
            </fieldset>
          )}

          {filtrosUsados.length > 0 && (
            <div className={s.filtros} role="group" aria-label="Filtrar por estilo">
              {[{ id: "todas", nombre: "Todas" }, ...filtrosUsados].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={s.chip}
                  aria-pressed={filtro === f.id}
                  onClick={() => elegirFiltro(f.id)}
                >
                  {f.nombre}
                  {f.id !== "todas" && (
                    <span className={s.cuenta}>{fichas.filter((x) => x.estilos.includes(f.id)).length}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={s.escenario} data-tresd={tresd ? "1" : undefined}>
        {/* Las cartulinas 3D, detrás del carril (X1). */}
        <Tarjetas3D
          carril={carril}
          cartas={cartas3d}
          onListo={() => setTresd(true)}
          onFallo={() => setTresd(false)}
        />
        <ul
          ref={carril}
          className={s.carril}
          aria-label={titulo}
          data-pocas={visibles.length < 3 || undefined}
          data-cursor="arrastrar"
          tabIndex={-1}
        >
          {visibles.map((f, i) => {
            const n = conEjemplo(nombres, f.pareja);
            const c = f.colores[colorDe[f.id] ?? 0] ?? f.colores[0];
            const q = consultaNombres(nombres.a, nombres.b, nombres.fecha, f.fechaIso);
            return (
              <li key={f.id} className={s.tarjeta} aria-label={`${f.nombre}, ${i + 1} de ${visibles.length}`}>
                <a
                  href={`/i/${f.demo}${q ? `?${q}` : ""}`}
                  data-abre={f.id}
                  data-cursor="ver"
                  className={s.abrir}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                    e.preventDefault();
                    abrir(f.id, e.currentTarget.querySelector<HTMLElement>("[data-portada]") ?? e.currentTarget);
                  }}
                >
                  <span className={s.marco} data-portada={f.id}>
                    <MiniPortada id={f.id} a={n.a} b={n.b} fecha={fechaBonita(nombres.fecha) || f.fecha} colores={c} />
                  </span>
                  <span className={s.pie}>
                    <span className={s.nombre}>{f.nombre}</span>
                    <span className={s.etiquetaTarjeta}>{f.etiqueta}</span>
                  </span>
                  <span className="sr-only">: abrirla a pantalla completa</span>
                </a>
                {f.colores.length > 1 && (
                  <div className={s.colores} role="group" aria-label={`Colores de ${f.nombre}`}>
                    {f.colores.map((v, j) => (
                      <button
                        key={v.id}
                        type="button"
                        className={s.color}
                        aria-pressed={(colorDe[f.id] ?? 0) === j}
                        aria-label={v.nombre}
                        title={v.nombre}
                        onClick={() => setColorDe((m) => ({ ...m, [f.id]: j }))}
                      >
                        <span
                          aria-hidden
                          style={{ background: `linear-gradient(135deg, ${v.papel} 0 50%, ${v.acento} 50% 100%)` }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className={s.navegar}>
          <button
            type="button"
            className={s.flecha}
            onClick={() => ir(Math.max(0, actual - 1))}
            disabled={actual === 0}
            aria-label="Plantilla anterior"
            aria-controls={id}
          >
            <Flecha izquierda />
          </button>
          <p className={s.contador} id={id} aria-live="polite">
            <span>{visibles[actual]?.nombre}</span>
            <span className={s.numero}>
              {actual + 1} / {visibles.length}
            </span>
          </p>
          <button
            type="button"
            className={s.flecha}
            onClick={() => ir(Math.min(visibles.length - 1, actual + 1))}
            disabled={actual >= visibles.length - 1}
            aria-label="Plantilla siguiente"
            aria-controls={id}
          >
            <Flecha />
          </button>
        </div>
      </div>

      {ficha && (
        <VistaCompleta
          ficha={ficha}
          color={ficha.colores[colorDe[ficha.id] ?? 0] ?? ficha.colores[0]}
          alCerrar={cerrar}
          alCambiar={(otra) => conTransicion(() => setAbierta(otra))}
          fichas={visibles.some((v) => v.id === ficha.id) ? visibles : fichas}
        />
      )}
    </div>
  );
}

/* ───────────────────────── La vista a pantalla completa ───────────────────────── */

function VistaCompleta({
  ficha,
  color,
  fichas,
  alCerrar,
  alCambiar,
}: {
  ficha: FichaCatalogo;
  color: FichaCatalogo["colores"][number];
  fichas: FichaCatalogo[];
  alCerrar: () => void;
  alCambiar: (id: string) => void;
}) {
  const montado = useSyncExternalStore(nada, () => true, () => false);
  const [nombres] = useNombres();
  const n = conEjemplo(nombres, ficha.pareja);
  const dialogo = useRef<HTMLDivElement>(null);
  const marco = useRef<HTMLIFrameElement>(null);
  const cerrarBoton = useRef<HTMLButtonElement>(null);
  const pantalla = useRef<HTMLDivElement>(null);
  const [paleta, setPaleta] = useState<string>(color.nombre);
  const [cargada, setCargada] = useState(false);
  const idTitulo = useId();

  const i = fichas.findIndex((f) => f.id === ficha.id);
  const anterior = fichas[(i - 1 + fichas.length) % fichas.length];
  const siguiente = fichas[(i + 1) % fichas.length];

  // La URL se fija al abrir cada plantilla; los nombres van por mensaje.
  const src = useMemo(() => {
    const q = new URLSearchParams({ vista: "1" });
    const elegido = ficha.colores.indexOf(color);
    if (elegido > 0) q.set("c", color.id);
    return `/i/${ficha.demo}?${q}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de plantilla
  }, [ficha.demo]);

  /* Modal de verdad: lo de fuera inerte, el foco dentro, Escape cierra. */
  const cerrarRef = useRef(alCerrar);
  useEffect(() => {
    cerrarRef.current = alCerrar;
  });
  useEffect(() => {
    const html = document.documentElement;
    const raiz = document.querySelector<HTMLElement>(".sitio-raiz");
    const antes = html.style.overflow;
    html.style.overflow = "hidden";
    html.dataset.vista = "abierta";
    raiz?.setAttribute("inert", "");
    const t = window.setTimeout(() => cerrarBoton.current?.focus({ preventScroll: true }), 30);

    const tecla = (e: KeyboardEvent) => {
      // Si la hoja de colores está abierta, Escape es suyo.
      if (e.key === "Escape" && !html.dataset.hojaColor) {
        e.preventDefault();
        cerrarRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const zonas = [dialogo.current, ...Array.from(document.querySelectorAll<HTMLElement>('[role="region"][aria-label^="Probar colores"]'))];
      const enfocables = zonas
        .filter(Boolean)
        .flatMap((z) =>
          Array.from(
            z!.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'),
          ),
        )
        .filter((x) => x.offsetParent !== null);
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
    return () => {
      window.clearTimeout(t);
      html.style.overflow = antes;
      delete html.dataset.vista;
      raiz?.removeAttribute("inert");
      document.removeEventListener("keydown", tecla);
    };
  }, []);

  /* La invitación se pinta a 390 px (un móvil de verdad) y se escala. */
  useEffect(() => {
    const el = pantalla.current;
    if (!el) return;
    const medir = () => el.style.setProperty("--escala", String(el.clientWidth / 390));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [montado]);

  /* Al cambiar de plantilla, vuelve a esperar a que cargue. */
  const [demoVista, setDemoVista] = useState(ficha.demo);
  if (demoVista !== ficha.demo) {
    setDemoVista(ficha.demo);
    setCargada(false);
  }

  /* Los nombres, dentro de la invitación de verdad (mismo origen). */
  // Se espera a que la invitación haya hidratado (si no, React vería otros
  // nombres en el HTML y la repintaría), y se repasa una vez más por si la
  // apertura o un bloque perezoso pintan los nombres más tarde.
  useEffect(() => {
    if (!cargada) return;
    const pasar = () => {
      try {
        const doc = marco.current?.contentDocument;
        if (doc) reescribirNombres(doc, [ficha.pareja[0], ficha.pareja[1]], [n.a, n.b], ficha.fechaIso, nombres.fecha);
      } catch {
        /* el iframe se ha ido */
      }
    };
    pasar();
    const t = window.setTimeout(pasar, 1400);
    return () => window.clearTimeout(t);
  }, [cargada, n.a, n.b, ficha.pareja, ficha.fechaIso, nombres.fecha]);

  const mensaje = [
    `Hola, hemos visto la plantilla «${ficha.nombre}» en invitoo.es${
      paleta ? ` con los colores «${paleta}»` : ""
    } y la queremos así para nuestra boda.`,
    fraseDatos(nombres),
  ]
    .filter(Boolean)
    .join(" ");
  const q = consultaNombres(nombres.a, nombres.b, nombres.fecha, ficha.fechaIso);

  if (!montado) return null;

  return createPortal(
    <div
      ref={dialogo}
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
      className={`${s.vista} ${VARIABLES_PLANTILLAS}`}
      style={{ "--v-papel": color.papel, "--v-tinta": color.tinta } as React.CSSProperties}
    >
      <div className={s.vistaBarra}>
        <button ref={cerrarBoton} type="button" className={s.cerrar} onClick={alCerrar}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span>Volver</span>
        </button>
        <div className={s.vistaTitulo}>
          <p className={s.vistaEtiqueta}>{ficha.etiqueta}</p>
          <h2 id={idTitulo} className={s.vistaNombre}>
            {ficha.nombre}
          </h2>
        </div>
        <div className={s.pasar}>
          <button
            type="button"
            className={s.flecha}
            onClick={() => alCambiar(anterior.id)}
            aria-label={`Anterior: ${anterior.nombre}`}
          >
            <Flecha izquierda />
          </button>
          <button
            type="button"
            className={s.flecha}
            onClick={() => alCambiar(siguiente.id)}
            aria-label={`Siguiente: ${siguiente.nombre}`}
          >
            <Flecha />
          </button>
        </div>
      </div>

      <div className={s.vistaCuerpo}>
        <div className={s.telefono} style={{ viewTransitionName: "plantilla-abierta" }}>
          <span className={s.isla} aria-hidden />
          <div ref={pantalla} className={s.pantalla}>
            <MiniPortada id={ficha.id} a={n.a} b={n.b} fecha={fechaBonita(nombres.fecha) || ficha.fecha} colores={color} className={s.mientras} />
            <iframe
              key={ficha.demo}
              ref={marco}
              src={src}
              title={`Invitación de muestra ${ficha.nombre}, con ${n.a} y ${n.b}`}
              className={s.iframe}
              data-cargada={cargada || undefined}
              onLoad={(e) => {
                // Hidratada = React ya ha colgado su fibra del <main>.
                const f = e.currentTarget;
                let vueltas = 0;
                const mirar = () => {
                  let listo = vueltas++ > 60;
                  try {
                    const m = f.contentDocument?.querySelector("main");
                    listo ||= !!m && Object.keys(m).some((k) => k.startsWith("__reactFiber"));
                  } catch {
                    listo = true;
                  }
                  if (listo) window.setTimeout(() => setCargada(true), 250);
                  else window.setTimeout(mirar, 150);
                };
                mirar();
              }}
            />
          </div>
        </div>

        <div className={s.info}>
          <p className={s.gesto}>{ficha.gesto}</p>
          <p className={s.para}>{ficha.para}</p>
          <div className={s.acciones}>
            <ProbadorColor
              key={ficha.id}
              slug={ficha.demo}
              plantilla={ficha.id}
              modo="compacto"
              destino={marco}
              onCambio={(_, info) => setPaleta(info.nombre)}
              className={s.probar}
            />
            <a
              href={enlaceWhatsApp(mensaje)}
              target="_blank"
              rel="noopener noreferrer"
              className={s.queremos}
              data-petalos
            >
              <span>La queremos así</span>
              <span className={s.circulo} aria-hidden>
                <Flecha diagonal />
              </span>
              <span className="sr-only"> (abre WhatsApp en otra pestaña)</span>
            </a>
          </div>
          <a href={`/i/${ficha.demo}${q ? `?${q}` : ""}`} className={s.entera}>
            Abrirla entera, como un invitado
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Flecha({ izquierda = false, diagonal = false }: { izquierda?: boolean; diagonal?: boolean }) {
  if (diagonal)
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={izquierda ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
