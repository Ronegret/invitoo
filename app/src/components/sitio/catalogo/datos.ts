import { fechaEspaciada } from "@/components/sitio/portada/PortadaSobre";
import { DEMO } from "@/data/demo";
import { PLANTILLAS } from "@/data/plantillas";
import { ESTILO_PLANTILLA } from "@/data/sitio";
import type { FichaCatalogo } from "./CatalogoVivo";

/**
 * Las fichas del catálogo vivo, calculadas en el servidor a partir de
 * `PLANTILLAS` (una sola verdad: si el catálogo cambia, esto cambia solo).
 */
export function fichasCatalogo(): FichaCatalogo[] {
  return PLANTILLAS.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    demo: p.demo,
    etiqueta: p.etiqueta,
    gesto: p.gesto,
    para: p.para,
    pareja: p.pareja,
    fecha: fechaEspaciada(DEMO[p.demo]?.pareja.fecha),
    fechaIso: (DEMO[p.demo]?.pareja.fecha ?? "").slice(0, 10),
    estilos: ESTILO_PLANTILLA[p.id] ?? [],
    colores: (p.variantes.length
      ? p.variantes
      : [{ id: "base", nombre: "Original", papel: p.tema.papel, tinta: p.tema.tinta, acento: p.tema.acento }]
    ).map((v) => ({ id: v.id, nombre: v.nombre, papel: v.papel, tinta: v.tinta, acento: v.acento })),
  }));
}
