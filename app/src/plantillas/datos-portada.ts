import { formatearFecha, partesMadrid } from "@/lib/fecha";
import type { Props } from "./comun";

/**
 * Lo que necesita cualquier portada, sacado una vez y en hora de Madrid:
 * nombres, la fecha en varias formas, la primera parada y la ciudad.
 */
export function datosPortada({ inv, b }: Pick<Props, "inv" | "b">) {
  const portada = b("portada");
  const primera = b("itinerario")?.paradas[0];
  const fecha = inv.pareja.fecha;
  const p = partesMadrid(fecha);
  const dos = (n: number) => String(n).padStart(2, "0");
  // «Camí del Far, 07820 Sant Antoni de Portmany, Ibiza» → «Ibiza».
  const trozos = primera?.direccion.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const ciudad = (trozos.at(-1) ?? "").replace(/^\d{5}\s*/, "");
  return {
    a: inv.pareja.a,
    b: inv.pareja.b,
    frase: portada?.frase ?? "",
    foto: portada?.foto,
    fechaLarga: formatearFecha(fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    fechaCorta: formatearFecha(fecha, { day: "numeric", month: "long", year: "numeric" }),
    dia: p.dia,
    mes: formatearFecha(fecha, { month: "long" }),
    anio: p.anio,
    numerica: `${dos(p.dia)}.${dos(p.mes)}.${String(p.anio).slice(2)}`,
    hora: primera?.hora ?? `${dos(p.hora)}:${dos(p.minuto)}`,
    lugar: primera?.lugar ?? "",
    ciudad,
    /**
     * Tamaño de los nombres según el más largo: «Ana» puede ir a toda
     * pantalla; «Maximiliano», no, o se sale por el lado.
     */
    tamNombres: (minRem: number, maxVw: number, anchoLetra: number, maxRem = 10) => {
      const largo = Math.max(inv.pareja.a.length, inv.pareja.b.length, 3);
      const vw = Math.min(maxVw, 88 / (largo * anchoLetra));
      return `clamp(${minRem}rem, ${vw.toFixed(1)}vw, ${maxRem}rem)`;
    },
    iniciales: `${inv.pareja.a.charAt(0)}${inv.pareja.b.charAt(0)}`,
  };
}
