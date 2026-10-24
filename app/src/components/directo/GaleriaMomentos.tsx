"use client";

import { useCallback, useEffect, useState } from "react";
import { ui } from "@/components/panel/estilos";
import {
  borrarMomento,
  fijarMensaje,
  listarModeracion,
  moderarMomento,
  type FiltroModeracion,
} from "@/lib/momentos/acciones-control";
import type { MomentoModeracion } from "@/lib/momentos/tipos";
import { EVENTO_DIRECTO } from "./eventos";

/**
 * La rejilla para moderar lo que suben los invitados.
 *
 *   <GaleriaMomentos slug="laura-y-ruben" />
 *
 * Ocultar / mostrar / aprobar, destacar (sale más a menudo en la pantalla),
 * fijar un mensaje en la pantalla y borrar. Se refresca sola (cada 20 s y
 * cuando `<ControlDirecto />` avisa de algo en tiempo real).
 */

const FILTROS: { id: FiltroModeracion; texto: string }[] = [
  { id: "todas", texto: "Todo" },
  { id: "pendientes", texto: "Por aprobar" },
  { id: "retiradas", texto: "Retiradas" },
  { id: "ocultas", texto: "Ocultas" },
  { id: "destacadas", texto: "Destacadas" },
  { id: "mensajes", texto: "Mensajes" },
];

const ESTADO: Record<MomentoModeracion["estado"], { texto: string; clase: string }> = {
  visible: { texto: "Visible", clase: "bg-[var(--verde-claro)] text-[var(--verde)]" },
  pendiente: { texto: "Por aprobar", clase: "bg-[var(--acento-claro)] text-[var(--acento)]" },
  oculto: { texto: "Oculta", clase: "bg-[#EFECE8] text-[var(--suave)]" },
};

