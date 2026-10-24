"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { borrarInvitadoAccion, guardarInvitadoAccion } from "@/app/panel/acciones";
import { enlaceWhatsApp, textoInvitacion, textoRecordatorio } from "@/lib/enlaces";
import { MENUS } from "@/lib/rsvp";
import BotonWhatsApp, { BotonCopiar } from "./BotonWhatsApp";
import CamposInvitado from "./CamposInvitado";
import Formulario, { Enviar } from "./Formulario";
import { ESTADOS, ui } from "./estilos";
import type { Estado } from "./util";

/**
 * La lista de invitados: buscador, filtros, y por cada uno su estado, su
 * enlace personal, WhatsApp y edición. Se filtra en el navegador (una boda
 * tiene cientos de invitados, no miles) para que buscar sea instantáneo.
 */

export type FilaInvitado = {
  id: string;
  nombre: string;
  grupo: string | null;
  cupo: number;
  telefono: string | null;
  trato: "querida" | "querido" | "queridos" | null;
  enlace: string;
  estado: Estado;
  /** Línea de resumen de la respuesta: «Vienen 2 · Vegetariano · Bus». */
  resumen: string;
  menus: string[];
  alergias: boolean;
  bus: boolean;
  esperando: number;
  enviado: boolean;
};

type Filtros = { q: string; grupo: string; estado: "" | Estado; menu: string; alergias: boolean; bus: boolean };

