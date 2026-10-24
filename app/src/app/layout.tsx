import type { Metadata } from "next";
import { Bodoni_Moda, Instrument_Sans } from "next/font/google";
import { PLANES } from "@/data/sitio";
import "./globals.css";

/**
 * Bodoni Moda como display. El logotipo de Invitoo es una didone de contraste
 * altísimo (astas gruesas, remates finos) y Bodoni es la misma familia de
 * formas: los titulares y el logo se leen como una sola voz, sin depender de
 * licenciar Cruilla para web.
 */
const display = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const texto = Instrument_Sans({
  variable: "--font-texto",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://invitoo.es"),
  title: "Invitoo · Invitaciones de boda digitales a medida",
  description:
    `Invitaciones de boda digitales a medida: apertura de cine con vuestros nombres, canción propia y confirmaciones por persona con menús y alergias. Desde ${Math.min(...PLANES.map((p) => p.precio))} €, IVA incluido.`,
  applicationName: "Invitoo",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Invitoo",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${texto.variable} h-full antialiased`}
      // Las invitaciones añaden `js` y `mov-listo` a <html> con un guion en
      // línea antes de hidratar (src/components/movimiento/programa.ts).
      suppressHydrationWarning
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
