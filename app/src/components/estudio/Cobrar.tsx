"use client";

import { useActionState, useState, useTransition } from "react";
import {
  anularCobroAccion,
  cobrarRestoAccion,
  crearCobroAccion,
  type ResultadoCobro,
} from "@/lib/pagos/acciones-estudio";

/**
 * «Cobrar» del estudio: Rodrigo pone el importe y el concepto (y, si
 * quiere, la boda y la señal) y sale un enlace para mandar por WhatsApp o
 * email. El importe se guarda en el servidor; el enlace solo lleva un token.
 */

const CAMPO =
  "mt-2 min-h-12 w-full rounded-xl border normal-case tracking-normal border-[var(--tinta)]/20 bg-white/80 px-4 text-[1rem] outline-none focus-visible:border-[var(--acento)] focus-visible:ring-2 focus-visible:ring-[var(--acento)]/30";
const ETIQUETA = "block text-[0.8rem] uppercase tracking-[0.18em] opacity-65";
const BOTON =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--tinta)]/25 px-5 text-[0.8rem] uppercase tracking-[0.14em] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)]";
const LLENO = `${BOTON} border-transparent bg-[var(--tinta)] text-[var(--papel)]`;

export type BodaOpcion = { id: string; nombre: string };

export default function NuevoCobro({
  bodas,
  boda,
}: {
  bodas: BodaOpcion[];
  boda?: string;
}) {
  const [r, enviar, pendiente] = useActionState<ResultadoCobro, FormData>(
    crearCobroAccion,
    null,
  );

  return (
    <section
      aria-labelledby="t-cobrar"
      className="rounded-[1.5rem] border border-[var(--tinta)]/12 bg-white/55 p-5 sm:p-8"
    >
      <h2 id="t-cobrar" className="display text-[1.8rem]">
        Cobrar
      </h2>
      <p className="mt-1 text-[0.95rem] opacity-70">
        Para el Estudio y cualquier presupuesto. IVA incluido en el importe.
      </p>

      {/* Tras crear un enlace, el formulario vuelve a empezar (con la señal apagada). */}
      <Formulario
        key={r?.ok ? r.t : 0}
        enviar={enviar}
        pendiente={pendiente}
        bodas={bodas}
        boda={boda}
      />

      <Resultado r={r} />
    </section>
  );
}

