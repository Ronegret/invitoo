"use client";

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { confirmarAsistencia, type Resultado } from "@/app/acciones";
import SelloAlianzas from "@/components/SelloAlianzas";
import { ALERGENOS, BUS, MENUS, TEXTO_PERMISO_SALUD, type Bus, type Menu } from "@/lib/rsvp";
import { useInvitado } from "./invitado";

/**
 * Confirmación de asistencia.
 *
 * SIN LOGIN. Pedirle a la tía Mari que se cree una cuenta es el mayor
 * generador de fricción posible en este producto: un nombre y ya está.
 *
 * Una ficha por persona —nombre, menú y alergias— porque el catering no
 * cocina para «Los Fernández, 3», cocina para tres platos con tres alergias.
 * El menú, las alergias y el autobús solo aparecen si esa boda los pide, y
 * solo si el invitado ha dicho que viene.
 *
 * Funciona sin JavaScript (formulario de toda la vida contra la server
 * action) y, con JavaScript, valida con frases que se entienden, recuerda
 * la respuesta en este móvil y deja corregirla.
 *
 * Contrato con el servidor: BRIEF-EQUIPO.md, «Contrato del RSVP».
 */

// Menús, alérgenos UE y autobús: una sola lista, la de `lib/rsvp.ts`
// (la comparten este formulario, la acción de servidor y el panel).

type Persona = {
  nombre: string;
  menu: Menu;
  alergenos: string[];
  texto: string;
  /** Permiso para compartir sus alergias (art. 9 RGPD). */
  permiso?: boolean;
  /** El invitado ha tocado el nombre: ya no se rellena con el del enlace. */
  editado?: boolean;
};
type Respuesta = {
  asiste: "si" | "no";
  personas: Persona[];
  bus: Bus;
  parada: string;
  mensaje: string;
  telefono: string;
};

const CUPO_SIN_TOKEN = 8;
const vacia = (): Persona => ({ nombre: "", menu: "adulto", alergenos: [], texto: "" });

/*
 * La respuesta se recuerda en este móvil para que, al volver, el invitado
 * vea «ya nos lo dijiste» y pueda corregirla. Es una comodidad: la que
 * cuenta es la del servidor.
 */
const oyentesGuardada = new Set<() => void>();
const claveDe = (slug: string) => `invitoo:rsvp:${slug}`;
function suscribirGuardada(f: () => void) {
  oyentesGuardada.add(f);
  window.addEventListener("storage", f);
  return () => {
    oyentesGuardada.delete(f);
    window.removeEventListener("storage", f);
  };
}
function leerTexto(slug: string): string | null {
  try {
    return window.localStorage.getItem(claveDe(slug));
  } catch {
    return null;
  }
}
function interpretar(t: string | null): Respuesta | null {
  if (!t) return null;
  try {
    const r = JSON.parse(t) as Respuesta;
    return Array.isArray(r?.personas) && r.personas.length ? r : null;
  } catch {
    return null;
  }
}
function guardar(slug: string, r: Respuesta) {
  try {
    window.localStorage.setItem(claveDe(slug), JSON.stringify(r));
  } catch {
    /* modo privado: la respuesta está en el servidor, que es lo que importa */
  }
  oyentesGuardada.forEach((f) => f());
}
const nada = () => () => {};

