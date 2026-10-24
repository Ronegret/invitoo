# Brief: la vuelta completa (24-10-2026, tarde)

Rodrigo ha revisado la versión publicada (https://invitoo-one.vercel.app) y pide, literalmente:

1. **Vídeos de apertura SIN novios.** Paisajes bonitos, anillos de boda o algo acorde a cada estilo, romántico, con efectos. Al terminar el vídeo, un **destello** (o un efecto de scroll) y aparece la invitación: «esa es la magia que queremos mostrar».
2. **El cursor de la página va muy lento.**
3. **La cuenta atrás tiene que estar en primera instancia** en todas las invitaciones: es imprescindible.
4. **Que cada invitación se vea bien:** legibilidad y contraste, sobre todo del texto encima de vídeo o foto.
5. **Hay imágenes con novios de 4 brazos.** Hay que revisarlo todo bien.
6. **Revisión como equipo de diseño UX/UI y agencia de marketing y ventas** de este tipo de servicio:
   - la forma de mostrar los móviles tiene que ser más atractiva y moderna;
   - ahora todo va muy lento;
   - hacen falta mejoras importantes en todo.

## Contexto
- Repo `/home/claude/web` (app en `app/`). Lee `app/AGENTS.md` (Next 16).
- Docs de referencia: `docs/11` (reglas), `docs/14` (sistema de diseño), `docs/17` (marca), `docs/22` (integración final: lo que hay y dónde).
- Producción: Vercel, que despliega automáticamente al hacer push a GitHub `Ronegret/invitoo` (clon en `/home/claude/invitoo-gh`). **Los agentes no hacen push ni commit**: integra el coordinador.
- PC de Rodrigo (RTX 5070 Laptop, 8 GB): ComfyUI en `C:\IA\ComfyUI\ComfyUI_windows_portable`, arrancado en `http://127.0.0.1:8188`, con FLUX.2 klein 4B. Generador por lotes: `C:\Users\rodri\Desktop\Invitoo\imagenes-ia\lote-flux.py <encargos.json> <destino>`. Se usa con las herramientas `mcp__remote-devices__plugin_…desktop-commander__*` (start_process, read_process_output) y `device_stage_files` / `device_commit_files`.

## Reglas de todos
- Toca solo tus archivos (ver el reparto). Relee antes de cada Edit y haz ediciones mínimas en los archivos compartidos.
- Usa tu propio distDir y puerto: `NEXT_DIST_DIR=.next-<id> npx next dev -p <puerto>`. Al terminar, para el servidor y quita la línea `.next-<id>` de `tsconfig.json`.
- Validación: `npx tsc --noEmit -p .`, `npx eslint <archivos>` y, al final, `npx next build`. **Ojo: Turbopack falla con Cormorant Garamond si se le pasan pesos sueltos**: úsala variable.
- Mobile first: 360/390/430 px, nada solapado, AA, 17 px como mínimo en las invitaciones, `prefers-reduced-motion`, todo legible sin JS.
- Copy en español, tratando de «vosotros».
- Informe final en español, con lo hecho, los archivos y las capturas en `qa/v4/<id>/`.
