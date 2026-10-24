@echo off
REM Invitoo - genera las imagenes de encargos.json en la nube (Cloudflare gratis o Gemini de pago).
REM Requiere claves en app\.env.local (ver docs\18-imagenes-ia.md).
cd /d "%~dp0"
chcp 65001 >nul
where node >nul 2>nul || (echo Falta Node.js: instalalo desde https://nodejs.org & pause & exit /b 1)
if not exist node_modules\sharp (echo Instalando dependencias... & call npm install)
node herramientas\imagenes\nano-banana.mjs estado
node herramientas\imagenes\nano-banana.mjs lote %*
pause
