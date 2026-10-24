"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { obtenerPlantilla } from "@/data/plantillas";
import {
  aleatorioArmonico,
  aplicarPaleta,
  hexAOklch,
  muestrasDe,
  nodosDeInvitacion,
  oklchAHex,
  paletasDe,
  perfilDe,
  prepararFundido,
  resolverPaleta,
  tonoDe,
  conTono,
  TODAS_LAS_VARIABLES,
  type Colores,
  type MensajeColor,
  type PaletaResuelta,
  type Rol,
} from "@/lib/color";
import type { ResultadoPaleta } from "@/lib/color/acciones";
import { resolverTokens } from "@/plantillas/tokens";
import type { Tema } from "@/lib/tipos";
import s from "./ProbadorColor.module.css";

/**
 * Probador de color en vivo (G3).
 *
 *   // Panel › Diseño (F4): con guardado
 *   <ProbadorColor slug={inv.slug} plantilla={inv.plantilla} tema={inv.tema}
 *     modo="completo" guardar={guardarPaleta} />
 *
 *   // /plantillas a pantalla completa (F3): ya tenéis un iframe de la demo
 *   <ProbadorColor slug={p.demo} plantilla={p.id} modo="completo" destino={refIframe} />
 *
 *   // BarraDemo (F3): dentro de la propia invitación, hoja inferior
 *   <ProbadorColor slug={slug} plantilla={id} modo="compacto" />
 *
 * Toda paleta pasa por `resolverPaleta`: lo que se ve cumple AA (tinta
 * ≥ 7:1, acento como texto ≥ 4,5:1, texto sobre el acento ≥ 4,5:1).
 */
export type PropsProbador = {
  slug: string;
  /** Id de plantilla (vale un id antiguo: se resuelve). */
  plantilla: string;
  /** El tema guardado de la boda: de aquí sale «el original». */
  tema?: Tema;
  /** «completo» (panel, /plantillas) o «compacto» (hoja inferior para la demo y el móvil). */
  modo?: "compacto" | "completo";
  /** Cada cambio, ya resuelto con AA. `id` es la paleta curada, o null si es a medida. */
  onCambio?: (p: PaletaResuelta, info: { id: string | null; nombre: string }) => void;
  /** Server action: `guardarPaleta` de `@/lib/color/acciones`. Sin ella no hay botón «Guardar». */
  guardar?: (slug: string, colores: Colores) => Promise<ResultadoPaleta>;
  /**
   * Dónde se aplica:
   *  · "iframe" (por defecto en completo): pinta su propia vista previa
   *    `/i/<slug>?vista=1` y le manda los colores por postMessage;
   *  · "documento" (por defecto en compacto): esta misma página
   *    (`.lienzo`, `main[data-modo]`, `[data-color-vivo]`);
   *  · un ref a VUESTRO iframe (mismo origen, con `?vista=1`).
   */
  destino?: "iframe" | "documento" | RefObject<HTMLIFrameElement | null>;
  /** Página de la vista previa propia. Por defecto `/i/<slug>`. */
  urlVista?: string;
  /** Título visible del modo completo. */
  titulo?: string;
  className?: string;
};

type Estado = { ok: boolean; texto: string } | null;

const nada = () => () => {};

