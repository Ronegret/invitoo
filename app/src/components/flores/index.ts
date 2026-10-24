// La invitación viva (F1). API estable para las plantillas (F2):
//
//   <Florecer variante="peonia|rosa|eucalipto|azahar|olivo|lavanda" tono? hoja? tamano? lado? densidad? alCargar? retraso? />
//   <Guirnalda esquina="sup-izq|sup-der|inf-izq|inf-der" tono? tamano? densidad? />
//   <Ramo tono? tamano? densidad? />
//   <FirmaManuscrita nombres prefijo? color? />
//   <NombresVivos as?="h1">Laura y Rubén</NombresVivos>   (o class «vt-nombres» en el h1)
//   <CapaInteraccion petalos? reflejo? destellos? />        (opcional: la monta el movimiento)
//   <ColorVivo paleta?={["#…", …]} />  ·  <section data-color="#…">
//
// Todo es de servidor salvo FirmaManuscrita. Lo vivo lo descarga
// MovimientoCliente solo si la boda lo enciende (Movimiento: flores,
// interaccion, colorVivo, petalosAlTocar).
export { Florecer, Guirnalda, Ramo } from "./Florecer";
export type { VarianteFlor, PropsFlorecer } from "./Florecer";
export { CapaInteraccion } from "./CapaInteraccion";
export { ColorVivo } from "./ColorVivo";
export { FirmaManuscrita } from "../sobre/FirmaManuscrita";
export { NombresVivos } from "./NombresVivos";
