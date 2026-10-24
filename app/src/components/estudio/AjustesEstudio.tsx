"use client";

import { useState, useTransition } from "react";
import { guardarContratoEstudio, guardarOnlineHastaEstudio } from "@/app/estudio/acciones";
import { ANADIDOS_BODA, INFO_ANADIDO, INFO_PLAN, PLANES_BODA, type AnadidoBoda, type PlanBoda } from "@/lib/planes-boda";
import { fijarPlanDirecto } from "@/lib/momentos/acciones-control";
import { PLANES_MOMENTOS, type PlanMomentos } from "@/lib/momentos/planes";

/**
 * Lo que solo toca el estudio: hasta cuándo sigue en línea la invitación y
 * el plan de «En directo» contratado (más los años extra de conservación).
 * Va aparte del formulario principal: cada cosa se guarda con su botón.
 */
export default function AjustesEstudio({
  id,
  slug,
  onlineHasta,
  porDefecto,
  plan,
  anosExtra,
  contrato,
}: {
  id: string;
  slug: string;
  /** `YYYY-MM-DD` guardada, o null. */
  onlineHasta: string | null;
  /** La fecha que se aplica si se deja vacía (boda + 12 meses), `YYYY-MM-DD`. */
  porDefecto: string;
  plan: PlanMomentos | null;
  anosExtra: number;
  /** Plan de la boda y añadidos (`obtenerContrato`). */
  contrato: { plan: string; anadidos: string[] };
}) {
  const [planBoda, setPlanBoda] = useState<PlanBoda>((PLANES_BODA as string[]).includes(contrato.plan) ? (contrato.plan as PlanBoda) : "invitoo");
  const [anadidos, setAnadidos] = useState<AnadidoBoda[]>(contrato.anadidos.filter((a): a is AnadidoBoda => (ANADIDOS_BODA as string[]).includes(a)));
  const [fecha, setFecha] = useState(onlineHasta ?? "");
  const [elPlan, setPlan] = useState<PlanMomentos>(plan ?? "album");
  const [anos, setAnos] = useState(anosExtra);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendiente, empezar] = useTransition();

  const campo =
    "mt-2 w-full border-b border-[var(--tinta)]/25 bg-transparent py-2.5 text-[1rem] outline-none focus:border-[var(--acento)]";
  const etiqueta = "block text-[0.76rem] uppercase tracking-[0.24em] opacity-55";
  const boton =
    "mt-5 min-h-12 rounded-full border border-[var(--tinta)]/30 px-6 text-[0.78rem] uppercase tracking-[0.18em] disabled:opacity-50";

  return (
    <section aria-labelledby="t-ajustes-estudio" className="mx-auto max-w-[44rem] border-t border-[var(--tinta)]/15 px-5 py-14">
      <h2 id="t-ajustes-estudio" className="display text-[1.8rem]">Plan, plazos y En directo</h2>
      <p className="mt-2 text-[0.95rem] opacity-70">Solo lo ve el estudio. Cada bloque se guarda con su botón.</p>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          empezar(async () => {
            const r = await guardarContratoEstudio(id, planBoda, anadidos);
            setAviso(r.ok ? { ok: true, texto: r.mensaje } : { ok: false, texto: r.error });
          });
        }}
      >
        <fieldset>
          <legend className={etiqueta}>Plan de la boda</legend>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            {PLANES_BODA.map((p) => (
              <label key={p} className="flex min-h-12 items-center gap-3 text-[1rem]">
                <input type="radio" name="plan_boda" value={p} checked={planBoda === p} onChange={() => setPlanBoda(p)} className="h-5 w-5 accent-[var(--acento)]" />
                {INFO_PLAN[p].nombre}
                <span className="opacity-60">{INFO_PLAN[p].precio} €</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-5">
          <legend className={etiqueta}>Añadidos</legend>
          <div className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {ANADIDOS_BODA.map((a) => (
              <label key={a} className="flex min-h-12 items-center gap-3 text-[1rem]">
                <input
                  type="checkbox"
                  checked={anadidos.includes(a)}
                  onChange={(e) => setAnadidos((x) => (e.target.checked ? [...x, a] : x.filter((y) => y !== a)))}
                  className="h-5 w-5 accent-[var(--acento)]"
                />
                {INFO_ANADIDO[a].nombre}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-2 text-[0.88rem] opacity-65">
          Lo fija solo el pago al «Vincular a una boda» desde la bandeja de reservas. Aquí, para lo cobrado fuera de Stripe, regalos o correcciones.
        </p>
        <button type="submit" disabled={pendiente} className={boton}>Guardar el plan</button>
      </form>

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            empezar(async () => {
              const r = await guardarOnlineHastaEstudio(id, fecha);
              setAviso(r.ok ? { ok: true, texto: r.mensaje } : { ok: false, texto: r.error });
            });
          }}
        >
          <label>
            <span className={etiqueta}>En línea hasta</span>
            <input type="date" name="online_hasta" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
          </label>
          <p className="mt-2 text-[0.88rem] opacity-65">Vacío: doce meses después de la boda ({porDefecto}).</p>
          <button type="submit" disabled={pendiente} className={boton}>Guardar la fecha</button>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            empezar(async () => {
              const r = await fijarPlanDirecto(slug, elPlan, anos);
              setAviso(
                r.ok
                  ? { ok: true, texto: `Plan de En directo: ${PLANES_MOMENTOS[elPlan].nombre}${anos ? ` · ${anos} año(s) extra` : ""}.` }
                  : { ok: false, texto: r.error },
              );
            });
          }}
        >
          <label>
            <span className={etiqueta}>Plan de fotos</span>
            <select name="plan" value={elPlan} onChange={(e) => setPlan(e.target.value as PlanMomentos)} className={campo}>
              {Object.values(PLANES_MOMENTOS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.precio ? ` · ${p.precio} €` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-6 block">
            <span className={etiqueta}>Años extra de conservación</span>
            <input
              type="number"
              min={0}
              max={10}
              value={anos}
              onChange={(e) => setAnos(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
              className={campo}
            />
          </label>
          <button type="submit" disabled={pendiente} className={boton}>Fijar el plan</button>
        </form>
      </div>

      <p role="status" className="mt-6 min-h-6 text-[0.95rem]" style={{ color: aviso && !aviso.ok ? "var(--acento)" : undefined }}>
        {aviso?.texto}
      </p>
    </section>
  );
}
