/**
 * Aparición al entrar en pantalla: un fundido escalonado, pieza a pieza.
 *
 * REGLA DE ORO: esto NUNCA puede dejar contenido invisible. Una animación de
 * entrada que falla no es una animación fea, es contenido que no existe —y
 * eso ya pasó: en móvil cinco de las seis fichas de plantilla se quedaban en
 * `opacity: 0` porque el observador no llegaba a dispararse para ellas.
 *
 * Por eso este componente ya no lleva JavaScript propio. Solo marca la
 * sección con `data-revelar`; el guion en línea del lienzo
 * (`components/movimiento/programa.ts`) hace el resto con UN observador
 * para toda la página:
 *  1. El HTML del servidor sale visible. El CSS solo esconde con `html.js`
 *     Y `data-espera`, y `data-espera` solo lo pone el guion.
 *  2. Lo que ya está en pantalla al empezar no se esconde.
 *  3. Con `prefers-reduced-motion` no se esconde nada.
 *  4. Las piezas (los hijos de la sección) entran escalonadas, con la
 *     duración, la distancia y el desenfoque del movimiento de la boda
 *     (`--mov-*`, `data-mov-entrada` en el lienzo). Solo opacity,
 *     transform y filter.
 *
 * Ni un render de React por esto, y cero bytes de JS en el cliente.
 */
export default function Revelar({
  children,
  retraso = 0,
  className,
  style,
  as: Elemento = "div",
}: {
  children: React.ReactNode;
  /** Milisegundos de desfase, para escalonar hermanos. */
  retraso?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Elemento
      data-revelar=""
      // El guion le pone `data-espera`/`data-entrando` antes de hidratar.
      suppressHydrationWarning
      className={className}
      style={retraso ? ({ ...style, "--d": `${retraso}ms` } as React.CSSProperties) : style}
    >
      {children}
    </Elemento>
  );
}
