# Brief común del equipo — reforma Invitoo (léelo entero antes de tocar nada)

Repo: `/home/claude/web` (git; el commit `base` es el punto de partida). App Next.js 16 + React 19 + Tailwind v4 + Supabase en `/home/claude/web/app`.
**Antes de escribir código lee `app/AGENTS.md`**: esta versión de Next tiene cambios; consulta `app/node_modules/next/dist/docs/` cuando uses una API (OG images, route handlers, params/searchParams, next/font, next/image).
Contexto de producto: `docs/01..06` (sobre todo `docs/06-plan-de-mejora.md`, que es el plan que estamos ejecutando, y `docs/04-diseno.md` para las reglas de marca y copy).

## Reglas de trabajo
- Trabajáis 4 agentes A LA VEZ en el mismo árbol. **Toca solo los archivos de tu área** (tabla abajo). Si necesitas algo de otra área, no lo edites: déjalo anotado en tu informe final.
- Edita con la herramienta Edit (cambios precisos). Relee un archivo justo antes de editarlo: otro agente puede haber cambiado un archivo vecino.
- **No ejecutes `next build` ni `next dev`** (compartimos `.next`). Para validar: `cd /home/claude/web/app && npx tsc --noEmit -p .` y `npx eslint <tus archivos>`. Los errores de tipos de archivos de otra área ignóralos si no los causas tú.
- No hay base de datos en este entorno (no hay `.env.local`): la app usa los datos de ejemplo de `src/data/demo.ts`. El código tiene que seguir funcionando con Supabase en producción y sin él en local.
- No hagas `git commit`. No borres archivos de otra área.
- Copy en español peninsular, **siempre «vosotros»**, frases cortas, sin las palabras prohibidas de `docs/04-diseno.md §4`. No inventes datos (ni testimonios, ni cifras de ventas, ni reseñas).
- Accesibilidad no negociable (invitados de 60–85 años): texto ≥ 17 px en la invitación, etiquetas ≥ 16 px, áreas táctiles ≥ 48 px (botón principal 56), contraste AA, foco visible, `prefers-reduced-motion` respetado, contenido legible SIN JavaScript (nada de `opacity:0` en SSR que solo quite la hidratación).
- Fechas: **toda fecha/hora se formatea con `timeZone: "Europe/Madrid"`**. El agente A crea `src/lib/fecha.ts` con helpers (`formatearFecha`, `formatearHora`, `horaDelDia`, `aMadridISO`…). Mientras no exista, usa `Intl` con `timeZone: "Europe/Madrid"` directamente.

## Marca (se conserva, no se rediseña)
Logo y sello: `public/marca/*.svg` y `components/SelloAlianzas.tsx` — intactos. Web comercial: papel `#FAF8F5`, tinta `#12100E`, granate lacre `#8C1D2C`, bruma `#EDE6DD`, oro `#B08D57`; Bodoni Moda (display) + Instrument Sans (texto). Las invitaciones se visten de cada boda (cada plantilla con su tipografía/paleta), con la firma «Diseñado por Invitoo» y el sello al pie.

## Áreas y propiedad de archivos
| Agente | Área | Archivos que son suyos |
|---|---|---|
| **A · Núcleo** | seguridad, datos, zona horaria, ruta estática, .ics, OG, paneles | `src/app/acciones.ts`, `src/app/estudio/**`, `src/app/novios/**`, `src/components/estudio/**`, `src/lib/**` (salvo lo indicado de tipos), `src/proxy.ts`, `supabase/**`, `src/app/i/[slug]/**` (page, opengraph-image, ics route), `herramientas/db.mjs` |
| **B · Invitado** | apertura, puerta, RSVP, bloques, portada | `src/components/aperturas/**`, `src/components/bloques/**`, `src/components/BotonSonido.tsx`, `src/components/Revelar.tsx`, `src/components/Gestos.tsx`, `src/components/Botanica.tsx` |
| **C · Catálogo** | plantillas | `src/plantillas/**`, `src/data/plantillas.ts`, `src/data/demo.ts`, el bloque de tokens de plantilla en `src/app/globals.css`, `herramientas/revisar.mjs`, `PlantillaId`/`Tema` en `src/lib/tipos.ts` |
| **D · Web** | web comercial | `src/app/(sitio)/**`, `src/components/sitio/**`, `src/data/sitio.ts`, `src/app/para-invitados/**`, `src/lib/contacto.ts`, `src/app/layout.tsx` (metadata), las clases de la web en `globals.css` |

`globals.css` y `src/lib/tipos.ts` son compartidos: edita solo tu parte, con Edit puntual.

