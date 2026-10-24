# 18 · Imágenes con IA: generador, motores y biblioteca de encargos

> M1, 24-10-2026. Rodrigo ha pedido no seguir usando las fotos actuales (stock, con la misma pareja repetida) y crear imágenes propias de Invitoo. Este documento explica cómo generarlas: con tres motores, por línea de comandos, por lote o desde Claude Desktop con un MCP.

## 0. Resumen en cuatro líneas

1. **Gratis en el PC:** arranca ComfyUI (`C:\IA\ARRANCAR-COMFYUI.bat`) y haz doble clic en `app\GENERAR-IMAGENES-LOCAL.bat`.
2. **Gratis en la nube:** pon `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` en `app/.env.local` y abre `app\GENERAR-IMAGENES.bat`.
3. **Máxima calidad (de pago):** pon `GEMINI_API_KEY=…` en `app/.env.local`, **activa la facturación** del proyecto de Google AI Studio y usa `GENERAR-IMAGENES.bat` (o `--motores gemini`).
4. Todo sale en `app/public/generadas/<id>.png`, con AVIF y WebP en 480, 768, 1080, 1600 y 2048 px, y queda anotado en `herramientas/imagenes/catalogo.json` (prompt, motor, modelo, semilla y uso).

## 1. Motores

| Motor | Modelo | Coste | Referencias (coherencia) | Cuándo usarlo |
|---|---|---|---|---|
| **local** (ComfyUI en el PC) | FLUX.2 [klein] 4B destilado (Apache-2.0), unos 16 s por imagen en la RTX 5070. Alternativa: FLUX.1 schnell (Apache-2.0) | 0 € | No (con este flujo) | Borradores, texturas, bodegones, lugares y volumen |
| **cloudflare** (Workers AI) | `@cf/black-forest-labs/flux-2-klein-4b` (por defecto; Apache-2.0, uso comercial permitido) y `@cf/black-forest-labs/flux-1-schnell` (borrador) | 0 € hasta 10.000 neurons al día (≈ 95 imágenes klein o ≈ 170 schnell de 1 MP) | klein: hasta 4 imágenes de menos de 512 px | Cuando el PC está apagado. Coherencia básica |
| **gemini** (Nano Banana) | `gemini-3-pro-image` (Nano Banana Pro, por defecto para fotos finales); borrador `gemini-3.1-flash-image`; otros: `gemini-nano-banana-2.1`, `gemini-2.5-flash-image` | De pago: en torno a 0,13 $ por imagen de 1–2K con Pro y unos 0,04 $ con Flash (consultad ai.google.dev/pricing) | Sí: hasta 6 imágenes de objeto y 5 de personaje | **Parejas** (la misma en todas sus fotos), ediciones y fotos de portada |

**Orden por defecto en el lote:** local → cloudflare → gemini. Si un motor no responde, no tiene cuota o no tiene facturación, se marca como agotado para esa ejecución y se pasa al siguiente. **Nunca se reintenta en bucle.** Se cambia con `--motores gemini,cloudflare` o con `INVITOO_MOTORES=` en `.env.local`. Los encargos con referencias (las fotos de una pareja) prefieren los motores que las aceptan.

**Comprobado desde aquí (24-10):**
- La clave de Gemini es válida y lista `gemini-3-pro-image`, `gemini-3.1-flash-image`, `gemini-nano-banana-2.1`, `gemini-2.5-flash-image` y `nano-banana-pro-preview`.
- `generateContent` acepta el formato que usamos: `responseModalities: ["IMAGE"]`, `imageConfig.aspectRatio`, `imageSize` y `seed`.
- **Falta la facturación:** cada llamada responde `429 … limit: 0 … Free Tier`. La CLI y el MCP lo explican así y no reintentan.

### Calidad: Nano Banana Pro frente a FLUX

