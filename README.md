# Invitoo — reforma de marca y producto

Estudio completo y prototipo del nuevo Invitoo, fuera de WordPress.

## Documentos

| | |
|---|---|
| [docs/01-auditoria.md](docs/01-auditoria.md) | Qué es invitoo.es hoy, medido: stack, plugins, rendimiento real, errores en producción, problemas de negocio, inventario de mantener/mejorar/eliminar. |
| [docs/02-estrategia.md](docs/02-estrategia.md) | Posicionamiento, diferenciadores, precios propuestos, retención y crecimiento, prioridades P0–P3. Incluye la discusión sobre «vídeo inicial». |
| [docs/03-arquitectura.md](docs/03-arquitectura.md) | Stack elegido y por qué, motor de plantillas, modelo de datos, objetivos de rendimiento, plan de migración, coste. |
| [docs/04-diseno.md](docs/04-diseno.md) | Sistema visual, tokens, las seis aperturas con su técnica, reglas de copy y de accesibilidad. |
| [docs/05-archivo.md](docs/05-archivo.md) | Qué hay en `E:\RespaldoHP\INVITOO`, qué se reutiliza y qué no (incluido el problema de los 118 SVG). |
| [docs/06-plan-de-mejora.md](docs/06-plan-de-mejora.md) | Plan de mejora (oct 2026): mercado, competencia y casos de estudio, DAFO, catálogo 12→6(+4), experiencia del invitado, negocio y B2B, hoja de ruta F0–F3, KPIs. |

## Prototipo

```bash
cd app
npm run dev
```

- `/` — **la web comercial nueva** (hero, plantillas vivas, qué lleva, proceso, precios, preguntas)
- `/i/laura-y-ruben` — invitación completa: apertura en vídeo + los 11 bloques
- `/para-invitados` — la landing del motor de referidos
- `/estudio` — panel de montaje (pide clave)
- `/novios/<token>` — panel de la pareja, por enlace privado

Para conectar la base de datos: [`supabase/README.md`](supabase/README.md). Sin ella la aplicación arranca igual, con los datos de ejemplo.

## Estado

| Pieza | Estado |
|---|---|
| Modelo de datos de invitación (`src/lib/tipos.ts`) | hecho |
| Sistema de tokens por boda | hecho |
| Sello de alianzas como componente | hecho |
| Orquestador de aperturas | hecho |
| Apertura en vídeo (autoplay mudo + rótulo personalizado) | hecho |
| Apertura 02 · Floración (máster cortado del metraje propio) | hecho |
| Apertura 01 · Sobre, versión CSS de maqueta | hecho |
| **Las seis aperturas con vídeo, funcionando** | hecho (montadas del metraje propio; provisionales hasta rodar las definitivas) |
| Telón de entrada de marca | hecho |
| Sistema botánico animado (ramas de línea) | hecho |
| Microinteracciones de botones y enlaces | hecho |
| Bloques: los 11 (portada, cuenta atrás, itinerario, historia, dress code, alojamiento, playlist, regalos, álbum, muro, RSVP) | hecho |
| Set de iconos propio (~2 KB inline) | hecho |
| **Logo vectorizado** (`palabra` · `lockup` · `sello` · `aros`) | hecho |
| Monograma redibujado para tamaños pequeños + favicon | hecho |
| Home comercial + landing de invitados | hecho |
| Botón de sonido (canción de Dedícalo) | hecho |

| Esquema de Supabase con RLS | hecho |
| Capa de datos con salida sin Supabase | hecho |
| RSVP y muro guardando de verdad | hecho |

| Panel de estudio (lista + editor + puerta) | hecho |
| Panel de los novios por enlace privado | hecho |
| Subida de fotos al álbum (bucket creado, falta la ruta firmada) | pendiente |
| Aviso por email al confirmar (Resend) | pendiente |
| Pagos: los tres enlaces de Stripe que ya cobran en invitoo.es | hecho |
| Enlaces de pago para los precios nuevos (149/249/449) | pendiente |
| Reserva de la videollamada: enlace a la página de citas de Google Calendar (crea el Meet sola) | falta pegar el enlace en `NEXT_PUBLIC_AGENDA` |

## Números del prototipo frente a la web actual

| | invitoo.es hoy | prototipo |
|---|---|---|
| HTML de una invitación | 256 KB | **42,6 KB** (8,3 comprimido) con 11 bloques |
| Iconos de una invitación | ~260 KB (SVG autotrazados) | **~2 KB** inline |
| Hojas de estilo | 103 | **1** |
| Scripts | 60 | 9 chunks (170 KB gz: suelo de React/Next, ver [03 §4](docs/03-arquitectura.md)) |
| TTFB | 1,36 s | estático en CDN |

## Pendiente de Rodrigo

1. Confirmar la dirección de precios de [docs/02-estrategia.md §5.1](docs/02-estrategia.md).
2. Decidir el orden en que se ruedan los seis másters de apertura.
3. Si algún día aparece el vectorial original de Canva, sustituye a los trazados de `public/marca/` sin tocar nada más.

## Capturas

En [`_research/capturas/`](_research/capturas/) están las pantallas de todo corriendo contra la base real: home, invitación, apertura, panel de los novios, estudio y la landing de invitados.

## Herramientas

`herramientas/vectorizar.py` y `herramientas/optimizar.py` convierten un PNG de una tinta a SVG limpio. Se escribieron para el logo, pero sirven para cualquier marca que llegue en mapa de bits:

```bash
python herramientas/vectorizar.py entrada.png salida.svg 4 0.55
python herramientas/optimizar.py salida.svg salida.min.svg
```

`herramientas/db.mjs` aplica el esquema, siembra la boda de ejemplo y mira qué hay dentro. Lee la conexión de `SUPABASE_DB_URL`, nunca lleva credenciales escritas:

```bash
node herramientas/db.mjs esquema
node herramientas/db.mjs sembrar
node herramientas/db.mjs ver
```

`herramientas/capturar.mjs` abre la web con Chromium, rellena el RSVP y el muro de verdad contra Supabase y guarda las capturas. Es la prueba de extremo a extremo.