## Contrato del RSVP (A implementa el servidor, B el formulario)
Server action `enviarRsvp(prev, FormData)` en `src/app/acciones.ts` (ya existe con otro nombre: A la adapta y conserva el nombre exportado que use hoy `Rsvp.tsx`, o lo renombra y avisa). Campos del `FormData`:
- `slug` (string), `token` (opcional: token del invitado si viene de `?n=`), `asiste` = `"si" | "no"`
- `personas` = número N (1..cupo). Para cada i en 0..N-1: `p{i}_nombre`, `p{i}_menu` = `"adulto" | "infantil" | "vegetariano" | "vegano"`, `p{i}_alergenos` (repetido, valores de la lista de 14 alérgenos UE: gluten, crustaceos, huevo, pescado, cacahuete, soja, lacteos, frutos_cascara, apio, mostaza, sesamo, sulfitos, altramuces, moluscos), `p{i}_alergias_texto` (texto libre)
- `bus` = `"no" | "ida" | "vuelta" | "ida_vuelta"`, `parada` (texto, opcional), `mensaje` (opcional), `telefono` (opcional)
- Comportamiento: **upsert** (si viene `token`, por invitado; si no, por `slug` + nombre de la primera persona normalizado). El invitado puede volver y corregir. Cupo máximo: el del invitado en BD si hay token; si no, 8. Devuelve `Resultado` (`{ok:true,mensaje}` / `{ok:false,error}`).
- En producción (`process.env.NODE_ENV === "production"` y sin Supabase configurado) **debe fallar con error visible**, nunca devolver ok falso.

## Personalización por invitado
`/i/[slug]?n=<token>` (token de invitado) y `?c=<variante>`. La página es **estática** (`generateStaticParams` + revalidación al guardar); la personalización se lee **en cliente** (`useSearchParams` dentro de `<Suspense>`, o `window.location`). A expone en `src/lib/` una función pública `obtenerInvitado(slug, token)` vía route handler `GET /api/invitado?slug=&n=` que devuelve `{ nombre, cupo }` (o 404). B la usa para el saludo «Querida Carmen» en el rótulo de la apertura/portada y para precargar el RSVP.

## Catálogo final (C lo implementa; D y B lo leen de `src/data/plantillas.ts`, nunca lo cuentan a mano)
Ocho plantillas: **Sobre, Floración (absorbe Jardín), Mar (absorbe Cielo + Marea), Velo (absorbe Lino + Bruma), Constelación (fondo oscuro de verdad), Tinta, Registro (civil urbana, NUEVA), Azulejo (mediterránea, NUEVA)**. Brasa y Terracota se fusionan en una variante cálida de Floración o se retiran. Los ids antiguos deben seguir resolviendo (alias → nuevo id) para no romper bodas ni enlaces.

## Precios (decididos, IVA incluido, pago único) — D los pinta, todos los textos salen de `src/data/sitio.ts`
| Plan | Precio | Incluye |
|---|---|---|
| **Invitoo** | **149 €** | Invitación completa con apertura cinematográfica con vuestros nombres · todas las secciones (itinerario, alojamiento, dress code, regalos, playlist, historia…) · confirmación por persona con menús y alergias · enlace personal por invitado · panel con exportación a Excel para el catering · muro de mensajes · álbum compartido · videollamada de diseño · cambios ilimitados hasta publicar · entrega en 5 días laborables |
| **Invitoo con canción** (destacado) | **249 €** | Todo lo anterior + canción original compuesta para vosotros (Dedícalo), que suena en la invitación y os quedáis en alta calidad para la ceremonia · save the date en vídeo vertical para WhatsApp/Instagram · 2 idiomas |
| **Estudio** | **desde 449 €** | Diseño original desde cero (no plantilla) · apertura a medida · idiomas sin límite · Libro de la Boda incluido · entrega prioritaria en 48 h |

Añadidos: Save the date en vídeo **69 €** (39 € si luego hacéis la invitación) · Idioma extra **39 €** · Entrega en 48 h **49 €** · Libro de la Boda (mensajes + fotos + canción, después de la boda) **79 €** · Tarjetas impresas con QR para quien prefiera papel **desde 2,50 €/ud (mín. 30)** · Apertura en MP4 para proyectar en el banquete **49 €**.
Invitados que se casan: **20 € de descuento** con el código de la invitación. Wedding planners, fincas y hoteles: condiciones de colaboración bajo petición (página `/colaboradores`).
Pago: enlaces de Stripe por variable de entorno (`NEXT_PUBLIC_PAGO_INVITOO`, `NEXT_PUBLIC_PAGO_CANCION`); si no están, el botón lleva a la reserva de la videollamada (`enlaceReserva`). El Estudio siempre va a la videollamada.
