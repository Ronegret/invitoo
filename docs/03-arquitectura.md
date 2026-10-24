# Invitoo — Arquitectura técnica

---

## 1. Decisión de stack

| Capa | Elección | Por qué esta y no otra |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | Las invitaciones son páginas públicas, estáticas por naturaleza y con URL propia. Next las pre-renderiza y las sirve desde CDN: TTFB de ~20 ms frente a los 1.360 ms actuales. |
| Hosting | **Vercel** | Despliegue por push, preview por rama (le enseñas la invitación a la pareja antes de publicarla, con URL propia), CDN global incluido, coste ~0 en este volumen. |
| Estilos | **Tailwind v4 + tokens CSS** | La paleta de cada boda son variables CSS por invitación. Tailwind da la base; los tokens dan la personalización. Una sola hoja de estilos, no 103. |
| Datos + Auth + Ficheros | **Supabase** | Postgres + Auth + Storage + Realtime en un solo servicio. El álbum compartido necesita Storage y el muro de mensajes necesita Realtime: cualquier otra opción son dos proveedores más. |
| Pagos | **Enlaces de pago de Stripe** | Ya existen y ya cobran. Nada de WooCommerce para vender 3 SKUs. |
| Animación | **CSS + Web Animations API + `motion`**, Lottie solo donde compense | Ver [02-estrategia.md §4](02-estrategia.md). |
| Videollamada | **Google Meet**, reservado con la página de citas de Google Calendar | Las reuniones ya se hacen por Meet. La página de citas de Calendar crea el Meet sola y se sincroniza con la agenda: cero herramientas nuevas. Sustituye a Simply Schedule Appointments. |
| Email | **Resend** | Confirmaciones de RSVP y avisos a los novios. |

### Lo que NO se usa, y por qué

- **Un CMS headless (Sanity/Contentful).** Sobra. El contenido de una invitación son ~40 campos con una forma fija. Es una fila de Postgres, no un CMS.
- **Astro.** Mejor para sitios de contenido puro, pero el panel de novios y el editor son una app con estado. Next sirve ambas cosas.
- **Un editor visual tipo drag-and-drop.** Es meses de trabajo y cambia el modelo de negocio de *done-for-you* a *self-serve*, que es justo la guerra de precio que no se debe pelear.

---

## 2. Los tres productos

```
invitoo.es              → sitio comercial (estático, ISR)
invitoo.es/i/[slug]     → la invitación (estática, revalidada al editar)
invitoo.es/novios       → panel de la pareja (RSVP, contenidos, álbum)
invitoo.es/estudio      → panel interno de Rodrigo (montar bodas)
```

Las tres comparten componentes y tokens, pero se optimizan por separado. La invitación **no carga ni un byte** del código del panel.

---

## 3. El motor de plantillas — la pieza que cambia el negocio

Hoy cada invitación se monta a mano en Elementor. Ese es el techo del negocio.

La nueva forma: **una invitación es un JSON + un `templateId`**. El código es el mismo para todas.

```ts
type Invitacion = {
  slug: string;                 // "laura-y-ruben"
  plantilla: 'sobre' | 'floracion' | 'cielo' | 'velo' | 'constelacion' | 'bruma';
  estado: 'borrador' | 'publicada' | 'archivada';
  pareja: { a: string; b: string; fecha: string; hashtag?: string };
  tema: {
    tinta: string; papel: string; acento: string;   // tokens de color
    grano: number;                                   // textura 0–1
  };
  apertura?: { vertical: string; horizontal: string; poster: string;
               rotuloEn: number; rotuloClaro: boolean };
  musica?: { url: string; titulo: string; deDedicalo: boolean };
  bloques: Bloque[];            // ordenables, todos opcionales
  idiomas: ('es' | 'en' | 'ca' | 'fr')[];
};

type Bloque =
  | { t: 'portada'; frase: string; foto?: string }
  | { t: 'cuentaAtras' }
  | { t: 'historia'; parrafos: string[]; fotos?: string[] }
  | { t: 'itinerario'; paradas: Parada[] }
  | { t: 'rsvp'; pideMenu: boolean; pideAlergias: boolean; pideBus: boolean }
  | { t: 'album'; subidaInvitados: boolean }
  | { t: 'muro' }
  | { t: 'playlist'; spotify: string }
  | { t: 'regalos'; iban?: string; enlacePago?: string }
  | { t: 'alojamiento'; opciones: Hotel[] }
  | { t: 'dressCode'; nota: string; paleta: string[] }
  | { t: 'faq'; items: { q: string; a: string }[] };
```