export default function ProbadorColor({
  slug,
  plantilla,
  tema,
  modo = "completo",
  onCambio,
  guardar,
  destino,
  urlVista,
  titulo = "Los colores de vuestra invitación",
  className = "",
}: PropsProbador) {
  const id = useId();
  const p = obtenerPlantilla(plantilla);
  const perfil = perfilDe(p.id);
  const curadas = useMemo(() => paletasDe(p.id), [p.id]);

  // El original: lo que la boda tiene hoy (tema guardado o su variante).
  const original = useMemo<Colores>(() => {
    const t = resolverTokens(plantilla, tema);
    return { papel: t.papel, tinta: t.tinta, acento: t.acento };
  }, [plantilla, tema]);
  const idDe = useCallback(
    (c: Colores) =>
      curadas.find(
        (x) =>
          x.papel === c.papel.toLowerCase() && x.tinta === c.tinta.toLowerCase() && x.acento === c.acento.toLowerCase(),
      )?.id ?? null,
    [curadas],
  );

  const [colores, setColores] = useState<Colores>(original);
  const [elegida, setElegida] = useState<string | null>(() => idDe(original));
  const [nombre, setNombre] = useState(() => curadas.find((x) => x.id === idDe(original))?.nombre ?? "Vuestros colores");
  const [rol, setRol] = useState<Rol>("acento");
  const [tocado, setTocado] = useState(false);
  const [guardados, setGuardados] = useState<Colores>(original);
  const [estado, setEstado] = useState<Estado>(null);
  const [pendiente, empezar] = useTransition();

  const r = useMemo(() => resolverPaleta(colores, perfil.modo), [colores, perfil.modo]);
  const esOriginal =
    colores.papel === original.papel && colores.tinta === original.tinta && colores.acento === original.acento;

  // ———————————————————————————————————————— aplicar en vivo
  const modoDestino = destino ?? (modo === "completo" ? "iframe" : "documento");
  const propio = useRef<HTMLIFrameElement>(null);
  const marco = typeof modoDestino === "object" ? modoDestino : propio;
  const listo = useRef(false);
  const originalesDoc = useRef<Map<HTMLElement, [string, string][]> | null>(null);

  const enviarDirecto = useCallback(
    (doc: Document, pal: PaletaResuelta | null) => {
      const nodos = nodosDeInvitacion(doc);
      if (!originalesDoc.current) {
        originalesDoc.current = new Map(
          nodos.map((n) => [n, TODAS_LAS_VARIABLES.map((v) => [v, n.style.getPropertyValue(v)] as [string, string])]),
        );
      }
      prepararFundido(doc);
      if (pal) aplicarPaleta(nodos, pal);
      else
        for (const [n, vars] of originalesDoc.current) {
          for (const [v, valor] of vars) {
            if (valor) n.style.setProperty(v, valor);
            else n.style.removeProperty(v);
          }
          delete n.dataset.colorPaleta;
        }
    },
    [],
  );

  const enviar = useCallback(
    (pal: PaletaResuelta | null) => {
      if (modoDestino === "documento") {
        enviarDirecto(document, pal);
        return;
      }
      const f = marco.current;
      const w = f?.contentWindow;
      if (!f || !w) return;
      if (listo.current) {
        const msg: MensajeColor = pal
          ? { tipo: "invitoo:color", paleta: pal }
          : { tipo: "invitoo:color-original" };
        w.postMessage(msg, window.location.origin);
        return;
      }
      // Sin oyente (EscuchaColor aún no montado): mismo origen, se pinta directo.
      try {
        if (f.contentDocument?.readyState === "complete") enviarDirecto(f.contentDocument, pal);
      } catch {
        /* otro origen: esperamos al oyente */
      }
    },
    [modoDestino, marco, enviarDirecto],
  );

  useEffect(() => {
    const alMensaje = (e: MessageEvent<MensajeColor>) => {
      if (e.origin !== window.location.origin || e.source !== marco.current?.contentWindow) return;
      if (e.data?.tipo === "invitoo:color-listo") {
        listo.current = true;
        if (tocado) enviar(r);
      }
    };
    window.addEventListener("message", alMensaje);
    return () => window.removeEventListener("message", alMensaje);
  }, [marco, enviar, r, tocado]);

  // Cada cambio, al destino (el fundido lo hace el CSS: 600 ms).
  useEffect(() => {
    if (!tocado) return;
    // De vuelta en el original: los valores exactos del servidor.
    const raf = requestAnimationFrame(() => enviar(esOriginal ? null : r));
    return () => cancelAnimationFrame(raf);
  }, [r, tocado, enviar, esOriginal]);

  useEffect(() => {
    if (tocado) onCambio?.(r, { id: elegida, nombre });
    // onCambio fuera a propósito: una función nueva en cada render no es un cambio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, elegida, nombre, tocado]);

  // ———————————————————————————————————————— acciones
  const poner = (c: Colores, idCurada: string | null, nombreNuevo: string) => {
    setEstado(null);
    setTocado(true);
    setColores(c);
    setElegida(idCurada);
    setNombre(nombreNuevo);
  };
  const elegirCurada = (idCurada: string) => {
    const c = curadas.find((x) => x.id === idCurada);
    if (c) poner({ papel: c.papel, tinta: c.tinta, acento: c.acento }, c.id, c.nombre);
  };
  const aleatorio = () => {
    const a = aleatorioArmonico(p.id);
    poner({ papel: a.papel, tinta: a.tinta, acento: a.acento }, null, "Aleatorio armónico");
  };
  const volver = () => {
    poner(original, idDe(original), curadas.find((x) => x.id === idDe(original))?.nombre ?? "Vuestros colores");
  };
  const cambiarRol = (rolCambio: Rol, hex: string) =>
    poner({ ...colores, [rolCambio]: hex }, null, "A vuestro gusto");
  const cambiarTono = (h: number) => {
    const c = conTono(colores, rol, h, p.id);
    poner(c, null, "A vuestro gusto");
  };

  const sinGuardar =
    colores.papel !== guardados.papel || colores.tinta !== guardados.tinta || colores.acento !== guardados.acento;

  const alGuardar = () =>
    guardar &&
    empezar(async () => {
      const res = await guardar(slug, { papel: r.papel, tinta: r.tinta, acento: r.acento });
      if (res.ok) {
        setGuardados(colores);
        setEstado({ ok: true, texto: res.mensaje });
      } else setEstado({ ok: false, texto: res.error });
    });

  // ———————————————————————————————————————— el anuncio de contraste
  // Que el acento se oscurezca (o aclare) en los textos es el diseño, no un
  // apaño: solo hablamos de «ajuste» si hemos tenido que tocar lo elegido.
  const leePerfecto = r.ajustes.every((a) => a === "acentoTexto");
  const veredicto = leePerfecto ? "Se lee perfecto" : "Ajustado para que se lea";
  const detalle = leePerfecto
    ? r.ajustes.length
      ? `Texto ${ratio(r.ratios.tinta)} · el acento, un punto más ${perfil.modo === "oscuro" ? "claro" : "hondo"} en los textos (${ratio(r.ratios.acentoTexto)})`
      : `Texto ${ratio(r.ratios.tinta)} · acento ${ratio(r.ratios.acentoTexto)}`
    : `Hemos movido la luz lo justo, sin cambiar el tono · texto ${ratio(r.ratios.tinta)} · acento ${ratio(r.ratios.acentoTexto)}`;

  const muestraTrio = (c: Colores) => (
    <span className={s.trio} aria-hidden>
      <span style={{ background: c.papel }} />
      <span style={{ background: c.tinta }} />
      <span style={{ background: c.acento }} />
    </span>
  );

  const listaCuradas = (compacta: boolean) => (
    <fieldset className={compacta ? s.filaDeslizable : s.rejilla}>
      <legend className={compacta ? "sr-only" : s.leyenda}>Paletas para {p.nombre}</legend>
      {curadas.map((c) => (
        <label key={c.id} className={compacta ? s.chip : s.tarjeta} data-activa={elegida === c.id || undefined}>
          <input
            type="radio"
            name={`${id}-paleta`}
            value={c.id}
            checked={elegida === c.id}
            onChange={() => elegirCurada(c.id)}
            className="sr-only"
          />
          {muestraTrio(c)}
          <span className={s.nombrePaleta}>{c.nombre}</span>
        </label>
      ))}
    </fieldset>
  );

  const botones = (compacta: boolean) => (
    <div className={compacta ? s.botonesCompactos : s.botones}>
      <button type="button" onClick={aleatorio} className={s.boton}>
        <IconoDados /> Aleatorio armónico
      </button>
      <button type="button" onClick={volver} disabled={esOriginal} className={s.boton}>
        Volver al original
      </button>
      {guardar && (
        <button
          type="button"
          onClick={alGuardar}
          disabled={pendiente || !sinGuardar}
          className={`${s.boton} ${s.principal}`}
          style={{ background: r.acento, color: r.sobreAcento, borderColor: r.acento }}
        >
          {pendiente ? "Guardando…" : "Guardar esta paleta"}
        </button>
      )}
    </div>
  );

  const anuncio = (
    <p role="status" aria-live="polite" className={s.anuncio} data-ajustado={!leePerfecto || undefined}>
      <span className={s.punto} aria-hidden />
      <strong>{veredicto}</strong>
      <span className={s.detalle}>
        {nombre} · {detalle}
      </span>
    </p>
  );

  // ———————————————————————————————————————— compacto: hoja inferior
  if (modo === "compacto") {
    return (
      <HojaColor
        id={id}
        titulo="Probar colores"
        nombre={nombre}
        trio={muestraTrio(r)}
        className={className}
        empujar={modoDestino === "documento"}
      >
        {listaCuradas(true)}
        {botones(true)}
        {anuncio}
        {estado && (
          <p className={s.estado} data-error={!estado.ok || undefined}>
            {estado.texto}
          </p>
        )}
      </HojaColor>
    );
  }

  // ———————————————————————————————————————— completo
  const muestras = muestrasDe(rol, p.id);
  const o = hexAOklch(colores[rol]);
  const pista = Array.from({ length: 13 }, (_, i) =>
    oklchAHex({ l: o.l, c: Math.max(o.c, rol === "acento" ? 0.08 : 0.03), h: i * 30 }),
  ).join(",");
  const tono = tonoDe(colores[rol]);
  const ROLES: { k: Rol; nombre: string; ayuda: string }[] = [
    { k: "papel", nombre: "Papel", ayuda: "el fondo" },
    { k: "tinta", nombre: "Tinta", ayuda: "el texto" },
    { k: "acento", nombre: "Acento", ayuda: "títulos y botones" },
  ];

  return (
    <section
      aria-labelledby={`${id}-t`}
      className={`${s.completo} ${modoDestino === "iframe" ? s.conVista : ""} ${className}`}
    >
      <div className={s.controles}>
        <h2 id={`${id}-t`} className={s.titulo}>
          {titulo}
        </h2>
        <p className={s.intro}>
          Elegid una paleta o mezclad la vuestra. Si un color no se leería bien, lo ajustamos solos
          para que todos vuestros invitados lo lean sin esfuerzo.
        </p>

        {listaCuradas(false)}

        <fieldset className={s.roles}>
          <legend className={s.leyenda}>Ajustar un color</legend>
          <div className={s.pestanas}>
            {ROLES.map(({ k, nombre: n, ayuda }) => (
              <label key={k} className={s.pestana} data-activa={rol === k || undefined}>
                <input
                  type="radio"
                  name={`${id}-rol`}
                  value={k}
                  checked={rol === k}
                  onChange={() => setRol(k)}
                  className="sr-only"
                />
                <span className={s.circulo} style={{ background: r[k] }} aria-hidden />
                <span>
                  <span className={s.rolNombre}>{n}</span>
                  <span className={s.rolAyuda}>{ayuda}</span>
                </span>
              </label>
            ))}
          </div>

          <div className={s.panelRol}>
            <fieldset className={s.muestras}>
              <legend className="sr-only">Muestras de {ROLES.find((x) => x.k === rol)?.nombre.toLowerCase()}</legend>
              {muestras.map((m) => (
                <label
                  key={m.hex}
                  className={s.muestra}
                  title={m.nombre}
                  data-activa={colores[rol].toLowerCase() === m.hex || undefined}
                >
                  <input
                    type="radio"
                    name={`${id}-muestra-${rol}`}
                    value={m.hex}
                    checked={colores[rol].toLowerCase() === m.hex}
                    onChange={() => cambiarRol(rol, m.hex)}
                    className="sr-only"
                  />
                  <span style={{ background: m.hex }} aria-hidden />
                  <span className="sr-only">{m.nombre}</span>
                </label>
              ))}
            </fieldset>

            <label htmlFor={`${id}-tono`} className={s.etiqueta}>
              Tono <span className={s.valor}>{nombreTono(tono, o.c)}</span>
            </label>
            <input
              id={`${id}-tono`}
              type="range"
              min={0}
              max={359}
              step={1}
              value={tono}
              aria-valuetext={`${tono} grados, ${nombreTono(tono, o.c)}`}
              onChange={(e) => cambiarTono(Number(e.target.value))}
              className={s.rango}
              style={{ ["--pista" as string]: `linear-gradient(90deg,${pista})` }}
            />
            <label className={s.otro}>
              <input
                type="color"
                value={colores[rol]}
                onChange={(e) => cambiarRol(rol, e.target.value)}
                className={s.selectorNativo}
              />
              Otro color exacto…
            </label>
          </div>
        </fieldset>

        {/* El espécimen: la paleta, aquí mismo, ya legible. */}
        <div className={s.especimen} style={{ background: r.papel, color: r.tinta }} aria-hidden>
          <span className={s.especimenTitulo} style={{ color: r.acentoTexto }}>
            {p.pareja[0]} &amp; {p.pareja[1]}
          </span>
          <span>Nos casamos el {p.pareja[2]}</span>
          <span className={s.especimenBoton} style={{ background: r.acento, color: r.sobreAcento }}>
            Confirmar asistencia
          </span>
        </div>

        {anuncio}
        {botones(false)}
        <p className={s.estado} data-error={(estado && !estado.ok) || undefined} role={estado && !estado.ok ? "alert" : undefined}>
          {estado ? estado.texto : sinGuardar && guardar ? "Hay cambios sin guardar" : ""}
        </p>
      </div>

      {modoDestino === "iframe" && (
        <div className={s.vista}>
          <div className={s.movil}>
            <iframe
              ref={propio}
              src={`${urlVista ?? `/i/${slug}`}${(urlVista ?? "").includes("?") ? "&" : "?"}vista=1`}
              title="Vista previa de la invitación con estos colores"
              onLoad={() => {
                if (tocado) enviar(r);
              }}
              className={s.iframe}
            />
          </div>
        </div>
      )}
    </section>
  );
}

// ——————————————————————————————————————————————————————————— hoja inferior

/**
 * La hoja del modo compacto. Plegada es un botón en línea (donde lo ponga
 * quien lo use: la BarraDemo); abierta, una hoja fija abajo que:
 *  · respeta `env(safe-area-inset-bottom)`;
 *  · añade su altura como `padding-bottom` al <body> mientras está abierta,
 *    para que nada de la invitación quede tapado sin poder verse;
 *  · se pliega sola cuando aparece el formulario de confirmación (#confirmar)
 *    —salvo que la estéis usando— y con Escape.
 */
function HojaColor({
  id,
  titulo,
  nombre,
  trio,
  children,
  className,
  empujar,
}: {
  id: string;
  titulo: string;
  nombre: string;
  trio: React.ReactNode;
  children: React.ReactNode;
  className: string;
  /** Añadir la altura de la hoja al <body> (solo si pinta esta misma página). */
  empujar: boolean;
}) {
  const [abierta, setAbierta] = useState(false);
  const montado = useSyncExternalStore(nada, () => true, () => false);
  const hoja = useRef<HTMLDivElement>(null);
  const lanzador = useRef<HTMLButtonElement>(null);

  // Reserva su altura abajo para no tapar nada.
  useEffect(() => {
    if (!abierta || !hoja.current) return;
    const body = document.body;
    const html = document.documentElement;
    const previo = body.style.paddingBottom;
    const ro = new ResizeObserver(([e]) => {
      const alto = Math.ceil(e.borderBoxSize?.[0]?.blockSize ?? e.contentRect.height);
      // En escritorio la hoja flota a la derecha: no hace falta empujar nada.
      const flota = window.matchMedia("(min-width: 64rem)").matches;
      if (empujar) body.style.paddingBottom = flota ? previo : `${alto}px`;
      // Para los otros fijos (música, BarraDemo): `bottom: calc(... + var(--hoja-color, 0px))`.
      html.style.setProperty("--hoja-color", flota ? "0px" : `${alto}px`);
      html.dataset.hojaColor = "abierta";
    });
    ro.observe(hoja.current);
    return () => {
      ro.disconnect();
      if (empujar) body.style.paddingBottom = previo;
      html.style.removeProperty("--hoja-color");
      delete html.dataset.hojaColor;
    };
  }, [abierta, empujar]);

  // Nunca encima de «Confirmar».
  useEffect(() => {
    if (!abierta) return;
    const rsvp = document.getElementById("confirmar");
    if (!rsvp) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !hoja.current?.contains(document.activeElement)) setAbierta(false);
      },
      { threshold: 0.15 },
    );
    io.observe(rsvp);
    return () => io.disconnect();
  }, [abierta]);

  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierta(false);
        lanzador.current?.focus();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierta]);

  return (
    <>
      <button
        ref={lanzador}
        type="button"
        aria-expanded={abierta}
        aria-controls={`${id}-hoja`}
        onClick={() => setAbierta((x) => !x)}
        className={`${s.lanzador} ${className}`}
      >
        {trio}
        <span>{abierta ? "Plegar colores" : titulo}</span>
      </button>
      {montado &&
        createPortal(
          <div
            ref={hoja}
            id={`${id}-hoja`}
            role="region"
            aria-label={`Probar colores: ${nombre}`}
            className={s.hoja}
            data-abierta={abierta || undefined}
            hidden={!abierta}
          >
            <div className={s.cabeceraHoja}>
              <span className={s.tituloHoja}>
                {trio}
                <span>{nombre}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAbierta(false);
                  lanzador.current?.focus();
                }}
                className={s.plegar}
                aria-label="Plegar los colores"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

// ——————————————————————————————————————————————————————————— utilidades

function ratio(x: number) {
  return `${x.toFixed(1).replace(".", ",")}:1`;
}

function nombreTono(h: number, c: number) {
  if (c < 0.02) return "neutro";
  const tabla: [number, string][] = [
    [15, "rosa"], [40, "terracota"], [65, "ámbar"], [95, "dorado"], [125, "oliva"],
    [165, "verde"], [200, "agua"], [240, "azul"], [275, "añil"], [310, "lavanda"],
    [345, "malva"], [360, "rosa"],
  ];
  return tabla.find(([hasta]) => h < hasta)?.[1] ?? "rosa";
}

function IconoDados() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"
        fill="currentColor"
      />
    </svg>
  );
}
