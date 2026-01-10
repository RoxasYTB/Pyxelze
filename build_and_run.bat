@echo off
setlocal
set SCRIPT_DIR=%~dp0
set LOGDIR=%SCRIPT_DIR%logs
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
echo Cleaning... > "%LOGDIR%\build.log"
dotnet clean "%SCRIPT_DIR%Pyxelze.csproj" >> "%LOGDIR%\build.log" 2>&1
echo Building... >> "%LOGDIR%\build.log"
dotnet build "%SCRIPT_DIR%Pyxelze.csproj" >> "%LOGDIR%\build.log" 2>&1
if errorlevel 1 (
  echo Build failed. See "%LOGDIR%\build.log"
  exit /b 1
)
echo Running... > "%LOGDIR%\run.log"
dotnet run --project "%SCRIPT_DIR%Pyxelze.csproj" > "%LOGDIR%\run.log" 2>&1
if errorlevel 1 (
  echo Run failed. See "%LOGDIR%\run.log"
  exit /b 1
)
echo Done. Logs saved to "%LOGDIR%\build.log" and "%LOGDIR%\run.log"
endlocal
