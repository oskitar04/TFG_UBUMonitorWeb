@echo off
echo =====================================
echo   UBUMonitor Web - Gateway (build)
echo =====================================

echo Construyendo el front...
pushd "%~dp0front\ubumonitor-web"
call npm run build
popd

echo Iniciando Backend...
start "Backend" cmd /k "cd /d %~dp0api_rest\moodle-openapi-adapter && run.bat"

echo Iniciando Gateway...
start "Gateway" cmd /k "cd /d %~dp0gateway && node server.js"

echo.
echo Backend y Gateway arrancando en ventanas separadas.
echo Backend  ^>  http://localhost:8080/swagger-ui/index.html
echo Gateway  ^>  http://localhost:4000

echo.
echo Esperando a que el backend y el gateway arranquen...
timeout /t 8 /nobreak >nul
start http://localhost:4000
