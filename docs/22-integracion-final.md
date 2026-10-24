# 22 · Integración final (I1)

> I1, 24-10-2026. Integrador y QA final después de F1–F4, G1–G3, H1, K1–K5, X1, M1 y P2 (y en paralelo con A2, E1–E3). **Sin commit**: el coordinador sincroniza y hace commit en el PC de Rodrigo.

## 0. En una línea

El árbol compila limpio (`tsc` 0 errores, `eslint` 0 errores y 0 avisos, `next build` verde), las 28 demos y la web usan **fotos propias generadas con IA** (ya no queda ni una foto de stock en `public/`), los defectos abiertos están arreglados y la QA automática a 360, 390, 430 y 1440 px no da solapes, ni scroll horizontal, ni texto de menos de 17 px en las invitaciones.

**Para probar en tu PC:** `PROBAR-EN-LOCAL.bat` (o `npx next dev -p 3100` con `INVITOO_MEMORIA=1` y `ESTUDIO_CLAVE=demo`). Estudio: `localhost:3100/estudio`, clave `demo`. Panel de una boda: desde el estudio, botón «Panel», o `localhost:3100/novios/demo-laura-y-ruben`.

## 1. Compilación limpia

| Qué | Resultado |
|---|---|
| `app/tsconfig.json` | Sin ninguna entrada `.next-*` (JSON válido). Ojo: cada `next dev`/`next build` con `NEXT_DIST_DIR` las vuelve a añadir; quitadlas antes del commit |
| Carpetas `app/.next-*` | Borradas todas (también la de E2 al terminar). Queda `.next`, la de siempre |
| Rutas de QA temporales | No quedaba ninguna (la de F1, `qa-f1`, ya estaba borrada) |
| `npx tsc --noEmit -p .` | 0 errores (antes hay que tener los tipos de rutas: `npx next typegen` o un `next dev`). El error de P2 en `cobrar.ts(209,31)` ya no existía; el de `EditorBloques.tsx` (`mapa`) era mío y está corregido |
| `npx eslint .` | 0 errores, 0 avisos. Arreglados: 3 `set-state-in-effect` (FormDeseo, PedirCambio y MovimientoCliente, este último justificado), expresiones sueltas en `CursorInvitoo`, variables sin usar en `avisos/datos.ts` y `nano-banana.mjs`. `eslint.config.mjs` ignora ahora `.next-*/**` y `archivo-fotos-antiguas/**` |
| `npx next build` | Verde, 65 páginas. El aviso de Big Shoulders (sin métricas de fallback) se ha quitado con `adjustFontFallback: false` y una pila condensada. Queda uno de `lib/visitas` (E3), ver §5.6 |
| Choque de fuentes de Turbopack | Revisado: ninguna familia se declara dos veces con la misma variable y distinta configuración |
| `node herramientas/revisar.mjs --catalogo` | «Catálogo sin fallos: 28 plantillas, 84 variantes», todas AA |

## 2. Imágenes propias (FLUX.2 klein, personas ficticias)

### 2.1 Cómo están

- **Herramienta nueva y repetible:** `app/herramientas/imagenes/integrar-ia.mjs` (sharp, sin dependencias nuevas). Lee `imagenes-ia/**` y genera `public/generadas/<id>-{480,768,1080}.{avif,webp}` (estructura de M1, doc 18 §5), anota cada imagen en `herramientas/imagenes/catalogo.json` (motor, modelo, semilla, prompt y variantes) y lleva la lista de descartes. Si llegan imágenes nuevas, se vuelve a lanzar: salta lo hecho y valida lo que hay.
- **216 imágenes publicadas** (224 − 8 descartes) + una derivada (`tinta-detalle`, las alianzas en blanco y negro para Tinta): 1.302 archivos, unos 73 MB (las invitaciones solo descargan las que pintan).
- En las invitaciones las rutas son `/generadas/<id>-1080.avif`; las miniaturas del muro En directo usan `-480`.
- Al pie de cada demo: «Invitación de muestra: la pareja es ficticia y las fotos están generadas con IA» (doc 19 §7).
- La hoja de contactos de la revisión está en `qa/v3/i1/revision/hoja-*.jpg` y los detalles ampliados en `zoom-*.jpg`.

