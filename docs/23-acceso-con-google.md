# 23 · Acceso con Google (Gmail): puesta en marcha

> Para Rodrigo. Unos 20 minutos, una sola vez. Cuando termines, los novios entran en su panel con **«Continuar con Google»** en un toque, y el código por email sigue funcionando como alternativa.

**Regla de oro: el secreto de Google (Client Secret) no va nunca en el chat, en el repositorio, en `.env.example` ni en Vercel.** Solo se pega en Supabase (paso 3). En el código no hay nada de Google: la app habla con Supabase, y Supabase habla con Google.

---

## Cómo funciona (en una línea por paso)

1. La pareja pulsa «Continuar con Google» en `/cuenta/entrar`.
2. Google le pregunta qué cuenta usar (siempre, `prompt=select_account`), y vuelve a Supabase y después a `https://invitoo.es/cuenta/confirmar`.
3. Allí se canjea el código (PKCE) y se busca su boda por el **email verificado** de Google, igual que con el código por email.
   - **Si el email es el de la pareja en una boda, el de una reserva pagada (al pulsar «Vincular a una boda» en el estudio) o el de alguien invitado desde Cuenta**, entra en su panel.
   - **Si no**, ve la página «Esta cuenta de Google (x@gmail.com) no está asociada a ninguna boda» con tres botones: probar con otra cuenta, recibir un código o escribir por WhatsApp.
4. **Las dos personas de la pareja** pueden entrar con su propio Gmail. Quien ya está dentro va a **Panel → Más → Cuenta → «Quién lleva la boda»**, escribe el email de su pareja y pulsa «Dar acceso».
5. **Estudio:** en `/entrar` aparece «Entrar con Google», que solo abre el estudio a los emails de `ESTUDIO_EMAILS`. La clave de siempre sigue funcionando.

---

## 1 · Google Cloud: el proyecto y la pantalla de consentimiento

Ve a <https://console.cloud.google.com/> con la cuenta de Google de Invitoo.

1. **Crea un proyecto:** en el selector de proyectos (arriba), pulsa **Nuevo proyecto** y ponle el nombre `Invitoo`.
2. En el menú, abre **Google Auth Platform** (antes se llamaba «Pantalla de consentimiento de OAuth»). Si te lo pide, pulsa **Empezar** y rellena:
   - **Nombre de la aplicación:** `Invitoo`
   - **Correo de asistencia al usuario:** `info@invitoo.es`
   - **Audiencia: Externo** (Internal solo sirve para cuentas de una organización de Google Workspace).
   - **Información de contacto:** tu email.
3. **Branding** (Google Auth Platform → Branding):
   - **Logotipo:** el sello de Invitoo, cuadrado y de 120 × 120 px (PNG o JPG, menos de 1 MB).
   - **Página principal:** `https://invitoo.es`
   - **Política de privacidad:** `https://invitoo.es/privacidad`
   - **Condiciones del servicio:** `https://invitoo.es/condiciones`
   - **Dominios autorizados:** `invitoo.es`. Si Google te pide también el dominio del callback, añade `<tu-proyecto>.supabase.co`.
   - Guarda.
4. **Data Access** (Google Auth Platform → Acceso a datos), en «Añadir o quitar permisos», marca **solo** estos tres:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`

   Nada más. Con solo estos tres permisos no hay pantalla de «app no verificada» ni límite de 100 usuarios nuevos.
5. **Audience** (Google Auth Platform → Público), en «Estado de publicación», pulsa **Publicar aplicación** y confirma. Así queda **En producción**.
   - En modo «Prueba» solo podrían entrar las cuentas que añadieras a mano (hasta 100).
   - Con los tres permisos básicos, Google no pide la verificación de permisos.
   - Para que salgan el nombre y el logo de Invitoo en la ventana de Google, en **Branding** pulsa **Verificar la marca** (suele tardar minutos o pocos días) y después **Publicar la marca**. Mientras no esté verificada, Google muestra el dominio en vez del logo. Funciona igual.

## 2 · Google Cloud: el cliente OAuth (Web)

Google Auth Platform → **Clients** (Clientes) → **Crear cliente**:

1. **Tipo de aplicación:** Aplicación web.
2. **Nombre:** `Invitoo web`.
3. **Orígenes autorizados de JavaScript:**
   - `https://invitoo.es`
   - `http://localhost:3100` (solo para probar en local; Supabase recomienda quitarlo cuando ya no lo uses).
4. **URI de redireccionamiento autorizados**, uno solo:
   - `https://<tu-proyecto>.supabase.co/auth/v1/callback`
   - El valor exacto lo copias de Supabase → Authentication → Sign In / Providers → Google, del campo «Callback URL (for OAuth)».
   - **No** pongas aquí `invitoo.es/cuenta/confirmar`: Google vuelve a Supabase, y Supabase a Invitoo.
5. Pulsa **Crear**. Copia el **ID de cliente** y el **Secreto del cliente** directamente al paso 3. No los guardes en notas, chats ni archivos.

## 3 · Supabase: activar Google

<https://supabase.com/dashboard> → tu proyecto:

1. **Authentication → Sign In / Providers → Google:**
   - **Enable Sign in with Google:** activado.
   - **Client ID:** el del paso 2.
   - **Client Secret:** el del paso 2. Solo aquí.
   - **Skip nonce check:** desactivado (es para One Tap; aquí no se usa).
   - Guarda.
