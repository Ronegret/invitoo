# Brief común — Fase 2: elegancia, «En directo» y cuenta de los novios

Repo `/home/claude/web` (git, último commit «reforma 1»). App en `app/`. **Lee `app/AGENTS.md`** (Next 16 con cambios: consulta `app/node_modules/next/dist/docs/`). Contexto: `docs/06-plan-de-mejora.md` y `docs/07-brief-equipo-reforma.md` (las reglas de trabajo, accesibilidad, fechas en Europe/Madrid y copy en «vosotros» siguen vigentes).

## Lo que pide Rodrigo (literal, resumido)
1. Las invitaciones tienen que ser **sutiles y elegantes**: animaciones suaves, fundidos, nada brusco ni «de plantilla». **Que se pueda modificar mucho** (ajustable por boda). Elegancia y amor en cada invitación.
2. Un **enlace y un QR para el día de la boda**: los invitados suben fotos y mensajes y se ven **en directo**, por ejemplo en una TV del salón. Pensar bien el almacenamiento y cómo cobrarlo. Todo dentro de la misma web.
3. **Login y dashboard** de los novios: ver invitados y todo bien claro. Web completa. Se puede inspirar en `Ronegret/events-planner` (clonado en `/home/claude/ronegret/events-planner`, JS vanilla: invitados, mesas, menús, día B, portal de pareja, RGPD).

## Reglas
- Cuatro agentes a la vez en el mismo árbol: toca **solo tus archivos**. Lo que necesites de otro, anótalo en tu informe.
- Edit puntual; relee antes de editar archivos compartidos.
- Valida con `cd /home/claude/web/app && npx tsc --noEmit -p .` y `npx eslint <tus archivos>`. **No** `next build` ni `next dev` (compartimos `.next`). No hagas commit.
- Sin Supabase en local: todo debe funcionar en modo demo (almacén en memoria, `INVITOO_MEMORIA=1` o `NODE_ENV!=="production"`) y con Supabase en producción. Mira cómo lo hace `src/lib/datos.ts`.
- Dependencias nuevas: solo si de verdad hacen falta, pequeñas y con licencia MIT/Apache/ISC. Anótalas en el informe; instala con `npm install <pkg>` (solo el agente que la necesite, avisando).
- Marca intacta (logo, sello, granate, Bodoni + Instrument Sans en la web y los paneles).

## Propiedad de archivos
| Agente | Área | Archivos |
|---|---|---|
| **M · Movimiento** | sistema de animación elegante y configurable | `src/lib/movimiento.ts` (nuevo), `src/components/Revelar.tsx`, `src/components/Botanica.tsx`, `src/components/Gestos.tsx`, `src/components/aperturas/**`, `src/plantillas/**`, `src/components/bloques/**` (solo lo de animación/estética), el bloque de invitación de `globals.css`, `src/components/movimiento/**` (nuevo: el formulario `AjustesMovimiento` y la vista previa), `Tema`/`Movimiento` en `lib/tipos.ts` |
| **D · En directo** | día de la boda: subir fotos/mensajes, pantalla TV, QR, almacenamiento | `src/app/i/[slug]/momentos/**` (subida de invitados, nuevo), `src/app/directo/**` (pantalla TV, nuevo), `src/app/api/momentos/**` (nuevo), `src/lib/momentos/**` (nuevo), `src/components/directo/**` (nuevo: también los componentes de control que montará el panel), `supabase/migraciones/2026-11-directo.sql` (nuevo) |
| **P · Cuenta y panel** | login de los novios y dashboard completo | `src/app/cuenta/**` (nuevo: entrar/salir), `src/app/panel/**` (nuevo: el dashboard), `src/app/novios/**` (se mantiene como acceso por enlace y redirige/convive), `src/components/panel/**` (nuevo), `src/lib/auth/**` (nuevo), `src/proxy.ts`, `src/lib/datos.ts` (solo añadir funciones; no romper las existentes), `supabase/migraciones/2026-11-cuentas.sql` (nuevo) |
| **W · Web** | venta del servicio nuevo en la web comercial | `src/app/(sitio)/**`, `src/components/sitio/**`, `src/data/sitio.ts` |

`lib/tipos.ts`, `globals.css` y `data/sitio.ts` son compartidos: edita solo tu parte.

## Contratos entre áreas
- **Ajustes de movimiento** (M define, P monta en el panel, el estudio también): tipo `Movimiento` en `lib/tipos.ts`, guardado dentro de `inv.tema.movimiento` (jsonb, así no hace falta migración). Campos mínimos: `estilo` (`"sereno" | "romantico" | "cinematografico" | "minimo"`), `velocidad` (0.6–1.6, multiplicador), `intensidad` (0–1: distancia/desenfoque de las entradas), `entrada` (`"fundido" | "fundido-desenfoque" | "ascenso" | "velo"`), `ornamentos` (bool: ramas/ornamentos que se dibujan), `particulas` (`"ninguna" | "petalos" | "destellos" | "polvo-de-oro"`), `parallax` (bool), `musicaFundido` (bool). Valores por defecto por plantilla. M exporta `<AjustesMovimiento inv onGuardar>` (cliente, con vista previa en vivo en un iframe de `/i/<slug>?vista=1&mov=<json-base64>`) y la server action `guardarMovimiento(slug, mov)` en `src/lib/movimiento-acciones.ts` que valida y exige sesión de estudio **o** de los novios (usa el helper `exigirAccesoBoda(slug)` que exporta P en `src/lib/auth/acceso.ts`; si aún no existe, prográmalo contra esa firma: `async function exigirAccesoBoda(slug: string): Promise<{ via: "estudio" | "novios" }>` que lanza si no hay acceso).
- **En directo** (D define, P monta): D exporta `<ControlDirecto slug />` (cliente: activar/desactivar, QR descargable PNG/SVG y tarjetas imprimibles para las mesas, enlace de la pantalla TV con clave, moderación aprobar/ocultar, contador de fotos y espacio usado, descarga completa en ZIP) y `<GaleriaMomentos slug />`. Las acciones de control usan `exigirAccesoBoda(slug)`.
- **Acceso** (P define): `exigirAccesoBoda(slug)` acepta (a) sesión de estudio (cookie actual de `app/estudio/sesion.ts`), (b) sesión de los novios (cuenta), (c) enlace privado actual `/novios/<token>` (cookie que se fija al entrar por el enlace). Datos de la pareja dueña: `parejas` ↔ `invitaciones`.

## Precios y límites de «En directo» (provisionales; se ajustan con la investigación, por eso viven en UNA constante en `src/lib/momentos/planes.ts`, que la web lee)
- **En directo**: añadido **89 €** (IVA incl.), **incluido en Estudio**. Incluye: página de subida por QR sin apps ni registro, pantalla en directo para TV/proyector, muro de mensajes en directo, moderación, hasta **2.000 fotos** y vídeos de hasta **30 s** (máx. 100 vídeos), descarga completa en ZIP, online **6 meses** tras la boda.
- Ampliación: **+2.000 fotos 29 €**; conservar **1 año más 29 €**.
- Sin el añadido, el álbum de la invitación sigue existiendo con **150 fotos** (lo que ya ofrecíamos).
- Todas las fotos se comprimen en el navegador antes de subir (lado largo 2048 px, WebP/JPEG calidad ~0.82) y se guarda además una miniatura (~480 px). Original opcional solo en Estudio.