### 2.2 Descartes (defectos; no se publican)

| Imagen | Motivo | Sustituta |
|---|---|---|
| `aire-poster-h` | Una tercera persona reflejada en el espejo | `aire-album-2` (póster horizontal de Aire) |
| `tinta-album-4` | Rótulo con letras inventadas («SHOAPPHIS») junto a la cara | `tinta-detalle` (alianzas en B/N) |
| `lupulo-poster` | Etiqueta de la botella con pseudo-texto | `lupulo-album-1` (póster) |
| `marca-bodegon-papeleria` | Lacre con un garabato de letra | — (no se usaba) |
| `textura-marmol` | No es una textura: una modelo con vestido de mármol | — (se mantiene la textura de M1) |
| `orbita-detalle-anillos` | Carta celeste con pseudo-texto | `orbita-poster` en los capítulos |
| `estadio-detalle-entrada` | Balón de rugby en una boda futbolera | `estadio-poster` en los capítulos |
| `meta-poster` | Dos hombres corriendo: no es la pareja de la demo | `meta-album-1` (póster) |

Observaciones menores que **no** se han descartado: `tinta-album-1` y `-3` tienen rótulos de bar al fondo, borrosos; `web-corte-1` lleva un lacre con un motivo floral (no letras).

### 2.3 Mapa antiguo → nuevo

**Las 9 de la casa** (`src/data/demo.ts`):

| Demo | Portada | Álbum | Otras |
|---|---|---|---|
| Carta · Inés y Gonzalo | `p-jardin` → `carta-portada` | `terracota-1, jardin-1, terracota-4, jardin-2` → `carta-album-1…4` | capítulos `brasa-3, brasa-1, jardin-4, brasa-4` → `carta-capitulo-1…4` |
| Sobre · Laura y Rubén | `p-sobre` → `sobre-portada` | `sobre-1…4` → `sobre-album-1…4` | |
| Floración · Nora y Sebas | `p-floracion` → `floracion-portada` | `floracion-1…4` → `floracion-album-1…4` | |
| Mar · Sara y Marcos | `p-cielo` → `mar-portada` | `cielo-1, cielo-2, marea-1, marea-2` → `mar-album-1…4` | |
| Velo · Claudia y Jorge | `p-velo` → `velo-portada` | `velo-1…4` → `velo-album-1…4` | |
| Constelación · Yone y Noe | `p-constelacion` → `constelacion-portada` | `constelacion-1…4` → `constelacion-album-1…4` | |
| Tinta · Marta y Álvaro | `p-tinta` → `tinta-portada` | `tinta-1…4` → `tinta-album-1…3` + `tinta-detalle` | |
| Registro · Àlex y Bruno | (tipográfica) | `bruma-1…4` → `registro-album-1…4` | |
| Azulejo · Rocío y Javier | (tipográfica) | `tinta-1, lino-3, lino-1, lino-2` → `azulejo-album-1…4` | |

**Las 19 temáticas** (`src/plantillas/tematicas/demos.ts`): cada demo usa solo sus imágenes (`<tema>-album-*` o `<tema>-1…4` en Pinar, Órbita y Brazada) en el álbum, y sus detalles/pósteres en los capítulos (Blasón: la lámina y el lacre; Memorias: las cartas; Pasaporte: el cuaderno y el billete; Riviera: la guantera; Lúpulo: el lúpulo; Meta: la medalla…). Antes todas tiraban de `/fotos/bodas/*`.

**Pósteres de las cabeceras temáticas** (`public/tematicas/<id>/poster-v.avif` 720×1280 y `poster-h.avif` 1280×720, recorte por atención; mismas rutas, el código no cambia). Son también la ficha del catálogo:

