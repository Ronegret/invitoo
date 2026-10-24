"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ui } from "@/components/panel/estilos";
import {
  ajustarDirecto,
  estadoDirecto,
  lanzarMomento,
  listaDescarga,
  regenerarClavePantalla,
  type EstadoDirecto,
} from "@/lib/momentos/acciones-control";
import { formatearBytes, PLANES_MOMENTOS } from "@/lib/momentos/planes";
import ContratarDirecto from "./ContratarDirecto";
import DisenoPantalla from "./DisenoPantalla";
import { EVENTO_DIRECTO } from "./eventos";
import { descargarZip } from "./zip";

/**
 * El mando de «En directo» para el panel de los novios.
 *
 *   <ControlDirecto slug="laura-y-ruben" />
 *
 * Cliente; se carga solo con `estadoDirecto(slug)` (acción con
 * `exigirAccesoBoda`). Avisa a `<GaleriaMomentos />` de lo que llega con el
 * evento de ventana `invitoo:directo` (tiempo real si hay Supabase; si no,
 * cada 30 s).
 */

const CADA_MS = 30_000;

export default function ControlDirecto({ slug }: { slug: string }) {
  const [e, setE] = useState<EstadoDirecto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [zip, setZip] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [otroMomento, setOtroMomento] = useState("");
  const [confirmarClave, setConfirmarClave] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await estadoDirecto(slug);
      if (r.ok) {
        setE(r);
        setError(null);
      } else setError(r.error);
    } catch {
      setError("No hay conexión. Lo intentamos otra vez en unos segundos.");
    }
  }, [slug]);

  // Primera carga y refresco periódico.
  useEffect(() => {
    let vivo = true;
    let t = 0;
    const vuelta = async () => {
      await cargar();
      if (vivo) t = window.setTimeout(vuelta, CADA_MS);
    };
    void vuelta();
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [cargar]);

  // Tiempo real del panel (Supabase Broadcast), si lo hay.
  const canal = e?.realtime?.canal;
  const rtUrl = e?.realtime?.url;
  const rtAnon = e?.realtime?.anon;
  const cargarRef = useRef(cargar);
  useEffect(() => {
    cargarRef.current = cargar;
  }, [cargar]);
  useEffect(() => {
    if (!canal || !rtUrl || !rtAnon) return;
    let vivo = true;
    let cerrar: (() => void) | null = null;
    let espera = 0;
    void import("@supabase/supabase-js").then(({ createClient }) => {
      if (!vivo) return;
      const sb = createClient(rtUrl, rtAnon, { auth: { persistSession: false } });
      const aviso = () => {
        window.dispatchEvent(new Event(EVENTO_DIRECTO));
        window.clearTimeout(espera);
        espera = window.setTimeout(() => void cargarRef.current(), 800);
      };
      const ch = sb.channel(canal).on("broadcast", { event: "nuevo" }, aviso).on("broadcast", { event: "cambio" }, aviso).subscribe();
      cerrar = () => void sb.removeChannel(ch);
    });
    return () => {
      vivo = false;
      window.clearTimeout(espera);
      cerrar?.();
    };
  }, [canal, rtUrl, rtAnon]);

  async function hacer(nombre: string, fn: () => Promise<{ ok: boolean; error?: string } | { ok: false; error: string }>) {
    setOcupado(nombre);
    try {
      const r = await fn();
      if (!r.ok) setError("error" in r && r.error ? r.error : "No se ha podido guardar.");
      else setError(null);
    } catch {
      setError("No hay conexión. Probad otra vez.");
    }
    await cargar();
    window.dispatchEvent(new Event(EVENTO_DIRECTO));
    setOcupado(null);
  }

  async function copiar(texto: string, que: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(que);
      window.setTimeout(() => setCopiado(null), 2500);
    } catch {
      window.prompt("Copiad el enlace:", texto);
    }
  }

  async function descargar() {
    setZip("Preparando la lista…");
    try {
      const r = await listaDescarga(slug);
      if (!r.ok) {
        setZip(r.error);
        return;
      }
      if (!r.archivos.length && !r.mensajes) {
        setZip("Todavía no hay nada que descargar.");
        return;
      }
      await descargarZip(r.archivos, r.mensajes, r.carpeta, setZip, r.album);
    } catch (err) {
      setZip((err as Error).name === "AbortError" ? null : "La descarga se ha cortado. Probad otra vez.");
    }
  }

  if (!e) {
    return (
      <div className={ui.tarjeta} aria-busy={!error}>
        <p className={ui.suave}>{error ?? "Cargando «En directo»…"}</p>
      </div>
    );
  }

  const conPantalla = e.limites.pantallaTv;
  const pctFotos = Math.min(100, (e.uso.fotos / Math.max(1, e.limites.fotos)) * 100);
  const pctBytes = Math.min(100, (e.uso.bytes / Math.max(1, e.limites.bytes)) * 100);
  const borrado = e.retencionHasta
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(e.retencionHasta))
    : null;

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded-xl bg-[var(--acento-claro)] px-4 py-3 text-[0.95rem] font-medium text-[var(--acento)]">
          {error}
        </p>
      )}

      {/* ─────────── estado y ajustes */}
      <section className={ui.tarjeta} aria-labelledby="d-estado">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={ui.eyebrow}>{e.nombrePlan}</p>
            <h3 id="d-estado" className={`${ui.h2} mt-1`}>
              {e.activo ? (e.subidasAbiertas ? "Abierto: los invitados ya pueden subir" : "Subidas cerradas") : "Apagado"}
            </h3>
          </div>
          <span className={`${ui.chip} ${e.activo ? "bg-[var(--verde-claro)] text-[var(--verde)]" : "bg-[#EFECE8] text-[var(--suave)]"}`}>
            {e.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        {!conPantalla && (
          <p className={`mt-3 ${ui.texto} ${ui.suave}`}>
            Vuestro álbum recoge hasta {e.limites.fotos} fotos de los invitados. Con <strong className="font-medium text-[var(--tinta)]">En directo</strong> ({PLANES_MOMENTOS.directo.precio} €) salen además en la pantalla del salón, con vídeos y mensajes.{" "}
            <a href="/en-directo" className={ui.enlace}>Ver En directo</a>
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Interruptor
            etiqueta={conPantalla ? "Activar En directo" : "Activar el álbum"}
            ayuda="La página de subida y la pantalla funcionan solo si está activo."
            valor={e.activo}
            ocupado={ocupado === "activo"}
            onCambio={(v) => hacer("activo", () => ajustarDirecto(slug, { activo: v }))}
          />
          <Interruptor
            etiqueta="Subidas abiertas"
            ayuda="Cerradlas al final: la pantalla y el muro siguen, pero ya no entra nada."
            valor={e.subidasAbiertas}
            ocupado={ocupado === "subidas"}
            onCambio={(v) => hacer("subidas", () => ajustarDirecto(slug, { subidasAbiertas: v }))}
          />
        </div>

        <fieldset className="mt-5">
          <legend className={ui.etiqueta}>Moderación</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["auto", "Automática", "Sale al momento; ocultáis lo que no queráis."],
                ["manual", "Manual", "Nada sale hasta que lo aprobéis."],
              ] as const
            ).map(([v, t, ayuda]) => (
              <label
                key={v}
                className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${e.moderacion === v ? "border-[var(--acento)] bg-[var(--acento-claro)]" : "border-[var(--linea)]"}`}
              >
                <input
                  type="radio"
                  name={`moderacion-${slug}`}
                  checked={e.moderacion === v}
                  disabled={ocupado === "moderacion"}
                  onChange={() => hacer("moderacion", () => ajustarDirecto(slug, { moderacion: v }))}
                  className="mt-1 h-5 w-5 accent-[var(--acento)]"
                />
                <span>
                  <span className="block font-medium">{t}</span>
                  <span className={`block text-[0.9rem] ${ui.suave}`}>{ayuda}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* ─────────── uso */}
      <section className={ui.tarjeta} aria-labelledby="d-uso">
        <h3 id="d-uso" className={ui.h2}>Lo que llevan subido</h3>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Cifra n={e.uso.fotos} texto="fotos" />
          <Cifra n={e.uso.videos} texto="vídeos" />
          <Cifra n={e.uso.mensajes} texto="mensajes" />
        </dl>
        <div className="mt-5 space-y-4">
          {!e.limites.ilimitado && (
            <Barra etiqueta="Fotos" valor={`${e.uso.fotos} de ${e.limites.fotos}`} pct={pctFotos} />
          )}
          {e.limites.videos > 0 && (
            <Barra
              etiqueta={`Vídeos (hasta ${e.limites.duracionVideo} s)`}
              valor={`${e.uso.videos} de ${e.limites.videos}`}
              pct={(e.uso.videos / e.limites.videos) * 100}
            />
          )}
          <Barra etiqueta="Espacio" valor={`${formatearBytes(e.uso.bytes)} de ${formatearBytes(e.limites.bytes)}`} pct={pctBytes} />
        </div>
        {(e.pendientes > 0 || e.retiradas > 0) && (
          <p className="mt-5 rounded-xl bg-[var(--acento-claro)] px-4 py-3 text-[0.95rem] text-[var(--acento)]">
            {e.pendientes > 0 && <>{e.pendientes} {e.pendientes === 1 ? "espera" : "esperan"} vuestra aprobación. </>}
            {e.retiradas > 0 && (
              <>
                {e.retiradas} {e.retiradas === 1 ? "foto retirada" : "fotos retiradas"} a petición de un invitado: revisadlas abajo.
              </>
            )}
          </p>
        )}
        {borrado && (
          <p className={`mt-4 text-[0.95rem] ${e.avisoBorrado ? "font-medium text-[var(--acento)]" : ui.suave}`}>
            {e.avisoBorrado ? `Atención: el álbum se borra el ${borrado}. Descargadlo antes.` : `Online hasta el ${borrado}.`}
          </p>
        )}
      </section>

      {/* ─────────── QR y tarjetas */}
      <section className={ui.tarjeta} aria-labelledby="d-qr">
        <h3 id="d-qr" className={ui.h2}>El QR de las mesas</h3>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="mx-auto h-40 w-40 shrink-0 rounded-xl border border-[var(--linea)] bg-white p-2 sm:mx-0 [&_svg]:h-full [&_svg]:w-full"
            role="img"
            aria-label="Código QR de la página de subida"
            dangerouslySetInnerHTML={{ __html: e.qr }}
          />
          <div className="min-w-0 flex-1">
            <p className={`${ui.texto} ${ui.suave}`}>
              Lleva a la página de subida, sin apps ni registro. Imprimid las tarjetas y dejad una en cada mesa.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={e.enlaces.tarjetas} target="_blank" rel="noopener" className={ui.botonLleno}>
                Tarjetas para imprimir
              </a>
              <a href={e.enlaces.qrSvg} download className={ui.boton}>QR en SVG</a>
              <a href={e.enlaces.qrPng} download className={ui.boton}>QR en PNG</a>
              <button type="button" onClick={() => copiar(e.enlaces.subida, "subida")} className={ui.boton}>
                {copiado === "subida" ? "Copiado" : "Copiar enlace"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── pantalla */}
      {conPantalla && (
        <section className={ui.tarjeta} aria-labelledby="d-pantalla">
          <h3 id="d-pantalla" className={ui.h2}>La pantalla del salón</h3>
          <p className={`mt-1 ${ui.texto} ${ui.suave}`}>
            Abrid este enlace en la TV o en el portátil del proyector y pulsad «Pantalla completa». Lleva una clave: sin ella no se ve nada.
          </p>
          <div className="mt-4 rounded-xl bg-[var(--papel)] px-4 py-4">
            <p className={`text-[0.95rem] ${ui.suave}`}>En la tele, sin teclear el enlace largo: abrid</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[1.15rem] font-medium">{e.enlaces.tv}</span>
              <span className={ui.suave}>y escribid el código</span>
              <span className="font-mono text-[1.6rem] font-semibold tracking-[0.28em] text-[var(--acento)]" aria-label={`Código ${e.enlaces.codigoTv.split("").join(" ")}`}>
                {e.enlaces.codigoTv}
              </span>
            </p>
          </div>
          <p className="mt-3 break-all rounded-xl bg-[var(--papel)] px-4 py-3 font-mono text-[0.85rem]">{e.enlaces.pantalla}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={e.enlaces.pantalla} target="_blank" rel="noopener" className={ui.botonLleno}>Abrir la pantalla</a>
            <button type="button" onClick={() => copiar(e.enlaces.pantalla, "pantalla")} className={ui.boton}>
              {copiado === "pantalla" ? "Copiado" : "Copiar enlace"}
            </button>
            {confirmarClave ? (
              <>
                <button
                  type="button"
                  disabled={ocupado === "clave"}
                  onClick={() =>
                    hacer("clave", async () => {
                      const r = await regenerarClavePantalla(slug);
                      setConfirmarClave(false);
                      return r;
                    })
                  }
                  className={ui.botonPeligro}
                >
                  Sí, cambiar la clave
                </button>
                <button type="button" onClick={() => setConfirmarClave(false)} className={ui.boton}>No</button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmarClave(true)} className={ui.boton}>Cambiar la clave</button>
            )}
          </div>
          {confirmarClave && (
            <p className={`mt-2 text-[0.9rem] ${ui.suave}`}>La pantalla que tenga el enlace viejo dejará de funcionar.</p>
          )}

          <div className="mt-6 border-t border-[var(--linea)] pt-5">
            <h4 className="font-medium">Momentos de la noche</h4>
            <p className={`mt-1 text-[0.95rem] ${ui.suave}`}>
              Al lanzarlo sale un rótulo en la pantalla y las fotos que lleguen se etiquetan con él.
            </p>
            {e.capitulo ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className={`${ui.chip} bg-[var(--acento-claro)] text-[var(--acento)]`}>Ahora: {e.capitulo.titulo}</span>
                <button type="button" onClick={() => hacer("momento", () => lanzarMomento(slug, null))} className={ui.boton}>
                  Terminar
                </button>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {e.momentosProgramados.map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={ocupado === "momento" || e.capitulo?.titulo === m}
                  onClick={() => hacer("momento", () => lanzarMomento(slug, m))}
                  className={ui.boton}
                >
                  {m}
                </button>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(ev) => {
                ev.preventDefault();
                if (otroMomento.trim()) void hacer("momento", () => lanzarMomento(slug, otroMomento)).then(() => setOtroMomento(""));
              }}
            >
              <label className="sr-only" htmlFor={`d-otro-${slug}`}>Otro momento</label>
              <input
                id={`d-otro-${slug}`}
                value={otroMomento}
                onChange={(ev) => setOtroMomento(ev.target.value)}
                maxLength={48}
                placeholder="Otro momento: «El baile de los abuelos»"
                className={`${ui.campo} mt-0 flex-1`}
              />
              <button type="submit" className={ui.boton} disabled={!otroMomento.trim()}>Lanzar</button>
            </form>
          </div>
        </section>
      )}

      {/* ─────────── diseño de la pantalla (y de la subida) */}
      {conPantalla && (
        <DisenoPantalla slug={slug} inicial={e.diseno} pareja={{ a: e.pareja.a, b: e.pareja.b }} plantilla={e.plantilla} />
      )}

      {/* ─────────── ampliar: Gestionado, +1 año (o contratar, si aún es el álbum) */}
      <details className={`${ui.tarjeta} group`} open={!conPantalla}>
        <summary className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 ${ui.foco} [&::-webkit-details-marker]:hidden`}>
          <span className={ui.h2}>{conPantalla ? "Ampliar" : "Contratar En directo"}</span>
          <span aria-hidden className="text-[1.4rem] leading-none text-[var(--acento)] transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="mt-4">
          <ContratarDirecto slug={slug} bloqueado={!conPantalla} />
        </div>
      </details>

      {/* ─────────── descarga */}
      <section className={ui.tarjeta} aria-labelledby="d-zip">
        <h3 id="d-zip" className={ui.h2}>Descargar todo</h3>
        <p className={`mt-1 ${ui.texto} ${ui.suave}`}>
          Todas las fotos y vídeos en un ZIP, con los mensajes en un archivo de texto. Se arma en vuestro ordenador: mejor con wifi.
        </p>
        <button type="button" onClick={descargar} disabled={Boolean(zip && !zip.startsWith("Listo"))} className={`${ui.botonLleno} mt-4`}>
          Descargar todo (ZIP)
        </button>
        {zip && (
          <p role="status" className={`mt-3 text-[0.95rem] ${ui.suave}`}>
            {zip}
          </p>
        )}
      </section>
    </div>
  );
}

