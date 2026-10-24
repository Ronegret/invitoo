"use client";

import { useId, useState } from "react";
import { ui } from "@/components/panel/estilos";
import { guardarDisenoDirecto } from "@/lib/momentos/acciones-control";
import { ESTILOS_PASE, MAX_FRASE, type DisenoDirecto } from "@/lib/momentos/diseno";
import VistaPantalla from "./VistaPantalla";

/**
 * «Diseño de la pantalla», dentro de `ControlDirecto`: el estilo del pase,
 * el marco con las iniciales, la frase de bienvenida, los rótulos de los
 * momentos y las tarjetas manuscritas. Vista previa en vivo (los cambios
 * llegan al iframe por postMessage); «Guardar» lo lleva a la TV del salón
 * y a la página de subida.
 */
export default function DisenoPantalla({
  slug,
  inicial,
  pareja,
  plantilla,
  onGuardado,
}: {
  slug: string;
  inicial: DisenoDirecto;
  pareja: { a: string; b: string };
  plantilla: string;
  onGuardado?: (d: DisenoDirecto) => void;
}) {
  const [d, setD] = useState(inicial);
  const [guardado, setGuardado] = useState(inicial);
  const [estado, setEstado] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const id = useId();
  const cambiado = JSON.stringify(d) !== JSON.stringify(guardado);
  const poner = <K extends keyof DisenoDirecto>(k: K, v: DisenoDirecto[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setEstado(null);
  };

  async function guardar() {
    setOcupado(true);
    try {
      const r = await guardarDisenoDirecto(slug, d);
      if (r.ok) {
        setGuardado(r.diseno);
        setD(r.diseno);
        setEstado("Guardado. La pantalla del salón lo recoge en unos segundos.");
        onGuardado?.(r.diseno);
      } else setEstado(r.error);
    } catch {
      setEstado("No hay conexión. Probad otra vez.");
    }
    setOcupado(false);
  }

  return (
    <section className={ui.tarjeta} aria-labelledby={`${id}-t`}>
      <h3 id={`${id}-t`} className={ui.h2}>Diseño de la pantalla</h3>
      <p className={`mt-1 ${ui.texto} ${ui.suave}`}>
        Con los colores y la letra de vuestra invitación. Lo que cambiéis se ve aquí al momento; al guardar, también en la TV.
      </p>

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div className="lg:sticky lg:top-6">
          <VistaPantalla diseno={d} pareja={pareja} plantilla={plantilla} />
        </div>

        <div className="mt-5 space-y-5 lg:mt-0">
          <fieldset>
            <legend className={ui.etiqueta}>Estilo del pase</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {ESTILOS_PASE.map((x) => (
                <label
                  key={x.id}
                  className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--acento)] ${d.estilo === x.id ? "border-[var(--acento)] bg-[var(--acento-claro)]" : "border-[var(--linea)]"}`}
                >
                  <input
                    type="radio"
                    name={`${id}-estilo`}
                    checked={d.estilo === x.id}
                    onChange={() => poner("estilo", x.id)}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--acento)]"
                  />
                  <span>
                    <span className="block font-medium">{x.nombre}</span>
                    <span className={`block text-[0.9rem] leading-snug ${ui.suave}`}>{x.descripcion}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={`${id}-frase`} className={ui.etiqueta}>Frase de bienvenida</label>
            <input
              id={`${id}-frase`}
              value={d.frase}
              maxLength={MAX_FRASE}
              onChange={(ev) => poner("frase", ev.target.value)}
              placeholder="Gracias por compartir este día con nosotros"
              className={ui.campo}
            />
            <p className={`mt-1 text-right text-[0.85rem] tabular-nums ${ui.suave}`}>{d.frase.length} / {MAX_FRASE}</p>
          </div>

          <div className="space-y-2">
            <Casilla id={`${id}-marco`} texto="Marco con vuestras iniciales" ayuda="Una línea fina alrededor, con las iniciales arriba." valor={d.marco} onCambio={(v) => poner("marco", v)} />
            <Casilla id={`${id}-rotulos`} texto="Rótulo al lanzar un momento" ayuda="«Primer baile», a pantalla completa, con las palabras subiendo." valor={d.rotulos} onCambio={(v) => poner("rotulos", v)} />
            <Casilla id={`${id}-mano`} texto="Mensajes escritos a mano" ayuda="Como tarjetas, con letra manuscrita. Si no, en la letra de la invitación." valor={d.manuscritas} onCambio={(v) => poner("manuscritas", v)} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={guardar} disabled={ocupado || !cambiado} className={ui.botonLleno}>
              {ocupado ? "Guardando…" : "Guardar diseño"}
            </button>
            {cambiado && (
              <button type="button" onClick={() => setD(guardado)} className={ui.boton}>
                Deshacer
              </button>
            )}
          </div>
          {estado && (
            <p role="status" className={`text-[0.95rem] ${ui.suave}`}>
              {estado}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Casilla({ id, texto, ayuda, valor, onCambio }: { id: string; texto: string; ayuda: string; valor: boolean; onCambio: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl px-1 py-2">
      <input id={id} type="checkbox" checked={valor} onChange={(e) => onCambio(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--acento)]" />
      <span>
        <span className="block font-medium">{texto}</span>
        <span className="block text-[0.9rem] leading-snug text-[var(--suave)]">{ayuda}</span>
      </span>
    </label>
  );
}
