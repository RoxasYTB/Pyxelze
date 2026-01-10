@echo off
REM idempotent installer helper: add installation folder to the current user's PATH
setlocal enableextensions

set "APPDIR=%~dp0"
if "%APPDIR:~-1%"=="\" set "APPDIR=%APPDIR:~0,-1%"

rem Check user PATH in registry and append APPDIR if missing
for /f "tokens=2,* delims=    " %%A in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "UPATH=%%B"
echo %UPATH% | find /I "%APPDIR%" >nul && (
  echo PATH already contains %APPDIR%
  endlocal
  exit /b 0
)

if defined UPATH (
  set "NEWPATH=%UPATH%;%APPDIR%"
  reg add "HKCU\Environment" /v PATH /d "%NEWPATH%" /f >nul
  echo PATH updated for current user.
) else (
  reg add "HKCU\Environment" /v PATH /d "%APPDIR%" /f >nul
  echo PATH initialized with %APPDIR% for current user.
)

endlocal
exit /b 0
