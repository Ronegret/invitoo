import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Para que varias personas (o agentes) puedan tener su propio `next dev`
  // sin pisarse la carpeta de compilación. Por defecto, la de siempre.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Sin la «N» de Next.js en la esquina mientras se prueba en local.
  devIndicators: false,
};

export default nextConfig;
