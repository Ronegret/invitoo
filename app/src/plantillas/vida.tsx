import Cifra from "./Cifra";

/**
 * Piezas de «vida» que comparten las nueve plantillas (F2). Todas son de
 * servidor salvo `Cifra`; el movimiento es CSS (`vida.css`).
 *
 * REGLA: el texto real va siempre en el HTML (se lee sin JavaScript, se
 * copia y el lector de pantalla lo anuncia entero); los efectos van en
 * capas `aria-hidden` o en el propio CSS.
 */

/**
 * Texto que se ENFOCA letra a letra: cada letra llega desenfocada y un
 * poco más abierta, y se asienta. `al="carga"` en la portada (con la
 * página); `al="scroll"` en el cuerpo, ligado al scroll con
 * `animation-timeline: view()` donde exista (y quieto donde no).
 * Las palabras no se parten: cada una va entera en su caja.
 */
export function Enfoca({
  texto,
  al = "scroll",
  className,
  retraso = 0,
}: {
  texto: string;
  al?: "carga" | "scroll";
  className?: string;
  /** ms antes de la primera letra (solo «carga»). */
  retraso?: number;
}) {
  let n = 0;
  const palabras = texto.split(/(\s+)/);
  return (
    <span className={`enfoca ${className ?? ""}`} data-enfoca={al} style={{ "--e0": `${retraso}ms` } as React.CSSProperties}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        {palabras.map((p, i) =>
          /^\s+$/.test(p) ? (
            " "
          ) : (
            <span key={i} className="enfoca-palabra">
              {Array.from(p).map((l, j) => (
                <span key={j} className="enfoca-l" style={{ "--l": n++ } as React.CSSProperties}>
                  {l}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </span>
  );
}

/**
 * Una cita grande en cursiva, a página completa: la frase de la pareja.
 * Las comillas son de la plantilla (tipográficas, en el acento) y la
 * firma es opcional. En escritorio respira a dos columnas si hay foto.
 */
export function CitaGrande({
  frase,
  firma,
  foto,
  alt = "",
}: {
  frase: string;
  firma?: string;
  foto?: string;
  alt?: string;
}) {
  if (!frase) return null;
  return (
    <section className={`cita-grande ${foto ? "cita-con-foto" : ""}`} aria-label="Unas palabras de los novios">
      {foto && (
        <figure className="cita-foto revela-foto">
          {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
          <img src={foto} alt={alt} width={900} height={1125} loading="lazy" decoding="async" />
        </figure>
      )}
      <div className="cita-texto">
        <span aria-hidden="true" className="cita-comilla">
          “
        </span>
        <blockquote className="display cita-frase">{frase}</blockquote>
        {firma && <p className="cita-firma">{firma}</p>}
      </div>
    </section>
  );
}

export { Cifra };