| Tema | Vertical | Horizontal |
|---|---|---|
| regencia | regencia-portada | regencia-poster-h |
| aire | aire-portada | aire-album-2 |
| cuento | cuento-portada | cuento-poster-h |
| blason | blason-poster-hero | blason-album-3 |
| memorias | memorias-poster-hero | memorias-detalle-2 |
| pasaporte | pasaporte-poster-hero | pasaporte-album-3 |
| orilla | orilla-poster-hero | orilla-album-3 |
| pinar | pinar-poster | pinar-3 |
| orbita | orbita-poster | orbita-4 |
| brazada | brazada-poster | brazada-2 |
| festival | festival-poster | festival-album-2 |
| vinilo | vinilo-poster | vinilo-album-2 |
| neon | neon-poster | neon-album-2 |
| fuego | fuego-poster | fuego-album-2 |
| bachata | bachata-poster | bachata-album-3 |
| lupulo | lupulo-album-1 | lupulo-album-2 |
| estadio | estadio-poster | estadio-album-2 |
| meta | meta-album-1 | meta-album-2 |
| riviera | riviera-poster | riviera-album-2 |

**Pósteres de las aperturas** (`public/aperturas/<id>/poster.avif`, 12): eran **capturas de invitaciones con nombres rotulados** («Carmen & Iván», «Yone & Noe», «Marta & Álvaro», «Irene & Dani»…). Ahora son el fotograma de 1 s del propio `vertical.mp4` (720×1280, AVIF): limpio y continuo con el vídeo que arranca después. Nota: el de `brasa` muestra el cartel «Just married» del metraje (no es el nombre de ninguna pareja).

**Fichas del catálogo de la casa** (`src/data/plantillas.ts`, campo `poster`): Sobre, Floración, Mar, Velo, Constelación y Tinta pasan de la captura con nombres a `/generadas/<plantilla>-portada-768.avif`. Carta, Registro y Azulejo siguen con su SVG (llevan las iniciales o los nombres de su propia demo).

**Web y En directo:**
- `components/sitio/EnDirecto.tsx` (la TV de la home y de /en-directo): `constelacion-2, lino-3, floracion-4, constelacion-4` → `directo-brindis, directo-amigas, directo-pista, directo-tarta`.
- `lib/momentos/muestra.ts` (las vistas previas de la pantalla en el panel, la compra y la web): 14 fotos de `/fotos/bodas` → las 8 `directo-*` y 6 de álbumes; la foto que «sube el móvil» (`velo-2`) → `velo-album-3`.
- Inicio: su hero es el sobre 3D de X1 (`public/tresd`), no usa fotos. OG: tipográfica de marca, sin fotos. No había nada de stock que cambiar.
- `marca-*`, `marca-lugar-*`, `mk-*`, `web-*` y `textura-*` quedan publicadas en `public/generadas` para marketing y futuras secciones, pero hoy ninguna página las pinta. Las texturas de la invitación siguen siendo las de M1 (`public/marca/texturas`), que son periódicas (las de FLUX no lo son).

### 2.4 Lo archivado (sin borrar)

En `app/archivo-fotos-antiguas/` (fuera de `public`, en `.gitignore`):
- `fotos/**`: las **69** fotos de stock de `public/fotos` (`alianzas`, `hero`, `p-*`, `bodas/*`, `sitio/*`, incluidos los dos MP4 sin uso de `sitio/`). Ya no hay ninguna referencia en el código.
- `aperturas/<id>/poster.avif`: los 12 pósteres con nombres rotulados.
- `tematicas/<id>/poster-v.avif` y `poster-h.avif`: los 38 fotogramas provisionales de K1–K5.

**Ojo con Supabase:** si las demos se sembraron en producción con `herramientas/sembrar-demos.mjs`, sus filas aún apuntan a `/fotos/...`. Hay que volver a sembrarlas.