function Interruptor({
  etiqueta,
  ayuda,
  valor,
  ocupado,
  onCambio,
}: {
  etiqueta: string;
  ayuda: string;
  valor: boolean;
  ocupado: boolean;
  onCambio: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={valor}
      disabled={ocupado}
      onClick={() => onCambio(!valor)}
      className={`flex min-h-14 items-start gap-3 rounded-xl border border-[var(--linea)] px-4 py-3 text-left disabled:opacity-60 ${ui.foco}`}
    >
      <span
        aria-hidden
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${valor ? "bg-[var(--acento)]" : "bg-[#D9D3CC]"}`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${valor ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
      <span>
        <span className="block font-medium">{etiqueta}</span>
        <span className="block text-[0.9rem] text-[var(--suave)]">{ayuda}</span>
      </span>
    </button>
  );
}

function Cifra({ n, texto }: { n: number; texto: string }) {
  return (
    <div className="rounded-xl bg-[var(--papel)] px-2 py-4">
      <dt className="sr-only">{texto}</dt>
      <dd>
        <span className="display block text-[2rem] leading-none tabular-nums">{n.toLocaleString("es-ES")}</span>
        <span className="mt-1 block text-[0.85rem] text-[var(--suave)]">{texto}</span>
      </dd>
    </div>
  );
}

function Barra({ etiqueta, valor, pct }: { etiqueta: string; valor: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between gap-3 text-[0.9rem]">
        <span className="font-medium">{etiqueta}</span>
        <span className="tabular-nums text-[var(--suave)]">{valor}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EFECE8]" role="presentation">
        <div className="h-full rounded-full" style={{ width: `${Math.max(1, pct)}%`, background: pct > 90 ? "var(--acento)" : "var(--verde)" }} />
      </div>
    </div>
  );
}
