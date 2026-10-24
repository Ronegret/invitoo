@echo off
rem ===================================================================
rem  Invitoo - lote de correccion Q1 (24-10-2026)
rem  44 imagenes con defectos x 4 candidatas (semillas distintas) = 176
rem  Copia este .bat y encargos-correccion.json a:
rem     C:\Users\rodri\Desktop\Invitoo\imagenes-ia\
rem  y haz doble clic. Tarda ~30-60 min en la RTX 5070 (4 pasos/imagen).
rem  Salida: imagenes-ia\correccion\<carpeta>\<id>__v1..v4.png
rem  Se puede relanzar: salta las que ya existen.
rem ===================================================================
setlocal
set "BASE=C:\Users\rodri\Desktop\Invitoo\imagenes-ia"
set "COMFY=C:\IA\ComfyUI\ComfyUI_windows_portable"
set "PY=%COMFY%\python_embeded\python.exe"
if not exist "%PY%" set "PY=python"
cd /d "%BASE%"

if not exist "encargos-correccion.json" (
  echo Falta encargos-correccion.json en %BASE%
  pause & exit /b 1
)

rem 1. Arranca ComfyUI si no responde
curl -s -o nul http://127.0.0.1:8188/system_stats
if errorlevel 1 (
  echo Arrancando ComfyUI...
  start "ComfyUI" /min cmd /c "cd /d %COMFY% && .\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build --listen 127.0.0.1 --port 8188 --disable-auto-launch"
  :espera
  timeout /t 5 /nobreak >nul
  curl -s -o nul http://127.0.0.1:8188/system_stats
  if errorlevel 1 goto espera
)

rem 2. Lanza el lote (log en lote-correccion.log)
echo Generando 176 candidatas en %BASE%\correccion ...
"%PY%" lote-flux.py encargos-correccion.json "%BASE%\correccion" > lote-correccion.log 2> lote-correccion-err.log
type lote-correccion.log | findstr /c:"TERMINADO"
echo.
echo Listo. Avisa al equipo: hay que revisar las candidatas una a una
echo (qa/v4/q1/lista-regeneracion.csv) e integrar las buenas.
pause
