import "server-only";

import { cache } from "react";
import { sesionValida } from "@/app/estudio/sesion";
import {
  invitacionPorSlug,
  invitacionPorToken,
  modoDemo,
  rolEnBoda,
  type Rol,
} from "@/lib/datos";
import { cuentaDemo, emailVerificado } from "./cuenta";
import { clienteAuth } from "./supabase";
import { tokensGuardados } from "./enlace";

/**
 * ¿Quién puede tocar esta boda?
 *
 * Tres llaves, en este orden:
 *   (a) la sesión del estudio (cookie de `app/estudio/sesion.ts`): Rodrigo;
 *   (b) una cuenta de Supabase Auth que es miembro de la boda (`miembros`);
 *   (c) el enlace privado `/novios/<token>`, que deja su token en una cookie.
 *
 * El proxy solo mira si hay ALGUNA cookie; la decisión de verdad se toma aquí,
 * dentro de cada página y de cada acción de servidor, porque una server
 * action se puede llamar por POST desde cualquier ruta.
 *
 * `cache` de React: dentro de una misma petición, el layout y la página
 * comparten la respuesta y no se pregunta dos veces a la base.
 */

export type Via = "estudio" | "novios";

export type Acceso = {
  via: Via;
  /** Cómo ha entrado, con más detalle que `via`. */
  llave: "estudio" | "cuenta" | "enlace";
  rol: Rol;
  invitacionId: string;
  slug: string;
  usuario: { id: string; email: string | null } | null;
};

/** La cuenta de Supabase de esta petición, o null. Validada con el servidor de Auth. */
export const usuarioActual = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const sb = await clienteAuth();
  if (!sb) {
    // Demo local: la cuenta «de Google» elegida en /cuenta/google-demo.
    if (!modoDemo()) return null;
    const email = await cuentaDemo();
    return email ? { id: `demo:${email}`, email } : null;
  }
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  // Solo el email VERIFICADO cuenta: la boda se busca por email, y un email
  // sin verificar lo puede escribir cualquiera.
  return { id: data.user.id, email: emailVerificado(data.user) };
});

export const accesoBoda = cache(async (slug: string): Promise<Acceso | null> => {
  const inv = await invitacionPorSlug(slug);
  if (!inv) return null;

  const [estudio, usuario] = await Promise.all([sesionValida(), usuarioActual()]);
  if (estudio) {
    return { via: "estudio", llave: "estudio", rol: "estudio", invitacionId: inv.id, slug, usuario };
  }

  if (usuario) {
    const rol = await rolEnBoda(inv.id, usuario.id, usuario.email);
    if (rol) return { via: "novios", llave: "cuenta", rol, invitacionId: inv.id, slug, usuario };
  }

  for (const token of await tokensGuardados()) {
    const porToken = await invitacionPorToken(token);
    if (porToken?.id === inv.id) {
      return { via: "novios", llave: "enlace", rol: "pareja", invitacionId: inv.id, slug, usuario };
    }
  }
  return null;
});

export class SinAcceso extends Error {
  constructor() {
    super("No tenéis acceso a esta boda.");
    this.name = "SinAcceso";
  }
}

/**
 * Primera línea de CADA acción que toca una boda (contrato del brief: lo usan
 * también `guardarMovimiento` de M y las acciones de «En directo» de D).
 * Lanza si no hay acceso.
 */
export async function exigirAccesoBoda(slug: string): Promise<Acceso> {
  const acceso = await accesoBoda(slug);
  if (!acceso) throw new SinAcceso();
  return acceso;
}

/** ¿Puede invitar o quitar miembros y borrar datos? El planner no. */
export function puedeAdministrar(a: Acceso) {
  return a.rol === "pareja" || a.rol === "estudio";
}
