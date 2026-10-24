"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Iphone from "@/components/sitio/telefono/Iphone";
import { useNombres } from "@/components/sitio/nombres";
import { enLetra } from "@/data/sitio";
import { VistaCompleta, conTransicion, type FichaCatalogo } from "./CatalogoVivo";
import { VARIABLES_PLANTILLAS } from "./fuentesPlantillas";
import c from "./catalogo.module.css";
import s from "./rejilla.module.css";

/**
 * El catálogo en rejilla (W2).
 *
 * Antes era un arco 3D que se pasaba de una en una: precioso, pero para
 * ELEGIR entre 28 había que pasar 28 veces, y sin WebGL quedaba un hueco.
 * Ahora:
 *  · Arriba, las cinco FAMILIAS de estilo (de la casa, época, naturaleza,
 *    música y estilo de vida) y, debajo, el tipo de boda (campo, mar…).
 *  · Las fichas, todas en el mismo teléfono y al mismo tamaño, con el
 *    póster real. Al pasar el ratón (o con ▶ en táctil) suena su apertura.
 *  · Al tocar, la VISTA RÁPIDA: la invitación de verdad a pantalla
 *    completa, con vuestros nombres, sus colores y «La queremos así».
 *
 * Sin JavaScript: cada ficha es un enlace a su invitación de muestra.
 * El filtro se refleja en la URL (`?estilo=musica`), para poder enlazarlo.
 */

type Familia = { id: string; nombre: string; texto: string };
type Lugar = { id: string; nombre: string };

