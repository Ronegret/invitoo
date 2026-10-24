# Brief — «Que enamore» (invitación con wow) + panel simplificado + web estilo rodd.es

Repo: `/home/claude/web` (git). App: `app/` (Next 16, **lee `app/AGENTS.md`**). Hay trabajo a medias de un equipo anterior que se detuvo. **Consérvalo y complétalo; no lo borres**:
- El sobre nuevo de E1 está en `src/components/sobre/**` y en `components/aperturas/Sobre.tsx`. Funciona y es bonito; lo ves en `qa/v2/e1/carmen-0-cerrado.png`.
- La plantilla «Carta» de E3 está en `src/plantillas/carta.tsx`, `carta.css`, `CapitulosCarta.tsx` y `fuentes/carta.ts`, y todavía no se abre (404).
- El hero de E2 está en `src/components/sitio/portada/**`, `nombres.ts`, `fuentes.ts` y `public/sitio/`.

Lee también `docs/09-benchmark-ux-amor-y-elegancia.md`, `docs/10-brief-elegancia-v2.md` (las reglas siguen vigentes: puertos y distDir propios, capturas en `qa/v3/<agente>/`, revisar con Read, sin commit, accesibilidad AA, ≥ 17 px, reduced-motion y contenido sin JS) y `docs/04-diseno.md`.

## Lo que pide Rodrigo (literal)
- «Necesito cosas más elegantes, animaciones con interacciones, moderno, animada, una invitación más moderna, amor. Quiero que enamore a los novios, porque esta invitación no tiene nada que llame la atención. Más potente, mejor visualmente, cambios de colores, animaciones de flores.»
- «Lo del dashboard es incluir a los invitados, pero no poner el orden de las mesas, no es necesario. Alguna opción para imprimir la lista de invitados. La cronología tampoco: no somos wedding planner. Tampoco mensajes. Quizás mensajes de saludo que queden en formato PDF, para que después de la boda lo puedan imprimir como regalo, y que los novios puedan dejar un QR para los comentarios y buenos deseos que quiera dejar la gente. Una opción de notificaciones.»
- «Que mejore mucho el menú de la web. Saca ideas de mi sitio rodd.es, una web con biblioteca de animaciones. Es importante que busquemos cosas que destaquen todo.»
- Las capturas de rodd.es están en `qa/rodd/`. Su librería incluye BlurText, ShinyText, GradientText, CountUp, Aurora, Particles, ClickSpark, Confetti, PulseHeart, FlipCard, CircularGallery, DomeGallery, CardSwap, FlowingMenu, BubbleMenu, ShinyButton y StickerPeel, entre otros. Su menú tiene el logo a la izquierda, la navegación central en texto fino y, a la derecha, cápsulas: «Buscar ⌘K», idioma y un CTA claro con un círculo y una flecha.
- **El listón:** wow en el primer segundo, pero elegante, nunca infantil ni recargado. Marca intacta: logo, sello de alianzas y granate.

## Propiedad de archivos
| Agente | Área | Archivos |
|---|---|---|
| **F1 · Invitación viva** | apertura, flores, interacción, color vivo, momentos firma | `src/components/sobre/**`, `src/components/flores/**` (nuevo), `src/components/aperturas/**`, `src/plantillas/aperturas/**`, `src/lib/movimiento.ts`, `src/components/movimiento/**`, `src/components/bloques/Rsvp.tsx`, `src/components/bloques/CuentaAtras.tsx`, `src/components/SelloAlianzas.tsx`, `src/components/Botanica.tsx`, `src/components/Revelar.tsx`, `Tema.sobre` y `Movimiento` en `lib/tipos.ts` |
| **F2 · Plantillas** | terminar «Carta» y dar wow al cuerpo de las 9 | `src/plantillas/**` (salvo `aperturas/`), `src/data/plantillas.ts`, `src/data/demo.ts`, `src/components/bloques/**` (salvo `Rsvp.tsx` y `CuentaAtras.tsx`), el bloque de invitación de `globals.css` y `herramientas/revisar.mjs` |
| **F3 · Web** | menú estilo rodd.es, efectos, hero, plantillas y textos del panel | `src/app/(sitio)/**`, `src/components/sitio/**`, `src/data/sitio.ts`, `src/app/layout.tsx` (metadata) y `public/sitio/**` |
| **F4 · Panel** | panel simplificado, Libro de buenos deseos, imprimir invitados y notificaciones | `src/app/panel/**`, `src/components/panel/**`, `src/app/novios/**`, `src/app/cuenta/**`, `src/lib/auth/**`, `src/lib/datos.ts` (añadir, no romper), nuevo `src/lib/deseos/**`, nuevo `src/app/i/[slug]/deseos/**`, nuevo `src/lib/avisos/**`, `supabase/migraciones/2026-11-deseos.sql` (nuevo) y `src/proxy.ts` |

