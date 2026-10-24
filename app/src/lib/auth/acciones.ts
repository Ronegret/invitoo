"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO } from "@/data/demo";
import { emailTieneBoda, modoDemo, sembrarDemo } from "@/lib/datos";
import { abrirCuenta, COOKIE_DEMO_GOOGLE, emailVerificado } from "./cuenta";
import { destinoPanel } from "./destino";
import { guardarToken, olvidarTokens } from "./enlace";
import { clienteAuth, hayAuth } from "./supabase";

/**
 * Entrar y salir de la cuenta de los novios. Sin contraseña: un email con un
 * enlace mágico y un código de 6 cifras (el mismo correo trae las dos cosas;
 * el código es para quien abre el correo en otro dispositivo).
 *
 * Solo se manda el correo si ese email tiene alguna boda en `miembros`. La
 * respuesta es la MISMA en los dos casos: así nadie averigua qué emails son
 * clientes a base de probar.
 */

export type EstadoEntrar =
  | { paso: "email"; error?: string }
  | { paso: "codigo"; email: string; error?: string; aviso?: string };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

/** Solo destinos internos del panel: nada de `//otro-sitio.com`. */
export async function destinoSeguro(volver: unknown): Promise<string> {
  return destinoPanel(volver);
}

async function origen() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "invitoo.es";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function pedirCodigo(_previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const volver = await destinoSeguro(datos.get("volver"));
  if (!EMAIL.test(email)) {
    return { paso: "email", error: "Revisad el email: parece que le falta algo (por ejemplo, la @)." };
  }
  const sb = await clienteAuth();
  if (!hayAuth() || !sb) {
    return {
      paso: "email",
      error: "El acceso con email todavía no está activado. Mientras tanto, entrad con el enlace privado que os mandamos.",
    };
  }

  if (await emailTieneBoda(email)) {
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${await origen()}/cuenta/confirmar?volver=${encodeURIComponent(volver)}`,
      },
    });
    if (error) {
      console.error("[pedirCodigo]", error.message);
      if (error.status === 429) {
        return { paso: "email", error: "Acabamos de mandaros un correo. Esperad un minuto antes de pedir otro." };
      }
      return { paso: "email", error: "No hemos podido mandar el correo. Probad otra vez en un momento." };
    }
  }
  return {
    paso: "codigo",
    email,
    aviso: "Si ese email lleva una boda, os acaba de llegar un correo con un enlace y un código de 6 cifras.",
  };
}

export async function verificarCodigo(_previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const codigo = String(datos.get("codigo") ?? "").replace(/\D/g, "");
  const volver = await destinoSeguro(datos.get("volver"));
  if (!EMAIL.test(email)) return { paso: "email" };
  if (codigo.length !== 6) {
    return { paso: "codigo", email, error: "El código tiene 6 cifras. Copiadlo tal cual del correo." };
  }
  const sb = await clienteAuth();
  if (!sb) return { paso: "email", error: "El acceso con email todavía no está activado." };

  const { data, error } = await sb.auth.verifyOtp({ email, token: codigo, type: "email" });
  if (error || !data.user) {
    return {
      paso: "codigo",
      email,
      error: "Ese código no vale o ha caducado (duran una hora). Pedid uno nuevo y usad el último que llegue.",
    };
  }
  // La misma lógica que Google en /cuenta/confirmar.
  const verificado = emailVerificado(data.user);
  if (verificado) await abrirCuenta(data.user.id, verificado);
  redirect(volver);
}

/** «Entrar con la boda de ejemplo». Solo en la demo local (sin Supabase). */
export async function entrarDemo(): Promise<void> {
  if (!modoDemo()) redirect("/cuenta/entrar");
  const slug = Object.keys(DEMO)[0];
  await sembrarDemo(slug);
  await guardarToken(`demo-${slug}`);
  redirect(`/panel/${slug}`);
}

export async function salir(): Promise<void> {
  const sb = await clienteAuth();
  if (sb) await sb.auth.signOut();
  await olvidarTokens();
  (await cookies()).delete(COOKIE_DEMO_GOOGLE);
  redirect("/cuenta/entrar?salida=1");
}
