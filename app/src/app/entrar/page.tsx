import type { Metadata } from "next";
import { Suspense } from "react";
import Entrar from "@/components/estudio/Entrar";

export const metadata: Metadata = {
  title: "Entrar · Invitoo",
  robots: { index: false, follow: false },
};

/**
 * Vive fuera de /estudio a propósito: si estuviera dentro, el proxy que
 * protege esa rama tendría que hacerse una excepción a sí mismo, y las
 * excepciones en una puerta es donde se cuelan las cosas.
 *
 * El Suspense es obligatorio: el formulario lee `?volver=` y sin frontera
 * Next no puede prerenderizar la página.
 */
export default function PaginaEntrar() {
  return (
    <Suspense>
      <Entrar />
    </Suspense>
  );
}
