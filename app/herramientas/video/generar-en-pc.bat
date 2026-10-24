@echo off
rem Invitoo · V1 · lo que queda pendiente en el PC (ComfyUI + RTX 5070 8 GB).
rem 1) fotogramas FLUX.2 klein sin personas para los 29 estilos (≈ 12 s cada uno);
rem 2) descarga de Wan 2.2 TI2V 5B (Apache-2.0, ~18 GB en total) si falta;
rem 3) prueba de la vía A con UN clip y, si tarda ≤ 8 min, el resto.
rem Requisitos: ComfyUI abierto en http://127.0.0.1:8188. Se puede cortar y relanzar: salta lo hecho.
rem Uso: copiar esta carpeta (herramientas\video + imagenes\encargos-video.json) a
rem      C:\Users\rodri\Desktop\Invitoo\video-ia y hacer doble clic.
setlocal
set PY=C:\IA\ComfyUI\ComfyUI_windows_portable\python_embeded\python.exe
set M=C:\IA\ComfyUI\ComfyUI_windows_portable\ComfyUI\models
set HF=https://huggingface.co/Comfy-Org
set AQUI=%~dp0
cd /d "%AQUI%"
if not exist encargos-video.json copy ..\imagenes\encargos-video.json . >nul

echo === 1/3 Fotogramas FLUX.2 klein (fotogramas\^<id^>-v.png y -h.png)
"%PY%" -u fotogramas.py encargos-video.json fotogramas
if errorlevel 1 goto fin

echo === 2/3 Modelos de Wan 2.2 TI2V 5B
if not exist "%M%\vae\wan2.2_vae.safetensors" curl.exe -L -C - --retry 5 -o "%M%\vae\wan2.2_vae.safetensors" %HF%/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/vae/wan2.2_vae.safetensors
curl.exe -L -C - --retry 5 -o "%M%\text_encoders\umt5_xxl_fp8_e4m3fn_scaled.safetensors" %HF%/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors
curl.exe -L -C - --retry 5 -o "%M%\diffusion_models\wan2.2_ti2v_5B_fp16.safetensors" %HF%/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors
echo   (si ComfyUI estaba abierto antes de la descarga, reinicialo para que vea los modelos)
pause

echo === 3/3 Via A: prueba con "tinta" (vertical) y, si va bien, el resto
"%PY%" -u wan_i2v.py encargos-video.json fotogramas wan --solo tinta --orientacion v --limite 480
if errorlevel 3 (
  echo La version a 704x1280 es lenta. Probando a 480x864...
  "%PY%" -u wan_i2v.py encargos-video.json fotogramas wan --solo tinta --orientacion v --limite 480 --baja
  if errorlevel 3 goto lenta
  "%PY%" -u wan_i2v.py encargos-video.json fotogramas wan --baja --limite 100000
  goto fin
)
"%PY%" -u wan_i2v.py encargos-video.json fotogramas wan --limite 100000
goto fin

:lenta
echo Wan es demasiado lento en este PC: nos quedamos con la via B (cine.py) con los fotogramas nuevos.

:fin
echo.
echo Hecho. Fotogramas en "%AQUI%fotogramas", clips en "%AQUI%wan", tiempos en wan\tiempos.json.
echo Siguiente paso (en el contenedor o en WSL/Linux con Python, ffmpeg, numpy, opencv y onnxruntime):
echo   herramientas/video/lote.sh ^<carpeta con id-v.png/id-h.png o id-v.mp4/id-h.mp4^> ^<trabajo^> app/public
pause
