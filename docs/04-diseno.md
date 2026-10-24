# Invitoo — Dirección de diseño

---

## 1. El punto de partida está en el logo

Hay cuatro versiones del logo en `E:\RespaldoHP\INVITOO\logo`, y dos son las buenas:

**El lockup horizontal** — `INVIT` + dos alianzas entrelazadas con un brillante, y debajo «Invitaciones digitales» en didone. Es la firma completa.

**El sello circular** — `INVI / TOO` apilado dentro de un aro fino con el brillante arriba. **Éste es el hallazgo.** Ahí el aro *es* la alianza: el logo y el objeto son la misma cosa. Funciona a 24 px y a 2 metros, en positivo y en negativo. Es el que debe llevar el peso del sistema:

- **lacre** que cierra el sobre,
- **loader** (el aro girando),
- **favicon** e icono de la PWA,
- **sello estampado** cuando un invitado confirma asistencia,
- **firma al pie** de cada invitación, que lleva a la landing de invitados.

### El logo ya es vectorial

No había SVG ni AI en ningún sitio, así que se ha **vectorizado desde los PNG**. No con potrace ni Inkscape (no están en la máquina): con un trazador escrito para esto, en `herramientas/vectorizar.py` — marching squares sobre la imagen binarizada, Ramer-Douglas-Peucker para quitar los puntos que no aportan, y salida como un `<path>` con `fill-rule="evenodd"`, que resuelve solo los agujeros de la O y de los aros. Luego `herramientas/optimizar.py` lo pasa a coordenadas relativas, que ocupan un tercio y comprimen mucho mejor.

Resultado, cuatro piezas en `app/public/marca/`:

| Archivo | Qué es | Peso | Comprimido |
|---|---|---|---|
| `palabra.svg` | `INVIT` + alianzas, **sin bajada** | 29,7 KB | 6,8 KB |
| `lockup.svg` | Firma completa con «Invitaciones digitales» | 43,8 KB | 10,3 KB |
| `sello.svg` | El sello circular | 42,4 KB | 8,5 KB |
| `aros.svg` | Solo el monograma de las alianzas | 20,9 KB | 5,3 KB |

Todas llevan `fill="currentColor"`: se tiñen con el color que toque en cada sitio, que es justo lo que un PNG no deja hacer.

**`palabra.svg` es nuevo y hacía falta.** En la cabecera, la bajada «Invitaciones digitales» quedaría a 6 px y no se leería: sería ruido. Así que la firma va sin bajada arriba, y completa en el pie, donde sí hay sitio.

**Y una pieza redibujada a mano.** El trazado automático es fiel pero a 24 px las dos líneas concéntricas de cada aro se empastan hasta parecer una mancha. Por eso `SelloAlianzas.tsx` es el mismo dibujo simplificado a un solo trazo, en **600 bytes**, con las proporciones tomadas del original (aro derecho mayor, solapados a un tercio, brillante sobre el izquierdo). Ése es el que va en favicon, loader, firma al pie de la invitación y sello de confirmación. El trazado fiel se reserva para los tamaños grandes.

Los PNG originales se han retirado del proyecto. Siguen en `E:\RespaldoHP\INVITOO\logo` como fuente.

**Lo que aún convendría:** redibujar las curvas como Bézier en lugar de polilíneas. Ahora mismo son polígonos de mucha precisión — a cualquier tamaño real se ven perfectos, pero un tipógrafo con el AI original haría un archivo de 3 KB en vez de 30. Si algún día aparece el vectorial de Canva, se sustituye y ya está.

### Tipografía

Cruilla no tiene licencia web accesible y no hace falta: el logo es una imagen. Para la tipografía del sistema se usa **Bodoni Moda**, que es la misma familia de formas que el logotipo — didone de contraste altísimo, astas gruesas y remates finos — así que titulares y logo se leen como una sola voz.

| Uso | Fuente |
|---|---|
| Display / titulares | **Bodoni Moda** (Google Fonts, variable) |
| Texto | **Instrument Sans** |
| Acento manuscrito, muy puntual | **Ananda** (ya la tienes) o **Tangerine** |

El logotipo se mantiene tal cual, como imagen. No se recompone con fuente web.

**Lo que hay que retirar:** los banners de planes (`planes/verticalplanes/*.png`) usan script dorado sobre acuarela de hojas. Es el look genérico de Canva y está por debajo del nivel del logo. El sistema nuevo los sustituye.

---

## 2. Dos universos, no uno

Éste es el error que hay que evitar: hacer que invitoo.es y las invitaciones se parezcan. Tienen trabajos distintos.

