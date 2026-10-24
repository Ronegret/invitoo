import type { MetadataRoute } from "next";

/** Manifiesto PWA con los iconos de marca (M1 · `herramientas/marca/`). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Invitoo · Invitaciones digitales",
    short_name: "Invitoo",
    description: "Invitaciones de boda digitales, diseñadas a medida.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#8C1D2C",
    icons: [
      { src: "/marca/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/marca/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/marca/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/marca/icono.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