export default function CatalogoRejilla({
  fichas,
  familias,
  lugares = [],
  limite,
  conCampo = false,
}: {
  fichas: FichaCatalogo[];
  familias: Familia[];
  lugares?: Lugar[];
  /** En la portada: cuántas se enseñan (el resto, en /plantillas). */
  limite?: number;
  conCampo?: boolean;
}) {
  const [nombres, poner] = useNombres();
  const [familia, setFamilia] = useState("todas");
  const [lugar, setLugar] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  /* El filtro viene (y va) en la URL. */
  useEffect(() => {
    if (limite) return;
    const q = new URLSearchParams(window.location.search);
    const f = q.get("estilo");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una vez la URL al montar
    if (f && familias.some((x) => x.id === f)) setFamilia(f);
  }, [familias, limite]);

  const elegir = (f: string) => {
    conTransicion(() => setFamilia(f));
    if (!limite) {
      const url = new URL(window.location.href);
      if (f === "todas") url.searchParams.delete("estilo");
      else url.searchParams.set("estilo", f);
      window.history.replaceState(null, "", url);
    }
  };

  const visibles = useMemo(() => {
    let l = familia === "todas" ? fichas : fichas.filter((f) => f.familia === familia);
    if (lugar) l = l.filter((f) => f.estilos.includes(lugar));
    if (limite && familia === "todas" && !lugar) {
      // En la portada, una muestra variada: dos de cada familia.
      const porFamilia = new Map<string, number>();
      l = l.filter((f) => {
        const n = porFamilia.get(f.familia ?? "") ?? 0;
        porFamilia.set(f.familia ?? "", n + 1);
        return n < (f.familia === "casa" ? 4 : 1);
      });
    }
    return limite ? l.slice(0, limite) : l;
  }, [fichas, familia, lugar, limite]);

  const total = familia === "todas" ? fichas.length : fichas.filter((f) => f.familia === familia).length;
  const familiaActual = familias.find((f) => f.id === familia);

  /* Abrir y cerrar la vista rápida (la tarjeta crece hasta el teléfono). */
  const abrir = (id: string, origen: HTMLElement) => {
    origen.style.viewTransitionName = "plantilla-abierta";
    const t = conTransicion(() => {
      origen.style.viewTransitionName = "";
      setAbierta(id);
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
      if (el) el.style.viewTransitionName = "";
      document.querySelector<HTMLElement>(`[data-abre="${quien}"]`)?.focus({ preventScroll: true });
    };
    if (t) t.finished.finally(limpiar);
    else limpiar();
  };

  const ficha = fichas.find((f) => f.id === abierta) ?? null;

  return (
    <div className={VARIABLES_PLANTILLAS}>
      {conCampo && (
        <fieldset className={c.campo} style={{ maxWidth: "30rem", marginBottom: 28 }}>
          <legend className={c.leyenda}>Probadlas con vuestros nombres</legend>
          <div className={c.fila}>
            <label className={c.etiqueta}>
              <span className="sr-only">Un nombre</span>
              <input
                className={c.entrada}
                value={nombres.a}
                onChange={(e) => poner({ a: e.target.value })}
                placeholder="Laura"
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                maxLength={24}
              />
            </label>
            <span className={c.y} aria-hidden>
              &amp;
            </span>
            <label className={c.etiqueta}>
              <span className="sr-only">El otro nombre</span>
              <input
                className={c.entrada}
                value={nombres.b}
                onChange={(e) => poner({ b: e.target.value })}
                placeholder="Rubén"
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                maxLength={24}
              />
            </label>
          </div>
          <p className={c.ayuda} aria-live="polite">
            {nombres.a || nombres.b
              ? "Abrid cualquiera: ya lleva vuestros nombres. Nada sale de este navegador."
              : "Escribidlos y, al abrir una, la veréis con vuestros nombres."}
          </p>
        </fieldset>
      )}

      <div className={s.familias} role="group" aria-label="Filtrar por estilo">
        {[{ id: "todas", nombre: "Todas", texto: "" }, ...familias].map((f) => (
          <button
            key={f.id}
            type="button"
            className={c.chip}
            aria-pressed={familia === f.id}
            onClick={() => elegir(f.id)}
          >
            {f.nombre}
            <span className={c.cuenta}>
              {f.id === "todas" ? fichas.length : fichas.filter((x) => x.familia === f.id).length}
            </span>
          </button>
        ))}
      </div>

      {lugares.length > 0 && (
        <div className={s.lugares} role="group" aria-label="Filtrar por tipo de boda">
          <span>Boda de</span>
          {lugares.map((l) => (
            <button
              key={l.id}
              type="button"
              className={s.lugar}
              aria-pressed={lugar === l.id}
              onClick={() => conTransicion(() => setLugar((x) => (x === l.id ? null : l.id)))}
            >
              {l.nombre.toLowerCase()}
            </button>
          ))}
        </div>
      )}

      <p className={s.familiaTexto} aria-live="polite">
        {familiaActual
          ? familiaActual.texto
          : limite
            ? `Una muestra de las ${enLetra(fichas.length)}. Pasad el ratón o tocad ▶ para ver cómo se abren.`
            : `Las ${enLetra(fichas.length)}. Pasad el ratón o tocad ▶ para ver cómo se abren.`}
      </p>

      <ul className={s.rejilla}>
        {visibles.map((f, i) => (
          <Ficha key={f.id} f={f} i={i} alAbrir={abrir} />
        ))}
      </ul>
      {visibles.length === 0 && (
        <p className="mt-8 text-[1.04rem] opacity-75">
          Ninguna con esa combinación. Quitad el tipo de boda y probad otra vez.
        </p>
      )}

      {limite && (
        <div className={s.mas}>
          <Link href={familia === "todas" ? "/plantillas" : `/plantillas?estilo=${familia}`}>
            Ver {familia === "todas" ? `las ${fichas.length}` : `las ${total} de ${familiaActual?.nombre.toLowerCase()}`}
          </Link>
        </div>
      )}

      {ficha && (
        <VistaCompleta
          ficha={ficha}
          color={ficha.colores[0]}
          alCerrar={cerrar}
          alCambiar={(otra) => conTransicion(() => setAbierta(otra))}
          fichas={visibles.some((v) => v.id === ficha.id) ? visibles : fichas}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Una ficha ───────────────────────── */

function Ficha({ f, i, alAbrir }: { f: FichaCatalogo; i: number; alAbrir: (id: string, origen: HTMLElement) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [vivo, setVivo] = useState(false);

  const sonar = (si: boolean) => {
    const v = video.current;
    if (!v) return;
    if (si) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (v.readyState === 0) v.load();
      v.currentTime = 0;
      v.play()
        .then(() => setVivo(true))
        .catch(() => setVivo(false));
    } else {
      v.pause();
      setVivo(false);
    }
  };

  return (
    <li className={s.ficha} style={{ "--i": i } as React.CSSProperties}>
      <div className={s.marcoFicha}>
      <a
        href={`/i/${f.demo}`}
        data-abre={f.id}
        data-cursor="ver"
        className={s.abrir}
        onPointerEnter={(e) => e.pointerType === "mouse" && sonar(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && sonar(false)}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          sonar(false);
          alAbrir(f.id, e.currentTarget.querySelector<HTMLElement>("[data-portada]") ?? e.currentTarget);
        }}
        aria-label={`${f.nombre}, ${f.etiqueta}: vista rápida`}
      >
        <div className={s.telefono} data-portada={f.id}>
          <Iphone sinBotones acabado={i % 2 ? "claro" : "oscuro"}>
            <div
              className={s.pantalla}
              data-vivo={vivo || undefined}
              style={{ "--papel-ficha": f.colores[0]?.papel } as React.CSSProperties}
            >
              {f.poster && (
                // eslint-disable-next-line @next/next/no-img-element -- póster AVIF/SVG ya optimizado
                <img src={f.poster} alt="" width={720} height={1280} loading="lazy" decoding="async" />
              )}
              {f.video && <video ref={video} src={f.video} muted loop playsInline preload="none" aria-hidden tabIndex={-1} />}
            </div>
          </Iphone>
        </div>
      </a>
      {f.video && (
        <button
          type="button"
          className={s.play}
          onClick={() => sonar(!vivo)}
          aria-pressed={vivo}
          aria-label={vivo ? `Parar la apertura de ${f.nombre}` : `Ver la apertura de ${f.nombre}`}
        >
          {vivo ? (
            <span aria-hidden className="flex gap-[4px]">
              <span className="block h-3.5 w-[3px] bg-current" />
              <span className="block h-3.5 w-[3px] bg-current" />
            </span>
          ) : (
            <span aria-hidden className="ml-0.5 block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-current" />
          )}
        </button>
      )}
      </div>
      <div className={s.pie}>
        <div className={s.cabezaPie}>
          <span className={s.nombre}>{f.nombre}</span>
          <span className={s.etiqueta}>{f.etiqueta}</span>
        </div>
        <p className={s.gesto}>{f.gesto}</p>
      </div>
    </li>
  );
}
