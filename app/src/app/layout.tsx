import type { Metadata } from "next";
import { Bodoni_Moda, Instrument_Sans } from "next/font/google";
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
  title: "Invitoo — Invitaciones de boda a medida",
  description:
    "Diseñamos la invitación de vuestra boda como una pieza a medida: su propia apertura, su propia música y vuestra historia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${texto.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
