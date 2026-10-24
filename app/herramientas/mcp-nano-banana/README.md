# invitoo-imagenes · servidor MCP

Con este servidor, Claude Desktop puede generar y editar las imágenes de Invitoo. Elige el motor según lo que tengas configurado: **ComfyUI local** (gratis, en tu PC), **Cloudflare Workers AI** (gratis hasta 10.000 neurons al día) o **Gemini / Nano Banana Pro** (de pago, la mejor calidad).

| Herramienta | Qué hace |
|---|---|
| `generar_imagen` | Crea una imagen a partir de un prompt, con proporción, referencias, motor y semilla opcionales. |
| `editar_imagen` | Edita una imagen existente con una instrucción («quita la copa», «luz de atardecer»). |
| `variaciones` | Hace N variaciones de un prompt o de una imagen. |
| `lote_encargos` | Genera los encargos de `herramientas/imagenes/encargos.json` y salta los que ya existen. |
| `estado_motores` | Dice qué motores están listos y cuánta cuota gratuita queda hoy. |

Las imágenes se guardan en `app/public/generadas/<id>.png`, con sus versiones AVIF y WebP en varios anchos, y quedan anotadas en `herramientas/imagenes/catalogo.json`.

## Instalación en Claude Desktop (Windows)

1. Instala las dependencias, una sola vez:
   ```bat
   cd C:\ruta\a\web\app
   npm install
   cd herramientas\mcp-nano-banana
   npm install
   ```
2. Abre **Claude Desktop → Settings → Developer → Edit Config**. Se abre `%APPDATA%\Claude\claude_desktop_config.json`. Añade:
   ```json
   {
     "mcpServers": {
       "invitoo-imagenes": {
         "command": "node",
         "args": ["C:\\ruta\\a\\web\\app\\herramientas\\mcp-nano-banana\\servidor.mjs"],
         "env": {
           "GEMINI_API_KEY": "tu-clave-de-gemini",
           "CLOUDFLARE_ACCOUNT_ID": "tu-account-id",
           "CLOUDFLARE_API_TOKEN": "tu-token-workers-ai",
           "INVITOO_MOTORES": "local,cloudflare,gemini"
         }
       }
     }
   }
   ```
   Las variables que no uses se pueden quitar. Si no pones ninguna, el servidor las lee de `app/.env.local`.
3. Reinicia Claude Desktop. Si todo ha ido bien, en el icono de herramientas aparece **invitoo-imagenes**, con sus cinco herramientas.
4. Pruébalo con: «Usa estado_motores» y después «Genera con generar_imagen un bodegón de un sobre de algodón con lacre granate liso sobre lino, 4:5, salida prueba-lacre».

En macOS el archivo de configuración está en `~/Library/Application Support/Claude/claude_desktop_config.json` y las rutas usan `/`.

## Probarlo sin Claude Desktop

```bash
node probar.mjs              # arranca el servidor, lista las herramientas y muestra el estado
node probar.mjs --generar    # intenta UNA imagen con Gemini y enseña el resultado o el error explicado
```

## Errores habituales

- **«429 … cuota 0 del nivel gratuito»**: la clave de Gemini es válida, pero su proyecto no tiene la facturación activada. Actívala en AI Studio (ver `docs/18-imagenes-ia.md` §2.1). El servidor no reintenta.
- **«Cloudflare rechaza el token»**: el token necesita el permiso *Workers AI · Read/Edit*.
- **«ComfyUI no responde»**: arranca `C:\IA\ARRANCAR-COMFYUI.bat` y espera a que cargue.
- Las claves nunca se devuelven ni se escriben en los registros.
