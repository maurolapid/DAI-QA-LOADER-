@echo off
setlocal
cd /d "%~dp0"

title DAI QA Loader

echo ==============================
echo        DAI QA LOADER
echo ==============================
echo.
echo Verificando dependencias...
echo.

if not exist "package.json" (
  echo ERROR: No se encontro package.json en esta carpeta.
  echo Asegurate de ejecutar el BAT desde la carpeta del proyecto.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias por primera vez...
  call npm install
  if errorlevel 1 goto error
)

if not exist "%USERPROFILE%\AppData\Local\ms-playwright" (
  echo Instalando navegador Chromium de Playwright por primera vez...
  call npx playwright install chromium
  if errorlevel 1 goto error
)

echo.
echo Iniciando loader...
echo.
call npx tsx launcher.ts
if errorlevel 1 goto error

echo.
echo Ejecucion finalizada.
pause
exit /b 0

:error
echo.
echo ERROR: El loader finalizo con error.
echo Copia este mensaje o envia una captura.
echo.
pause
exit /b 1
