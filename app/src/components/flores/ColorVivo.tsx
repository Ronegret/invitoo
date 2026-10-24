/**
 * `<ColorVivo paleta={[...]} />`: el fondo de la invitación cambia de tono,
 * muy despacio, al pasar de una sección a otra.
 *
 *   <ColorVivo />                                            // tonos sacados del papel
 *   <ColorVivo paleta={["#f7f1ea", "#f3e6e4", "#eef0e6"]} />  // uno por sección, en bucle
 *   <section data-color="#efe6da">…</section>                // una sección pide el suyo
 *
 * Componente de SERVIDOR: solo deja la paleta en una marca. El código
 * (`color-vivo.ts`, < 2 KB) lo descarga `MovimientoCliente` únicamente si la
 * boda tiene `colorVivo` encendido. Cada tono se corrige antes de usarse
 * hasta que la tinta y el acento de la boda pasan AA (4,5:1) sobre él.
 * Sin JavaScript o con «menos movimiento», el papel de siempre.
 */
export function ColorVivo({ paleta }: { paleta?: string[] }) {
  return <span hidden data-color-vivo={paleta?.length ? JSON.stringify(paleta.slice(0, 12)) : ""} />;
}

export default ColorVivo;