## 3. Defectos abiertos: qué se ha hecho

| Defecto | Arreglo |
|---|---|
| Pétalos por encima de los nombres | `components/flores/motor.ts`: el canvas de pétalos solo va por encima (z 55) mientras la apertura está delante. Después se mete en el `.lienzo` con z −1, **detrás del texto**, como las partículas. Se recoloca durante la animación |
| Bloque rojo vacío antes de la cuenta atrás | No se reproduce en ninguna de las 28 demos (revisadas con movimiento a 390). Con el velo acotado (abajo) y los revelados por `html.js`, ya no hay secciones con fondo y contenido oculto |
| Guirnalda de Carta sobre el texto | Revisado a 360, 390 y 430: las flores quedan en las esquinas; 0 solapes |
| «&» de Carta con reflejo | Se ve bien (cursiva dorada entre filetes) |
| Contador de capítulos de Carta | Marcaba «4 / 4» al empezar: medía con `offsetLeft`. Ahora mide con rectángulos en pantalla (`CapitulosCarta.tsx`) |
| BarraDemo, error de tipos | Ya no existía |
| Botones del panel | `ui.boton`, `ui.botonLleno` y `ui.botonPeligro` (`components/panel/estilos.ts`) son ahora las clases `.bt` del sistema de G2 (contorno, primario y peligro), con sus sombras, pulsación, foco y estado deshabilitado; `estilos.ts` importa `sistema.css`. Los 75 botones del panel cambian sin tocar cada archivo |
| Bloques de Protocolo en el editor | `components/estudio/EditorBloques.tsx`: formularios para «Quién invita», «Niños», «Preguntas frecuentes», «Autobús», «Invitados de fuera», «Preboda», y en RSVP la fecha límite y su motivo. `lib/bloques.ts` ya los validaba |
| Plan y añadidos por boda en el estudio | `AjustesEstudio` («Plan, plazos y En directo»): plan (Invitoo, Con canción, Estudio) y añadidos, guardados con la nueva acción `guardarContratoEstudio` (`app/estudio/acciones.ts`, con `exigirSesion`). **No duplica** «Vincular a una boda» de P2: aquel fija el plan al cobrar; este es para lo cobrado fuera de Stripe, regalos o correcciones |
| TV con código corto | Nuevo `/tv` (`src/app/tv/page.tsx`): se escribe un código de 6 caracteres (alfabeto sin 0/O/1/I/L) y abre la pantalla. El código es un HMAC del servidor sobre la clave de la pantalla (`codigoTv` en `lib/momentos/servidor.ts`): no se deduce del slug y cambia al regenerar la clave. Comparación en tiempo constante, límite de 12 intentos cada 10 min por IP y funciona sin JS. El panel lo enseña en «La pantalla del salón» («invitoo.es/tv y escribid el código **BKGFEQ**»). Solo resuelve bodas con pantalla contratada y activa (`pantallasActivas` en `lib/momentos/datos.ts`) |
| Fuentes de reserva | `GENERICA` (`plantillas/tokens.ts`) conoce ahora las 33 familias temáticas (Karla, Sora, Archivo, Lexend, IBM Plex Sans, Nunito Sans, Courier Prime, Zilla Slab, Saira, Big Shoulders…): sans con sans, condensadas con condensadas, mono con mono |
| Hashtag partido a mitad de palabra | El tamaño se ajusta a la longitud (cabe en una línea en el móvil) y, si no cabe, solo se parte entre palabras (MayúsculaInicial y números, con `<wbr>`) |
| Entrada «velo» lenta en secciones altas | El velo cubre como mucho `85svh` y se deshace hacia el contenido; dura como mucho 1,1 s y espera como mucho 240 ms |
| WCAG 2.2.2 en `HeroVideo` | Botón de pausa/reanudar de 44 px, arriba a la derecha (lejos de «Demo»), con `aria-pressed` y etiqueta. «Ver el vídeo» baja 3 rem cuando hay marca «Demo», para no pisarla |
| Aviso de hidratación del `textarea` (Muro) | No aparece en ninguna QA (0 errores de consola en las 28 demos). `caret-color` en el atributo `style` es la huella típica de una extensión del navegador (Grammarly y similares): si vuelve a salir, probad en una ventana privada |
| Prefijos `.or-*`/`.ol-*` | Sin choques: `.or-*` solo en `orbita.css` y `.ol-*` solo en `orilla.css`. Revisadas todas las clases repetidas entre plantillas: todas van acotadas por su contenedor. Órbita, revisada con movimiento |
| Galería 3D (X1) | Las 19 temáticas tienen ahora su adorno en la cartulina, en su color: corona (Regencia y Cuento), escudo (Blasón), marco (Aire y Memorias), matasellos (Pasaporte), ondas (Orilla y Brazada), piña o lúpulo (Pinar y Lúpulo), planeta con anillo (Órbita), disco, pentagrama, neón o luces (las musicales), campo (Estadio), cinta de meta (Meta) y carretera (Riviera) |
| Sin JS | Los títulos de los bloques compartidos (`vida.css`) y 32 reglas de las temáticas con `animation-timeline: view()` que partían de `opacity: 0` solo actúan con `html.js`. Sin JavaScript se lee todo |

