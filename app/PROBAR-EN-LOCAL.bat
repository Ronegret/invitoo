@echo off
chcp 65001 >nul
title Invitoo - local (modo demo)
cd /d "%~dp0"

echo.
echo   Invitoo en local, modo demo
echo   ---------------------------
echo   No toca tu Supabase: todo vive en memoria y en .momentos-local
echo.

rem Modo demo: estos valores vacios ganan a los de .env.local en "next dev".
rem Para volver a trabajar contra Supabase, borra .env.development.local
if not exist ".env.development.local" (
  > ".env.development.local" (
    echo # Creado por PROBAR-EN-LOCAL.bat: modo demo sin Supabase.
    echo # Borra este archivo para que "npm run dev" vuelva a usar .env.local
    echo NEXT_PUBLIC_SUPABASE_URL=
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=
    echo SUPABASE_SERVICE_ROLE_KEY=
    echo SUPABASE_DB_URL=
    echo INVITOO_MEMORIA=1
    echo ESTUDIO_CLAVE=demo
    echo NEXT_PUBLIC_SITIO_URL=http://localhost:3100
  )
)

echo   Instalando dependencias (solo tarda la primera vez)...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo   npm install ha fallado. Copia el error y pasamelo.
  pause
  exit /b 1
)

echo.
echo   Abriendo http://localhost:3100 ...
echo   Para parar: cierra esta ventana o pulsa Ctrl+C
echo.
start "" http://localhost:3100
call npx next dev -p 3100
pause