export default function ListaInvitados({
  slug,
  pareja,
  filas,
  grupos,
  estadoInicial,
  recordarInicial,
}: {
  slug: string;
  pareja: string;
  filas: FilaInvitado[];
  grupos: string[];
  estadoInicial: "" | Estado;
  recordarInicial: boolean;
}) {
  const [f, setF] = useState<Filtros>({ q: "", grupo: "", estado: estadoInicial, menu: "", alergias: false, bus: false });
  const [recordar, setRecordar] = useState(recordarInicial);
  const q = useDeferredValue(f.q);
  const poner = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setF((x) => ({ ...x, [k]: v }));

  const visibles = useMemo(() => {
    const t = q
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
    return filas.filter((i) => {
      if (f.grupo && (i.grupo ?? "Sin grupo") !== f.grupo) return false;
      if (f.estado && i.estado !== f.estado) return false;
      if (f.menu && !i.menus.includes(f.menu)) return false;
      if (f.alergias && !i.alergias) return false;
      if (f.bus && !i.bus) return false;
      if (t) {
        const donde = `${i.nombre} ${i.grupo ?? ""} ${i.telefono ?? ""}`
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase();
        if (!donde.includes(t)) return false;
      }
      return true;
    });
  }, [filas, q, f.grupo, f.estado, f.menu, f.alergias, f.bus]);

  const pendientes = filas.filter((i) => i.estado === "pendiente");
  const hayFiltros = f.q || f.grupo || f.estado || f.menu || f.alergias || f.bus;

  return (
    <div>
      {/* ── recordatorio a quien falta */}
      {pendientes.length > 0 && (
        <section aria-labelledby="t-recordar" className={`${ui.tarjeta} mb-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="t-recordar" className="font-medium">
                {pendientes.length === 1 ? "1 invitación sin respuesta" : `${pendientes.length} invitaciones sin respuesta`}
              </h2>
              <p className={`text-[0.95rem] ${ui.suave}`}>
                WhatsApp no deja mandar a muchos a la vez: os los ponemos en fila, uno detrás de otro.
              </p>
            </div>
            <button type="button" aria-expanded={recordar} onClick={() => setRecordar((x) => !x)} className={recordar ? ui.boton : ui.botonLleno}>
              {recordar ? "Cerrar" : "Recordar a todos"}
            </button>
          </div>
          {recordar && <EnCadena slug={slug} pareja={pareja} pendientes={pendientes} />}
        </section>
      )}

      {/* ── buscador y filtros */}
      <div role="search" className="flex flex-col gap-3">
        <label htmlFor="buscar-invitado" className="sr-only">Buscar invitado</label>
        <input
          id="buscar-invitado"
          type="search"
          value={f.q}
          onChange={(e) => poner("q", e.target.value)}
          placeholder="Buscar por nombre, grupo o teléfono"
          className={ui.campo}
        />
        <div className="flex flex-wrap gap-2">
          <Selector etiqueta="Grupo" valor={f.grupo} onChange={(v) => poner("grupo", v)} opciones={grupos.map((g) => [g, g])} />
          <Selector
            etiqueta="Estado"
            valor={f.estado}
            onChange={(v) => poner("estado", v as Filtros["estado"])}
            opciones={[["viene", "Vienen"], ["noViene", "No vienen"], ["pendiente", "Sin respuesta"]]}
          />
          <Selector etiqueta="Menú" valor={f.menu} onChange={(v) => poner("menu", v)} opciones={MENUS.map((m) => [m.id, m.nombre])} />
          <Casilla etiqueta="Con alergias" valor={f.alergias} onChange={(v) => poner("alergias", v)} />
          <Casilla etiqueta="Van en bus" valor={f.bus} onChange={(v) => poner("bus", v)} />
          {hayFiltros && (
            <button
              type="button"
              onClick={() => setF({ q: "", grupo: "", estado: "", menu: "", alergias: false, bus: false })}
              className={`${ui.boton} border-transparent`}
            >
              Quitar filtros
            </button>
          )}
        </div>
        <p aria-live="polite" className={`text-[0.92rem] ${ui.suave}`}>
          {hayFiltros ? `${visibles.length} de ${filas.length} invitaciones` : `${filas.length} invitaciones`}
        </p>
      </div>

      {visibles.length === 0 ? (
        <p className={`mt-6 rounded-2xl border border-dashed border-[var(--linea)] p-8 text-center ${ui.suave}`}>
          Nadie coincide con esa búsqueda. Probad con menos filtros.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2 [content-visibility:auto]">
          {visibles.map((i) => (
            <Ficha key={i.id} i={i} slug={slug} pareja={pareja} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Selector({
  etiqueta,
  valor,
  onChange,
  opciones,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: [string, string][];
}) {
  if (opciones.length === 0) return null;
  return (
    <label className={`${ui.boton} relative cursor-pointer gap-1 pr-3 ${valor ? "border-[var(--acento)] text-[var(--acento)]" : ""}`}>
      <span className="sr-only">Filtrar por {etiqueta.toLowerCase()}</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className="min-h-11 cursor-pointer bg-transparent outline-none">
        <option value="">{etiqueta}: todos</option>
        {opciones.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function Casilla({ etiqueta, valor, onChange }: { etiqueta: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`${ui.boton} cursor-pointer ${valor ? "border-[var(--acento)] text-[var(--acento)]" : ""}`}>
      <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[var(--acento)]" />
      {etiqueta}
    </label>
  );
}

function Ficha({ i, slug, pareja }: { i: FilaInvitado; slug: string; pareja: string }) {
  const e = ESTADOS[i.estado];
  const primerNombre = i.nombre.split(" ")[0];
  return (
    <li className="rounded-2xl border border-[var(--linea)] bg-[var(--tarjeta)]">
      <details className="group">
        <summary className={`flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 ${ui.foco} [&::-webkit-details-marker]:hidden`}>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{i.nombre}</span>
            <span className={`block truncate text-[0.88rem] ${ui.suave}`}>
              {[i.grupo, i.cupo === 1 ? "1 plaza" : `${i.cupo} plazas`, i.resumen].filter(Boolean).join(" · ")}
            </span>
          </span>
          <span className={`${ui.chip} ${e.clase} shrink-0`}>
            {i.estado === "viene" && i.resumen.startsWith("Vienen") ? i.resumen.split(" · ")[0] : e.texto}
          </span>
          <span aria-hidden="true" className="shrink-0 text-[var(--suave)] transition-transform group-open:rotate-180">⌄</span>
        </summary>

        <div className="border-t border-[var(--linea)] px-4 pb-5 pt-4">
          {i.estado === "pendiente" && (
            <p className={`mb-3 text-[0.92rem] ${ui.suave}`}>
              {i.enviado
                ? i.esperando >= 7
                  ? `Le mandasteis la invitación hace ${i.esperando} días y aún no ha contestado.`
                  : "Ya tiene la invitación; todavía no ha contestado."
                : "Todavía no le habéis mandado su enlace desde aquí."}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <BotonWhatsApp slug={slug} ids={[i.id]} tipo="enviado" lleno={!i.enviado} href={enlaceWhatsApp(textoInvitacion(i.nombre, pareja, i.enlace), i.telefono)}>
              {i.enviado ? "Reenviar invitación" : "Enviar invitación"}
            </BotonWhatsApp>
            {i.estado === "pendiente" && i.enviado && (
              <BotonWhatsApp slug={slug} ids={[i.id]} tipo="recordado" href={enlaceWhatsApp(textoRecordatorio(i.nombre, pareja, i.enlace), i.telefono)}>
                Recordar
              </BotonWhatsApp>
            )}
            <BotonCopiar texto={i.enlace}>Copiar enlace</BotonCopiar>
            <a href={i.enlace} target="_blank" rel="noopener" className={ui.boton}>
              Verla como {primerNombre}
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </div>
          <p className={`mt-2 break-all text-[0.85rem] ${ui.suave}`}>{i.enlace}</p>

          <Formulario accion={guardarInvitadoAccion} className="mt-6 grid gap-4 sm:grid-cols-4 sm:items-end">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="id" value={i.id} />
            <CamposInvitado i={i} prefijo={`e-${i.id}`} />
            <div className="sm:col-span-4">
              <Enviar>Guardar cambios</Enviar>
            </div>
          </Formulario>

          <Formulario
            accion={borrarInvitadoAccion}
            confirmar={`¿Quitar a ${i.nombre} de la lista?${i.estado !== "pendiente" ? " Su respuesta se queda, pero sin enlace." : ""}`}
            className="mt-4 flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="id" value={i.id} />
            <Enviar variante="peligro" pendiente="Quitando…">Quitar a {primerNombre}</Enviar>
          </Formulario>
        </div>
      </details>
    </li>
  );
}

/** Recordatorio masivo: uno detrás de otro, sin perder la cuenta. */
function EnCadena({ slug, pareja, pendientes }: { slug: string; pareja: string; pendientes: FilaInvitado[] }) {
  const [hechos, setHechos] = useState<Set<string>>(() => new Set());
  const cola = pendientes.filter((i) => !hechos.has(i.id));
  const actual = cola[0];
  const lista = pendientes.map((i) => `${i.nombre}: ${i.enlace}`).join("\n");

  return (
    <div className="mt-5 border-t border-[var(--linea)] pt-5">
      <p aria-live="polite" className={`text-[0.92rem] ${ui.suave}`}>
        {hechos.size} de {pendientes.length} enviados
      </p>
      {actual ? (
        <div className="mt-3 flex flex-col gap-3 rounded-xl bg-[var(--papel)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium">{actual.nombre}</p>
            <p className={`text-[0.9rem] ${ui.suave}`}>
              {actual.telefono ? actual.telefono : "Sin teléfono: WhatsApp os dejará elegir el chat"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BotonWhatsApp
              slug={slug}
              ids={[actual.id]}
              tipo={actual.enviado ? "recordado" : "enviado"}
              lleno
              onEnviado={() => setHechos((s) => new Set(s).add(actual.id))}
              href={enlaceWhatsApp(
                (actual.enviado ? textoRecordatorio : textoInvitacion)(actual.nombre, pareja, actual.enlace),
                actual.telefono,
              )}
            >
              {actual.enviado ? "Recordar" : "Enviar"}
            </BotonWhatsApp>
            <button type="button" onClick={() => setHechos((s) => new Set(s).add(actual.id))} className={ui.boton}>
              Saltar
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-[var(--verde-claro)] p-4 text-[var(--verde)]">
          Listo, ya está toda la fila. Las respuestas irán llegando aquí.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <BotonCopiar texto={lista}>Copiar todos los enlaces</BotonCopiar>
      </div>
    </div>
  );
}
