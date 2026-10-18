import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Clientes de Supabase.
 *
 * Dos, y la diferencia importa:
 *
 *  · `anonimo()` usa la anon key y respeta RLS. Es el que lee invitaciones
 *    publicadas, que son públicas por definición.
 *  · `servicio()` usa la service role key y SE SALTA RLS. Solo se usa desde
 *    acciones de servidor, nunca en un componente que llegue al navegador,
 *    porque quien tiene esa clave tiene toda la base de datos.
 *
 * Si no hay variables de entorno, ambos devuelven null y la aplicación tira
 * de los datos de ejemplo. Así el prototipo sigue arrancando sin proyecto.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function haySupabase() {
  return Boolean(URL && ANON);
}

export function anonimo() {
  if (!URL || !ANON) return null;
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

export function servicio() {
  if (!URL || !SERVICIO) return null;
  return createClient(URL, SERVICIO, { auth: { persistSession: false } });
}
