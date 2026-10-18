"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, huella, iguales } from "./sesion";

export async function entrar(_previo: string | null, datos: FormData) {
  const volver = String(datos.get("volver") ?? "");
  const esperada = process.env.ESTUDIO_CLAVE;
  if (!esperada) return "Falta ESTUDIO_CLAVE en el entorno.";

  // Se comparan los hashes, no las cadenas: así la comparación es siempre
  // sobre la misma longitud y no delata nada por el tiempo que tarda.
  if (!iguales(huella(String(datos.get("clave") ?? "")), huella(esperada))) {
    return "No es esa.";
  }

  (await cookies()).set(COOKIE, huella(esperada), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/estudio",
    maxAge: 60 * 60 * 24 * 14,
  });
  // Solo rutas internas: un `volver` con dominio ajeno sería una redirección
  // abierta de manual.
  redirect(volver.startsWith("/estudio") ? volver : "/estudio");
}

export async function salir() {
  (await cookies()).delete({ name: COOKIE, path: "/estudio" });
  redirect("/entrar");
}
