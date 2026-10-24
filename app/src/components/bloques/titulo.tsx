import Rama from "@/components/Botanica";

/**
 * El título de un bloque compartido, con su guirnalda debajo (que en las
 * plantillas que no son Floración se cambia por el ornamento de la
 * plantilla: ver el bloque «plantillas» de globals.css).
 *
 * `alineado="izquierda"` es la composición lateral: título arriba a la
 * izquierda (o en su propia columna desde tablet) y ornamento pegado al
 * margen. Sirve para que no todas las secciones sean «icono + título +
 * ornamento + texto centrado».
 */
export default function TituloBloque({
  children,
  alineado = "centro",
  id,
}: {
  children: React.ReactNode;
  /** «lateral»: centrado en el móvil y a la izquierda desde tablet. */
  alineado?: "centro" | "izquierda" | "lateral";
  id?: string;
}) {
  const izq = alineado === "izquierda";
  const lat = alineado === "lateral";
  return (
    <>
      <h2
        id={id}
        className={`display text-[clamp(2.1rem,9vw,3.1rem)] leading-[1.08] ${izq ? "orn-izq text-left" : lat ? "orn-lateral text-center sm:text-left" : "text-center"}`}
      >
        {children}
      </h2>
      <Rama
        forma="guirnalda"
        ancho={170}
        className={`mt-5 text-[var(--acento-texto,var(--acento))] opacity-45 ${izq ? "" : lat ? "mx-auto sm:mx-0" : "mx-auto"}`}
      />
    </>
  );
}
