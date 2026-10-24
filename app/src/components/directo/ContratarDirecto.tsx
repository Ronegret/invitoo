"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { ui } from "@/components/panel/estilos";
import { ESTILOS_PASE, type EstiloPase } from "@/lib/momentos/diseno";
import { PLANES_MOMENTOS } from "@/lib/momentos/planes";
import { contratarDirecto, estadoCompra, type EstadoCompra } from "@/lib/pagos/acciones";
import { euros, PRODUCTOS, type ProductoDirecto } from "@/lib/pagos/productos";
import VistaPantalla from "./VistaPantalla";

/**
 * Contratar «En directo» desde el panel.
 *
 *   <ContratarDirecto slug="laura-y-ruben" bloqueado />
 *
 *  · Vista previa EN VIVO de su pantalla de TV, con sus nombres, su
 *    plantilla y el estilo que elijan (Revista, Polaroid, Cine, Mosaico).
 *  · Planes y precios leídos de `lib/momentos/planes.ts` (vía lib/pagos).
 *  · Stripe Checkout (tarjeta, Apple/Google Pay y Bizum si está activo) con
 *    vuelta a `?pago=ok`; el webhook es quien activa. Sin claves: modo demo,
 *    que activa al momento y lo dice: «Modo demo: no se ha cobrado nada».
 *  · «+1 año» (conservar) cuando ya lo tienen.
 *
 * `bloqueado`: se pinta dentro del candado de F4 («Bloqueado: no incluido en
 * vuestro plan»).
 */

type Aviso = { tono: "ok" | "error" | "info"; texto: string } | null;

