/**
 * Iconos de la invitación.
 *
 * Sustituyen a los SVG autotrazados del archivo, que pesan entre 5 y 76 KB
 * cada uno (y hasta 41 MB en local). Ver docs/05-archivo.md §2.
 *
 * Reglas: trazo de 1,4 sobre lienzo de 24, `currentColor` para que hereden
 * el acento de cada boda, y sin `fill`. Todo el set junto pesa menos que uno
 * solo de los antiguos.
 */

const TRAZOS: Record<string, string> = {
  anillos: "M9.5 15.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm5 0a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z M9.5 3.2 8 5.4h3L9.5 3.2Z",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7.2V12l3.2 2",
  iglesia: "M12 2.5v4 M10 4.5h4 M5 21V11l7-5 7 5v10 M9.5 21v-5h5v5",
  copas: "M6 3h12l-1.2 5a4.8 4.8 0 0 1-9.6 0L6 3Z M12 13v8 M8.5 21h7",
  mapa: "M12 21s6.5-6 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15 12 21 12 21Z M12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  coche: "M4 16.5h16 M5.5 16.5V19H8v-2.5 M16 16.5V19h2.5v-2.5 M4.5 16.5l1.3-5.2A2 2 0 0 1 7.7 9.8h8.6a2 2 0 0 1 1.9 1.5l1.3 5.2 M7.5 13.2h9",
  camara: "M3.5 8.5h3.2l1.3-2h8l1.3 2h3.2v10h-17v-10Z M12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z",
  plato: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  nota: "M9 18V5.5l10-2V16 M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
  regalo: "M3.5 9.5h17v3h-17v-3Z M5 12.5V21h14v-8.5 M12 9.5V21 M12 9.5S9 9.5 8 8.4c-.8-.9-.3-2.4 1-2.4s3 3.5 3 3.5Zm0 0s3 0 4-1.1c.8-.9.3-2.4-1-2.4s-3 3.5-3 3.5Z",
  sobre: "M3.5 6h17v12h-17V6Z M3.5 6.8 12 13l8.5-6.2",
  mensaje: "M20.5 15.5a2 2 0 0 1-2 2H8l-4.5 3.5V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10.5Z",
  cama: "M3 19v-8 M3 13h18v6 M21 19v-3 M6.5 10.5h4v2.5h-4v-2.5Z M13.5 13V10a.5.5 0 0 1 .5-.5h5a2 2 0 0 1 2 2v1.5",
  percha: "M12 8.2a2.1 2.1 0 1 1 2.1-2.1 M12 8.2v2 M3.5 16.2 12 10.2l8.5 6a1.2 1.2 0 0 1-.7 2.2H4.2a1.2 1.2 0 0 1-.7-2.2Z",
  // Para las listas de «esto lo lleva»: una palomilla fina, no un tic gordo
  // de formulario. Al lado de una didone, un icono grueso canta.
  check: "M4.5 12.5 9.5 17.5 19.5 6.5",
  candado: "M6.5 10.5h11v9h-11v-9Z M9 10.5V7.8a3 3 0 0 1 6 0v2.7",
};

export type IconoId = keyof typeof TRAZOS;

export default function Icono({
  id,
  size = 22,
  className,
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const d = TRAZOS[id];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {d.split(" M").map((parte, i) => (
        <path key={i} d={i === 0 ? parte : `M${parte}`} />
      ))}
    </svg>
  );
}
