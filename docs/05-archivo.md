# Invitoo — Qué hay en el archivo y qué se hace con ello

> Análisis de `E:\RespaldoHP\INVITOO` (16/09/2026)

---

## 1. Lo que vale y se reutiliza

### El logo, en cuatro versiones

| Archivo | Qué es | Destino |
|---|---|---|
| `logo/invitoo - copia.png` | Lockup completo: `INVIT` + alianzas + «Invitaciones digitales» | Firma principal |
| `logo/logo invitoo.png` | **Sello circular** `INVI/TOO` dentro del aro con brillante | **La pieza de marca del sistema nuevo** |
| `logo/invitooB.png` | Blanco sobre transparente | Sobre vídeo y fotos |
| `logo/LOGOINVITOO.png` | Horizontal reducido con tagline | Cabeceras |

Copiados a `app/public/marca/`. **Falta el vectorial** (SVG/AI): con PNG no se puede animar, teñir ni usar de favicon nítido. Es lo único de marca que bloquea.

### Metraje de vídeo — el hallazgo más útil

| Archivo | Duración | Qué contiene |
|---|---|---|
| `video Invitoo2.mp4` | **5 min 17 s**, 1920×1080 a 60 fps | Librería de B-roll de boda: floraciones en macro, ramos, manos entrelazadas, vestido, tarta, arcos florales, «Just Married», puestas de sol |
| `video Invitoo.mp4` | 791 MB | Máster largo del mismo material |
| `videos/video pareja corazon.mp4` | 62 s | Pareja, manos en corazón |

**Esto cubre al menos tres de las seis aperturas.** La **Floración** del prototipo está cortada de aquí (segundos 80–89) y funciona: 1,8 MB en vertical. **Cielo** y **Velo** probablemente también salen. No hay que rodar nada para empezar.

### Bodas reales ya hechas

`CONSUELO & MARC` y `PATTy JAVI` tienen carpeta propia con logo de la pareja, fotos, minuta, plano de mesas y MP3. Prueba de que el servicio *done-for-you* funciona y de que el trabajo a medida ya se está haciendo — sin cobrarse como tal. Es el argumento para el plan **Invitoo Estudio** de [02-estrategia.md §5.1](02-estrategia.md).

### El dossier

`DOSSIER_INVITOO.pdf` (7 páginas) tiene el proceso de 5 pasos ya redactado y funciona bien:

> Explora y Elige → Nos Contactamos Contigo → Creamos Tu Invitación → Revisión y Aprobación → Lista para Compartir

Se conserva tal cual en la web nueva. Es claro y quita la ansiedad de «¿qué pasa después de pagar?».

### Lottie

23 animaciones en `lottie/`, entre 2 y 45 KB: `flor.json`, `pareja.json`, `carta de san valentin.json`, `mosca de papel.json`. Sirven para microinteracciones dentro de la invitación (confirmación de RSVP, estados vacíos), **no** para las aperturas.

---

## 2. Un problema serio: los SVG

118 archivos en `SVG/` que suman **288 MB**. Media: 2,4 MB por icono.

| Archivo | Peso |
|---|---|
| `ceremonia.svg` | **41,7 MB** |
| `pastel (3).svg` | 25,4 MB |
| `copa.svg` | 18,5 MB |

No son vectores dibujados: son **trazados automáticos**, con miles de `clipPath` generados por un vectorizador. Un icono de verdad pesa entre 300 y 800 bytes.

Los que están publicados en invitoo.es son versiones reducidas, pero siguen fuera de escala — **medido en producción hoy**:

| | |
|---|---|
| `1-3.svg` | 76,5 KB |
| `coche-novios-3.svg` | 50,5 KB |
| `novios-beso.svg` | 44,0 KB |
| Los 12 iconos de una invitación, juntos | **~260 KB** |

**260 KB de iconos que deberían pesar 6 KB.** Es más que todo el HTML del prototipo nuevo (17 KB).

**Qué se hace:** no se migra ni uno. Se rehace el set de iconos de la invitación como sistema propio — trazo fino, misma familia, ~24 iconos, un `<symbol>` sprite de 6–8 KB para todos. De paso se gana lo que ahora no hay: iconos que se tiñen con el color de cada boda, porque heredan `currentColor`.

---

## 3. Otros problemas que conviene decir

**Un `.exe` de VPN y dos instaladores dentro de `lottie/`** (`UrbanVPN.exe`, `InstallFigmaAgent.exe`). No pintan nada en una carpeta de assets de marca; si alguna vez se sube ese directorio a algún sitio, va con ellos.

**Los banners de planes** (`planes/verticalplanes/*.png`) son script dorado sobre acuarela de hojas. Es el look genérico de Canva, y está claramente por debajo del nivel del logo. El logo de Invitoo es mejor que casi todo el material que lo rodea — ése es, en una frase, el problema de marca.

**Los JSON de Elementor** (`invitacion_elementor*.json`) y los zips `templates_elementor*.zip` dejan de tener valor en cuanto se sale de WordPress. Se archivan, no se migran.

**`INVITOO.txt`** guarda el formulario de RSVP de Contact Form 7 y la plantilla del email de confirmación. El contenido sí sirve — los campos que se piden están bien pensados (asistencia, comidas por día, alergias) y pasan tal cual al RSVP nuevo. El HTML, no.

---

## 4. Qué se lleva al proyecto nuevo

| | |
|---|---|
| ✅ Logo (4 PNG, a la espera del vectorial) | `app/public/marca/` |
| ✅ Metraje de vídeo | origen de las aperturas 02, 03 y 04 |
| ✅ Proceso de 5 pasos del dossier | web nueva |
| ✅ Campos del RSVP de `INVITOO.txt` | bloque RSVP |
| ✅ Lottie ligeros | microinteracciones |
| ✅ Bodas reales como caso | portfolio y plan Estudio |
| ❌ Los 118 SVG | se rehacen |
| ❌ Banners de planes | se rehacen |
| ❌ JSON/zips de Elementor | se archivan |
