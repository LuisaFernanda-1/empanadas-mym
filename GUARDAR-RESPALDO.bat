@echo off
rem Guarda los datos actuales (productos, panel, etc.) dentro de esta carpeta,
rem en database\respaldo.sql. Hazlo antes de copiar la carpeta a otro computador.
setlocal
cd /d "%~dp0"
set XAMPP=C:\xampp
"%XAMPP%\php\php.exe" server\tools\local.php respaldar "%XAMPP%"
pause