export default function Rsvp({
  slug,
  pideMenu,
  pideAlergias,
  pideBus,
}: {
  slug: string;
  pideMenu?: boolean;
  pideAlergias?: boolean;
  pideBus?: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState<Resultado | null, FormData>(
    confirmarAsistencia,
    null,
  );
  const invitado = useInvitado(slug);
  const cupo = invitado?.cupo ?? CUPO_SIN_TOKEN;

  // `false` en el servidor y al hidratar; `true` después. Sin efecto.
  const hidratado = useSyncExternalStore(nada, () => true, () => false);
  const textoGuardado = useSyncExternalStore(
    suscribirGuardada,
    () => leerTexto(slug),
    () => null,
  );
  const hecha = useMemo(() => interpretar(textoGuardado), [textoGuardado]);

  const [asiste, setAsiste] = useState<"si" | "no" | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([vacia()]);
  const [bus, setBus] = useState<Bus>("no");
  const [parada, setParada] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [telefono, setTelefono] = useState("");
  const [faltas, setFaltas] = useState<{ asiste?: boolean; nombres?: number[] }>({});
  /**
   * Se está corrigiendo mientras el resultado sea el mismo que había al
   * pulsar «Corregir»: en cuanto llega una respuesta nueva, se deja de
   * corregir sin tener que tocar el estado desde un efecto.
   */
  const [corrigiendoCon, setCorrigiendoCon] = useState<{ r: Resultado | null } | null>(null);
  const corrigiendo = corrigiendoCon !== null && corrigiendoCon.r === estado;
  const enviada = useRef<Respuesta | null>(null);
  const exito = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  // Respuesta aceptada: se recuerda en este móvil y el foco va al sello.
  useEffect(() => {
    if (!estado?.ok) return;
    if (enviada.current) guardar(slug, enviada.current);
    exito.current?.focus();
    // Momento firma 3: el «sí» se nota en la mano. Un toque de 10 ms.
    if (enviada.current?.asiste === "si") {
      let quieto = true;
      try {
        quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        /* noop */
      }
      if (!quieto) {
        // El golpe del sello (a los 300 ms, cuando toca el papel): un toque
        // corto y su eco. Y una lluvia de pétalos y confeti dorado, del
        // motor compartido (solo se descarga ahora, al decir que sí).
        const t = window.setTimeout(() => {
          try {
            navigator.vibrate?.([14, 60, 8]);
          } catch {
            /* noop */
          }
          // Desde el sello (el contenedor del SelloAlianzas grande).
          const r = exito.current?.parentElement?.querySelector(".rsvp-estampa")?.getBoundingClientRect();
          void import("@/components/flores/motor").then((m) =>
            r ? m.motor().celebrar(r.left + r.width / 2, r.top + r.height / 2) : m.motor().celebrar(),
          );
        }, 300);
        return () => window.clearTimeout(t);
      }
    }
  }, [estado, slug]);

  // Enlace personal: el nombre viene hecho mientras no se escriba otro.
  const ps = personas.map((p, i) =>
    i === 0 && !p.editado && invitado ? { ...p, nombre: invitado.nombre } : p,
  );

  function cargar(r: Respuesta) {
    setAsiste(r.asiste);
    setPersonas(r.personas.map((p) => ({ ...vacia(), ...p, editado: true })));
    setBus(r.bus ?? "no");
    setParada(r.parada ?? "");
    setMensaje(r.mensaje ?? "");
    setTelefono(r.telefono ?? "");
  }

  function corregir() {
    if (hecha) cargar(hecha);
    setCorrigiendoCon({ r: estado });
    requestAnimationFrame(() =>
      formRef.current?.querySelector<HTMLElement>("input:not([type=hidden])")?.focus(),
    );
  }

  function cambiarNumero(n: number) {
    const total = Math.max(1, Math.min(cupo, n));
    setPersonas((xs) =>
      total > xs.length
        ? [...xs, ...Array.from({ length: total - xs.length }, () => vacia())]
        : xs.slice(0, total),
    );
  }

  function tocar(i: number, cambio: Partial<Persona>) {
    const marca = cambio.nombre !== undefined ? { editado: true } : {};
    setPersonas((xs) => xs.map((p, j) => (j === i ? { ...p, ...cambio, ...marca } : p)));
    if (cambio.nombre !== undefined && faltas.nombres?.includes(i)) {
      setFaltas((f) => ({ ...f, nombres: f.nombres?.filter((x) => x !== i) }));
    }
  }

  const viene = asiste === "si";
  const visibles = asiste === "no" ? ps.slice(0, 1) : ps.slice(0, Math.max(1, Math.min(cupo, ps.length)));
  // Sin JavaScript se enseña todo: no hay quien despliegue nada.
  const detalles = viene || (!hidratado && asiste === null);

  // ——— Ya respondió ———
  const mostrarHecha = Boolean(estado?.ok || hecha) && !corrigiendo;
  if (mostrarHecha) {
    const r = hecha;
    const si = r ? r.asiste === "si" : asiste !== "no";
    // Recién respondido (no al volver otro día): ahí va la celebración.
    const recien = Boolean(estado?.ok);
    const quien = (invitado?.nombre ?? r?.personas[0]?.nombre ?? ps[0]?.nombre ?? "").trim().split(/\s+/)[0];
    const titular = si
      ? quien
        ? `Os esperamos, ${quien}.`
        : "Os esperamos."
      : "Os echaremos de menos.";
    const texto =
      // Con «no», siempre la frase cálida (el servidor repetiría el titular).
      !si
        ? "Gracias por decírnoslo con cariño. Levantaremos una copa por ti, y te contaremos cómo fue."
        : estado?.ok && estado.mensaje
          ? estado.mensaje
          : "Contamos contigo. Nos vemos allí.";
    return (
      <section id="confirmar" className="scroll-mt-16 px-6 py-24 text-center" aria-live="polite">
        <div
          className={`relative mx-auto w-fit text-[var(--acento-texto,var(--acento))] ${
            !si ? "opacity-55" : recien ? "rsvp-estampa" : "rsvp-sello"
          }`}
          aria-hidden
        >
          <SelloAlianzas size={84} />
          {si && recien && (
            <span className="rsvp-polvo">
              {Array.from({ length: 14 }, (_, i) => (
                <i key={i} style={{ "--a": `${(i * 360) / 14 + (i % 2) * 9}deg`, "--d": `${44 + (i % 3) * 14}px` } as React.CSSProperties} />
              ))}
            </span>
          )}
        </div>
        <h2
          ref={exito}
          tabIndex={-1}
          className="display mx-auto mt-9 max-w-[22ch] text-[clamp(2.1rem,9vw,3.2rem)] italic [text-wrap:balance] outline-none"
        >
          {titular}
        </h2>
        <p className="mx-auto mt-5 max-w-[28rem] text-[1.0625rem] leading-relaxed [text-wrap:pretty]">{texto}</p>
        {r && si && (
          <p className="mx-auto mt-6 max-w-[28rem] text-[1.0625rem] leading-relaxed">
            {r.personas.length === 1
              ? `Apuntado: ${r.personas[0].nombre}.`
              : `Apuntados: ${r.personas.map((p) => p.nombre).join(", ")}.`}
          </p>
        )}
        {r && (
          <button
            type="button"
            onClick={corregir}
            className="mt-9 inline-flex min-h-12 items-center rounded-full border border-current/30 px-7 text-[1rem] underline-offset-4 transition-colors duration-150 hover:border-current/60 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--acento-texto,var(--acento))]"
          >
            Corregir mi respuesta
          </button>
        )}
        <style>{ESTILO_SELLO}</style>
      </section>
    );
  }

  // ——— Formulario ———
  const etiqueta = "block text-[1rem] font-medium leading-snug";
  const ayuda = "mt-1 block text-[1rem] leading-snug opacity-80";
  const campo =
    "mt-2 w-full rounded-none border-b-2 border-current/30 bg-transparent py-3 text-[1.125rem] outline-none placeholder:text-current/50 focus:border-[var(--acento-texto,var(--acento))]";
  const foco =
    "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--acento-texto,var(--acento))]";
  const ficha =
    `relative flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-current/25 px-4 text-center text-[1.0625rem] leading-tight transition-colors duration-150 has-[:checked]:border-[var(--acento)] has-[:checked]:bg-[var(--acento)] has-[:checked]:text-[var(--sobre-acento,#fff)] ${foco}`;
  const oculto = "absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0";
  const error = "mt-3 text-[1rem] font-medium text-[var(--acento-texto,var(--acento))]";

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    const nuevasFaltas: typeof faltas = {};
    if (!asiste) nuevasFaltas.asiste = true;
    const sinNombre = visibles.map((p, i) => (p.nombre.trim().length < 2 ? i : -1)).filter((i) => i >= 0);
    if (sinNombre.length) nuevasFaltas.nombres = sinNombre;
    if (nuevasFaltas.asiste || nuevasFaltas.nombres) {
      e.preventDefault();
      setFaltas(nuevasFaltas);
      const primero = nuevasFaltas.asiste
        ? formRef.current?.querySelector<HTMLElement>('input[name="asiste"]')
        : formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(`${id}-p${sinNombre[0]}-nombre`)}`);
      primero?.focus();
      return;
    }
    setFaltas({});
    enviada.current = {
      asiste: asiste ?? "si",
      personas: visibles.map(({ nombre, menu, alergenos, texto, permiso }) => ({
        nombre: nombre.trim(),
        menu,
        alergenos,
        texto,
        permiso: Boolean(permiso),
      })),
      bus: viene && pideBus ? bus : "no",
      parada: viene && pideBus && bus !== "no" ? parada.trim() : "",
      mensaje: mensaje.trim(),
      telefono: telefono.trim(),
    };
  }

  return (
    <section id="confirmar" className="scroll-mt-16 px-6 py-24">
      <div className="mx-auto max-w-[32rem]">
        <h2 className="display text-center text-[clamp(2.2rem,9vw,3.2rem)]">
          ¿Vienes?
        </h2>
        <p className="mt-5 text-center text-[1.0625rem] leading-relaxed">
          {corrigiendo
            ? "Cambia lo que haga falta y vuelve a enviarlo. Nos quedamos con lo último."
            : "Con que nos lo digas antes de un mes de la boda nos vale. Si cambia algo, se corrige aquí mismo."}
        </p>

        <form
          ref={formRef}
          action={enviar}
          onSubmit={alEnviar}
          noValidate={hidratado}
          className="mt-12 flex flex-col gap-10"
        >
          <input type="hidden" name="slug" value={slug} />
          {/* Nombre antiguo del campo, por si el servidor aún lo espera. */}
          <input type="hidden" name="invitacion" value={slug} />
          {invitado && <input type="hidden" name="token" value={invitado.token} />}
          <input type="hidden" name="personas" value={visibles.length} />
          {/* Al corregir: el nombre con el que se guardó, para que el
              servidor actualice esa fila aunque se cambie el nombre. */}
          {corrigiendo && hecha && (
            <input type="hidden" name="nombre_previo" value={hecha.personas[0]?.nombre ?? ""} />
          )}

          {/* ——— ¿Vienes? ——— */}
          <fieldset aria-describedby={faltas.asiste ? `${id}-asiste-error` : undefined}>
            <legend className={etiqueta}>¿Contamos contigo?</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(
                [
                  ["si", "Sí, allí estaré"],
                  ["no", "No voy a poder"],
                ] as const
              ).map(([v, t]) => (
                <label key={v} className={`${ficha} min-h-16 text-[1.125rem]`}>
                  {/* El radio cubre la ficha entera y es invisible, pero NO
                      es sr-only: así el navegador puede enseñar su aviso de
                      «obligatorio» cuando no hay JavaScript, y el foco se
                      dibuja en la ficha. */}
                  <input
                    type="radio"
                    name="asiste"
                    value={v}
                    required
                    checked={asiste === v}
                    onChange={() => {
                      setAsiste(v);
                      setFaltas((f) => ({ ...f, asiste: false }));
                    }}
                    className={oculto}
                  />
                  {t}
                </label>
              ))}
            </div>
            {faltas.asiste && (
              <p id={`${id}-asiste-error`} role="alert" className={error}>
                Dinos si vienes o no.
              </p>
            )}
          </fieldset>

          {/* ——— Cuántos ——— */}
          {detalles && cupo > 1 && (
            <div>
              <p className={etiqueta} id={`${id}-cuantos`}>
                ¿Cuántos venís?
              </p>
              <span className={ayuda}>
                Contándote a ti.{invitado ? ` Tenéis ${cupo} plazas.` : ""}
              </span>
              <div
                role="group"
                aria-labelledby={`${id}-cuantos`}
                className="mt-4 flex items-center gap-5"
              >
                <button
                  type="button"
                  onClick={() => cambiarNumero(visibles.length - 1)}
                  disabled={!hidratado || visibles.length <= 1}
                  aria-label="Uno menos"
                  className="stepper grid h-14 w-14 place-items-center rounded-full border-2 border-current/35 text-[1.6rem] leading-none disabled:opacity-35"
                >
                  <span aria-hidden>−</span>
                </button>
                <output
                  aria-live="polite"
                  className="display min-w-[3ch] text-center text-[2.4rem] tabular-nums"
                >
                  {visibles.length}
                </output>
                <button
                  type="button"
                  onClick={() => cambiarNumero(visibles.length + 1)}
                  disabled={!hidratado || visibles.length >= cupo}
                  aria-label="Uno más"
                  className="stepper grid h-14 w-14 place-items-center rounded-full border-2 border-current/35 text-[1.6rem] leading-none disabled:opacity-35"
                >
                  <span aria-hidden>+</span>
                </button>
              </div>
            </div>
          )}

          {/* ——— Una ficha por persona ——— */}
          {visibles.map((p, i) => {
            const base = `${id}-p${i}`;
            const sinNombre = faltas.nombres?.includes(i);
            const varias = visibles.length > 1;
            return (
              <fieldset
                key={i}
                className={varias ? "rounded-3xl border-2 border-current/15 px-5 pb-6 pt-2" : ""}
              >
                <legend className={varias ? "px-2 display text-[1.5rem]" : "sr-only"}>
                  {i === 0 ? (varias ? "Tú" : "Tus datos") : `Persona ${i + 1}`}
                </legend>

                <div className={varias ? "mt-2" : ""}>
                  <label htmlFor={`${base}-nombre`} className={etiqueta}>
                    {i === 0 ? "Tu nombre" : "Nombre"}
                  </label>
                  <input
                    id={`${base}-nombre`}
                    name={`p${i}_nombre`}
                    value={p.nombre}
                    onChange={(e) => tocar(i, { nombre: e.target.value })}
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete={i === 0 ? "name" : "off"}
                    enterKeyHint="next"
                    placeholder={i === 0 ? "Nombre y apellido" : ""}
                    aria-invalid={sinNombre || undefined}
                    aria-describedby={sinNombre ? `${base}-nombre-error` : undefined}
                    className={campo}
                  />
                  {sinNombre && (
                    <p id={`${base}-nombre-error`} role="alert" className={error}>
                      {i === 0 ? "Nos falta tu nombre." : "Nos falta su nombre."}
                    </p>
                  )}
                </div>

                {detalles && pideMenu && (
                  <fieldset className="mt-7">
                    <legend className={etiqueta}>Menú</legend>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {MENUS.map(({ id: v, nombre: t }) => (
                        <label key={v} className={ficha}>
                          <input
                            type="radio"
                            name={`p${i}_menu`}
                            value={v}
                            checked={p.menu === v}
                            onChange={() => tocar(i, { menu: v })}
                            className={oculto}
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                {detalles && pideAlergias && (
                  <details className="group mt-7">
                    <summary
                      className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-xl text-[1.0625rem] font-medium focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))] [&::-webkit-details-marker]:hidden`}
                    >
                      <span>
                        ¿Alguna alergia o intolerancia?
                        {p.alergenos.length > 0 && (
                          <span className="ml-2 font-normal opacity-80">({p.alergenos.length})</span>
                        )}
                      </span>
                      <span aria-hidden className="text-[1.4rem] leading-none transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <fieldset className="mt-4">
                      <legend className="sr-only">Alérgenos</legend>
                      <div className="grid grid-cols-2 gap-2.5">
                        {ALERGENOS.map(({ id: v, nombre: t }) => (
                          <label key={v} className={`${ficha} min-h-13 rounded-xl text-[1rem]`}>
                            <input
                              type="checkbox"
                              name={`p${i}_alergenos`}
                              value={v}
                              checked={p.alergenos.includes(v)}
                              onChange={(e) =>
                                tocar(i, {
                                  alergenos: e.target.checked
                                    ? [...p.alergenos, v]
                                    : p.alergenos.filter((x) => x !== v),
                                })
                              }
                              className={oculto}
                            />
                            {t}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <label htmlFor={`${base}-alergias`} className={`${etiqueta} mt-6`}>
                      Algo más que deba saber la cocina
                    </label>
                    <textarea
                      id={`${base}-alergias`}
                      name={`p${i}_alergias_texto`}
                      value={p.texto}
                      onChange={(e) => tocar(i, { texto: e.target.value })}
                      rows={2}
                      maxLength={400}
                      placeholder="Celiaquía estricta, sin cerdo…"
                      className={`${campo} resize-none`}
                    />
                    {/* Dato de salud (art. 9 RGPD): hace falta su permiso
                        expreso para pasárselo a los novios y al catering.
                        Solo se pide si ha dicho algo; sin JS, siempre. */}
                    {(!hidratado || p.alergenos.length > 0 || p.texto.trim().length > 0) && (
                      <label className="mt-6 flex cursor-pointer items-start gap-3 pr-12 text-[1rem] leading-snug">
                        <input
                          type="checkbox"
                          name={`p${i}_consentimiento_salud`}
                          value="si"
                          checked={Boolean(p.permiso)}
                          onChange={(e) => tocar(i, { permiso: e.target.checked })}
                          className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-[var(--acento)]"
                        />
                        <span>
                          {TEXTO_PERMISO_SALUD}.{" "}
                          <span className="opacity-80">
                            Si no lo marcas, solo les diremos que te pregunten.{" "}
                            <a href="/privacidad#invitados" target="_blank" rel="noopener" className="underline underline-offset-4">
                              Privacidad
                            </a>
                          </span>
                        </span>
                      </label>
                    )}
                  </details>
                )}
              </fieldset>
            );
          })}

          {/* ——— Autobús ——— */}
          {detalles && pideBus && (
            <fieldset>
              <legend className={etiqueta}>¿Cogéis el autobús que ponemos?</legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {BUS.map(({ id: v, nombre: t }) => (
                  <label key={v} className={ficha}>
                    <input
                      type="radio"
                      name="bus"
                      value={v}
                      checked={bus === v}
                      onChange={() => setBus(v)}
                      className={oculto}
                    />
                    {t}
                  </label>
                ))}
              </div>
              {(bus !== "no" || !hidratado) && (
                <div className="mt-6">
                  <label htmlFor={`${id}-parada`} className={etiqueta}>
                    ¿En qué parada subís? <span className="font-normal opacity-80">(si lo sabéis)</span>
                  </label>
                  <input
                    id={`${id}-parada`}
                    name="parada"
                    value={parada}
                    onChange={(e) => setParada(e.target.value)}
                    maxLength={120}
                    className={campo}
                  />
                </div>
              )}
            </fieldset>
          )}

          {/* ——— Lo demás ——— */}
          {(asiste !== null || !hidratado) && (
            <>
              {detalles && (
                <div>
                  <label htmlFor={`${id}-telefono`} className={etiqueta}>
                    Un teléfono <span className="font-normal opacity-80">(opcional)</span>
                  </label>
                  <span className={ayuda}>Solo por si cambia algo el día antes.</span>
                  <input
                    id={`${id}-telefono`}
                    name="telefono"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    maxLength={30}
                    className={campo}
                  />
                </div>
              )}
              <div>
                <label htmlFor={`${id}-mensaje`} className={etiqueta}>
                  ¿Algo que queráis decirnos? <span className="font-normal opacity-80">(opcional)</span>
                </label>
                <textarea
                  id={`${id}-mensaje`}
                  name="mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={3}
                  maxLength={600}
                  className={`${campo} resize-none`}
                />
              </div>
            </>
          )}

          <div aria-live="assertive">
            {estado && !estado.ok && (
              <p role="alert" className={error}>
                {estado.error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pendiente}
            className="enviar inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[var(--acento)] px-8 text-[1.0625rem] font-medium tracking-[0.04em] text-[var(--sobre-acento,#fff)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--acento-texto,var(--acento))] disabled:opacity-60"
          >
            {pendiente ? (
              <>
                <SelloAlianzas size={22} girando />
                Enviando…
              </>
            ) : corrigiendo ? (
              "Guardar los cambios"
            ) : asiste === "no" ? (
              "Enviar"
            ) : (
              "Confirmar"
            )}
          </button>
          <p className="-mt-4 text-center text-[0.95rem] leading-snug opacity-80">
            Tus datos solo los ven los novios.{" "}
            <a href="/privacidad#invitados" target="_blank" rel="noopener" className="underline underline-offset-4">
              Cómo los cuidamos
            </a>
          </p>
          {corrigiendo && (
            <button
              type="button"
              onClick={() => setCorrigiendoCon(null)}
              className="-mt-6 inline-flex min-h-12 items-center justify-center text-[1rem] underline underline-offset-4"
            >
              Dejarlo como estaba
            </button>
          )}
        </form>
      </div>
      <style>{`
        #confirmar .stepper, #confirmar .enviar { transition: scale 120ms ease-out, opacity 150ms ease; }
        #confirmar .stepper:not(:disabled):active, #confirmar .enviar:not(:disabled):active { scale: .97; }
        #confirmar .stepper:focus-visible { outline: 3px solid var(--acento-texto, var(--acento)); outline-offset: 2px; }
      `}</style>
    </section>
  );
}

