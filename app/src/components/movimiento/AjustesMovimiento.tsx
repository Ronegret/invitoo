"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  codificarMovimiento,
  diferenciaMovimiento,
  ENTRADAS,
  ESTILOS,
  FLORES,
  LIMITES,
  movimientoPorDefecto,
  NOMBRES,
  PARTICULAS,
  resolverMovimiento,
  type MensajeMovimiento,
} from "@/lib/movimiento";
import { guardarMovimiento, type ResultadoMovimiento } from "@/lib/movimiento-acciones";
import type { Invitacion, Movimiento } from "@/lib/tipos";

/**
 * Cómo se mueve la invitación, con nombres de persona y no de CSS.
 *
 * A la izquierda los ajustes; a la derecha la invitación de verdad en un
 * iframe (`/i/<slug>?vista=1&mov=…`). Cada cambio llega al iframe por
 * `postMessage` y se ve al momento, sin recargar: la sección vuelve a
 * entrar con el ritmo nuevo. Solo se guarda al pulsar «Guardar».
 *
 * Se guarda únicamente lo que difiere de lo recomendado por la plantilla:
 * si mañana mejoramos lo recomendado, la boda que no tocó nada lo hereda.
 *
 * Uso:
 *   <AjustesMovimiento inv={inv} />                      // guarda con guardarMovimiento
 *   <AjustesMovimiento inv={inv} urlVista="/estudio/vista/<id>" />  // borradores
 *   <AjustesMovimiento inv={inv} onGuardar={(mov) => miAccion(mov)} />
 */
