@echo off
rem Doble clic para abrir este emprendimiento en el navegador.
rem Funciona desde cualquier ubicacion (escritorio, USB, otra carpeta...).
setlocal
cd /d "%~dp0"

rem Puerto de este sitio (cada emprendimiento usa uno distinto para abrirlos a la vez)
set PUERTO=8082
set XAMPP=C:\xampp
set PHP=%XAMPP%\php\php.exe

if not exist "%PHP%" (
  echo No se encontro XAMPP en %XAMPP%. Instalalo o cambia la ruta en este archivo.
  pause
  exit /b 1
)

"%PHP%" server\tools\local.php preparar "%XAMPP%"
if errorlevel 1 (
  pause
  exit /b 1
)

echo.
echo  Sitio:  http://localhost:%PUERTO%
echo  Panel:  http://localhost:%PUERTO%/admin
echo  Cierra esta ventana para apagar el sitio.
echo.
start "" "http://localhost:%PUERTO%"
cd server
"%PHP%" -d extension=gd -S localhost:%PUERTO% dev-router.php