function Formulario({
  enviar,
  pendiente,
  bodas,
  boda,
}: {
  enviar: (d: FormData) => void;
  pendiente: boolean;
  bodas: BodaOpcion[];
  boda?: string;
}) {
  const [forma, setForma] = useState<"total" | "senal">("total");
  return (
    <form action={enviar} className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className={ETIQUETA}>
        Importe total (€)
        <input
          name="importe"
          inputMode="decimal"
          required
          placeholder="449"
          autoComplete="off"
          className={CAMPO}
        />
      </label>
      <label className={ETIQUETA}>
        Concepto
        <input
          name="concepto"
          required
          minLength={3}
          maxLength={120}
          placeholder="Estudio: invitación a medida"
          className={CAMPO}
        />
      </label>
      <label className={`${ETIQUETA} sm:col-span-2`}>
        Boda (opcional)
        <select name="boda" defaultValue={boda ?? ""} className={CAMPO}>
          <option value="">Sin boda todavía</option>
          {bodas.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className={ETIQUETA}>
        Pareja (si no hay boda)
        <input
          name="pareja"
          maxLength={120}
          placeholder="Ana y Luis"
          className={CAMPO}
        />
      </label>
      <label className={ETIQUETA}>
        Email (opcional)
        <input name="email" type="email" maxLength={120} className={CAMPO} />
      </label>
      <label className={ETIQUETA}>
        Teléfono para WhatsApp (opcional)
        <input
          name="telefono"
          type="tel"
          maxLength={30}
          placeholder="612 345 678"
          className={CAMPO}
        />
      </label>

      <fieldset className="sm:col-span-2">
        <legend className={ETIQUETA}>Cómo se cobra</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {(
            [
              ["total", "Todo ahora"],
              ["senal", "Señal ahora y el resto después"],
            ] as const
          ).map(([v, t]) => (
            <label
              key={v}
              className="inline-flex min-h-12 cursor-pointer items-center gap-3 rounded-full border border-[var(--tinta)]/20 px-5 text-[1rem] has-[:checked]:border-[var(--tinta)] has-[:checked]:bg-[var(--tinta)] has-[:checked]:text-[var(--papel)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--acento)]"
            >
              <input
                type="radio"
                name="forma"
                value={v}
                checked={forma === v}
                onChange={() => setForma(v)}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
        {forma === "senal" && (
          <label className={`${ETIQUETA} mt-5 block max-w-[12rem]`}>
            Señal (%)
            <input
              name="porcentaje"
              type="number"
              min={10}
              max={90}
              step={1}
              defaultValue={50}
              className={CAMPO}
            />
          </label>
        )}
      </fieldset>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pendiente}
          className={`${LLENO} w-full sm:w-auto`}
        >
          {pendiente ? "Creando…" : "Crear el enlace de pago"}
        </button>
      </div>
    </form>
  );
}

function Resultado({ r }: { r: ResultadoCobro }) {
  if (!r) return <p role="status" aria-live="polite" className="sr-only" />;
  if (!r.ok) {
    return (
      <p role="alert" className="mt-5 text-[1rem] text-[var(--acento)]">
        {r.mensaje}
      </p>
    );
  }
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 rounded-2xl border border-[var(--acento)]/30 bg-[var(--acento)]/[0.05] p-5"
    >
      <p className="text-[1rem] font-medium">{r.mensaje}</p>
      <Compartir
        enlace={r.enlace}
        concepto={r.concepto}
        importe={r.importe}
        telefono={r.telefono}
        email={r.email}
      />
    </div>
  );
}

/** El mensaje para la pareja, el enlace y los tres botones: copiar, WhatsApp y email. */
export function Compartir({
  enlace,
  concepto,
  importe,
  telefono,
  email,
  pareja,
}: {
  enlace: string;
  concepto: string;
  importe: string;
  telefono?: string | null;
  email?: string | null;
  pareja?: string | null;
}) {
  const [copiado, setCopiado] = useState(false);
  const mensaje = `Hola${pareja ? `, ${pareja}` : ""}: aquí tenéis el enlace para pagar «${concepto}» (${importe}, IVA incluido). Se paga en un minuto, con total seguridad: ${enlace}`;
  const digitos = (telefono ?? "").replace(/\D/g, "");
  const numero = digitos.length === 9 ? `34${digitos}` : digitos;
  const whatsapp = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  const correo = `mailto:${email ?? ""}?subject=${encodeURIComponent("Vuestro enlace de pago · Invitoo")}&body=${encodeURIComponent(mensaje)}`;

  return (
    <div className="mt-4">
      <p className="break-all rounded-xl bg-white/80 px-4 py-3 font-mono text-[0.9rem]">
        {enlace}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={BOTON}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(enlace);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            } catch {}
          }}
        >
          {copiado ? "Copiado" : "Copiar enlace"}
        </button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={LLENO}
        >
          Enviar por WhatsApp
        </a>
        <a href={correo} className={BOTON}>
          Enviar por email
        </a>
      </div>
    </div>
  );
}

/** Lo que se puede hacer con un cobro de la lista. */
export function AccionesCobro({
  id,
  pendiente: sinPagar,
  resto,
}: {
  id: string;
  pendiente: boolean;
  /** Si es una señal pagada sin resto todavía: el importe del resto. */
  resto: string | null;
}) {
  const [r, setR] = useState<ResultadoCobro>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, empezar] = useTransition();
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {resto && (
          <button
            type="button"
            disabled={ocupado}
            className={LLENO}
            onClick={() =>
              empezar(async () => setR(await cobrarRestoAccion(id)))
            }
          >
            Cobrar el resto ({resto})
          </button>
        )}
        {sinPagar && (
          <button
            type="button"
            disabled={ocupado}
            className={BOTON}
            onClick={() => {
              if (
                !window.confirm(
                  "¿Anular este enlace? Ya no se podrá pagar con él.",
                )
              )
                return;
              empezar(async () =>
                setAviso((await anularCobroAccion(id)).mensaje),
              );
            }}
          >
            Anular
          </button>
        )}
      </div>
      {aviso && (
        <p role="status" className="mt-2 text-[0.95rem]">
          {aviso}
        </p>
      )}
      <Resultado r={r} />
    </div>
  );
}