| | Nano Banana Pro | FLUX.2 klein 4B | FLUX.1 schnell |
|---|---|---|---|
| Piel, manos y ropa | Muy realista; manos fiables | Bueno a 1 MP; alguna mano rara | Piel algo plástica; vigilar manos |
| La misma pareja en varias fotos | **Excelente**, con referencias | Aproximada, solo por descripción y referencias pequeñas | Solo por descripción |
| Seguir el prompt (composición y paleta) | Excelente | Bueno | Correcto |
| Texto no deseado (garabatos en lacres y carteles) | Raro | Ocurre: el prompt ya pide «plain smooth wax seal, no letters» | Ocurre |
| Resolución | 1K, 2K y 4K | ≈ 1 MP (se reescala con sharp) | ≈ 1 MP |
| Licencia de uso | Comercial (condiciones de Google; marca de agua invisible SynthID) | Apache-2.0 | Apache-2.0 |

**Recomendación:** generad gratis con FLUX las texturas, los lugares, los bodegones y los ramos, y todos los borradores. Las **parejas** de las 12 plantillas (portada y álbum, unas 70 imágenes) generadlas con Nano Banana Pro, porque la coherencia de la misma pareja en cinco fotos es lo que separa «demo de verdad» de «stock de IA», el defecto que el doc 12 señala en Serenela. Con Pro eso son unos 10 € en total.

## 2. Activar cada motor

Todas las claves van en **`app/.env.local`**, que está en `.gitignore`. Nunca van al repositorio ni al chat.

```dotenv
# Gemini / Nano Banana (de pago)
GEMINI_API_KEY=...
# Cloudflare Workers AI (gratis)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
# Opcional
INVITOO_MOTORES=local,cloudflare,gemini
INVITOO_GEMINI_MODELO=gemini-3-pro-image
INVITOO_GEMINI_BORRADOR=gemini-3.1-flash-image
INVITOO_CF_MODELO=@cf/black-forest-labs/flux-2-klein-4b
COMFYUI_URL=http://127.0.0.1:8188
```

### 2.1 Gemini: activar la facturación

1. Abre <https://aistudio.google.com/> → **Get API key** y localiza el proyecto de tu clave.
2. Pulsa **Set up billing** (o ve a console.cloud.google.com/billing y vincula una cuenta de facturación a ese proyecto).
3. Pon un **presupuesto con alerta** (Billing → Budgets) de 20 €, por tranquilidad.
4. Prueba: `node herramientas/imagenes/nano-banana.mjs generar --motor gemini --prompt "cream cotton envelope with a plain burgundy wax seal on linen" --salida prueba`.

### 2.2 Cloudflare Workers AI (gratis)

1. Crea una cuenta gratuita en <https://dash.cloudflare.com/sign-up>. No hace falta dominio ni tarjeta para el plan gratuito de Workers AI.
2. **Account ID:** en el panel, menú **Account home**, junto al nombre de la cuenta (⋯ → *Copy account ID*), o en **Workers & Pages**, en la columna de la derecha.
3. **Token:** **My Profile → API Tokens → Create Token → plantilla «Workers AI»**, con los permisos *Account · Workers AI · Read* y *Edit*, solo para tu cuenta. Cópialo (solo se muestra una vez).
4. Guarda los dos valores en `app/.env.local`.
5. **Cuota:** 10.000 neurons al día, que se renuevan a las 00:00 UTC. El script lleva un contador local (`herramientas/imagenes/.cuota-cloudflare.json`), avisa al llegar al **90 %** y para antes de pasarse. Los valores por imagen son estimaciones configurables (`INVITOO_CF_NEURONS_KLEIN`, `INVITOO_CF_NEURONS_SCHNELL`); el consumo real se ve en *AI → Workers AI* del panel.

### 2.3 Local con ComfyUI (gratis, en el PC de Rodrigo)

**Lo que ya está instalado (24-10):** ComfyUI 0.42.1 portable en `C:\IA\ComfyUI\ComfyUI_windows_portable`, que se arranca con `C:\IA\ARRANCAR-COMFYUI.bat`, y FLUX.2 [klein] 4B:
- `models\diffusion_models\flux-2-klein-4b.safetensors`
- `models\text_encoders\qwen_3_4b_fp4_flux2.safetensors` (CLIPLoader de tipo `flux2`)
- `models\vae\flux2-vae.safetensors`

El flujo `herramientas/imagenes/flujos/flux2-klein-4b.json` es el mismo grafo que `C:\IA\probar-flux.py`: UNETLoader → CLIPTextEncode → ConditioningZeroOut → CFGGuider (cfg 1) → KSamplerSelect euler → Flux2Scheduler (4 pasos) → EmptyFlux2LatentImage → RandomNoise → SamplerCustomAdvanced → VAEDecode.

