"use server";

import { redirect } from "next/navigation";
import { abrirSesionEstudio, emailsDeEstudio, esEmailDeEstudio } from "@/app/estudio/sesion";
import { anadirMiembro, invitacionPorSlug, modoDemo, sembrarDemo } from "@/lib/datos";
import { abrirCuenta, cuentasDemo, guardarCuentaDemo, recordarSinBoda } from "./cuenta";
import { destinoEstudio, destinoPanel } from "./destino";
import { googleActivado, origen } from "./google";
import { clienteAuth, hayAuth } from "./supabase";

/**
 * «Continuar con Google»: la pareja (y, si está en ESTUDIO_EMAILS, Rodrigo).
 *
 * `signInWithOAuth` en el servidor con `@supabase/ssr` usa PKCE: el
 * `code_verifier` se queda en una cookie de este navegador y el `?code=` que
 * vuelve a /cuenta/confirmar solo vale con ella. `prompt=select_account` hace
 * que Google pregunte SIEMPRE qué cuenta usar: en un móvil con dos Gmail
 * (el personal y el del trabajo) es lo que evita entrar con la equivocada.
 */

const enc = encodeURIComponent;

async function irAGoogle(retorno: string, siError: string): Promise<never> {
  if (!(await googleActivado())) redirect(siError);
  const sb = await clienteAuth();
  if (!sb) redirect(siError);
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await origen()}${retorno}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    console.error("[google] no se pudo empezar:", error?.message ?? "sin url");
    redirect(siError);
  }
  redirect(data.url);
}

/** El botón de /cuenta/entrar, /cuenta/sin-boda y cualquier «entrad». */
export async function entrarConGoogle(datos: FormData): Promise<void> {
  const siguiente = destinoPanel(datos.get("siguiente"));
  if (!hayAuth()) {
    if (modoDemo()) redirect(`/cuenta/google-demo?siguiente=${enc(siguiente)}`);
    redirect(`/cuenta/entrar?error=google-off&siguiente=${enc(siguiente)}`);
  }
  await irAGoogle(
    `/cuenta/confirmar?via=google&siguiente=${enc(siguiente)}`,
    `/cuenta/entrar?error=google-off&siguiente=${enc(siguiente)}`,
  );
}

/** «Entrar con Google» en /entrar (estudio). Solo vale con un email de la lista. */
export async function entrarEstudioConGoogle(datos: FormData): Promise<void> {
  const siguiente = destinoEstudio(datos.get("volver") ?? datos.get("siguiente"));
  if (emailsDeEstudio().length === 0) redirect("/entrar?error=google-off");
  if (!hayAuth()) {
    if (modoDemo()) redirect(`/cuenta/google-demo?para=estudio&siguiente=${enc(siguiente)}`);
    redirect("/entrar?error=google-off");
  }
  await irAGoogle(
    `/cuenta/confirmar?via=google&para=estudio&siguiente=${enc(siguiente)}`,
    "/entrar?error=google-off",
  );
}

/**
 * Demo local: «Elegid una cuenta». Simula lo que hace /cuenta/confirmar con
 * una cuenta de Google ya verificada, con la MISMA lógica (`abrirCuenta`).
 * Fuera de la demo no hace nada.
 */
export async function elegirCuentaDemo(datos: FormData): Promise<void> {
  if (!modoDemo()) redirect("/cuenta/entrar");
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const para = datos.get("para") === "estudio" ? "estudio" : "novios";

  if (para === "estudio") {
    if (esEmailDeEstudio(email) && (await abrirSesionEstudio())) {
      redirect(destinoEstudio(datos.get("siguiente")));
    }
    redirect("/entrar?error=google-estudio");
  }

  const cuentas = cuentasDemo();
  if (!cuentas.some((c) => c.email === email)) redirect("/cuenta/google-demo");

  // Las bodas de ejemplo, con cada persona de la pareja invitada por su Gmail.
  for (const c of cuentas) {
    if (!c.slug) continue;
    await sembrarDemo(c.slug);
    const inv = await invitacionPorSlug(c.slug);
    if (inv) await anadirMiembro(inv.id, { email: c.email, rol: "pareja", nombre: c.nombre });
  }

  const siguiente = destinoPanel(datos.get("siguiente"));
  if (await abrirCuenta(`demo:${email}`, email)) {
    await guardarCuentaDemo(email);
    redirect(siguiente);
  }
  await recordarSinBoda(email);
  redirect(`/cuenta/sin-boda?siguiente=${enc(siguiente)}`);
}
