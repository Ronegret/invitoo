import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { abrirSesionEstudio, esEmailDeEstudio } from "@/app/estudio/sesion";
import { abrirCuenta, emailVerificado, recordarSinBoda } from "@/lib/auth/cuenta";
import { destinoEstudio, destinoPanel } from "@/lib/auth/destino";
import { clienteAuth } from "@/lib/auth/supabase";

/**
 * GET /cuenta/confirmar — adonde vuelven el enlace mágico del correo y
 * «Continuar con Google».
 *
 * Formatos que admite:
 *   · `?code=` (PKCE, el de `@supabase/ssr`): enlace mágico y Google. El
 *     código solo se canjea en el navegador que guardó el `code_verifier`;
 *   · `?token_hash=&type=email` (plantilla de correo con `{{ .TokenHash }}`,
 *     que funciona aunque se abra en otro navegador);
 *   · `?error=…` (la pareja ha cancelado en Google, o Google/Supabase fallan).
 *
 * Después de entrar, la MISMA lógica que el código por email (`abrirCuenta`):
 * se busca la boda por el email verificado. Si no hay ninguna, se cierra la
 * sesión y se explica con cariño en /cuenta/sin-boda.
 *
 * `para=estudio`: Rodrigo con Google. Solo abre el estudio si el email está
 * en ESTUDIO_EMAILS; la sesión de Supabase se cierra en los dos casos (el
 * estudio usa su propia cookie).
 *
 * Nunca deja una página en blanco: todo fallo vuelve a una pantalla con aviso.
 */

const enc = encodeURIComponent;

export async function GET(peticion: NextRequest) {
  const url = peticion.nextUrl;
  const q = url.searchParams;
  const google = q.get("via") === "google";
  const estudio = q.get("para") === "estudio";
  const siguiente = estudio
    ? destinoEstudio(q.get("siguiente"))
    : destinoPanel(q.get("siguiente") ?? q.get("volver"));
  const ir = (camino: string) => NextResponse.redirect(new URL(camino, peticion.url));
  const fallo = (codigo: string) =>
    estudio ? ir(`/entrar?error=${codigo}`) : ir(`/cuenta/entrar?error=${codigo}&siguiente=${enc(siguiente)}`);

  // Cancelado en Google (access_denied) u otro error que manda Supabase.
  const err = q.get("error");
  if (err) {
    const cancelado = err === "access_denied";
    if (!cancelado) console.error("[confirmar] error del proveedor:", err, q.get("error_code") ?? "");
    return fallo(cancelado ? "google-cancelado" : google ? "google" : "enlace");
  }

  const sb = await clienteAuth();
  if (!sb) return fallo(google ? "google-off" : "enlace");

  const code = q.get("code");
  const tokenHash = q.get("token_hash");
  const tipo = (q.get("type") ?? "email") as EmailOtpType;

  const { data, error } = code
    ? await sb.auth.exchangeCodeForSession(code)
    : tokenHash && !google
      ? await sb.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
      : { data: { user: null }, error: new Error("sin código") };

  if (error || !data.user) {
    // Lo típico: abrir el enlace en otro navegador (falta el code_verifier)
    // o volver atrás y repetir un código ya usado.
    if (error) console.error("[confirmar]", error.message);
    return fallo(google ? "google" : "enlace");
  }

  const email = emailVerificado(data.user);
  if (!email) {
    await sb.auth.signOut();
    return fallo("google-sin-verificar");
  }

  if (estudio) {
    await sb.auth.signOut();
    if (esEmailDeEstudio(email) && (await abrirSesionEstudio())) return ir(siguiente);
    return fallo("google-estudio");
  }

  if (await abrirCuenta(data.user.id, email)) return ir(siguiente);

  // Cuenta verificada pero sin boda: fuera la sesión (que no quede una cuenta
  // a medias abierta) y una página que explica qué hacer.
  await sb.auth.signOut();
  await recordarSinBoda(email);
  return ir(`/cuenta/sin-boda?siguiente=${enc(siguiente)}`);
}
