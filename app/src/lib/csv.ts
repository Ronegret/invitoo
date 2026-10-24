/**
 * CSV que Excel abre bien a la primera en un ordenador español:
 * BOM UTF-8 (si no, las tildes salen rotas), separador `;` (la coma es el
 * separador decimal) y CRLF.
 *
 * Los nombres y mensajes los escriben los invitados, así que se neutraliza la
 * inyección de fórmulas: una celda que empieza por = + - @ se prefija con '.
 */

function celda(valor: unknown): string {
  let t = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  if (/[;"\r\n]/.test(t)) t = `"${t.replace(/"/g, '""')}"`;
  return t;
}

export function aCsv(filas: unknown[][]): string {
  return "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n") + "\r\n";
}

export function respuestaCsv(nombreArchivo: string, contenido: string) {
  return new Response(contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