export default function GaleriaMomentos({
  slug,
  filtroInicial = "todas",
}: {
  slug: string;
  filtroInicial?: FiltroModeracion;
}) {
  const [filtro, setFiltro] = useState<FiltroModeracion>(filtroInicial);
  const [items, setItems] = useState<MomentoModeracion[] | null>(null);
  const [hayMas, setHayMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<MomentoModeracion | null>(null);

  const cargar = useCallback(
    async (antes: string | null = null) => {
      try {
        const r = await listarModeracion(slug, filtro, antes);
        if (!r.ok) return setError(r.error);
        setError(null);
        setHayMas(r.hayMas);
        setItems((xs) => (antes ? [...(xs ?? []), ...r.momentos] : r.momentos));
      } catch {
        setError("No hay conexión. Lo intentamos otra vez en unos segundos.");
      }
    },
    [slug, filtro],
  );

  useEffect(() => {
    let vivo = true;
    let t = 0;
    const vuelta = async () => {
      await cargar();
      if (vivo) t = window.setTimeout(vuelta, 20_000);
    };
    void vuelta();
    const aviso = () => void cargar();
    window.addEventListener(EVENTO_DIRECTO, aviso);
    return () => {
      vivo = false;
      window.clearTimeout(t);
      window.removeEventListener(EVENTO_DIRECTO, aviso);
    };
  }, [cargar]);

  async function cambiar(
    m: MomentoModeracion,
    c: { estado?: MomentoModeracion["estado"]; destacado?: boolean; revisada?: boolean },
  ) {
    // Optimista: se ve el cambio al instante.
    setItems(
      (xs) =>
        xs?.map((x) => {
          if (x.id !== m.id) return x;
          const { revisada, ...resto } = c;
          return { ...x, ...resto, retiradaPedida: c.estado === "visible" || revisada ? false : x.retiradaPedida };
        }) ?? null,
    );
    const r = await moderarMomento(slug, m.id, c).catch(() => ({ ok: false as const, error: "No hay conexión." }));
    if (!r.ok) setError(r.error);
    window.dispatchEvent(new Event(EVENTO_DIRECTO));
  }

  async function borrar(m: MomentoModeracion) {
    const r = await borrarMomento(slug, m.id).catch(() => ({ ok: false as const, error: "No hay conexión." }));
    setBorrando(null);
    if (!r.ok) return setError(r.error);
    setItems((xs) => xs?.filter((x) => x.id !== m.id) ?? null);
    setAbierta(null);
    window.dispatchEvent(new Event(EVENTO_DIRECTO));
  }

  async function fijar(m: MomentoModeracion | null) {
    const r = await fijarMensaje(slug, m?.id ?? null).catch(() => ({ ok: false as const, error: "No hay conexión." }));
    if (!r.ok) setError(r.error);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filtro === f.id}
            onClick={() => {
              setItems(null);
              setFiltro(f.id);
            }}
            className={`${ui.boton} min-h-11 ${filtro === f.id ? "border-[var(--acento)] bg-[var(--acento-claro)] text-[var(--acento)]" : ""}`}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[0.95rem] font-medium text-[var(--acento)]">
          {error}
        </p>
      )}

      {items === null ? (
        <p className={`mt-6 ${ui.suave}`}>Cargando…</p>
      ) : items.length === 0 ? (
        <p className={`mt-6 ${ui.texto} ${ui.suave}`}>
          {filtro === "todas" ? "Todavía no han subido nada. Aquí irá apareciendo todo, al momento." : "Nada por aquí."}
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <li key={m.id} className="flex flex-col overflow-hidden rounded-xl border border-[var(--linea)] bg-white">
              {m.tipo === "mensaje" ? (
                <div className="flex aspect-square flex-col justify-center bg-[var(--papel)] p-4">
                  <p className="display line-clamp-6 text-[1.1rem] leading-snug">«{m.mensaje}»</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAbierta(m)}
                  className={`relative block aspect-square w-full bg-[#EFECE8] ${ui.foco}`}
                  aria-label={`Ver ${m.tipo === "video" ? "el vídeo" : "la foto"} de ${m.autor}`}
                >
                  {m.miniatura && (
                    // eslint-disable-next-line @next/next/no-img-element -- URL firmada
                    <img
                      src={m.miniatura}
                      alt=""
                      loading="lazy"
                      className={`h-full w-full object-cover ${m.estado === "visible" ? "" : "opacity-55 grayscale"}`}
                    />
                  )}
                  {m.tipo === "video" && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.8rem] text-white">
                      Vídeo{m.duracion ? ` · ${Math.round(m.duracion)} s` : ""}
                    </span>
                  )}
                  {m.destacado && (
                    <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[0.8rem] font-medium text-[var(--acento)]">
                      ★ Destacada
                    </span>
                  )}
                </button>
              )}
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`${ui.chip} ${ESTADO[m.estado].clase}`}>{ESTADO[m.estado].texto}</span>
                </div>
                {m.retiradaPedida && (
                  <p className="rounded-lg bg-[var(--acento-claro)] px-2.5 py-1.5 text-[0.82rem] font-medium leading-snug text-[var(--acento)]">
                    Retirada por un invitado: pendiente de revisar
                  </p>
                )}
                <p className="truncate text-[0.9rem]">
                  {m.autor}
                  {m.capitulo && <span className="text-[var(--suave)]"> · {m.capitulo}</span>}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {m.retiradaPedida ? (
                    <>
                      <button type="button" onClick={() => cambiar(m, { estado: "visible" })} className={`${ui.botonLleno} min-h-10 px-3 text-[0.85rem]`}>
                        Restaurar
                      </button>
                      <button type="button" onClick={() => cambiar(m, { revisada: true })} className={`${ui.boton} min-h-10 px-3 text-[0.85rem]`}>
                        Dejarla retirada
                      </button>
                    </>
                  ) : m.estado === "visible" ? (
                    <button type="button" onClick={() => cambiar(m, { estado: "oculto" })} className={`${ui.boton} min-h-10 px-3 text-[0.85rem]`}>
                      Ocultar
                    </button>
                  ) : (
                    <button type="button" onClick={() => cambiar(m, { estado: "visible" })} className={`${ui.botonLleno} min-h-10 px-3 text-[0.85rem]`}>
                      {m.estado === "pendiente" ? "Aprobar" : "Mostrar"}
                    </button>
                  )}
                  {m.tipo === "mensaje" ? (
                    <button type="button" onClick={() => fijar(m)} className={`${ui.boton} min-h-10 px-3 text-[0.85rem]`}>
                      Fijar en pantalla
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-pressed={m.destacado}
                      onClick={() => cambiar(m, { destacado: !m.destacado })}
                      className={`${ui.boton} min-h-10 px-3 text-[0.85rem]`}
                    >
                      {m.destacado ? "Quitar ★" : "Destacar ★"}
                    </button>
                  )}
                  {borrando === m.id ? (
                    <>
                      <button type="button" onClick={() => borrar(m)} className={`${ui.botonPeligro} min-h-10 px-3 text-[0.85rem]`}>
                        Sí, borrar
                      </button>
                      <button type="button" onClick={() => setBorrando(null)} className={`${ui.boton} min-h-10 px-3 text-[0.85rem]`}>
                        No
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setBorrando(m.id)} className={`${ui.botonPeligro} min-h-10 px-3 text-[0.85rem]`}>
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {filtro === "mensajes" && items && items.length > 0 && (
        <button type="button" onClick={() => fijar(null)} className={`${ui.boton} mt-4`}>
          Soltar el mensaje fijado
        </button>
      )}

      {hayMas && items && (
        <button type="button" onClick={() => cargar(items[items.length - 1]?.creado ?? null)} className={`${ui.boton} mt-5`}>
          Cargar más
        </button>
      )}

      {abierta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`De ${abierta.autor}`}
          className="fixed inset-0 z-50 flex flex-col bg-black/92 p-4 text-white"
          onKeyDown={(ev) => ev.key === "Escape" && setAbierta(null)}
        >
          <div className="flex items-center justify-between">
            <p>De {abierta.autor}</p>
            <button type="button" autoFocus onClick={() => setAbierta(null)} className="grid h-12 w-12 place-items-center rounded-full border border-white/40 text-[1.5rem]" aria-label="Cerrar">
              ×
            </button>
          </div>
          <div className="grid min-h-0 flex-1 place-items-center">
            {abierta.tipo === "video" && abierta.url ? (
              <video src={abierta.url} controls playsInline className="max-h-full max-w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada
              <img src={abierta.url ?? abierta.miniatura ?? ""} alt={`De ${abierta.autor}`} className="max-h-full max-w-full object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
