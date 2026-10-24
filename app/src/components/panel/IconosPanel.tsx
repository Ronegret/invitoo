/**
 * Iconos de la navegación del panel. Misma regla que `components/Iconos.tsx`:
 * trazo fino de 1,5 sobre 24, `currentColor` y sin relleno. Siempre van con
 * su texto al lado: un icono solo no explica nada.
 */
const TRAZOS = {
  hoy: "M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6l1.4 1.4 M17 17l1.4 1.4 M5.6 18.4 7 17 M17 7l1.4-1.4 M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  invitados: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5 M16 4.3a3.5 3.5 0 0 1 0 6.4 M18 14.8c1.9.7 3.2 2.4 3.5 5.2",
  respuestas: "M5 4.5h14v15H5v-15Z M8.5 9.5l2 2 4-4 M8.5 15h7",
  deseos: "M5 4.5h10.5a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3v-12Z M5 16.5a3 3 0 0 1 3-3h10.5 M12 10.6s-2.6-1.6-2.6-3.3a1.4 1.4 0 0 1 2.6-.7 1.4 1.4 0 0 1 2.6.7c0 1.7-2.6 3.3-2.6 3.3Z",
  directo: "M3.5 7.5h3l1.5-2.5h8l1.5 2.5h3v11h-17v-11Z M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  qr: "M4 4h6v6H4V4Z M14 4h6v6h-6V4Z M4 14h6v6H4v-6Z M14 14h2v2h-2v-2Z M18 18h2v2h-2v-2Z M18 14h2 M14 18v2",
  estrella: "M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8L12 3.8Z",
  lapiz: "M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5l-4 1Z M13.5 7.5l3 3",
  libro: "M12 6.5c-2-1.4-4.7-2-8-2v13c3.3 0 6 .6 8 2 2-1.4 4.7-2 8-2v-13c-3.3 0-6 .6-8 2Z M12 6.5v13",
  dia: "M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z",
  mensaje: "M20.5 15a2 2 0 0 1-2 2H8l-4.5 3.5V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10Z",
  diseno: "M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.3-1.7-.4-1.2.4-2.3 1.7-2.3H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z M7.5 11.5h.01 M10 7.5h.01 M14.5 7.5h.01",
  cuenta: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4.5 20.5c.8-3.6 3.8-6 7.5-6s6.7 2.4 7.5 6",
  mas: "M5 12h.01 M12 12h.01 M19 12h.01",
  ojo: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  salir: "M15 4.5h3.5v15H15 M10 8l-4 4 4 4 M6 12h10",
  whatsapp: "M4 20l1.2-4A8 8 0 1 1 8 18.9L4 20Z M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2-1.5 1Z",
  campana: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z M10 20.5a2 2 0 0 0 4 0",
  descargar: "M12 4v11 M7.5 10.5 12 15l4.5-4.5 M5 19.5h14",
  mas_simple: "M12 5v14 M5 12h14",
  imprimir: "M7 9V4h10v5 M6 18H4.5v-7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7H18 M7 14h10v6H7v-6Z",
  alerta: "M12 4 2.8 19.5h18.4L12 4Z M12 10v4.5 M12 17h.01",
  check: "M4.5 12.5 9.5 17.5 19.5 6.5",
  copiar: "M8.5 8.5h11v11h-11v-11Z M15.5 8.5v-4h-11v11h4",
  candado: "M6.5 10.5h11v9h-11v-9Z M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5 M12 14v2",
  cambio: "M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5l-4 1Z M13 20h7",
  cerrar: "M6 6l12 12 M18 6 6 18",
} as const;

export type IconoPanelId = keyof typeof TRAZOS;

export default function IconoPanel({
  id,
  size = 22,
  className,
}: {
  id: IconoPanelId;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {TRAZOS[id].split(" M").map((parte, i) => (
        <path key={i} d={i === 0 ? parte : `M${parte}`} />
      ))}
    </svg>
  );
}
