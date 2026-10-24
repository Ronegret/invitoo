# 17 · Marca Invitoo: logo redibujado y guía de uso

> M1, 24-10-2026. El diseño del logo **no cambia**: es la marca de Rodrigo. Lo que cambia es el dibujo. Antes era un trazado automático de polígonos sacado de un PNG de 1000 px (30–44 KB por pieza). Ahora parte del PNG de 3240 px y está redibujado con geometría exacta.
> Hoja de pruebas: `qa/v3/m1/hoja-logo.png` (original, anterior y nuevo a 24, 64, 256 y 1024 px, con detalle a 3800 px). Capturas en la app: `qa/v3/m1/app-*.png`.

## 1. Qué se ha hecho y cómo se reconstruye

| Elemento | Cómo está dibujado |
|---|---|
| **I, I** | Rectángulos exactos: asta de 25,3 u sobre una altura de mayúscula de 173,6 u. |
| **N, V y T** | Se traza con potrace sobre el alfa sacado a 8× (la acuarela se separa con fondo local, dilatación y desenfoque, más una clasificación por color de cada componente). Después se ajusta Bézier con el algoritmo de Schneider, con detección de esquinas, y las astas, la línea de cabeza y la base se ajustan a las guías medidas. La comparación con el original da una diferencia de menos de un píxel a 4× (`qa/v3/m1/trabajo/diff_palabra.png`). |
| **Alianzas** | Circunferencias perfectas ajustadas por mínimos cuadrados (el error de elipse es menor de 0,3 %). Cada aro tiene **doble trazo** de 5 u. El entrelazado se calcula con arcos SVG: el aro izquierdo pasa por encima en el cruce superior y el derecho en el inferior, igual que el original. No hay ni un polígono. |
| **Brillante** | Líneas de 5,1 u con uniones a inglete, unidas en un polígono limpio con shapely: mesa, rondista, coronas en zigzag, pabellón y culet. El engaste termina justo en el canto interior del aro. |
| **«Invitaciones Digitales»** | Es la caligrafía original vectorizada del PNG de 3240 px, no una fuente. Se ha preferido así porque es una pincelada de autor (tipo *signature brush*) y ninguna Google Font la iguala sin perder carácter. Si alguna vez hiciera falta como texto vivo, la más parecida es **Ms Madi** (Google Fonts), con un tracking de −1 %. |
| **Sello** | Se reconstruye a partir de `logo/logo invitoo.png`. Los dos aros finos son concéntricos y exactos (r 212,2 y 202,7, con trazo de 2). Las letras INVI/T se reutilizan de los glifos de alta resolución del logotipo, con la escala medida en el sello. Las O son didonas, dibujadas con dos elipses. El brillante tiene su propio diseño de líneas. |

Para regenerarlo todo (SVG, variantes, iconos, favicon y, si se pide, las texturas):

```bash
herramientas/marca/construir.sh            # o: construir.sh --texturas
```

Archivos: `herramientas/marca/{trazar,letras,bezier,logo,exportar,sello_tsx,texturas,lacre}.py`, `iconos.mjs` y `render.mjs`.

## 2. Piezas

Todas usan `fill="currentColor"`, de modo que el color lo pone el CSS. Usadas en `<img>`, se ven en negro.

| Archivo | Uso | Peso |
|---|---|---|
| `public/marca/palabra.svg` | INVIT + alianzas. Cabecera y firmas cortas. viewBox 877,3 × 219,2 (4 : 1, como antes) | **3,9 KB** (antes 29,7) |
| `public/marca/lockup.svg` | Firma completa con «Invitaciones Digitales». Pie, documentos y OG | 16,4 KB (antes 43,8), la mayor parte en la caligrafía |
| `public/marca/sello.svg` | Sello circular INVI/TOO. Notificaciones, impresión y lacre | **4,6 KB** (antes 42,4) |
| `public/marca/aros.svg` | Monograma fiel, de doble trazo. A partir de 48 px | **1,2 KB** (antes 20,9) |
| `public/marca/aros-simple.svg` | Monograma de **corte óptico**, con cada aro como banda maciza. Por debajo de 48 px | 0,8 KB |
| `public/marca/alianzas-relieve.svg` | Negro sobre transparente y cuadrado, para mapas de altura (lacre 3D de X1) | 1,3 KB |
| `public/marca/variantes/*-{tinta,papel,oro,granate}.svg` | Las cinco piezas con el color fijado (positivo, negativo, oro y granate) | — |
| `src/components/SelloAlianzas.tsx` | Componente React con la misma API (`size`, `girando`, `className`) más `corte="fino"\|"grueso"`, automático a partir de 48 px. Exporta `ALIANZAS_FINO`, `BRILLANTE_FINO`, `ALIANZAS_GRUESO` y `BRILLANTE_GRUESO` (viewBox 300 × 212) | < 2 KB |
| `src/components/marca/LacreVectorial.tsx` | Lacre de cera en SVG con iniciales o alianzas, para SSR | ~3 KB |
| Iconos | `src/app/favicon.ico` (16, 32 y 48), `src/app/icon.svg`, `src/app/apple-icon.png` (180), `public/marca/icono-192.png`, `icono-512.png`, `icono-maskable-512.png`, `icono.svg` y `src/app/manifest.ts` | — |
| OG por defecto | `src/app/opengraph-image.jpg` y `public/marca/og-invitoo.jpg` (1200 × 630): papel de algodón, firma completa, «Vuestra boda, contada como se merece.» e invitoo.es | 55 KB |