**Consecuencia directa:** montar una boda pasa de horas de Elementor a rellenar un formulario en `/estudio`. Ese es el ahorro que financia todo lo demás.

### Corrección: un archivo por plantilla

La primera versión de esto tenía un solo renderizador. Recorría `bloques[]` y
pintaba cada uno en el orden en que venía del JSON. Funcionaba y era poquísimo
código, pero tenía un defecto que solo se ve al mirar las doce seguidas: **las
doce eran la misma página repintada**. Mismo orden, otro color.

Y era un defecto de producto, no de código. Si lo que se vende es «elegid
plantilla», la plantilla tiene que decidir algo más que la paleta.

Ahora cada plantilla es un archivo suyo en `app/src/plantillas/`:

```
plantillas/
  comun.tsx      · las piezas (itinerario, galería, respiro…) y el contrato
  index.ts       · el registro: id de plantilla → maqueta
  sobre.tsx      · una por plantilla, con SU orden y SU criterio escrito
  cielo.tsx
  …
```

Cada archivo recibe `{ inv, b }` —la boda, y un buscador de bloques por tipo—
y monta su página como quiera. La página `/i/[slug]` ya no pinta nada: busca
la maqueta en el registro y le pasa los datos.

Los datos no cambian. Una boda sigue siendo el mismo JSON: lo que cambia es
quién decide dónde va cada cosa. Ejemplos reales de lo que eso permite:

| Plantilla | Decisión | Por qué |
|---|---|---|
| `sobre` | itinerario nada más abrir, RSVP antes que la historia | la tía que la abre quiere la hora de la misa |
| `cielo` | alojamiento en segundo lugar | quien coge un avión necesita saber dónde duerme |
| `constelacion` | empieza por la fiesta, la historia al final | es una boda de noche |
| `tinta` | seis secciones en total | quitar es una posición de mercado |
| `velo` | sin hashtag ni álbum | una boda de etiqueta no los lleva, y fingirlo la abarata |

**Cómo se comprueba que siguen siendo distintas:** `herramientas/revisar.mjs`
abre las doce con un navegador, saca la lista ordenada de sus `<h2>` y falla si
dos coinciden. Es la única forma honesta de afirmarlo.

**Lo que cuesta:** duplicar un poco de JSX en doce archivos. Es el precio, y
está pagado a sabiendas: a cambio, cambiar «Cielo» no puede romper «Brasa», y
personalizar la invitación de una pareja concreta es editar un archivo.

---

## 4. Rendimiento — los objetivos son el contrato

No son aspiraciones. Si una plantilla no los cumple, no se publica.

| Métrica (móvil) | Objetivo | Hoy en invitoo.es | **Medido en el prototipo** |
|---|---|---|---|
| HTML de una invitación | < 15 KB comprimido | 256 KB | **8,3 KB** (42,6 sin comprimir, 11 bloques) |
| Hojas de estilo | 1 | 103 | **1** |
| Scripts | ≤ 4 | 60 | **9 chunks** |
| JS de cliente | ver nota | — | **170 KB comprimido** |
| Iconos | sprite < 8 KB | ~260 KB | **~2 KB inline** |
| Apertura | ≤ 2,5 MB | — | **1,8 MB** (solo se baja un montaje) |
| TTFB | < 100 ms | 1.360 ms | estático en CDN |

**Nota honesta sobre el JS.** Los 170 KB comprimidos son el suelo de React 19 + el router de Next, no código de Invitoo: nuestros componentes son unos pocos KB. Es cacheable, va diferido y no bloquea el primer pintado (el póster y el HTML llegan antes), así que el LCP no lo sufre. Pero es un suelo real y conviene decirlo, no esconderlo.

Si más adelante se quiere bajar de ahí para la invitación, hay un camino claro: sacarla del router de Next y servirla como HTML estático con islas en JavaScript plano — exactamente lo que ya haces en `aem.rodd.es`, donde `intro.js` es un script suelto de 9 KB. Serían ~15 KB en vez de 170. **No se hace ahora**: el RSVP, el muro y el álbum son formularios con estado y React los resuelve en una tarde. Se replantea si al medir en real el LCP no cumple.

**Cómo se consigue:**

- Todo lo que no es interactivo es Server Component. El RSVP, el muro y el álbum son las únicas islas de cliente.
- La apertura carga **un solo** montaje de vídeo, elegido en JS por ancho de pantalla, y el póster AVIF se pinta antes.
- Fotos por `next/image` → AVIF/WebP, `sizes` correcto, LCP con `priority`.
- Las fuentes (Bodoni Moda, Instrument Sans) van por `next/font`: se autoalojan, se subsetean y no hay ninguna petición a Google.
- Los iconos son SVG inline con `currentColor`, no archivos. Todo el set pesa ~2 KB frente a los ~260 KB de hoy.
- La música **nunca** se precarga. Se carga al primer toque del invitado.
- `next/dynamic` para el mapa: no se descarga hasta que el invitado hace scroll hasta el itinerario.