export default function ContratarDirecto({ slug, bloqueado = false }: { slug: string; bloqueado?: boolean }) {
  const router = useRouter();
  const [e, setE] = useState<EstadoCompra | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [ocupado, setOcupado] = useState<ProductoDirecto | null>(null);
  const [estilo, setEstilo] = useState<EstiloPase | null>(null);
  const idTitulo = useId();

  const cargar = useCallback(async () => {
    try {
      const r = await estadoCompra(slug);
      if (r.ok) {
        setE(r);
        setError(null);
        return r;
      }
      setError(r.error);
    } catch {
      setError("No hay conexión. Probad otra vez en un momento.");
    }
    return null;
  }, [slug]);

  // Al volver de Stripe: ?pago=ok | ?pago=cancelado. El webhook puede tardar
  // unos segundos más que la redirección: se espera hasta 40 s.
  useEffect(() => {
    let vivo = true;
    const q = new URLSearchParams(window.location.search);
    const pago = q.get("pago");
    void (async () => {
      const inicial = await cargar();
      if (!vivo || !pago) return;
      if (pago === "cancelado") {
        setAviso({ tono: "info", texto: "Pago cancelado: no se ha cobrado nada. Podéis volver a intentarlo cuando queráis." });
        return;
      }
      if (pago !== "ok") return;
      const plan0 = inicial?.plan;
      const anos0 = inicial?.anosExtra;
      const yaPagado = inicial?.pagos.some((p) => p.estado === "pagado" && Date.now() - Date.parse(p.creado) < 10 * 60_000);
      if (yaPagado) {
        setAviso({ tono: "ok", texto: "¡Pago recibido! Ya lo tenéis activado. Os hemos enviado la factura por email." });
        router.refresh();
        return;
      }
      setAviso({ tono: "info", texto: "Estamos confirmando el pago con el banco…" });
      for (let i = 0; i < 20 && vivo; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const r = await cargar();
        if (r && (r.plan !== plan0 || r.anosExtra !== anos0 || r.pagos.some((p) => p.estado === "pagado" && Date.now() - Date.parse(p.creado) < 10 * 60_000))) {
          setAviso({ tono: "ok", texto: "¡Pago recibido! Ya lo tenéis activado. Os hemos enviado la factura por email." });
          router.refresh();
          return;
        }
      }
      if (vivo) setAviso({ tono: "info", texto: "El pago está tardando en confirmarse. Si en unos minutos no aparece activado, escribidnos a info@invitoo.es." });
    })();
    return () => {
      vivo = false;
    };
  }, [cargar, router]);

  async function contratar(producto: ProductoDirecto) {
    setOcupado(producto);
    setAviso(null);
    try {
      const r = await contratarDirecto(slug, producto);
      if (!r.ok) {
        setAviso({ tono: "error", texto: r.error });
      } else if (r.modo === "stripe") {
        window.location.assign(r.url);
        return;
      } else {
        const p = PRODUCTOS[producto];
        setAviso({
          tono: "ok",
          texto: `Modo demo: no se ha cobrado nada. ${producto === "conservar" ? "Vuestro álbum sigue online un año más." : `${p.nombre} ya está activado.`}`,
        });
        await cargar();
        router.refresh();
      }
    } catch {
      setAviso({ tono: "error", texto: "No hay conexión. Probad otra vez." });
    }
    setOcupado(null);
  }

  if (!e) {
    return (
      <div className={ui.tarjeta} aria-busy={!error}>
        <p className={ui.suave}>{error ?? "Cargando…"}</p>
      </div>
    );
  }

  const diseno = { ...e.diseno, estilo: estilo ?? e.diseno.estilo };
  const productos = e.disponibles.map((id) => PRODUCTOS[id]);
  const yaTiene = e.conPantalla;
  const borrado = e.retencionHasta
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(e.retencionHasta))
    : null;

  return (
    <section className="contratar-directo space-y-6" aria-labelledby={idTitulo}>
      <div>
        {bloqueado && !yaTiene && (
          <p className={`${ui.chip} gap-1.5 bg-[#EFECE8] text-[var(--suave)]`}>
            <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Bloqueado: no incluido en vuestro plan
          </p>
        )}
        <h3 id={idTitulo} className={`${ui.h2} mt-2`}>
          {yaTiene ? "Vuestro En directo" : "Vuestras fotos, en directo en el salón"}
        </h3>
        <p className={`mt-1 ${ui.texto} ${ui.suave}`}>
          {yaTiene
            ? `Tenéis ${e.nombrePlan}.${borrado ? ` Online hasta el ${borrado}.` : ""}`
            : "Los invitados suben sus fotos con un QR, con un mensaje si quieren, y salen al momento en la TV y en el móvil de todos. Después os lo entregamos todo."}
        </p>
      </div>

      {/* La TV, con sus nombres y su invitación */}
      <div>
        <VistaPantalla
          diseno={diseno}
          pareja={{ a: e.pareja.a, b: e.pareja.b }}
          plantilla={e.plantilla}
          titulo={`Vista previa: la pantalla de ${e.pareja.a} y ${e.pareja.b} en estilo ${ESTILOS_PASE.find((x) => x.id === diseno.estilo)?.nombre}`}
        />
        <fieldset className="mt-3">
          <legend className="sr-only">Estilo de la pantalla en la vista previa</legend>
          <div className="flex flex-wrap gap-2">
            {ESTILOS_PASE.map((x) => (
              <label
                key={x.id}
                className={`inline-flex min-h-12 cursor-pointer items-center rounded-full border px-4 text-[0.95rem] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--acento)] ${diseno.estilo === x.id ? "border-[var(--acento)] bg-[var(--acento-claro)] text-[var(--acento)]" : "border-[var(--linea)] bg-white"}`}
              >
                <input
                  type="radio"
                  name={`estilo-${idTitulo}`}
                  className="sr-only"
                  checked={diseno.estilo === x.id}
                  onChange={() => setEstilo(x.id)}
                />
                {x.nombre}
              </label>
            ))}
          </div>
          <p className={`mt-2 text-[0.9rem] ${ui.suave}`}>{ESTILOS_PASE.find((x) => x.id === diseno.estilo)?.descripcion}</p>
        </fieldset>
      </div>

      {aviso && (
        <p
          role={aviso.tono === "error" ? "alert" : "status"}
          className={`rounded-xl px-4 py-3 text-[0.95rem] font-medium ${aviso.tono === "ok" ? "bg-[var(--verde-claro)] text-[var(--verde)]" : aviso.tono === "error" ? "bg-[var(--acento-claro)] text-[var(--acento)]" : "bg-[#EFECE8] text-[var(--tinta)]"}`}
        >
          {aviso.texto}
        </p>
      )}

      {!yaTiene && (
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {PLANES_MOMENTOS.directo.incluye.map((x) => (
            <li key={x} className="flex gap-2.5 text-[0.95rem] leading-snug">
              <span aria-hidden className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--acento)]" />
              {x}
            </li>
          ))}
        </ul>
      )}

      {productos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {productos.map((p, i) => {
            const principal = i === 0 && p.id !== "conservar";
            return (
              <div key={p.id} className={`flex flex-col rounded-2xl border p-5 ${principal ? "border-[var(--acento)]" : "border-[var(--linea)]"} bg-white`}>
                <p className="font-medium">{p.id === "conservar" ? "+1 año online" : p.nombre}</p>
                <p className="display mt-1 text-[2rem] leading-none tabular-nums">{euros(p.importe)}</p>
                <p className={`mt-1 text-[0.85rem] ${ui.suave}`}>Pago único · IVA incluido</p>
                <p className={`mt-3 flex-1 text-[0.95rem] leading-snug ${ui.suave}`}>{p.resumen}</p>
                <button
                  type="button"
                  disabled={Boolean(ocupado) || !e.puedeComprar || e.modo === "no"}
                  onClick={() => contratar(p.id)}
                  className={`${principal ? ui.botonLleno : ui.boton} mt-4 min-h-14 w-full`}
                >
                  {ocupado === p.id
                    ? e.modo === "stripe"
                      ? "Abriendo el pago…"
                      : "Activando…"
                    : p.id === "conservar"
                      ? `Añadir un año · ${euros(p.importe)}`
                      : `Contratar · ${euros(p.importe)}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className={`text-[0.9rem] leading-relaxed ${ui.suave}`}>
        {e.modo === "stripe"
          ? "Pago seguro con Stripe: tarjeta, Apple Pay, Google Pay o Bizum. Recibiréis la factura con el IVA desglosado. Si cambiáis de idea antes de usarlo, os devolvemos el dinero."
          : e.modo === "demo"
            ? "Modo demo: aquí no se cobra nada. Al contratar se activa al momento para que podáis probarlo."
            : "Ahora mismo no podemos cobrar en línea. Escribidnos a info@invitoo.es y lo activamos."}
        {!e.puedeComprar && " Solo los novios pueden contratar."}
      </p>

      {e.pagos.length > 0 && (
        <details className="text-[0.9rem]">
          <summary className={`inline-flex min-h-12 cursor-pointer items-center font-medium ${ui.foco}`}>Vuestras compras</summary>
          <ul className="mt-2 space-y-1">
            {e.pagos.map((p, i) => (
              <li key={i} className={ui.suave}>
                {new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(new Date(p.creado))} ·{" "}
                {PRODUCTOS[p.producto]?.nombre ?? p.producto} · {euros(p.importe)} ·{" "}
                {p.estado === "demo" ? "demo, sin cobro" : p.estado === "pagado" ? "pagado" : p.estado}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
