"use client";

import { Anuncio, dos, useCuenta } from "@/plantillas/tematicas/cuenta";
import "./cuenta-portada.css";

/**
 * La cuenta atrás de la portada (U1). Va DENTRO del hero de las 28
 * plantillas: es lo primero que se ve al salir de la apertura.
 *
 * Una fila de cuatro cifras grandes (días, horas, min, seg) en la letra de
 * titulares de la plantilla, con filetes finos entre ellas. Hereda el color
 * del rótulo donde se pone, así que vale igual sobre vídeo que sobre papel.
 * Cada plantilla la viste con variables (`--cp-*`, ver `cuenta-portada.css`)
 * y un `estilo` que cambia el separador.
 *
 * Sin parpadeos y sin JavaScript:
 *  · El HTML del servidor trae las cifras vacías y, debajo, la fecha.
 *    Un guion en línea, justo detrás, rellena los números ANTES del primer
 *    pintado (la página es estática: el servidor no sabe qué día es).
 *  · Sin JavaScript (`html:not(.js)`) se ve solo la fecha, que siempre es
 *    verdad.
 *  · Al hidratar, React respeta lo que puso el guion (`suppressHydrationWarning`)
 *    y sigue con el reloj.
 *
 * Accesibilidad: las cifras son `aria-hidden`; lo que se anuncia es la
 * frase de `Anuncio` (aria-live, cambia una vez por minuto).
 *
 * Movimiento (con permiso): la cifra de los segundos rueda hacia arriba al
 * cambiar (como el Counter de la librería de Rodrigo, pero en CSS) y las
 * cuatro celdas entran escalonadas, desenfocadas, al retirarse la apertura.
 */
export type EstiloCuenta = "filete" | "punto" | "dos-puntos" | "rombo";

const CELDAS = [
  ["d", "días"],
  ["h", "horas"],
  ["m", "min"],
  ["s", "seg"],
] as const;

/** Rellena las cifras antes de pintar. Se serializa: nada de fuera. */
function rellenar(raiz: HTMLElement | null) {
  /* eslint-disable no-var */
  if (!raiz) return;
  var fin = new Date(raiz.getAttribute("data-hasta") || "").getTime();
  if (!isFinite(fin)) return;
  var t = Math.max(0, Math.floor(fin / 1000) - Math.floor(Date.now() / 1000));
  if (t === 0) return;
  var v: Record<string, number> = { d: Math.floor(t / 86400), h: Math.floor(t / 3600) % 24, m: Math.floor(t / 60) % 60, s: t % 60 };
  var celdas = raiz.querySelectorAll("[data-cp]");
  for (var i = 0; i < celdas.length; i++) {
    var k = celdas[i].getAttribute("data-cp") || "";
    var n = v[k];
    celdas[i].textContent = k === "d" ? String(n) : (n < 10 ? "0" : "") + n;
  }
  raiz.setAttribute("data-lleno", "1");
  /* eslint-enable no-var */
}
const GUION = `(${rellenar.toString()})(document.currentScript&&document.currentScript.previousElementSibling);`;

export default function CuentaPortada({
  hasta,
  estilo = "filete",
  antes = "Faltan",
  className = "",
}: {
  hasta: string;
  estilo?: EstiloCuenta;
  /** El rótulo pequeño de arriba. Vacío: sin rótulo. */
  antes?: string;
  className?: string;
}) {
  const c = useCuenta(hasta);
  const fecha = c.fecha ? c.fecha.charAt(0).toUpperCase() + c.fecha.slice(1) : "";

  if (c.vivo && c.estado !== "falta") {
    return (
      <div className={`cp ${className}`} data-cuenta="" data-estilo={estilo}>
        <p className="cp-fin">{c.estado === "hoy" ? "Hoy nos casamos" : "Ya nos casamos"}</p>
        <Anuncio c={c} />
      </div>
    );
  }

  const valores = { d: String(c.d), h: dos(c.h), m: dos(c.m), s: dos(c.s) };

  return (
    <>
      <div
        className={`cp ${className}`}
        data-cuenta=""
        data-estilo={estilo}
        data-hasta={hasta}
        data-lleno={c.vivo ? "1" : undefined}
        suppressHydrationWarning
      >
        {antes && <p className="cp-antes">{antes}</p>}
        <div className="cp-cifras" aria-hidden="true">
          {CELDAS.map(([k, etiqueta], i) => (
            <div key={k} className="cp-celda" style={{ "--i": i } as React.CSSProperties}>
              <span className="cp-num">
                <span
                  key={k === "s" ? valores.s : k === "d" ? valores.d : undefined}
                  className={k === "s" ? "cp-rueda" : undefined}
                  data-cp={k}
                  suppressHydrationWarning
                >
                  {c.vivo ? valores[k] : ""}
                </span>
              </span>
              <span className="cp-etq">{etiqueta}</span>
            </div>
          ))}
        </div>
        {/* Sin JavaScript: la fecha. */}
        <p className="cp-fecha">{fecha}</p>
        <Anuncio c={c} />
      </div>
      {!c.vivo && <script dangerouslySetInnerHTML={{ __html: GUION }} />}
    </>
  );
}