El logo anterior está guardado en `qa/v3/m1/respaldo-marca-anterior/`.

## 3. Colores

| Nombre | Hex | Uso del logo |
|---|---|---|
| Tinta | `#12100E` | Positivo, sobre papel o bruma |
| Papel | `#FAF8F5` | Negativo, sobre tinta, granate o foto con velo |
| Granate | `#8C1D2C` | Firma de marca, favicon e iconos de app (loseta granate con aros en papel) y lacre |
| Oro | `#B08D57` | Solo sobre tinta o granate profundo, o en impresión con *foil*. Sobre papel claro no llega a AA para texto, así que nunca se usa en tamaños por debajo de 32 px |
| Bruma | `#EDE6DD` | Fondo, nunca en el logo |

Combinaciones permitidas: tinta sobre papel o bruma · papel sobre tinta o granate · oro sobre tinta o granate · granate sobre papel.

## 4. Área de respeto y tamaños mínimos

- **Área de respeto:** alrededor de la firma, el **alto de la I** (la altura de mayúscula, *x*). En el sello y el monograma, **la mitad del diámetro del aro pequeño**. Ahí no entra texto, ni borde, ni otra marca.
- **Tamaños mínimos:**

| Pieza | Pantalla | Impresión |
|---|---|---|
| `palabra.svg` | 72 px de ancho (cabecera: 104 px) | 20 mm |
| `lockup.svg` | 140 px (por debajo, la caligrafía se empasta: usad `palabra`) | 35 mm |
| `sello.svg` | 48 px | 15 mm |
| `aros.svg` (doble trazo) | 48 px | 12 mm |
| `aros-simple.svg` / `SelloAlianzas` corte grueso | 16 px | 5 mm |

## 5. Usos correctos

- La firma, en una sola tinta y a plena opacidad (o al 40–70 % en firmas discretas al pie de la invitación).
- En la cabecera, `palabra`. En el pie y en los documentos, `lockup`. En lo pequeño (favicon, loader, confirmación), los aros.
- Sobre foto, siempre con un velo que asegure el contraste AA, y en papel.
- El sello, como lacre, matasellos o estampado de «Confirmado».

## 6. Usos incorrectos

1. Recomponer «INVIT» con una fuente web. El logotipo es un dibujo.
2. Deformar, inclinar o cambiar las proporciones: alianzas ovaladas, letras estrechadas…
3. Cambiar el entrelazado: los dos aros por encima, o sin cruce.
4. Poner el brillante sobre el aro derecho o quitarlo.
5. Degradados, sombras, contornos, biseles o el efecto «oro 3D» en el logo plano. El oro en relieve solo existe como objeto: lacre, foil o render 3D.
6. Usar el doble trazo por debajo de 48 px. Ahí va el corte grueso.
7. Colocar el logo sobre la acuarela antigua o sobre fondos con mucho ruido sin velo.
8. Usar los PNG antiguos (`logo largo *.png`) o el SVG de polígonos anterior.
9. Usar la caligrafía como texto corrido. Solo existe dentro del lockup.

## 7. Texturas de marca (procedurales, sin IA)

En `public/marca/texturas/`, periódicas (se repiten sin costura), a 2048 px en WebP y AVIF, más una versión de 1024 px:
`papel-algodon` (#F6F1E9), `lino` (#EBE3D6), `marmol`, `terciopelo-granate` y `grano-512.webp` (para mezclar con `multiply` u `overlay`).

```css
background: #f6f1e9 url(/marca/texturas/papel-algodon-1024.webp) 0 0 / 512px;
```

Las genera `herramientas/marca/texturas.py` con una semilla fija, así que salen siempre iguales.
