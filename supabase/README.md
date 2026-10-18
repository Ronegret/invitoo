# Poner Supabase en marcha

Diez minutos. No hace falta CLI.

## 1. Crear el proyecto

[supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.

- Región: **West EU (Ireland)** o **EU Central (Frankfurt)**. Los invitados están en España; el RSVP se nota.
- Guarda la contraseña de la base de datos donde la guardes todo.

## 2. Ejecutar el esquema

SQL Editor → pega [`schema.sql`](schema.sql) entero → **Run**.

Crea las tablas, los índices, las políticas de RLS, el bucket del álbum y los dos triggers. Es idempotente: se puede volver a lanzar sin romper nada.

## 3. Las claves

Project Settings → **API**. Copia `app/.env.example` a `app/.env.local` y rellena:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ESTUDIO_CLAVE=<una clave larga>
```

**La service role key no lleva `NEXT_PUBLIC_` y no debe llevarlo nunca.** Quien la tiene, tiene toda la base de datos sin pasar por RLS. Va solo en servidor.

En Vercel, las mismas cuatro en Project Settings → Environment Variables.

## 4. Comprobar

```bash
cd app && npm run dev
```

- `/estudio` → pide la clave → «Nueva boda» → guardar → la invitación existe en `/i/<slug>`.
- En `/estudio`, el botón **Panel** de cada boda abre el enlace privado de la pareja.

Sin `.env.local` la aplicación **también arranca**: tira de `src/data/demo.ts`. Es a propósito — el prototipo tiene que funcionar en cualquier máquina sin credenciales.

---

## Decisiones que conviene entender antes de tocar nada

### Quién puede leer qué

| Tabla | Lectura pública | Lectura de la pareja | Escritura |
|---|---|---|---|
| `invitaciones` | solo `estado = 'publicada'` | las suyas | estudio (service role) |
| `rsvp` · `muro` · `album` · `invitados` | **nunca** | las suyas | service role, desde acciones validadas |
| `paneles` · `leads` | **nunca** | **nunca** | service role |

### Por qué las escrituras van con service role

El invitado no tiene cuenta —y no la va a tener, porque pedirle a la tía Mari que se registre es el mayor generador de fricción posible en este producto—. Sin cuenta no hay `auth.uid()`, así que no hay forma de darle permiso bajo RLS.

La alternativa sería abrir un `insert` público en `rsvp`, y entonces cualquiera con el enlace puede meter mil filas. Se hace al revés: las tablas quedan cerradas y solo escriben las acciones de servidor de `src/app/acciones.ts`, que validan antes. Esa es la frontera de confianza.

### Por qué el token del panel está en su propia tabla

`invitaciones` tiene una política de lectura pública para las publicadas, y **RLS filtra filas, no columnas**. Un `token_novios` como columna de esa tabla se lo llevaría cualquiera que pidiese la fila de la invitación — es decir, cualquiera con el enlace. Por eso vive en `paneles`, que no tiene ninguna política: solo se lee con service role.

### Lo que falta

- **Auth de verdad para la pareja.** Ahora el panel va por enlace privado, que es suficiente y no tiene fricción. Si algún día quieren editar contenidos ellos mismos, entonces sí hace falta Supabase Auth y las políticas de `parejas` ya están escritas para eso.
- **Subida de fotos al álbum.** El bucket existe y es privado. Falta la ruta que emite la URL firmada; no se deja subir con la anon key desde el navegador porque cualquiera con el enlace de la invitación podría llenarlo.
- **Aviso por email a los novios** cuando alguien confirma (Resend).