Puertos: F1 3501, F2 3502, F3 3503 y F4 3504, cada uno con `NEXT_DIST_DIR=.next-<agente>` e `INVITOO_MEMORIA=1`. **Antes de capturar, mata tu servidor y vuelve a arrancarlo si cambias `next.config.ts`.** El indicador «N» de Next ya está desactivado (`devIndicators: false`).

## Contratos entre áreas
- **F1 → F2:** F1 exporta `<Florecer variante="peonia|rosa|eucalipto|azahar|olivo|lavanda" tono? tamano? lado? />`, con flores SVG que florecen al entrar en pantalla y se mecen. También `<FirmaManuscrita nombres />`, `<CapaInteraccion />` (pétalos al tocar y reflejo dorado de los nombres) y `<ColorVivo paleta={[...]} />`, un fondo que cambia de color con el scroll. F2 los coloca en las plantillas. Mientras F1 no los tenga, F2 importa desde `src/components/flores/index.ts` y F1 crea primero ese archivo con stubs exportados.
- **F4 → F3:** el panel ya no tiene Mesas, Cronograma ni Mensajes. Ahora tiene: Hoy, Invitados (con «Imprimir lista»), Libro de buenos deseos (QR para recoger deseos y PDF para imprimir como regalo), En directo, Diseño, Avisos (notificaciones) y Cuenta. F3 ajusta así toda la web.
- **El Libro de buenos deseos (F4):** recoge los mensajes que los invitados dejan en la invitación (el muro actual), los mensajes de En directo y los que llegan por un **QR propio de deseos** (`/i/[slug]/deseos`: una página bellísima, con la estética de la plantilla y solo «tu nombre + tu deseo»). En el panel se modera, se marcan favoritos y se genera **«Nuestro libro de buenos deseos»**: una página imprimible A5 con portada (nombres, fecha, sello), un deseo por página o varios con tipografía editorial y un índice, y el botón «Descargar PDF». Si es viable y ligero, el PDF se genera en el servidor; si no, se usa una ruta con `@page` y se guarda como PDF desde el diálogo del navegador. El QR usa `qrElegante` de `src/lib/momentos/qr.ts` y tiene tarjetas para imprimir.
- **Avisos (F4):**
  - Una campana en el panel con lo nuevo: confirmaciones, deseos, fotos retiradas y quien cambia su respuesta.
  - Preferencias: email al momento, resumen diario o nada (Resend con `RESEND_API_KEY`; sin clave, se registra en el log).
  - Notificaciones push del navegador opcionales con la Web Push API (si hace falta VAPID, deja las claves como variables de entorno y desactívalo si faltan).

## Ampliación (03:25): G1, G2 y G3
Rodrigo: «quiero que exista profesionalidad hasta en el cursor y los efectos; ayúdame con sombras y diseño. Investiga nuevamente la competencia directa en España. Distintos estilos de invitaciones, cada uno con un estilo ideal y con opciones de cambiar colores en vivo. Experto en bodas. Que todo funcione.»

| Agente | Área | Archivos |
|---|---|---|
| **G1 · Competencia y experta en bodas** | solo lectura y documento | `docs/12-competencia-espana-y-bodas.md` y capturas en `qa/competencia/` |
| **G2 · Sistema de diseño** | cursor, sombras, elevación, radios, foco y microinteracciones comunes | nuevo `src/components/sistema/**`, nuevo `src/lib/diseno/**` y el bloque `:root` de tokens globales al **principio** de `globals.css` (comentado `/* SISTEMA */`) |
| **G3 · Color en vivo** | probador de paletas en vivo con AA automático | nuevo `src/components/color/**`, nuevo `src/lib/color/**`; puede usar `src/plantillas/color.ts` y `tokens.ts` (solo lectura: si necesita cambios, se los pide a F2) |

- **G2 → F1, F3 y F4:** G2 exporta `<CursorInvitoo />` (solo en puntero fino, desactivado con reduced-motion y en táctil), los tokens CSS `--sombra-1..5`, `--sombra-tinta`, `--radio-*`, `--foco` y `--ease-*`, y los componentes `Boton` y `Magnetico`. F3 los monta en la web, F1 en la invitación y F4 en el panel. G2 les escribe por SendMessage cuando estén listos.
- **G3 → F3, F2 y F4:** G3 exporta `<ProbadorColor slug plantilla tema onCambio />`: paletas curadas por plantilla, una rueda o tres selectores (papel, tinta, acento) con corrección AA automática, aplicación en vivo por variables CSS o postMessage a un iframe, y «Guardar esta paleta». F3 lo usa en la vista a pantalla completa de `/plantillas` y en la `BarraDemo`; F4 lo usa en Diseño del panel, guardando en `tema` con `exigirAccesoBoda`; F2 recibe el contrato de las variables que aplica en el lienzo.

## Reglas innegociables (Rodrigo, 03:27): valen para todos
«Recuerda siempre la responsividad, la accesibilidad, respetar espacios, que no se solape nada, que juegue con los scrolls en la versión móvil, ya que sobre todo son los móviles los que ven las invitaciones. Es importante que podamos atender lo que nos piden los clientes de una manera eficiente y completa.»