export default function AjustesMovimiento({
  inv,
  onGuardar,
  urlVista,
}: {
  inv: Pick<Invitacion, "slug" | "plantilla" | "tema">;
  /**
   * Guarda el movimiento (solo lo que difiere de lo recomendado; `{}` =
   * recomendado). Por defecto, `guardarMovimiento(inv.slug, mov)`.
   */
  onGuardar?: (mov: Partial<Movimiento>) => Promise<ResultadoMovimiento | void> | ResultadoMovimiento | void;
  /** Página de la vista previa. Por defecto `/i/<slug>` (solo publicadas). */
  urlVista?: string;
}) {
  const id = useId();
  const recomendado = useMemo(() => movimientoPorDefecto(inv.plantilla), [inv.plantilla]);
  const [guardado, setGuardado] = useState<Movimiento>(() =>
    resolverMovimiento(inv.plantilla, inv.tema?.movimiento),
  );
  const [m, setM] = useState<Movimiento>(guardado);
  const [estado, setEstado] = useState<ResultadoMovimiento | null>(null);
  const [pendiente, empezar] = useTransition();
  const marco = useRef<HTMLIFrameElement>(null);
  const listo = useRef(false);

  const base = urlVista ?? `/i/${inv.slug}`;
  const vista = (mov: Movimiento, extra = "") =>
    `${base}${base.includes("?") ? "&" : "?"}vista=1${extra}&mov=${codificarMovimiento(mov)}`;
  // El src se fija una vez: los cambios van por mensaje, no recargando.
  const [src, setSrc] = useState(() => vista(guardado));

  const enviar = useCallback((msg: MensajeMovimiento) => {
    const w = marco.current?.contentWindow;
    if (!w || !listo.current) return;
    w.postMessage(msg, window.location.origin);
  }, []);

  // El iframe avisa cuando ya escucha.
  useEffect(() => {
    const alMensaje = (e: MessageEvent<{ tipo?: string }>) => {
      if (e.origin !== window.location.origin || e.source !== marco.current?.contentWindow) return;
      if (e.data?.tipo === "invitoo:mov-listo") listo.current = true;
    };
    window.addEventListener("message", alMensaje);
    return () => window.removeEventListener("message", alMensaje);
  }, []);

  // Cada cambio, al iframe, con un respiro para no repetir la entrada a
  // cada píxel del deslizador.
  useEffect(() => {
    const t = window.setTimeout(() => enviar({ tipo: "invitoo:mov", mov: m }), 260);
    return () => window.clearTimeout(t);
  }, [m, enviar]);

  const cambiar = <K extends keyof Movimiento>(k: K, v: Movimiento[K]) => {
    setEstado(null);
    setM((x) => ({ ...x, [k]: v }));
  };

  const sinGuardar = JSON.stringify(m) !== JSON.stringify(guardado);
  const esRecomendado = JSON.stringify(m) === JSON.stringify(recomendado);

  const guardar = () =>
    empezar(async () => {
      const diff = diferenciaMovimiento(inv.plantilla, m);
      const r = onGuardar ? await onGuardar(diff) : await guardarMovimiento(inv.slug, diff);
      const res: ResultadoMovimiento = r ?? { ok: true, mensaje: "Movimiento guardado." };
      setEstado(res);
      if (res.ok) setGuardado(m);
    });

  // ——— estilos ———
  const etiqueta = "block text-[0.95rem] font-medium";
  const pista = "mt-1 flex justify-between text-[0.85rem] opacity-65";
  const rango = "mt-3 h-11 w-full cursor-pointer accent-[var(--acento)]";
  const pastilla =
    "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[0.92rem] transition-colors duration-150 has-[:checked]:border-[var(--acento)] has-[:checked]:bg-[color-mix(in_srgb,var(--acento)_10%,transparent)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--acento)] border-[color-mix(in_srgb,var(--tinta)_22%,transparent)]";
  const boton =
    "inline-flex min-h-11 items-center rounded-full px-5 text-[0.92rem] transition-[scale,opacity] duration-150 active:scale-[.97] disabled:opacity-50";

  const indiceEstilo = ESTILOS.indexOf(m.estilo);

  return (
    <section aria-labelledby={`${id}-t`} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div>
        <h2 id={`${id}-t`} className="display text-[clamp(1.6rem,5vw,2.2rem)]">
          Cómo se mueve la invitación
        </h2>
        <p className="mt-3 max-w-[38rem] text-[0.98rem] leading-relaxed opacity-75">
          Fundidos suaves, nada brusco. Lo recomendado ya va con la plantilla; aquí podéis darle
          más calma o más cine. Los cambios se ven al momento en la vista previa.
        </p>

        <div className="mt-9 flex flex-col gap-9">
          {/* Carácter */}
          <div>
            <label htmlFor={`${id}-estilo`} className={etiqueta}>
              Carácter: <span className="font-normal opacity-80">{NOMBRES.estilo[m.estilo]}</span>
            </label>
            <input
              id={`${id}-estilo`}
              type="range"
              min={0}
              max={ESTILOS.length - 1}
              step={1}
              value={indiceEstilo}
              aria-valuetext={NOMBRES.estilo[m.estilo]}
              onChange={(e) => cambiar("estilo", ESTILOS[Number(e.target.value)])}
              className={rango}
            />
            <p className={pista} aria-hidden>
              <span>Más sereno</span>
              <span>Más cinematográfico</span>
            </p>
          </div>

          {/* Velocidad */}
          <div>
            <label htmlFor={`${id}-vel`} className={etiqueta}>
              Velocidad
            </label>
            <input
              id={`${id}-vel`}
              type="range"
              min={LIMITES.velocidad.min}
              max={LIMITES.velocidad.max}
              step={0.05}
              value={m.velocidad}
              aria-valuetext={describirVelocidad(m.velocidad, recomendado.velocidad)}
              onChange={(e) => cambiar("velocidad", Number(e.target.value))}
              className={rango}
            />
            <p className={pista} aria-hidden>
              <span>Más pausada</span>
              <span className="tabular-nums">{describirVelocidad(m.velocidad, recomendado.velocidad)}</span>
              <span>Más ágil</span>
            </p>
          </div>

          {/* Intensidad */}
          <div>
            <label htmlFor={`${id}-int`} className={etiqueta}>
              Intensidad de la entrada
            </label>
            <input
              id={`${id}-int`}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={m.intensidad}
              aria-valuetext={`${Math.round(m.intensidad * 100)} %`}
              onChange={(e) => cambiar("intensidad", Number(e.target.value))}
              className={rango}
            />
            <p className={pista} aria-hidden>
              <span>Apenas un fundido</span>
              <span>Con más presencia</span>
            </p>
          </div>

          {/* Entrada */}
          <fieldset>
            <legend className={etiqueta}>Cómo aparece cada sección</legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {ENTRADAS.map((e) => (
                <label key={e} className={pastilla}>
                  <input
                    type="radio"
                    name={`${id}-entrada`}
                    value={e}
                    checked={m.entrada === e}
                    onChange={() => cambiar("entrada", e)}
                    className="sr-only"
                  />
                  {NOMBRES.entrada[e]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Partículas */}
          <fieldset>
            <legend className={etiqueta}>Partículas, muy tenues y detrás del texto</legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {PARTICULAS.map((p) => (
                <label key={p} className={pastilla}>
                  <input
                    type="radio"
                    name={`${id}-particulas`}
                    value={p}
                    checked={m.particulas === p}
                    onChange={() => cambiar("particulas", p)}
                    className="sr-only"
                  />
                  {NOMBRES.particulas[p]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Flores */}
          <fieldset>
            <legend className={etiqueta}>Flores que florecen al bajar</legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {FLORES.map((f) => (
                <label key={f} className={pastilla}>
                  <input
                    type="radio"
                    name={`${id}-flores`}
                    value={f}
                    checked={m.flores === f}
                    onChange={() => cambiar("flores", f)}
                    className="sr-only"
                  />
                  {NOMBRES.flores[f]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* La invitación viva */}
          <fieldset>
            <legend className={etiqueta}>Una invitación que responde</legend>
            <p className="mt-1 text-[0.85rem] opacity-65">Probadlo tocando la vista previa.</p>
            <div className="mt-3 flex flex-col gap-1">
              {(
                [
                  ["interaccion", "Reflejo dorado en vuestros nombres, que sigue al dedo o al móvil"],
                  ["petalosAlTocar", "Caen pétalos donde se toca"],
                  ["colorVivo", "El fondo cambia de tono, despacio, entre secciones"],
                ] as const
              ).map(([k, texto]) => (
                <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.95rem]">
                  <input
                    type="checkbox"
                    checked={m[k]}
                    onChange={(e) => cambiar(k, e.target.checked)}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-[var(--acento)]"
                  />
                  {texto}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Detalles */}
          <fieldset>
            <legend className={etiqueta}>Detalles</legend>
            <div className="mt-3 flex flex-col gap-1">
              {(
                [
                  ["ornamentos", "Ramas y ornamentos que se dibujan solos"],
                  ["parallax", "Fotos con un leve desplazamiento al bajar"],
                  ["musicaFundido", "La canción entra subiendo poco a poco"],
                ] as const
              ).map(([k, texto]) => (
                <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.95rem]">
                  <input
                    type="checkbox"
                    checked={m[k]}
                    onChange={(e) => cambiar(k, e.target.checked)}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-[var(--acento)]"
                  />
                  {texto}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={guardar}
            disabled={pendiente || !sinGuardar}
            className={`${boton} bg-[var(--tinta)] text-[var(--papel)]`}
          >
            {pendiente ? "Guardando…" : "Guardar movimiento"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEstado(null);
              setM(recomendado);
            }}
            disabled={esRecomendado}
            className={`${boton} border border-[color-mix(in_srgb,var(--tinta)_25%,transparent)]`}
          >
            Volver a lo recomendado
          </button>
          {sinGuardar && !pendiente && (
            <span className="text-[0.88rem] opacity-65">Hay cambios sin guardar</span>
          )}
        </div>
        <p role="status" className="mt-4 min-h-6 text-[0.92rem]" style={{ color: estado && !estado.ok ? "var(--acento)" : undefined }}>
          {estado ? (estado.ok ? estado.mensaje : estado.error) : ""}
        </p>
      </div>

      {/* La vista previa: la invitación de verdad, a tamaño de móvil. */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mx-auto w-full max-w-[24rem] overflow-hidden rounded-[2rem] border border-[color-mix(in_srgb,var(--tinta)_14%,transparent)] bg-[var(--papel)] shadow-[0_30px_60px_-40px_rgba(20,10,5,.5)]">
          <iframe
            ref={marco}
            key={src}
            src={src}
            title="Vista previa de la invitación"
            loading="lazy"
            onLoad={() => {
              // Por si el aviso llegó antes que el oyente.
              listo.current = true;
              enviar({ tipo: "invitoo:mov", mov: m });
            }}
            className="block h-[min(44rem,78svh)] w-full"
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => enviar({ tipo: "invitoo:mov-repetir" })}
            className={`${boton} border border-[color-mix(in_srgb,var(--tinta)_20%,transparent)]`}
          >
            Repetir la entrada
          </button>
          <button
            type="button"
            onClick={() => {
              listo.current = false;
              setSrc(vista(m, `&apertura=1&t=${Date.now()}`));
            }}
            className={`${boton} border border-[color-mix(in_srgb,var(--tinta)_20%,transparent)]`}
          >
            Ver la apertura
          </button>
        </div>
      </div>
    </section>
  );
}

function describirVelocidad(v: number, recomendada: number) {
  const x = `×${v.toFixed(2).replace(".", ",")}`;
  return Math.abs(v - recomendada) < 0.025 ? `${x}, la recomendada` : x;
}
