/**
 * `<CapaInteraccion />`: pétalos al tocar y reflejo dorado de los nombres.
 *
 *   <CapaInteraccion />                                  // lo que diga la boda
 *   <CapaInteraccion petalos={false} destellos={false} /> // la plantilla recorta
 *
 * Es un componente de SERVIDOR que solo deja una marca (`data-capa`): sin
 * JavaScript propio. El código vivo (`capa.ts` y `motor.ts`) lo descarga
 * `MovimientoCliente` únicamente si la boda tiene encendido `interaccion`
 * (reflejo, letras y chispas) o `petalosAlTocar` (pétalos). Si la boda lo
 * apaga, no se descarga ni un byte. Ponerlo es opcional: con los ajustes
 * encendidos la capa funciona igual; sirve para que una plantilla apague
 * piezas sueltas.
 */
export function CapaInteraccion({
  petalos = true,
  reflejo = true,
  destellos = true,
}: {
  petalos?: boolean;
  reflejo?: boolean;
  destellos?: boolean;
}) {
  return (
    <span
      hidden
      data-capa=""
      data-capa-petalos={petalos ? "1" : "0"}
      data-capa-reflejo={reflejo ? "1" : "0"}
      data-capa-destellos={destellos ? "1" : "0"}
    />
  );
}

export default CapaInteraccion;
