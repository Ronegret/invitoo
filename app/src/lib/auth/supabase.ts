import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * El cliente de Supabase Auth con la sesión del usuario en cookies
 * (`@supabase/ssr`). Solo para autenticación: leer quién es y pedir o
 * verificar el código. Los datos se siguen leyendo con service role en
 * `lib/datos.ts`, DESPUÉS de comprobar el acceso en `acceso.ts`.
 *
 * Sin `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` devuelve
 * null y el panel funciona solo con el enlace privado o la demo.
 *
 * En un Server Component no se pueden escribir cookies: el `setAll` falla en
 * silencio y la sesión la refresca el proxy (`src/proxy.ts`), que sí puede.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hayAuth() {
  return Boolean(URL && ANON);
}

export async function clienteAuth() {
  if (!URL || !ANON) return null;
  const almacen = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        } catch {
          // Server Component: lo refresca el proxy.
        }
      },
    },
  });
}
