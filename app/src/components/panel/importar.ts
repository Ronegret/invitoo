import type { EntradaInvitado } from "@/lib/datos";

/**
 * Leer una lista de invitados pegada o subida en CSV.
 *
 * Acepta lo que sale de la vida real: Excel en español (`;`), Google Sheets
 * (`,`), columnas copiadas (tabuladores) o líneas a mano «Nombre; plazas;
 * teléfono». Si la primera fila es una cabecera (nombre, grupo, plazas,
 * teléfono…), se usan esas columnas en cualquier orden.
 */

export const CUPO_MAX = 12;

function separador(muestra: string) {
  const primera = muestra.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const cuenta = (c: string) => primera.split(c).length - 1;
  if (cuenta("\t") > 0) return "\t";
  if (cuenta(";") > 0) return ";";
  if (cuenta(",") > 0) return ",";
  return ";";
}

/** CSV con comillas («"Pérez, Juan"») sin dependencias. */
function filasCsv(texto: string, sep: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"' && celda === "") comillas = true;
    else if (c === sep) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else celda += c;
  }
  if (celda || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas.map((f) => f.map((x) => x.trim())).filter((f) => f.some(Boolean));
}

const CABECERAS: Record<string, keyof EntradaInvitado> = {
  nombre: "nombre",
  invitado: "nombre",
  invitados: "nombre",
  grupo: "grupo",
  mesa: "grupo",
  plazas: "cupo",
  cupo: "cupo",
  personas: "cupo",
  telefono: "telefono",
  "teléfono": "telefono",
  movil: "telefono",
  "móvil": "telefono",
  whatsapp: "telefono",
};

export type Importacion = { filas: EntradaInvitado[]; malas: number[] };

export function leerLista(texto: string, grupoParaTodos: string | null): Importacion {
  const limpio = texto.replace(/^﻿/, "").slice(0, 200_000);
  const sep = separador(limpio);
  const filas = filasCsv(limpio, sep).slice(0, 601);

  let columnas: (keyof EntradaInvitado | null)[] = ["nombre", "cupo", "telefono"];
  let inicio = 0;
  const cab = filas[0]?.map((x) => CABECERAS[x.toLowerCase()] ?? null);
  if (cab && cab.includes("nombre")) {
    columnas = cab;
    inicio = 1;
  }

  const salida: EntradaInvitado[] = [];
  const malas: number[] = [];
  for (let i = inicio; i < filas.length; i++) {
    const f = filas[i];
    const valor = (k: keyof EntradaInvitado) => {
      const j = columnas.indexOf(k);
      return j >= 0 ? (f[j] ?? "").trim() : "";
    };
    const nombre = valor("nombre");
    const cupoTxt = valor("cupo");
    const cupo = cupoTxt ? Number(cupoTxt) : 1;
    if (nombre.length < 2 || !Number.isInteger(cupo) || cupo < 1 || cupo > CUPO_MAX) {
      malas.push(i + 1);
      continue;
    }
    salida.push({
      nombre: nombre.slice(0, 120),
      cupo,
      telefono: valor("telefono").slice(0, 30) || null,
      grupo: (valor("grupo") || grupoParaTodos || "").slice(0, 60) || null,
    });
  }
  return { filas: salida, malas };
}