### invitoo.es — «estudio de diseño», no «SaaS»

Referencia mental: el portfolio de un estudio de dirección de arte, no una landing de startup. Nada de tarjetas con iconito, gradiente y tres bullets.

| Token | Valor | Nota |
|---|---|---|
| Papel | `#FAF8F5` | blanco roto cálido, no blanco puro |
| Tinta | `#12100E` | casi negro, cálido |
| Acento | `#8C1D2C` | granate profundo — el color del lacre |
| Bruma | `#EDE6DD` | superficies y separadores |
| Oro | `#B08D57` | solo para el sello y detalles mínimos |
| Display | **Bodoni Moda** | titulares, grandes, con aire |
| Texto | **Instrument Sans** | cuerpo, legible, discreta |
| Acento manuscrito | **Ananda** | muy puntual, nunca para leer |

**Reglas:**
- Titulares grandes de verdad (`clamp(2.5rem, 9vw, 6rem)`). Una didone pide tamaño: en pequeño se le rompen los remates.
- Mucho aire vertical. El espacio vacío es lo que hace que 249 € parezca razonable.
- Grano de papel sutil sobre los fondos (`background-blend` con un ruido SVG de 1 KB).
- **Las plantillas se muestran vivas, no en mockup.** El visitante no ve una captura: ve la apertura real corriendo dentro de un marco de móvil. Ése es el argumento de venta.
- Cero sombras difusas tipo dashboard. Si algo se separa, se separa con línea de 1 px o con espacio.

### La invitación — se viste de la boda, no de Invitoo

Aquí Invitoo desaparece. La invitación lleva la paleta y el carácter de esa pareja. Invitoo solo firma al pie.

Cada plantilla define su propio set de tokens (`--tinta`, `--papel`, `--acento`, `--grano`, `--display`) que el panel de montaje sobrescribe por boda. El mismo código, seis vestidos, y variantes de color infinitas dentro de cada uno.

---

## 3. Las seis aperturas

Van en **vídeo con autoplay silenciado**, siguiendo el patrón de `aem.rodd.es` ([02-estrategia.md §4](02-estrategia.md)). Gramática común a las seis:

1. **Póster** en AVIF (6 KB) pintado antes que nada. La pantalla nunca está negra.
2. **Vídeo** de 8–10 s, mudo, `playsinline`, montaje vertical u horizontal según pantalla, y solo se descarga uno.
3. **Rótulo** con los nombres, la fecha y la paleta de esa boda, encima del vídeo. Entra en el segundo que marca cada plantilla y **aterriza en la misma posición** que el titular de la portada: no hay corte, la apertura se convierte en la invitación.
4. **«Saltar»** desde el primer fotograma, Escape también, y temporizador de seguridad a 12 s.
5. **Una sola vez.** Quien ya la vio no la vuelve a ver (`localStorage`).
6. **`prefers-reduced-motion`** se salta la apertura entera.

Presupuesto por plantilla: **≤ 2,5 MB por montaje, ≤ 10 s**. El que no entre, no se publica.

---

| # | Plantilla | Qué se ve | Rótulo en | Para qué boda |
|---|---|---|---|---|
| 01 | **Sobre** | Sobre de papel con lacre. Se rompe el sello, gira la solapa, sale la cartulina y se acerca a cámara. | 3,0 s | Clásica, ceremonia religiosa, invitados de todas las edades. |
| 02 | **Floración** | Macro de un capullo que se abre. La cámara entra entre los pétalos y sale a la luz. | 3,2 s | Campo, primavera, verdes y terracota. |
| 03 | **Cielo** | Ascenso entre nubes. La bruma se abre en capas, el gris pasa a dorado, se sale por encima al amanecer. | 4,0 s | Playa, destino. La más emocional: es la que mejor combina con la canción. |
| 04 | **Velo** | Un tejido se levanta a cámara lenta y descubre lo que hay detrás. | 2,8 s | Elegante, urbana, paleta neutra. |
| 05 | **Constelación** | Noche. Puntos de luz que se conectan hasta formar las dos alianzas y se disuelven. | 3,5 s | Noche, moderna, azul y oro. La más memorable. |
| 06 | **Bruma** | Cristal empañado del que alguien retira el vaho. | 2,6 s | Invierno, íntima, minimalista. |

### Cómo se producen

**Ya tienes materia prima.** `video Invitoo2.mp4` son 5 minutos de metraje de boda en 1080p60: floraciones, ramos, manos, tela, tarta. La **Floración** del prototipo está cortada de ahí y funciona. **Cielo** y **Velo** probablemente también salen de ese metraje.

