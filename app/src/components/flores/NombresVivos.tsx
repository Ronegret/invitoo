/**
 * `<NombresVivos>Laura y Rubén</NombresVivos>`: un titular de nombres que la
 * capa viva reconoce (`vt-nombres`): se enfoca letra a letra al salir de la
 * apertura y lleva el reflejo dorado que sigue al dedo o a la inclinación.
 * Componente de servidor: sin JavaScript, el titular de siempre.
 * Las plantillas que ya ponen `className="vt-nombres"` en su <h1> no lo necesitan.
 */
export function NombresVivos({
  children,
  as: Etiqueta = "h1",
  className = "",
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "p";
  className?: string;
}) {
  return <Etiqueta className={`vt-nombres ${className}`}>{children}</Etiqueta>;
}

export default NombresVivos;
