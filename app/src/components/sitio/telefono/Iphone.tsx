import s from "./telefono.module.css";

/**
 * Un iPhone actual dibujado en CSS (W2): titanio, botones de canto, bisel,
 * isla dinámica, cristal con reflejo y sombra de contacto. Es un componente
 * de servidor: el marco sale en el HTML y no cuesta JavaScript.
 *
 * Mide lo que le dé su contenedor (todo va en `cqi`). La pantalla es
 * `children`: normalmente una `PantallaViva`.
 *
 * `acabado`: «oscuro» (titanio negro, por defecto) o «claro» (titanio
 * natural). Con tres móviles juntos, alternarlos da profundidad.
 */
export default function Iphone({
  children,
  acabado = "oscuro",
  className = "",
  sinBotones = false,
}: {
  children?: React.ReactNode;
  acabado?: "oscuro" | "claro";
  className?: string;
  /** Las fichas pequeñas del catálogo no llevan botones: a ese tamaño ensucian. */
  sinBotones?: boolean;
}) {
  return (
    <div className={`${s.telefono} ${acabado === "claro" ? s.claro : ""} ${className}`}>
      <span aria-hidden className={s.sombra} />
      <div className={s.chasis}>
        {!sinBotones && (
          <>
            <span aria-hidden className={s.boton} data-lado="i" style={{ top: "17%", height: "4.6%" }} />
            <span aria-hidden className={s.boton} data-lado="i" style={{ top: "25%", height: "8.6%" }} />
            <span aria-hidden className={s.boton} data-lado="i" style={{ top: "35.5%", height: "8.6%" }} />
            <span aria-hidden className={s.boton} data-lado="d" style={{ top: "27%", height: "13%" }} />
            <span aria-hidden className={s.boton} data-lado="d" style={{ top: "62%", height: "7%" }} />
          </>
        )}
        <div className={s.bisel}>
          <div className={s.pantalla}>
            {children}
            <span aria-hidden className={s.isla} />
            <span aria-hidden className={s.cristal} />
          </div>
        </div>
      </div>
    </div>
  );
}