**Además, encontrado en la QA:**
- **Texto de 16 px** en los bloques compartidos de las 9 de la casa (RSVP, Copiar, álbum, muro): la regla de 17 px de las temáticas pasa a todas las invitaciones (`globals.css`). Ahora, 0 casos.
- **Registro:** la marca «Demo» pisaba el rótulo «Boda civil»; en Registro baja bajo el filete de la cabecera.
- **/tv a 390 px:** el campo del código desbordaba; corregido.
- **Estudio · Solicitudes:** «Escribir por WhatsApp», «Crear la boda» y «Editar la boda» medían 20 px de alto; ahora 44.

## 4. QA

Scripts en `qa/v3/i1/` (Playwright y Chromium del repo):
- `qa.mjs`: solapes (la lógica de `f2/solapes.mjs`), scroll horizontal, texto < 17 px en invitaciones, dianas < 44 px (sin contar enlaces dentro de una frase) y errores de consola o 4xx/5xx. Recorre la web, las 28 demos, momentos, deseos, la pantalla de muestra, el panel (8 secciones) y el estudio (bandeja y cobros) a 360, 390 y 430 px (y 1440 en web, panel y estudio). Informes: `informe-qa*.json`.
- `flujo-pago.mjs`: el flujo de pago en modo demo. Resultado en `flujo/resultado.txt` y capturas en `flujo/`.
- `tiras.mjs`, `hoja.py`, `hojas.py`, `mosaico.py`: capturas por pantallas y hojas de contactos.

**Resultados finales (servidor de desarrollo, modo demo, después de todos los arreglos):**

| Grupo | Páginas × anchos | Solapes | Scroll horizontal | Texto < 17 px | Dianas < 44 px | Errores de consola |
|---|---|---|---|---|---|---|
| 28 demos `/i/<slug>` (360, 390, 430) | 84 | 0 | 0 | 0 (antes, 9–13 por demo en las de la casa) | 0 | 0 |
| Web: 9 páginas con /tv (360, 390, 430, 1440) | 36 | 0 | 0 | — | 0 | 0 |
| Momentos, deseos y pantalla de muestra | 12 | 0 | 0 | — | 0 | 0 |
| Panel, 8 secciones (360, 390, 430, 1440) | 32 | 1 falso positivo* | 0 | — | 0 | 0 |
| Estudio: bodas, bandeja y cobros | 12 | 0 | 0 | — | 0 (antes, 12) | 0 |

\* En «En directo», el script cuenta «Vuestras compras», que está dentro del desplegable «Ampliar» **cerrado** (no se pinta: comprobado en captura).