/**
 * El sello se POSA sobre el papel: baja un poco girado, desenfocado, y se
 * asienta sin rebote, como cuando se deja con cuidado. Después late, muy
 * despacio y muy poco (dos pulsos y una pausa larga), con el ritmo del
 * movimiento de la boda. En «mínimo» y con menos movimiento, no late.
 */
const ESTILO_SELLO = `
.rsvp-sello {
  animation:
    posa calc(var(--mov-dur, 1100ms) * 1.2) cubic-bezier(.25,.1,.12,1) both,
    latido 4.2s cubic-bezier(.45,0,.55,1) calc(var(--mov-dur, 1100ms) * 1.2 + 600ms) infinite;
}
[data-mov-estilo="minimo"] .rsvp-sello {
  animation: posa calc(var(--mov-dur, 700ms) * 1.2) cubic-bezier(.25,.1,.12,1) both;
}
@keyframes posa {
  from { opacity: 0; transform: translateY(-10px) scale(1.12) rotate(-8deg); filter: blur(3px); }
  60%  { opacity: 1; filter: blur(0); }
  to   { opacity: 1; transform: none; filter: none; }
}
@keyframes latido {
  0%, 30%, 100% { transform: none; }
  8%  { transform: scale(1.035); }
  15% { transform: scale(1.005); }
  22% { transform: scale(1.022); }
}
/* Momento firma 3: el sello se ESTAMPA. Llega grande, cae y se asienta con
   un solo rebote mínimo (--ease-sello, 3 %); al tocar papel suelta polvo de
   oro durante 400 ms. Solo al responder «sí» en esta visita. */
.rsvp-estampa > svg {
  animation: estampa 520ms var(--ease-sello, cubic-bezier(.3,1.3,.56,1)) both;
}
@keyframes estampa {
  from { opacity: 0; transform: scale(1.15) rotate(-6deg); filter: blur(1.5px); }
  35%  { opacity: 1; filter: none; }
  to   { opacity: 1; transform: none; filter: none; }
}
.rsvp-polvo { position: absolute; left: 50%; top: 55%; width: 0; height: 0; pointer-events: none; }
.rsvp-polvo i {
  position: absolute; left: -2px; top: -2px; width: 4px; height: 4px; border-radius: 50%;
  background: radial-gradient(circle, #f3dfa8 0%, #c9a45e 60%, transparent 70%);
  opacity: 0;
  animation: polvo 400ms cubic-bezier(.22,.61,.36,1) 300ms both;
}
.rsvp-polvo i:nth-child(3n) { width: 3px; height: 3px; }
@keyframes polvo {
  0%   { opacity: 0; transform: rotate(var(--a)) translateY(-18px) scale(.6); }
  25%  { opacity: 1; }
  100% { opacity: 0; transform: rotate(var(--a)) translateY(calc(var(--d) * -1)) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .rsvp-sello, .rsvp-estampa > svg { animation: none; }
  .rsvp-polvo { display: none; }
}
`;