Las que no salen de stock — **Sobre**, **Constelación** y el remate de todas — se generan: Sobre en 3D (Blender o After Effects), Constelación en partículas. Se rueda **una vez por plantilla**, nunca por pareja.

Receta de compresión, la misma que produjo el máster del prototipo:

```bash
# vertical (móvil)
ffmpeg -i master.mov -an   -vf "crop=608:1080:656:0,scale=1080:1920:flags=lanczos,fade=t=in:st=0:d=0.6,fade=t=out:st=8.2:d=0.8"   -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 27 -preset slow   -movflags +faststart -r 30 vertical.mp4

# horizontal (tablet y escritorio)
ffmpeg -i master.mov -an   -vf "scale=1280:720:flags=lanczos,fade=t=in:st=0:d=0.6,fade=t=out:st=8.2:d=0.8"   -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 27 -preset slow   -movflags +faststart -r 30 horizontal.mp4

# póster (el LCP)
ffmpeg -ss 0.7 -i master.mov -frames:v 1   -vf "crop=608:1080:656:0,scale=720:1280:flags=lanczos"   -c:v libaom-av1 -still-picture 1 -crf 40 poster.avif
```

**`-movflags +faststart` no es opcional:** sin eso el índice del MP4 va al final del archivo y el vídeo no empieza hasta haberse descargado entero.

### El sistema botánico

La web original llevaba hojas de acuarela. La idea es buena y se conserva, pero en acuarela pesa megas, no se tiñe y no se anima. Aquí las ramas son **de línea**, con el mismo trazo fino de las alianzas del logo — así aros, ramas y titulares comparten grosor y la marca se lee como una sola cosa.

Cinco formas en `src/components/Botanica.tsx`: **olivo**, **eucalipto**, **espiga**, **guirnalda** y **brote**. Cada una pesa menos de 2 KB, hereda `currentColor` y **se dibuja sola** al entrar en pantalla (`stroke-dashoffset`), tallo primero y hojas brotando detrás.

### El telón

`invitoo.es` abre con una entrada de marca de 2,9 segundos: las dos alianzas se dibujan, encaja el brillante, aparece la palabra y el telón se abre en dos hojas. Una vez por sesión, se corta con un toque o con Escape, y `prefers-reduced-motion` lo salta entero. No retrasa nada: la página ya está debajo, viva; el telón solo va por encima.

### El fallback en CSS

La apertura **Sobre** existe además en versión CSS 3D pura (40 KB, `src/components/aperturas/Sobre.tsx`). No es un plan B por si falla el vídeo — es la maqueta que se le enseña a la pareja en la videollamada antes de que exista su invitación, y lo que se sirve mientras una plantilla nueva todavía no tiene máster rodado.

---

## 4. Copy — reglas duras

**Registro: vosotros (peninsular). Siempre.** Hoy la web mezcla «ustedes» y «os». Unificar es lo más barato que se puede hacer para subir la calidad percibida.

**Prohibido** (aparece en todas las webs de la competencia, y por eso no sirve):
«Potencia tu boda» · «Lleva tu evento al siguiente nivel» · «Descubre el poder de» · «Optimiza» · «Soluciones innovadoras» · «La plataforma líder».

**Cómo habla Invitoo:** como un diseñador que ha trabajado muchas bodas. Directo, cálido, con criterio, sin adornos. Frases cortas.

| En vez de | Escribe |
|---|---|
| «Invitaciones digitales interactivas con más de 20 funcionalidades» | «Vuestra boda, contada como se merece.» |
| «Confirma tu asistencia» | «¿Vienes?» |
| «Plan Premium» | «Con canción» |
| «Solicita información» | «Hablamos 20 minutos por vídeo. Gratis.» |
| «Sube tus fotos al álbum compartido» | «Si haces una foto buena, súbela aquí.» |

---

## 5. Accesibilidad — no es opcional en este producto

El invitado medio de una boda española tiene 50 años. Un tercio pasa de 65.

- Cuerpo de texto **mínimo 17 px** en la invitación. No 14.
- Contraste **AA como suelo**, y sobre fondos con foto siempre un velo oscuro detrás del texto.
- Áreas táctiles de **48 px** mínimo. El botón de confirmar asistencia, de 56.
- Toda la información crítica (hora, dirección, cómo llegar) **accesible sin ver la animación**.
- `prefers-reduced-motion` respetado en las seis aperturas.
- Las direcciones son enlaces a Google Maps *y* texto copiable. Alguien las va a querer pegar en su GPS.
