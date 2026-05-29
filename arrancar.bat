@echo off
echo =====================================
echo   UBUMonitor Web - Entorno dev
echo =====================================

echo Iniciando Bakcend...
start "Backend" cmd /k "cd /d %~dp0api_rest\moodle-openapi-adapter && run.bat"

echo Iniciando Interfaz ...
start "Frontend" cmd /k "cd /d %~dp0front\ubumonitor-web && npm run dev"

echo.
echo Ambos servicios arrancando en ventanas separadas.
echo Backend  ^>  http://localhost:8080/swagger-ui/index.html
echo Frontend ^>  http://localhost:5173