---

## 5. Datos (Supabase)

El esquema está escrito y comentado en [`supabase/schema.sql`](../supabase/schema.sql); los pasos para ponerlo en marcha, en [`supabase/README.md`](../supabase/README.md).

```
parejas        id, auth_id, email, nombres, plan, stripe_customer
invitaciones   id, slug, pareja_id, plantilla, estado, nombre_a, nombre_b,
               fecha, tema jsonb, apertura jsonb, musica jsonb, bloques jsonb
paneles        invitacion_id, token          ← enlace privado de la pareja
invitados      id, invitacion_id, nombre, grupo, acompanantes_max, token
rsvp           id, invitacion_id, nombre, asiste, acompanantes, menu,
               alergias, bus
muro           id, invitacion_id, nombre, mensaje, aprobado
album          id, invitacion_id, ruta, subido_por, aprobado
leads          id, email, origen_invitacion_id, codigo   ← motor de referidos
```

Los nombres y la fecha van en columnas y no dentro del jsonb porque se ordenan, se filtran y salen en el panel. El resto sí es jsonb: cambia de forma por boda y no se consulta nunca por dentro.

**RLS desde el día uno.** La invitación publicada es pública; todo lo demás está cerrado. La lista de quién viene, qué come y quién es alérgico a qué no se protege con «es que nadie sabe la URL».

**Tres decisiones que conviene no deshacer sin leer el porqué:**

1. **El RSVP no lleva login.** El invitado escribe su nombre y ya está. Pedirle a la tía Mari que cree una cuenta es el mayor generador de fricción posible en este producto.
2. **Las escrituras de invitados van con service role.** Consecuencia de lo anterior: sin cuenta no hay `auth.uid()` con el que darles permiso bajo RLS. La alternativa —abrir un `insert` público en `rsvp`— deja que cualquiera con el enlace meta mil filas. Las tablas quedan cerradas y la frontera de confianza son las acciones de servidor, que validan antes de escribir.
3. **El token del panel vive en `paneles`, no como columna de `invitaciones`.** RLS filtra filas, no columnas: una columna `token` en una tabla con lectura pública se la lleva cualquiera que pida la fila.

### La puerta del estudio

`/estudio` lo protege [`src/proxy.ts`](../app/src/proxy.ts), que corta **antes** de renderizar.

El primer intento fue comprobar la sesión en el layout y devolver el formulario en lugar de `children`. **No valía, y se comprobó midiendo:** en el App Router los `children` se renderizan aunque el layout no los pinte, y su resultado acaba serializado en el payload RSC. La página de login llevaba dentro los nombres y los slugs de las bodas; con datos reales llevaría los borradores y los enlaces privados de los paneles. Verificado después del arreglo: cero apariciones.

Autenticación por clave compartida, no por cuentas: en el estudio entra una persona. La cookie guarda el hash, es `httpOnly`, `SameSite=Lax`, y la comparación es en tiempo constante.

---

## 6. Migración

1. Construir el motor y las 6 plantillas.
2. Migrar las 5 invitaciones vivas al nuevo motor, con la misma URL (`invitoo.es/amoryelegancia` → redirección 301 a `/i/laura-y-ruben`, o conservar el slug antiguo).
3. Nueva invitoo.es.
4. **Mantener WordPress vivo en `old.invitoo.es`** hasta que todas las bodas activas hayan pasado. Ninguna pareja puede encontrarse con un 404 dos días antes de su boda.
5. Mapa de redirecciones 301 completo para no perder el SEO existente.
6. Apagar WordPress.

---

## 7. Coste operativo estimado

**ESTIMACIÓN**, con volumen bajo (< 50 bodas/año):

| | |
|---|---|
| Vercel | 0 € (Hobby) → 20 €/mes si hace falta Pro |
| Supabase | 0 € → 25 €/mes al superar el free tier de Storage |
| Stripe | 1,5 % + 0,25 € por cobro |
| Resend | 0 € hasta 3.000 emails/mes |
| Dominio | ~12 €/año |
| **Total** | **0–45 €/mes** frente al hosting WordPress + licencias de Elementor Pro y addons actuales |

Además desaparece el mantenimiento: sin actualizaciones de plugins, sin conflictos entre addons, sin riesgo de que una boda se caiga el sábado por la mañana.
