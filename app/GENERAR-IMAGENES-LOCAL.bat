@echo off
REM Invitoo - genera las imagenes de encargos.json GRATIS en este PC con ComfyUI + FLUX.2 klein 4B.
REM 1) Arranca ComfyUI (C:\IA\ARRANCAR-COMFYUI.bat) y espera a que este listo en http://127.0.0.1:8188
REM 2) Doble clic en este archivo. Se puede cortar y relanzar: salta lo ya hecho.
REM Opciones: --solo carta   --max 10   --rehacer   --flujo flux-schnell-fp8   --y-nube
cd /d "%~dp0"
chcp 65001 >nul
where node >nul 2>nul || (echo Falta Node.js: instalalo desde https://nodejs.org & pause & exit /b 1)
if not exist node_modules\sharp (echo Instalando dependencias... & call npm install)
set "INVITOO_COPIAR_A=%USERPROFILE%\Desktop\Invitoo\imagenes-ia"
node herramientas\imagenes\local-comfyui.mjs %*
echo.
echo Imagenes en: %~dp0public\generadas  y copia por categorias en %INVITOO_COPIAR_A%
pause