2. En la misma página, en **User Signups**, deja activado **Allow new users to sign up**. Sin eso, la primera vez que alguien entra con Google falla, y también el código por email, que crea la cuenta al entrar. No abre nada a extraños: sin boda asociada, la cuenta no ve ningún panel.
3. **Authentication → URL Configuration:**
   - **Site URL:** `https://invitoo.es`
   - **Redirect URLs** (Add URL, una a una):
     - `https://invitoo.es/cuenta/confirmar**`
     - `http://localhost:3100/cuenta/confirmar**`
     - `https://*-<equipo-de-vercel>.vercel.app/**`: las previews de Vercel. Cambia `<equipo-de-vercel>` por el sufijo que ves en las URL de tus previews, por ejemplo `invitoo-git-rama-rodrigo.vercel.app` → `*-rodrigo.vercel.app/**`.

   El `**` del final hace falta porque la vuelta lleva detrás `?via=google&siguiente=/panel/…`. Supabase **solo** redirige a URL de esta lista: aunque alguien manipule el enlace, no puede mandar a la pareja a otro sitio.
4. **Opcional:** un dominio propio de Auth (por ejemplo `auth.invitoo.es`, en Project Settings → Custom Domains, de pago). Con él, la ventana de Google dice «para ir a invitoo.es» en vez de `xxxx.supabase.co`, que inspira más confianza. Si lo activas, añade también `https://auth.invitoo.es/auth/v1/callback` en el paso 2.4.
5. **Base de datos:** lanza la migración nueva (después de las anteriores):
   ```
   node herramientas/db.mjs migrar
   ```
   `supabase/migraciones/2026-11-google.sql` hace que el email de la pareja (`parejas.email`) entre como miembro de su boda automáticamente, también en bodas nuevas. Así Google la encuentra siempre.

## 4 · Vercel: variables

Proyecto → Settings → **Environment Variables** (Production y Preview):

| Variable | Valor | Notas |
|---|---|---|
| `ESTUDIO_EMAILS` | `tu.email@gmail.com` (varios, separados por comas) | Solo servidor. Quién puede entrar al estudio con Google. Vacía = solo clave. |
| `ESTUDIO_CLAVE` | (la que ya tienes) | Sigue siendo obligatoria: la sesión del estudio se firma con ella. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (ya están) | Sin ellas no aparece el botón de Google. |

**No** hay variables de Google en Vercel. Después, haz **Redeploy**.

## 5 · Cómo probarlo

**A. En local, sin nada configurado (modo demo):**
```
cd app
INVITOO_MEMORIA=1 ESTUDIO_CLAVE=una-clave ESTUDIO_EMAILS=tu@gmail.com npx next dev -p 3100
```
1. Abre `http://localhost:3100/cuenta/entrar` y pulsa «Continuar con Google». Sale «Elegid una cuenta · Modo demo» con los Gmail de las parejas de ejemplo.
2. Elige `laura.boda@gmail.com`: entras en el panel de Laura y Rubén. En Cuenta pone «Habéis entrado con laura.boda@gmail.com».
3. Sal y elige `ruben.boda@gmail.com`: la otra mitad de la pareja entra en la misma boda.
4. Elige `otra.cuenta@gmail.com`: sale la página amable de «no está asociada».
5. «Cancelar» simula que cierras Google y sale el aviso correspondiente.
6. En `/entrar` (estudio), «Entrar con Google»: tu email abre el estudio y otro email lo rechaza.

Prueba automática: `node qa/v3/a2/flujo.mjs http://localhost:3100`.

**B. En producción (o en una preview):**
1. Abre `https://invitoo.es/cuenta/entrar` en una ventana de incógnito.
2. Pulsa «Continuar con Google» y elige el Gmail de una boda real (o crea una boda de prueba en el estudio con tu Gmail como pareja). Debes acabar en `/panel/<slug>`.
3. Prueba con un Gmail sin boda: debe salir «no está asociada», sin entrar.
4. Prueba «Cancelar» en la ventana de Google: debes volver a «Entrar» con el aviso.
5. En `/entrar`, «Entrar con Google» con tu email: abre el estudio.
6. **Si algo falla:**
   - Supabase → **Authentication → Logs**.
   - `redirect_uri_mismatch` en Google: revisa el paso 2.4.
   - Vuelve a la home en vez de a `/cuenta/confirmar`: falta la URL en Redirect URLs (paso 3.3).

## Seguridad: qué está cubierto

- **PKCE:** el código que vuelve de Google solo vale en el navegador que empezó el acceso.
- **Sin redirección abierta:** `siguiente` solo admite `/panel/...` (o `/estudio/...` en el estudio); cualquier otra cosa va a `/panel`. Además, Supabase solo vuelve a las URL de su lista.
- **Solo emails verificados:** si Google dice que el email no está verificado, no entra. Además, cualquier sesión cuenta solo con su email verificado al buscar la boda.
- **Estudio:** solo con un email de `ESTUDIO_EMAILS`. Si el email no está en la lista, se cierra la sesión y se deniega el acceso.
- **Sin secretos en el código ni en los logs:** el Client Secret vive solo en Supabase.
- **Cuentas sin boda:** se cierra la sesión al momento. La cuenta queda creada en Supabase (Authentication → Users) sin acceso a nada; puedes borrarla si quieres.

## Fuentes

- Supabase, «Login with Google»: <https://supabase.com/docs/guides/auth/social-login/auth-google>
- Supabase, «Redirect URLs» (Site URL, lista de URL, comodines `*`/`**` y previews de Vercel): <https://supabase.com/docs/guides/auth/redirect-urls>
- Google, «Sign in with Google branding guidelines» (colores del botón y uso de la «G»): <https://developers.google.com/identity/branding-guidelines>
- Google, «Manage App Audience» (Externo, Prueba / En producción, 100 usuarios de prueba y la excepción de `openid`/`email`/`profile`): <https://support.google.com/cloud/answer/15549945>
- Google, verificación de marca (Branding → Verify branding → Publish branding): <https://support.google.com/cloud/answer/15549049>