Durante una primera pasada del panel, E3 estaba editando `lib/correos` y `lib/visitas`, y Turbopack daba 500 transitorios («Export purgarContadores doesn't exist»). No eran de este código; en la pasada final no aparecen. El aviso de hidratación que salió una vez en «Diseño» a 1440 tampoco se reproduce.

**Flujo de pago demo** (`flujo/resultado.txt`): /precios → «Reservar» → `/pagar/demo/invitoo` → formulario → `/gracias?pedido=…` → la reserva aparece en **Estudio → Solicitudes** ✔. En directo: el estudio deja la boda en plan «Álbum» → el panel enseña el candado y la hoja con la vista previa de la TV → «Contratar» (demo) → En directo activo y aviso en la campana ✔. El código de la TV abre `/directo/<slug>` y un código falso no abre nada ✔. 0 errores de consola.

**Hojas de contactos:**
- `qa/v3/i1/hoja-heroes-390.jpg`: los 28 heroes a 390 px.
- `qa/v3/i1/hoja-web-390.jpg` y `hoja-web-1440.jpg`: la web.
- `qa/v3/i1/hoja-panel-390.jpg` y `hoja-panel-1440.jpg`: el panel y el estudio.
- `qa/v3/i1/revision/`: la revisión de las 224 imágenes, los descartes y los pósteres nuevos y antiguos.

## 5. Pendiente

1. **Vídeos propios.** Las cabeceras temáticas y las aperturas siguen con el metraje de `public/aperturas`: el póster ya es de la pareja de la demo, pero al arrancar el vídeo sale otra pareja. Los encargos de vídeo están en `herramientas/imagenes/encargos.json → videos[]` (doc 18 §6).
2. **Coherencia de las parejas.** FLUX.2 klein las aproxima por descripción: en algunas demos la pareja cambia un poco de una foto a otra. Para las portadas y los álbumes, doc 18 recomienda Nano Banana Pro con referencias (unos 10 €).
3. **Re-sembrar las demos en Supabase** (ver §2.4).
4. `/tv` limita los intentos en memoria, por instancia. En Vercel, con varias instancias, el límite efectivo es mayor; si se quisiera un límite global, iría en Supabase o en Upstash.
5. El estudio enseña una vista previa grande en blanco bajo «Movimiento» en las capturas a página completa (es el iframe, que carga al verse); no afecta al uso.
6. **Aviso de `next build` (E1–E3):** `src/lib/visitas/local.ts:33` (`path.join(process.cwd(), carpeta)`) hace que Turbopack «trace» el proyecto entero, `public/` incluido (ahora con unos 73 MB de imágenes), dentro de las funciones del servidor. Conviene acotarlo (ruta fija o `/*turbopackIgnore: true*/`) antes de desplegar en Vercel. Es del área de E3; no lo he tocado.
7. `tsconfig.json`: volver a quitar las entradas `.next-*` que añaden los servidores de los agentes (A2, E1–E3) antes del commit.

## 6. Decisiones abiertas de Rodrigo

1. **Política de reembolsos** (qué se devuelve y hasta cuándo; hoy `/condiciones` y el texto de En directo dicen «si cambiáis de idea antes de usarlo, os devolvemos el dinero»).
2. **Pago 50/50** (señal y resto): el estudio ya lo permite en Cobros; falta decidir si es la norma para el plan Estudio.
3. **Casilla obligatoria de condiciones en Checkout** (`consent_collection.terms_of_service` de Stripe): requiere tener `/condiciones` definitiva.
4. **Qué incluye «Gestionado»** (179 €) exactamente, frente a «En directo» (89 €).
5. **¿«Aire» sustituye a «Tinta»?** Hoy conviven las dos.
6. **Datos legales**: razón social, NIF y domicilio en `/condiciones`, `/privacidad` y el aviso legal (hoy `[RAZÓN SOCIAL]`, `[NIF]`, `[DOMICILIO]`), y la revisión del asesor.