1. **Primero el móvil (360–430 px).** Antes de dar nada por terminado, revisa en 360×740, 390×844 y 430×932, y después en tablet y escritorio. Sin scroll horizontal. Márgenes laterales de 16–24 px y ritmo vertical coherente.
2. **Nada se solapa nunca.** Los textos, botones, barras fijas, el botón de música, la barra de la demo, el cursor y las partículas no pueden tapar contenido ni otros controles. Respeta `env(safe-area-inset-*)` (notch y barra de gestos) y la barra del navegador móvil (usa `dvh`/`svh`, nunca `100vh` a secas). Crea un script de comprobación (`qa/v3/<agente>/solapes.mjs`) que con Playwright busque intersecciones entre elementos interactivos y de texto visibles en los tres anchos de móvil, y que falle si las encuentra.
3. **Jugar con el scroll en móvil, con elegancia:** revelados ligados al scroll (CSS `animation-timeline: view()` con `@supports` y fallback a IntersectionObserver), secciones fijadas cortas, parallax suave, carruseles con scroll-snap y cambios de color por sección. Nada de secuestrar el scroll: el usuario siempre manda, la velocidad es nativa y no hay scroll-jacking.
4. **Accesibilidad AA:**
   - cuerpo ≥ 17 px en la invitación;
   - áreas táctiles ≥ 48 px (56 en el CTA principal);
   - foco visible;
   - orden de lectura lógico;
   - `prefers-reduced-motion` desactiva lo decorativo;
   - contenido legible sin JS;
   - textos alternativos en las imágenes;
   - las animaciones nunca bloquean la lectura.
5. **Atender bien a los clientes (F4).** En el panel, «Pedir un cambio»: la pareja escribe qué quiere cambiar, con opción de adjuntar una foto o señalar la sección. Se guarda como **solicitud**, con estados recibida, en curso y hecha. En el estudio, Rodrigo ve una **bandeja de solicitudes** de todas las bodas, con aviso (usa `src/lib/avisos`). La pareja ve el estado y recibe un aviso cuando se marca como hecha. F4 añade en `src/app/estudio/**` solo lo necesario para la bandeja.

## Añadidos de Rodrigo (03:35–03:37)
6. **Álbum en directo como producto contratable (H1).** «Los invitados suben la foto por un QR y pueden ver todos a la vez, en una pestaña, la foto con algún mensaje opcional que quieran dejar; todo después se almacena y se entrega a los novios si quieren.»
   - Cada foto lleva un **mensaje opcional** (pie de foto).
   - Hay una **pestaña pública «En directo»** para los invitados en el móvil, además de la TV.
   - **Entrega** a los novios: ZIP con las fotos y los mensajes, y los mensajes pasan al Libro de buenos deseos.
   - Se contrata desde el portal y desde la web (página `/en-directo`).
   - Cobro con Stripe Checkout y webhook. Sin claves, funciona en modo demo.
   - Diseño personalizado de la pantalla: estilos Revista, Polaroid, Cine y Mosaico, con iniciales, paleta y tipografía de su boda.
7. **Lo no contratado, en gris y con candado (F4 + H1).** «Si está contratado está en el portal; las cosas que no contraten, en gris y con el candado, por supuesto.»
   - No se esconde: al tocarlo se abre una vista previa de lo que obtendrían y el botón «Contratar».
   - Qué incluye cada plan (Invitoo, Con canción, Estudio) y cada añadido (En directo, Gestionado, +1 año, idioma extra, Libro de la Boda impreso) se define en un solo sitio: `src/lib/planes-boda.ts`. Lo lee el panel, y la web también si le sirve.
   - El candado es accesible: se anuncia como «Bloqueado: no incluido en vuestro plan» y sigue siendo enfocable.

## Reanudación (09:32)
Un primer intento de este equipo se detuvo a medias, y el árbol tiene su trabajo **sin terminar**: `git diff HEAD` lo muestra todo. Cada agente **retoma lo suyo**:
1. Revisa con `git diff HEAD -- <tus archivos>` y con las capturas de `qa/v3/<tu agente>/` qué quedó hecho.
2. Termínalo.
3. Arregla lo que dejó roto en tu área. Por ejemplo, `src/app/panel/[slug]/(secciones)/directo/page.tsx` importa un `EditorCronograma` que ya no existe: es de F4.

**`tsconfig.json`:** si `next dev` añade entradas `.next-<agente>`, no pasa nada. El integrador las limpiará.

## Ids del equipo (para coordinar con SendMessage)
F1 Invitación viva = a29c5eb12eebc7269 · F2 Plantillas = a3c1cea533091b1a7 · F3 Web = a376b386dd18b9dee · F4 Panel = a999aad5a02b4d474 · G1 Competencia = a3dccfa1d50d5aae9 · G2 Sistema = a587bb7ebc80af364 · G3 Color = a5d645d871194d317 · H1 En directo = ab59600b364976fd5