**Uso:**
1. `C:\IA\ARRANCAR-COMFYUI.bat` y espera a que <http://127.0.0.1:8188> responda.
2. Doble clic en **`app\GENERAR-IMAGENES-LOCAL.bat`**. Genera los encargos pendientes y los copia por categoría a `%USERPROFILE%\Desktop\Invitoo\imagenes-ia\<grupo>\`. Opciones: `--solo carta`, `--max 10`, `--rehacer`, `--y-nube` (si ComfyUI falla, sigue con Cloudflare y luego con Gemini).

**Si se quiere FLUX.1 schnell desde Pinokio:** Pinokio → *Discover* → **ComfyUI** → *Install* → *Start*. Las carpetas de modelos suelen estar en `C:\pinokio\api\comfy.git\app\models\`.
- **GPU de 12 GB o más:** `checkpoints\flux1-schnell-fp8.safetensors` (Hugging Face, `Comfy-Org/flux1-schnell`), con el flujo `flux-schnell-fp8`.
- **GPU de 6 a 10 GB:** instala el nodo **ComfyUI-GGUF** (city96) desde el *Manager* y descarga `unet\flux1-schnell-Q5_K_S.gguf` (`city96/FLUX.1-schnell-gguf`), `clip\t5xxl_fp8_e4m3fn.safetensors` y `clip\clip_l.safetensors` (`comfyanonymous/flux_text_encoders`) y `vae\ae.safetensors` (`black-forest-labs/FLUX.1-schnell`). Flujo: `flux-schnell-gguf`.
- Después: `GENERAR-IMAGENES-LOCAL.bat --flujo flux-schnell-gguf`.

**Lote para otro programa:** `node herramientas/imagenes/nano-banana.mjs exportar` escribe `herramientas/imagenes/encargos-flux.json` con `name`, `prompt`, `width`, `height`, `seed` y `carpeta`, listo para `probar-flux.py`.

## 3. Herramientas

```bash
cd app
node herramientas/imagenes/nano-banana.mjs estado                       # motores y cuota
node herramientas/imagenes/nano-banana.mjs generar --prompt "…" --aspecto 4:5 --ref public/generadas/carta-portada.png --salida carta-prueba
node herramientas/imagenes/nano-banana.mjs editar --imagen public/generadas/carta-album-2.png --prompt "remove the glass from her hand"
node herramientas/imagenes/nano-banana.mjs variaciones --prompt "…" --n 4 --borrador
node herramientas/imagenes/nano-banana.mjs lote --solo carta --max 10      # o --simulacro para ver qué haría
node herramientas/imagenes/encargos-fuente.mjs                           # regenera encargos.json desde la fuente
```

- Aspectos: `1:1`, `4:5`, `3:4`, `2:3`, `9:16`, `16:9`, `3:2`, `5:4` y `21:9`. En FLUX se usan tamaños de unos 1 MP en múltiplos de 16, y se recorta si el motor no respeta la proporción.
- Semilla: se deriva del id, así que repetir un encargo da la misma imagen en FLUX. En Gemini es orientativa.
- El lote **salta lo ya generado**: se puede cortar y relanzar. `--rehacer` lo fuerza.
- Archivos: `herramientas/imagenes/nucleo.mjs` (motores, cuota, guardado y catálogo), `nano-banana.mjs` (CLI), `local-comfyui.mjs`, `flujos/*.json`, `encargos-fuente.mjs` → `encargos.json`, y `app/GENERAR-IMAGENES*.bat` (CRLF).

### 3.1 Servidor MCP para Claude Desktop

En `app/herramientas/mcp-nano-banana/` (Node, `@modelcontextprotocol/sdk`, stdio). Tiene cinco herramientas: `generar_imagen`, `editar_imagen`, `variaciones`, `lote_encargos` y `estado_motores`. Cada una devuelve la ruta, el motor, la semilla y una vista previa JPEG. Instalación paso a paso en su [README](../app/herramientas/mcp-nano-banana/README.md). Está **probado** aquí: arranca, lista las cinco herramientas y, con la clave sin facturación, devuelve el mensaje explicativo del 429.

## 4. Biblioteca de encargos (`herramientas/imagenes/encargos.json`)

**128 encargos** en 19 grupos, con calidad de fotógrafo de bodas editorial y luz natural:

| Grupo | N.º | Qué |
|---|---|---|
| 12 plantillas (carta, sobre, floracion, mar, velo, constelacion, tinta, registro, azulejo, regencia, aire, cuento) | 70 | Por plantilla, una **portada** (la referencia de la pareja) y 4 fotos de álbum o escenas. Carta tiene además 4 capítulos de su historia. Las temáticas llevan su póster horizontal y su imagen de apertura |
| aperturas | 12 | Primer fotograma 9:16 de cada máster de apertura, que sirve también de póster |
| marca | 15 | Alianzas Invitoo (como el logo: una lisa y otra con brillante), lacres granate, oro y roto, sobres de algodón, letterpress en seco, bodegones, ramos (olivo, peonías, azahar) y mesas |
| lugares | 6 | Masía del Empordà, olivar, cala de Ibiza, patio sevillano, pinar de Segovia y plaza gótica de Barcelona (también para SEO local) |
| texturas | 5 | Papel de algodón, lino, acuarela, mármol y terciopelo |
| marketing | 8 | La invitada con el móvil, la abuela leyendo, la TV del salón (En directo), el QR en la mesa, los novios en el sofá, el móvil en un café, el Libro de buenos deseos y la mesa del estudio |
| directo | 8 | Fotos «de invitado» para la pantalla y la pestaña En directo |
| web | 5 | Hero, tres cortes editoriales y el póster de la portada |

**Las parejas, todas ficticias y diversas:** Inés y Gonzalo (Valsaín y La Granja, Segovia) · Laura y Rubén (iglesia neoclásica de Madrid y una casa de campo con patio de hiedra) · Nora y Sebas (olivar de Chinchón; ella, afroespañola, y él, de origen argentino) · Sara y Marcos (cala de Ibiza) · Claudia y Jorge (en torno a los 40, en un palacio-club de Madrid) · **Yone y Noe** (dos novias, azotea de Madrid de noche) · Marta y Álvaro (blanco y negro, registro civil y taberna) · **Àlex y Bruno** (dos novios, Gótico de Barcelona) · Rocío y Javier (patio de azulejos de Sevilla, con mantilla) · Olivia y Edmundo (jardines de Aranjuez, estilo Regencia) · Blanca y Alonso (salón blanco; él, de origen filipino-español) · Aurora y Leo (castillo modernista del Maresme).

**Cada encargo** lleva `id`, `grupo`, `uso`, `aspecto`, `prompt` (en inglés), `negativos`, `referencias` (ids que se generan antes, ordenados por dependencia), `referencias_archivos` (por ejemplo, el dibujo del monograma `public/marca/referencias/alianzas-dibujo.png` para que alianzas y lacres sean coherentes con el logo), `sustituye` y `salida`.

**Reglas que se aplican a todos:**
- Personas ficticias: nunca famosos ni gente real reconocible.
- Sin logos, marcas ni texto incrustado (los nombres van en HTML).
- Las pantallas de móvil y TV salen vacías, en crema o negro liso, para componer después la invitación real.
- Lacres: «plain smooth, no letters».
- Paleta de cada plantilla.

En Gemini, los negativos se envían como «Strictly avoid: …». En FLUX, que no tiene negativos, el prompt se reformula en positivo.

## 5. Mapa de sustitución (inventario completo)

**No se ha borrado ni movido ninguna foto.** F2 (plantillas: `data/demo.ts`, `plantillas/tematicas/*`) y F3 (web: `components/sitio/EnDirecto.tsx`) sustituirán las rutas al integrar. La regla es cambiar `/fotos/…avif` por `/generadas/<id>-1080.avif`, o mejor por un `<picture>` con AVIF y WebP de 768 / 1080 / 1600. La columna «Encargo» es el `id`; el archivo es `public/generadas/<id>-<ancho>.avif|webp`. Hay que mantener el `alt` de cada foto y añadir «(imagen de demostración generada con IA)» en las demos (ver doc 19, §7).

| Ruta (`public/…`) | Tamaño | KB | Uso actual | Encargo que la sustituye |
|---|---|---|---|---|
| `aperturas/brasa/horizontal.mp4` | vídeo | 385 | apertura brasa (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/brasa/poster.avif` | 720×1092 | 35 | apertura brasa (vídeo/póster) | apertura-brasa |
| `aperturas/brasa/vertical.mp4` | vídeo | 624 | apertura brasa (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/bruma/horizontal.mp4` | vídeo | 469 | apertura bruma (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/bruma/poster.avif` | 720×1735 | 26 | apertura bruma (vídeo/póster) | apertura-bruma |
| `aperturas/bruma/vertical.mp4` | vídeo | 1120 | apertura bruma (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/cielo/horizontal.mp4` | vídeo | 641 | apertura cielo (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/cielo/poster.avif` | 720×1279 | 26 | referenciada en src; apertura cielo (vídeo/póster) | apertura-cielo |
| `aperturas/cielo/vertical.mp4` | vídeo | 1002 | apertura cielo (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/constelacion/horizontal.mp4` | vídeo | 421 | apertura constelacion (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/constelacion/poster.avif` | 720×1279 | 37 | referenciada en src; apertura constelacion (vídeo/póster) | apertura-constelacion |
| `aperturas/constelacion/vertical.mp4` | vídeo | 1111 | apertura constelacion (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/floracion/horizontal.mp4` | vídeo | 1531 | referenciada en src; apertura floracion (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/floracion/poster.avif` | 720×1279 | 40 | referenciada en src; apertura floracion (vídeo/póster) | apertura-floracion |
| `aperturas/floracion/vertical.mp4` | vídeo | 1760 | referenciada en src; apertura floracion (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/jardin/horizontal.mp4` | vídeo | 649 | referenciada en src; apertura jardin (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/jardin/poster.avif` | 720×1279 | 50 | apertura jardin (vídeo/póster) | apertura-jardin |
| `aperturas/jardin/vertical.mp4` | vídeo | 1600 | referenciada en src; apertura jardin (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/lino/horizontal.mp4` | vídeo | 560 | apertura lino (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/lino/poster.avif` | 720×1735 | 39 | apertura lino (vídeo/póster) | apertura-lino |
| `aperturas/lino/vertical.mp4` | vídeo | 1000 | apertura lino (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/marea/horizontal.mp4` | vídeo | 1218 | apertura marea (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/marea/poster.avif` | 720×1279 | 35 | apertura marea (vídeo/póster) | apertura-marea |
| `aperturas/marea/vertical.mp4` | vídeo | 1565 | apertura marea (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/sobre/horizontal.mp4` | vídeo | 826 | apertura sobre (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/sobre/poster.avif` | 720×1735 | 45 | referenciada en src; apertura sobre (vídeo/póster) | apertura-sobre |
| `aperturas/sobre/vertical.mp4` | vídeo | 1453 | apertura sobre (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/terracota/horizontal.mp4` | vídeo | 584 | apertura terracota (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/terracota/poster.avif` | 720×998 | 27 | apertura terracota (vídeo/póster) | apertura-terracota |
| `aperturas/terracota/vertical.mp4` | vídeo | 1241 | apertura terracota (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/tinta/horizontal.mp4` | vídeo | 502 | apertura tinta (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/tinta/poster.avif` | 720×1735 | 37 | referenciada en src; apertura tinta (vídeo/póster) | apertura-tinta |
| `aperturas/tinta/vertical.mp4` | vídeo | 779 | apertura tinta (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/velo/horizontal.mp4` | vídeo | 551 | referenciada en src; apertura velo (vídeo/póster) | plan de vídeo (§6) |
| `aperturas/velo/poster.avif` | 720×1092 | 32 | referenciada en src; apertura velo (vídeo/póster) | apertura-velo |
| `aperturas/velo/vertical.mp4` | vídeo | 1129 | referenciada en src; apertura velo (vídeo/póster) | plan de vídeo (§6) |
| `fotos/alianzas.avif` | 1200×1876 | 31 | **sin uso en src (huérfana)** | marca-alianzas-lino |
| `fotos/bodas/brasa-1.avif` | 900×1350 | 31 | referenciada en src; muestra En directo (momentos) | carta-capitulo-2 |
| `fotos/bodas/brasa-2.avif` | 900×600 | 6 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/bodas/brasa-3.avif` | 900×1350 | 24 | referenciada en src | carta-capitulo-1 |
| `fotos/bodas/brasa-4.avif` | 900×1350 | 15 | referenciada en src | carta-capitulo-4 |
| `fotos/bodas/bruma-1.avif` | 900×601 | 7 | álbum demo Registro; muestra En directo (momentos) | registro-album-1 |
| `fotos/bodas/bruma-2.avif` | 900×601 | 11 | álbum demo Registro | registro-album-2 |
| `fotos/bodas/bruma-3.avif` | 900×1348 | 44 | álbum demo Registro | registro-album-3 |
| `fotos/bodas/bruma-4.avif` | 900×601 | 9 | álbum demo Registro | registro-album-4 |
| `fotos/bodas/cielo-1.avif` | 900×1350 | 19 | álbum demo Mar; muestra En directo (momentos) | mar-album-1 |
| `fotos/bodas/cielo-2.avif` | 900×1350 | 52 | álbum demo Mar | mar-album-2 |
| `fotos/bodas/cielo-3.avif` | 900×600 | 6 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/bodas/cielo-4.avif` | 900×1350 | 17 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/bodas/constelacion-1.avif` | 900×600 | 16 | álbum demo constelacion; muestra En directo (momentos) | constelacion-album-1 |
| `fotos/bodas/constelacion-2.avif` | 900×600 | 16 | referenciada en src; álbum demo constelacion | constelacion-album-2 |
| `fotos/bodas/constelacion-3.avif` | 900×1350 | 17 | álbum demo constelacion | constelacion-album-3 |
| `fotos/bodas/constelacion-4.avif` | 900×600 | 10 | referenciada en src; álbum demo constelacion | constelacion-album-4 |
| `fotos/bodas/floracion-1.avif` | 900×600 | 81 | álbum demo floracion; muestra En directo (momentos) | floracion-album-1 |
| `fotos/bodas/floracion-2.avif` | 900×600 | 17 | álbum demo floracion | floracion-album-2 |
| `fotos/bodas/floracion-3.avif` | 900×600 | 63 | álbum demo floracion; muestra En directo (momentos) | floracion-album-3 |
| `fotos/bodas/floracion-4.avif` | 900×600 | 40 | referenciada en src; álbum demo floracion | floracion-album-4 |
| `fotos/bodas/jardin-1.avif` | 900×1350 | 24 | referenciada en src; muestra En directo (momentos) | carta-album-2 |
| `fotos/bodas/jardin-2.avif` | 900×1350 | 62 | referenciada en src | carta-album-4 |
| `fotos/bodas/jardin-3.avif` | 900×1350 | 35 | muestra En directo (momentos) || `directo-*` (rotación de las 8) |
| `fotos/bodas/jardin-4.avif` | 900×1350 | 8 | referenciada en src | carta-capitulo-3 |
| `fotos/bodas/lino-1.avif` | 900×600 | 14 | referenciada en src | azulejo-album-3 |
| `fotos/bodas/lino-2.avif` | 900×600 | 13 | referenciada en src; muestra En directo (momentos) | azulejo-album-4 |
| `fotos/bodas/lino-3.avif` | 900×600 | 11 | referenciada en src | azulejo-album-2 |
| `fotos/bodas/lino-4.avif` | 900×600 | 21 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/bodas/marea-1.avif` | 900×1350 | 15 | álbum demo Mar | mar-album-3 |
| `fotos/bodas/marea-2.avif` | 900×1350 | 17 | álbum demo Mar; muestra En directo (momentos) | mar-album-4 |
| `fotos/bodas/marea-3.avif` | 900×1350 | 19 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/bodas/marea-4.avif` | 900×1350 | 19 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/bodas/sobre-1.avif` | 900×600 | 32 | álbum demo sobre | sobre-album-1 |
| `fotos/bodas/sobre-2.avif` | 900×600 | 34 | álbum demo sobre; muestra En directo (momentos) | sobre-album-2 |
| `fotos/bodas/sobre-3.avif` | 900×600 | 14 | álbum demo sobre | sobre-album-3 |
| `fotos/bodas/sobre-4.avif` | 900×600 | 26 | álbum demo sobre | sobre-album-4 |
| `fotos/bodas/terracota-1.avif` | 900×600 | 47 | referenciada en src; muestra En directo (momentos) | carta-album-1 |
| `fotos/bodas/terracota-2.avif` | 900×600 | 87 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/bodas/terracota-3.avif` | 900×600 | 17 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/bodas/terracota-4.avif` | 900×600 | 81 | referenciada en src | carta-album-3 |
| `fotos/bodas/tinta-1.avif` | 900×600 | 25 | referenciada en src; álbum demo tinta | tinta-album-1, azulejo-album-1 |
| `fotos/bodas/tinta-2.avif` | 900×600 | 18 | álbum demo tinta; muestra En directo (momentos) | tinta-album-2 |
| `fotos/bodas/tinta-3.avif` | 900×600 | 32 | álbum demo tinta | tinta-album-3 |
| `fotos/bodas/tinta-4.avif` | 900×600 | 14 | álbum demo tinta | tinta-album-4 |
| `fotos/bodas/velo-1.avif` | 900×1350 | 31 | álbum demo velo; muestra En directo (momentos) | velo-album-1 |
| `fotos/bodas/velo-2.avif` | 900×1350 | 26 | referenciada en src; álbum demo velo | velo-album-2 |
| `fotos/bodas/velo-3.avif` | 900×1407 | 18 | álbum demo velo | velo-album-3 |
| `fotos/bodas/velo-4.avif` | 900×1350 | 159 | álbum demo velo | velo-album-4 |
| `fotos/hero.avif` | 1600×1067 | 210 | **sin uso en src (huérfana)** | web-hero |
| `fotos/p-brasa.avif` | 1100×1650 | 27 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/p-bruma.avif` | 1100×734 | 12 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/p-cielo.avif` | 1100×1650 | 33 | referenciada en src | mar-portada |
| `fotos/p-constelacion.avif` | 1100×1650 | 36 | referenciada en src | constelacion-portada |
| `fotos/p-floracion.avif` | 1100×734 | 85 | referenciada en src | floracion-portada |
| `fotos/p-jardin.avif` | 1100×1650 | 54 | referenciada en src | carta-portada |
| `fotos/p-lino.avif` | 1100×734 | 49 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/p-marea.avif` | 1100×1650 | 27 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/p-sobre.avif` | 1100×734 | 52 | referenciada en src | sobre-portada |
| `fotos/p-terracota.avif` | 1100×734 | 21 | **sin uso en src (huérfana)** || no hace falta: sin uso |
| `fotos/p-tinta.avif` | 1100×734 | 30 | referenciada en src | tinta-portada |
| `fotos/p-velo.avif` | 1100×1650 | 33 | referenciada en src | velo-portada |
| `fotos/sitio/corte-1.avif` | 1700×2550 | 176 | **sin uso en src (huérfana)** | web-corte-1 |
| `fotos/sitio/corte-2.avif` | 1700×2550 | 35 | **sin uso en src (huérfana)** | web-corte-2 |
| `fotos/sitio/corte-3.avif` | 1700×1135 | 15 | **sin uso en src (huérfana)** | web-corte-3 |
| `fotos/sitio/portada-2.avif` | 1600×900 | 23 | **sin uso en src (huérfana)** | web-portada |
| `fotos/sitio/portada-h.mp4` | vídeo | 1087 | **sin uso en src (huérfana)** | plan de vídeo (§6) |
| `fotos/sitio/portada-v.mp4` | vídeo | 1018 | **sin uso en src (huérfana)** | plan de vídeo (§6) |
| `fotos/sitio/portada.avif` | 1600×900 | 28 | **sin uso en src (huérfana)** | web-portada |
| `tematicas/aire/apertura.avif` | 720×1280 | 9 | hero temático | aire-apertura |
| `tematicas/aire/hero-h.webm` | vídeo | 381 | referenciada en src; hero temático | plan de vídeo (§6) |
| `tematicas/aire/hero-v.webm` | vídeo | 259 | referenciada en src; hero temático | plan de vídeo (§6) |
| `tematicas/aire/poster-h.avif` | 1280×720 | 9 | referenciada en src; hero temático | aire-poster-h |
| `tematicas/aire/poster-v.avif` | 720×1280 | 4 | referenciada en src; hero temático | aire-portada |
| `tematicas/cuento/apertura.avif` | 720×1280 | 5 | hero temático | cuento-apertura |
| `tematicas/cuento/hero-h.webm` | vídeo | 1326 | referenciada en src; hero temático | plan de vídeo (§6) |
| `tematicas/cuento/hero-v.webm` | vídeo | 662 | referenciada en src; hero temático | plan de vídeo (§6) |
| `tematicas/cuento/poster-h.avif` | 1280×720 | 20 | referenciada en src; hero temático | cuento-poster-h |
| `tematicas/cuento/poster-v.avif` | 720×1280 | 12 | referenciada en src; hero temático | cuento-portada |
| `tematicas/regencia/hero-h.webm` | vídeo | 450 | referenciada en src; hero temático | plan de vídeo (§6) |
| `tematicas/regencia/hero-v.webm` | vídeo | 486 | referenciada en src; hero temático | plan de vídeo (§6) |
| `tematicas/regencia/poster-h.avif` | 1280×720 | 14 | referenciada en src; hero temático | regencia-poster-h |
| `tematicas/regencia/poster-v.avif` | 720×1280 | 15 | referenciada en src; hero temático | regencia-portada |

**Total: 119 archivos** (87 imágenes y 32 vídeos).

## 6. Plan de animaciones originales de marca

| Pieza | Técnica recomendada | Por qué |
|---|---|---|
| **El aro que se dibuja** | **SVG animado** (`stroke-dashoffset` sobre los trazados de `SelloAlianzas`, de 1,2 s con `--ease-carta`) | Menos de 2 KB, se tiñe, es nítido a cualquier tamaño y desaparece con reduced-motion. Listo para montar |
| **El brillante que destella** | **SVG + CSS**: un gradiente que cruza el polígono del brillante y 4 rayos (600 ms, una vez) | Es una microinteracción; no justifica descargar nada |
| **El lacre que se rompe** | **Vídeo corto con alfa** (WebM VP9 más HEVC con alfa para Safari), de 1,4 s, generado a partir de `marca-lacre-alianzas`. La versión interactiva es el 3D de X1 | La física de la cera (fragmentos, brillo) queda pobre en SVG |
| **Las flores que florecen** | **SVG animado** (`<Florecer>` de F1) en la invitación; vídeo IA solo para el máster de Floración | Las flores de línea comparten trazo con las alianzas y se tiñen |
| **Entrada de marca (telón)** | **Lottie** (unos 15 KB) exportado de los SVG: aros que se dibujan → brillante que encaja → la palabra aparece | Una sola pieza para la web, los reels y la pantalla En directo |

**Vídeo para los másters de apertura:** Gemini/Veo (imagen → vídeo a partir del primer fotograma `apertura-<id>.png`) o Higgsfield (Kling o Seedance, imagen → vídeo). `encargos.json → videos[]` tiene, para las 12 aperturas, el primer fotograma, la duración (8 s), los formatos 9:16 y 16:9 y un prompt de movimiento. Por ejemplo, para Sobre: *«the camera pushes in slowly; at 2 s the wax seal cracks, the flap opens and a cream card slides out towards the camera»*. La compresión sigue la receta del doc 04 §3 (≤ 2,5 MB, `+faststart`, póster AVIF). Antes de usar el nombre de un modelo de vídeo, comprobadlo: cambian a menudo.

## 7. Recursos que ya existen sin IA (M1)

- Logo redibujado y variantes: doc 17.
- `public/marca/texturas/`: papel de algodón, lino, mármol, terciopelo y grano, periódicas a 2048 px.
- `src/components/marca/LacreVectorial.tsx`: lacre en SVG con iniciales o alianzas, en cualquier tono.
- `public/marca/alianzas-relieve.svg`: mapa de alturas para el lacre 3D de X1.
- `public/marca/referencias/*.png`: dibujos del monograma y del sello, para usar como referencia de los prompts.
